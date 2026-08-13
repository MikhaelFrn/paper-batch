import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { ServiceError } from "@/lib/types";

export interface SignInParams { email: string; password: string }
export interface SignUpParams {
  email: string;
  password: string;
  username?: string;
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
    options: { 
      data: { username: params.username ?? null, }, 
    }
  });
  if (error) raise("Sign up failed", error);
  if (!data.user) raise("Sign up failed: no user returned", error);
  if (params.username) {
    await supabase
      .from("profiles")
      .update({ username: params.username })
      .eq("id", data.user.id);
  }
  return { user: data.user, session: data.session };
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) raise("Sign out failed", error);
}

/** Redirects to Google's consent screen; Supabase handles the OAuth
 * exchange and sends the browser back to /auth/callback with either a
 * session-bearing `code` or an `error` param. `signInWithOAuth` performs
 * the redirect itself (default `skipBrowserRedirect: false`) — this
 * function's promise never really "completes" from the caller's
 * perspective, the page just navigates away. */
export async function signInWithGoogle(): Promise<void> {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${window.location.origin}/auth/callback` },
  });
  if (error) raise("Google sign-in failed", error);
}

export async function requestPasswordReset(email: string): Promise<void> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  if (error) raise("Password reset failed", error);
}

export async function getCurrentUser(): Promise<User | null> {
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data.user ?? null;
}

export interface UpdateAuthUserParams {
  email?: string;
  password?: string;
}

export async function updateAuthUser(
  params: UpdateAuthUserParams,
): Promise<User> {
  const { data, error } = await supabase.auth.updateUser({
    email: params.email,
    password: params.password,
  });

  if (error || !data.user) {
    raise("Failed to update account.", error);
  }

  return data.user;
}
