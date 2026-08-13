import { createServerFn } from "@tanstack/react-start";
import { getSupabaseServerClient } from "@/integrations/supabase/server-client";
import { getSupabaseServiceClient } from "@/integrations/supabase/service-client";
import { ServiceError } from "@/lib/types";
import { AVATAR_BUCKET } from "./avatars";

/** Permanently deletes the CALLER's own account — reads the target id from
 * the caller's own session, never from client input, so there's no way to
 * delete anyone but yourself. Everything downstream (profile, collection,
 * favorites, owned lists and their items/members, membership on lists you
 * don't own) is handled by the schema's own ON DELETE CASCADE — confirmed
 * live before building this that cascading already works correctly across
 * every user-referencing table, so this only needs to remove the
 * `auth.users` row itself via the Admin API (service-role only, hence a
 * server function rather than a direct client call).
 *
 * Storage isn't a table, so the cascade never touches it: the avatar
 * object (path = the user's own id) would otherwise keep being served
 * from its public URL forever after the account is gone. Removed
 * explicitly first — a no-op, no error, if the user never uploaded one. */
export const deleteMyAccount = createServerFn({ method: "POST" }).handler(
  async (): Promise<void> => {
    const server = getSupabaseServerClient();
    const { data, error: authError } = await server.auth.getUser();
    if (authError || !data.user) {
      throw new ServiceError("Not authenticated", { code: "UNAUTHENTICATED" });
    }

    const service = getSupabaseServiceClient();
    await service.storage.from(AVATAR_BUCKET).remove([data.user.id]);

    const { error } = await service.auth.admin.deleteUser(data.user.id);
    if (error) {
      throw new ServiceError("Failed to delete account", { cause: error });
    }
  },
);
