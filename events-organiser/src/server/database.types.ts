export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

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
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
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
      events: {
        Row: {
          created_at: string;
          currency: string;
          description: string | null;
          first_published_at: string | null;
          id: string;
          organiser_id: string;
          public_id: string;
          slug: string;
          starts_at: string;
          status: Database["public"]["Enums"]["event_status"];
          title: string;
          updated_at: string;
          venue_id: string;
        };
        Insert: {
          created_at?: string;
          currency: string;
          description?: string | null;
          first_published_at?: string | null;
          id?: string;
          organiser_id: string;
          public_id?: string;
          slug: string;
          starts_at: string;
          status?: Database["public"]["Enums"]["event_status"];
          title: string;
          updated_at?: string;
          venue_id: string;
        };
        Update: {
          created_at?: string;
          currency?: string;
          description?: string | null;
          first_published_at?: string | null;
          id?: string;
          organiser_id?: string;
          public_id?: string;
          slug?: string;
          starts_at?: string;
          status?: Database["public"]["Enums"]["event_status"];
          title?: string;
          updated_at?: string;
          venue_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "events_organiser_id_fkey";
            columns: ["organiser_id"];
            isOneToOne: false;
            referencedRelation: "organisers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "events_venue_id_organiser_id_fkey";
            columns: ["venue_id", "organiser_id"];
            isOneToOne: false;
            referencedRelation: "venues";
            referencedColumns: ["id", "organiser_id"];
          },
        ];
      };
      organisers: {
        Row: {
          created_at: string;
          display_name: string;
          id: string;
        };
        Insert: {
          created_at?: string;
          display_name: string;
          id: string;
        };
        Update: {
          created_at?: string;
          display_name?: string;
          id?: string;
        };
        Relationships: [];
      };
      ticket_tiers: {
        Row: {
          capacity: number;
          created_at: string;
          event_id: string;
          id: string;
          name: string;
          position: number;
          price: number;
          updated_at: string;
        };
        Insert: {
          capacity: number;
          created_at?: string;
          event_id: string;
          id?: string;
          name: string;
          position?: number;
          price: number;
          updated_at?: string;
        };
        Update: {
          capacity?: number;
          created_at?: string;
          event_id?: string;
          id?: string;
          name?: string;
          position?: number;
          price?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ticket_tiers_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
        ];
      };
      venues: {
        Row: {
          address: string;
          city: string;
          country: string;
          created_at: string;
          id: string;
          name: string;
          organiser_id: string;
          timezone: string;
          updated_at: string;
        };
        Insert: {
          address: string;
          city: string;
          country: string;
          created_at?: string;
          id?: string;
          name: string;
          organiser_id: string;
          timezone: string;
          updated_at?: string;
        };
        Update: {
          address?: string;
          city?: string;
          country?: string;
          created_at?: string;
          id?: string;
          name?: string;
          organiser_id?: string;
          timezone?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "venues_organiser_id_fkey";
            columns: ["organiser_id"];
            isOneToOne: false;
            referencedRelation: "organisers";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      published_events: {
        Row: {
          currency: string | null;
          description: string | null;
          organiser_name: string | null;
          public_id: string | null;
          search_text: string | null;
          slug: string | null;
          starts_at: string | null;
          tiers: Json | null;
          title: string | null;
          updated_at: string | null;
          venue_address: string | null;
          venue_city: string | null;
          venue_country: string | null;
          venue_name: string | null;
          venue_timezone: string | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      save_event: {
        Args: {
          p_currency: string;
          p_description?: string;
          p_event_id?: string;
          p_new_venue?: Json;
          p_slug: string;
          p_starts_at: string;
          p_tiers: Json;
          p_title: string;
          p_venue_id?: string;
        };
        Returns: string;
      };
      update_venue: {
        Args: {
          p_address: string;
          p_city: string;
          p_country: string;
          p_name: string;
          p_timezone: string;
          p_venue_id: string;
        };
        Returns: undefined;
      };
    };
    Enums: {
      event_status: "draft" | "published";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

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
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      event_status: ["draft", "published"],
    },
  },
} as const;
