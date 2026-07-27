import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { ServiceError } from "@/lib/types";

export interface SignInParams { email: string; password: string }
export interface SignUpParams {
  email: string;
  password: string;
  displayName?: string;
}

function raise(message: string, cause: unknown): never {
  throw new ServiceError(message, { cause });
}

export async function signInWithPassword(
  params: SignInParams,
): Promise<{ user: User; session: Session }> {
  const { data, error } = await supabase.auth.signInWithPassword(params);
  if (error || !data.session || !data.user) raise("Sign in failed", error);
  return { user: data.user!, session: data.session! };
}

export async function signUpWithPassword(
  params: SignUpParams,
): Promise<{ user: User | null; session: Session | null }> {
  const { data, error } = await supabase.auth.signUp({
    email: params.email,
    password: params.password,
    options: params.displayName
      ? { data: { display_name: params.displayName } }
      : undefined,
  });
  if (error) raise("Sign up failed", error);
  return { user: data.user, session: data.session };
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) raise("Sign out failed", error);
}

export async function requestPasswordReset(email: string): Promise<void> {
  const { error } = await supabase.auth.resetPasswordForEmail(email);
  if (error) raise("Password reset failed", error);
}

export async function getCurrentUser(): Promise<User | null> {
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data.user ?? null;
}

export async function getCurrentSession(): Promise<Session | null> {
  const { data } = await supabase.auth.getSession();
  return data.session ?? null;
}
