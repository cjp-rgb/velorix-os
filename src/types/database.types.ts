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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      audit_log: {
        Row: {
          action_type: string
          actor_id: string | null
          actor_type: string
          change_data: Json | null
          created_at: string
          id: number
          ip_address: unknown
          target_id: string | null
          target_type: string | null
          user_agent: string | null
        }
        Insert: {
          action_type: string
          actor_id?: string | null
          actor_type: string
          change_data?: Json | null
          created_at?: string
          id?: number
          ip_address?: unknown
          target_id?: string | null
          target_type?: string | null
          user_agent?: string | null
        }
        Update: {
          action_type?: string
          actor_id?: string | null
          actor_type?: string
          change_data?: Json | null
          created_at?: string
          id?: number
          ip_address?: unknown
          target_id?: string | null
          target_type?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_configs: {
        Row: {
          automation_type: string
          config_jsonb: Json | null
          created_at: string
          id: string
          is_enabled: boolean | null
          last_run_at: string | null
          last_run_error: string | null
          last_run_status: string | null
          operator_id: string
          updated_at: string
        }
        Insert: {
          automation_type: string
          config_jsonb?: Json | null
          created_at?: string
          id?: string
          is_enabled?: boolean | null
          last_run_at?: string | null
          last_run_error?: string | null
          last_run_status?: string | null
          operator_id: string
          updated_at?: string
        }
        Update: {
          automation_type?: string
          config_jsonb?: Json | null
          created_at?: string
          id?: string
          is_enabled?: boolean | null
          last_run_at?: string | null
          last_run_error?: string | null
          last_run_status?: string | null
          operator_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_configs_operator_id_fkey"
            columns: ["operator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      content_templates: {
        Row: {
          category: string
          created_at: string
          created_by: string | null
          hashtags: string[] | null
          hooks: Json | null
          id: string
          is_velorix_default: boolean | null
          performance_score: number | null
          platform: string
          template_text: string
          updated_at: string
          usage_count: number | null
        }
        Insert: {
          category: string
          created_at?: string
          created_by?: string | null
          hashtags?: string[] | null
          hooks?: Json | null
          id?: string
          is_velorix_default?: boolean | null
          performance_score?: number | null
          platform: string
          template_text: string
          updated_at?: string
          usage_count?: number | null
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string | null
          hashtags?: string[] | null
          hooks?: Json | null
          id?: string
          is_velorix_default?: boolean | null
          performance_score?: number | null
          platform?: string
          template_text?: string
          updated_at?: string
          usage_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "content_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      data_uploads: {
        Row: {
          created_at: string
          id: string
          original_filename: string | null
          period_end: string | null
          period_start: string | null
          processed_at: string | null
          processing_error: string | null
          processing_status: string
          rejection_reasons: Json | null
          report_type: string
          rows_imported: number | null
          rows_parsed: number | null
          rows_rejected: number | null
          storage_path: string | null
          upload_date: string
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          id?: string
          original_filename?: string | null
          period_end?: string | null
          period_start?: string | null
          processed_at?: string | null
          processing_error?: string | null
          processing_status?: string
          rejection_reasons?: Json | null
          report_type: string
          rows_imported?: number | null
          rows_parsed?: number | null
          rows_rejected?: number | null
          storage_path?: string | null
          upload_date?: string
          uploaded_by: string
        }
        Update: {
          created_at?: string
          id?: string
          original_filename?: string | null
          period_end?: string | null
          period_start?: string | null
          processed_at?: string | null
          processing_error?: string | null
          processing_status?: string
          rejection_reasons?: Json | null
          report_type?: string
          rows_imported?: number | null
          rows_parsed?: number | null
          rows_rejected?: number | null
          storage_path?: string | null
          upload_date?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "data_uploads_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      education_modules: {
        Row: {
          content_markdown: string | null
          created_at: string
          description: string | null
          estimated_minutes: number | null
          id: string
          is_published: boolean | null
          loom_video_url: string | null
          module_order: number
          quiz_questions: Json | null
          tier_required: string | null
          title: string
          updated_at: string
        }
        Insert: {
          content_markdown?: string | null
          created_at?: string
          description?: string | null
          estimated_minutes?: number | null
          id?: string
          is_published?: boolean | null
          loom_video_url?: string | null
          module_order: number
          quiz_questions?: Json | null
          tier_required?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          content_markdown?: string | null
          created_at?: string
          description?: string | null
          estimated_minutes?: number | null
          id?: string
          is_published?: boolean | null
          loom_video_url?: string | null
          module_order?: number
          quiz_questions?: Json | null
          tier_required?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      education_progress: {
        Row: {
          completed_at: string | null
          id: number
          module_id: string
          operator_id: string
          quiz_score: number | null
          started_at: string | null
          time_spent_minutes: number | null
        }
        Insert: {
          completed_at?: string | null
          id?: number
          module_id: string
          operator_id: string
          quiz_score?: number | null
          started_at?: string | null
          time_spent_minutes?: number | null
        }
        Update: {
          completed_at?: string | null
          id?: number
          module_id?: string
          operator_id?: string
          quiz_score?: number | null
          started_at?: string | null
          time_spent_minutes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "education_progress_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "education_modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "education_progress_operator_id_fkey"
            columns: ["operator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      generated_content: {
        Row: {
          content_text: string
          created_at: string
          id: string
          operator_id: string
          performance_data: Json | null
          platform: string
          posted_at: string | null
          template_id: string | null
        }
        Insert: {
          content_text: string
          created_at?: string
          id?: string
          operator_id: string
          performance_data?: Json | null
          platform: string
          posted_at?: string | null
          template_id?: string | null
        }
        Update: {
          content_text?: string
          created_at?: string
          id?: string
          operator_id?: string
          performance_data?: Json | null
          platform?: string
          posted_at?: string | null
          template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "generated_content_operator_id_fkey"
            columns: ["operator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generated_content_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "content_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      monthly_performance: {
        Row: {
          accounts_opened_count: number | null
          calculated_direct_client_earnings: number | null
          calculated_downline_override_earnings: number | null
          calculated_total_earnings: number | null
          created_at: string
          ftd_count: number | null
          gross_deposits_usd: number | null
          id: number
          month_year: string
          net_deposits_usd: number | null
          operator_id: string
          registrations_count: number | null
          source_upload_id: string | null
          updated_at: string
          volume_lots: number | null
          volume_nv_usd: number | null
          withdrawals_usd: number | null
        }
        Insert: {
          accounts_opened_count?: number | null
          calculated_direct_client_earnings?: number | null
          calculated_downline_override_earnings?: number | null
          calculated_total_earnings?: number | null
          created_at?: string
          ftd_count?: number | null
          gross_deposits_usd?: number | null
          id?: number
          month_year: string
          net_deposits_usd?: number | null
          operator_id: string
          registrations_count?: number | null
          source_upload_id?: string | null
          updated_at?: string
          volume_lots?: number | null
          volume_nv_usd?: number | null
          withdrawals_usd?: number | null
        }
        Update: {
          accounts_opened_count?: number | null
          calculated_direct_client_earnings?: number | null
          calculated_downline_override_earnings?: number | null
          calculated_total_earnings?: number | null
          created_at?: string
          ftd_count?: number | null
          gross_deposits_usd?: number | null
          id?: number
          month_year?: string
          net_deposits_usd?: number | null
          operator_id?: string
          registrations_count?: number | null
          source_upload_id?: string | null
          updated_at?: string
          volume_lots?: number | null
          volume_nv_usd?: number | null
          withdrawals_usd?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "monthly_performance_operator_id_fkey"
            columns: ["operator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          delivered_email: boolean | null
          delivered_in_app: boolean | null
          delivered_push: boolean | null
          delivered_telegram: boolean | null
          id: number
          is_read: boolean | null
          link_to: string | null
          metadata: Json | null
          notification_type: string
          read_at: string | null
          recipient_id: string
          title: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          delivered_email?: boolean | null
          delivered_in_app?: boolean | null
          delivered_push?: boolean | null
          delivered_telegram?: boolean | null
          id?: number
          is_read?: boolean | null
          link_to?: string | null
          metadata?: Json | null
          notification_type: string
          read_at?: string | null
          recipient_id: string
          title: string
        }
        Update: {
          body?: string | null
          created_at?: string
          delivered_email?: boolean | null
          delivered_in_app?: boolean | null
          delivered_push?: boolean | null
          delivered_telegram?: boolean | null
          id?: number
          is_read?: boolean | null
          link_to?: string | null
          metadata?: Json | null
          notification_type?: string
          read_at?: string | null
          recipient_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          account_status: string
          allocated_rebate: number | null
          country: string | null
          created_at: string
          display_name: string | null
          email: string
          full_name: string
          id: string
          instagram_handle: string | null
          master_operator_id: string | null
          onboarding_progress: Json | null
          phone: string | null
          profile_photo_url: string | null
          pu_prime_aff_id: string | null
          pu_prime_user_id: string | null
          role: string
          telegram_handle: string | null
          terminated_at: string | null
          terminated_reason: string | null
          timezone: string | null
          updated_at: string
          upline_operator_id: string | null
          velorix_tier: string | null
        }
        Insert: {
          account_status?: string
          allocated_rebate?: number | null
          country?: string | null
          created_at?: string
          display_name?: string | null
          email: string
          full_name: string
          id: string
          instagram_handle?: string | null
          master_operator_id?: string | null
          onboarding_progress?: Json | null
          phone?: string | null
          profile_photo_url?: string | null
          pu_prime_aff_id?: string | null
          pu_prime_user_id?: string | null
          role?: string
          telegram_handle?: string | null
          terminated_at?: string | null
          terminated_reason?: string | null
          timezone?: string | null
          updated_at?: string
          upline_operator_id?: string | null
          velorix_tier?: string | null
        }
        Update: {
          account_status?: string
          allocated_rebate?: number | null
          country?: string | null
          created_at?: string
          display_name?: string | null
          email?: string
          full_name?: string
          id?: string
          instagram_handle?: string | null
          master_operator_id?: string | null
          onboarding_progress?: Json | null
          phone?: string | null
          profile_photo_url?: string | null
          pu_prime_aff_id?: string | null
          pu_prime_user_id?: string | null
          role?: string
          telegram_handle?: string | null
          terminated_at?: string | null
          terminated_reason?: string | null
          timezone?: string | null
          updated_at?: string
          upline_operator_id?: string | null
          velorix_tier?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_master_operator_id_fkey"
            columns: ["master_operator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_upline_operator_id_fkey"
            columns: ["upline_operator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pu_prime_accounts: {
        Row: {
          account_journey: string | null
          account_number: string
          account_opened_date: string | null
          account_owner_operator_id: string | null
          account_type: string | null
          balance: number | null
          base_currency: string | null
          campaign_source: string | null
          client_name: string | null
          created_at: string
          credit: number | null
          equity: number | null
          id: number
          last_deposit_amount: number | null
          last_deposit_currency: string | null
          last_deposit_date: string | null
          last_synced_at: string
          last_trade_date: string | null
          last_traded_instrument: string | null
          last_traded_lots: string | null
          platform: string | null
          profit: number | null
          pu_prime_user_id: string | null
        }
        Insert: {
          account_journey?: string | null
          account_number: string
          account_opened_date?: string | null
          account_owner_operator_id?: string | null
          account_type?: string | null
          balance?: number | null
          base_currency?: string | null
          campaign_source?: string | null
          client_name?: string | null
          created_at?: string
          credit?: number | null
          equity?: number | null
          id?: number
          last_deposit_amount?: number | null
          last_deposit_currency?: string | null
          last_deposit_date?: string | null
          last_synced_at?: string
          last_trade_date?: string | null
          last_traded_instrument?: string | null
          last_traded_lots?: string | null
          platform?: string | null
          profit?: number | null
          pu_prime_user_id?: string | null
        }
        Update: {
          account_journey?: string | null
          account_number?: string
          account_opened_date?: string | null
          account_owner_operator_id?: string | null
          account_type?: string | null
          balance?: number | null
          base_currency?: string | null
          campaign_source?: string | null
          client_name?: string | null
          created_at?: string
          credit?: number | null
          equity?: number | null
          id?: number
          last_deposit_amount?: number | null
          last_deposit_currency?: string | null
          last_deposit_date?: string | null
          last_synced_at?: string
          last_trade_date?: string | null
          last_traded_instrument?: string | null
          last_traded_lots?: string | null
          platform?: string | null
          profit?: number | null
          pu_prime_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pu_prime_accounts_account_owner_operator_id_fkey"
            columns: ["account_owner_operator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      rebate_history: {
        Row: {
          change_reason: string | null
          changed_by_user_id: string | null
          created_at: string
          effective_from: string
          id: number
          new_rebate: number
          operator_id: string
          previous_rebate: number | null
        }
        Insert: {
          change_reason?: string | null
          changed_by_user_id?: string | null
          created_at?: string
          effective_from?: string
          id?: number
          new_rebate: number
          operator_id: string
          previous_rebate?: number | null
        }
        Update: {
          change_reason?: string | null
          changed_by_user_id?: string | null
          created_at?: string
          effective_from?: string
          id?: number
          new_rebate?: number
          operator_id?: string
          previous_rebate?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "rebate_history_changed_by_user_id_fkey"
            columns: ["changed_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rebate_history_operator_id_fkey"
            columns: ["operator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sub_affiliate_invitations: {
        Row: {
          admin_review_notes: string | null
          admin_review_status: string
          auto_verification_result: Json | null
          auto_verification_status: string | null
          auto_verified_at: string | null
          created_at: string
          id: string
          invitation_clicked_at: string | null
          invitation_expires_at: string | null
          invitation_sent_at: string | null
          invitation_token: string | null
          master_operator_id: string
          proposed_aff_id: string
          proposed_email: string
          proposed_name: string
          proposed_rebate: number
          resulting_operator_id: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          sub_affiliate_confirmed_at: string | null
          sub_affiliate_confirmed_upline: boolean | null
          updated_at: string
        }
        Insert: {
          admin_review_notes?: string | null
          admin_review_status?: string
          auto_verification_result?: Json | null
          auto_verification_status?: string | null
          auto_verified_at?: string | null
          created_at?: string
          id?: string
          invitation_clicked_at?: string | null
          invitation_expires_at?: string | null
          invitation_sent_at?: string | null
          invitation_token?: string | null
          master_operator_id: string
          proposed_aff_id: string
          proposed_email: string
          proposed_name: string
          proposed_rebate: number
          resulting_operator_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          sub_affiliate_confirmed_at?: string | null
          sub_affiliate_confirmed_upline?: boolean | null
          updated_at?: string
        }
        Update: {
          admin_review_notes?: string | null
          admin_review_status?: string
          auto_verification_result?: Json | null
          auto_verification_status?: string | null
          auto_verified_at?: string | null
          created_at?: string
          id?: string
          invitation_clicked_at?: string | null
          invitation_expires_at?: string | null
          invitation_sent_at?: string | null
          invitation_token?: string | null
          master_operator_id?: string
          proposed_aff_id?: string
          proposed_email?: string
          proposed_name?: string
          proposed_rebate?: number
          resulting_operator_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          sub_affiliate_confirmed_at?: string | null
          sub_affiliate_confirmed_upline?: boolean | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sub_affiliate_invitations_master_operator_id_fkey"
            columns: ["master_operator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sub_affiliate_invitations_resulting_operator_id_fkey"
            columns: ["resulting_operator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sub_affiliate_invitations_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tier_changes: {
        Row: {
          admin_notes: string | null
          approval_status: string
          confirmed_by_admin_at: string | null
          confirmed_by_admin_id: string | null
          created_at: string
          from_tier: string | null
          id: number
          operator_id: string
          rebate_after: number | null
          rebate_before: number | null
          to_tier: string
          tree_active_members_at_promotion: number | null
          tree_deposits_at_promotion: number | null
          triggered_by: string
        }
        Insert: {
          admin_notes?: string | null
          approval_status?: string
          confirmed_by_admin_at?: string | null
          confirmed_by_admin_id?: string | null
          created_at?: string
          from_tier?: string | null
          id?: number
          operator_id: string
          rebate_after?: number | null
          rebate_before?: number | null
          to_tier: string
          tree_active_members_at_promotion?: number | null
          tree_deposits_at_promotion?: number | null
          triggered_by: string
        }
        Update: {
          admin_notes?: string | null
          approval_status?: string
          confirmed_by_admin_at?: string | null
          confirmed_by_admin_id?: string | null
          created_at?: string
          from_tier?: string | null
          id?: number
          operator_id?: string
          rebate_after?: number | null
          rebate_before?: number | null
          to_tier?: string
          tree_active_members_at_promotion?: number | null
          tree_deposits_at_promotion?: number | null
          triggered_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "tier_changes_confirmed_by_admin_id_fkey"
            columns: ["confirmed_by_admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tier_changes_operator_id_fkey"
            columns: ["operator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tree_monthly_aggregates: {
        Row: {
          computed_at: string
          id: number
          month_year: string
          operator_id: string
          tree_active_member_count: number | null
          tree_gross_deposits_usd: number | null
          tree_member_count: number | null
          tree_net_deposits_usd: number | null
          tree_volume_lots: number | null
          tree_volume_nv_usd: number | null
        }
        Insert: {
          computed_at?: string
          id?: number
          month_year: string
          operator_id: string
          tree_active_member_count?: number | null
          tree_gross_deposits_usd?: number | null
          tree_member_count?: number | null
          tree_net_deposits_usd?: number | null
          tree_volume_lots?: number | null
          tree_volume_nv_usd?: number | null
        }
        Update: {
          computed_at?: string
          id?: number
          month_year?: string
          operator_id?: string
          tree_active_member_count?: number | null
          tree_gross_deposits_usd?: number | null
          tree_member_count?: number | null
          tree_net_deposits_usd?: number | null
          tree_volume_lots?: number | null
          tree_volume_nv_usd?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "tree_monthly_aggregates_operator_id_fkey"
            columns: ["operator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tree_relationships: {
        Row: {
          ancestor_id: string
          created_at: string
          depth: number
          descendant_id: string
        }
        Insert: {
          ancestor_id: string
          created_at?: string
          depth: number
          descendant_id: string
        }
        Update: {
          ancestor_id?: string
          created_at?: string
          depth?: number
          descendant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tree_relationships_ancestor_id_fkey"
            columns: ["ancestor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tree_relationships_descendant_id_fkey"
            columns: ["descendant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: { Args: never; Returns: boolean }
      is_in_my_downline: {
        Args: { operator_id_to_check: string }
        Returns: boolean
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
