import { supabase } from "@/integrations/supabase/client";
import type { Publisher } from "@/lib/types";
import { unwrap } from "./_utils";

export async function listPublishers(): Promise<Publisher[]> {
  return unwrap(
    await supabase.from("publishers").select("*").order("name"),
    "Failed to load publishers",
  );
}
