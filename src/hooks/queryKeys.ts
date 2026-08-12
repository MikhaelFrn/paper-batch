// Centralized query key factory. Keep every key here so hooks and mutations
// invalidate the exact same cache entries.

export const queryKeys = {
  auth: {
    all: ["auth"] as const,
    user: () => [...queryKeys.auth.all, "user"] as const,
    session: () => [...queryKeys.auth.all, "session"] as const,
  },
  profiles: {
    all: ["profiles"] as const,
    detail: (userId: string) => [...queryKeys.profiles.all, userId] as const,
    me: () => [...queryKeys.profiles.all, "me"] as const,
    search: (query: string) => [...queryKeys.profiles.all, "search", query] as const,
  },
  publishers: {
    all: ["publishers"] as const,
    list: () => [...queryKeys.publishers.all, "list"] as const,
    detail: (id: string) => [...queryKeys.publishers.all, id] as const,
  },
  series: {
    all: ["series"] as const,
    list: () => [...queryKeys.series.all, "list"] as const,
    byPublisher: (publisherId: string) =>
      [...queryKeys.series.all, "publisher", publisherId] as const,
    detail: (id: string) => [...queryKeys.series.all, id] as const,
  },
  volumes: {
    all: ["volumes"] as const,
    bySeries: (seriesId: string) =>
      [...queryKeys.volumes.all, "series", seriesId] as const,
    detail: (id: string) => [...queryKeys.volumes.all, id] as const,
  },
  runs: {
    all: ["runs"] as const,
    bySeries: (seriesId: string) =>
      [...queryKeys.runs.all, "series", seriesId] as const,
    byVolume: (volumeId: string) =>
      [...queryKeys.runs.all, "volume", volumeId] as const,
    byIssue: (issueId: string) =>
      [...queryKeys.runs.all, "issue", issueId] as const,
    detail: (id: string) => [...queryKeys.runs.all, id] as const,
    searchForLinking: (query: string, excludeRunId: string) =>
      [...queryKeys.runs.all, "searchForLinking", excludeRunId, query] as const,
  },
  issues: {
    all: ["issues"] as const,
    recent: (limit?: number) =>
      [...queryKeys.issues.all, "recent", limit ?? null] as const,
    byVolume: (volumeId: string) =>
      [...queryKeys.issues.all, "volume", volumeId] as const,
    detail: (id: string) => [...queryKeys.issues.all, id] as const,
  },
  creators: {
    all: ["creators"] as const,
    list: (limit?: number) =>
      [...queryKeys.creators.all, "list", limit ?? null] as const,
    detail: (id: string) => [...queryKeys.creators.all, id] as const,
  },
  userComics: {
    all: ["userComics"] as const,
    collection: () => [...queryKeys.userComics.all, "collection"] as const,
    byIssue: (issueId: string) =>
      [...queryKeys.userComics.all, "issue", issueId] as const,
  },
  favorites: {
    all: ["favorites"] as const,
    series: () => [...queryKeys.favorites.all, "series"] as const,
    creators: () => [...queryKeys.favorites.all, "creators"] as const,
    publishers: () => [...queryKeys.favorites.all, "publishers"] as const,
    runs: () => [...queryKeys.favorites.all, "runs"] as const,
  },
  lists: {
    all: ["lists"] as const,
    mine: () => [...queryKeys.lists.all, "mine"] as const,
    detail: (id: string) => [...queryKeys.lists.all, id] as const,
    members: (id: string) => [...queryKeys.lists.all, id, "members"] as const,
    // Nested under detail(id) on purpose — invalidating detail(id) (already
    // done by every add/remove mutation) cascades to this too via React
    // Query's default prefix-matching invalidation, no extra invalidation
    // calls needed anywhere.
    membership: (id: string, issueId: string) =>
      [...queryKeys.lists.detail(id), "membership", issueId] as const,
  },
  search: {
    all: ["search"] as const,
    query: (query: string, limit?: number) =>
      [...queryKeys.search.all, query, limit ?? null] as const,
  },
  comicvine: {
    all: ["comicvine"] as const,
    search: (query: string) =>
      [...queryKeys.comicvine.all, "search", query] as const,
    newArrivals: () => [...queryKeys.comicvine.all, "newArrivals"] as const,
  },
} as const;
