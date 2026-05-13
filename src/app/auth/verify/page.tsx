'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import type { EmailOtpType } from '@supabase/supabase-js'
import { Card, CardBody } from '@/components/ui/Card'
import { createClient } from '@/lib/supabase/client'

type Status = 'verifying' | 'success' | 'error'

const VERIFY_TYPES = [
  'email',
  'recovery',
  'invite',
  'email_change',
  'signup',
  'magiclink',
] as const

function isEmailOtpType(value: string | null): value is EmailOtpType {
  return !!value && (VERIFY_TYPES as readonly string[]).includes(value)
}

function VerifyContent() {
  const params = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<Status>('verifying')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    const tokenHash = params.get('token_hash')
    const type = params.get('type')

    if (!tokenHash || !isEmailOtpType(type)) {
      setStatus('error')
      setErrorMessage('Missing or invalid verification token.')
      return
    }

    let cancelled = false
    void (async () => {
      const supabase = createClient()
      const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
      if (cancelled) return
      if (error) {
        setStatus('error')
        setErrorMessage(error.message)
        return
      }
      setStatus('success')
      window.setTimeout(() => {
        if (!cancelled) {
          router.replace('/dashboard')
          router.refresh()
        }
      }, 800)
    })()

    return () => {
      cancelled = true
    }
  }, [params, router])

  return (
    <Card>
      <CardBody className="space-y-3 py-10 text-center">
        {status === 'verifying' && (
          <>
            <Loader2 className="mx-auto h-6 w-6 animate-spin text-brand-blue-bright" />
            <h2 className="font-display text-sm font-semibold text-text">
              Verifying your link…
            </h2>
            <p className="text-xs text-text-dim">This will only take a moment.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle2 className="mx-auto h-6 w-6 text-success-bright" />
            <h2 className="font-display text-sm font-semibold text-text">
              You&apos;re in
            </h2>
            <p className="text-xs text-text-dim">Redirecting you to the dashboard…</p>
          </>
        )}

        {status === 'error' && (
          <>
            <AlertCircle className="mx-auto h-6 w-6 text-error" />
            <h2 className="font-display text-sm font-semibold text-text">
              Verification failed
            </h2>
            <p className="text-xs text-text-dim">
              {errorMessage ?? 'This link is invalid or expired.'}
            </p>
            <Link
              href="/auth/login"
              className="mt-2 inline-flex h-10 items-center justify-center gap-2 rounded-btn border-[0.5px] border-border bg-surface px-4 text-sm font-medium text-text transition-colors hover:border-border-bright hover:bg-surface-2"
            >
              Back to login
            </Link>
          </>
        )}
      </CardBody>
    </Card>
  )
}

export default function VerifyPage() {
  return (
    <Suspense fallback={null}>
      <VerifyContent />
    </Suspense>
  )
}
