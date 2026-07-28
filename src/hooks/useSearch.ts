import { useQuery, keepPreviousData } from "@tanstack/react-query";
import type { SearchResults } from "@/lib/types";
import { searchAll, type SearchOptions } from "@/services/search";
import { queryKeys } from "./queryKeys";

export function useSearch(query: string, options: SearchOptions = {}) {
  const trimmed = query.trim();
  return useQuery<SearchResults>({
    queryKey: queryKeys.search.query(trimmed, options.limit),
    queryFn: () => searchAll(trimmed, options),
    enabled: trimmed.length > 0,
    placeholderData: keepPreviousData,
  });
}
