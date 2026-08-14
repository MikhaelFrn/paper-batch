import { useQuery } from "@tanstack/react-query";
import type { SeriesWithPublisher } from "@/lib/types";
import { listSeries } from "@/services/series";
import { queryKeys } from "./queryKeys";

export function useSeriesList() {
  return useQuery<SeriesWithPublisher[]>({
    queryKey: queryKeys.series.list(),
    queryFn: listSeries,
  });
}
