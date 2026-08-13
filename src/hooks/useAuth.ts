import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { User } from "@supabase/supabase-js";
import {
  getCurrentUser,
  signInWithGoogle,
  signInWithPassword,
  signOut,
  signUpWithPassword,
  type SignInParams,
  type SignUpParams,
} from "@/services/auth";
import { deleteMyAccount } from "@/services/account";
import { queryKeys } from "./queryKeys";

export function useCurrentUser() {
  return useQuery<User | null>({
    queryKey: queryKeys.auth.user(),
    queryFn: getCurrentUser,
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

export function useSignInWithGoogle() {
  return useMutation({
    mutationFn: () => signInWithGoogle(),
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

/** Deletes the account, then signs out client-side — removing the
 * auth.users row doesn't invalidate the browser's own session cookie/local
 * storage, so without this the app would still think it's logged in with
 * a now-dangling session until something happened to trigger a re-check. */
export function useDeleteMyAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await deleteMyAccount();
      await signOut();
    },
    onSuccess: () => {
      qc.clear();
    },
  });
}
