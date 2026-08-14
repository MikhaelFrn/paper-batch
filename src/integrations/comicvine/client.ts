// Server-only ComicVine API client. Never import this from client-rendered
// code — the key is a server secret and ComicVine doesn't allow browser CORS
// requests anyway.
import { ServiceError } from "@/lib/types";
import { COMICVINE_RATE_LIMIT_MESSAGE } from "@/lib/rate-limit-messages";
import type {
  CvIssueDetail,
  CvSearchIssue,
  CvSearchVolume,
  CvVolumeDetail,
} from "./types";

const BASE_URL = "https://comicvine.gamespot.com/api";
// ComicVine rejects requests with an empty/default User-Agent.
const USER_AGENT = "ComicVaultPro/1.0";

function getApiKey(): string {
  const key = process.env.COMICVINE_KEY;
  if (!key) {
    throw new ServiceError("Missing COMICVINE_KEY environment variable");
  }
  return key;
}

interface CvEnvelope<T> {
  error: string;
  status_code: number;
  results: T;
}

async function cvGet<T>(
  url: string,
  params: Record<string, string>,
): Promise<T> {
  const parsed = new URL(url);
  if (parsed.hostname !== "comicvine.gamespot.com") {
    throw new ServiceError(`Refusing to fetch non-ComicVine URL: ${url}`);
  }
  parsed.searchParams.set("api_key", getApiKey());
  parsed.searchParams.set("format", "json");
  for (const [key, value] of Object.entries(params)) {
    parsed.searchParams.set(key, value);
  }

  const response = await fetch(parsed, {
    headers: { "User-Agent": USER_AGENT },
  });
  // ComicVine's own velocity/burst detection returns 420 ("Rate limit
  // exceeded. Slow down cowboy.") separately from the documented 200
  // requests/resource/hour cap — confirmed live, see getIssueDetailsBatch
  // below. Checked before the generic !response.ok branch so every single
  // ComicVine-backed feature (search, volume analysis, New Arrivals,
  // barcode's ComicVine-search step) gets the same recognizable, safe-to-
  // show message instead of a raw "420 " status dump.
  if (response.status === 420 || response.status === 429) {
    throw new ServiceError(COMICVINE_RATE_LIMIT_MESSAGE, { code: "RATE_LIMITED" });
  }
  if (!response.ok) {
    throw new ServiceError(
      `ComicVine request failed: ${response.status} ${response.statusText}`,
    );
  }
  const payload = (await response.json()) as CvEnvelope<T>;
  if (payload.status_code !== 1) {
    throw new ServiceError(`ComicVine error: ${payload.error}`);
  }
  return payload.results;
}

const SEARCH_FIELDS =
  "id,name,issue_number,cover_date,store_date,image,volume,publisher,start_year,count_of_issues,api_detail_url,resource_type";

/** Raw, unmodified relevance search — CV ranks by recency/relevance with no
 * sort support (verified: `sort` is silently ignored on this endpoint).
 * Good for "what's new," not for "every era of this character" — see
 * `searchIssuesAndVolumes` for the latter. */
async function searchIssuesRaw(query: string, limit: number): Promise<CvSearchIssue[]> {
  return cvGet<CvSearchIssue[]>(`${BASE_URL}/search/`, {
    query,
    resources: "issue",
    field_list: SEARCH_FIELDS,
    limit: String(limit),
  });
}

