import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Profile, ProfileUpdate } from "@/lib/types";
import {
  getMyProfile,
  getProfile,
  updateMyProfile,
  upsertMyProfile,
} from "@/services/profiles";
import { queryKeys } from "./queryKeys";

export function useProfile(userId: string | undefined) {
  return useQuery<Profile | null>({
    queryKey: queryKeys.profiles.detail(userId ?? "unknown"),
    queryFn: () => getProfile(userId as string),
    enabled: !!userId,
  });
}

export function useMyProfile() {
  return useQuery<Profile | null>({
    queryKey: queryKeys.profiles.me(),
    queryFn: getMyProfile,
  });
}

export function useUpdateMyProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: ProfileUpdate) => updateMyProfile(patch),
    onSuccess: (profile) => {
      qc.invalidateQueries({ queryKey: queryKeys.profiles.me() });
      qc.invalidateQueries({ queryKey: queryKeys.profiles.detail(profile.id) });
    },
  });
}

export function useUpsertMyProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: ProfileUpdate) => upsertMyProfile(patch),
    onSuccess: (profile) => {
      qc.invalidateQueries({ queryKey: queryKeys.profiles.me() });
      qc.invalidateQueries({ queryKey: queryKeys.profiles.detail(profile.id) });
    },
  });
}
