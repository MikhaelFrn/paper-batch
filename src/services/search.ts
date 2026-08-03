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

const ISSUE_WITH_RELATIONS =
  "*, volume:volumes(*, series:series(*, publisher:publishers(*))), issue_creators(role, creator:creators(*))" as const;
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

  const [
    issuesRes,
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

  return {
    issues: unwrap(issuesRes, "Failed to search issues") as IssueWithRelations[],
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
