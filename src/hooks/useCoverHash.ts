import { useMutation } from "@tanstack/react-query";
import { backfillCoverHashes, findCoverMatches } from "@/services/coverHash";

export function useFindCoverMatches() {
  return useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append("image", file);
      return findCoverMatches({ data: formData });
    },
  });
}

export function useBackfillCoverHashes() {
  return useMutation({
    mutationFn: () => backfillCoverHashes(),
  });
}
