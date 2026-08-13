import { createServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import {
  getAllIssuesOfVolume,
  getIssueDetailsBatch,
  getVolumeDetail,
} from "@/integrations/comicvine/client";
import type { CvIssueDetail, CvPersonCredit, CvSearchIssue } from "@/integrations/comicvine/types";
import { getSupabaseServiceClient } from "@/integrations/supabase/service-client";
import {
  linkCreators,
  resolveSeries,
  upsertCreator,
  upsertIssue,
  upsertPublisher,
  upsertVolume,
  type ServiceClient,
} from "./comicvine";
import {
  deriveRunSegments,
  type RunDerivationIssueInput,
  type RunDerivationSegment,
} from "@/lib/run-derivation";
import type { RelationshipType, Run, RunWithItems, RunWithRelations } from "@/lib/types";
import { ServiceError } from "@/lib/types";
import { unwrap } from "./_utils";
import { requireAuthenticatedUser } from "./_serverUtils";
import { ISSUE_RELATIONS_FRAGMENT } from "./issues";

const RUN_WITH_ITEMS =
  `*, run_items(position, issue:issues(*, ${ISSUE_RELATIONS_FRAGMENT})), run_creators(role, creator:creators(*))` as const;

// `run_relationships` self-references `runs` twice (source and target), so
// each embed needs its FK constraint name to disambiguate which column
// PostgREST should join on — see fk_source_run/fk_target_run in the
// migration. Only used by getRun (the run detail page); the lighter
// listRunsFor* lookups above don't need relationships.
const RUN_WITH_RELATIONS =
  `${RUN_WITH_ITEMS}, outgoing_relationships:run_relationships!fk_source_run(*, target_run:runs!fk_target_run(*)), incoming_relationships:run_relationships!fk_target_run(*, source_run:runs!fk_source_run(*))`;

/** Runs already derived for a volume — issue-scoped, since run_items links
 * to issues, not volumes, directly. Takes an explicit client because this
 * is called both from the browser (the volume page, via the default
 * browser client) and from inside analyzeVolume's server-only handler
 * (which must pass the service client — the browser client depends on
 * `document`/cookies and has no business running server-side, even though
 * these tables happen to be public-read so it would silently limp along
 * unauthenticated rather than fail outright). */
export async function listRunsForVolume(
  volumeId: string,
  client: ServiceClient | typeof supabase = supabase,
): Promise<RunWithItems[]> {
  const issueRows = unwrap(
    await client.from("issues").select("id").eq("volume_id", volumeId),
    "Failed to load volume issues",
  );
  const issueIds = issueRows.map((r) => r.id);
  if (issueIds.length === 0) return [];

  const runItemRows = unwrap(
    await client.from("run_items").select("run_id").in("issue_id", issueIds),
    "Failed to load run items",
  );
  const runIds = [...new Set(runItemRows.map((r) => r.run_id))];
  if (runIds.length === 0) return [];

  const runs = unwrap(
    await client
      .from("runs")
      .select(RUN_WITH_ITEMS)
      .in("id", runIds)
      .order("start_year", { ascending: true }),
    "Failed to load runs",
  );
  return runs as unknown as RunWithItems[];
}

/** Runs a specific issue belongs to — normally 0 or 1 with the current
 * one-writer-sequence-per-volume algorithm, but not assumed to be exactly
 * one (a future relationship/cross-volume model could change that). */
export async function listRunsForIssue(issueId: string): Promise<RunWithItems[]> {
  const runItemRows = unwrap(
    await supabase.from("run_items").select("run_id").eq("issue_id", issueId),
    "Failed to load run items",
  );
  const runIds = [...new Set(runItemRows.map((r) => r.run_id))];
  if (runIds.length === 0) return [];

  const runs = unwrap(
    await supabase
      .from("runs")
      .select(RUN_WITH_ITEMS)
      .in("id", runIds)
      .order("start_year", { ascending: true }),
    "Failed to load runs",
  );
  return runs as unknown as RunWithItems[];
}

// Only what run derivation actually reads off a "detail" — issue number,
// a date, and credits. Narrower than the full CvIssueDetail on purpose:
// an already-known-locally issue (see loadAlreadyKnownIssues) doesn't
// have a real cover image/volume summary/etc. to offer without another
// ComicVine call — which is exactly the call this is built to skip — so
// this type only promises what can always be reconstructed from either
// source (a fresh CV fetch, or the local DB).
type IssueSequenceDetail = Pick<CvIssueDetail, "issue_number" | "store_date" | "cover_date" | "person_credits">;

interface ImportedIssue {
  localIssueId: string;
  detail: IssueSequenceDetail;
}

// Structural (not IssueSequenceDetail specifically) so this also works
// directly on raw CvSearchIssue objects — both shapes happen to carry the
// same two date fields, and reusing this avoids a second, only-slightly-
// different date-key helper for "which of these raw search results is
// the volume's actual latest issue" (see rangeTouchesLatest below).
export function issueDateKey(detail: { store_date: string | null; cover_date: string | null }): string {
  return detail.store_date ?? detail.cover_date ?? "";
}

// A volume "might still get more issues" if its most recent one shipped
// recently — the algorithm can't know whether a short recent segment is a
// permanent handoff or a fill-in until enough future issues confirm it
// either way, so it stays draft regardless of how it looks right now.
const ONGOING_THRESHOLD_DAYS = 120;

function isVolumeOngoing(details: IssueSequenceDetail[]): boolean {
  const last = details[details.length - 1];
  const dateStr = last ? issueDateKey(last) : "";
  if (!dateStr) return false;
  const days = (Date.now() - new Date(dateStr).getTime()) / 86_400_000;
  return days < ONGOING_THRESHOLD_DAYS;
}

/** Issues from `rawIssues` that already exist locally *with credits
 * linked* — reconstructed from local data instead of fetched fresh. This
 * is the actual expensive step in analysis: one ComicVine call per issue,
 * previously fired unconditionally even for issues already imported (via
 * search/barcode/an earlier partial analysis) — upsertIssue would then
 * just discard that fetch's credits since isNew is false. Skipping the
 * fetch entirely for known issues is what makes analyzing a volume you've
 * been importing from piecemeal for months, one comic at a time, cheap
 * instead of re-paying for the whole thing every time. An issue with no
 * `issue_creators` rows yet (e.g. imported through a path that failed
 * partway) is deliberately NOT treated as known — still needs a real
 * fetch to get real credits, not an empty one. */
async function loadAlreadyKnownIssues(
  client: ServiceClient,
  rawIssues: CvSearchIssue[],
): Promise<Map<number, ImportedIssue>> {
  const cvIds = rawIssues.map((i) => i.id);
  const known = new Map<number, ImportedIssue>();
  if (cvIds.length === 0) return known;

  const localIssues = unwrap(
    await client
      .from("issues")
      .select(
        "id, comicvine_id, issue_number, release_date, issue_creators(role, creator:creators(comicvine_id, first_name, last_name))",
      )
      .in("comicvine_id", cvIds),
    "Failed to check locally-known issues",
  );

  for (const row of localIssues) {
    if (row.comicvine_id == null || row.issue_creators.length === 0) continue;
    const person_credits: CvPersonCredit[] = row.issue_creators
      .filter((ic) => ic.creator?.comicvine_id != null)
      .map((ic) => ({
        id: ic.creator!.comicvine_id!,
        name: [ic.creator!.first_name, ic.creator!.last_name].filter(Boolean).join(" ").trim() || "Unknown",
        role: ic.role,
      }));
    known.set(row.comicvine_id, {
      localIssueId: row.id,
      detail: {
        issue_number: row.issue_number,
        store_date: row.release_date,
        cover_date: null,
        person_credits,
      },
    });
  }
  return known;
}

async function createRunFromSegment(
  client: ServiceClient,
  segment: RunDerivationSegment,
  volumeName: string,
  issuesById: Map<string, ImportedIssue>,
  writerNameByKey: Map<string, string>,
): Promise<string> {
  const segmentIssues = segment.issueIds
    .map((id) => issuesById.get(id))
    .filter((x): x is ImportedIssue => !!x);
  const first = segmentIssues[0];
  const last = segmentIssues[segmentIssues.length - 1];
  const firstNum = first?.detail.issue_number ?? "?";
  const lastNum = last?.detail.issue_number ?? "?";
  const writerName = segment.writerKey ? writerNameByKey.get(segment.writerKey) : undefined;

  const name = writerName
    ? `${writerName}'s ${volumeName} (#${firstNum}-#${lastNum})`
    : `${volumeName} #${firstNum}-#${lastNum}`;

  const yearOf = (dateStr: string): number | null => {
    const year = Number(dateStr.slice(0, 4));
    return Number.isFinite(year) && year > 0 ? year : null;
  };
  const startYear = first ? yearOf(issueDateKey(first.detail)) : null;
  const endYear = last ? yearOf(issueDateKey(last.detail)) : null;

  const run = unwrap<{ id: string }>(
    await client
      .from("runs")
      .insert({
        name,
        type: "creative_run",
        status: segment.status,
        confidence: segment.confidence,
        start_year: startYear,
        end_year: endYear,
        verified_at: segment.status === "verified" ? new Date().toISOString() : null,
      })
      .select("id")
      .single(),
    "Failed to create run",
  );

  const itemRows = segmentIssues.map((issue, index) => ({
    run_id: run.id,
    issue_id: issue.localIssueId,
    position: index + 1,
  }));
  const { error: itemsError } = await client.from("run_items").insert(itemRows);
  if (itemsError) {
    throw new ServiceError("Failed to create run items", { cause: itemsError });
  }

  if (segment.writerKey) {
    const creatorId = await upsertCreator(client, {
      id: Number(segment.writerKey),
      name: writerName ?? "Unknown",
    });
    const { error: creatorError } = await client
      .from("run_creators")
      .insert({ run_id: run.id, creator_id: creatorId, role: "writer" });
    if (creatorError) {
      throw new ServiceError("Failed to link run creator", { cause: creatorError });
    }
  }

  return run.id;
}

/** Appends newly-derived issues onto an already-existing run instead of
 * creating a new one — used when a recheck finds new issues credited to
 * the same writer already on the volume's most recent run, so #46-50
 * showing up later reads as that run continuing, not a second disconnected
 * run that happens to start with the same writer. */
async function appendToRun(
  client: ServiceClient,
  run: RunWithItems,
  segment: RunDerivationSegment,
  issuesById: Map<string, ImportedIssue>,
): Promise<void> {
  const segmentIssues = segment.issueIds
    .map((id) => issuesById.get(id))
    .filter((x): x is ImportedIssue => !!x);
  const last = segmentIssues[segmentIssues.length - 1];
  const yearOf = (dateStr: string): number | null => {
    const year = Number(dateStr.slice(0, 4));
    return Number.isFinite(year) && year > 0 ? year : null;
  };

  const startPosition = run.run_items.length + 1;
  const itemRows = segmentIssues.map((issue, index) => ({
    run_id: run.id,
    issue_id: issue.localIssueId,
    position: startPosition + index,
  }));
  const { error: itemsError } = await client.from("run_items").insert(itemRows);
  if (itemsError) {
    throw new ServiceError("Failed to extend run", { cause: itemsError });
  }

  const { error: updateError } = await client
    .from("runs")
    .update({
      end_year: last ? yearOf(issueDateKey(last.detail)) : run.end_year,
      status: segment.status,
      confidence: segment.confidence,
      verified_at: segment.status === "verified" ? new Date().toISOString() : null,
    })
    .eq("id", run.id);
  if (updateError) {
    throw new ServiceError("Failed to update run", { cause: updateError });
  }
}

export interface AnalyzeVolumeResult {
  volumeId: string;
  createdRuns: number;
  totalIssues: number;
  alreadyAnalyzed: boolean;
  /** How many issues in this pass skipped a fresh ComicVine fetch because
   * they were already known locally with credits linked. Surfaced so the
   * savings from building a volume up incrementally (search/barcode
   * imports over time, or a previous ranged analysis) are actually
   * visible, not just theoretical. */
  skippedKnownIssues: number;
}

export function parseIssueNumberForRange(n: string | null): number | null {
  if (n == null) return null;
  const num = Number(n);
  return Number.isFinite(num) ? num : null;
}

/** Slices `issues` down to an inclusive `{from, to}` window by issue
 * number — `from`/`to` reversed is normalized, not an error, since a
 * volume page's range inputs don't enforce order. Issues whose number
 * doesn't parse (a variant like "1AU") are excluded from a ranged pass;
 * they're still included when there's no range at all. */
export function filterIssuesByRange<T extends { issue_number: string | null }>(
  issues: T[],
  range: { from: number; to: number } | undefined,
): T[] {
  if (!range) return issues;
  const [lo, hi] = range.from <= range.to ? [range.from, range.to] : [range.to, range.from];
  return issues.filter((i) => {
    const num = parseIssueNumberForRange(i.issue_number);
    return num != null && num >= lo && num <= hi;
  });
}

/** Whether a (possibly ranged) analysis pass reaches the volume's actual
 * newest issue — the "is this volume still ongoing" flag only makes sense
 * for a pass that does, since an earlier chunk has a firm boundary
 * regardless of how recently *it* shipped. Compared by date string, not
 * array position, since a raw issue-list fetch isn't guaranteed to come
 * back in date order. No range at all trivially touches the latest issue. */
export function computeRangeTouchesLatest(
  allRawIssues: Array<{ store_date: string | null; cover_date: string | null }>,
  rangedIssues: Array<{ store_date: string | null; cover_date: string | null }>,
  hasRange: boolean,
): boolean {
  if (!hasRange) return true;
  const latestDateKey = allRawIssues.reduce(
    (max, i) => (issueDateKey(i) > max ? issueDateKey(i) : max),
    "",
  );
  return latestDateKey !== "" && rangedIssues.some((i) => issueDateKey(i) === latestDateKey);
}

/** The expensive, explicit, user-triggered pipeline: import every issue of
 * a volume (with credits), derive run segments from the writer sequence,
 * and persist them as runs. Up to one ComicVine call per issue that isn't
 * already known locally — see docs/comicvine-and-runs.md before changing
 * the thresholds.
 *
 * `issueRange`, when given, scopes the whole pass to just that slice
 * (inclusive) instead of the full volume — the point being a 500-issue
 * run doesn't have to be analyzed all at once; #1-100 today and #101-200
 * next week both work, and each pass only pays for whatever wasn't
 * already known going in.
 *
 * A whole-volume request (no range) with existing runs is a *recheck*, not
 * a refusal: it diffs ComicVine's current issue list against what's already
 * covered by a run_item and only processes genuinely new issues. If the
 * first new segment shares a writer with the run covering the volume's
 * most recent previously-known issue, it's appended onto that run
 * (appendToRun) instead of starting a disconnected new one. Truly nothing
 * new still reports `alreadyAnalyzed`.
 *
 * `fullRescan`, when true, deletes every existing run for the volume first
 * (cascades to their run_items/run_creators, any run_relationships to
 * other volumes, and anyone's favorite/verification of them — a real,
 * user-facing cost, which is why the UI gates this behind its own
 * confirmation, separate from the normal recheck) and re-derives from
 * scratch, same as a first-ever analysis. */
export const analyzeVolume = createServerFn({ method: "POST" })
  .validator(
    (input: { volumeDetailUrl: string; issueRange?: { from: number; to: number }; fullRescan?: boolean }) =>
      input,
  )
  .handler(async ({ data }): Promise<AnalyzeVolumeResult> => {
    await requireAuthenticatedUser();
    const client = getSupabaseServiceClient();

    const volumeDetail = await getVolumeDetail(data.volumeDetailUrl);
    if (!volumeDetail.publisher) {
      throw new ServiceError("ComicVine volume has no publisher");
    }

    const publisherId = await upsertPublisher(client, volumeDetail.publisher);
    const seriesId = await resolveSeries(client, publisherId, volumeDetail.name);
    const volumeId = await upsertVolume(client, volumeDetail, seriesId, publisherId);

    const runsBeforeRescan = await listRunsForVolume(volumeId, client);
    if (data.fullRescan && runsBeforeRescan.length > 0) {
      const { error } = await client
        .from("runs")
        .delete()
        .in("id", runsBeforeRescan.map((r) => r.id));
      if (error) {
        throw new ServiceError("Failed to clear existing runs", { cause: error });
      }
    }
    const existingRuns = data.fullRescan ? [] : runsBeforeRescan;

    const allRawIssues = await getAllIssuesOfVolume(volumeDetail.id);

    let rawIssues: CvSearchIssue[];
    let appendTarget: RunWithItems | null = null;

    if (data.issueRange) {
      rawIssues = filterIssuesByRange(allRawIssues, data.issueRange);
    } else if (existingRuns.length > 0) {
      const coveredCvIds = new Set(
        existingRuns.flatMap((r) =>
          r.run_items.map((ri) => ri.issue?.comicvine_id).filter((id): id is number => id != null),
        ),
      );
      rawIssues = allRawIssues.filter((i) => !coveredCvIds.has(i.id));
      if (rawIssues.length === 0) {
        return {
          volumeId,
          createdRuns: 0,
          totalIssues: existingRuns.reduce((sum, r) => sum + r.run_items.length, 0),
          alreadyAnalyzed: true,
          skippedKnownIssues: 0,
        };
      }
      const latestIssueDate = (run: RunWithItems) =>
        run.run_items.reduce((max, ri) => {
          const date = ri.issue?.release_date ?? "";
          return date > max ? date : max;
        }, "");
      appendTarget = existingRuns.reduce((latest, r) =>
        latestIssueDate(r) > latestIssueDate(latest) ? r : latest,
      );
    } else {
      rawIssues = allRawIssues;
    }

    if (rawIssues.length === 0) {
      return { volumeId, createdRuns: 0, totalIssues: 0, alreadyAnalyzed: false, skippedKnownIssues: 0 };
    }

    const alreadyKnown = await loadAlreadyKnownIssues(client, rawIssues);
    const issuesNeedingFetch = rawIssues.filter((i) => !alreadyKnown.has(i.id));

    const freshDetails =
      issuesNeedingFetch.length > 0 ? await getIssueDetailsBatch(issuesNeedingFetch) : [];

    const freshlyImported = await Promise.all(
      freshDetails.map(async (detail): Promise<ImportedIssue> => {
        const issue = await upsertIssue(client, detail, volumeId, volumeDetail.name);
        if (issue.isNew) await linkCreators(client, issue.id, detail.person_credits);
        return { localIssueId: issue.id, detail };
      }),
    );

    const imported = [...alreadyKnown.values(), ...freshlyImported].sort((a, b) =>
      issueDateKey(a.detail).localeCompare(issueDateKey(b.detail)),
    );

    const issuesById = new Map(imported.map((i) => [i.localIssueId, i]));
    const writerNameByKey = new Map<string, string>();
    const sequence: RunDerivationIssueInput[] = imported.map(({ localIssueId, detail }) => {
      const writer = detail.person_credits.find((c) => c.role.toLowerCase().includes("writer"));
      if (writer) writerNameByKey.set(String(writer.id), writer.name);
      return { issueId: localIssueId, writerKey: writer ? String(writer.id) : null };
    });

    const isPartialPass = !!data.issueRange || !!appendTarget;
    const rangeTouchesLatest = computeRangeTouchesLatest(allRawIssues, rawIssues, isPartialPass);
    const segments = deriveRunSegments(sequence, {
      isOngoing: rangeTouchesLatest && isVolumeOngoing(imported.map((i) => i.detail)),
    });

    let createdRuns = 0;
    for (const [index, segment] of segments.entries()) {
      if (segment.issueIds.length === 0) continue;
      const targetWriterCvId = appendTarget?.run_creators.find((rc) => rc.role === "writer")?.creator?.comicvine_id;
      const continuesTarget =
        index === 0 && appendTarget && segment.writerKey != null && targetWriterCvId != null &&
        segment.writerKey === String(targetWriterCvId);
      if (continuesTarget) {
        await appendToRun(client, appendTarget!, segment, issuesById);
      } else {
        await createRunFromSegment(client, segment, volumeDetail.name, issuesById, writerNameByKey);
        createdRuns++;
      }
    }

    return {
      volumeId,
      createdRuns,
      totalIssues: imported.length,
      alreadyAnalyzed: false,
      skippedKnownIssues: alreadyKnown.size,
    };
  });

// ---------- Existing single-run lookups ----------

export async function getRun(id: string): Promise<RunWithRelations | null> {
  const result = await supabase
    .from("runs")
    .select(RUN_WITH_RELATIONS)
    .eq("id", id)
    .maybeSingle();
  if (result.error) {
    throw new ServiceError("Failed to load run", { cause: result.error });
  }
  return result.data as unknown as RunWithRelations | null;
}

// ---------- Cross-volume run relationships ----------
// Manual/user-driven, not derived — see "Relationship model" in
// docs/comicvine-and-runs.md. Storage convention: relationship reads as
// "source [relationship] target" from the older/first-linked run's point
// of view (e.g. source=continuation=>target means target continues
// source); the run detail page picks display labels for each direction.

/** Runs matching `query` by name, for the "link this run to…" picker —
 * excludes the run being linked (self-relationships are also blocked by a
 * DB check constraint, but filtering here keeps it out of the results at
 * all rather than letting the user pick it and hit an error). */
export async function searchRunsForLinking(query: string, excludeRunId: string): Promise<Run[]> {
  const q = query.trim();
  if (!q) return [];
  return unwrap(
    await supabase
      .from("runs")
      .select("*")
      .ilike("name", `%${q}%`)
      .neq("id", excludeRunId)
      .limit(10),
    "Failed to search runs",
  );
}

// Both of the following are server functions, not plain browser-client
// calls like the rest of this section — `run_relationships` (and
// runs/run_items/run_creators generally) has no per-user ownership column,
// so unlike user_comics/lists/favorites there's no RLS check that could
// scope a direct insert/delete to "your own" row. Routing through
// requireAuthenticatedUser() here is what actually gates these, now that
// the matching RLS policies were locked to service-role-only (see the
// "lock down run write policies" migration) — a plain authenticated
// browser client no longer has table-level write access at all.

export const createRunRelationship = createServerFn({ method: "POST" })
  .validator((input: { sourceRunId: string; targetRunId: string; relationship: RelationshipType }) => input)
  .handler(async ({ data }): Promise<void> => {
    await requireAuthenticatedUser();
    const client = getSupabaseServiceClient();
    const { error } = await client
      .from("run_relationships")
      .insert({ source_run_id: data.sourceRunId, target_run_id: data.targetRunId, relationship: data.relationship });
    // 23505: this exact (source, target, relationship) triple is already
    // linked — not an error from the caller's point of view, same pattern
    // as list_items' duplicate-add handling.
    if (error && error.code !== "23505") {
      throw new ServiceError("Failed to link runs", { cause: error });
    }
  });

export const deleteRunRelationship = createServerFn({ method: "POST" })
  .validator((input: { id: string }) => input)
  .handler(async ({ data }): Promise<void> => {
    await requireAuthenticatedUser();
    const client = getSupabaseServiceClient();
    const { error } = await client.from("run_relationships").delete().eq("id", data.id);
    if (error) {
      throw new ServiceError("Failed to remove run relationship", { cause: error });
    }
  });
