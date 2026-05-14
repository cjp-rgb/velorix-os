'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type {
  Profile as DbProfile,
  MonthlyPerformance,
  TreeMonthlyAggregate,
  PuPrimeAccount,
  DailyRebateSnapshot,
  AutomationConfig,
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

/**
 * Updates the current user's notification preferences.
 *
 * Preferences are stored as JSONB with the shape:
 *   {
 *     [category: string]: {
 *       email: boolean,
 *       push: boolean,
 *       in_app: boolean,
 *     }
 *   }
 *
 * Categories are not validated at the database level — application code
 * is responsible for using the canonical category list (see NOTIFICATION_CATEGORIES
 * in the notifications page).
 *
 * This Server Action replaces the entire notification_preferences JSONB. The
 * caller is responsible for sending the complete preferences object — partial
 * updates would lose unset categories.
 *
 * Note: notification firing system not built yet (Phase 4+). Preferences are
 * stored now so they're ready when notifications start firing.
 */
export async function updateNotificationPreferences(
  preferences: Record<
    string,
    { email: boolean; push: boolean; in_app: boolean }
  >
): Promise<Profile> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const { data, error } = await supabase
    .from('profiles')
    .update({ notification_preferences: preferences })
    .eq('id', user.id)
    .select('*')
    .single()

  if (error || !data) {
    console.error('updateNotificationPreferences error:', error)
    throw new Error(error?.message ?? 'Failed to update notification preferences')
  }

  return data as Profile
}

/**
 * Validates a Telegram bot token by calling Telegram's getMe API.
 * Returns the bot's metadata (id, username, first_name) on success.
 * Throws if the token is invalid.
 *
 * This is a public Telegram API call — no auth on Velorix's end.
 * The token itself authenticates with Telegram.
 */
async function validateTelegramBotToken(token: string): Promise<{
  bot_id: number
  bot_username: string
  bot_first_name: string
}> {
  const trimmed = token.trim()

  // Basic shape check before hitting the API
  if (!/^\d+:[A-Za-z0-9_-]{30,}$/.test(trimmed)) {
    throw new Error('Invalid bot token format. Expected format: 123456789:ABC-DEF...')
  }

  const response = await fetch(`https://api.telegram.org/bot${trimmed}/getMe`, {
    method: 'GET',
    cache: 'no-store',
  })

  if (!response.ok) {
    // 401 means invalid token; other errors are network/Telegram-side issues
    if (response.status === 401) {
      throw new Error('Bot token is invalid. Check the token from @BotFather and try again.')
    }
    throw new Error(`Telegram API error: ${response.status} ${response.statusText}`)
  }

  const data = (await response.json()) as {
    ok: boolean
    result?: { id: number; username?: string; first_name?: string }
    description?: string
  }

  if (!data.ok || !data.result) {
    throw new Error(data.description ?? 'Telegram rejected the token')
  }

  if (!data.result.username) {
    throw new Error('Bot has no username set. Configure a username in @BotFather first.')
  }

  return {
    bot_id: data.result.id,
    bot_username: data.result.username,
    bot_first_name: data.result.first_name ?? data.result.username,
  }
}

/**
 * Connects the current operator's Telegram bot to Velorix.
 *
 * Validates the token with Telegram first. On success, upserts an
 * automation_configs row of type 'telegram_bot_connection' with the
 * token and bot metadata stored in config_jsonb.
 *
 * SECURITY NOTE: token is stored in plaintext in JSONB. Migration to
 * Supabase Vault is on the v1.1 hardening backlog.
 *
 * Throws on validation failure or database error.
 */
export async function connectTelegramBot(token: string): Promise<{
  bot_username: string
  bot_first_name: string
}> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Validate via Telegram API (throws if invalid)
  const botInfo = await validateTelegramBotToken(token)

  const configPayload = {
    token: token.trim(),
    bot_id: botInfo.bot_id,
    bot_username: botInfo.bot_username,
    bot_first_name: botInfo.bot_first_name,
    connected_at: new Date().toISOString(),
  }

  const { error } = await supabase
    .from('automation_configs')
    .upsert(
      {
        operator_id: user.id,
        automation_type: 'telegram_bot_connection',
        is_enabled: true,
        config_jsonb: configPayload,
      },
      { onConflict: 'operator_id,automation_type' }
    )

  if (error) {
    console.error('connectTelegramBot upsert error:', error)
    throw new Error(error.message ?? 'Failed to save bot connection')
  }

  return {
    bot_username: botInfo.bot_username,
    bot_first_name: botInfo.bot_first_name,
  }
}

/**
 * Disconnects the current operator's Telegram bot.
 *
 * Sets is_enabled = false and clears the token from config_jsonb to
 * minimize secret retention. Preserves bot metadata for audit purposes.
 *
 * Does NOT delete the row entirely — keeps history of past connections.
 */
export async function disconnectTelegramBot(): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Fetch existing config to preserve bot metadata while clearing the token
  const { data: existing } = await supabase
    .from('automation_configs')
    .select('config_jsonb')
    .eq('operator_id', user.id)
    .eq('automation_type', 'telegram_bot_connection')
    .maybeSingle()

  const existingConfig =
    (existing?.config_jsonb as Record<string, unknown> | null) ?? {}

  // Strip the token but preserve identifying metadata for audit
  const sanitisedConfig = { ...existingConfig }
  delete sanitisedConfig.token
  sanitisedConfig.disconnected_at = new Date().toISOString()

  const { error } = await supabase
    .from('automation_configs')
    .update({
      is_enabled: false,
      config_jsonb: sanitisedConfig,
    })
    .eq('operator_id', user.id)
    .eq('automation_type', 'telegram_bot_connection')

  if (error) {
    console.error('disconnectTelegramBot error:', error)
    throw new Error(error.message ?? 'Failed to disconnect bot')
  }
}

/**
 * Returns the current operator's bot connection state for UI display.
 *
 * Returns null if no connection has ever been made.
 * Returns { is_enabled: false, ... } if previously connected and disconnected.
 *
 * Does NOT return the token — only metadata safe to render in the UI.
 */
export async function getOperatorBotConnection(): Promise<{
  is_enabled: boolean
  bot_username: string | null
  bot_first_name: string | null
  connected_at: string | null
} | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const { data, error } = await supabase
    .from('automation_configs')
    .select('is_enabled, config_jsonb')
    .eq('operator_id', user.id)
    .eq('automation_type', 'telegram_bot_connection')
    .maybeSingle()

  if (error) {
    console.error('getOperatorBotConnection error:', error)
    return null
  }

  if (!data) {
    return null
  }

  const config = (data.config_jsonb as Record<string, unknown> | null) ?? {}

  return {
    is_enabled: data.is_enabled ?? false,
    bot_username: typeof config.bot_username === 'string' ? config.bot_username : null,
    bot_first_name: typeof config.bot_first_name === 'string' ? config.bot_first_name : null,
    connected_at: typeof config.connected_at === 'string' ? config.connected_at : null,
  }
}
