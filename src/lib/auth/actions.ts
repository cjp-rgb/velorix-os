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

/**
 * Permanently terminates the current user's Velorix account.
 *
 * This is a soft-delete: the profile row remains with account_status='terminated'
 * for audit and tax-record purposes. Hard delete of personal data happens 30 days
 * later via admin cleanup (Phase 4 work).
 *
 * Sequence:
 * 1. Verify the user typed the correct confirmation string ("DELETE")
 * 2. Disconnect any active Telegram bot (sets is_enabled=false, clears token)
 * 3. Mark profile as terminated (account_status='terminated')
 * 4. Sign out of all sessions (global scope)
 * 5. Redirect to /auth/terminated
 *
 * Sub-affiliate cascade termination is NOT handled here — that's Phase 4 work
 * (no sub-affiliates exist in Velorix yet). When it ships, it adds a step
 * between (3) and (4) to notify downline + start their 30-day grace window.
 *
 * Throws if confirmation string doesn't match.
 */
export async function deleteAccount(args: {
  confirmation: string
}): Promise<void> {
  if (args.confirmation !== 'DELETE') {
    throw new Error('Confirmation text does not match. Type DELETE exactly to confirm.')
  }

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Step 1: Disconnect any active Telegram bot.
  // We do this directly here rather than calling disconnectTelegramBot()
  // because we want a single failure point and we're already cleaning up.
  // The update is idempotent — if no bot is connected, it updates zero rows.
  const { error: botError } = await supabase
    .from('automation_configs')
    .update({
      is_enabled: false,
      config_jsonb: { disconnected_at: new Date().toISOString(), reason: 'account_terminated' },
    })
    .eq('operator_id', user.id)
    .eq('automation_type', 'telegram_bot_connection')

  if (botError) {
    console.error('deleteAccount bot disconnect error:', botError)
    // Don't throw — bot disconnect failure shouldn't block account termination
  }

  // Step 2: Mark profile as terminated
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ account_status: 'terminated' })
    .eq('id', user.id)

  if (profileError) {
    console.error('deleteAccount profile update error:', profileError)
    throw new Error('Failed to terminate account. Contact support.')
  }

  // Step 3: Sign out globally
  const { error: signOutError } = await supabase.auth.signOut({ scope: 'global' })

  if (signOutError) {
    console.error('deleteAccount signOut error:', signOutError)
    // Don't throw — the profile is already terminated, sign-out failure
    // just means cookies might persist briefly. Auth gate will catch it.
  }

  // Step 4: Redirect to terminated page
  redirect('/auth/terminated')
}
