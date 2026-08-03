import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ListRow, ListUpdate, ListWithItems } from "@/lib/types";
import {
  addIssueToList,
  createList,
  deleteList,
  getList,
  getOrCreateDefaultList,
  listMyLists,
  removeIssueFromList,
  updateList,
  type CreateListInput,
} from "@/services/lists";
import { queryKeys } from "./queryKeys";

export function useMyLists() {
  return useQuery<ListRow[]>({
    queryKey: queryKeys.lists.mine(),
    queryFn: listMyLists,
  });
}

export function useList(id: string | undefined) {
  return useQuery<ListWithItems | null>({
    queryKey: queryKeys.lists.detail(id ?? "unknown"),
    queryFn: () => getList(id as string),
    enabled: !!id,
  });
}

export function useCreateList() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateListInput) => createList(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.lists.mine() });
    },
  });
}

export function useUpdateList() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: ListUpdate }) =>
      updateList(id, patch),
    onSuccess: (list) => {
      qc.invalidateQueries({ queryKey: queryKeys.lists.mine() });
      qc.invalidateQueries({ queryKey: queryKeys.lists.detail(list.id) });
    },
  });
}

export function useDeleteList() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteList(id),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: queryKeys.lists.mine() });
      qc.removeQueries({ queryKey: queryKeys.lists.detail(id) });
    },
  });
}

/** Adds an issue to the user's default wishlist/reading list, creating that
 * list first if this is the first time they've used it. */
export function useAddIssueToDefaultList() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      type,
      issueId,
    }: {
      type: "wishlist" | "reading";
      issueId: string;
    }) => {
      const list = await getOrCreateDefaultList(type);
      await addIssueToList(list.id, issueId);
      return list;
    },
    onSuccess: (list) => {
      qc.invalidateQueries({ queryKey: queryKeys.lists.mine() });
      qc.invalidateQueries({ queryKey: queryKeys.lists.detail(list.id) });
    },
  });
}

export function useAddIssueToList() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ listId, issueId }: { listId: string; issueId: string }) =>
      addIssueToList(listId, issueId),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: queryKeys.lists.detail(vars.listId) });
    },
  });
}

export function useRemoveIssueFromList() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ listId, issueId }: { listId: string; issueId: string }) =>
      removeIssueFromList(listId, issueId),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: queryKeys.lists.detail(vars.listId) });
    },
  });
}