// ComicVine indexes foreign-market reprint imprints (Spanish, Brazilian,
// Mexican, etc. licensed reprints of the same US comics) as their own
// volumes under the same name — e.g. "Batman" from "ECC Ediciones" next to
// "Batman" from DC. They aren't duplicates of anything, but for an
// English-market personal collection they're noise. CV doesn't expose a
// reliable country/language field on the publisher summary we get here
// (checked: DC/Marvel have location_address populated, foreign reprint
// imprints don't — but reading that requires a separate detail call per
// publisher, too costly to do per search). This is a plain name denylist
// instead: cheap, but only catches imprints we've actually seen. Extend as
// more show up.
const NON_ENGLISH_MARKET_PUBLISHERS = new Set([
  "editorial novaro",
  "grupo editorial vid",
  "ecc ediciones",
  "panini brasil",
  "panini españa",
  "panini verlag",
  "panini france",
  "planeta deagostini",
  "editorial ivrea",
  "editora abril",
  // Found live searching "batman"/"spider-man" — a "Batman" search's top
  // 15 volume matches included Editorial Novaro, Grupo Editorial Vid, ECC
  // Ediciones, and Panini Brasil (all already listed) plus four more not
  // yet caught: Ediciones Zinco and Norma Editorial (Spanish), Epucol
  // (Colombian), and Editions Interpresse S.A. (French-Canadian) — any of
  // which, sampled into the top MAX_VOLUMES_TO_SAMPLE, could surface a
  // real but foreign-language back issue with a legitimate-but-unfamiliar
  // numbering/date scheme in results for a plain English query.
  "ediciones zinco",
  "norma editorial",
  "epucol",
  "editions interpresse s.a.",
  // Scandinavian/Dutch/French Spider-Man reprints, same discovery method.
  "tm-semic",
  "hjemmet",
  "bladkompaniet a.s.",
  "juniorpress bv",
  "éditions de l'occident",
]);

function isEnglishMarketPublisherName(name: string | null | undefined): boolean {
  const n = name?.toLowerCase().trim();
  return !n || !NON_ENGLISH_MARKET_PUBLISHERS.has(n);
}

function isEnglishMarketVolume(v: CvSearchVolume): boolean {
  return isEnglishMarketPublisherName(v.publisher?.name);
}

async function searchVolumesRaw(query: string, limit: number): Promise<CvSearchVolume[]> {
  const results = await cvGet<CvSearchVolume[]>(`${BASE_URL}/search/`, {
    query,
    resources: "volume",
    field_list: SEARCH_FIELDS,
    limit: String(limit),
  });
  return results.filter(isEnglishMarketVolume);
}

// CV has no way to filter issues or volumes by publisher directly at the
// list-endpoint level — the only path is resolving each issue's volume's
// publisher individually. Ongoing weekly series recur across visits, so
// cache across calls within this server process rather than re-resolving
// the same handful of currently-active volumes every time. Shared between
// New Arrivals and issue search's foreign-reprint filter below.
const volumePublisherCache = new Map<string, { id: number; name: string } | null>();

async function getVolumePublisher(
  volumeDetailUrl: string,
): Promise<{ id: number; name: string } | null> {
  if (volumePublisherCache.has(volumeDetailUrl)) {
    return volumePublisherCache.get(volumeDetailUrl) ?? null;
  }
  const detail = await cvGet<{ publisher: { id: number; name: string } | null }>(
    volumeDetailUrl,
    { field_list: "id,publisher" },
  );
  const publisher = detail.publisher
    ? { id: detail.publisher.id, name: detail.publisher.name }
    : null;
  volumePublisherCache.set(volumeDetailUrl, publisher);
  return publisher;
}

// Unlike searchVolumesRaw, CV's issue search results carry no publisher
// field at all (confirmed live against the real API — field_list asks for
// it, the response just omits it for resources=issue) — so filtering out
// foreign-market reprints here needs a per-volume lookup instead of a
// field already on the result. Cheap in practice: raw issue-relevance
// search commonly collapses onto a small handful of volumes (see
// searchIssuesAndVolumes below), and getVolumePublisher caches across
// calls, so a search rarely costs more than one or two extra requests.
async function filterEnglishMarketIssues(issues: CvSearchIssue[]): Promise<CvSearchIssue[]> {
  const volumeUrls = [
    ...new Set(issues.map((i) => i.volume?.api_detail_url).filter((u): u is string => !!u)),
  ];
  const publishers = await Promise.all(volumeUrls.map((url) => getVolumePublisher(url)));
  const excludedVolumeUrls = new Set(
    volumeUrls.filter((_, i) => !isEnglishMarketPublisherName(publishers[i]?.name)),
  );
  return issues.filter((i) => !i.volume || !excludedVolumeUrls.has(i.volume.api_detail_url));
}

const VOLUME_ISSUE_FIELDS =
  "id,name,issue_number,cover_date,store_date,image,volume,api_detail_url";

