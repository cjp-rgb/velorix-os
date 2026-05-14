import { Badge } from '@/components/ui/Badge'
import { formatUSD, formatLots, formatTier } from '@/lib/format'
import { Users } from 'lucide-react'

type ContributorRow = {
  sub_affiliate_id: string
  sub_affiliate_name: string
  sub_affiliate_tier: 'entry' | 'growth' | 'scale' | null
  sub_affiliate_rebate: number
  tree_volume_lots: number
  override_per_lot: number
  override_earnings: number
  contribution_pct: number
}

type TopContributorsProps = {
  contributors: ContributorRow[]
  monthLabel?: string
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 0) return '?'
  if (parts.length === 1) {
    const first = parts[0]
    return first && first.length > 0 ? first.charAt(0).toUpperCase() : '?'
  }
  const firstInitial = parts[0]?.charAt(0) ?? ''
  const lastInitial = parts[parts.length - 1]?.charAt(0) ?? ''
  return (firstInitial + lastInitial).toUpperCase() || '?'
}

export function TopContributors({
  contributors,
  monthLabel,
}: TopContributorsProps) {
  if (contributors.length === 0) {
    return (
      <div className="rounded-card bg-surface border border-border p-8 text-center">
        <Users className="w-10 h-10 text-text-muted mx-auto mb-3" />
        <p className="text-text-dim">No sub-affiliates yet</p>
        <p className="text-text-muted text-sm mt-1">
          When you recruit operators into your downline, their contributions to your override earnings will appear here.
        </p>
      </div>
    )
  }

  // Filter out zero-contribution rows for display clarity
  // (sub-affiliates with no tree volume that month)
  const activeContributors = contributors.filter((c) => c.override_earnings > 0)

  if (activeContributors.length === 0) {
    return (
      <div className="rounded-card bg-surface border border-border p-8 text-center">
        <Users className="w-10 h-10 text-text-muted mx-auto mb-3" />
        <p className="text-text-dim">No override earnings yet this period</p>
        <p className="text-text-muted text-sm mt-1">
          You have {contributors.length} sub-affiliate{contributors.length === 1 ? '' : 's'}, but no tree volume has been recorded yet.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-card bg-surface border border-border overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <div>
          <h3 className="text-xs uppercase tracking-wider text-text-muted font-medium">
            Top Contributors
          </h3>
          <p className="text-sm text-text-dim mt-1">
            Who&apos;s generating your override earnings{monthLabel ? ` · ${monthLabel}` : ''}
          </p>
        </div>
      </div>

      {/* Rows */}
      <div>
        {activeContributors.map((c, i) => (
          <div
            key={c.sub_affiliate_id}
            className={`px-5 py-4 ${
              i !== activeContributors.length - 1 ? 'border-b border-border' : ''
            } hover:bg-surface-2 transition-colors`}
          >
            <div className="flex items-center gap-4">
              {/* Avatar with initials */}
              <div className="w-10 h-10 rounded-full bg-surface-2 flex items-center justify-center flex-shrink-0">
                <span className="text-text font-medium text-sm">
                  {getInitials(c.sub_affiliate_name)}
                </span>
              </div>

              {/* Name + tier + rate */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-text font-medium truncate">
                    {c.sub_affiliate_name}
                  </p>
                  {c.sub_affiliate_tier && (
                    <Badge variant={c.sub_affiliate_tier}>
                      {formatTier(c.sub_affiliate_tier)}
                    </Badge>
                  )}
                </div>
                <p className="text-text-dim text-xs font-mono mt-1">
                  ${c.sub_affiliate_rebate.toFixed(2)}/lot · {formatLots(c.tree_volume_lots)} lots traded
                </p>
              </div>

              {/* Earnings + percentage */}
              <div className="text-right flex-shrink-0">
                <p className="text-text font-display font-semibold tabular-nums">
                  {formatUSD(c.override_earnings, { showCents: false })}
                </p>
                <p className="text-text-dim text-xs font-mono tabular-nums mt-1">
                  {c.contribution_pct.toFixed(0)}%
                </p>
              </div>
            </div>

            {/* Contribution bar */}
            <div className="mt-3 h-1 bg-surface-2 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-brand-blue to-brand-cyan transition-all duration-700"
                style={{ width: `${Math.min(c.contribution_pct, 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
