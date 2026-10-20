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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      activities: {
        Row: {
          created_at: string
          created_by: string | null
          date: string
          household_id: string
          id: string
          note: string | null
          product: string | null
          rate_per_ha: number | null
          rate_unit: string | null
          season_id: string
          type: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          date: string
          household_id?: string
          id?: string
          note?: string | null
          product?: string | null
          rate_per_ha?: number | null
          rate_unit?: string | null
          season_id: string
          type: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          date?: string
          household_id?: string
          id?: string
          note?: string | null
          product?: string | null
          rate_per_ha?: number | null
          rate_unit?: string | null
          season_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "activities_season_id_household_id_fkey"
            columns: ["season_id", "household_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id", "household_id"]
          },
        ]
      }
      costs: {
        Row: {
          created_at: string
          created_by: string | null
          currency: string
          date: string
          description: string
          exchange_rate: number | null
          household_id: string
          id: string
          quantity: number | null
          total: number
          total_rsd: number
          type: string
          unit: string | null
          unit_price: number | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          currency: string
          date: string
          description?: string
          exchange_rate?: number | null
          household_id?: string
          id?: string
          quantity?: number | null
          total: number
          total_rsd: number
          type: string
          unit?: string | null
          unit_price?: number | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          currency?: string
          date?: string
          description?: string
          exchange_rate?: number | null
          household_id?: string
          id?: string
          quantity?: number | null
          total?: number
          total_rsd?: number
          type?: string
          unit?: string | null
          unit_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "costs_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      household_members: {
        Row: {
          display_name: string | null
          email: string | null
          household_id: string
          joined_at: string
          user_id: string
        }
        Insert: {
          display_name?: string | null
          email?: string | null
          household_id: string
          joined_at?: string
          user_id: string
        }
        Update: {
          display_name?: string | null
          email?: string | null
          household_id?: string
          joined_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "household_members_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      households: {
        Row: {
          created_at: string
          id: string
          invite_code: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          invite_code?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          invite_code?: string
          name?: string
        }
        Relationships: []
      }
      incomes: {
        Row: {
          buyer: string | null
          created_at: string
          created_by: string | null
          crop: string | null
          currency: string
          date: string
          description: string | null
          exchange_rate: number | null
          household_id: string
          id: string
          kind: string
          price_per_kg: number | null
          quantity_kg: number | null
          total: number
          total_rsd: number
        }
        Insert: {
          buyer?: string | null
          created_at?: string
          created_by?: string | null
          crop?: string | null
          currency: string
          date: string
          description?: string | null
          exchange_rate?: number | null
          household_id?: string
          id?: string
          kind: string
          price_per_kg?: number | null
          quantity_kg?: number | null
          total: number
          total_rsd: number
        }
        Update: {
          buyer?: string | null
          created_at?: string
          created_by?: string | null
          crop?: string | null
          currency?: string
          date?: string
          description?: string | null
          exchange_rate?: number | null
          household_id?: string
          id?: string
          kind?: string
          price_per_kg?: number | null
          quantity_kg?: number | null
          total?: number
          total_rsd?: number
        }
        Relationships: [
          {
            foreignKeyName: "incomes_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      parcels: {
        Row: {
          area_ha: number
          created_at: string
          created_by: string | null
          household_id: string
          id: string
          municipality: string
          name: string
          note: string | null
          number: string
        }
        Insert: {
          area_ha: number
          created_at?: string
          created_by?: string | null
          household_id?: string
          id?: string
          municipality: string
          name: string
          note?: string | null
          number: string
        }
        Update: {
          area_ha?: number
          created_at?: string
          created_by?: string | null
          household_id?: string
          id?: string
          municipality?: string
          name?: string
          note?: string | null
          number?: string
        }
        Relationships: [
          {
            foreignKeyName: "parcels_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      seasons: {
        Row: {
          created_at: string
          created_by: string | null
          crop: string
          household_id: string
          hybrid: string | null
          id: string
          note: string | null
          parcel_id: string
          year: number
          yield_kg: number | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          crop: string
          household_id?: string
          hybrid?: string | null
          id?: string
          note?: string | null
          parcel_id: string
          year: number
          yield_kg?: number | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          crop?: string
          household_id?: string
          hybrid?: string | null
          id?: string
          note?: string | null
          parcel_id?: string
          year?: number
          yield_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "seasons_parcel_id_household_id_fkey"
            columns: ["parcel_id", "household_id"]
            isOneToOne: false
            referencedRelation: "parcels"
            referencedColumns: ["id", "household_id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_household: {
        Args: { household_name: string }
        Returns: {
          created_at: string
          id: string
          invite_code: string
          name: string
        }
        SetofOptions: {
          from: "*"
          to: "households"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      join_household: {
        Args: { code: string }
        Returns: {
          created_at: string
          id: string
          invite_code: string
          name: string
        }
        SetofOptions: {
          from: "*"
          to: "households"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      regenerate_invite_code: { Args: never; Returns: string }
      replace_household_data: { Args: { payload: Json }; Returns: undefined }
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
