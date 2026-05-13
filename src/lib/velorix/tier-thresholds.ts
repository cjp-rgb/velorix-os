import type { VelorixTier, TierThreshold } from '@/types/velorix'

/**
 * Canonical Velorix tier thresholds.
 *
 * Tier placement is determined by an operator's TREE-TOTAL monthly net deposits
 * (not personal deposits, not lot volume). Scale tier additionally requires a
 * minimum member count.
 *
 * The `default_rebate` is the suggested $/lot Velorix recommends per tier.
 * `rebate_range` defines the negotiable band — Carson can set an operator's
 * actual rebate anywhere within this range when onboarding them.
 *
 * Sub-affiliates do NOT participate in the tier system. Their rebate is whatever
 * their upline (Master Operator) allocates them, with no tier band constraints.
 */
export const TIER_THRESHOLDS: TierThreshold[] = [
  {
    tier: 'entry',
    min_tree_deposits: 0,
    default_rebate: 16,
    rebate_range: [15, 18],
  },
  {
    tier: 'growth',
    min_tree_deposits: 25_000,
    default_rebate: 21,
    rebate_range: [20, 22],
  },
  {
    tier: 'scale',
    min_tree_deposits: 50_000,
    min_tree_members: 150,
    default_rebate: 24,
    rebate_range: [23, 25],
  },
]

/**
 * Returns the threshold definition for a given tier.
 * Throws if an invalid tier is passed.
 */
export function getTierThreshold(tier: VelorixTier): TierThreshold {
  const threshold = TIER_THRESHOLDS.find((t) => t.tier === tier)
  if (!threshold) {
    throw new Error(`Unknown tier: ${tier}`)
  }
  return threshold
}

/**
 * Returns the next tier above the current one, or null if already at Scale.
 * Used by the tier tracker to show "progress to next tier."
 */
export function getNextTier(currentTier: VelorixTier | null): VelorixTier | null {
  if (currentTier === null || currentTier === 'entry') return 'growth'
  if (currentTier === 'growth') return 'scale'
  return null // Already at Scale
}

/**
 * Returns the default rebate for a tier.
 * Useful when onboarding a new operator without negotiated rate.
 */
export function getDefaultRebate(tier: VelorixTier): number {
  return getTierThreshold(tier).default_rebate
}
