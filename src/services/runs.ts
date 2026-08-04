import { createServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import {
  getAllIssuesOfVolume,
  getIssueDetailsBatch,
  getVolumeDetail,
} from "@/integrations/comicvine/client";
import type { CvIssueDetail } from "@/integrations/comicvine/types";
import { getSupabaseServerClient } from "@/integrations/supabase/server-client";
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
import type { Run, RunWithItems } from "@/lib/types";
import { ServiceError } from "@/lib/types";
import { unwrap } from "./_utils";

const RUN_WITH_ITEMS =
  "*, run_items(position, issue:issues(*, volume:volumes(*, series:series(*, publisher:publishers(*))), issue_creators(role, creator:creators(*)))), run_creators(role, creator:creators(*))" as const;

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

async function requireAuthenticatedUser(): Promise<void> {
  const server = getSupabaseServerClient();
  const { data, error } = await server.auth.getUser();
  if (error || !data.user) {
    throw new ServiceError("Not authenticated", { code: "UNAUTHENTICATED" });
  }
}

interface ImportedIssue {
  localIssueId: string;
  detail: CvIssueDetail;
}

function issueDateKey(detail: CvIssueDetail): string {
  return detail.store_date ?? detail.cover_date ?? "";
}

// A volume "might still get more issues" if its most recent one shipped
// recently — the algorithm can't know whether a short recent segment is a
// permanent handoff or a fill-in until enough future issues confirm it
// either way, so it stays draft regardless of how it looks right now.
const ONGOING_THRESHOLD_DAYS = 120;

function isVolumeOngoing(details: CvIssueDetail[]): boolean {
  const last = details[details.length - 1];
  const dateStr = last ? issueDateKey(last) : "";
  if (!dateStr) return false;
  const days = (Date.now() - new Date(dateStr).getTime()) / 86_400_000;
  return days < ONGOING_THRESHOLD_DAYS;
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

export interface AnalyzeVolumeResult {
  volumeId: string;
  createdRuns: number;
  totalIssues: number;
  alreadyAnalyzed: boolean;
}

/** The expensive, explicit, user-triggered pipeline: import every issue of
 * a volume (with credits), derive run segments from the writer sequence,
 * and persist them as runs. One ComicVine call per issue in the volume —
 * see docs/comicvine-and-runs.md before changing the thresholds. */
export const analyzeVolume = createServerFn({ method: "POST" })
  .validator((input: { volumeDetailUrl: string }) => input)
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

    const existingRuns = await listRunsForVolume(volumeId, client);
    if (existingRuns.length > 0) {
      return {
        volumeId,
        createdRuns: 0,
        totalIssues: existingRuns.reduce((sum, r) => sum + r.run_items.length, 0),
        alreadyAnalyzed: true,
      };
    }

    const rawIssues = await getAllIssuesOfVolume(volumeDetail.id);
    if (rawIssues.length === 0) {
      return { volumeId, createdRuns: 0, totalIssues: 0, alreadyAnalyzed: false };
    }

    const details = await getIssueDetailsBatch(rawIssues);
    details.sort((a, b) => issueDateKey(a).localeCompare(issueDateKey(b)));

    const imported = await Promise.all(
      details.map(async (detail): Promise<ImportedIssue> => {
        const issue = await upsertIssue(client, detail, volumeId, volumeDetail.name);
        if (issue.isNew) await linkCreators(client, issue.id, detail.person_credits);
        return { localIssueId: issue.id, detail };
      }),
    );

    const issuesById = new Map(imported.map((i) => [i.localIssueId, i]));
    const writerNameByKey = new Map<string, string>();
    const sequence: RunDerivationIssueInput[] = imported.map(({ localIssueId, detail }) => {
      const writer = detail.person_credits.find((c) => c.role.toLowerCase().includes("writer"));
      if (writer) writerNameByKey.set(String(writer.id), writer.name);
      return { issueId: localIssueId, writerKey: writer ? String(writer.id) : null };
    });

    const segments = deriveRunSegments(sequence, { isOngoing: isVolumeOngoing(details) });

    let createdRuns = 0;
    for (const segment of segments) {
      if (segment.issueIds.length === 0) continue;
      await createRunFromSegment(client, segment, volumeDetail.name, issuesById, writerNameByKey);
      createdRuns++;
    }

    return { volumeId, createdRuns, totalIssues: imported.length, alreadyAnalyzed: false };
  });

// ---------- Existing single-run lookups ----------

export async function listRunsBySeries(_seriesId: string): Promise<Run[]> {
  // The `runs` table has no direct series_id column in the current schema;
  // series ↔ run association lives via run_items → issues → volumes.
  // Not needed yet — volume-scoped listing (listRunsForVolume) covers the
  // current UI's needs.
  return [];
}

export async function getRun(id: string): Promise<RunWithItems | null> {
  const result = await supabase
    .from("runs")
    .select(RUN_WITH_ITEMS)
    .eq("id", id)
    .maybeSingle();
  if (result.error) {
    throw new ServiceError("Failed to load run", { cause: result.error });
  }
  return result.data as unknown as RunWithItems | null;
}
