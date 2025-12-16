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
      age_groups: {
        Row: {
          color_code: string | null
          created_at: string
          group_id: number
          group_name_ar: string
          group_name_en: string
          icon: string | null
          id: string
          max_age: number
          min_age: number
          updated_at: string
          visit_frequency: string | null
        }
        Insert: {
          color_code?: string | null
          created_at?: string
          group_id: number
          group_name_ar: string
          group_name_en: string
          icon?: string | null
          id?: string
          max_age: number
          min_age: number
          updated_at?: string
          visit_frequency?: string | null
        }
        Update: {
          color_code?: string | null
          created_at?: string
          group_id?: number
          group_name_ar?: string
          group_name_en?: string
          icon?: string | null
          id?: string
          max_age?: number
          min_age?: number
          updated_at?: string
          visit_frequency?: string | null
        }
        Relationships: []
      }
      health_education: {
        Row: {
          age_group: string
          created_at: string
          format: string | null
          id: string
          is_active: boolean
          priority: string
          topic_id: string
          topic_name_ar: string
          topic_name_en: string
          updated_at: string
        }
        Insert: {
          age_group: string
          created_at?: string
          format?: string | null
          id?: string
          is_active?: boolean
          priority: string
          topic_id: string
          topic_name_ar: string
          topic_name_en: string
          updated_at?: string
        }
        Update: {
          age_group?: string
          created_at?: string
          format?: string | null
          id?: string
          is_active?: boolean
          priority?: string
          topic_id?: string
          topic_name_ar?: string
          topic_name_en?: string
          updated_at?: string
        }
        Relationships: []
      }
      immunizations: {
        Row: {
          created_at: string
          doses: number
          id: string
          is_active: boolean
          max_age_years: number
          min_age_months: number
          priority: string
          schedule: string | null
          updated_at: string
          vaccine_id: string
          vaccine_name_ar: string
          vaccine_name_en: string
        }
        Insert: {
          created_at?: string
          doses?: number
          id?: string
          is_active?: boolean
          max_age_years: number
          min_age_months: number
          priority: string
          schedule?: string | null
          updated_at?: string
          vaccine_id: string
          vaccine_name_ar: string
          vaccine_name_en: string
        }
        Update: {
          created_at?: string
          doses?: number
          id?: string
          is_active?: boolean
          max_age_years?: number
          min_age_months?: number
          priority?: string
          schedule?: string | null
          updated_at?: string
          vaccine_id?: string
          vaccine_name_ar?: string
          vaccine_name_en?: string
        }
        Relationships: []
      }
      medications: {
        Row: {
          compliance_percent: number | null
          dosage: string | null
          id: string
          name: string
          patient_id: string
          prediction_accuracy: number | null
        }
        Insert: {
          compliance_percent?: number | null
          dosage?: string | null
          id?: string
          name: string
          patient_id: string
          prediction_accuracy?: number | null
        }
        Update: {
          compliance_percent?: number | null
          dosage?: string | null
          id?: string
          name?: string
          patient_id?: string
          prediction_accuracy?: number | null
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
      patient_eligibility: {
        Row: {
          created_at: string
          due_date: string | null
          id: string
          is_eligible: boolean
          last_completed_date: string | null
          patient_age: number
          patient_gender: string
          patient_id: string
          patient_name: string
          priority: string
          service_code: string
          service_id: string
          service_name_ar: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          due_date?: string | null
          id?: string
          is_eligible?: boolean
          last_completed_date?: string | null
          patient_age: number
          patient_gender: string
          patient_id: string
          patient_name: string
          priority: string
          service_code: string
          service_id: string
          service_name_ar: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          due_date?: string | null
          id?: string
          is_eligible?: boolean
          last_completed_date?: string | null
          patient_age?: number
          patient_gender?: string
          patient_id?: string
          patient_name?: string
          priority?: string
          service_code?: string
          service_id?: string
          service_name_ar?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      patients: {
        Row: {
          action: string | null
          action_required: string | null
          age: number | null
          avg_days_between_visits: number | null
          bp_last_visit: string | null
          burden: string | null
          call_date: string | null
          call_notes: string | null
          call_status: string | null
          center_id: string
          chronic_risk_score: string | null
          clinical_validation: string | null
          created_at: string
          cycle_days: number | null
          cycle_type_new: string | null
          days_until_visit: number | null
          doctor: string | null
          eligible_dlp_screening: boolean | null
          eligible_dm_screening: boolean | null
          eligible_htn_screening: boolean | null
          exclusion_reason: string | null
          fasting_blood_glucose: number | null
          gender: string | null
          has_dm: boolean | null
          has_dyslipidemia: boolean | null
          has_htn: boolean | null
          hba1c: number | null
          id: string
          last_visit_date: string | null
          latest_prescription_date: string | null
          ldl: number | null
          med_prediction_confidence: number | null
          medication_categories: string | null
          name: string
          national_id: string
          obesity_class: string | null
          phone: string | null
          predicted_medications: string | null
          predicted_visit_date: string | null
          prescription_with_dosage: string | null
          smoking_status: string | null
          source: string | null
          status: string | null
          symptoms: Json | null
          team: string | null
          total_chronic_meds: number | null
          updated_at: string
          urgency_status: string | null
          visit_count: number | null
          visit_window_text: string | null
        }
        Insert: {
          action?: string | null
          action_required?: string | null
          age?: number | null
          avg_days_between_visits?: number | null
          bp_last_visit?: string | null
          burden?: string | null
          call_date?: string | null
          call_notes?: string | null
          call_status?: string | null
          center_id: string
          chronic_risk_score?: string | null
          clinical_validation?: string | null
          created_at?: string
          cycle_days?: number | null
          cycle_type_new?: string | null
          days_until_visit?: number | null
          doctor?: string | null
          eligible_dlp_screening?: boolean | null
          eligible_dm_screening?: boolean | null
          eligible_htn_screening?: boolean | null
          exclusion_reason?: string | null
          fasting_blood_glucose?: number | null
          gender?: string | null
          has_dm?: boolean | null
          has_dyslipidemia?: boolean | null
          has_htn?: boolean | null
          hba1c?: number | null
          id?: string
          last_visit_date?: string | null
          latest_prescription_date?: string | null
          ldl?: number | null
          med_prediction_confidence?: number | null
          medication_categories?: string | null
          name: string
          national_id: string
          obesity_class?: string | null
          phone?: string | null
          predicted_medications?: string | null
          predicted_visit_date?: string | null
          prescription_with_dosage?: string | null
          smoking_status?: string | null
          source?: string | null
          status?: string | null
          symptoms?: Json | null
          team?: string | null
          total_chronic_meds?: number | null
          updated_at?: string
          urgency_status?: string | null
          visit_count?: number | null
          visit_window_text?: string | null
        }
        Update: {
          action?: string | null
          action_required?: string | null
          age?: number | null
          avg_days_between_visits?: number | null
          bp_last_visit?: string | null
          burden?: string | null
          call_date?: string | null
          call_notes?: string | null
          call_status?: string | null
          center_id?: string
          chronic_risk_score?: string | null
          clinical_validation?: string | null
          created_at?: string
          cycle_days?: number | null
          cycle_type_new?: string | null
          days_until_visit?: number | null
          doctor?: string | null
          eligible_dlp_screening?: boolean | null
          eligible_dm_screening?: boolean | null
          eligible_htn_screening?: boolean | null
          exclusion_reason?: string | null
          fasting_blood_glucose?: number | null
          gender?: string | null
          has_dm?: boolean | null
          has_dyslipidemia?: boolean | null
          has_htn?: boolean | null
          hba1c?: number | null
          id?: string
          last_visit_date?: string | null
          latest_prescription_date?: string | null
          ldl?: number | null
          med_prediction_confidence?: number | null
          medication_categories?: string | null
          name?: string
          national_id?: string
          obesity_class?: string | null
          phone?: string | null
          predicted_medications?: string | null
          predicted_visit_date?: string | null
          prescription_with_dosage?: string | null
          smoking_status?: string | null
          source?: string | null
          status?: string | null
          symptoms?: Json | null
          team?: string | null
          total_chronic_meds?: number | null
          updated_at?: string
          urgency_status?: string | null
          visit_count?: number | null
          visit_window_text?: string | null
        }
        Relationships: []
      }
      preventive_services: {
        Row: {
          category: string
          created_at: string
          description_ar: string | null
          frequency_months: number
          gender: string
          id: string
          is_active: boolean
          max_age: number
          min_age: number
          priority: string
          risk_factors: string | null
          service_code: string
          service_id: string
          service_name_ar: string
          service_name_en: string
          updated_at: string
          uspstf_grade: string | null
        }
        Insert: {
          category: string
          created_at?: string
          description_ar?: string | null
          frequency_months?: number
          gender: string
          id?: string
          is_active?: boolean
          max_age: number
          min_age: number
          priority: string
          risk_factors?: string | null
          service_code: string
          service_id: string
          service_name_ar: string
          service_name_en: string
          updated_at?: string
          uspstf_grade?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          description_ar?: string | null
          frequency_months?: number
          gender?: string
          id?: string
          is_active?: boolean
          max_age?: number
          min_age?: number
          priority?: string
          risk_factors?: string | null
          service_code?: string
          service_id?: string
          service_name_ar?: string
          service_name_en?: string
          updated_at?: string
          uspstf_grade?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          center_id: string | null
          created_at: string
          id: string
          job_title: string | null
          name_ar: string | null
          team: string | null
          user_id: string
          username: string
        }
        Insert: {
          avatar_url?: string | null
          center_id?: string | null
          created_at?: string
          id?: string
          job_title?: string | null
          name_ar?: string | null
          team?: string | null
          user_id: string
          username: string
        }
        Update: {
          avatar_url?: string | null
          center_id?: string | null
          created_at?: string
          id?: string
          job_title?: string | null
          name_ar?: string | null
          team?: string | null
          user_id?: string
          username?: string
        }
        Relationships: []
      }
      schedules: {
        Row: {
          center_name: string
          created_at: string
          date: string
          doctor_id: string
          doctor_name: string
          id: string
          status: string
          updated_at: string
        }
        Insert: {
          center_name: string
          created_at?: string
          date: string
          doctor_id: string
          doctor_name: string
          id?: string
          status?: string
          updated_at?: string
        }
        Update: {
          center_name?: string
          created_at?: string
          date?: string
          doctor_id?: string
          doctor_name?: string
          id?: string
          status?: string
          updated_at?: string
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
          referral_reason: string | null
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
          referral_reason?: string | null
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
          referral_reason?: string | null
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
      virtual_clinic_data: {
        Row: {
          chest_pain: boolean | null
          created_at: string
          examined_at: string | null
          examined_by: string | null
          final_action: string
          id: string
          loss_of_consciousness: boolean | null
          notes: string | null
          patient_id: string
          referral_specialty: string | null
          severe_headache: boolean | null
          severe_hypoglycemia: boolean | null
          severe_shortness_of_breath: boolean | null
          updated_at: string
          vision_changes: boolean | null
        }
        Insert: {
          chest_pain?: boolean | null
          created_at?: string
          examined_at?: string | null
          examined_by?: string | null
          final_action: string
          id?: string
          loss_of_consciousness?: boolean | null
          notes?: string | null
          patient_id: string
          referral_specialty?: string | null
          severe_headache?: boolean | null
          severe_hypoglycemia?: boolean | null
          severe_shortness_of_breath?: boolean | null
          updated_at?: string
          vision_changes?: boolean | null
        }
        Update: {
          chest_pain?: boolean | null
          created_at?: string
          examined_at?: string | null
          examined_by?: string | null
          final_action?: string
          id?: string
          loss_of_consciousness?: boolean | null
          notes?: string | null
          patient_id?: string
          referral_specialty?: string | null
          severe_headache?: boolean | null
          severe_hypoglycemia?: boolean | null
          severe_shortness_of_breath?: boolean | null
          updated_at?: string
          vision_changes?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "virtual_clinic_data_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
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
