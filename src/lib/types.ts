// Shared typed data-layer contracts.
//
// Database entity types come directly from the generated Supabase Database
// type — never redefined by hand. Additional view models below represent
// computed shapes (joins / aggregates) that don't map to a single row.

import type {
  Database,
  Tables,
  TablesInsert,
  TablesUpdate,
  ListType,
  ListVisibility,
  ListMemberRole,
} from "@/integrations/supabase/database.types";

export type { Database, Tables, TablesInsert, TablesUpdate };
export type { ListType, ListVisibility, ListMemberRole };

// ---------- Row aliases ----------
export type Publisher = Tables<"publishers">;
export type Series = Tables<"series">;
export type Run = Tables<"runs">;
export type Volume = Tables<"volumes">;
export type Issue = Tables<"issues">;
export type Creator = Tables<"creators">;
export type IssueCreator = Tables<"issue_creators">;
export type RunCreator = Tables<"run_creators">;
export type RunVolume = Tables<"run_volumes">;
export type UserComic = Tables<"user_comics">;
export type FavoriteSeries = Tables<"favorite_series">;
export type FavoriteCreator = Tables<"favorite_creators">;
export type FavoritePublisher = Tables<"favorite_publishers">;
export type FavoriteRun = Tables<"favorite_runs">;
export type ListRow = Tables<"lists">;
export type ListItem = Tables<"list_items">;
export type ListMember = Tables<"list_members">;
export type Profile = Tables<"profiles">;
export type Cover = Tables<"covers">;

// ---------- Insert / Update aliases ----------
export type ProfileUpdate = TablesUpdate<"profiles">;
export type UserComicInsert = TablesInsert<"user_comics">;
export type UserComicUpdate = TablesUpdate<"user_comics">;
export type ListInsert = TablesInsert<"lists">;
export type ListUpdate = TablesUpdate<"lists">;
export type ListItemInsert = TablesInsert<"list_items">;

// ---------- Derived view models (computed, not a single row) ----------

/** Issue joined with its volume → series → publisher chain plus creators. */
export interface IssueWithRelations extends Issue {
  volume:
    | (Volume & {
        series: (Series & { publisher: Publisher | null }) | null;
      })
    | null;
  issue_creators: Array<
    Pick<IssueCreator, "role"> & { creator: Creator | null }
  >;
}

/** An issue in the current user's collection (join of user_comics + issue). */
export interface UserCollectionEntry extends UserComic {
  issue: IssueWithRelations | null;
}

/** Series enriched with publisher, for list surfaces. */
export interface SeriesWithPublisher extends Series {
  publisher: Publisher | null;
}

/** Run enriched with series + publisher + creators, for detail surfaces. */
export interface RunWithRelations extends Run {
  series: SeriesWithPublisher | null;
  run_creators: Array<Pick<RunCreator, "role"> & { creator: Creator | null }>;
}

/** List with nested items (each item joined with its issue). */
export interface ListWithItems extends ListRow {
  list_items: Array<ListItem & { issue: IssueWithRelations | null }>;
}

/** Grouped, typed search payload returned by the search service. */
export interface SearchResults {
  issues: IssueWithRelations[];
  series: SeriesWithPublisher[];
  runs: RunWithRelations[];
  volumes: Volume[];
  creators: Creator[];
  publishers: Publisher[];
}

/** Uniform error shape services throw / return. */
export class ServiceError extends Error {
  code?: string;
  cause?: unknown;
  constructor(message: string, opts?: { code?: string; cause?: unknown }) {
    super(message);
    this.name = "ServiceError";
    this.code = opts?.code;
    this.cause = opts?.cause;
  }
}
