import { useQuery } from "@tanstack/react-query";
import type { Publisher } from "@/lib/types";
import { listPublishers } from "@/services/publishers";
import { queryKeys } from "./queryKeys";

export function usePublishers() {
  return useQuery<Publisher[]>({
    queryKey: queryKeys.publishers.list(),
    queryFn: listPublishers,
  });
}
