import { supabase } from "@/integrations/supabase/client";
import type { Issue, IssueWithRelations } from "@/lib/types";
import { unwrap, unwrapMaybe } from "./_utils";

const ISSUE_WITH_RELATIONS =
  "*, volume:volumes(*, series:series(*, publisher:publishers(*))), issue_creators(role, creator:creators(*))" as const;

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

export async function listIssuesByVolume(volumeId: string): Promise<Issue[]> {
  return unwrap(
    await supabase
      .from("issues")
      .select("*")
      .eq("volume_id", volumeId)
      .order("sort_number", { ascending: true, nullsFirst: false }),
    "Failed to load issues",
  );
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
