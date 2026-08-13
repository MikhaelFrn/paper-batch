import { supabase } from "@/integrations/supabase/client";
import type { RunVerification } from "@/lib/types";
import { requireUserId, unwrap } from "./_utils";

/** Everyone who has verified a run — public-read (unlike favorites), since
 * the point is for other users to see it, not just the person who did it. */
export async function listRunVerifications(runId: string): Promise<RunVerification[]> {
  return unwrap(
    await supabase.from("run_verifications").select("*").eq("run_id", runId),
    "Failed to load run verifications",
  );
}

export async function verifyRun(runId: string): Promise<void> {
  const uid = await requireUserId();
  const { error } = await supabase
    .from("run_verifications")
    .upsert({ user_id: uid, run_id: runId });
  if (error) throw new Error(error.message);
}

export async function unverifyRun(runId: string): Promise<void> {
  const uid = await requireUserId();
  const { error } = await supabase
    .from("run_verifications")
    .delete()
    .eq("user_id", uid)
    .eq("run_id", runId);
  if (error) throw new Error(error.message);
}
