import { Badge } from '@/components/ui/Badge'
import { calculateTierProgress } from '@/lib/velorix/tier-placement'
import { TIER_THRESHOLDS } from '@/lib/velorix/tier-thresholds'
import { formatUSD, formatTier, formatPercent } from '@/lib/format'
import type { VelorixTier } from '@/types/velorix'
import { TrendingUp } from 'lucide-react'

type TierTrackerProps = {
  currentTier: VelorixTier | null
  treeNetDeposits: number
  treeMemberCount: number
  allocatedRebate: number
}

export function TierTracker({
  currentTier,
  treeNetDeposits,
  treeMemberCount,
  allocatedRebate,
}: TierTrackerProps) {
  // Operators without a tier display as Entry for progress purposes
  const effectiveTier: VelorixTier = currentTier ?? 'entry'
  const { progress, nextTier, gap } = calculateTierProgress(
    effectiveTier,
    treeNetDeposits,
    treeMemberCount
  )

  const nextThreshold = nextTier
    ? TIER_THRESHOLDS.find((t) => t.tier === nextTier)
    : null

  return (
    <div className="rounded-card bg-surface border border-border p-6">
      {/* Header: current tier left, next tier right */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-xs uppercase tracking-wider text-text-muted font-medium">
            Current Tier
          </p>
          <div className="flex items-center gap-3 mt-2">
            <Badge variant={effectiveTier}>{formatTier(effectiveTier)}</Badge>
            <p className="text-sm text-text-dim font-mono">
              ${allocatedRebate.toFixed(2)}/lot
            </p>
          </div>
        </div>
        {nextTier && (
          <div className="text-right">
            <p className="text-xs uppercase tracking-wider text-text-muted font-medium">
              Next Tier
            </p>
            <div className="flex items-center gap-2 mt-2 justify-end">
              <Badge variant={nextTier}>{formatTier(nextTier)}</Badge>
              <TrendingUp className="w-4 h-4 text-text-dim" />
            </div>
          </div>
        )}
      </div>

      {nextTier && nextThreshold ? (
        <>
          {/* Gap statement + percentage */}
          <div className="mb-2 flex items-center justify-between text-sm">
            <p className="text-text-dim">
              {gap > 0 ? (
                <>
                  <span className="text-text font-mono">
                    {formatUSD(gap, { compact: true, showCents: false })}
                  </span>{' '}
                  to reach {formatTier(nextTier)}
                </>
              ) : (
                <span className="text-success-bright">
                  Threshold reached — promotion pending review
                </span>
              )}
            </p>
            <p className="font-mono text-text-dim tabular-nums">
              {formatPercent(progress)}
            </p>
          </div>

          {/* Progress bar */}
          <div className="h-2 bg-surface-2 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-brand-blue to-brand-cyan transition-all duration-1000"
              style={{ width: `${Math.min(progress * 100, 100)}%` }}
            />
          </div>

          {/* Requirements breakdown */}
          <div className="mt-5 grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-text-muted text-xs uppercase tracking-wider">
                Required
              </p>
              <p className="mt-1 text-text font-mono tabular-nums">
                {formatUSD(nextThreshold.min_tree_deposits, {
                  compact: true,
                  showCents: false,
                })}{' '}
                tree deposits
              </p>
              {nextThreshold.min_tree_members !== undefined && (
                <p className="text-text font-mono tabular-nums">
                  {nextThreshold.min_tree_members}+ members
                </p>
              )}
            </div>
            <div>
              <p className="text-text-muted text-xs uppercase tracking-wider">
                Your numbers
              </p>
              <p
                className={`mt-1 font-mono tabular-nums ${
                  treeNetDeposits >= nextThreshold.min_tree_deposits
                    ? 'text-success-bright'
                    : 'text-text'
                }`}
              >
                {formatUSD(treeNetDeposits, {
                  compact: true,
                  showCents: false,
                })}{' '}
                tree deposits
              </p>
              {nextThreshold.min_tree_members !== undefined && (
                <p
                  className={`font-mono tabular-nums ${
                    treeMemberCount >= nextThreshold.min_tree_members
                      ? 'text-success-bright'
                      : 'text-text'
                  }`}
                >
                  {treeMemberCount} members
                </p>
              )}
            </div>
          </div>
        </>
      ) : (
        /* Scale tier — no next tier to chase */
        <div className="text-center py-4">
          <p className="text-sm text-text-dim">
            You&apos;ve reached the top tier. Continue building your tree to maximise margin.
          </p>
        </div>
      )}
    </div>
  )
}
