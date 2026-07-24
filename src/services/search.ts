import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";
import { comics as mockComics, series as mockSeries } from "@/lib/mock-data";
import type { Comic } from "./types";

export interface SearchResults {
  comics: Comic[];
  series: string[];
  writers: string[];
  artists: string[];
  characters: string[];
}

export const searchService = {
  async query(q: string): Promise<SearchResults> {
    const s = q.trim().toLowerCase();
    if (!s) return { comics: [], series: [], writers: [], artists: [], characters: [] };

    if (!isSupabaseConfigured) {
      const cs = mockComics.filter(
        (c) =>
          c.title.toLowerCase().includes(s) ||
          c.series.toLowerCase().includes(s) ||
          c.writers.some((w) => w.toLowerCase().includes(s)) ||
          c.artists.some((a) => a.toLowerCase().includes(s)) ||
          c.characters.some((ch) => ch.toLowerCase().includes(s)),
      );
      return {
        comics: cs,
        series: mockSeries.filter((x) => x.toLowerCase().includes(s)),
        writers: [...new Set(mockComics.flatMap((c) => c.writers))].filter((x) =>
          x.toLowerCase().includes(s),
        ),
        artists: [...new Set(mockComics.flatMap((c) => c.artists))].filter((x) =>
          x.toLowerCase().includes(s),
        ),
        characters: [...new Set(mockComics.flatMap((c) => c.characters))].filter((x) =>
          x.toLowerCase().includes(s),
        ),
      };
    }
    const { data } = await supabase
      .from("comics")
      .select("*")
      .ilike("title", `%${s}%`)
      .limit(50);
    return {
      comics: (data as Comic[] | null) ?? [],
      series: [],
      writers: [],
      artists: [],
      characters: [],
    };
  },
};
