'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowRight,
  Check,
  X,
  Bot,
  IdCard,
  TrendingUp,
  Users,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { markOnboardingComplete } from '@/lib/velorix/data'

// Icon registry — Client Component resolves the name to the actual icon.
// This is required because React component references can't be serialized
// across the Server → Client Component boundary in Next.js App Router.
const ICON_REGISTRY = {
  bot: Bot,
  id_card: IdCard,
  trending_up: TrendingUp,
  users: Users,
} as const

export type OnboardingIconName = keyof typeof ICON_REGISTRY

export type OnboardingCard = {
  key: string
  iconName: OnboardingIconName
  label: string
  description: string
  href: string
  isComplete: boolean
}

type OnboardingBannerProps = {
  cards: OnboardingCard[]
}

export function OnboardingBanner({ cards }: OnboardingBannerProps) {
  const router = useRouter()
  const [isDismissing, setIsDismissing] = useState(false)

  const completeCount = cards.filter((c) => c.isComplete).length
  const totalCount = cards.length
  const progressPct = totalCount === 0 ? 0 : (completeCount / totalCount) * 100

  const handleDismiss = async () => {
    setIsDismissing(true)
    try {
      await markOnboardingComplete()
      toast.success('Got it. You can always revisit settings later.')
      router.refresh()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to dismiss'
      toast.error(message)
      setIsDismissing(false)
    }
  }

  return (
    <div className="mb-8 rounded-card border border-border-bright bg-gradient-to-br from-surface to-surface-2 overflow-hidden">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-xs uppercase tracking-wider text-brand-cyan font-medium">
            Get started
          </p>
          <h2 className="mt-1 text-2xl font-display font-semibold text-text">
            Welcome to Velorix
          </h2>
          <p className="mt-1.5 text-text-dim text-sm">
            {completeCount} of {totalCount} steps complete
          </p>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          disabled={isDismissing}
          className="text-text-muted hover:text-text-dim transition-colors p-1 flex-shrink-0 disabled:opacity-50"
          aria-label="Dismiss onboarding"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Progress bar */}
      <div className="px-6 pb-5">
        <div className="h-1 bg-surface-2 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-brand-blue to-brand-cyan transition-all duration-700"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Cards */}
      <div className="px-6 pb-6 grid grid-cols-1 md:grid-cols-2 gap-3">
        {cards.map((card) => {
          const Icon = ICON_REGISTRY[card.iconName]
          return (
            <Link
              key={card.key}
              href={card.href}
              className={`rounded-card border p-4 flex items-center gap-3 transition-colors group ${
                card.isComplete
                  ? 'bg-surface border-border'
                  : 'bg-surface border-border hover:border-border-bright'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  card.isComplete
                    ? 'bg-success-bright/10'
                    : 'bg-surface-2'
                }`}
              >
                {card.isComplete ? (
                  <Check className="w-5 h-5 text-success-bright" />
                ) : (
                  <Icon className="w-5 h-5 text-text-dim" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className={`font-medium text-sm ${
                    card.isComplete ? 'text-text-dim line-through' : 'text-text'
                  }`}
                >
                  {card.label}
                </p>
                <p className="text-text-muted text-xs mt-0.5">
                  {card.description}
                </p>
              </div>
              {!card.isComplete && (
                <ArrowRight className="w-4 h-4 text-text-muted group-hover:text-text-dim transition-colors flex-shrink-0" />
              )}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
