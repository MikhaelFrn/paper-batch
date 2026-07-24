import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { profileService } from "@/services/profile";
import type { Profile } from "@/services/types";
import { queryKeys } from "./keys";

export function useProfile() {
  return useQuery({
    queryKey: queryKeys.profile.current,
    queryFn: () => profileService.getCurrentProfile(),
  });
}

export function useCollectionStats() {
  return useQuery({
    queryKey: queryKeys.profile.stats,
    queryFn: () => profileService.getStats(),
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<Profile>) => profileService.updateProfile(patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.profile.current }),
  });
}
