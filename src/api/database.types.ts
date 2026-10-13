export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: { extensions?: Json; operationName?: string; query?: string; variables?: Json };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      attendances: {
        Row: {
          created_at: string;
          event_id: string;
          going_with: Database["public"]["Enums"]["going_with"];
          join_solo_group: boolean;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          event_id: string;
          going_with?: Database["public"]["Enums"]["going_with"];
          join_solo_group?: boolean;
          user_id: string;
        };
        Update: {
          created_at?: string;
          event_id?: string;
          going_with?: Database["public"]["Enums"]["going_with"];
          join_solo_group?: boolean;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "attendances_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
        ];
      };
      blocks: {
        Row: {
          blocked: string;
          blocker: string;
          created_at: string;
        };
        ComputedFields: never;
        Insert: {
          blocked: string;
          blocker: string;
          created_at?: string;
        };
        Update: {
          blocked?: string;
          blocker?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      decisions: {
        Row: {
          choice: Database["public"]["Enums"]["decision"];
          created_at: string;
          event_id: string;
          from_user: string;
          to_user: string;
        };
        ComputedFields: never;
        Insert: {
          choice: Database["public"]["Enums"]["decision"];
          created_at?: string;
          event_id: string;
          from_user: string;
          to_user: string;
        };
        Update: {
          choice?: Database["public"]["Enums"]["decision"];
          created_at?: string;
          event_id?: string;
          from_user?: string;
          to_user?: string;
        };
        Relationships: [
          {
            foreignKeyName: "decisions_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
        ];
      };
      events: {
        Row: {
          address: string;
          age_limit: number | null;
          category: string;
          created_at: string;
          description_en: string;
          description_uk: string;
          ends_at: string;
          id: string;
          partner: boolean;
          poster: NonNullable<Json>;
          price: number | null;
          price_note: string | null;
          scene_id: string;
          starts_at: string;
          ticket_url: string | null;
          title_en: string;
          title_uk: string;
          venue: string;
          walk: string | null;
        };
        ComputedFields: never;
        Insert: {
          address?: string;
          age_limit?: number | null;
          category: string;
          created_at?: string;
          description_en?: string;
          description_uk?: string;
          ends_at: string;
          id?: string;
          partner?: boolean;
          poster?: NonNullable<Json>;
          price?: number | null;
          price_note?: string | null;
          scene_id: string;
          starts_at: string;
          ticket_url?: string | null;
          title_en: string;
          title_uk: string;
          venue: string;
          walk?: string | null;
        };
        Update: {
          address?: string;
          age_limit?: number | null;
          category?: string;
          created_at?: string;
          description_en?: string;
          description_uk?: string;
          ends_at?: string;
          id?: string;
          partner?: boolean;
          poster?: NonNullable<Json>;
          price?: number | null;
          price_note?: string | null;
          scene_id?: string;
          starts_at?: string;
          ticket_url?: string | null;
          title_en?: string;
          title_uk?: string;
          venue?: string;
          walk?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "events_scene_id_fkey";
            columns: ["scene_id"];
            isOneToOne: false;
            referencedRelation: "scenes";
            referencedColumns: ["id"];
          },
        ];
      };
      matches: {
        Row: {
          closed_by: string | null;
          created_at: string;
          event_id: string;
          id: string;
          user_a: string;
          user_b: string;
        };
        ComputedFields: never;
        Insert: {
          closed_by?: string | null;
          created_at?: string;
          event_id: string;
          id?: string;
          user_a: string;
          user_b: string;
        };
        Update: {
          closed_by?: string | null;
          created_at?: string;
          event_id?: string;
          id?: string;
          user_a?: string;
          user_b?: string;
        };
        Relationships: [
          {
            foreignKeyName: "matches_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
        ];
      };
      messages: {
        Row: {
          created_at: string;
          id: string;
          match_id: string;
          sender_id: string;
          text: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          id?: string;
          match_id: string;
          sender_id: string;
          text: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          match_id?: string;
          sender_id?: string;
          text?: string;
        };
        Relationships: [
          {
            foreignKeyName: "messages_match_id_fkey";
            columns: ["match_id"];
            isOneToOne: false;
            referencedRelation: "matches";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          affiliation: string;
          created_at: string;
          gender: string | null;
          goes_with: string | null;
          gradient: string;
          id: string;
          interests: string[];
          language: string;
          name: string;
          photo_path: string | null;
          scene_id: string | null;
          show_shared: boolean;
          show_solo: boolean;
          talk_about: string;
          updated_at: string;
          vibe: string | null;
        };
        ComputedFields: never;
        Insert: {
          affiliation?: string;
          created_at?: string;
          gender?: string | null;
          goes_with?: string | null;
          gradient?: string;
          id: string;
          interests?: string[];
          language?: string;
          name: string;
          photo_path?: string | null;
          scene_id?: string | null;
          show_shared?: boolean;
          show_solo?: boolean;
          talk_about?: string;
          updated_at?: string;
          vibe?: string | null;
        };
        Update: {
          affiliation?: string;
          created_at?: string;
          gender?: string | null;
          goes_with?: string | null;
          gradient?: string;
          id?: string;
          interests?: string[];
          language?: string;
          name?: string;
          photo_path?: string | null;
          scene_id?: string | null;
          show_shared?: boolean;
          show_solo?: boolean;
          talk_about?: string;
          updated_at?: string;
          vibe?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_scene_id_fkey";
            columns: ["scene_id"];
            isOneToOne: false;
            referencedRelation: "scenes";
            referencedColumns: ["id"];
          },
        ];
      };
      reports: {
        Row: {
          created_at: string;
          event_id: string | null;
          id: string;
          note: string | null;
          reason: Database["public"]["Enums"]["report_reason"];
          reported: string;
          reporter: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          event_id?: string | null;
          id?: string;
          note?: string | null;
          reason: Database["public"]["Enums"]["report_reason"];
          reported: string;
          reporter: string;
        };
        Update: {
          created_at?: string;
          event_id?: string | null;
          id?: string;
          note?: string | null;
          reason?: Database["public"]["Enums"]["report_reason"];
          reported?: string;
          reporter?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reports_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
        ];
      };
      scene_members: {
        Row: {
          created_at: string;
          scene_id: string;
          user_id: string;
          verified_at: string | null;
          verified_email: string | null;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          scene_id: string;
          user_id: string;
          verified_at?: string | null;
          verified_email?: string | null;
        };
        Update: {
          created_at?: string;
          scene_id?: string;
          user_id?: string;
          verified_at?: string | null;
          verified_email?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "scene_members_scene_id_fkey";
            columns: ["scene_id"];
            isOneToOne: false;
            referencedRelation: "scenes";
            referencedColumns: ["id"];
          },
        ];
      };
      scenes: {
        Row: {
          created_at: string;
          description_en: string;
          description_uk: string;
          email_domain: string | null;
          gradient: string;
          id: string;
          kind: Database["public"]["Enums"]["scene_kind"];
          name_en: string;
          name_uk: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          description_en?: string;
          description_uk?: string;
          email_domain?: string | null;
          gradient?: string;
          id: string;
          kind: Database["public"]["Enums"]["scene_kind"];
          name_en: string;
          name_uk: string;
        };
        Update: {
          created_at?: string;
          description_en?: string;
          description_uk?: string;
          email_domain?: string | null;
          gradient?: string;
          id?: string;
          kind?: Database["public"]["Enums"]["scene_kind"];
          name_en?: string;
          name_uk?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      can_enter_scene: { Args: { p_scene: string; p_user?: string }; Returns: boolean };
      chat_open: { Args: { p_match: string }; Returns: boolean };
      event_stats: {
        Args: { p_event: string };
        Returns: {
          going: number;
          solo: number;
        }[];
      };
      events_stats: {
        Args: { p_events: string[] };
        Returns: {
          event_id: string;
          going: number;
          solo: number;
        }[];
      };
      is_blocked: { Args: { p_a: string; p_b: string }; Returns: boolean };
      is_going: { Args: { p_event: string; p_user?: string }; Returns: boolean };
      is_match_member: { Args: { p_match: string; p_user?: string }; Returns: boolean };
      join_scene: { Args: { p_scene: string }; Returns: undefined };
      scene_stats: {
        Args: Record<PropertyKey, never>;
        Returns: {
          members: number;
          scene_id: string;
        }[];
      };
      shares_event: { Args: { p_other: string; p_user?: string }; Returns: boolean };
    };
    Enums: {
      decision: "go" | "skip";
      going_with: "solo" | "friends";
      report_reason: "messages" | "dating" | "fake" | "unsafe" | "other";
      scene_kind: "campus" | "venue" | "guest";
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
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      decision: ["go", "skip"],
      going_with: ["solo", "friends"],
      report_reason: ["messages", "dating", "fake", "unsafe", "other"],
      scene_kind: ["campus", "venue", "guest"],
    },
  },
} as const;
