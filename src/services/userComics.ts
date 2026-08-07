import { supabase } from "@/integrations/supabase/client";
import type {
  UserCollectionEntry,
  UserComic,
  UserComicUpdate,
} from "@/lib/types";
import { requireUserId, throwIfError, unwrap, unwrapMaybe } from "./_utils";

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

/** Sets one boolean field (`owned` or `read`) for many issues in one action
 * (e.g. "mark #1-45 as owned" from a volume page) — two batched calls
 * total regardless of how many issues are selected, not one round trip
 * per issue. Existing collection entries are updated in place (the other
 * fields untouched — marking issues owned never flips read, and vice
 * versa); issues with no entry yet get a fresh one with everything else
 * defaulted. */
async function bulkSetUserComicField(
  issueIds: string[],
  field: "owned" | "read",
  value: boolean,
): Promise<void> {
  const uid = await requireUserId();
  if (issueIds.length === 0) return;

  const existing = await unwrap(
    await supabase
      .from("user_comics")
      .select("issue_id")
      .eq("user_id", uid)
      .in("issue_id", issueIds),
    "Failed to check existing collection entries",
  );
  const existingIds = new Set(existing.map((e) => e.issue_id));
  const toUpdate = issueIds.filter((id) => existingIds.has(id));
  const toInsert = issueIds.filter((id) => !existingIds.has(id));

  if (toUpdate.length > 0) {
    // A computed { [field]: value } key produces a string-index-signature
    // type that Supabase's generated Update type rejects — spell out both
    // shapes explicitly instead.
    const patch: UserComicUpdate = field === "owned" ? { owned: value } : { read: value };
    const result = await supabase
      .from("user_comics")
      .update(patch)
      .eq("user_id", uid)
      .in("issue_id", toUpdate);
    throwIfError(result.error, `Failed to update ${field} status`);
  }
  if (toInsert.length > 0) {
    const result = await supabase.from("user_comics").insert(
      toInsert.map((issueId) => ({
        user_id: uid,
        issue_id: issueId,
        owned: field === "owned" ? value : false,
        read: field === "read" ? value : false,
        rating: null,
        notes: null,
        purchase_date: null,
      })),
    );
    throwIfError(result.error, "Failed to create collection entries");
  }
}

export async function bulkSetOwned(issueIds: string[], owned: boolean): Promise<void> {
  return bulkSetUserComicField(issueIds, "owned", owned);
}

export async function bulkSetRead(issueIds: string[], read: boolean): Promise<void> {
  return bulkSetUserComicField(issueIds, "read", read);
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
