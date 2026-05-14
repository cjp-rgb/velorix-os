import { ArrowUp, ArrowDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatUSD, formatPercent } from '@/lib/format'

type DeltaIndicatorProps = {
  deltaPct: number | null
  deltaAbsolute?: number | null
  comparisonLabel?: string
  size?: 'sm' | 'md'
  className?: string
}

/**
 * Shows a delta as "↑ 18.3%" with green/red/neutral color.
 *
 * deltaPct === null → "No comparison data" placeholder
 * deltaPct > 0 → green with up arrow
 * deltaPct < 0 → warning color with down arrow
 * deltaPct === 0 → neutral with horizontal dash
 */
export function DeltaIndicator({
  deltaPct,
  deltaAbsolute,
  comparisonLabel = 'vs same days last month',
  size = 'sm',
  className,
}: DeltaIndicatorProps) {
  if (deltaPct === null || deltaPct === undefined) {
    return (
      <div className={cn('flex items-center gap-1.5 text-text-muted', className)}>
        <span
          className={cn(
            'font-mono',
            size === 'sm' ? 'text-xs' : 'text-sm'
          )}
        >
          No comparison data yet
        </span>
      </div>
    )
  }

  const isPositive = deltaPct > 0
  const isNegative = deltaPct < 0
  const isFlat = deltaPct === 0

  const Icon = isPositive ? ArrowUp : isNegative ? ArrowDown : Minus
  const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm'

  return (
    <div
      className={cn(
        'flex items-center gap-1.5',
        isPositive && 'text-success-bright',
        isNegative && 'text-warning',
        isFlat && 'text-text-dim',
        className
      )}
    >
      <Icon className={iconSize} />
      <span className={cn('font-mono tabular-nums font-medium', textSize)}>
        {formatPercent(Math.abs(deltaPct) / 100, 1)}
      </span>
      {deltaAbsolute !== null && deltaAbsolute !== undefined && (
        <span className={cn('font-mono tabular-nums text-text-dim', textSize)}>
          ({deltaAbsolute >= 0 ? '+' : ''}
          {formatUSD(deltaAbsolute, { showCents: false })})
        </span>
      )}
      <span className={cn('text-text-muted', textSize)}>{comparisonLabel}</span>
    </div>
  )
}
