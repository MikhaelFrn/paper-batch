import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";
import { comics, customLists, stats as mockStats } from "@/lib/mock-data";
import type { CollectionStats, Profile } from "./types";

const mockProfile: Profile = {
  id: "demo-user",
  username: "peterparker",
  displayName: "Peter Parker",
  bio: "Photographer. Web-slinger. Longbox devotee.",
};

export const profileService = {
  async getCurrentProfile(): Promise<Profile> {
    if (!isSupabaseConfigured) return mockProfile;
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return mockProfile;
    const { data } = await supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url, bio")
      .eq("id", user.user.id)
      .maybeSingle();
    if (!data) return { ...mockProfile, id: user.user.id };
    return {
      id: data.id,
      username: data.username,
      displayName: data.display_name,
      avatarUrl: data.avatar_url ?? undefined,
      bio: data.bio ?? undefined,
    };
  },

  async updateProfile(patch: Partial<Profile>): Promise<Profile> {
    if (!isSupabaseConfigured) return { ...mockProfile, ...patch };
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error("Not signed in");
    const { data, error } = await supabase
      .from("profiles")
      .update({
        username: patch.username,
        display_name: patch.displayName,
        avatar_url: patch.avatarUrl,
        bio: patch.bio,
      })
      .eq("id", user.user.id)
      .select("id, username, display_name, avatar_url, bio")
      .single();
    if (error) throw error;
    return {
      id: data.id,
      username: data.username,
      displayName: data.display_name,
      avatarUrl: data.avatar_url ?? undefined,
      bio: data.bio ?? undefined,
    };
  },

  async getStats(): Promise<CollectionStats> {
    if (!isSupabaseConfigured) return mockStats;
    // Aggregate from user_comics table when wired up.
    return {
      owned: comics.filter((c) => c.owned).length,
      read: comics.filter((c) => c.read).length,
      wishlist: comics.filter((c) => c.wishlist).length,
      favorites: comics.filter((c) => c.favorite).length,
      lists: customLists.length + 2,
      totalIssues: mockStats.totalIssues,
    };
  },
};
