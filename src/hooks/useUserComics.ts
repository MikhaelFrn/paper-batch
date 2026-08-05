import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { UserCollectionEntry, UserComic } from "@/lib/types";
import {
  bulkSetOwned,
  deleteMyUserComic,
  getMyUserComicByIssue,
  listMyCollection,
  upsertMyUserComic,
  type UpsertUserComicInput,
} from "@/services/userComics";
import { queryKeys } from "./queryKeys";

export function useUserCollection() {
  return useQuery<UserCollectionEntry[]>({
    queryKey: queryKeys.userComics.collection(),
    queryFn: listMyCollection,
  });
}

export function useMyUserComicByIssue(issueId: string | undefined) {
  return useQuery<UserComic | null>({
    queryKey: queryKeys.userComics.byIssue(issueId ?? "unknown"),
    queryFn: () => getMyUserComicByIssue(issueId as string),
    enabled: !!issueId,
  });
}

export function useUpsertMyUserComic() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpsertUserComicInput) => upsertMyUserComic(input),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: queryKeys.userComics.collection() });
      qc.invalidateQueries({
        queryKey: queryKeys.userComics.byIssue(vars.issueId),
      });
    },
  });
}

export function useBulkSetOwned() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ issueIds, owned }: { issueIds: string[]; owned: boolean }) =>
      bulkSetOwned(issueIds, owned),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: queryKeys.userComics.collection() });
      for (const issueId of vars.issueIds) {
        qc.invalidateQueries({ queryKey: queryKeys.userComics.byIssue(issueId) });
      }
    },
  });
}

export function useDeleteMyUserComic() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (issueId: string) => deleteMyUserComic(issueId),
    onSuccess: (_data, issueId) => {
      qc.invalidateQueries({ queryKey: queryKeys.userComics.collection() });
      qc.invalidateQueries({
        queryKey: queryKeys.userComics.byIssue(issueId),
      });
    },
  });
}