/** Full, reliable, paginated issue list for one volume — unlike `/search/`,
 * this endpoint has no relevance collapsing and honors sort/offset. */
async function getIssuesOfVolume(
  volumeId: number,
  offset: number,
  limit: number,
): Promise<CvSearchIssue[]> {
  const results = await cvGet<Array<Omit<CvSearchIssue, "resource_type">>>(
    `${BASE_URL}/issues/`,
    {
      filter: `volume:${volumeId}`,
      sort: "cover_date:asc",
      field_list: VOLUME_ISSUE_FIELDS,
      offset: String(offset),
      limit: String(limit),
    },
  );
  return results.map((r) => ({ ...r, resource_type: "issue" as const }));
}

const CV_MAX_PAGE_SIZE = 100;

/** Every issue of a volume, oldest first, paginating past CV's 100-per-page
 * cap as needed. Basic fields only — no writer credits (see
 * getIssueDetailsBatch for that, which costs one call per issue and is the
 * expensive part of run derivation). */
export async function getAllIssuesOfVolume(volumeId: number): Promise<CvSearchIssue[]> {
  const all: CvSearchIssue[] = [];
  let offset = 0;
  for (;;) {
    const page = await getIssuesOfVolume(volumeId, offset, CV_MAX_PAGE_SIZE);
    all.push(...page);
    if (page.length < CV_MAX_PAGE_SIZE) break;
    offset += CV_MAX_PAGE_SIZE;
  }
  return all;
}

// ComicVine's documented hourly cap (200 requests/resource/hour) isn't the
// only limit — it also does its own "velocity" burst detection, separate
// from the hourly count, that blocks a run of near-simultaneous requests
// with a 420 ("Rate limit exceeded. Slow down cowboy.") — confirmed live,
// triggered by this function's old batch size of 50 truly concurrent
// requests. A smaller batch plus a pause between batches spreads requests
// out over time instead of firing them in one burst, which is what the
// velocity check actually seems to react to (the hourly total is unchanged
// either way — this doesn't help if you're already over that).
const CREDIT_FETCH_BATCH_SIZE = 10;
const CREDIT_FETCH_BATCH_DELAY_MS = 500;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Full detail (incl. person_credits) for each issue, one CV call per
 * issue, in batches. This is the expensive step in run derivation — only
 * call it from an explicit user-triggered action, never automatically. */
export async function getIssueDetailsBatch(
  issues: CvSearchIssue[],
): Promise<CvIssueDetail[]> {
  const results: CvIssueDetail[] = [];
  for (let i = 0; i < issues.length; i += CREDIT_FETCH_BATCH_SIZE) {
    if (i > 0) await sleep(CREDIT_FETCH_BATCH_DELAY_MS);
    const batch = issues.slice(i, i + CREDIT_FETCH_BATCH_SIZE);
    const batchResults = await Promise.all(
      batch.map((issue) => getIssueDetail(issue.api_detail_url)),
    );
    results.push(...batchResults);
  }
  return results;
}

/** Pulls the same `[offset, offset+perVolumeLimit)` issue slice from each
 * given volume and flattens the result — the shared paging cursor behind
 * both the initial search batch and "load more". */
export async function sampleIssuesFromVolumes(
  volumeIds: number[],
  offset: number,
  perVolumeLimit: number,
): Promise<CvSearchIssue[]> {
  const batches = await Promise.all(
    volumeIds.map((id) => getIssuesOfVolume(id, offset, perVolumeLimit)),
  );
  return batches.flat();
}

// How many matched volumes to pull issues from, per search.
export const MAX_VOLUMES_TO_SAMPLE = 6;
// Issues pulled per volume on the initial search — small volumes (a 4-issue
// miniseries like Siege) are fully covered by this alone.
export const INITIAL_ISSUES_PER_VOLUME = 10;

export interface ComicVineIssueSearchResult {
  issues: CvSearchIssue[];
  volumes: CvSearchVolume[];
  /** CV volume ids sampled for issues — pass back to `sampleIssuesFromVolumes`
   * for "load more" so it keeps paging the same set. */
  sampledVolumeIds: number[];
  /** Per-volume offset already consumed; next "load more" call starts here. */
  nextOffset: number;
}

