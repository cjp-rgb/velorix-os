'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type {
  Profile as DbProfile,
  MonthlyPerformance,
  TreeMonthlyAggregate,
  PuPrimeAccount,
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
