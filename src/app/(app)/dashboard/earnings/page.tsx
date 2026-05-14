import { redirect } from 'next/navigation'
import {
  getCurrentUserProfile,
  getCurrentUserMonthlyPerformance,
  getCurrentUserEarningsHistory,
  getSameDayComparison,
  getDailyRebatesInRange,
  getCurrentUserTopContributors,
} from '@/lib/velorix/data'
import { StatCard } from '@/components/ui/StatCard'
import { EarningsChart } from '@/components/EarningsChart'
import { DailyEarningsChart } from '@/components/DailyEarningsChart'
import { TopContributors } from '@/components/TopContributors'
import { DeltaIndicator } from '@/components/DeltaIndicator'
import { formatUSD, formatRebate } from '@/lib/format'
import { DollarSign, Network, TrendingUp } from 'lucide-react'

export default async function EarningsPage() {
  const profile = await getCurrentUserProfile()

  if (profile.role === 'sub_affiliate') {
    redirect('/sub')
  }

  // Parallel fetches — six independent queries
  const today = new Date()
  const thirtyDaysAgo = new Date(today)
  thirtyDaysAgo.setDate(today.getDate() - 30)

  const [
    current,
    history,
    comparison,
    dailySnapshots,
    contributors,
  ] = await Promise.all([
    getCurrentUserMonthlyPerformance(),
    getCurrentUserEarningsHistory(12),
    getSameDayComparison(),
    getDailyRebatesInRange(thirtyDaysAgo, today),
    getCurrentUserTopContributors(),
  ])

  // This month figures (from monthly_performance — operator's calculated totals)
  const monthDirect = Number(current?.calculated_direct_client_earnings ?? 0)
  const monthOverride = Number(current?.calculated_downline_override_earnings ?? 0)
  const monthTotal = Number(current?.calculated_total_earnings ?? 0)
  const allocatedRebate = Number(profile.allocated_rebate ?? 0)

  // YTD totals across the loaded 12-month history
  const ytdDirect = history.reduce(
    (sum, m) => sum + Number(m.calculated_direct_client_earnings ?? 0),
    0
  )
  const ytdOverride = history.reduce(
    (sum, m) => sum + Number(m.calculated_downline_override_earnings ?? 0),
    0
  )
  const ytdTotal = ytdDirect + ytdOverride

  // Current month label for top contributors header
  const currentMonthLabel = today.toLocaleDateString('en-GB', {
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="px-4 md:px-8 py-6 md:py-10 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <p className="text-sm text-text-dim font-mono">Earnings</p>
        <h1 className="mt-1 text-3xl md:text-4xl font-display font-semibold text-text">
          Your Margin
        </h1>
        <p className="mt-2 text-text-dim">
          Direct client earnings + downline override at {formatRebate(allocatedRebate)}
        </p>
      </div>

      {/* MTD HERO — same-day comparison vs last month */}
      <div className="mb-8 rounded-card border border-border-bright bg-gradient-to-br from-surface to-surface-2 p-6 md:p-8">
        <p className="text-xs uppercase tracking-wider text-text-muted font-medium">
          Month-to-date · through {today.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })}
        </p>
        <p className="mt-2 text-4xl md:text-5xl font-display font-semibold text-text tabular-nums">
          {formatUSD(comparison.current_mtd_rebate)}
        </p>
        <div className="mt-3">
          <DeltaIndicator
            deltaPct={comparison.delta_pct}
            deltaAbsolute={comparison.delta_absolute}
            comparisonLabel={`vs same days last month`}
            size="md"
          />
        </div>
      </div>

      {/* This month breakdown */}
      <div className="mb-8">
        <h2 className="text-xs uppercase tracking-wider text-text-muted font-medium mb-3">
          {currentMonthLabel} · Breakdown
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            label="Direct Clients"
            value={formatUSD(monthDirect)}
            sublabel="own rate × own clients' lots"
            accent="brand"
            icon={<DollarSign className="w-4 h-4" />}
          />
          <StatCard
            label="Downline Override"
            value={formatUSD(monthOverride)}
            sublabel="across all sub-affiliates"
            accent="brand"
            icon={<Network className="w-4 h-4" />}
          />
          <StatCard
            label="Combined Total"
            value={formatUSD(monthTotal)}
            sublabel="this month so far"
            accent="success"
            icon={<TrendingUp className="w-4 h-4" />}
          />
        </div>
      </div>

      {/* Top contributors */}
      <div className="mb-8">
        <TopContributors contributors={contributors} monthLabel={currentMonthLabel} />
      </div>

      {/* Daily rebate chart */}
      <div className="mb-8">
        <DailyEarningsChart snapshots={dailySnapshots} rangeLabel="Last 30 days" />
      </div>

      {/* 12-month history chart */}
      <div className="mb-8">
        <EarningsChart history={history} />
      </div>

      {/* Year to date */}
      <div>
        <h2 className="text-xs uppercase tracking-wider text-text-muted font-medium mb-3">
          Last 12 Months
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            label="Direct"
            value={formatUSD(ytdDirect, { compact: true, showCents: false })}
            sublabel="12-month total"
          />
          <StatCard
            label="Override"
            value={formatUSD(ytdOverride, { compact: true, showCents: false })}
            sublabel="12-month total"
          />
          <StatCard
            label="Combined"
            value={formatUSD(ytdTotal, { compact: true, showCents: false })}
            sublabel="12-month total"
            accent="success"
          />
        </div>
      </div>
    </div>
  )
}
