'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type {
  Profile as DbProfile,
  MonthlyPerformance,
  TreeMonthlyAggregate,
  PuPrimeAccount,
  DailyRebateSnapshot,
  VelorixTier,
  UserRole,
  AccountStatus,
} from '@/types/velorix'

// Postgres CHECK constraints aren't reflected in generated types — they come
// back as `string | null`. We trust the DB constraint and narrow at the data
// boundary so all downstream consumers get correct types.
export type Profile = Omit<DbProfile, 'role' | 'velorix_tier' | 'account_status'> & {
  role: UserRole
  velorix_tier: VelorixTier | null
  account_status: AccountStatus
}

/**
 * Returns the current user's first-of-month date string (YYYY-MM-DD)
 * for the given month, or current month if not specified.
 */
function getMonthKey(monthYear?: Date): string {
  const target = monthYear ?? new Date()
  const firstOfMonth = new Date(target.getFullYear(), target.getMonth(), 1)
  const yyyy = firstOfMonth.getFullYear()
  const mm = String(firstOfMonth.getMonth() + 1).padStart(2, '0')
  return `${yyyy}-${mm}-01`
}

/**
 * Loads the current authenticated user's profile.
 * Redirects to /auth/login if unauthenticated.
 * Throws if the auth user exists but no profile row matches (shouldn't happen
 * in production — profiles are created during onboarding).
 */
export async function getCurrentUserProfile(): Promise<Profile> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error || !data) {
    console.error('getCurrentUserProfile: profile not found for auth user', user.id, error)
    throw new Error('Profile not found for current user')
  }

  return data as Profile
}

/**
 * Loads the current user's monthly_performance row for a given month.
 * Defaults to current month. Returns null if no row exists (operator
 * has no activity that month).
 */
export async function getCurrentUserMonthlyPerformance(
  monthYear?: Date
): Promise<MonthlyPerformance | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const { data, error } = await supabase
    .from('monthly_performance')
    .select('*')
    .eq('operator_id', user.id)
    .eq('month_year', getMonthKey(monthYear))
    .maybeSingle()

  if (error) {
    console.error('getCurrentUserMonthlyPerformance error:', error)
    return null
  }

  return data
}

/**
 * Loads the current user's tree_monthly_aggregates row for a given month.
 * This is the pre-computed tree-total metrics used for tier placement.
 * Returns null if no row exists yet.
 */
export async function getCurrentUserTreeAggregate(
  monthYear?: Date
): Promise<TreeMonthlyAggregate | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const { data, error } = await supabase
    .from('tree_monthly_aggregates')
    .select('*')
    .eq('operator_id', user.id)
    .eq('month_year', getMonthKey(monthYear))
    .maybeSingle()

  if (error) {
    console.error('getCurrentUserTreeAggregate error:', error)
    return null
  }

  return data
}

/**
 * Loads the current user's monthly performance history.
 * Returns rows ordered by month ascending (oldest first).
 * Used for the earnings chart and YTD calculations.
 *
 * Default range: last 12 months.
 */
export async function getCurrentUserEarningsHistory(
  monthsBack: number = 12
): Promise<MonthlyPerformance[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const cutoff = new Date()
  cutoff.setMonth(cutoff.getMonth() - monthsBack)
  const cutoffKey = getMonthKey(cutoff)

  const { data, error } = await supabase
    .from('monthly_performance')
    .select('*')
    .eq('operator_id', user.id)
    .gte('month_year', cutoffKey)
    .order('month_year', { ascending: true })

  if (error) {
    console.error('getCurrentUserEarningsHistory error:', error)
    return []
  }

  return data ?? []
}

/**
 * Loads PU Prime client accounts directly owned by the current operator.
 * Returns accounts ordered by most recent trade activity first.
 * Returns empty array if no clients (or on error — caller can handle empty state).
 */
export async function getCurrentUserClients(): Promise<PuPrimeAccount[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const { data, error } = await supabase
    .from('pu_prime_accounts')
    .select('*')
    .eq('account_owner_operator_id', user.id)
    .order('last_trade_date', { ascending: false, nullsFirst: false })

  if (error) {
    console.error('getCurrentUserClients error:', error)
    return []
  }

  return data ?? []
}

/**
 * Loads daily_rebate_snapshots for the current operator within a date range.
 * Returns rows ordered by date ascending.
 *
 * Used for:
 * - Same-day month-over-month comparison
 * - Daily earnings chart (last 30 days)
 * - Custom date range analysis
 */
