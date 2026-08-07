import { supabase } from "@/integrations/supabase/client";
import type {
  Creator,
  IssueWithRelations,
  Publisher,
  RunWithRelations,
  SearchResults,
  SeriesWithPublisher,
  Volume,
} from "@/lib/types";
import { unwrap } from "./_utils";
import { backfillCoverHashes } from "./coverHash";

const ISSUE_WITH_RELATIONS =
  "*, volume:volumes(*, series:series(*, publisher:publishers(*))), issue_creators(role, creator:creators(*))" as const;
// `!inner` on volume/series, not the default left-outer embed — filtering
// on an embedded resource's column only constrains which *parent* rows
// come back when the join is forced inner (confirmed live: without
// `!inner` this exact filter is silently ignored and returns every issue,
// not just matches). Every issue has a volume in practice, so the inner
// join doesn't drop anything a left join wouldn't already have included.
const ISSUE_WITH_RELATIONS_SERIES_INNER =
  "*, volume:volumes!inner(*, series:series!inner(*, publisher:publishers(*))), issue_creators(role, creator:creators(*))" as const;
// `!inner` on issue_creators/creator so the filter below actually restricts
// which issues come back (same reasoning as the series-inner constant above)
// — note the embedded issue_creators array in the result is still an
// issue's *full* credit list, not just the row that matched; PostgREST
// doesn't sub-filter embedded arrays, only which parent rows qualify.
const ISSUE_WITH_RELATIONS_CREATOR_INNER =
  "*, volume:volumes(*, series:series(*, publisher:publishers(*))), issue_creators!inner(role, creator:creators!inner(*))" as const;
// `runs` has no direct FK to `series` — a run relates to volumes/issues only
// indirectly through `run_items`. Don't join a relationship that doesn't
// exist in the schema.
const RUN_WITH_RELATIONS =
  "*, run_creators(role, creator:creators(*))" as const;
const SERIES_WITH_PUBLISHER = "*, publisher:publishers(*)" as const;

function esc(q: string): string {
  // Escape PostgREST `or` filter special chars in ilike patterns.
  return q.replace(/[,()]/g, " ").trim();
}

export interface SearchOptions {
  /** Max rows per entity group. Defaults to 20. */
  limit?: number;
}

/**
 * Server-side global search across issues, runs, volumes, series, creators,
 * and publishers. Returns results grouped by entity type.
 */
