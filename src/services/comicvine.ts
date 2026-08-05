import { createServerFn } from "@tanstack/react-start";
import {
  getIssueDetail,
  getRecentIssues,
  getVolumeDetail,
  sampleIssuesFromVolumes,
  searchIssuesAndVolumes,
  INITIAL_ISSUES_PER_VOLUME,
  type ComicVineIssueSearchResult,
  type CvRecentIssue,
} from "@/integrations/comicvine/client";
import type {
  CvIssueDetail,
  CvPersonCredit,
  CvPublisherSummary,
  CvSearchIssue,
  CvVolumeDetail,
} from "@/integrations/comicvine/types";
import { getSupabaseServerClient } from "@/integrations/supabase/server-client";
import { getSupabaseServiceClient } from "@/integrations/supabase/service-client";
import { ServiceError } from "@/lib/types";
import { hashCoverImage } from "./coverHash";

export type ComicVineSearchResults = ComicVineIssueSearchResult;

// Server functions are their own HTTP endpoints, independent of any route's
// beforeLoad guard — reachable directly even for a route the guard would
// otherwise protect. Every function below hits the CV rate limit and the
// import path bypasses RLS via the service-role client, so each checks the
// caller's session itself rather than relying on _shell's route guard.
async function requireAuthenticatedUser(): Promise<void> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    throw new ServiceError("Not authenticated", { code: "UNAUTHENTICATED" });
  }
}

export const searchComicVine = createServerFn({ method: "GET" })
  .validator((query: string) => query)
  .handler(async ({ data: query }): Promise<ComicVineSearchResults> => {
    await requireAuthenticatedUser();
    const trimmed = query.trim();
    if (!trimmed) return { issues: [], volumes: [], sampledVolumeIds: [], nextOffset: 0 };
    return searchIssuesAndVolumes(trimmed);
  });

export interface LoadMoreResult {
  issues: CvSearchIssue[];
  nextOffset: number;
}

/** Pages further into the same matched volumes a prior search already
 * found — see docs on ComicVineIssueSearchResult.sampledVolumeIds. */
export const loadMoreComicVineIssues = createServerFn({ method: "GET" })
  .validator((input: { volumeIds: number[]; offset: number }) => input)
  .handler(async ({ data }): Promise<LoadMoreResult> => {
    await requireAuthenticatedUser();
    const issues = await sampleIssuesFromVolumes(
      data.volumeIds,
      data.offset,
      INITIAL_ISSUES_PER_VOLUME,
    );
    return { issues, nextOffset: data.offset + INITIAL_ISSUES_PER_VOLUME };
  });

const NEW_ARRIVALS_WINDOW_DAYS = 7;
const NEW_ARRIVALS_LIMIT = 42;

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Issues from the last week, from the allowed publisher list only — see
 * NEW_ARRIVALS_PUBLISHERS in the client for why an allowlist rather than
 * the search page's denylist. */
export const getNewArrivals = createServerFn({ method: "GET" }).handler(
  async (): Promise<CvRecentIssue[]> => {
    await requireAuthenticatedUser();
    const end = new Date();
    const start = new Date(end.getTime() - NEW_ARRIVALS_WINDOW_DAYS * 86_400_000);
    return getRecentIssues(isoDate(start), isoDate(end), NEW_ARRIVALS_LIMIT);
  },
);

// ---------- Import cascade (Publisher -> Series -> Volume -> Issue -> Creators) ----------
// Series matching is normalized-name-only (not publisher-scoped) — see
// docs/comicvine-and-runs.md for why. Everything else here is a
// straightforward upsert-by-comicvine_id.

