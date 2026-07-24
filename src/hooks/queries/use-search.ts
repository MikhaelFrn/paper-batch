import { useQuery } from "@tanstack/react-query";
import { searchService } from "@/services/search";
import { queryKeys } from "./keys";

export function useSearch(q: string) {
  return useQuery({
    queryKey: queryKeys.search(q),
    queryFn: () => searchService.query(q),
    enabled: q.trim().length > 0,
  });
}
