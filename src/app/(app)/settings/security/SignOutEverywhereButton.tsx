'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'
import { signOutEverywhere } from '@/lib/auth/actions'

export function SignOutEverywhereButton() {
  const [isSigningOut, setIsSigningOut] = useState(false)

  const handleClick = async () => {
    const confirmed = window.confirm(
      'Sign out of all devices? You will need to sign in again on every device, including this one.'
    )
    if (!confirmed) return

    setIsSigningOut(true)
    try {
      await signOutEverywhere()
      // signOutEverywhere redirects to /auth/login, so this line usually won't execute
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to sign out'
      toast.error(message)
      setIsSigningOut(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isSigningOut}
      className="px-4 py-2 rounded-btn bg-surface-2 border border-border text-text hover:border-border-bright disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
    >
      {isSigningOut ? 'Signing out...' : 'Sign out of all devices'}
    </button>
  )
}
