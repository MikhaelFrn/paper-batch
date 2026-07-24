// Shared DTOs for the service layer. UI components consume these types so
// they don't depend on either the Supabase schema or the mock module directly.
export type {
  Comic,
  Publisher,
  Universe,
  CustomList,
} from "@/lib/mock-data";

export interface Profile {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  bio?: string;
}

export interface CollectionStats {
  owned: number;
  read: number;
  wishlist: number;
  favorites: number;
  lists: number;
  totalIssues: number;
}

export interface ReadingProgress {
  comicId: string;
  progress: number;
}

export interface CreatorSummary {
  writers: string[];
  artists: string[];
  favoriteWriters: string[];
  favoriteArtists: string[];
}
