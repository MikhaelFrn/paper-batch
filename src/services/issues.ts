import { supabase } from "@/integrations/supabase/client";
import type { IssueWithRelations } from "@/lib/types";
import { unwrap, unwrapMaybe } from "./_utils";

// The shared shape of "an issue plus everything a card/detail view needs
// from it" — exported as a bare fragment too, so other tables that embed
// an issue (user_comics, list_items, run_items) can nest it under their
// own `issue:issues(...)` without retyping the join by hand.
export const ISSUE_RELATIONS_FRAGMENT =
  "volume:volumes(*, series:series(*, publisher:publishers(*))), issue_creators(role, creator:creators(*))" as const;
export const ISSUE_WITH_RELATIONS = `*, ${ISSUE_RELATIONS_FRAGMENT}` as const;

export async function listRecentIssues(limit = 24): Promise<IssueWithRelations[]> {
  return unwrap(
    await supabase
      .from("issues")
      .select(ISSUE_WITH_RELATIONS)
      .order("release_date", { ascending: false, nullsFirst: false })
      .limit(limit),
    "Failed to load recent issues",
  ) as IssueWithRelations[];
}

export async function listIssuesByVolume(volumeId: string): Promise<IssueWithRelations[]> {
  return unwrap(
    await supabase
      .from("issues")
      .select(ISSUE_WITH_RELATIONS)
      .eq("volume_id", volumeId)
      .order("sort_number", { ascending: true, nullsFirst: false }),
    "Failed to load issues",
  ) as IssueWithRelations[];
}

export async function getIssue(id: string): Promise<IssueWithRelations | null> {
  return unwrapMaybe(
    await supabase
      .from("issues")
      .select(ISSUE_WITH_RELATIONS)
      .eq("id", id)
      .maybeSingle(),
    "Failed to load issue",
  ) as IssueWithRelations | null;
}
