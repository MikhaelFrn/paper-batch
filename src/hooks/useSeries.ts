import { useQuery } from "@tanstack/react-query";
import type { Series, SeriesWithPublisher } from "@/lib/types";
import {
  getSeries,
  listSeries,
  listSeriesByPublisher,
} from "@/services/series";
import { queryKeys } from "./queryKeys";

export function useSeriesList() {
  return useQuery<SeriesWithPublisher[]>({
    queryKey: queryKeys.series.list(),
    queryFn: listSeries,
  });
}

export function useSeriesByPublisher(publisherId: string | undefined) {
  return useQuery<Series[]>({
    queryKey: queryKeys.series.byPublisher(publisherId ?? "unknown"),
    queryFn: () => listSeriesByPublisher(publisherId as string),
    enabled: !!publisherId,
  });
}

export function useSeries(id: string | undefined) {
  return useQuery<SeriesWithPublisher | null>({
    queryKey: queryKeys.series.detail(id ?? "unknown"),
    queryFn: () => getSeries(id as string),
    enabled: !!id,
  });
}
