import { getSupabaseServerClient } from "@/integrations/supabase/server-client";
import { ServiceError } from "@/lib/types";

/** Resolve the caller's authenticated user server-side, or throw. Kept
 * separate from `_utils.ts`'s client-side `requireUserId` — this one pulls
 * in `@tanstack/react-start/server`, so only server-fn files should import
 * it, not anything also used from the browser. */
export async function requireServerUser(): Promise<{ id: string }> {
  const server = getSupabaseServerClient();
  const { data, error } = await server.auth.getUser();
  if (error || !data.user) {
    throw new ServiceError("Not authenticated", { code: "UNAUTHENTICATED" });
  }
  return data.user;
}

/** Same gate as `requireServerUser`, for call sites that only need to know
 * the caller is signed in and don't need the id itself. */
export async function requireAuthenticatedUser(): Promise<void> {
  await requireServerUser();
}
