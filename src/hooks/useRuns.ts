import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { RelationshipType, Run, RunVerification, RunWithItems, RunWithRelations } from "@/lib/types";
import {
  analyzeVolume,
  createRunRelationship,
  deleteRunRelationship,
  getRun,
  listRunsForIssue,
  listRunsForVolume,
  searchRunsForLinking,
} from "@/services/runs";
import { listRunVerifications, unverifyRun, verifyRun } from "@/services/runVerifications";
import { queryKeys } from "./queryKeys";

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
      createRunRelationship({ data: input }),
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
      deleteRunRelationship({ data: { id: input.id } }),
    onSuccess: (_result, vars) => {
      qc.invalidateQueries({ queryKey: queryKeys.runs.detail(vars.sourceRunId) });
      qc.invalidateQueries({ queryKey: queryKeys.runs.detail(vars.targetRunId) });
    },
  });
}

export function useRunVerifications(runId: string | undefined) {
  return useQuery<RunVerification[]>({
    queryKey: queryKeys.runs.verifications(runId ?? "unknown"),
    queryFn: () => listRunVerifications(runId as string),
    enabled: !!runId,
  });
}

export function useToggleRunVerification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ runId, isVerified }: { runId: string; isVerified: boolean }) =>
      isVerified ? unverifyRun(runId) : verifyRun(runId),
    onSuccess: (_result, vars) => {
      qc.invalidateQueries({ queryKey: queryKeys.runs.verifications(vars.runId) });
    },
  });
}

/** Runs the full derivation pipeline for a volume: imports every issue
 * (one ComicVine call each — the expensive part), derives run segments
 * from the writer sequence, and persists them. */
export function useAnalyzeVolume() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { volumeDetailUrl: string; issueRange?: { from: number; to: number }; fullRescan?: boolean }) =>
      analyzeVolume({ data: input }),
    onSuccess: (_result, _vars, _ctx) => {
      qc.invalidateQueries({ queryKey: queryKeys.runs.all });
    },
  });
}
