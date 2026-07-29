import { supabase } from "@/integrations/supabase/client";
import type { Run, RunWithRelations } from "@/lib/types";
import { unwrapMaybe } from "./_utils";

const RUN_WITH_RELATIONS =
  "*, series:series(*, publisher:publishers(*)), run_creators(role, creator:creators(*))" as const;

export async function listRunsBySeries(_seriesId: string): Promise<Run[]> {
  // The `runs` table has no direct series_id column in the current schema;
  // series ↔ run association lives via run_items → volumes. Return empty for
  // now; wire up via join when needed.
  return [];
}

export async function getRun(id: string): Promise<RunWithRelations | null> {
  return unwrapMaybe(
    await supabase
      .from("runs")
      .select(RUN_WITH_RELATIONS)
      .eq("id", id)
      .maybeSingle(),
    "Failed to load run",
  ) as RunWithRelations | null;
}
