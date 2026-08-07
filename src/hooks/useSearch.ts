import { useQuery, keepPreviousData } from "@tanstack/react-query";
import type { SearchResults } from "@/lib/types";
import { notifySearchPerformed, searchAll, type SearchOptions } from "@/services/search";
import { queryKeys } from "./queryKeys";

export function useSearch(query: string, options: SearchOptions = {}) {
  const trimmed = query.trim();
  return useQuery<SearchResults>({
    queryKey: queryKeys.search.query(trimmed, options.limit),
    queryFn: async () => {
      const results = await searchAll(trimmed, options);
      // Best-effort and never awaited — counting this search (and maybe
      // triggering maintenance from it) must never delay showing results.
      notifySearchPerformed().catch((e) => console.error("Search counter notify failed:", e));
      return results;
    },
    enabled: trimmed.length > 0,
    placeholderData: keepPreviousData,
  });
}
