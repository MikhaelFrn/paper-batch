export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      app_counters: {
        Row: {
          key: string;
          value: number;
        };
        Insert: {
          key: string;
          value?: number;
        };
        Update: {
          key?: string;
          value?: number;
        };
        Relationships: [];
      };
      barcode_lookups: {
        Row: {
          created_at: string;
          issue_id: string;
          upc: string;
        };
        Insert: {
          created_at?: string;
          issue_id: string;
          upc: string;
        };
        Update: {
          created_at?: string;
          issue_id?: string;
          upc?: string;
        };
        Relationships: [
          {
            foreignKeyName: "barcode_lookups_issue_id_fkey";
            columns: ["issue_id"];
            isOneToOne: false;
            referencedRelation: "issues";
            referencedColumns: ["id"];
          },
        ];
      };
      covers: {
        Row: {
          created_at: string;
          id: number;
          image_hash: string | null;
          issue_id: string | null;
        };
        Insert: {
          created_at?: string;
          id?: number;
          image_hash?: string | null;
          issue_id?: string | null;
        };
        Update: {
          created_at?: string;
          id?: number;
          image_hash?: string | null;
          issue_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "covers_issue_id_fkey";
            columns: ["issue_id"];
            isOneToOne: true;
            referencedRelation: "issues";
            referencedColumns: ["id"];
          },
        ];
      };
      creators: {
        Row: {
          api_source: string;
          comicvine_id: number | null;
          created_at: string | null;
          external_metadata: Json | null;
          first_name: string | null;
          id: string;
          last_name: string | null;
          synced_at: string | null;
        };
        Insert: {
          api_source?: string;
          comicvine_id?: number | null;
          created_at?: string | null;
          external_metadata?: Json | null;
          first_name?: string | null;
          id?: string;
          last_name?: string | null;
          synced_at?: string | null;
        };
        Update: {
          api_source?: string;
          comicvine_id?: number | null;
          created_at?: string | null;
          external_metadata?: Json | null;
          first_name?: string | null;
          id?: string;
          last_name?: string | null;
          synced_at?: string | null;
        };
        Relationships: [];
      };
      favorite_creators: {
        Row: {
          added_at: string | null;
          creator_id: string;
          user_id: string;
        };
        Insert: {
          added_at?: string | null;
          creator_id: string;
          user_id: string;
        };
        Update: {
          added_at?: string | null;
          creator_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "favorite_creators_creator_id_fkey";
            columns: ["creator_id"];
            isOneToOne: false;
            referencedRelation: "creators";
            referencedColumns: ["id"];
          },
        ];
      };
      favorite_publishers: {
        Row: {
          added_at: string | null;
          publisher_id: string;
          user_id: string;
        };
        Insert: {
          added_at?: string | null;
          publisher_id: string;
          user_id: string;
        };
        Update: {
          added_at?: string | null;
          publisher_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "favorite_publishers_publisher_id_fkey";
            columns: ["publisher_id"];
            isOneToOne: false;
            referencedRelation: "publishers";
            referencedColumns: ["id"];
          },
        ];
      };
      favorite_runs: {
        Row: {
          added_at: string | null;
          run_id: string;
          user_id: string;
        };
        Insert: {
          added_at?: string | null;
          run_id: string;
          user_id: string;
        };
        Update: {
          added_at?: string | null;
          run_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "favorite_runs_run_id_fkey";
            columns: ["run_id"];
            isOneToOne: false;
            referencedRelation: "runs";
            referencedColumns: ["id"];
          },
        ];
      };
      favorite_series: {
        Row: {
          added_at: string | null;
          series_id: string;
          user_id: string;
        };
        Insert: {
          added_at?: string | null;
          series_id: string;
          user_id: string;
        };
        Update: {
          added_at?: string | null;
          series_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "favorite_series_series_id_fkey";
            columns: ["series_id"];
            isOneToOne: false;
            referencedRelation: "series";
            referencedColumns: ["id"];
          },
        ];
      };
      issue_creators: {
        Row: {
          creator_id: string;
          issue_id: string;
          role: string;
        };
        Insert: {
          creator_id: string;
          issue_id: string;
          role: string;
        };
        Update: {
          creator_id?: string;
          issue_id?: string;
          role?: string;
        };
        Relationships: [
          {
            foreignKeyName: "issue_creators_creator_id_fkey";
            columns: ["creator_id"];
            isOneToOne: false;
            referencedRelation: "creators";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "issue_creators_issue_id_fkey";
            columns: ["issue_id"];
            isOneToOne: false;
            referencedRelation: "issues";
            referencedColumns: ["id"];
          },
        ];
      };
      issues: {
        Row: {
          api_source: string | null;
          comicvine_id: number | null;
          cover_url: string | null;
          created_at: string | null;
          external_metadata: Json | null;
          id: string;
          issue_number: string | null;
          release_date: string | null;
          sort_number: number | null;
          synced_at: string | null;
          title: string;
          volume_id: string | null;
        };
        Insert: {
          api_source?: string | null;
          comicvine_id?: number | null;
          cover_url?: string | null;
          created_at?: string | null;
          external_metadata?: Json | null;
          id?: string;
          issue_number?: string | null;
          release_date?: string | null;
          sort_number?: number | null;
          synced_at?: string | null;
          title: string;
          volume_id?: string | null;
        };
        Update: {
          api_source?: string | null;
          comicvine_id?: number | null;
          cover_url?: string | null;
          created_at?: string | null;
          external_metadata?: Json | null;
          id?: string;
          issue_number?: string | null;
          release_date?: string | null;
          sort_number?: number | null;
          synced_at?: string | null;
          title?: string;
          volume_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "issues_volume_id_fkey";
            columns: ["volume_id"];
            isOneToOne: false;
            referencedRelation: "volumes";
            referencedColumns: ["id"];
          },
        ];
      };
      list_items: {
        Row: {
          added_at: string | null;
          issue_id: string;
          list_id: string;
        };
        Insert: {
          added_at?: string | null;
          issue_id: string;
          list_id: string;
        };
        Update: {
          added_at?: string | null;
          issue_id?: string;
          list_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "list_items_issue_id_fkey";
            columns: ["issue_id"];
            isOneToOne: false;
            referencedRelation: "issues";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "list_items_list_id_fkey";
            columns: ["list_id"];
            isOneToOne: false;
            referencedRelation: "lists";
            referencedColumns: ["id"];
          },
        ];
      };
      list_members: {
        Row: {
          joined_at: string | null;
          list_id: string;
          role: Database["public"]["Enums"]["list_role"];
          user_id: string;
        };
        Insert: {
          joined_at?: string | null;
          list_id: string;
          role: Database["public"]["Enums"]["list_role"];
          user_id: string;
        };
        Update: {
          joined_at?: string | null;
          list_id?: string;
          role?: Database["public"]["Enums"]["list_role"];
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "list_members_list_id_fkey";
            columns: ["list_id"];
            isOneToOne: false;
            referencedRelation: "lists";
            referencedColumns: ["id"];
          },
        ];
      };
      lists: {
        Row: {
          created_at: string | null;
          description: string | null;
          id: string;
          name: string;
          owner_id: string;
          type: Database["public"]["Enums"]["list_type"];
          visibility: Database["public"]["Enums"]["list_visibility"];
        };
        Insert: {
          created_at?: string | null;
          description?: string | null;
          id?: string;
          name: string;
          owner_id: string;
          type?: Database["public"]["Enums"]["list_type"];
          visibility?: Database["public"]["Enums"]["list_visibility"];
        };
        Update: {
          created_at?: string | null;
          description?: string | null;
          id?: string;
          name?: string;
          owner_id?: string;
          type?: Database["public"]["Enums"]["list_type"];
          visibility?: Database["public"]["Enums"]["list_visibility"];
        };
        Relationships: [];
      };
      profiles: {
        // avatar_object_key hand-added ahead of the migration being
        // applied — regenerate via `supabase gen types` once
        // 20260815000000_decouple_avatar_filename_from_user_id.sql has run,
        // and this entry should come out identical (delete this comment
        // once confirmed).
        Row: {
          avatar_object_key: string | null;
          avatar_url: string | null;
          bio: string | null;
          created_at: string | null;
          display_name: string | null;
          id: string;
          updated_at: string | null;
          username: string | null;
        };
        Insert: {
          avatar_object_key?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string | null;
          display_name?: string | null;
          id: string;
          updated_at?: string | null;
          username?: string | null;
        };
        Update: {
          avatar_object_key?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string | null;
          display_name?: string | null;
          id?: string;
          updated_at?: string | null;
          username?: string | null;
        };
        Relationships: [];
      };
      publishers: {
        Row: {
          api_source: string | null;
          comicvine_id: number | null;
          created_at: string | null;
          external_metadata: Json | null;
          id: string;
          logo_url: string | null;
          name: string;
          synced_at: string | null;
          website: string | null;
        };
        Insert: {
          api_source?: string | null;
          comicvine_id?: number | null;
          created_at?: string | null;
          external_metadata?: Json | null;
          id?: string;
          logo_url?: string | null;
          name: string;
          synced_at?: string | null;
          website?: string | null;
        };
        Update: {
          api_source?: string | null;
          comicvine_id?: number | null;
          created_at?: string | null;
          external_metadata?: Json | null;
          id?: string;
          logo_url?: string | null;
          name?: string;
          synced_at?: string | null;
          website?: string | null;
        };
        Relationships: [];
      };
      run_creators: {
        Row: {
          creator_id: string;
          role: string;
          run_id: string;
        };
        Insert: {
          creator_id: string;
          role: string;
          run_id: string;
        };
        Update: {
          creator_id?: string;
          role?: string;
          run_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "run_creators_creator_id_fkey";
            columns: ["creator_id"];
            isOneToOne: false;
            referencedRelation: "creators";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "run_creators_run_id_fkey";
            columns: ["run_id"];
            isOneToOne: false;
            referencedRelation: "runs";
            referencedColumns: ["id"];
          },
        ];
      };
      run_items: {
        Row: {
          id: string;
          issue_id: string | null;
          position: number;
          run_id: string;
          volume_id: string | null;
        };
        Insert: {
          id?: string;
          issue_id?: string | null;
          position: number;
          run_id: string;
          volume_id?: string | null;
        };
        Update: {
          id?: string;
          issue_id?: string | null;
          position?: number;
          run_id?: string;
          volume_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "run_items_issue_id_fkey";
            columns: ["issue_id"];
            isOneToOne: false;
            referencedRelation: "issues";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "run_volumes_run_id_fkey";
            columns: ["run_id"];
            isOneToOne: false;
            referencedRelation: "runs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "run_volumes_volume_id_fkey";
            columns: ["volume_id"];
            isOneToOne: false;
            referencedRelation: "volumes";
            referencedColumns: ["id"];
          },
        ];
      };
      run_relationships: {
        Row: {
          created_at: string;
          id: string;
          relationship: Database["public"]["Enums"]["relationship_type"];
          source_run_id: string;
          target_run_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          relationship: Database["public"]["Enums"]["relationship_type"];
          source_run_id: string;
          target_run_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          relationship?: Database["public"]["Enums"]["relationship_type"];
          source_run_id?: string;
          target_run_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "fk_source_run";
            columns: ["source_run_id"];
            isOneToOne: false;
            referencedRelation: "runs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_target_run";
            columns: ["target_run_id"];
            isOneToOne: false;
            referencedRelation: "runs";
            referencedColumns: ["id"];
          },
        ];
      };
      // Hand-added ahead of the migration being applied — regenerate via
      // `supabase gen types` once `20260814000000_add_run_verifications.sql`
      // has run, and this entry should come out identical (delete this
      // comment once confirmed).
      run_verifications: {
        Row: {
          run_id: string;
          user_id: string;
          verified_at: string | null;
        };
        Insert: {
          run_id: string;
          user_id: string;
          verified_at?: string | null;
        };
        Update: {
          run_id?: string;
          user_id?: string;
          verified_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "run_verifications_run_id_fkey";
            columns: ["run_id"];
            isOneToOne: false;
            referencedRelation: "runs";
            referencedColumns: ["id"];
          },
        ];
      };
      runs: {
        Row: {
          confidence: number | null;
          created_at: string | null;
          description: string | null;
          end_year: number | null;
          id: string;
          name: string;
          start_year: number | null;
          status: Database["public"]["Enums"]["run_status"];
          type: Database["public"]["Enums"]["run_type"] | null;
          verified_at: string | null;
        };
        Insert: {
          confidence?: number | null;
          created_at?: string | null;
          description?: string | null;
          end_year?: number | null;
          id?: string;
          name: string;
          start_year?: number | null;
          status?: Database["public"]["Enums"]["run_status"];
          type?: Database["public"]["Enums"]["run_type"] | null;
          verified_at?: string | null;
        };
        Update: {
          confidence?: number | null;
          created_at?: string | null;
          description?: string | null;
          end_year?: number | null;
          id?: string;
          name?: string;
          start_year?: number | null;
          status?: Database["public"]["Enums"]["run_status"];
          type?: Database["public"]["Enums"]["run_type"] | null;
          verified_at?: string | null;
        };
        Relationships: [];
      };
      series: {
        Row: {
          api_source: string | null;
          comicvine_id: number | null;
          created_at: string | null;
          external_metadata: Json | null;
          id: string;
          name: string;
          normalized_name: string | null;
          publisher_id: string;
          slug: string | null;
          synced_at: string | null;
        };
        Insert: {
          api_source?: string | null;
          comicvine_id?: number | null;
          created_at?: string | null;
          external_metadata?: Json | null;
          id?: string;
          name: string;
          normalized_name?: string | null;
          publisher_id: string;
          slug?: string | null;
          synced_at?: string | null;
        };
        Update: {
          api_source?: string | null;
          comicvine_id?: number | null;
          created_at?: string | null;
          external_metadata?: Json | null;
          id?: string;
          name?: string;
          normalized_name?: string | null;
          publisher_id?: string;
          slug?: string | null;
          synced_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "series_publisher_id_fkey";
            columns: ["publisher_id"];
            isOneToOne: false;
            referencedRelation: "publishers";
            referencedColumns: ["id"];
          },
        ];
      };
      user_comics: {
        Row: {
          created_at: string | null;
          id: string;
          issue_id: string;
          notes: string | null;
          owned: boolean | null;
          purchase_date: string | null;
          rating: number | null;
          read: boolean | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          issue_id: string;
          notes?: string | null;
          owned?: boolean | null;
          purchase_date?: string | null;
          rating?: number | null;
          read?: boolean | null;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          issue_id?: string;
          notes?: string | null;
          owned?: boolean | null;
          purchase_date?: string | null;
          rating?: number | null;
          read?: boolean | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_comics_issue_id_fkey";
            columns: ["issue_id"];
            isOneToOne: false;
            referencedRelation: "issues";
            referencedColumns: ["id"];
          },
        ];
      };
      volumes: {
        Row: {
          api_source: string | null;
          comicvine_id: number | null;
          cover_url: string | null;
          created_at: string | null;
          description: string | null;
          end_year: number | null;
          external_metadata: Json | null;
          id: string;
          name: string;
          publisher_id: string | null;
          series_id: string | null;
          start_year: number | null;
          synced_at: string | null;
        };
        Insert: {
          api_source?: string | null;
          comicvine_id?: number | null;
          cover_url?: string | null;
          created_at?: string | null;
          description?: string | null;
          end_year?: number | null;
          external_metadata?: Json | null;
          id?: string;
          name: string;
          publisher_id?: string | null;
          series_id?: string | null;
          start_year?: number | null;
          synced_at?: string | null;
        };
        Update: {
          api_source?: string | null;
          comicvine_id?: number | null;
          cover_url?: string | null;
          created_at?: string | null;
          description?: string | null;
          end_year?: number | null;
          external_metadata?: Json | null;
          id?: string;
          name?: string;
          publisher_id?: string | null;
          series_id?: string | null;
          start_year?: number | null;
          synced_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "volumes_publisher_id_fkey";
            columns: ["publisher_id"];
            isOneToOne: false;
            referencedRelation: "publishers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "volumes_series_id_fkey";
            columns: ["series_id"];
            isOneToOne: false;
            referencedRelation: "series";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      increment_app_counter: { Args: { counter_key: string }; Returns: number };
      is_list_member: {
        Args: { p_list_id: string; p_user_id: string };
        Returns: boolean;
      };
    };
    Enums: {
      list_role: "owner" | "editor" | "viewer";
      list_type: "wishlist" | "reading" | "custom";
      list_visibility: "private" | "shared" | "public";
      relationship_type:
        | "required_before"
        | "recommended_before"
        | "tie_in"
        | "concurrent"
        | "inspired_by"
        | "continuation"
        | "alternate_take";
      run_status: "draft" | "verified";
      run_type: "creative_run" | "event" | "reading_order" | "era";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      list_role: ["owner", "editor", "viewer"],
      list_type: ["wishlist", "reading", "custom"],
      list_visibility: ["private", "shared", "public"],
      relationship_type: [
        "required_before",
        "recommended_before",
        "tie_in",
        "concurrent",
        "inspired_by",
        "continuation",
        "alternate_take",
      ],
      run_status: ["draft", "verified"],
      run_type: ["creative_run", "event", "reading_order", "era"],
    },
  },
} as const;
