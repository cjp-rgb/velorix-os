import { TIER_THRESHOLDS } from './tier-thresholds'
import type { VelorixTier } from '@/types/velorix'

/**
 * Determines what tier an operator has EARNED based on their tree-total
 * monthly net deposits and member count.
 *
 * Important business rule: Velorix tiers NEVER demote. The actual stored tier
 * in profiles.velorix_tier represents the highest tier they've ever earned.
 * This function returns what they're currently earning; the stored value
 * should never be less than this.
 *
 * Tier checks descend from highest to lowest. The first tier whose
 * requirements are met is returned.
 */
export function calculateEarnedTier(
  treeNetDeposits: number,
  treeMemberCount: number
): VelorixTier {
  // Scale tier requires BOTH deposits and member count thresholds
  const scale = TIER_THRESHOLDS.find((t) => t.tier === 'scale')!
  if (
    scale.min_tree_members !== undefined &&
    treeNetDeposits >= scale.min_tree_deposits &&
    treeMemberCount >= scale.min_tree_members
  ) {
    return 'scale'
  }

  // Growth tier requires deposits threshold only
  const growth = TIER_THRESHOLDS.find((t) => t.tier === 'growth')!
  if (treeNetDeposits >= growth.min_tree_deposits) {
    return 'growth'
  }

  // Default Entry tier (no minimum requirements)
  return 'entry'
}

/**
 * Calculates progress (0-1) toward the next tier for use in progress bars.
 *
 * For Growth promotion (from Entry): purely deposit-based.
 * For Scale promotion (from Growth): bounded by the WEAKER of two requirements
 * (deposits OR member count), since both must be met to promote.
 *
 * Returns { progress, nextTier, gap } where:
 * - progress: 0-1, clamped
 * - nextTier: 'growth' | 'scale' | null (null if already at Scale)
 * - gap: dollar amount of additional tree deposits needed
 */
export function calculateTierProgress(
  currentTier: VelorixTier,
  treeNetDeposits: number,
  treeMemberCount: number
): {
  progress: number
  nextTier: VelorixTier | null
  gap: number
} {
  if (currentTier === 'scale') {
    return { progress: 1, nextTier: null, gap: 0 }
  }

  const nextTier: VelorixTier = currentTier === 'entry' ? 'growth' : 'scale'
  const nextThreshold = TIER_THRESHOLDS.find((t) => t.tier === nextTier)!

  // Scale promotion: progress bound by weaker of deposits OR members
  if (nextTier === 'scale') {
    const depositProgress = Math.min(
      treeNetDeposits / nextThreshold.min_tree_deposits,
      1
    )
    const memberProgress = Math.min(
      treeMemberCount / nextThreshold.min_tree_members!,
      1
    )
    const progress = Math.min(depositProgress, memberProgress)
    const gap = Math.max(0, nextThreshold.min_tree_deposits - treeNetDeposits)
    return { progress, nextTier, gap }
  }

  // Growth promotion: deposits only
  const progress = Math.min(treeNetDeposits / nextThreshold.min_tree_deposits, 1)
  const gap = Math.max(0, nextThreshold.min_tree_deposits - treeNetDeposits)

  return { progress, nextTier, gap }
}

/**
 * Convenience function: returns the actual displayed tier for an operator.
 * If they have a stored velorix_tier, use that. Otherwise default to 'entry'.
 *
 * Note: this does NOT check whether stored tier matches earned tier — that's
 * a separate concern for the admin tier-promotion queue (Phase 4).
 */
export function getDisplayTier(storedTier: VelorixTier | null): VelorixTier {
  return storedTier ?? 'entry'
}
