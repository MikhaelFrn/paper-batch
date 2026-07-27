import { supabase } from "@/integrations/supabase/client";
import type {
  UserCollectionEntry,
  UserComic,
  UserComicUpdate,
} from "@/lib/types";
import { requireUserId, unwrap, unwrapMaybe } from "./_utils";

const USER_COMIC_WITH_ISSUE =
  "*, issue:issues(*, volume:volumes(*, series:series(*, publisher:publishers(*))), issue_creators(role, creator:creators(*)))" as const;

export async function listMyCollection(): Promise<UserCollectionEntry[]> {
  const uid = await requireUserId();
  return unwrap(
    await supabase
      .from("user_comics")
      .select(USER_COMIC_WITH_ISSUE)
      .eq("user_id", uid)
      .order("created_at", { ascending: false }),
    "Failed to load collection",
  ) as UserCollectionEntry[];
}

export async function getMyUserComicByIssue(
  issueId: string,
): Promise<UserComic | null> {
  const uid = await requireUserId();
  return unwrapMaybe(
    await supabase
      .from("user_comics")
      .select("*")
      .eq("user_id", uid)
      .eq("issue_id", issueId)
      .maybeSingle(),
    "Failed to load user comic",
  );
}

export interface UpsertUserComicInput {
  issueId: string;
  owned?: boolean;
  read?: boolean;
  rating?: number | null;
  notes?: string | null;
  purchaseDate?: string | null;
}

export async function upsertMyUserComic(
  input: UpsertUserComicInput,
): Promise<UserComic> {
  const uid = await requireUserId();
  const existing = await getMyUserComicByIssue(input.issueId);
  const payload = {
    user_id: uid,
    issue_id: input.issueId,
    owned: input.owned ?? existing?.owned ?? false,
    read: input.read ?? existing?.read ?? false,
    rating: input.rating ?? existing?.rating ?? null,
    notes: input.notes ?? existing?.notes ?? null,
    purchase_date: input.purchaseDate ?? existing?.purchase_date ?? null,
  };
  if (existing) {
    return unwrap(
      await supabase
        .from("user_comics")
        .update(payload as UserComicUpdate)
        .eq("id", existing.id)
        .select("*")
        .single(),
      "Failed to update user comic",
    );
  }
  return unwrap(
    await supabase.from("user_comics").insert(payload).select("*").single(),
    "Failed to create user comic",
  );
}

export async function deleteMyUserComic(issueId: string): Promise<void> {
  const uid = await requireUserId();
  const { error } = await supabase
    .from("user_comics")
    .delete()
    .eq("user_id", uid)
    .eq("issue_id", issueId);
  if (error) {
    throw new Error(error.message);
  }
}
