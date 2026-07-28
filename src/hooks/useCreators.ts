import { useQuery } from "@tanstack/react-query";
import type { Creator } from "@/lib/types";
import { getCreator, listCreators } from "@/services/creators";
import { queryKeys } from "./queryKeys";

export function useCreators(limit?: number) {
  return useQuery<Creator[]>({
    queryKey: queryKeys.creators.list(limit),
    queryFn: () => listCreators(limit),
  });
}

export function useCreator(id: string | undefined) {
  return useQuery<Creator | null>({
    queryKey: queryKeys.creators.detail(id ?? "unknown"),
    queryFn: () => getCreator(id as string),
    enabled: !!id,
  });
}
