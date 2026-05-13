'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
import { cn } from '@/lib/utils'

type Mode = 'magic' | 'password'

const magicSchema = z.object({
  email: z.string().email('Enter a valid email'),
})
const passwordSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Required'),
})

type MagicData = z.infer<typeof magicSchema>
type PasswordData = z.infer<typeof passwordSchema>

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>('magic')
  const [magicSent, setMagicSent] = useState(false)

  return (
    <Card>
      <CardBody className="space-y-6">
        <div
          role="tablist"
          aria-label="Sign-in method"
          className="grid grid-cols-2 gap-1 rounded-btn bg-surface-2 p-1"
        >
          <TabButton
            active={mode === 'magic'}
            onClick={() => {
              setMode('magic')
              setMagicSent(false)
            }}
          >
            Magic link
          </TabButton>
          <TabButton active={mode === 'password'} onClick={() => setMode('password')}>
            Password
          </TabButton>
        </div>

        {mode === 'magic' ? (
          magicSent ? (
            <MagicSentState />
          ) : (
            <MagicLinkForm onSent={() => setMagicSent(true)} />
          )
        ) : (
          <PasswordForm />
        )}

        <div className="border-t-[0.5px] border-border pt-4 text-center text-xs text-text-dim">
          New to Velorix?{' '}
          <span aria-disabled="true" className="cursor-not-allowed text-text-muted">
            Sign up by invitation only
          </span>
        </div>
      </CardBody>
    </Card>
  )
}

function TabButton({
  active,
  children,
  ...props
}: { active: boolean } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      className={cn(
        'rounded-btn px-3 py-1.5 text-xs font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue-bright',
        active ? 'bg-surface text-text' : 'text-text-dim hover:text-text'
      )}
      {...props}
    >
      {children}
    </button>
  )
}

function MagicLinkForm({ onSent }: { onSent: () => void }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<MagicData>({
    resolver: zodResolver(magicSchema),
  })

  const onSubmit = async (data: MagicData) => {
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email: data.email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/verify`,
      },
    })
    if (error) {
      toast.error(error.message)
      return
    }
    onSent()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        label="Email"
        type="email"
        autoComplete="email"
        autoFocus
        placeholder="you@advisor.com"
        prefix={<Mail className="h-4 w-4" />}
        error={errors.email?.message}
        required
        {...register('email')}
      />
      <Button type="submit" loading={isSubmitting} className="w-full">
        Send magic link
      </Button>
    </form>
  )
}

function MagicSentState() {
  return (
    <div className="space-y-2 py-4 text-center">
      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border-[0.5px] border-border bg-surface-2 text-brand-cyan">
        <Mail className="h-5 w-5" />
      </div>
      <h2 className="font-display text-sm font-semibold text-text">
        Check your email
      </h2>
      <p className="text-xs text-text-dim">
        We sent a sign-in link. Click it to continue.
      </p>
    </div>
  )
}

function PasswordForm() {
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
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })
    if (error) {
      toast.error(error.message)
      return
    }
    router.replace('/dashboard')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        label="Email"
        type="email"
        autoComplete="email"
        autoFocus
        prefix={<Mail className="h-4 w-4" />}
        error={errors.email?.message}
        required
        {...register('email')}
      />
      <Input
        label="Password"
        type="password"
        autoComplete="current-password"
        prefix={<Lock className="h-4 w-4" />}
        error={errors.password?.message}
        required
        {...register('password')}
      />
      <div className="text-right">
        <Link
          href="/auth/reset-password"
          className="text-2xs text-text-dim hover:text-text"
        >
          Forgot password?
        </Link>
      </div>
      <Button type="submit" loading={isSubmitting} className="w-full">
        Sign in
      </Button>
    </form>
  )
}
