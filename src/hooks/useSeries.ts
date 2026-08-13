import { useQuery } from "@tanstack/react-query";
import type { SeriesWithPublisher } from "@/lib/types";
import { getSeries, listSeries } from "@/services/series";
import { queryKeys } from "./queryKeys";

export function useSeriesList() {
  return useQuery<SeriesWithPublisher[]>({
    queryKey: queryKeys.series.list(),
    queryFn: listSeries,
  });
}

export function useSeries(id: string | undefined) {
  return useQuery<SeriesWithPublisher | null>({
    queryKey: queryKeys.series.detail(id ?? "unknown"),
    queryFn: () => getSeries(id as string),
    enabled: !!id,
  });
}
