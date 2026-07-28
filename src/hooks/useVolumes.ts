import { useQuery } from "@tanstack/react-query";
import type { Volume } from "@/lib/types";
import { getVolume, listVolumesBySeries } from "@/services/volumes";
import { queryKeys } from "./queryKeys";

export function useVolumesBySeries(seriesId: string | undefined) {
  return useQuery<Volume[]>({
    queryKey: queryKeys.volumes.bySeries(seriesId ?? "unknown"),
    queryFn: () => listVolumesBySeries(seriesId as string),
    enabled: !!seriesId,
  });
}

export function useVolume(id: string | undefined) {
  return useQuery<Volume | null>({
    queryKey: queryKeys.volumes.detail(id ?? "unknown"),
    queryFn: () => getVolume(id as string),
    enabled: !!id,
  });
}
