import { createServerFn } from "@tanstack/react-start";
import { getSupabaseServiceClient } from "@/integrations/supabase/service-client";
import { ServiceError } from "@/lib/types";
import { AVATAR_BUCKET } from "./avatars";
import { requireServerUser } from "./_serverUtils";

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
 * object would otherwise keep being served from its public URL forever
 * after the account is gone. Removed explicitly first — a no-op, no
 * error, if the user never uploaded one. Reads the actual object key from
 * the profile rather than assuming it's the user's own id: avatars
 * uploaded after 20260815000000_decouple_avatar_filename_from_user_id.sql
 * live under a random key instead, tracked in avatar_object_key; falling
 * back to the id covers avatars uploaded before that migration, which
 * never got one recorded. */
export const deleteMyAccount = createServerFn({ method: "POST" }).handler(
  async (): Promise<void> => {
    const user = await requireServerUser();

    const service = getSupabaseServiceClient();
    const { data: profile } = await service
      .from("profiles")
      .select("avatar_object_key")
      .eq("id", user.id)
      .maybeSingle();
    await service.storage.from(AVATAR_BUCKET).remove([profile?.avatar_object_key ?? user.id]);

    const { error } = await service.auth.admin.deleteUser(user.id);
    if (error) {
      throw new ServiceError("Failed to delete account", { cause: error });
    }
  },
);
