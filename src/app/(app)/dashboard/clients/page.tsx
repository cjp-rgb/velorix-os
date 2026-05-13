import { redirect } from 'next/navigation'
import {
  getCurrentUserProfile,
  getCurrentUserClients,
} from '@/lib/velorix/data'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatUSD } from '@/lib/format'
import { UserCircle } from 'lucide-react'

type JourneyStyle = {
  label: string
  variant: 'success' | 'warning' | 'neutral' | 'error'
}

const JOURNEY_LABEL: Record<string, JourneyStyle> = {
  funded: { label: 'Funded', variant: 'success' },
  trading_30: { label: 'Trading', variant: 'success' },
  traded_30_ago: { label: 'At risk', variant: 'warning' },
  pending: { label: 'Pending', variant: 'neutral' },
  inactive: { label: 'Inactive', variant: 'error' },
}

function getJourneyStyle(journey: string | null): JourneyStyle {
  if (!journey) return { label: 'Unknown', variant: 'neutral' }
  return JOURNEY_LABEL[journey] ?? { label: journey, variant: 'neutral' }
}

export default async function ClientsPage() {
  const profile = await getCurrentUserProfile()

  if (profile.role === 'sub_affiliate') {
    redirect('/sub')
  }

  const clients = await getCurrentUserClients()

  const fundedCount = clients.filter((c) => c.account_journey === 'funded').length
  const tradingCount = clients.filter((c) => c.account_journey === 'trading_30').length
  const atRiskCount = clients.filter((c) => c.account_journey === 'traded_30_ago').length
  const inactiveCount = clients.filter(
    (c) => c.account_journey === 'inactive' || c.account_journey === 'pending' || c.account_journey === null
  ).length

  return (
    <div className="px-4 md:px-8 py-6 md:py-10 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <p className="text-sm text-text-dim font-mono">Clients</p>
        <h1 className="mt-1 text-3xl md:text-4xl font-display font-semibold text-text">
          Your Direct Clients
        </h1>
        <p className="mt-2 text-text-dim">
          {clients.length} {clients.length === 1 ? 'account' : 'accounts'} signed up directly under you
        </p>
      </div>

      {/* Status summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <div className="rounded-card bg-surface border border-border p-4">
          <p className="text-xs uppercase tracking-wider text-text-muted">Funded</p>
          <p className="mt-1 text-2xl font-display font-semibold text-success-bright tabular-nums">{fundedCount}</p>
        </div>
        <div className="rounded-card bg-surface border border-border p-4">
          <p className="text-xs uppercase tracking-wider text-text-muted">Trading</p>
          <p className="mt-1 text-2xl font-display font-semibold text-brand-cyan tabular-nums">{tradingCount}</p>
        </div>
        <div className="rounded-card bg-surface border border-border p-4">
          <p className="text-xs uppercase tracking-wider text-text-muted">At risk</p>
          <p className="mt-1 text-2xl font-display font-semibold text-warning tabular-nums">{atRiskCount}</p>
        </div>
        <div className="rounded-card bg-surface border border-border p-4">
          <p className="text-xs uppercase tracking-wider text-text-muted">Inactive</p>
          <p className="mt-1 text-2xl font-display font-semibold text-text-dim tabular-nums">{inactiveCount}</p>
        </div>
      </div>

      {/* Client list */}
      {clients.length === 0 ? (
        <EmptyState
          icon={<UserCircle className="w-12 h-12" />}
          title="No clients yet"
          description="Once your direct clients sign up under your PU Prime affiliate link, their accounts will appear here after the next nightly data sync."
        />
      ) : (
        <div className="rounded-card bg-surface border border-border overflow-hidden">
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface-2 border-b border-border">
                <tr>
                  <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-text-muted font-medium">Client</th>
                  <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-text-muted font-medium">Account</th>
                  <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-text-muted font-medium">Platform</th>
                  <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-text-muted font-medium">Status</th>
                  <th className="px-4 py-3 text-right text-xs uppercase tracking-wider text-text-muted font-medium">Balance</th>
                  <th className="px-4 py-3 text-right text-xs uppercase tracking-wider text-text-muted font-medium">Last Trade</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((c, i) => {
                  const journey = getJourneyStyle(c.account_journey)
                  return (
                    <tr
                      key={c.id}
                      className={`hover:bg-surface-2 transition-colors ${
                        i !== clients.length - 1 ? 'border-b border-border' : ''
                      }`}
                    >
                      <td className="px-4 py-3 text-text">{c.client_name || '—'}</td>
                      <td className="px-4 py-3 text-text-dim font-mono text-sm">{c.account_number}</td>
                      <td className="px-4 py-3 text-text-dim">{c.platform || '—'}</td>
                      <td className="px-4 py-3">
                        <Badge variant={journey.variant}>{journey.label}</Badge>
                      </td>
                      <td className="px-4 py-3 text-right text-text font-mono tabular-nums">
                        {c.balance != null ? formatUSD(Number(c.balance)) : '—'}
                      </td>
                      <td className="px-4 py-3 text-right text-text-dim text-sm">
                        {c.last_trade_date
                          ? new Date(c.last_trade_date).toLocaleDateString('en-GB', {
                              day: 'numeric',
                              month: 'short',
                            })
                          : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden">
            {clients.map((c, i) => {
              const journey = getJourneyStyle(c.account_journey)
              return (
                <div
                  key={c.id}
                  className={`p-4 ${i !== clients.length - 1 ? 'border-b border-border' : ''}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-text font-medium truncate">{c.client_name || 'Unnamed'}</p>
                      <p className="text-text-dim text-xs font-mono mt-1">{c.account_number}</p>
                    </div>
                    <Badge variant={journey.variant}>{journey.label}</Badge>
                  </div>
                  <div className="flex items-center justify-between mt-3 text-sm">
                    <span className="text-text-dim">{c.platform || '—'}</span>
                    <span className="text-text font-mono tabular-nums">
                      {c.balance != null ? formatUSD(Number(c.balance)) : '—'}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
