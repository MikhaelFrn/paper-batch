import { supabase } from "@/integrations/supabase/client";
import type { Profile, ProfileUpdate } from "@/lib/types";
import type { TablesInsert } from "@/integrations/supabase/database.types";
import { requireUserId, unwrap, unwrapMaybe } from "./_utils";

export async function getProfile(userId: string): Promise<Profile | null> {
  return unwrapMaybe(
    await supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
    "Failed to load profile",
  );
}

export async function getMyProfile(): Promise<Profile | null> {
  const uid = await requireUserId();
  return getProfile(uid);
}

export async function updateMyProfile(patch: ProfileUpdate): Promise<Profile> {
  const uid = await requireUserId();
  const { id: _ignore, ...safe } = patch;
  void _ignore;
  return unwrap(
    await supabase
      .from("profiles")
      .update({ ...safe, updated_at: new Date().toISOString() })
      .eq("id", uid)
      .select("*")
      .single(),
    "Failed to update profile",
  );
}

export async function upsertMyProfile(patch: ProfileUpdate): Promise<Profile> {
  const uid = await requireUserId();
  return unwrap(
    await supabase
      .from("profiles")
      .upsert({ ...patch, id: uid, updated_at: new Date().toISOString() })
      .select("*")
      .single(),
    "Failed to upsert profile",
  );
}

export async function createProfile(profile: TablesInsert<"profiles">): Promise<Profile> {
    const {
      id,
      username,
      display_name,
      avatar_url,
      bio,
    } = profile;

  return unwrap(
    await supabase
      .from("profiles")
      .insert({
        id,
        username,
        display_name,
        avatar_url,
        bio,
      })
      .select("*")
      .single(),
    "Failed to create profile",
  );
}
