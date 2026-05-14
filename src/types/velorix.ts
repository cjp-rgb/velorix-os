import type { Database } from './database.types'

// ============================================================================
// Table row types (what SELECT returns)
// ============================================================================

export type Profile = Database['public']['Tables']['profiles']['Row']
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update']

export type TreeRelationship = Database['public']['Tables']['tree_relationships']['Row']

export type MonthlyPerformance = Database['public']['Tables']['monthly_performance']['Row']
export type MonthlyPerformanceInsert = Database['public']['Tables']['monthly_performance']['Insert']

export type TreeMonthlyAggregate = Database['public']['Tables']['tree_monthly_aggregates']['Row']
export type TreeMonthlyAggregateInsert = Database['public']['Tables']['tree_monthly_aggregates']['Insert']

export type PuPrimeAccount = Database['public']['Tables']['pu_prime_accounts']['Row']

export type TierChange = Database['public']['Tables']['tier_changes']['Row']
export type RebateHistory = Database['public']['Tables']['rebate_history']['Row']

export type SubAffiliateInvitation = Database['public']['Tables']['sub_affiliate_invitations']['Row']
export type SubAffiliateInvitationInsert = Database['public']['Tables']['sub_affiliate_invitations']['Insert']

export type DataUpload = Database['public']['Tables']['data_uploads']['Row']
export type AuditLogEntry = Database['public']['Tables']['audit_log']['Row']
export type Notification = Database['public']['Tables']['notifications']['Row']

export type DailyRebateSnapshot = Database['public']['Tables']['daily_rebate_snapshots']['Row']
export type DailyRebateSnapshotInsert = Database['public']['Tables']['daily_rebate_snapshots']['Insert']

export type ContentTemplate = Database['public']['Tables']['content_templates']['Row']
export type GeneratedContent = Database['public']['Tables']['generated_content']['Row']

export type EducationModule = Database['public']['Tables']['education_modules']['Row']
export type EducationProgress = Database['public']['Tables']['education_progress']['Row']

export type AutomationConfig = Database['public']['Tables']['automation_configs']['Row']

// ============================================================================
// Velorix-specific enum types
// ============================================================================

export type UserRole = 'admin' | 'master' | 'sub_affiliate'
export type VelorixTier = 'entry' | 'growth' | 'scale'
export type AccountStatus = 'pending' | 'active' | 'terminated'
export type AccountJourney =
  | 'pending'
  | 'funded'
  | 'trading_30'
  | 'traded_30_ago'
  | 'inactive'
export type ReportType = 'sub_ib_report' | 'ib_accounts_report' | 'rebate_report'
export type ProcessingStatus = 'pending' | 'processing' | 'completed' | 'failed'
export type ApprovalStatus = 'pending' | 'approved' | 'rejected'
export type AutoVerificationStatus = 'verified' | 'mismatch' | 'not_found' | 'pending'
export type AutomationType =
  | 'signup_bot'
  | 'eod_bot'
  | 'profit_shot_pipeline'
  | 'tier_progress_notifier'

// ============================================================================
// Composite/derived types used throughout the app
// ============================================================================

export type OperatorEarnings = {
  direct_client_earnings: number
  downline_override_earnings: number
  total_earnings: number
}

export type TreeMetrics = {
  total_members: number
  active_members: number
  total_net_deposits: number
  total_volume_lots: number
  total_volume_nv: number
}

export type TierThreshold = {
  tier: VelorixTier
  min_tree_deposits: number
  min_tree_members?: number
  default_rebate: number
  rebate_range: [number, number]
}
