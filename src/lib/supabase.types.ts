export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      app_users: {
        Row: {
          auth_user_id: string
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          auth_user_id: string
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
        }
        Update: {
          auth_user_id?: string
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      game_roster_slots: {
        Row: {
          created_at: string
          game_id: string
          id: string
          order_index: number
          player_id: string
          position_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          game_id: string
          id?: string
          order_index: number
          player_id: string
          position_id?: string | null
          status: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          game_id?: string
          id?: string
          order_index?: number
          player_id?: string
          position_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_roster_slots_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_roster_slots_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_roster_slots_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "positions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_roster_slots_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "positions_with_sport"
            referencedColumns: ["id"]
          },
        ]
      }
      games: {
        Row: {
          created_at: string
          id: string
          location: string | null
          notes: string | null
          opponent: string | null
          players_on_field: number | null
          scheduled_start: string | null
          status: string
          team_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          location?: string | null
          notes?: string | null
          opponent?: string | null
          players_on_field?: number | null
          scheduled_start?: string | null
          status?: string
          team_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          location?: string | null
          notes?: string | null
          opponent?: string | null
          players_on_field?: number | null
          scheduled_start?: string | null
          status?: string
          team_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "games_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      player_position_preferences: {
        Row: {
          created_at: string
          player_id: string
          position_id: string
          preference_rank: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          player_id: string
          position_id: string
          preference_rank?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          player_id?: string
          position_id?: string
          preference_rank?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_position_preferences_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_position_preferences_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "positions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_position_preferences_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "positions_with_sport"
            referencedColumns: ["id"]
          },
        ]
      }
      players: {
        Row: {
          created_at: string
          full_name: string
          id: string
          jersey_number: string | null
          notes: string | null
          primary_position_id: string | null
          status: string
          team_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name: string
          id?: string
          jersey_number?: string | null
          notes?: string | null
          primary_position_id?: string | null
          status?: string
          team_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          jersey_number?: string | null
          notes?: string | null
          primary_position_id?: string | null
          status?: string
          team_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "players_primary_position_id_fkey"
            columns: ["primary_position_id"]
            isOneToOne: false
            referencedRelation: "positions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "players_primary_position_id_fkey"
            columns: ["primary_position_id"]
            isOneToOne: false
            referencedRelation: "positions_with_sport"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "players_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      positions: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          label: string
          order_index: number | null
          owner_id: string | null
          sport_id: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          label: string
          order_index?: number | null
          owner_id?: string | null
          sport_id: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          label?: string
          order_index?: number | null
          owner_id?: string | null
          sport_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "positions_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "positions_sport_id_fkey"
            columns: ["sport_id"]
            isOneToOne: false
            referencedRelation: "sports"
            referencedColumns: ["id"]
          },
        ]
      }
      sports: {
        Row: {
          code: string
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      substitutions: {
        Row: {
          created_at: string
          game_id: string
          id: string
          notes: string | null
          occurred_at: string
          period: string | null
          player_in_id: string | null
          player_out_id: string | null
        }
        Insert: {
          created_at?: string
          game_id: string
          id?: string
          notes?: string | null
          occurred_at?: string
          period?: string | null
          player_in_id?: string | null
          player_out_id?: string | null
        }
        Update: {
          created_at?: string
          game_id?: string
          id?: string
          notes?: string | null
          occurred_at?: string
          period?: string | null
          player_in_id?: string | null
          player_out_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "substitutions_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "substitutions_player_in_id_fkey"
            columns: ["player_in_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "substitutions_player_out_id_fkey"
            columns: ["player_out_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string
          id: string
          name: string
          notes: string | null
          owner_id: string
          sport_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          owner_id: string
          sport_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          owner_id?: string
          sport_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "teams_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teams_sport_id_fkey"
            columns: ["sport_id"]
            isOneToOne: false
            referencedRelation: "sports"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      positions_with_sport: {
        Row: {
          created_at: string | null
          description: string | null
          id: string | null
          label: string | null
          order_index: number | null
          owner_id: string | null
          position_code: string | null
          sport_code: string | null
          sport_id: string | null
          sport_name: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "positions_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "positions_sport_id_fkey"
            columns: ["sport_id"]
            isOneToOne: false
            referencedRelation: "sports"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      app_current_user_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
