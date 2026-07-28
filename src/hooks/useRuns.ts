import { useQuery } from "@tanstack/react-query";
import type { Run, RunWithRelations } from "@/lib/types";
import { getRun, listRunsBySeries } from "@/services/runs";
import { queryKeys } from "./queryKeys";

export function useRunsBySeries(seriesId: string | undefined) {
  return useQuery<Run[]>({
    queryKey: queryKeys.runs.bySeries(seriesId ?? "unknown"),
    queryFn: () => listRunsBySeries(seriesId as string),
    enabled: !!seriesId,
  });
}

export function useRun(id: string | undefined) {
  return useQuery<RunWithRelations | null>({
    queryKey: queryKeys.runs.detail(id ?? "unknown"),
    queryFn: () => getRun(id as string),
    enabled: !!id,
  });
}