export async function searchAll(
  query: string,
  options: SearchOptions = {},
): Promise<SearchResults> {
  const q = esc(query);
  const limit = options.limit ?? 20;
  const empty: SearchResults = {
    issues: [],
    series: [],
    runs: [],
    volumes: [],
    creators: [],
    publishers: [],
  };
  if (!q) return empty;

  const like = `%${q}%`;
  // For "click a credit name" (always a full "First Last" string) as well as
  // typed multi-word searches — a single ilike against one column can never
  // match a two-word name (neither first_name nor last_name contains the
  // whole "First Last" string). Splitting on the last word and requiring
  // both halves to match *the same* creator row (chained ilike, not `.or`)
  // is what actually finds them precisely — confirmed live: `.or()` can't
  // reach into a doubly-nested embedded resource at all (PGRST100), and
  // matching first/last independently via two separate queries produces
  // cross-credit false positives (e.g. issue has a "Bill" colorist and an
  // unrelated "Finger" letterer) that a same-row AND doesn't.
  const words = q.split(/\s+/).filter(Boolean);
  const lastWord = words[words.length - 1];
  const firstWords = words.slice(0, -1).join(" ");

  const [
    issuesByFieldRes,
    issuesBySeriesRes,
    issuesByCreatorRes,
    issuesByFullNameRes,
    seriesRes,
    runsRes,
    volumesRes,
    creatorsRes,
    publishersRes,
  ] = await Promise.all([
    supabase
      .from("issues")
      .select(ISSUE_WITH_RELATIONS)
      .or(`title.ilike.${like},issue_number.ilike.${like}`)
      .limit(limit),
    // A comic's own title often doesn't repeat its series name (e.g. a
    // one-word chapter title, or ComicVine leaving it blank so it falls
    // back to just "SeriesName #N" — that fallback happens to contain the
    // series name, but a real per-issue title doesn't have to). Searching
    // "dark knights" needs to find those issues via the series they belong
    // to, not just ones whose own title/issue_number field matches.
    supabase
      .from("issues")
      .select(ISSUE_WITH_RELATIONS_SERIES_INNER)
      .ilike("volume.series.name", like)
      .limit(limit),
    // Single-word queries (a bare first or last name, e.g. typing
    // "Claremont") — matches either column against the whole query.
    supabase
      .from("issues")
      .select(ISSUE_WITH_RELATIONS_CREATOR_INNER)
      .or(`first_name.ilike.${like},last_name.ilike.${like}`, {
        foreignTable: "issue_creators.creator",
      })
      .limit(limit),
    // Multi-word queries (a full "First Last" credit) — only runs when
    // there's a last word to split off.
    words.length >= 2
      ? supabase
          .from("issues")
          .select(ISSUE_WITH_RELATIONS_CREATOR_INNER)
          .ilike("issue_creators.creator.first_name", `%${firstWords}%`)
          .ilike("issue_creators.creator.last_name", `%${lastWord}%`)
          .limit(limit)
      : Promise.resolve({ data: [], error: null }),
    supabase
      .from("series")
      .select(SERIES_WITH_PUBLISHER)
      .ilike("name", like)
      .limit(limit),
    supabase
      .from("runs")
      .select(RUN_WITH_RELATIONS)
      .ilike("name", like)
      .limit(limit),
    supabase.from("volumes").select("*").ilike("name", like).limit(limit),
    supabase
      .from("creators")
      .select("*")
      .or(`first_name.ilike.${like},last_name.ilike.${like}`)
      .limit(limit),
    supabase.from("publishers").select("*").ilike("name", like).limit(limit),
  ]);

  const issuesByField = unwrap(issuesByFieldRes, "Failed to search issues") as IssueWithRelations[];
  const issuesBySeries = unwrap(issuesBySeriesRes, "Failed to search issues by series") as IssueWithRelations[];
  const issuesByCreator = unwrap(issuesByCreatorRes, "Failed to search issues by creator") as IssueWithRelations[];
  const issuesByFullName = unwrap(issuesByFullNameRes, "Failed to search issues by creator") as IssueWithRelations[];
  const issuesById = new Map<string, IssueWithRelations>();
  for (const issue of [...issuesByField, ...issuesBySeries, ...issuesByCreator, ...issuesByFullName]) {
    issuesById.set(issue.id, issue);
  }

  return {
    issues: [...issuesById.values()].slice(0, limit),
    series: unwrap(seriesRes, "Failed to search series") as SeriesWithPublisher[],
    runs: unwrap(runsRes, "Failed to search runs") as RunWithRelations[],
    volumes: unwrap(volumesRes, "Failed to search volumes") as Volume[],
    creators: unwrap(creatorsRes, "Failed to search creators") as Creator[],
    publishers: unwrap(
      publishersRes,
      "Failed to search publishers",
    ) as Publisher[],
  };
}

const COVER_BACKFILL_SEARCH_INTERVAL = 10;

/** Fire-and-forget: bumps a shared, DB-backed search counter and, every
 * Nth search app-wide, kicks off a cover-hash backfill catch-up run.
 * Stands in for a cron job — there's no scheduler in this app's current
 * (unhosted) setup, so "enough real usage has happened" substitutes for a
 * wall-clock schedule. The counter lives in Postgres (increment_app_counter
 * RPC — see the "app_counters" table setup), not in-process memory, since
 * a serverless/edge deployment doesn't share memory across requests or
 * survive between them. Never awaited by callers — a search shouldn't
 * wait on unrelated maintenance work. */
export async function notifySearchPerformed(): Promise<void> {
  const { data: count, error } = await supabase.rpc("increment_app_counter", {
    counter_key: "search_count",
  });
  if (error) {
    console.error("Failed to increment search counter:", error);
    return;
  }
  if (count > 0 && count % COVER_BACKFILL_SEARCH_INTERVAL === 0) {
    backfillCoverHashes().catch((e) => console.error("Auto cover-hash backfill failed:", e));
  }
}
