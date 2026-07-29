// Presentation adapter layer.
//
// The UI components (ComicCard, ComicCover, route pages) were originally
// designed against a flat "Comic" shape. This module preserves that shape as
// a UI contract and provides adapters that map live typed data
// (`IssueWithRelations`, `UserComic`, `Publisher`) into it, so components
// don't need to be rewritten.
//
// No mock data lives here anymore — all data is loaded through React Query
// hooks in `@/hooks`, which call the typed service layer.

import type {
  Creator,
  IssueCreator,
  IssueWithRelations,
  Publisher as PublisherRow,
  UserComic,
} from "./types";

// ---------- UI-facing types (component API — do not change shape) ----------

export type Publisher = string;
export type Universe = string;

export interface Comic {
  id: string;
  title: string;
  issue: string | number;
  volume: number;
  series: string;
  run?: string;
  publisher: Publisher;
  universe: Universe;
  writers: string[];
  artists: string[];
  coverArtist?: string;
  releaseDate: string;
  addedDate: string;
  synopsis: string;
  characters: string[];
  teams: string[];
  storyArcs: string[];
  owned: boolean;
  read: boolean;
  wishlist: boolean;
  favorite: boolean;
  rating?: number;
}

export interface CustomList {
  id: string;
  name: string;
  description: string;
  coverPublisher: Publisher;
  isPublic: boolean;
  comicIds: string[];
}

// ---------- Publisher visual tokens ----------

export const publisherAccent: Record<string, string> = {
  Marvel: "var(--gradient-marvel)",
  DC: "var(--gradient-dc)",
  Image: "var(--gradient-image)",
  "Dark Horse": "var(--gradient-darkhorse)",
  "Boom Studios": "var(--gradient-boom)",
  IDW: "var(--gradient-idw)",
  Valiant: "var(--gradient-valiant)",
};

export function getPublisherAccent(publisher: string | null | undefined): string {
  if (publisher && publisherAccent[publisher]) return publisherAccent[publisher];
  return "linear-gradient(135deg, oklch(0.35 0.05 260), oklch(0.20 0.05 260))";
}

// ---------- Adapters (typed → UI Comic) ----------

function creatorName(c: Creator | null): string {
  if (!c) return "Unknown";
  return [c.first_name, c.last_name].filter(Boolean).join(" ").trim() || "Unknown";
}

function pickCreators(
  issue_creators: Array<Pick<IssueCreator, "role"> & { creator: Creator | null }> | undefined,
  matcher: (role: string) => boolean,
): string[] {
  if (!issue_creators?.length) return [];
  return Array.from(
    new Set(
      issue_creators
        .filter((ic) => matcher((ic.role ?? "").toLowerCase()))
        .map((ic) => creatorName(ic.creator)),
    ),
  );
}

function parseIssueNumber(n: string | null): string | number {
  if (n == null) return "";
  const trimmed = n.trim();
  const num = Number(trimmed);
  return Number.isFinite(num) && String(num) === trimmed ? num : trimmed;
}

export interface IssueToComicState {
  owned?: boolean;
  read?: boolean;
  wishlist?: boolean;
  favorite?: boolean;
  rating?: number | null;
}

export function issueToComic(
  issue: IssueWithRelations,
  state: IssueToComicState = {},
): Comic {
  const series = issue.volume?.series?.name ?? "Unknown Series";
  const publisher = issue.volume?.series?.publisher?.name ?? "Unknown";
  const writers = pickCreators(issue.issue_creators, (r) => r.includes("writer"));
  const artists = pickCreators(
    issue.issue_creators,
    (r) =>
      r.includes("artist") ||
      r.includes("penciler") ||
      r.includes("penciller") ||
      r.includes("inker") ||
      r.includes("colorist"),
  );
  const coverArtist = pickCreators(issue.issue_creators, (r) => r.includes("cover"))[0];
  const releaseDate = issue.release_date ?? issue.created_at ?? new Date(0).toISOString();

  return {
    id: issue.id,
    title: issue.title,
    issue: parseIssueNumber(issue.issue_number),
    volume: 1,
    series,
    publisher,
    universe: publisher,
    writers: writers.length ? writers : ["—"],
    artists: artists.length ? artists : [],
    coverArtist,
    releaseDate,
    addedDate: issue.created_at ?? releaseDate,
    synopsis: "",
    characters: [],
    teams: [],
    storyArcs: [],
    owned: state.owned ?? false,
    read: state.read ?? false,
    wishlist: state.wishlist ?? false,
    favorite: state.favorite ?? false,
    rating: state.rating ?? undefined,
  };
}

export function userComicToComic(
  entry: { issue: IssueWithRelations | null } & Partial<UserComic>,
): Comic | null {
  if (!entry.issue) return null;
  return issueToComic(entry.issue, {
    owned: entry.owned ?? false,
    read: entry.read ?? false,
    rating: entry.rating,
  });
}

export function publisherToComic(p: PublisherRow): Publisher {
  return p.name;
}
