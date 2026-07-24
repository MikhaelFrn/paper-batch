import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { comicsService, type ComicsQuery } from "@/services/comics";
import { queryKeys } from "./keys";

export function useComics(query: ComicsQuery = {}) {
  return useQuery({
    queryKey: queryKeys.comics.list(query),
    queryFn: () => comicsService.list(query),
  });
}

export function useComic(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.comics.byId(id ?? ""),
    queryFn: () => comicsService.getById(id!),
    enabled: !!id,
  });
}

export function useRelatedComics(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.comics.related(id ?? ""),
    queryFn: async () => {
      const c = await comicsService.getById(id!);
      return c ? comicsService.related(c) : [];
    },
    enabled: !!id,
  });
}

export function useNewArrivals(publisher?: string | null) {
  return useQuery({
    queryKey: queryKeys.comics.newArrivals(publisher),
    queryFn: () => comicsService.newArrivals(publisher ?? null),
  });
}

export function useRecentlyAdded(limit = 6) {
  return useQuery({
    queryKey: queryKeys.comics.recent(limit),
    queryFn: () => comicsService.recentlyAdded(limit),
  });
}

export function useWishlist() {
  return useQuery({
    queryKey: queryKeys.comics.wishlist,
    queryFn: () => comicsService.wishlist(),
  });
}

export function useFavorites() {
  return useQuery({
    queryKey: queryKeys.comics.favorites,
    queryFn: () => comicsService.favorites(),
  });
}

export function useReadingProgress() {
  return useQuery({
    queryKey: queryKeys.comics.readingProgress,
    queryFn: () => comicsService.readingProgress(),
  });
}

export function useSetComicFlag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: string; flag: "owned" | "read" | "wishlist" | "favorite"; value: boolean }) =>
      comicsService.setFlag(v.id, v.flag, v.value),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.comics.all });
      qc.invalidateQueries({ queryKey: queryKeys.profile.stats });
    },
  });
}
