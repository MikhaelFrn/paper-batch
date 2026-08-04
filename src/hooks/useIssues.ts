import { useQuery } from "@tanstack/react-query";
import type { IssueWithRelations } from "@/lib/types";
import {
  getIssue,
  listIssuesByVolume,
  listRecentIssues,
} from "@/services/issues";
import { queryKeys } from "./queryKeys";

export function useRecentIssues(limit?: number) {
  return useQuery<IssueWithRelations[]>({
    queryKey: queryKeys.issues.recent(limit),
    queryFn: () => listRecentIssues(limit),
  });
}

export function useIssuesByVolume(volumeId: string | undefined) {
  return useQuery<IssueWithRelations[]>({
    queryKey: queryKeys.issues.byVolume(volumeId ?? "unknown"),
    queryFn: () => listIssuesByVolume(volumeId as string),
    enabled: !!volumeId,
  });
}

export function useIssue(id: string | undefined) {
  return useQuery<IssueWithRelations | null>({
    queryKey: queryKeys.issues.detail(id ?? "unknown"),
    queryFn: () => getIssue(id as string),
    enabled: !!id,
  });
}
