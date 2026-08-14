import { useMutation } from "@tanstack/react-query";
import { findCoverMatches } from "@/services/coverHash";

export function useFindCoverMatches() {
  return useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append("image", file);
      return findCoverMatches({ data: formData });
    },
  });
}
