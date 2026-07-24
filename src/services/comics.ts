import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";
import {
  comics as mockComics,
  publishers,
  readingProgress as mockProgress,
  relatedComics as mockRelated,
} from "@/lib/mock-data";
import type { Comic, ReadingProgress } from "./types";

export interface ComicsQuery {
  publishers?: string[];
  series?: string[];
  ownedOnly?: boolean;
  readOnly?: boolean;
  wishlistOnly?: boolean;
  favoriteOnly?: boolean;
  q?: string;
  sort?: "recent" | "title" | "publisher" | "release" | "alpha";
  limit?: number;
}

function applyQuery(list: Comic[], query: ComicsQuery): Comic[] {
  let out = list.slice();
  if (query.publishers?.length) out = out.filter((c) => query.publishers!.includes(c.publisher));
  if (query.series?.length) out = out.filter((c) => query.series!.includes(c.series));
  if (query.ownedOnly) out = out.filter((c) => c.owned);
  if (query.readOnly) out = out.filter((c) => c.read);
  if (query.wishlistOnly) out = out.filter((c) => c.wishlist);
  if (query.favoriteOnly) out = out.filter((c) => c.favorite);
  if (query.q) {
    const s = query.q.toLowerCase();
    out = out.filter(
      (c) =>
        c.title.toLowerCase().includes(s) ||
        c.series.toLowerCase().includes(s) ||
        c.writers.some((w) => w.toLowerCase().includes(s)) ||
        c.artists.some((a) => a.toLowerCase().includes(s)),
    );
  }
  switch (query.sort) {
    case "title":
    case "alpha":
      out.sort((a, b) => a.title.localeCompare(b.title));
      break;
    case "publisher":
      out.sort((a, b) => a.publisher.localeCompare(b.publisher));
      break;
    case "release":
      out.sort((a, b) => +new Date(b.releaseDate) - +new Date(a.releaseDate));
      break;
    case "recent":
      out.sort((a, b) => +new Date(b.addedDate) - +new Date(a.addedDate));
      break;
  }
  if (query.limit) out = out.slice(0, query.limit);
  return out;
}

export const comicsService = {
  async list(query: ComicsQuery = {}): Promise<Comic[]> {
    if (!isSupabaseConfigured) return applyQuery(mockComics, query);
    // TODO: replace with supabase.from("comics").select(...) once schema exists.
    const { data } = await supabase.from("comics").select("*").limit(query.limit ?? 500);
    return applyQuery((data as Comic[] | null) ?? mockComics, query);
  },

  async getById(id: string): Promise<Comic | null> {
    if (!isSupabaseConfigured) return mockComics.find((c) => c.id === id) ?? null;
    const { data } = await supabase.from("comics").select("*").eq("id", id).maybeSingle();
    return (data as Comic | null) ?? mockComics.find((c) => c.id === id) ?? null;
  },

  async related(comic: Comic): Promise<Comic[]> {
    if (!isSupabaseConfigured) return mockRelated(comic);
    return mockRelated(comic);
  },

  async newArrivals(publisher?: string | null): Promise<Comic[]> {
    return applyQuery(mockComics, {
      publishers: publisher ? [publisher] : undefined,
      sort: "release",
    });
  },

  async recentlyAdded(limit = 6): Promise<Comic[]> {
    return applyQuery(mockComics, { sort: "recent", limit });
  },

  async wishlist(): Promise<Comic[]> {
    return applyQuery(mockComics, { wishlistOnly: true });
  },

  async favorites(): Promise<Comic[]> {
    return applyQuery(mockComics, { favoriteOnly: true });
  },

  async readingProgress(): Promise<ReadingProgress[]> {
    return mockProgress;
  },

  async setFlag(id: string, flag: "owned" | "read" | "wishlist" | "favorite", value: boolean) {
    if (!isSupabaseConfigured) {
      const c = mockComics.find((x) => x.id === id);
      if (c) (c as any)[flag] = value;
      return;
    }
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error("Not signed in");
    await supabase.from("user_comics").upsert({
      user_id: user.user.id,
      comic_id: id,
      [flag]: value,
    });
  },

  publishers() {
    return publishers;
  },
};
