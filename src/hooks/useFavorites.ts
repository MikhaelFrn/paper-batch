import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Creator, Publisher, Run, Series } from "@/lib/types";
import {
  addFavoriteCreator,
  addFavoritePublisher,
  addFavoriteRun,
  addFavoriteSeries,
  listFavoriteCreators,
  listFavoritePublishers,
  listFavoriteRuns,
  listFavoriteSeries,
  removeFavoriteCreator,
  removeFavoritePublisher,
  removeFavoriteRun,
  removeFavoriteSeries,
} from "@/services/favorites";
import { queryKeys } from "./queryKeys";

// ---------- Series ----------
export function useFavoriteSeries() {
  return useQuery<Series[]>({
    queryKey: queryKeys.favorites.series(),
    queryFn: listFavoriteSeries,
  });
}

export function useToggleFavoriteSeries() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ seriesId, isFavorite }: { seriesId: string; isFavorite: boolean }) =>
      isFavorite ? removeFavoriteSeries(seriesId) : addFavoriteSeries(seriesId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.favorites.series() });
    },
  });
}

// ---------- Creators ----------
export function useFavoriteCreators() {
  return useQuery<Creator[]>({
    queryKey: queryKeys.favorites.creators(),
    queryFn: listFavoriteCreators,
  });
}

export function useToggleFavoriteCreator() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ creatorId, isFavorite }: { creatorId: string; isFavorite: boolean }) =>
      isFavorite ? removeFavoriteCreator(creatorId) : addFavoriteCreator(creatorId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.favorites.creators() });
    },
  });
}

// ---------- Publishers ----------
export function useFavoritePublishers() {
  return useQuery<Publisher[]>({
    queryKey: queryKeys.favorites.publishers(),
    queryFn: listFavoritePublishers,
  });
}

export function useToggleFavoritePublisher() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ publisherId, isFavorite }: { publisherId: string; isFavorite: boolean }) =>
      isFavorite
        ? removeFavoritePublisher(publisherId)
        : addFavoritePublisher(publisherId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.favorites.publishers() });
    },
  });
}

// ---------- Runs ----------
export function useFavoriteRuns() {
  return useQuery<Run[]>({
    queryKey: queryKeys.favorites.runs(),
    queryFn: listFavoriteRuns,
  });
}

export function useToggleFavoriteRun() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ runId, isFavorite }: { runId: string; isFavorite: boolean }) =>
      isFavorite ? removeFavoriteRun(runId) : addFavoriteRun(runId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.favorites.runs() });
    },
  });
}
