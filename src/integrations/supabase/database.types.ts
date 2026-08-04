// Generated-style Database type for the Comic vault schema.
// Mirrors the PostgreSQL schema; used as the single source of truth for
// row / insert / update types across the app.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// Verified live against the real DB (not just the schema doc): both
// "favorites" and "unlisted" were previously listed here but don't exist
// as enum values in Postgres — inserting them fails with 22P02. Favorites
// are their own tables (favorite_series/creators/publishers/runs), not a
// list type.
export type ListType = "custom" | "reading" | "wishlist";
export type ListVisibility = "private" | "shared" | "public";
export type ListMemberRole = "owner" | "editor" | "viewer";

export type RunType =
  | "creative_run"
  | "event"
  | "reading_order";

export type RunStatus =
  | "draft"
  | "verified";

export type RelationshipType =
  | "required_before"
  | "recommended_before"
  | "tie_in"
  | "concurrent"
  | "inspired_by"
  | "continuation"
  | "alternate_take";

export interface Database {
  public: {
    Tables: {
      publishers: {
        Row: {
          id: string;
          name: string;
          website: string | null;
          logo_url: string | null;
          created_at: string | null;
          comicvine_id: number | null;
          api_source: string | null;
          synced_at: string | null;
          external_metadata: Json | null;
        };
        Insert: {
          id?: string;
          name: string;
          website?: string | null;
          logo_url?: string | null;
          created_at?: string | null;
          comicvine_id?: number | null;
          api_source?: string | null;
          synced_at?: string | null;
          external_metadata?: Json | null;
        };
        Update: Partial<Database["public"]["Tables"]["publishers"]["Insert"]>;
        Relationships: [];
      };
      series: {
        Row: {
          id: string;
          publisher_id: string;
          name: string;
          created_at: string | null;
          comicvine_id: number | null;
          api_source: string | null;
          synced_at: string | null;
          external_metadata: Json | null;
          slug: string | null;
          normalized_name: string | null;
        };
        Insert: {
          id?: string;
          publisher_id: string;
          name: string;
          created_at?: string | null;
          comicvine_id?: number | null;
          api_source?: string | null;
          synced_at?: string | null;
          external_metadata?: Json | null;
          slug?: string | null;
          normalized_name?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["series"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "series_publisher_id_fkey";
            columns: ["publisher_id"];
            referencedRelation: "publishers";
            referencedColumns: ["id"];
          },
        ];
      };
      runs: {
        Row: {
          id: string;
          name: string;
          start_year: number | null;
          end_year: number | null;
          created_at: string | null;
          type: RunType | null;
          status: RunStatus;
          verified_at: string | null;
          description: string | null;
          confidence: number | null;
        };
        Insert: {
          id?: string;
          name: string;
          start_year?: number | null;
          end_year?: number | null;
          created_at?: string | null;
          type?: RunType;
          status?: RunStatus;
          verified_at?: string | null;
          description?: string | null;
          confidence?: number | null;
        };
        Update: Partial<Database["public"]["Tables"]["runs"]["Insert"]>;
        Relationships: [];
  };
      volumes: {
        Row: {
          id: string;
          publisher_id: string | null;
          series_id: string | null;
          name: string;
          description: string | null;
          start_year: number | null;
          end_year: number | null;
          cover_url: string | null;
          comicvine_id: number | null;
          created_at: string | null;
          api_source: string | null;
          synced_at: string | null;
          external_metadata: Json | null;
        };
        Insert: {
          id?: string;
          publisher_id?: string | null;
          series_id?: string | null;
          name: string;
          description?: string | null;
          start_year?: number | null;
          end_year?: number | null;
          cover_url?: string | null;
          comicvine_id?: number | null;
          created_at?: string | null;
          api_source?: string | null;
          synced_at?: string | null;
          external_metadata?: Json | null;
        };
        Update: Partial<Database["public"]["Tables"]["volumes"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "volumes_publisher_id_fkey";
            columns: ["publisher_id"];
            referencedRelation: "publishers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "volumes_series_id_fkey";
            columns: ["series_id"];
            referencedRelation: "series";
            referencedColumns: ["id"];
          },
        ];
      };
      issues: {
        Row: {
          id: string;
          title: string;
          issue_number: string | null;
          release_date: string | null;
          cover_url: string | null;
          created_at: string | null;
          volume_id: string | null;
          comicvine_id: number | null;
          api_source: string | null;
          synced_at: string | null;
          external_metadata: Json | null;
          sort_number: number | null;
        };
        Insert: {
          id?: string;
          title: string;
          issue_number?: string | null;
          release_date?: string | null;
          cover_url?: string | null;
          created_at?: string | null;
          volume_id?: string | null;
          comicvine_id?: number | null;
          api_source?: string | null;
          synced_at?: string | null;
          external_metadata?: Json | null;
          sort_number?: number | null;
        };
        Update: Partial<Database["public"]["Tables"]["issues"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "issues_volume_id_fkey";
            columns: ["volume_id"];
            referencedRelation: "volumes";
            referencedColumns: ["id"];
          },
        ];
      };
      creators: {
        Row: {
          id: string;
          first_name: string | null;
          last_name: string | null;
          created_at: string | null;
          comicvine_id: number | null;
          api_source: string;
          synced_at: string | null;
          external_metadata: Json | null;
        };
        Insert: {
          id?: string;
          first_name?: string | null;
          last_name?: string | null;
          created_at?: string | null;
          comicvine_id?: number | null;
          api_source?: string;
          synced_at?: string | null;
          external_metadata?: Json | null;
        };
        Update: Partial<Database["public"]["Tables"]["creators"]["Insert"]>;
        Relationships: [];
      };
      issue_creators: {
        Row: { issue_id: string; creator_id: string; role: string };
        Insert: { issue_id: string; creator_id: string; role: string };
        Update: Partial<Database["public"]["Tables"]["issue_creators"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "issue_creators_issue_id_fkey";
            columns: ["issue_id"];
            referencedRelation: "issues";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "issue_creators_creator_id_fkey";
            columns: ["creator_id"];
            referencedRelation: "creators";
            referencedColumns: ["id"];
          },
        ];
      };
      run_creators: {
        Row: { run_id: string; creator_id: string; role: string };
        Insert: { run_id: string; creator_id: string; role: string };
        Update: Partial<Database["public"]["Tables"]["run_creators"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "run_creators_run_id_fkey";
            columns: ["run_id"];
            referencedRelation: "runs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "run_creators_creator_id_fkey";
            columns: ["creator_id"];
            referencedRelation: "creators";
            referencedColumns: ["id"];
          },
        ];
      };
      run_items: {
        Row: {
          id: string;
          run_id: string;
          issue_id: string | null;
          volume_id: string | null;
          position: number;
        };
        Insert: {
          id?: string;
          run_id: string;
          issue_id?: string | null;
          volume_id?: string | null;
          position: number;
        };
        Update: Partial<Database["public"]["Tables"]["run_items"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "run_volumes_run_id_fkey";
            columns: ["run_id"];
            referencedRelation: "runs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "run_volumes_volume_id_fkey";
            columns: ["volume_id"];
            referencedRelation: "volumes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "run_items_issue_id_fkey";
            columns: ["issue_id"];
            referencedRelation: "issues";
            referencedColumns: ["id"];
          }
        ];
      };
      run_relationships: {
        Row: {
          id: string;
          source_run_id: string;
          target_run_id: string;
          relationship: RelationshipType;
          created_at: string;
        };
        Insert: {
          id?: string;
          source_run_id: string;
          target_run_id: string;
          relationship: RelationshipType;
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["run_relationships"]["Insert"]
        >;
        Relationships: [
          {
            foreignKeyName: "fk_source_run";
            columns: ["source_run_id"];
            referencedRelation: "runs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_target_run";
            columns: ["target_run_id"];
            referencedRelation: "runs";
            referencedColumns: ["id"];
          }
        ];
      };
      user_comics: {
        Row: {
          id: string;
          user_id: string;
          issue_id: string;
          owned: boolean | null;
          read: boolean | null;
          rating: number | null;
          notes: string | null;
          purchase_date: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          issue_id: string;
          owned?: boolean | null;
          read?: boolean | null;
          rating?: number | null;
          notes?: string | null;
          purchase_date?: string | null;
          created_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["user_comics"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "user_comics_issue_id_fkey";
            columns: ["issue_id"];
            referencedRelation: "issues";
            referencedColumns: ["id"];
          },
        ];
      };
      favorite_series: {
        Row: { user_id: string; series_id: string; added_at: string | null };
        Insert: { user_id: string; series_id: string; added_at?: string | null };
        Update: Partial<Database["public"]["Tables"]["favorite_series"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "favorite_series_series_id_fkey";
            columns: ["series_id"];
            referencedRelation: "series";
            referencedColumns: ["id"];
          },
        ];
      };
      favorite_creators: {
        Row: { user_id: string; creator_id: string; added_at: string | null };
        Insert: { user_id: string; creator_id: string; added_at?: string | null };
        Update: Partial<Database["public"]["Tables"]["favorite_creators"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "favorite_creators_creator_id_fkey";
            columns: ["creator_id"];
            referencedRelation: "creators";
            referencedColumns: ["id"];
          },
        ];
      };
      favorite_publishers: {
        Row: { user_id: string; publisher_id: string; added_at: string | null };
        Insert: { user_id: string; publisher_id: string; added_at?: string | null };
        Update: Partial<Database["public"]["Tables"]["favorite_publishers"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "favorite_publishers_publisher_id_fkey";
            columns: ["publisher_id"];
            referencedRelation: "publishers";
            referencedColumns: ["id"];
          },
        ];
      };
      favorite_runs: {
        Row: { user_id: string; run_id: string; added_at: string | null };
        Insert: { user_id: string; run_id: string; added_at?: string | null };
        Update: Partial<Database["public"]["Tables"]["favorite_runs"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "favorite_runs_run_id_fkey";
            columns: ["run_id"];
            referencedRelation: "runs";
            referencedColumns: ["id"];
          },
        ];
      };
      lists: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          type: ListType;
          visibility: ListVisibility;
          description: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          owner_id: string;
          name: string;
          type?: ListType;
          visibility?: ListVisibility;
          description?: string | null;
          created_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["lists"]["Insert"]>;
        Relationships: [];
      };
      list_members: {
        Row: {
          list_id: string;
          user_id: string;
          role: ListMemberRole;
          joined_at: string | null;
        };
        Insert: {
          list_id: string;
          user_id: string;
          role: ListMemberRole;
          joined_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["list_members"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "list_members_list_id_fkey";
            columns: ["list_id"];
            referencedRelation: "lists";
            referencedColumns: ["id"];
          },
        ];
      };
      list_items: {
        Row: { list_id: string; issue_id: string; added_at: string | null };
        Insert: { list_id: string; issue_id: string; added_at?: string | null };
        Update: Partial<Database["public"]["Tables"]["list_items"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "list_items_list_id_fkey";
            columns: ["list_id"];
            referencedRelation: "lists";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "list_items_issue_id_fkey";
            columns: ["issue_id"];
            referencedRelation: "issues";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          id: string;
          username: string | null;
          display_name: string | null;
          avatar_url: string | null;
          bio: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id: string;
          username?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      covers: {
        Row: {
          id: number;
          created_at: string;
          image_hash: string | null;
          issue_id: string | null;
        };
        Insert: {
          id?: number;
          created_at?: string;
          image_hash?: string | null;
          issue_id?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["covers"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "covers_issue_id_fkey";
            columns: ["issue_id"];
            referencedRelation: "issues";
            referencedColumns: ["id"];
          },
        ];
      };
      barcode_lookups: {
        Row: {
          upc: string;
          issue_id: string;
          created_at: string;
        };
        Insert: {
          upc: string;
          issue_id: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["barcode_lookups"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "barcode_lookups_issue_id_fkey";
            columns: ["issue_id"];
            referencedRelation: "issues";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      list_type: ListType;
      list_visibility: ListVisibility;
      list_member_role: ListMemberRole;
      run_type: RunType;
      run_status: RunStatus;  
      relationship_type: RelationshipType;
    };
    CompositeTypes: Record<string, never>;
  };
}

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];
