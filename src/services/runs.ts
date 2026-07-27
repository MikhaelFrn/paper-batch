import { supabase } from "@/integrations/supabase/client";
import type { Run, RunWithRelations } from "@/lib/types";
import { unwrap, unwrapMaybe } from "./_utils";

const RUN_WITH_RELATIONS =
  "*, series:series(*, publisher:publishers(*)), run_creators(role, creator:creators(*))" as const;

export async function listRunsBySeries(seriesId: string): Promise<Run[]> {
  return unwrap(
    await supabase
      .from("runs")
      .select("*")
      .eq("series_id", seriesId)
      .order("start_year", { ascending: true, nullsFirst: false }),
    "Failed to load runs",
  );
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
