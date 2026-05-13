/**
 * The Velorix margin model — two earnings streams.
 *
 * STREAM A — Direct client margin:
 *   own_rebate × lots traded by own direct clients
 *
 * STREAM B — Downline override margin:
 *   For each direct sub-IB beneath this operator:
 *     (own_rebate − sub_IB_rebate) × that sub-IB's ENTIRE tree volume
 *
 * Total earnings = Stream A + Stream B
 *
 * Worked example:
 *   Mackai's rate: $17/lot (set by Carson)
 *   Kaleem's rate: $8/lot (set by Mackai, Kaleem is under Mackai)
 *
 *   When Kaleem's direct client trades 1 lot:
 *     Carson keeps: $30 − $17 = $13 (override on Mackai's tree)
 *     Mackai keeps: $17 − $8 = $9 (override on Kaleem's tree)
 *     Kaleem keeps: $8 (direct client margin)
 *     Total: $30 ✓
 */

/**
 * Subset of data needed about a direct sub-affiliate to compute the upline's
 * override earnings on that sub-affiliate's tree.
 */
export type SubAffiliateOverrideInput = {
  sub_affiliate_rebate: number
  tree_volume_lots: number
}

/**
 * Detailed breakdown of override earnings from a single sub-affiliate.
 * Used when displaying per-sub-affiliate contribution to total earnings.
 */
export type SubAffiliateContribution = {
  sub_affiliate_id?: string
  sub_affiliate_name?: string
  sub_affiliate_rebate: number
  tree_volume_lots: number
  override_per_lot: number
  override_earnings: number
}

/**
 * Stream A: earnings from the operator's own direct clients.
 */
export function calculateDirectClientEarnings(
  ownRebate: number,
  ownDirectClientLots: number
): number {
  if (ownRebate < 0 || ownDirectClientLots < 0) return 0
  return ownRebate * ownDirectClientLots
}

/**
 * Stream B: override earnings from all direct sub-affiliates' trees.
 *
 * For each direct sub-affiliate, the operator earns:
 *   (ownRebate − that sub-affiliate's rebate) × that sub-affiliate's tree volume
 *
 * Note: this only considers DIRECT sub-affiliates (depth 1 in tree_relationships).
 * The override compounds naturally through the chain — Carson's override on
 * Mackai's tree includes ALL volume beneath Mackai, including Kaleem's tree,
 * because Mackai's tree_volume_lots is itself a tree-total figure.
 */
export function calculateDownlineOverrideEarnings(
  ownRebate: number,
  directSubAffiliates: SubAffiliateOverrideInput[]
): number {
  if (ownRebate < 0) return 0

  return directSubAffiliates.reduce((total, sub) => {
    const override = ownRebate - sub.sub_affiliate_rebate

    // Defensive: negative override shouldn't be possible — application logic
    // enforces sub-affiliate rebate must be less than upline rebate when
    // recruiting (Phase 3). But if data corruption produces a negative override,
    // skip rather than subtract from earnings.
    if (override < 0) {
      console.warn(
        'calculateDownlineOverrideEarnings: negative override detected — data integrity issue',
        { ownRebate, sub_affiliate_rebate: sub.sub_affiliate_rebate }
      )
      return total
    }

    if (sub.tree_volume_lots < 0) return total

    return total + override * sub.tree_volume_lots
  }, 0)
}

/**
 * Convenience: returns all three earnings components in one call.
 * Used by the dashboard and earnings page to display both streams plus total.
 */
export function calculateTotalEarnings(
  ownRebate: number,
  ownDirectClientLots: number,
  directSubAffiliates: SubAffiliateOverrideInput[]
): {
  direct: number
  downline: number
  total: number
} {
  const direct = calculateDirectClientEarnings(ownRebate, ownDirectClientLots)
  const downline = calculateDownlineOverrideEarnings(ownRebate, directSubAffiliates)
  return {
    direct,
    downline,
    total: direct + downline,
  }
}

/**
 * Returns per-sub-affiliate override contributions, sorted by override earnings
 * descending. Used to show "who's contributing the most to your override income."
 */
export function calculatePerSubAffiliateContributions(
  ownRebate: number,
  directSubAffiliates: Array<SubAffiliateOverrideInput & {
    sub_affiliate_id?: string
    sub_affiliate_name?: string
  }>
): SubAffiliateContribution[] {
  return directSubAffiliates
    .map((sub) => {
      const override_per_lot = Math.max(0, ownRebate - sub.sub_affiliate_rebate)
      const override_earnings = override_per_lot * Math.max(0, sub.tree_volume_lots)
      return {
        sub_affiliate_id: sub.sub_affiliate_id,
        sub_affiliate_name: sub.sub_affiliate_name,
        sub_affiliate_rebate: sub.sub_affiliate_rebate,
        tree_volume_lots: sub.tree_volume_lots,
        override_per_lot,
        override_earnings,
      }
    })
    .sort((a, b) => b.override_earnings - a.override_earnings)
}

/**
 * Validates a proposed sub-affiliate rebate against the master's rebate.
 * A sub-affiliate's rate MUST be strictly less than their upline's rate,
 * otherwise the upline earns zero or negative override on that sub-tree.
 *
 * Used during sub-affiliate recruitment (Phase 3) to prevent invalid contracts.
 */
export function validateSubAffiliateRebate(
  masterRebate: number,
  proposedSubRebate: number
): { valid: boolean; reason?: string } {
  if (proposedSubRebate < 0) {
    return { valid: false, reason: 'Rebate cannot be negative' }
  }
  if (proposedSubRebate >= masterRebate) {
    return {
      valid: false,
      reason: `Sub-affiliate rebate must be less than your own ($${masterRebate}/lot)`,
    }
  }
  return { valid: true }
}
