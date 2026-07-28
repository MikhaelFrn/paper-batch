import { useQuery } from "@tanstack/react-query";
import type { Publisher } from "@/lib/types";
import { getPublisher, listPublishers } from "@/services/publishers";
import { queryKeys } from "./queryKeys";

export function usePublishers() {
  return useQuery<Publisher[]>({
    queryKey: queryKeys.publishers.list(),
    queryFn: listPublishers,
  });
}

export function usePublisher(id: string | undefined) {
  return useQuery<Publisher | null>({
    queryKey: queryKeys.publishers.detail(id ?? "unknown"),
    queryFn: () => getPublisher(id as string),
    enabled: !!id,
  });
}
