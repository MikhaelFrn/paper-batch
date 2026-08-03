import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import {
  getNewArrivals,
  importIssueFromComicVine,
  loadMoreComicVineIssues,
  searchComicVine,
  type ComicVineSearchResults,
} from "@/services/comicvine";
import type { CvRecentIssue } from "@/integrations/comicvine/client";
import { queryKeys } from "./queryKeys";

export function useNewArrivals() {
  return useQuery<CvRecentIssue[]>({
    queryKey: queryKeys.comicvine.newArrivals(),
    queryFn: () => getNewArrivals(),
    staleTime: 30 * 60_000,
    refetchOnWindowFocus: false,
  });
}

export function useComicVineSearch(query: string) {
  const trimmed = query.trim();
  return useQuery<ComicVineSearchResults>({
    queryKey: queryKeys.comicvine.search(trimmed),
    queryFn: () => searchComicVine({ data: trimmed }),
    enabled: trimmed.length > 0,
    placeholderData: keepPreviousData,
    staleTime: 60_000,
    // A background refetch (default behavior on window refocus) would hand
    // the search page a fresh `sampledVolumeIds`/`nextOffset` mid-session —
    // wasteful on CV's rate limit and, more importantly, exactly the kind
    // of refetch the "Load more" offset tracking must not be disrupted by.
    refetchOnWindowFocus: false,
  });
}

/** Pages further into the same matched volumes a search already found. */
export function useLoadMoreComicVineIssues() {
  return useMutation({
    mutationFn: (input: { volumeIds: number[]; offset: number }) =>
      loadMoreComicVineIssues({ data: input }),
  });
}

export function useImportComicVineIssue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { detailUrl: string }) =>
      importIssueFromComicVine({ data: input }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.search.all });
    },
  });
}
