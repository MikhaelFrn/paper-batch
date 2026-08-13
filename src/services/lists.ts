import { supabase } from "@/integrations/supabase/client";
import type {
  ListInsert,
  ListMemberRole,
  ListMemberWithProfile,
  ListRow,
  ListUpdate,
  ListWithItems,
  ListWithRole,
} from "@/lib/types";
import { requireUserId, unwrap, unwrapMaybe } from "./_utils";
import { ISSUE_RELATIONS_FRAGMENT } from "./issues";

const LIST_WITH_ITEMS =
  `*, list_items(added_at, list_id, issue_id, issue:issues(*, ${ISSUE_RELATIONS_FRAGMENT}))` as const;

/** Lists that belong to the current user's "My Lists" page: everything they
 * own, plus everything they were added to as a collaborator (viewer or
 * editor) — a list_members row is enough, ownership isn't required to see
 * it here. Two queries rather than one embedded join: owned lists may
 * predate createList() registering the owner in list_members (see the
 * comment there), so owner_id is still the source of truth for those. */
export async function listMyLists(): Promise<ListWithRole[]> {
  const uid = await requireUserId();

  const [ownedResult, memberRowsResult] = await Promise.all([
    supabase.from("lists").select("*").eq("owner_id", uid),
    supabase.from("list_members").select("list_id, role").eq("user_id", uid),
  ]);
  const owned = unwrap(ownedResult, "Failed to load lists");
  const memberRows = unwrap(memberRowsResult, "Failed to load list memberships");

  const roleByListId = new Map(memberRows.map((m) => [m.list_id, m.role]));
  const ownedIds = new Set(owned.map((l) => l.id));
  const sharedIds = memberRows.map((m) => m.list_id).filter((id) => !ownedIds.has(id));

  const shared = sharedIds.length
    ? unwrap(
        await supabase.from("lists").select("*").in("id", sharedIds),
        "Failed to load shared lists",
      )
    : [];

  const withRoles: ListWithRole[] = [
    ...owned.map((l) => ({ ...l, myRole: roleByListId.get(l.id) ?? "owner" })),
    ...shared.map((l) => ({ ...l, myRole: roleByListId.get(l.id) ?? "viewer" })),
  ];

  return withRoles.sort(
    (a, b) => +new Date(b.created_at ?? 0) - +new Date(a.created_at ?? 0),
  );
}

export async function getList(id: string): Promise<ListWithItems | null> {
  return unwrapMaybe(
    await supabase
      .from("lists")
      .select(LIST_WITH_ITEMS)
      .eq("id", id)
      .maybeSingle(),
    "Failed to load list",
  ) as ListWithItems | null;
}

/** Direct existence check — deliberately not derived from getList()'s
 * nested list_items embed. Simpler and cheaper (no need to pull the whole
 * list plus every item's full issue/volume/series/creator relations just
 * to answer one boolean), and sidesteps embedded-resource RLS/PostgREST
 * quirks entirely by querying list_items itself instead of through a join. */
