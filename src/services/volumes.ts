import { supabase } from "@/integrations/supabase/client";
import type { Volume } from "@/lib/types";
import { unwrap, unwrapMaybe } from "./_utils";

export async function listVolumesBySeries(seriesId: string): Promise<Volume[]> {
  return unwrap(
    await supabase
      .from("volumes")
      .select("*")
      .eq("series_id", seriesId)
      .order("start_year", { ascending: true, nullsFirst: false }),
    "Failed to load volumes",
  );
}

export async function getVolume(id: string): Promise<Volume | null> {
  return unwrapMaybe(
    await supabase.from("volumes").select("*").eq("id", id).maybeSingle(),
    "Failed to load volume",
  );
}
