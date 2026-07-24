import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";
import {
  artists,
  characters,
  favoriteArtists,
  favoriteWriters,
  teams,
  writers,
} from "@/lib/mock-data";
import type { CreatorSummary } from "./types";

export const creatorsService = {
  async summary(): Promise<CreatorSummary> {
    if (!isSupabaseConfigured) {
      return { writers, artists, favoriteWriters, favoriteArtists };
    }
    return { writers, artists, favoriteWriters, favoriteArtists };
  },

  async listWriters(): Promise<string[]> {
    if (!isSupabaseConfigured) return writers;
    const { data } = await supabase.from("creators").select("name").eq("role", "writer");
    return (data?.map((r) => r.name as string)) ?? writers;
  },

  async listArtists(): Promise<string[]> {
    if (!isSupabaseConfigured) return artists;
    const { data } = await supabase.from("creators").select("name").eq("role", "artist");
    return (data?.map((r) => r.name as string)) ?? artists;
  },

  async listCharacters(): Promise<string[]> {
    return characters;
  },

  async listTeams(): Promise<string[]> {
    return teams;
  },
};
