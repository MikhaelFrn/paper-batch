import { supabase } from "@/integrations/supabase/client";
import type {
  ListInsert,
  ListRow,
  ListUpdate,
  ListWithItems,
} from "@/lib/types";
import { requireUserId, unwrap, unwrapMaybe } from "./_utils";

const LIST_WITH_ITEMS =
  "*, list_items(added_at, list_id, issue_id, issue:issues(*, volume:volumes(*, series:series(*, publisher:publishers(*))), issue_creators(role, creator:creators(*))))" as const;

export async function listMyLists(): Promise<ListRow[]> {
  const uid = await requireUserId();
  return unwrap(
    await supabase
      .from("lists")
      .select("*")
      .eq("owner_id", uid)
      .order("created_at", { ascending: false }),
    "Failed to load lists",
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

export interface CreateListInput {
  name: string;
  description?: string | null;
  type?: ListInsert["type"];
  visibility?: ListInsert["visibility"];
}

export async function createList(input: CreateListInput): Promise<ListRow> {
  const uid = await requireUserId();
  return unwrap(
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

export async function addIssueToList(
  listId: string,
  issueId: string,
): Promise<void> {
  const { error } = await supabase
    .from("list_items")
    .upsert({ list_id: listId, issue_id: issueId });
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
