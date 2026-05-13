'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Users } from 'lucide-react'
import { Card, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

function ConfirmUplineContent() {
  const params = useSearchParams()
  // Phase 3 will read the invite token and look up the upline advisor.
  const advisorName = params.get('advisor') ?? 'your sponsoring advisor'

  const onDecline = () => {
    // TODO (Phase 3): reject the invitation and route to login.
  }
  const onConfirm = () => {
    // TODO (Phase 3): accept the invitation and route to onboarding.
  }

  return (
    <Card>
      <CardBody className="space-y-4 text-center">
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border-[0.5px] border-border bg-surface-2 text-brand-cyan">
          <Users className="h-5 w-5" />
        </div>
        <div className="space-y-1">
          <h2 className="font-display text-sm font-semibold text-text">
            Confirm your network
          </h2>
          <p className="text-xs text-text-dim">
            You&apos;ve been invited to join {advisorName}&apos;s network on Velorix.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="ghost" size="md" onClick={onDecline}>
            Decline
          </Button>
          <Button size="md" onClick={onConfirm}>
            Confirm
          </Button>
        </div>
        <p className="text-2xs text-text-muted">
          Not the right network?{' '}
          <Link href="/auth/login" className="text-text-dim hover:text-text">
            Sign in instead
          </Link>
        </p>
      </CardBody>
    </Card>
  )
}

export default function ConfirmUplinePage() {
  return (
    <Suspense fallback={null}>
      <ConfirmUplineContent />
    </Suspense>
  )
}
