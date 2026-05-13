import { cn } from '@/lib/utils'

type StatCardProps = {
  label: string
  value: string
  sublabel?: string
  accent?: 'default' | 'success' | 'warning' | 'brand'
  icon?: React.ReactNode
  className?: string
}

export function StatCard({
  label,
  value,
  sublabel,
  accent = 'default',
  icon,
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        'rounded-card border bg-surface p-5 transition-colors',
        'border-border hover:border-border-bright',
        className
      )}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-wider text-text-muted font-medium">
          {label}
        </p>
        {icon && <div className="text-text-dim">{icon}</div>}
      </div>
      <p
        className={cn(
          'mt-2 text-2xl font-display font-semibold tabular-nums',
          accent === 'default' && 'text-text',
          accent === 'success' && 'text-success-bright',
          accent === 'warning' && 'text-warning',
          accent === 'brand' && 'text-brand-cyan'
        )}
      >
        {value}
      </p>
      {sublabel && (
        <p className="mt-1 text-xs text-text-dim font-mono">{sublabel}</p>
      )}
    </div>
  )
}
