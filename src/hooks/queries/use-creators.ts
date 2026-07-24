import { useQuery } from "@tanstack/react-query";
import { creatorsService } from "@/services/creators";
import { queryKeys } from "./keys";

export function useCreatorSummary() {
  return useQuery({
    queryKey: queryKeys.creators.summary,
    queryFn: () => creatorsService.summary(),
  });
}
