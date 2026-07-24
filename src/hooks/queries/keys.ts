// Central query key factory keeps invalidations consistent across the app.
import type { ComicsQuery } from "@/services/comics";

export const queryKeys = {
  auth: {
    user: ["auth", "user"] as const,
  },
  profile: {
    current: ["profile", "current"] as const,
    stats: ["profile", "stats"] as const,
  },
  comics: {
    all: ["comics"] as const,
    list: (q: ComicsQuery = {}) => ["comics", "list", q] as const,
    byId: (id: string) => ["comics", "detail", id] as const,
    related: (id: string) => ["comics", "related", id] as const,
    newArrivals: (publisher?: string | null) => ["comics", "new-arrivals", publisher ?? null] as const,
    recent: (limit: number) => ["comics", "recent", limit] as const,
    wishlist: ["comics", "wishlist"] as const,
    favorites: ["comics", "favorites"] as const,
    readingProgress: ["comics", "reading-progress"] as const,
  },
  lists: {
    all: ["lists"] as const,
    byId: (id: string) => ["lists", id] as const,
  },
  creators: {
    summary: ["creators", "summary"] as const,
  },
  search: (q: string) => ["search", q] as const,
};
