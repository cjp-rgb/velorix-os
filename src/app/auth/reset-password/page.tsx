'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { Mail, Lock } from 'lucide-react'
import toast from 'react-hot-toast'
import { Card, CardBody } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'

const emailSchema = z.object({
  email: z.string().email('Enter a valid email'),
})
const passwordSchema = z
  .object({
    password: z.string().min(12, 'At least 12 characters'),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: 'Passwords do not match',
    path: ['confirm'],
  })

type EmailData = z.infer<typeof emailSchema>
type PasswordData = z.infer<typeof passwordSchema>

function ResetContent() {
  const params = useSearchParams()
  const hasToken = !!params.get('code') || !!params.get('token_hash')
  const [sent, setSent] = useState(false)

  return (
    <Card>
      <CardBody className="space-y-5">
        {hasToken ? (
          <SetPasswordForm />
        ) : sent ? (
          <SentState />
        ) : (
          <RequestForm onSent={() => setSent(true)} />
        )}
        <div className="border-t-[0.5px] border-border pt-3 text-center text-2xs">
          <Link href="/auth/login" className="text-text-dim hover:text-text">
            ← Back to login
          </Link>
        </div>
      </CardBody>
    </Card>
  )
}

function RequestForm({ onSent }: { onSent: () => void }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EmailData>({
    resolver: zodResolver(emailSchema),
  })

  const onSubmit = async (data: EmailData) => {
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })
    if (error) {
      toast.error(error.message)
      return
    }
    onSent()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1">
        <h2 className="font-display text-sm font-semibold text-text">Reset password</h2>
        <p className="text-xs text-text-dim">
          We&apos;ll email you a link to set a new password.
        </p>
      </div>
      <Input
        label="Email"
        type="email"
        autoFocus
        autoComplete="email"
        prefix={<Mail className="h-4 w-4" />}
        error={errors.email?.message}
        required
        {...register('email')}
      />
      <Button type="submit" loading={isSubmitting} className="w-full">
        Send reset link
      </Button>
    </form>
  )
}

function SentState() {
  return (
    <div className="space-y-2 py-4 text-center">
      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border-[0.5px] border-border bg-surface-2 text-brand-cyan">
        <Mail className="h-5 w-5" />
      </div>
      <h2 className="font-display text-sm font-semibold text-text">Check your email</h2>
      <p className="text-xs text-text-dim">Open the link to set a new password.</p>
    </div>
  )
}

function SetPasswordForm() {
  const router = useRouter()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PasswordData>({
    resolver: zodResolver(passwordSchema),
  })

  const onSubmit = async (data: PasswordData) => {
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: data.password })
    if (error) {
      toast.error(error.message)
      return
    }
    toast.success('Password updated')
    router.replace('/dashboard')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1">
        <h2 className="font-display text-sm font-semibold text-text">
          Set a new password
        </h2>
        <p className="text-xs text-text-dim">Use at least 12 characters.</p>
      </div>
      <Input
        label="New password"
        type="password"
        autoFocus
        autoComplete="new-password"
        prefix={<Lock className="h-4 w-4" />}
        error={errors.password?.message}
        required
        {...register('password')}
      />
      <Input
        label="Confirm password"
        type="password"
        autoComplete="new-password"
        prefix={<Lock className="h-4 w-4" />}
        error={errors.confirm?.message}
        required
        {...register('confirm')}
      />
      <Button type="submit" loading={isSubmitting} className="w-full">
        Update password
      </Button>
    </form>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetContent />
    </Suspense>
  )
}