export async function searchIssuesAndVolumes(
  query: string,
  limit = 15,
): Promise<ComicVineIssueSearchResult> {
  const [issueResults, volumeResults] = await Promise.all([
    searchIssuesRaw(query, limit),
    searchVolumesRaw(query, limit),
  ]);

  // Raw issue search collapses to whichever single volume CV's relevance
  // engine favors (usually the current run) — for a common query like
  // "batman" every result can come from one ongoing series, with older
  // eras and specific back issues invisible even though those volumes
  // match fine on their own. Pull real issue batches from each matched
  // volume via the reliable per-volume endpoint instead of trusting
  // relevance search to surface them.
  const sampledVolumeIds = volumeResults.slice(0, MAX_VOLUMES_TO_SAMPLE).map((v) => v.id);
  const volumeIssues = await sampleIssuesFromVolumes(
    sampledVolumeIds,
    0,
    INITIAL_ISSUES_PER_VOLUME,
  );

  // volumeIssues is already clean (sampled only from volumeResults, which
  // searchVolumesRaw already filtered) — but issueResults comes straight
  // from CV's raw relevance search with no filtering at all, which is
  // exactly how a foreign-market reprint (weird issue numbers, a future
  // cover date, non-English title) could show up in results for a query
  // as plain as "batman".
  const cleanIssueResults = await filterEnglishMarketIssues(issueResults);

  const seenIds = new Set(cleanIssueResults.map((i) => i.id));
  const extra = volumeIssues.filter((i) => !seenIds.has(i.id));

  return {
    issues: [...cleanIssueResults, ...extra],
    volumes: volumeResults,
    sampledVolumeIds,
    nextOffset: INITIAL_ISSUES_PER_VOLUME,
  };
}

const ISSUE_DETAIL_FIELDS =
  "id,name,issue_number,cover_date,store_date,image,volume,person_credits";

/** `detailUrl` is a ComicVine `api_detail_url` returned by a prior call. */
export async function getIssueDetail(detailUrl: string): Promise<CvIssueDetail> {
  return cvGet<CvIssueDetail>(detailUrl, { field_list: ISSUE_DETAIL_FIELDS });
}

const VOLUME_DETAIL_FIELDS =
  "id,name,start_year,publisher,image,count_of_issues";

export async function getVolumeDetail(
  detailUrl: string,
): Promise<CvVolumeDetail> {
  return cvGet<CvVolumeDetail>(detailUrl, { field_list: VOLUME_DETAIL_FIELDS });
}

// ---------- New Arrivals ----------
// A global "everything released this week" feed is dominated by digital
// manga/light-novel chapters from dozens of small imprints (verified live:
// 13 of 15 top results for a real week) — there's no genre/format field on
// CV to filter that out (checked), so unlike search's foreign-reprint
// denylist, this needs an allowlist of publishers to be worth showing at
// all. IDs resolved via /publishers/?filter=name:X against the live API,
// not guessed.
// Names are ComicVine's actual canonical publisher names (each verified
// live against /publisher/{id}), matching PublisherBadge / publisherAccent's
// keys (comic-adapters.ts) — previously used shorthand ("DC", "Dark
// Horse", "Boom Studios", "IDW", "Valiant") that matched neither CV's own
// name nor what upsertPublisher stores locally, so the same real-world
// publisher displayed under two different names depending on whether a
// comic came from New Arrivals or was actually imported.
export const NEW_ARRIVALS_PUBLISHERS: Record<string, number> = {
  Marvel: 31,
  "DC Comics": 10,
  Image: 513,
  "Dark Horse Comics": 364,
  "Boom! Studios": 1868,
  "IDW Publishing": 1190,
  "DMG/Valiant Entertainment": 1924,
  "Red 5 Comics": 2048,
};
const NEW_ARRIVALS_PUBLISHER_IDS = new Set(Object.values(NEW_ARRIVALS_PUBLISHERS));
const NEW_ARRIVALS_PUBLISHER_NAMES = new Map(
  Object.entries(NEW_ARRIVALS_PUBLISHERS).map(([name, id]) => [id, name]),
);

