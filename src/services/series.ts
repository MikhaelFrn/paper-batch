import { supabase } from "@/integrations/supabase/client";
import type { SeriesWithPublisher } from "@/lib/types";
import { unwrap } from "./_utils";

const SERIES_WITH_PUBLISHER = "*, publisher:publishers(*)" as const;

export async function listSeries(): Promise<SeriesWithPublisher[]> {
  return unwrap(
    await supabase.from("series").select(SERIES_WITH_PUBLISHER).order("name"),
    "Failed to load series",
  ) as SeriesWithPublisher[];
}
