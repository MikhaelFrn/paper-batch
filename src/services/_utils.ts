import type { PostgrestError } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { ServiceError } from "@/lib/types";

/** Throw a normalized ServiceError from a Supabase PostgrestError. */
export function throwIfError(
  error: PostgrestError | null,
  fallbackMessage: string,
): void {
  if (!error) return;
  throw new ServiceError(error.message || fallbackMessage, {
    code: error.code,
    cause: error,
  });
}

/** Unwrap `{ data, error }` into `data`, throwing ServiceError on failure. */
export function unwrap<T>(
  result: { data: T | null; error: PostgrestError | null },
  fallbackMessage: string,
): T {
  throwIfError(result.error, fallbackMessage);
  if (result.data === null) {
    throw new ServiceError(fallbackMessage, { code: "NOT_FOUND" });
  }
  return result.data;
}

/** Same as `unwrap` but returns `null` instead of throwing on NOT_FOUND. */
export function unwrapMaybe<T>(
  result: { data: T | null; error: PostgrestError | null },
  fallbackMessage: string,
): T | null {
  throwIfError(result.error, fallbackMessage);
  return result.data;
}

/** Resolve the authenticated user's id or throw. Never trust the caller. */
export async function requireUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    throw new ServiceError(error.message, { code: "AUTH_ERROR", cause: error });
  }
  const id = data.user?.id;
  if (!id) {
    throw new ServiceError("Not authenticated", { code: "UNAUTHENTICATED" });
  }
  return id;
}