export interface CvRecentIssue extends CvSearchIssue {
  publisherName: string;
}

const RECENT_ISSUE_FIELDS =
  "id,name,issue_number,cover_date,store_date,image,volume,api_detail_url";

/** Issues shipped in `[startDate, endDate]` (YYYY-MM-DD) from the allowed
 * publisher list, newest first, capped at `limit`. A week's worth of raw
 * results fits in ComicVine's single-page max (100) — but that also means
 * up to 100 different volumes, each needing its own publisher lookup (CV's
 * issue search returns no publisher field at all). Firing all 100 live
 * against CV's own rate limit is exactly what made New Arrivals take
 * 10-20+ seconds in practice, confirmed live.
 *
 * `lookupKnownPublishers`, when given, is asked first for every volume id
 * in this batch — the caller backs it with one local-DB query, since most
 * ongoing series showing up in "new arrivals" have already been imported
 * by someone before. Only volumes it doesn't recognize fall through to a
 * live per-volume CV call, same as before; with no callback at all, every
 * volume falls through, unchanged from the original behavior. */
export async function getRecentIssues(
  startDate: string,
  endDate: string,
  limit: number,
  lookupKnownPublishers?: (
    volumeIds: number[],
  ) => Promise<Map<number, { id: number; name: string } | null>>,
): Promise<CvRecentIssue[]> {
  const raw = await cvGet<Array<Omit<CvSearchIssue, "resource_type">>>(
    `${BASE_URL}/issues/`,
    {
      filter: `store_date:${startDate}|${endDate}`,
      sort: "store_date:desc",
      field_list: RECENT_ISSUE_FIELDS,
      limit: "100",
    },
  );

  const volumeIds = [
    ...new Set(raw.map((i) => i.volume?.id).filter((id): id is number => id != null)),
  ];
  const known =
    lookupKnownPublishers && volumeIds.length > 0
      ? await lookupKnownPublishers(volumeIds)
      : new Map<number, { id: number; name: string } | null>();

  // Only volumes `known` doesn't recognize need a live CV call — deduped
  // by volume id (not issue) so two issues from the same unrecognized
  // volume don't pay for it twice. Batched the same way as
  // getIssueDetailsBatch below: CV's burst-detection 420s a large
  // parallel Promise.all here just as readily as it does for per-issue
  // detail fetches (confirmed live for that one; this path was never
  // given the same treatment, which is exactly what let New Arrivals fire
  // up to 100 concurrent requests on a freshly-seeded catalog).
  const unknownVolumes = new Map<number, string>();
  for (const issue of raw) {
    if (issue.volume && !known.has(issue.volume.id) && !unknownVolumes.has(issue.volume.id)) {
      unknownVolumes.set(issue.volume.id, issue.volume.api_detail_url);
    }
  }
  const unknownEntries = [...unknownVolumes.entries()];
  const resolved = new Map<number, { id: number; name: string } | null>();
  for (let i = 0; i < unknownEntries.length; i += CREDIT_FETCH_BATCH_SIZE) {
    if (i > 0) await sleep(CREDIT_FETCH_BATCH_DELAY_MS);
    const batch = unknownEntries.slice(i, i + CREDIT_FETCH_BATCH_SIZE);
    const batchResults = await Promise.all(batch.map(([, url]) => getVolumePublisher(url)));
    batch.forEach(([volumeId], j) => resolved.set(volumeId, batchResults[j]));
  }

  const publishers = raw.map((issue) => {
    if (!issue.volume) return null;
    if (known.has(issue.volume.id)) return known.get(issue.volume.id) ?? null;
    return resolved.get(issue.volume.id) ?? null;
  });

  const allowed: CvRecentIssue[] = [];
  for (let i = 0; i < raw.length; i++) {
    const publisher = publishers[i];
    if (!publisher || !NEW_ARRIVALS_PUBLISHER_IDS.has(publisher.id)) continue;
    allowed.push({
      ...raw[i],
      resource_type: "issue",
      publisherName: NEW_ARRIVALS_PUBLISHER_NAMES.get(publisher.id) ?? publisher.name,
    });
    if (allowed.length >= limit) break;
  }
  return allowed;
}
