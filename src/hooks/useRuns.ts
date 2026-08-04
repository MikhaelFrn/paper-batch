import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Run, RunWithItems } from "@/lib/types";
import {
  analyzeVolume,
  getRun,
  listRunsBySeries,
  listRunsForIssue,
  listRunsForVolume,
} from "@/services/runs";
import { queryKeys } from "./queryKeys";

export function useRunsBySeries(seriesId: string | undefined) {
  return useQuery<Run[]>({
    queryKey: queryKeys.runs.bySeries(seriesId ?? "unknown"),
    queryFn: () => listRunsBySeries(seriesId as string),
    enabled: !!seriesId,
  });
}

export function useRunsForVolume(volumeId: string | undefined) {
  return useQuery<RunWithItems[]>({
    queryKey: queryKeys.runs.byVolume(volumeId ?? "unknown"),
    queryFn: () => listRunsForVolume(volumeId as string),
    enabled: !!volumeId,
  });
}

export function useRunsForIssue(issueId: string | undefined) {
  return useQuery<RunWithItems[]>({
    queryKey: queryKeys.runs.byIssue(issueId ?? "unknown"),
    queryFn: () => listRunsForIssue(issueId as string),
    enabled: !!issueId,
  });
}

export function useRun(id: string | undefined) {
  return useQuery<RunWithItems | null>({
    queryKey: queryKeys.runs.detail(id ?? "unknown"),
    queryFn: () => getRun(id as string),
    enabled: !!id,
  });
}

/** Runs the full derivation pipeline for a volume: imports every issue
 * (one ComicVine call each — the expensive part), derives run segments
 * from the writer sequence, and persists them. */
export function useAnalyzeVolume() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { volumeDetailUrl: string }) => analyzeVolume({ data: input }),
    onSuccess: (_result, _vars, _ctx) => {
      qc.invalidateQueries({ queryKey: queryKeys.runs.all });
    },
  });
}