export async function isIssueInList(
  listId: string,
  issueId: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from("list_items")
    .select("issue_id")
    .eq("list_id", listId)
    .eq("issue_id", issueId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return !!data;
}

export interface CreateListInput {
  name: string;
  description?: string | null;
  type?: ListInsert["type"];
  visibility?: ListInsert["visibility"];
}

export async function createList(input: CreateListInput): Promise<ListRow> {
  const uid = await requireUserId();
  const list = await unwrap<ListRow>(
    await supabase
      .from("lists")
      .insert({
        owner_id: uid,
        name: input.name,
        description: input.description ?? null,
        type: input.type ?? "custom",
        visibility: input.visibility ?? "private",
      })
      .select("*")
      .single(),
    "Failed to create list",
  );

  // Membership-gated policies (list_items, list_members) check for a
  // list_members row, not lists.owner_id directly — register the owner as
  // one now so future membership-based features work without every policy
  // needing its own owner_id fallback. Non-fatal: owner_id-based RLS
  // fallbacks already grant the owner full access regardless.
  const { error: memberError } = await supabase
    .from("list_members")
    .insert({ list_id: list.id, user_id: uid, role: "owner" });
  if (memberError) {
    console.error("Failed to register list owner as a member", memberError);
  }

  return list;
}

export async function updateList(
  id: string,
  patch: ListUpdate,
): Promise<ListRow> {
  const { owner_id: _ignore, ...safe } = patch;
  void _ignore;
  return unwrap(
    await supabase.from("lists").update(safe).eq("id", id).select("*").single(),
    "Failed to update list",
  );
}

export async function deleteList(id: string): Promise<void> {
  const { error } = await supabase.from("lists").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

const DEFAULT_LIST_NAMES: Record<"wishlist" | "reading", string> = {
  wishlist: "Wishlist",
  reading: "Reading List",
};

/** Every user has at most one "wishlist" and one "reading" list — created
 * lazily on first use so actions like "add to wishlist" always have
 * somewhere to go without the user pre-creating it. */
export async function getOrCreateDefaultList(
  type: "wishlist" | "reading",
): Promise<ListRow> {
  const uid = await requireUserId();
  const existing = await unwrapMaybe(
    await supabase
      .from("lists")
      .select("*")
      .eq("owner_id", uid)
      .eq("type", type)
      .maybeSingle(),
    "Failed to load list",
  );
  if (existing) return existing;

  return createList({ name: DEFAULT_LIST_NAMES[type], type });
}

export async function addIssueToList(
  listId: string,
  issueId: string,
): Promise<void> {
  // Plain insert, not upsert: list_items' primary key is (list_id,
  // issue_id) with no other mutable columns worth "updating", so there's
  // no real upsert semantics needed here — just "does this row exist".
  // Upserting without onConflict resolves to INSERT ... ON CONFLICT DO
  // UPDATE, and that implicit UPDATE path needs its own RLS policy (which
  // this table doesn't have) even though nothing is actually changing —
  // confirmed live, re-adding an issue already in a list 403'd. A 23505
  // (unique_violation) here just means it's already in the list, which
  // isn't an error from the caller's point of view.
  const { error } = await supabase
    .from("list_items")
    .insert({ list_id: listId, issue_id: issueId });
  if (error && error.code !== "23505") {
    throw new Error(error.message);
  }
}

/** Bulk version (e.g. "add #2-9 to my wishlist" from a volume page).
 * Pre-filters out issues already in the list rather than inserting
 * everything and swallowing 23505 like the single-issue version above —
 * a multi-row insert is one SQL statement, so a single conflicting row
 * would abort the *entire* batch, not just that row. */
export async function bulkAddIssuesToList(
  listId: string,
  issueIds: string[],
): Promise<void> {
  if (issueIds.length === 0) return;
  const existing = unwrap(
    await supabase
      .from("list_items")
      .select("issue_id")
      .eq("list_id", listId)
      .in("issue_id", issueIds),
    "Failed to check existing list items",
  );
  const existingIds = new Set(existing.map((e) => e.issue_id));
  const toInsert = issueIds.filter((id) => !existingIds.has(id));
  if (toInsert.length === 0) return;

  const { error } = await supabase
    .from("list_items")
    .insert(toInsert.map((issueId) => ({ list_id: listId, issue_id: issueId })));
  if (error) throw new Error(error.message);
}

export async function removeIssueFromList(
  listId: string,
  issueId: string,
): Promise<void> {
  const { error } = await supabase
    .from("list_items")
    .delete()
    .eq("list_id", listId)
    .eq("issue_id", issueId);
  if (error) throw new Error(error.message);
}

// ---------- Collaborators ----------
// list_members.user_id references auth.users, not public.profiles, so
// there's no FK PostgREST can embed a join through — fetch members, then
// fetch their profiles by id, and merge.
export async function listListMembers(
  listId: string,
): Promise<ListMemberWithProfile[]> {
  const members = unwrap(
    await supabase
      .from("list_members")
      .select("*")
      .eq("list_id", listId)
      .order("joined_at", { ascending: true }),
    "Failed to load collaborators",
  );
  if (members.length === 0) return [];

  const profiles = unwrap(
    await supabase
      .from("profiles")
      .select("*")
      .in("id", members.map((m) => m.user_id)),
    "Failed to load collaborator profiles",
  );
  const profileById = new Map(profiles.map((p) => [p.id, p]));
  return members.map((m) => ({ ...m, profile: profileById.get(m.user_id) ?? null }));
}

export async function addListMember(
  listId: string,
  userId: string,
  role: ListMemberRole,
): Promise<void> {
  const { error } = await supabase
    .from("list_members")
    .insert({ list_id: listId, user_id: userId, role });
  if (error) throw new Error(error.message);
}

export async function removeListMember(
  listId: string,
  userId: string,
): Promise<void> {
  const { error } = await supabase
    .from("list_members")
    .delete()
    .eq("list_id", listId)
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
}
