import { supabase } from "@/integrations/supabase/client";
import type { Creator } from "@/lib/types";
import { unwrap, unwrapMaybe } from "./_utils";

export async function listCreators(limit = 100): Promise<Creator[]> {
  return unwrap(
    await supabase
      .from("creators")
      .select("*")
      .order("last_name", { nullsFirst: false })
      .limit(limit),
    "Failed to load creators",
  );
}

export async function getCreator(id: string): Promise<Creator | null> {
  return unwrapMaybe(
    await supabase.from("creators").select("*").eq("id", id).maybeSingle(),
    "Failed to load creator",
  );
}
