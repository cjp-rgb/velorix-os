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
import type { DailyRebateSnapshot } from '@/types/velorix'
import { formatUSD } from '@/lib/format'

type DailyEarningsChartProps = {
  snapshots: DailyRebateSnapshot[]
  rangeLabel?: string
}

export function DailyEarningsChart({
  snapshots,
  rangeLabel = 'Last 30 days',
}: DailyEarningsChartProps) {
  const data = snapshots.map((row) => ({
    date: new Date(row.date).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
    }),
    rebate: Number(row.total_rebate_usd ?? 0),
  }))

  if (data.length === 0) {
    return (
      <div className="rounded-card bg-surface border border-border p-8 text-center">
        <p className="text-text-dim">No daily earnings data yet.</p>
        <p className="text-text-muted text-sm mt-1">
          Daily totals will appear here after your first nightly data sync.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-card bg-surface border border-border p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs uppercase tracking-wider text-text-muted font-medium">
          Daily Rebate
        </h3>
        <p className="text-xs text-text-dim font-mono">{rangeLabel}</p>
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <AreaChart
          data={data}
          margin={{ top: 5, right: 5, bottom: 5, left: 5 }}
        >
          <defs>
            <linearGradient id="dailyRebateGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00C2FF" stopOpacity={0.5} />
              <stop offset="100%" stopColor="#00C2FF" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1A2030" vertical={false} />
          <XAxis
            dataKey="date"
            stroke="#5A6478"
            style={{ fontSize: '11px', fontFamily: 'monospace' }}
            tickLine={false}
            interval="preserveStartEnd"
            minTickGap={20}
          />
          <YAxis
            stroke="#5A6478"
            style={{ fontSize: '11px', fontFamily: 'monospace' }}
            tickFormatter={(v) => formatUSD(v, { compact: true, showCents: false })}
            tickLine={false}
            axisLine={false}
            width={50}
          />
          <Tooltip
            contentStyle={{
              background: '#0A0E1A',
              border: '1px solid #1A2030',
              borderRadius: '8px',
              color: '#E8ECF5',
              fontSize: '12px',
            }}
            formatter={(value) => {
              const v = typeof value === 'number' ? value : Number(value)
              return [formatUSD(v), 'Rebate']
            }}
            labelStyle={{ color: '#9BA3B5' }}
          />
          <Area
            type="monotone"
            dataKey="rebate"
            stroke="#00C2FF"
            strokeWidth={2}
            fill="url(#dailyRebateGrad)"
            name="rebate"
            dot={false}
            activeDot={{ r: 4, fill: '#00C2FF', stroke: '#0A0E1A', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
