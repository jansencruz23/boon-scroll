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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      articles: {
        Row: {
          ai_reason: string
          author: string
          category_id: string | null
          category_name: string
          confidence: number
          content_preview: string
          created_at: string
          feedback: string | null
          fetched_at: string
          id: string
          is_emailed: boolean
          is_relevant: boolean
          is_saved: boolean
          priority: number
          published_at: string | null
          source_id: string
          tags: string[]
          title: string
          url: string
          user_id: string
        }
        Insert: {
          ai_reason?: string
          author?: string
          category_id?: string | null
          category_name?: string
          confidence?: number
          content_preview?: string
          created_at?: string
          feedback?: string | null
          fetched_at?: string
          id?: string
          is_emailed?: boolean
          is_relevant?: boolean
          is_saved?: boolean
          priority?: number
          published_at?: string | null
          source_id: string
          tags?: string[]
          title: string
          url: string
          user_id: string
        }
        Update: {
          ai_reason?: string
          author?: string
          category_id?: string | null
          category_name?: string
          confidence?: number
          content_preview?: string
          created_at?: string
          feedback?: string | null
          fetched_at?: string
          id?: string
          is_emailed?: boolean
          is_relevant?: boolean
          is_saved?: boolean
          priority?: number
          published_at?: string | null
          source_id?: string
          tags?: string[]
          title?: string
          url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "articles_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "articles_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "sources"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          color: string
          created_at: string
          description: string
          display_name: string
          emoji: string
          id: string
          is_active: boolean
          name: string
          priority: number
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          description?: string
          display_name: string
          emoji?: string
          id?: string
          is_active?: boolean
          name: string
          priority?: number
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string
          description?: string
          display_name?: string
          emoji?: string
          id?: string
          is_active?: boolean
          name?: string
          priority?: number
          user_id?: string
        }
        Relationships: []
      }
      digest_runs: {
        Row: {
          completed_at: string | null
          created_at: string
          email_sent: boolean
          error_log: Json
          id: string
          started_at: string
          status: string
          total_errors: number
          total_fetched: number
          total_passed: number
          trigger: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          email_sent?: boolean
          error_log?: Json
          id?: string
          started_at?: string
          status?: string
          total_errors?: number
          total_fetched?: number
          total_passed?: number
          trigger?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          email_sent?: boolean
          error_log?: Json
          id?: string
          started_at?: string
          status?: string
          total_errors?: number
          total_fetched?: number
          total_passed?: number
          trigger?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          confidence_threshold: number
          created_at: string
          digest_email: string | null
          digest_enabled: boolean
          digest_frequency: string
          digest_hour: number
          display_name: string | null
          gemini_api_key: string | null
          id: string
          interest_keywords: string | null
          onboarding_completed: boolean
          strictness: string
          timezone: string
          updated_at: string
        }
        Insert: {
          confidence_threshold?: number
          created_at?: string
          digest_email?: string | null
          digest_enabled?: boolean
          digest_frequency?: string
          digest_hour?: number
          display_name?: string | null
          gemini_api_key?: string | null
          id: string
          interest_keywords?: string | null
          onboarding_completed?: boolean
          strictness?: string
          timezone?: string
          updated_at?: string
        }
        Update: {
          confidence_threshold?: number
          created_at?: string
          digest_email?: string | null
          digest_enabled?: boolean
          digest_frequency?: string
          digest_hour?: number
          display_name?: string | null
          gemini_api_key?: string | null
          id?: string
          interest_keywords?: string | null
          onboarding_completed?: boolean
          strictness?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      sources: {
        Row: {
          category_tags: string[]
          created_at: string
          id: string
          is_active: boolean
          last_fetch_count: number
          last_fetched_at: string | null
          last_pass_count: number
          name: string
          rss_url: string
          type: string
          updated_at: string
          url: string
          user_id: string
        }
        Insert: {
          category_tags?: string[]
          created_at?: string
          id?: string
          is_active?: boolean
          last_fetch_count?: number
          last_fetched_at?: string | null
          last_pass_count?: number
          name: string
          rss_url: string
          type?: string
          updated_at?: string
          url: string
          user_id: string
        }
        Update: {
          category_tags?: string[]
          created_at?: string
          id?: string
          is_active?: boolean
          last_fetch_count?: number
          last_fetched_at?: string | null
          last_pass_count?: number
          name?: string
          rss_url?: string
          type?: string
          updated_at?: string
          url?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
