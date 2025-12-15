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
      medications: {
        Row: {
          compliance_percent: number | null
          dosage: string | null
          id: string
          name: string
          patient_id: string
        }
        Insert: {
          compliance_percent?: number | null
          dosage?: string | null
          id?: string
          name: string
          patient_id: string
        }
        Update: {
          compliance_percent?: number | null
          dosage?: string | null
          id?: string
          name?: string
          patient_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "medications_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          action: string | null
          age: number | null
          burden: string | null
          center_id: string
          created_at: string
          days_until_visit: number | null
          doctor: string | null
          exclusion_reason: string | null
          gender: string | null
          has_dm: boolean | null
          has_dyslipidemia: boolean | null
          has_htn: boolean | null
          id: string
          name: string
          national_id: string
          phone: string | null
          status: string | null
          symptoms: Json | null
          team: string | null
          updated_at: string
          urgency_status: string | null
          visit_window_text: string | null
        }
        Insert: {
          action?: string | null
          age?: number | null
          burden?: string | null
          center_id: string
          created_at?: string
          days_until_visit?: number | null
          doctor?: string | null
          exclusion_reason?: string | null
          gender?: string | null
          has_dm?: boolean | null
          has_dyslipidemia?: boolean | null
          has_htn?: boolean | null
          id?: string
          name: string
          national_id: string
          phone?: string | null
          status?: string | null
          symptoms?: Json | null
          team?: string | null
          updated_at?: string
          urgency_status?: string | null
          visit_window_text?: string | null
        }
        Update: {
          action?: string | null
          age?: number | null
          burden?: string | null
          center_id?: string
          created_at?: string
          days_until_visit?: number | null
          doctor?: string | null
          exclusion_reason?: string | null
          gender?: string | null
          has_dm?: boolean | null
          has_dyslipidemia?: boolean | null
          has_htn?: boolean | null
          id?: string
          name?: string
          national_id?: string
          phone?: string | null
          status?: string | null
          symptoms?: Json | null
          team?: string | null
          updated_at?: string
          urgency_status?: string | null
          visit_window_text?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          center_id: string | null
          created_at: string
          id: string
          name_ar: string | null
          user_id: string
          username: string
        }
        Insert: {
          center_id?: string | null
          created_at?: string
          id?: string
          name_ar?: string | null
          user_id: string
          username: string
        }
        Update: {
          center_id?: string | null
          created_at?: string
          id?: string
          name_ar?: string | null
          user_id?: string
          username?: string
        }
        Relationships: []
      }
      screening_data: {
        Row: {
          appointment_date: string | null
          id: string
          last_lab: string | null
          notes: string | null
          patient_id: string
          prev_contact: string | null
          residence: string | null
          rx_status: string | null
          screened_at: string | null
          screened_by: string | null
          visit_type: string | null
        }
        Insert: {
          appointment_date?: string | null
          id?: string
          last_lab?: string | null
          notes?: string | null
          patient_id: string
          prev_contact?: string | null
          residence?: string | null
          rx_status?: string | null
          screened_at?: string | null
          screened_by?: string | null
          visit_type?: string | null
        }
        Update: {
          appointment_date?: string | null
          id?: string
          last_lab?: string | null
          notes?: string | null
          patient_id?: string
          prev_contact?: string | null
          residence?: string | null
          rx_status?: string | null
          screened_at?: string | null
          screened_by?: string | null
          visit_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "screening_data_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          key: string
          value: Json
        }
        Insert: {
          key: string
          value: Json
        }
        Update: {
          key?: string
          value?: Json
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
      get_user_center_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "superadmin" | "center"
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
      app_role: ["superadmin", "center"],
    },
  },
} as const
