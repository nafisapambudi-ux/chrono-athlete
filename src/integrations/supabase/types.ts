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
      athlete_readiness: {
        Row: {
          athlete_id: string
          created_at: string
          id: string
          power: number | null
          readiness_date: string
          readiness_score: number | null
          resting_heart_rate: number
          vertical_jump: number
          vo2max: number | null
        }
        Insert: {
          athlete_id: string
          created_at?: string
          id?: string
          power?: number | null
          readiness_date: string
          readiness_score?: number | null
          resting_heart_rate: number
          vertical_jump: number
          vo2max?: number | null
        }
        Update: {
          athlete_id?: string
          created_at?: string
          id?: string
          power?: number | null
          readiness_date?: string
          readiness_score?: number | null
          resting_heart_rate?: number
          vertical_jump?: number
          vo2max?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_athlete"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
        ]
      }
      athlete_tests: {
        Row: {
          athlete_id: string
          body_weight_at_test: number | null
          created_at: string
          id: string
          notes: string | null
          result_unit: string
          result_value: number
          test_category: string
          test_date: string
          test_name: string
          updated_at: string
        }
        Insert: {
          athlete_id: string
          body_weight_at_test?: number | null
          created_at?: string
          id?: string
          notes?: string | null
          result_unit: string
          result_value: number
          test_category: string
          test_date?: string
          test_name: string
          updated_at?: string
        }
        Update: {
          athlete_id?: string
          body_weight_at_test?: number | null
          created_at?: string
          id?: string
          notes?: string | null
          result_unit?: string
          result_value?: number
          test_category?: string
          test_date?: string
          test_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "athlete_tests_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
        ]
      }
      athletes: {
        Row: {
          avatar_url: string | null
          birth_date: string | null
          body_height: number | null
          created_at: string
          gender: string | null
          id: string
          linked_user_id: string | null
          mass: number | null
          name: string
          sports_branch: string | null
          updated_at: string
          user_id: string
          vertical_jump: number | null
        }
        Insert: {
          avatar_url?: string | null
          birth_date?: string | null
          body_height?: number | null
          created_at?: string
          gender?: string | null
          id?: string
          linked_user_id?: string | null
          mass?: number | null
          name: string
          sports_branch?: string | null
          updated_at?: string
          user_id: string
          vertical_jump?: number | null
        }
        Update: {
          avatar_url?: string | null
          birth_date?: string | null
          body_height?: number | null
          created_at?: string
          gender?: string | null
          id?: string
          linked_user_id?: string | null
          mass?: number | null
          name?: string
          sports_branch?: string | null
          updated_at?: string
          user_id?: string
          vertical_jump?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "athletes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          id: string
        }
        Insert: {
          created_at?: string
          id: string
        }
        Update: {
          created_at?: string
          id?: string
        }
        Relationships: []
      }
      program_exercises: {
        Row: {
          created_at: string
          exercise_name: string
          exercise_type: string
          id: string
          load_value: string | null
          order_index: number
          program_id: string
          reps: number | null
          sets: number | null
        }
        Insert: {
          created_at?: string
          exercise_name: string
          exercise_type?: string
          id?: string
          load_value?: string | null
          order_index?: number
          program_id: string
          reps?: number | null
          sets?: number | null
        }
        Update: {
          created_at?: string
          exercise_name?: string
          exercise_type?: string
          id?: string
          load_value?: string | null
          order_index?: number
          program_id?: string
          reps?: number | null
          sets?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "program_exercises_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "training_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      training_programs: {
        Row: {
          athlete_id: string
          completed_duration_minutes: number | null
          completed_rpe: number | null
          cooling_down: string | null
          created_at: string
          id: string
          is_completed: boolean
          notes: string | null
          program_date: string
          program_type: string
          updated_at: string
          warm_up: string | null
        }
        Insert: {
          athlete_id: string
          completed_duration_minutes?: number | null
          completed_rpe?: number | null
          cooling_down?: string | null
          created_at?: string
          id?: string
          is_completed?: boolean
          notes?: string | null
          program_date: string
          program_type?: string
          updated_at?: string
          warm_up?: string | null
        }
        Update: {
          athlete_id?: string
          completed_duration_minutes?: number | null
          completed_rpe?: number | null
          cooling_down?: string | null
          created_at?: string
          id?: string
          is_completed?: boolean
          notes?: string | null
          program_date?: string
          program_type?: string
          updated_at?: string
          warm_up?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "training_programs_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
        ]
      }
      training_sessions: {
        Row: {
          athlete_id: string
          created_at: string
          duration_minutes: number
          id: string
          notes: string | null
          rpe: number
          session_date: string
        }
        Insert: {
          athlete_id: string
          created_at?: string
          duration_minutes: number
          id?: string
          notes?: string | null
          rpe: number
          session_date: string
        }
        Update: {
          athlete_id?: string
          created_at?: string
          duration_minutes?: number
          id?: string
          notes?: string | null
          rpe?: number
          session_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_sessions_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_email: { Args: { user_id_param: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "owner" | "coach" | "athlete"
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
    Enums: {
      app_role: ["owner", "coach", "athlete"],
    },
  },
} as const
