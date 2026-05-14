'use client'

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import type { MonthlyPerformance } from '@/types/velorix'
import { formatUSD } from '@/lib/format'

type EarningsChartProps = {
  history: MonthlyPerformance[]
}

export function EarningsChart({ history }: EarningsChartProps) {
  const data = history.map((row) => ({
    month: new Date(row.month_year).toLocaleDateString('en-GB', {
      month: 'short',
      year: '2-digit',
    }),
    direct: Number(row.calculated_direct_client_earnings ?? 0),
    override: Number(row.calculated_downline_override_earnings ?? 0),
    total: Number(row.calculated_total_earnings ?? 0),
  }))

  if (data.length === 0) {
    return (
      <div className="rounded-card bg-surface border border-border p-8 text-center">
        <p className="text-text-dim">No earnings history yet.</p>
        <p className="text-text-muted text-sm mt-1">
          Data appears after your first month of activity.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-card bg-surface border border-border p-6">
      <h3 className="text-xs uppercase tracking-wider text-text-muted font-medium mb-4">
        Earnings Over Time
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart
          data={data}
          margin={{ top: 5, right: 5, bottom: 5, left: 5 }}
        >
          <defs>
            <linearGradient id="directGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00C2FF" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#00C2FF" stopOpacity={0.05} />
            </linearGradient>
            <linearGradient id="overrideGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0066FF" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#0066FF" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1A2030" />
          <XAxis
            dataKey="month"
            stroke="#5A6478"
            style={{ fontSize: '11px', fontFamily: 'monospace' }}
            tickLine={false}
          />
          <YAxis
            stroke="#5A6478"
            style={{ fontSize: '11px', fontFamily: 'monospace' }}
            tickFormatter={(v) => formatUSD(v, { compact: true, showCents: false })}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{
              background: '#0A0E1A',
              border: '1px solid #1A2030',
              borderRadius: '8px',
              color: '#E8ECF5',
              fontSize: '12px',
            }}
            formatter={(value, name) => {
              const v = typeof value === 'number' ? value : Number(value)
              const labels: Record<string, string> = {
                direct: 'Direct',
                override: 'Override',
                total: 'Total',
              }
              return [formatUSD(v), labels[name as string] ?? String(name)]
            }}
            labelStyle={{ color: '#9BA3B5' }}
          />
          <Area
            type="monotone"
            dataKey="direct"
            stackId="1"
            stroke="#00C2FF"
            strokeWidth={2}
            fill="url(#directGrad)"
            name="direct"
          />
          <Area
            type="monotone"
            dataKey="override"
            stackId="1"
            stroke="#0066FF"
            strokeWidth={2}
            fill="url(#overrideGrad)"
            name="override"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
