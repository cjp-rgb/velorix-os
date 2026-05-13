import * as React from 'react'
import { cn } from '@/lib/utils'

export type SkeletonProps = React.HTMLAttributes<HTMLDivElement>

export const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      aria-hidden="true"
      className={cn(
        'animate-pulse rounded-btn border-[0.5px] border-border bg-surface-2',
        className
      )}
      {...props}
    />
  )
)
Skeleton.displayName = 'Skeleton'
