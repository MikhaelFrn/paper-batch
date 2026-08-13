import { supabase } from "@/integrations/supabase/client";
import type { Volume } from "@/lib/types";
import { unwrapMaybe } from "./_utils";

export async function getVolume(id: string): Promise<Volume | null> {
  return unwrapMaybe(
    await supabase.from("volumes").select("*").eq("id", id).maybeSingle(),
    "Failed to load volume",
  );
}
