import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authService } from "@/services/auth";
import { queryKeys } from "./keys";

export function useAuthUser() {
  return useQuery({
    queryKey: queryKeys.auth.user,
    queryFn: () => authService.getUser(),
    staleTime: 30_000,
  });
}

export function useSignIn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { email: string; password: string }) => authService.signIn(v.email, v.password),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.auth.user }),
  });
}

export function useSignUp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { email: string; password: string }) => authService.signUp(v.email, v.password),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.auth.user }),
  });
}

export function useSignOut() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => authService.signOut(),
    onSuccess: () => qc.clear(),
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: (email: string) => authService.resetPassword(email),
  });
}
