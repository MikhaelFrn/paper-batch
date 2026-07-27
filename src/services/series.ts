import { supabase } from "@/integrations/supabase/client";
import type { Series, SeriesWithPublisher } from "@/lib/types";
import { unwrap, unwrapMaybe } from "./_utils";

const SERIES_WITH_PUBLISHER = "*, publisher:publishers(*)" as const;

export async function listSeries(): Promise<SeriesWithPublisher[]> {
  return unwrap(
    await supabase.from("series").select(SERIES_WITH_PUBLISHER).order("name"),
    "Failed to load series",
  ) as SeriesWithPublisher[];
}

export async function listSeriesByPublisher(
  publisherId: string,
): Promise<Series[]> {
  return unwrap(
    await supabase
      .from("series")
      .select("*")
      .eq("publisher_id", publisherId)
      .order("name"),
    "Failed to load series",
  );
}

export async function getSeries(
  id: string,
): Promise<SeriesWithPublisher | null> {
  return unwrapMaybe(
    await supabase
      .from("series")
      .select(SERIES_WITH_PUBLISHER)
      .eq("id", id)
      .maybeSingle(),
    "Failed to load series",
  ) as SeriesWithPublisher | null;
}
