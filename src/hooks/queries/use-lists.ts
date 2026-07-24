import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listsService } from "@/services/lists";
import type { CustomList } from "@/services/types";
import { queryKeys } from "./keys";

export function useLists() {
  return useQuery({ queryKey: queryKeys.lists.all, queryFn: () => listsService.list() });
}

export function useList(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.lists.byId(id ?? ""),
    queryFn: () => listsService.getById(id!),
    enabled: !!id,
  });
}

export function useCreateList() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Omit<CustomList, "id">) => listsService.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.lists.all }),
  });
}

export function useUpdateList() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: string; patch: Partial<CustomList> }) => listsService.update(v.id, v.patch),
    onSuccess: (_data, v) => {
      qc.invalidateQueries({ queryKey: queryKeys.lists.all });
      qc.invalidateQueries({ queryKey: queryKeys.lists.byId(v.id) });
    },
  });
}

export function useDeleteList() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => listsService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.lists.all }),
  });
}
