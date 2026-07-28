import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Session, User } from "@supabase/supabase-js";
import {
  getCurrentSession,
  getCurrentUser,
  requestPasswordReset,
  signInWithPassword,
  signOut,
  signUpWithPassword,
  type SignInParams,
  type SignUpParams,
} from "@/services/auth";
import { queryKeys } from "./queryKeys";

export function useCurrentUser() {
  return useQuery<User | null>({
    queryKey: queryKeys.auth.user(),
    queryFn: getCurrentUser,
  });
}

export function useCurrentSession() {
  return useQuery<Session | null>({
    queryKey: queryKeys.auth.session(),
    queryFn: getCurrentSession,
  });
}

export function useSignIn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: SignInParams) => signInWithPassword(params),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.auth.all });
      qc.invalidateQueries({ queryKey: queryKeys.profiles.me() });
    },
  });
}

export function useSignUp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: SignUpParams) => signUpWithPassword(params),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.auth.all });
    },
  });
}

export function useSignOut() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => signOut(),
    onSuccess: () => {
      qc.clear();
    },
  });
}

export function useRequestPasswordReset() {
  return useMutation({
    mutationFn: (email: string) => requestPasswordReset(email),
  });
}
