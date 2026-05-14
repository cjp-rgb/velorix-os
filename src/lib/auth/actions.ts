'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/auth/login')
}

/**
 * Changes the current user's password via Supabase auth.
 *
 * Supabase doesn't require old password verification by default for password
 * updates (since the user has an active session). For added safety, we re-verify
 * the current password by attempting a fresh sign-in, then update.
 *
 * Throws on validation failure, re-verification failure, or DB error.
 * Returns success on completion.
 */
export async function changePassword(args: {
  currentPassword: string
  newPassword: string
}): Promise<{ success: true }> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || !user.email) {
    redirect('/auth/login')
  }

  // Re-verify current password by attempting sign-in.
  // This is a separate auth flow that doesn't disrupt the active session.
  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: args.currentPassword,
  })

  if (verifyError) {
    throw new Error('Current password is incorrect')
  }

  // Basic new-password validation
  if (args.newPassword.length < 12) {
    throw new Error('New password must be at least 12 characters')
  }

  if (args.newPassword === args.currentPassword) {
    throw new Error('New password must be different from current password')
  }

  // Update password
  const { error: updateError } = await supabase.auth.updateUser({
    password: args.newPassword,
  })

  if (updateError) {
    console.error('changePassword updateUser error:', updateError)
    throw new Error(updateError.message ?? 'Failed to update password')
  }

  return { success: true }
}

/**
 * Signs the user out of ALL devices/sessions (global scope).
 *
 * Used by the "Sign out everywhere" button on the security settings page.
 * After successful signout, redirects to /auth/login.
 */
export async function signOutEverywhere(): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase.auth.signOut({ scope: 'global' })

  if (error) {
    console.error('signOutEverywhere error:', error)
    throw new Error('Failed to sign out of all devices')
  }

  redirect('/auth/login')
}
