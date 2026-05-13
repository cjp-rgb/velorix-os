import * as React from 'react'
import { cn } from '@/lib/utils'

export interface EmptyStateProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  icon?: React.ReactNode
  title: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactNode
}

export const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  ({ icon, title, description, action, className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-card border-[0.5px] border-border bg-surface px-6 py-10 text-center',
        className
      )}
      {...props}
    >
      {icon && (
        <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-full border-[0.5px] border-border bg-surface-2 text-text-dim">
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold text-text">{title}</h3>
      {description && (
        <p className="max-w-sm text-sm text-text-dim">{description}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
)
EmptyState.displayName = 'EmptyState'
