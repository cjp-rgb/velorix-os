'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

export function UserMenu({ email }: { email: string }) {
  const router = useRouter()
  const [signingOut, setSigningOut] = useState(false)
  const initial = email.charAt(0).toUpperCase() || '?'

  const onSignOut = async () => {
    setSigningOut(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signOut()
    if (error) {
      toast.error(error.message)
      setSigningOut(false)
      return
    }
    router.replace('/auth/login')
    router.refresh()
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-[0.5px] border-border bg-surface-2 text-2xs font-semibold text-text">
        {initial}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs text-text" title={email}>
          {email}
        </p>
      </div>
      <button
        type="button"
        onClick={onSignOut}
        disabled={signingOut}
        aria-label="Sign out"
        title="Sign out"
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-btn border-[0.5px] border-transparent text-text-dim',
          'hover:border-border hover:bg-surface-2 hover:text-text',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue-bright',
          'disabled:cursor-not-allowed disabled:opacity-50'
        )}
      >
        <LogOut className="h-4 w-4" />
      </button>
    </div>
  )
}
