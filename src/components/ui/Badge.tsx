import * as React from 'react'
import { cn } from '@/lib/utils'

type Variant = 'entry' | 'growth' | 'scale' | 'success' | 'warning' | 'error' | 'neutral'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: Variant
}

const variantClasses: Record<Variant, string> = {
  entry: 'bg-surface-3 text-text-dim border-border-bright',
  growth: 'bg-brand-cyan/10 text-brand-cyan border-brand-cyan/30',
  scale: 'bg-brand-gold/10 text-brand-gold border-brand-gold/30',
  success: 'bg-success/10 text-success-bright border-success/30',
  warning: 'bg-warning/10 text-warning border-warning/30',
  error: 'bg-error/10 text-error border-error/30',
  neutral: 'bg-surface-2 text-text-dim border-border',
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ variant = 'neutral', className, ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        'inline-flex items-center gap-1 rounded-full border-[0.5px] px-2 py-0.5',
        'text-2xs font-medium',
        variantClasses[variant],
        className
      )}
      {...props}
    />
  )
)
Badge.displayName = 'Badge'
