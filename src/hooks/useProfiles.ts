import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Profile, ProfileUpdate } from "@/lib/types";
import {
  getMyProfile,
  getProfile,
  searchProfilesByUsername,
  updateMyProfile,
} from "@/services/profiles";
import { uploadMyAvatar } from "@/services/avatars";
import { queryKeys } from "./queryKeys";

export function useSearchProfiles(query: string) {
  const trimmed = query.trim();
  return useQuery<Profile[]>({
    queryKey: queryKeys.profiles.search(trimmed),
    queryFn: () => searchProfilesByUsername(trimmed),
    enabled: trimmed.length > 0,
  });
}

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

export function useUploadMyAvatar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (file: Blob) => {
      const { url, objectKey } = await uploadMyAvatar(file);
      return updateMyProfile({ avatar_url: url, avatar_object_key: objectKey });
    },
    onSuccess: (profile) => {
      qc.invalidateQueries({ queryKey: queryKeys.profiles.me() });
      qc.invalidateQueries({ queryKey: queryKeys.profiles.detail(profile.id) });
    },
  });
}