export async function getDailyRebatesInRange(
  startDate: Date,
  endDate: Date
): Promise<DailyRebateSnapshot[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const startKey = startDate.toISOString().slice(0, 10)
  const endKey = endDate.toISOString().slice(0, 10)

  const { data, error } = await supabase
    .from('daily_rebate_snapshots')
    .select('*')
    .eq('operator_id', user.id)
    .gte('date', startKey)
    .lte('date', endKey)
    .order('date', { ascending: true })

  if (error) {
    console.error('getDailyRebatesInRange error:', error)
    return []
  }

  return data ?? []
}

/**
 * Returns same-day month-over-month comparison.
 *
 * If today is May 14, returns:
 *   - current_mtd: sum of daily rebates May 1 → May 14
 *   - previous_period_same_days: sum of daily rebates April 1 → April 14
 *   - delta_pct: percentage change (positive = growth, negative = decline)
 *   - delta_absolute: dollar change
 *
 * Returns null for previous_period if no data exists for that range.
 * Handles month-end edge cases: if current is March 31, previous compares
 * March 1 → March 31 vs Feb 1 → Feb 28 (uses min of available days).
 */
export async function getSameDayComparison(): Promise<{
  current_mtd_rebate: number
  previous_period_rebate: number | null
  delta_pct: number | null
  delta_absolute: number | null
  days_in_current_period: number
  today: string
}> {
  const today = new Date()
  const currentDay = today.getDate()
  const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1)

  // Previous month: same year unless January, then previous year December
  const previousMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1)

  // Determine the comparable end day in previous month
  // (handle Feb 28/29 → Mar 30/31 edge cases by clamping)
  const previousMonthLastDay = new Date(
    today.getFullYear(),
    today.getMonth(),
    0
  ).getDate()
  const comparableDay = Math.min(currentDay, previousMonthLastDay)
  const previousMonthEnd = new Date(
    previousMonthStart.getFullYear(),
    previousMonthStart.getMonth(),
    comparableDay
  )

  // Fetch both ranges
  const [currentRows, previousRows] = await Promise.all([
    getDailyRebatesInRange(currentMonthStart, today),
    getDailyRebatesInRange(previousMonthStart, previousMonthEnd),
  ])

  const currentMtdRebate = currentRows.reduce(
    (sum, r) => sum + Number(r.total_rebate_usd ?? 0),
    0
  )

  const previousPeriodRebate =
    previousRows.length === 0
      ? null
      : previousRows.reduce((sum, r) => sum + Number(r.total_rebate_usd ?? 0), 0)

  let deltaAbsolute: number | null = null
  let deltaPct: number | null = null

  if (previousPeriodRebate !== null) {
    deltaAbsolute = currentMtdRebate - previousPeriodRebate
    deltaPct =
      previousPeriodRebate === 0
        ? null  // Can't compute % change from zero — return null instead of Infinity
        : (deltaAbsolute / previousPeriodRebate) * 100
  }

  return {
    current_mtd_rebate: currentMtdRebate,
    previous_period_rebate: previousPeriodRebate,
    delta_pct: deltaPct,
    delta_absolute: deltaAbsolute,
    days_in_current_period: currentDay,
    today: today.toISOString().slice(0, 10),
  }
}

/**
 * Returns per-sub-affiliate override contributions for the current operator,
 * sorted by override earnings descending.
 *
 * Used by the Top Contributors section of the earnings page. Shows which
 * direct sub-affiliates are generating the most override income for the
 * current operator.
 *
 * Returns empty array if no sub-affiliates exist.
 *
 * Data sources:
 * - tree_relationships: find direct sub-affiliates (depth = 1)
 * - profiles: get their name, tier, allocated_rebate
 * - tree_monthly_aggregates: get their tree_volume_lots for the period
 *
 * Override math: (my_rate − their_rate) × their_tree_volume_lots
 */
export async function getCurrentUserTopContributors(monthYear?: Date): Promise<
  Array<{
    sub_affiliate_id: string
    sub_affiliate_name: string
    sub_affiliate_tier: VelorixTier | null
    sub_affiliate_rebate: number
    tree_volume_lots: number
    override_per_lot: number
    override_earnings: number
    contribution_pct: number
  }>
> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Get the operator's own profile for their rebate rate
  const ownProfile = await getCurrentUserProfile()
  const ownRebate = Number(ownProfile.allocated_rebate ?? 0)

  // Find all direct sub-affiliates (depth = 1 in tree_relationships)
  const { data: directSubsRel, error: relError } = await supabase
    .from('tree_relationships')
    .select('descendant_id')
    .eq('ancestor_id', user.id)
    .eq('depth', 1)

  if (relError || !directSubsRel || directSubsRel.length === 0) {
    return []
  }

  const subIds = directSubsRel.map((r) => r.descendant_id)

  // Get their profile info
  const { data: subProfiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, display_name, full_name, velorix_tier, allocated_rebate')
    .in('id', subIds)

  if (profilesError || !subProfiles) {
    return []
  }

  // Get this month's tree volume for each direct sub-affiliate
  const targetMonth = monthYear ?? new Date()
  const firstOfMonth = new Date(targetMonth.getFullYear(), targetMonth.getMonth(), 1)
    .toISOString()
    .slice(0, 10)

  const { data: aggregates, error: aggError } = await supabase
    .from('tree_monthly_aggregates')
    .select('operator_id, tree_volume_lots')
    .in('operator_id', subIds)
    .eq('month_year', firstOfMonth)

  if (aggError) {
    console.error('getCurrentUserTopContributors aggregates error:', aggError)
    return []
  }

  // Build lookup from aggregates
  const volumeBySubId = new Map<string, number>()
  for (const agg of aggregates ?? []) {
    volumeBySubId.set(agg.operator_id, Number(agg.tree_volume_lots ?? 0))
  }

  // Compute override contribution per sub-affiliate
  const contributions = subProfiles.map((sub) => {
    const subRebate = Number(sub.allocated_rebate ?? 0)
    const treeVolume = volumeBySubId.get(sub.id) ?? 0
    const overridePerLot = Math.max(0, ownRebate - subRebate)
    const overrideEarnings = overridePerLot * treeVolume

    return {
      sub_affiliate_id: sub.id,
      sub_affiliate_name: sub.display_name || sub.full_name || 'Unnamed',
      sub_affiliate_tier: sub.velorix_tier as VelorixTier | null,
      sub_affiliate_rebate: subRebate,
      tree_volume_lots: treeVolume,
      override_per_lot: overridePerLot,
      override_earnings: overrideEarnings,
      contribution_pct: 0, // filled in after totals known
    }
  })

  // Sort by override earnings descending
  contributions.sort((a, b) => b.override_earnings - a.override_earnings)

  // Compute contribution percentages
  const totalOverride = contributions.reduce((sum, c) => sum + c.override_earnings, 0)
  if (totalOverride > 0) {
    for (const c of contributions) {
      c.contribution_pct = (c.override_earnings / totalOverride) * 100
    }
  }

  return contributions
}

/**
 * Updates the current user's editable profile fields.
 *
 * Allowed fields only (user-editable):
 * - full_name
 * - display_name
 * - phone
 * - country
 * - timezone
 * - instagram_handle
 * - telegram_handle
 *
 * NOT allowed via this Server Action (admin-only):
 * - allocated_rebate, velorix_tier, role, account_status, email
 * - profile_photo_url (separate Server Action for photo upload, Phase 1.9d)
 *
 * Returns the updated profile (narrowed Profile type).
 * Throws on validation failure or database error.
 */
export async function updateProfile(updates: {
  full_name?: string
  display_name?: string | null
  phone?: string | null
  country?: string | null
  timezone?: string | null
  instagram_handle?: string | null
  telegram_handle?: string | null
}): Promise<Profile> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Whitelist allowed fields. Drop anything else the caller passed.
  const allowedFields: Array<keyof typeof updates> = [
    'full_name',
    'display_name',
    'phone',
    'country',
    'timezone',
    'instagram_handle',
    'telegram_handle',
  ]
  const safeUpdates: Record<string, unknown> = {}
  for (const key of allowedFields) {
    if (key in updates) {
      safeUpdates[key] = updates[key]
    }
  }

  // Basic server-side validation
  if (
    typeof safeUpdates.full_name === 'string' &&
    safeUpdates.full_name.trim().length === 0
  ) {
    throw new Error('Full name cannot be empty')
  }

  const { data, error } = await supabase
    .from('profiles')
    .update(safeUpdates)
    .eq('id', user.id)
    .select('*')
    .single()

  if (error || !data) {
    console.error('updateProfile error:', error)
    throw new Error(error?.message ?? 'Failed to update profile')
  }

  return data as Profile
}