function normalizeSeriesName(name: string): string {
  return name
    .toLowerCase()
    .replace(/^the\s+/, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** CV gives a single "First Last" string; split naively (lossy for edge
 * cases like suffixes or single-name pseudonyms — raw name is kept in
 * external_metadata as the source of record). */
function splitPersonName(name: string): {
  first_name: string | null;
  last_name: string | null;
} {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { first_name: null, last_name: null };
  if (parts.length === 1) return { first_name: parts[0], last_name: null };
  return {
    first_name: parts.slice(0, -1).join(" "),
    last_name: parts[parts.length - 1],
  };
}

function parseIssueNumber(n: string | null): number | null {
  if (n == null) return null;
  const num = Number(n);
  return Number.isFinite(num) ? num : null;
}

export type ServiceClient = ReturnType<typeof getSupabaseServiceClient>;

export async function upsertPublisher(
  supabase: ServiceClient,
  cv: CvPublisherSummary,
): Promise<string> {
  const byCvId = await supabase
    .from("publishers")
    .select("id")
    .eq("comicvine_id", cv.id)
    .maybeSingle();
  if (byCvId.data) return byCvId.data.id;

  const byName = await supabase
    .from("publishers")
    .select("id, comicvine_id")
    .eq("name", cv.name)
    .maybeSingle();
  if (byName.data) {
    if (!byName.data.comicvine_id) {
      await supabase
        .from("publishers")
        .update({
          comicvine_id: cv.id,
          api_source: "comicvine",
          synced_at: new Date().toISOString(),
        })
        .eq("id", byName.data.id);
    }
    return byName.data.id;
  }

  const inserted = await supabase
    .from("publishers")
    .insert({
      name: cv.name,
      comicvine_id: cv.id,
      api_source: "comicvine",
      synced_at: new Date().toISOString(),
    })
    .select("id")
    .single();
  if (inserted.error || !inserted.data) {
    throw new ServiceError("Failed to create publisher", {
      cause: inserted.error,
    });
  }
  return inserted.data.id;
}

export async function resolveSeries(
  supabase: ServiceClient,
  publisherId: string,
  volumeName: string,
): Promise<string> {
  const normalized = normalizeSeriesName(volumeName);

  const existing = await supabase
    .from("series")
    .select("id")
    .eq("normalized_name", normalized)
    .maybeSingle();
  if (existing.data) return existing.data.id;

  const inserted = await supabase
    .from("series")
    .insert({
      name: volumeName,
      publisher_id: publisherId,
      normalized_name: normalized,
    })
    .select("id")
    .single();
  if (inserted.error || !inserted.data) {
    throw new ServiceError("Failed to create series", {
      cause: inserted.error,
    });
  }
  return inserted.data.id;
}

export async function upsertVolume(
  supabase: ServiceClient,
  cv: CvVolumeDetail,
  seriesId: string,
  publisherId: string,
): Promise<string> {
  const existing = await supabase
    .from("volumes")
    .select("id")
    .eq("comicvine_id", cv.id)
    .maybeSingle();
  if (existing.data) return existing.data.id;

  const inserted = await supabase
    .from("volumes")
    .insert({
      name: cv.name,
      series_id: seriesId,
      publisher_id: publisherId,
      start_year: cv.start_year ? Number(cv.start_year) : null,
      cover_url: cv.image?.medium_url ?? null,
      comicvine_id: cv.id,
      api_source: "comicvine",
      synced_at: new Date().toISOString(),
    })
    .select("id")
    .single();
  if (inserted.error || !inserted.data) {
    throw new ServiceError("Failed to create volume", {
      cause: inserted.error,
    });
  }
  return inserted.data.id;
}

export async function upsertIssue(
  supabase: ServiceClient,
  cv: CvIssueDetail,
  volumeId: string,
  volumeName: string,
): Promise<{ id: string; isNew: boolean }> {
  const existing = await supabase
    .from("issues")
    .select("id")
    .eq("comicvine_id", cv.id)
    .maybeSingle();
  if (existing.data) return { id: existing.data.id, isNew: false };

  const title = cv.name?.trim() || `${volumeName} #${cv.issue_number ?? "?"}`;
  const coverUrl = cv.image?.medium_url ?? null;
  const inserted = await supabase
    .from("issues")
    .insert({
      title,
      issue_number: cv.issue_number,
      release_date: cv.store_date ?? cv.cover_date,
      cover_url: coverUrl,
      volume_id: volumeId,
      comicvine_id: cv.id,
      api_source: "comicvine",
      synced_at: new Date().toISOString(),
      sort_number: parseIssueNumber(cv.issue_number),
    })
    .select("id")
    .single();
  if (inserted.error || !inserted.data) {
    throw new ServiceError("Failed to create issue", {
      cause: inserted.error,
    });
  }

  if (coverUrl) {
    await hashNewCover(supabase, inserted.data.id, coverUrl);
  }

  return { id: inserted.data.id, isNew: true };
}

/** Hashes and stores a newly-imported issue's cover as it comes in, rather
 * than relying on someone remembering to run a separate maintenance step —
 * covers stays complete going forward with zero user action. Best-effort:
 * a hash failure (bad image, transient network blip) must never break the
 * actual issue import, which is what the caller is really here for. */
async function hashNewCover(
  supabase: ServiceClient,
  issueId: string,
  coverUrl: string,
): Promise<void> {
  try {
    const response = await fetch(coverUrl);
    if (!response.ok) return;
    const buffer = Buffer.from(await response.arrayBuffer());
    const hash = await hashCoverImage(buffer);
    const { error } = await supabase
      .from("covers")
      .insert({ issue_id: issueId, image_hash: hash });
    if (error) console.error("Failed to store cover hash for issue", issueId, error);
  } catch (error) {
    console.error("Failed to hash cover for issue", issueId, error);
  }
}

export async function upsertCreator(
  supabase: ServiceClient,
  cv: { id: number; name: string },
): Promise<string> {
  // Atomic upsert, not select-then-insert: run derivation imports many
  // issues in parallel, and issues sharing the same writer (the common
  // case) would otherwise race — both see "doesn't exist yet" and both
  // try to insert, and the second fails on the comicvine_id unique
  // constraint. onConflict makes this safe under concurrency.
  const { first_name, last_name } = splitPersonName(cv.name);
  const upserted = await supabase
    .from("creators")
    .upsert(
      {
        first_name,
        last_name,
        comicvine_id: cv.id,
        api_source: "comicvine",
        synced_at: new Date().toISOString(),
        external_metadata: { comicvine_name: cv.name },
      },
      { onConflict: "comicvine_id" },
    )
    .select("id")
    .single();
  if (upserted.error || !upserted.data) {
    throw new ServiceError("Failed to upsert creator", {
      cause: upserted.error,
    });
  }
  return upserted.data.id;
}

export async function linkCreators(
  supabase: ServiceClient,
  issueId: string,
  credits: CvPersonCredit[],
): Promise<void> {
  const rows: { issue_id: string; creator_id: string; role: string }[] = [];
  for (const credit of credits) {
    const creatorId = await upsertCreator(supabase, credit);
    const roles = credit.role
      .split(",")
      .map((r) => r.trim().toLowerCase())
      .filter(Boolean);
    for (const role of roles) {
      rows.push({ issue_id: issueId, creator_id: creatorId, role });
    }
  }
  if (rows.length === 0) return;

  const { error } = await supabase
    .from("issue_creators")
    .upsert(rows, { onConflict: "issue_id,creator_id,role" });
  if (error) {
    throw new ServiceError("Failed to link issue creators", { cause: error });
  }
}

export const importIssueFromComicVine = createServerFn({ method: "POST" })
  .validator((input: { detailUrl: string }) => input)
  .handler(async ({ data }): Promise<{ issueId: string }> => {
    await requireAuthenticatedUser();
    const supabase = getSupabaseServiceClient();

    const issueDetail = await getIssueDetail(data.detailUrl);
    if (!issueDetail.volume) {
      throw new ServiceError("ComicVine issue has no volume");
    }
    const volumeDetail = await getVolumeDetail(
      issueDetail.volume.api_detail_url,
    );
    if (!volumeDetail.publisher) {
      throw new ServiceError("ComicVine volume has no publisher");
    }

    const publisherId = await upsertPublisher(supabase, volumeDetail.publisher);
    const seriesId = await resolveSeries(supabase, publisherId, volumeDetail.name);
    const volumeId = await upsertVolume(
      supabase,
      volumeDetail,
      seriesId,
      publisherId,
    );
    const issue = await upsertIssue(
      supabase,
      issueDetail,
      volumeId,
      volumeDetail.name,
    );

    if (issue.isNew) {
      await linkCreators(supabase, issue.id, issueDetail.person_credits);
    }

    return { issueId: issue.id };
  });
