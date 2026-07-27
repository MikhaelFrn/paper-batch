import { supabase } from "@/integrations/supabase/client";
import type { Publisher } from "@/lib/types";
import { unwrap, unwrapMaybe } from "./_utils";

export async function listPublishers(): Promise<Publisher[]> {
  return unwrap(
    await supabase.from("publishers").select("*").order("name"),
    "Failed to load publishers",
  );
}

export async function getPublisher(id: string): Promise<Publisher | null> {
  return unwrapMaybe(
    await supabase.from("publishers").select("*").eq("id", id).maybeSingle(),
    "Failed to load publisher",
  );
}
