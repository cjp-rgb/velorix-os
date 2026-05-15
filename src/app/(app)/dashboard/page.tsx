import { redirect } from 'next/navigation'
import {
  getCurrentUserProfile,
  getCurrentUserMonthlyPerformance,
  getCurrentUserTreeAggregate,
  getOperatorBotConnection,
} from '@/lib/velorix/data'
import { StatCard } from '@/components/ui/StatCard'
import { formatUSD, formatLots, formatTier, formatRebate } from '@/lib/format'
import { Users, TrendingUp, DollarSign, Network } from 'lucide-react'
import { NetDepositSphere } from '@/components/NetDepositSphereClient'
import { TierTracker } from '@/components/TierTracker'
import { OnboardingBanner } from '@/components/OnboardingBanner'

export default async function DashboardPage() {
  const [profile, monthly, treeAgg, botConnection] = await Promise.all([
    getCurrentUserProfile(),
    getCurrentUserMonthlyPerformance(),
    getCurrentUserTreeAggregate(),
    getOperatorBotConnection(),
  ])

  // Sub-affiliates use a different dashboard (built in Phase 3).
  // Route protection: redirect them to their lite dashboard.
  if (profile.role === 'sub_affiliate') {
    redirect('/sub')
  }

  const firstName = profile.display_name || profile.full_name.split(' ')[0] || 'Operator'
  const tier = profile.velorix_tier
  const allocatedRebate = Number(profile.allocated_rebate ?? 0)

  const directEarnings = Number(monthly?.calculated_direct_client_earnings ?? 0)
  const overrideEarnings = Number(monthly?.calculated_downline_override_earnings ?? 0)
  const totalEarnings = Number(monthly?.calculated_total_earnings ?? 0)

  const treeNetDeposits = Number(treeAgg?.tree_net_deposits_usd ?? 0)
  const treeMembers = treeAgg?.tree_member_count ?? 0
  const treeActiveMembers = treeAgg?.tree_active_member_count ?? 0
  const treeVolume = Number(treeAgg?.tree_volume_lots ?? 0)

  const showOnboarding = profile.onboarding_completed_at === null

  const onboardingCards = showOnboarding
    ? [
        {
          key: 'connect_bot',
          iconName: 'bot' as const,
          label: 'Connect your Telegram bot',
          description: 'Required for all automations',
          href: '/settings/integrations',
          isComplete: botConnection?.is_enabled === true,
        },
        {
          key: 'complete_profile',
          iconName: 'id_card' as const,
          label: 'Complete your profile',
          description: 'Display name, country, timezone',
          href: '/settings/account',
          isComplete:
            !!profile.display_name && !!profile.country && !!profile.timezone,
        },
        {
          key: 'view_earnings',
          iconName: 'trending_up' as const,
          label: 'Explore your earnings page',
          description: 'MTD performance + month-over-month',
          href: '/dashboard/earnings',
          isComplete: false,
        },
        {
          key: 'review_clients',
          iconName: 'users' as const,
          label: 'Review your clients',
          description: 'See journey states and status',
          href: '/dashboard/clients',
          isComplete: false,
        },
      ]
    : []

  return (
    <div className="px-4 md:px-8 py-6 md:py-10 max-w-7xl mx-auto">
      {showOnboarding && <OnboardingBanner cards={onboardingCards} />}

      {/* Header */}
      <div className="mb-8 md:mb-12">
        <p className="text-sm text-text-dim font-mono">
          {new Date().toLocaleDateString('en-GB', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </p>
        <h1 className="mt-1 text-3xl md:text-4xl font-display font-semibold text-text">
          Welcome back, {firstName}
        </h1>
        <p className="mt-2 text-text-dim">
          {tier ? (
            <>
              You&apos;re a <span className="text-text">{formatTier(tier)}</span> operator earning{' '}
              <span className="text-text">{formatRebate(allocatedRebate)}</span> on your direct clients.
            </>
          ) : (
            <>Your tier will be set after your first month of activity.</>
          )}
        </p>
      </div>

      {/* Net Deposit Sphere — Three.js hero */}
      <div className="mb-8 md:mb-12">
        <NetDepositSphere
          treeNetDeposits={treeNetDeposits}
          treeVolumeLots={treeVolume}
          tier={tier}
          memberCount={treeMembers}
          activeMemberCount={treeActiveMembers}
        />
        <div className="text-center mt-6">
          <p className="text-xs uppercase tracking-wider text-text-muted font-mono">
            Tree Net Deposits — this month
          </p>
          <p className="mt-2 text-3xl md:text-4xl font-display font-semibold text-text tabular-nums">
            {formatUSD(treeNetDeposits, { compact: false, showCents: false })}
          </p>
          <p className="mt-1 text-sm text-text-dim">
            across {treeActiveMembers} active {treeActiveMembers === 1 ? 'member' : 'members'}
          </p>
        </div>
      </div>

      {/* Tier tracker */}
      <div className="mb-8 md:mb-12">
        <TierTracker
          currentTier={tier}
          treeNetDeposits={treeNetDeposits}
          treeMemberCount={treeMembers}
          allocatedRebate={allocatedRebate}
        />
      </div>

      {/* Stat row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Tree Members"
          value={String(treeMembers)}
          sublabel={`${treeActiveMembers} active`}
          icon={<Users className="w-4 h-4" />}
        />
        <StatCard
          label="Tree Volume"
          value={formatLots(treeVolume)}
          sublabel="lots this month"
          icon={<TrendingUp className="w-4 h-4" />}
        />
        <StatCard
          label="Direct Earnings"
          value={formatUSD(directEarnings)}
          sublabel="own clients"
          accent="brand"
          icon={<DollarSign className="w-4 h-4" />}
        />
        <StatCard
          label="Override Earnings"
          value={formatUSD(overrideEarnings)}
          sublabel="downline margin"
          accent="brand"
          icon={<Network className="w-4 h-4" />}
        />
      </div>

      {/* Total monthly earnings highlight */}
      <div className="mt-6 rounded-card border border-border-bright bg-gradient-to-br from-surface to-surface-2 p-6 md:p-8">
        <p className="text-xs uppercase tracking-wider text-text-muted font-medium">
          Total Earnings This Month
        </p>
        <p className="mt-2 text-4xl md:text-5xl font-display font-semibold text-text tabular-nums">
          {formatUSD(totalEarnings)}
        </p>
        <p className="mt-2 text-sm text-text-dim">
          Direct + override combined
        </p>
      </div>
    </div>
  )
}
