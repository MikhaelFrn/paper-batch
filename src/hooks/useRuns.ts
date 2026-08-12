import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { RelationshipType, Run, RunWithItems, RunWithRelations } from "@/lib/types";
import {
  analyzeVolume,
  createRunRelationship,
  deleteRunRelationship,
  getRun,
  listRunsBySeries,
  listRunsForIssue,
  listRunsForVolume,
  searchRunsForLinking,
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
  return useQuery<RunWithRelations | null>({
    queryKey: queryKeys.runs.detail(id ?? "unknown"),
    queryFn: () => getRun(id as string),
    enabled: !!id,
  });
}

/** Runs matching `query` by name, for the run-detail page's "link this run
 * to…" picker. `excludeRunId` keeps the run itself out of its own results. */
export function useSearchRunsForLinking(query: string, excludeRunId: string) {
  const trimmed = query.trim();
  return useQuery<Run[]>({
    queryKey: queryKeys.runs.searchForLinking(trimmed, excludeRunId),
    queryFn: () => searchRunsForLinking(trimmed, excludeRunId),
    enabled: trimmed.length > 0,
  });
}

export function useCreateRunRelationship() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { sourceRunId: string; targetRunId: string; relationship: RelationshipType }) =>
      createRunRelationship(input.sourceRunId, input.targetRunId, input.relationship),
    onSuccess: (_result, vars) => {
      qc.invalidateQueries({ queryKey: queryKeys.runs.detail(vars.sourceRunId) });
      qc.invalidateQueries({ queryKey: queryKeys.runs.detail(vars.targetRunId) });
    },
  });
}

export function useDeleteRunRelationship() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: string; sourceRunId: string; targetRunId: string }) =>
      deleteRunRelationship(input.id),
    onSuccess: (_result, vars) => {
      qc.invalidateQueries({ queryKey: queryKeys.runs.detail(vars.sourceRunId) });
      qc.invalidateQueries({ queryKey: queryKeys.runs.detail(vars.targetRunId) });
    },
  });
}

/** Runs the full derivation pipeline for a volume: imports every issue
 * (one ComicVine call each — the expensive part), derives run segments
 * from the writer sequence, and persists them. */
export function useAnalyzeVolume() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { volumeDetailUrl: string; issueRange?: { from: number; to: number } }) =>
      analyzeVolume({ data: input }),
    onSuccess: (_result, _vars, _ctx) => {
      qc.invalidateQueries({ queryKey: queryKeys.runs.all });
    },
  });
}
