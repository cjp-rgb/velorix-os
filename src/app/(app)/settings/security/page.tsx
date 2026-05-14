import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { getCurrentUserProfile } from '@/lib/velorix/data'
import { PasswordChangeForm } from './PasswordChangeForm'
import { SignOutEverywhereButton } from './SignOutEverywhereButton'

export default async function SecuritySettingsPage() {
  const profile = await getCurrentUserProfile()

  return (
    <div className="px-4 md:px-8 py-6 md:py-10 max-w-2xl mx-auto">
      <Link
        href="/settings"
        className="inline-flex items-center gap-1.5 text-text-dim hover:text-text text-sm mb-6 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        Settings
      </Link>

      <div className="mb-8">
        <p className="text-sm text-text-dim font-mono">Security</p>
        <h1 className="mt-1 text-3xl md:text-4xl font-display font-semibold text-text">
          Account Security
        </h1>
        <p className="mt-2 text-text-dim">
          Manage your password and active sessions.
        </p>
      </div>

      {/* Password change section */}
      <section className="mb-10">
        <div className="mb-4">
          <h2 className="text-lg font-display font-semibold text-text">Change Password</h2>
          <p className="text-sm text-text-dim mt-1">
            Minimum 12 characters. We&apos;ll verify your current password before changing.
          </p>
        </div>
        <PasswordChangeForm />
      </section>

      {/* Active sessions section */}
      <section className="mb-10">
        <div className="mb-4">
          <h2 className="text-lg font-display font-semibold text-text">Active Sessions</h2>
          <p className="text-sm text-text-dim mt-1">
            Signed in as <span className="text-text font-mono">{profile.email}</span>
          </p>
        </div>
        <div className="rounded-card bg-surface border border-border p-5">
          <p className="text-text text-sm">
            You&apos;re currently signed in on this device.
          </p>
          <p className="text-text-dim text-sm mt-2">
            If you suspect someone else has access to your account, sign out of all devices below. You&apos;ll need to sign in again on every device.
          </p>
          <div className="mt-5">
            <SignOutEverywhereButton />
          </div>
        </div>
      </section>

      {/* 2FA placeholder section */}
      <section>
        <div className="mb-4">
          <h2 className="text-lg font-display font-semibold text-text">Two-Factor Authentication</h2>
          <p className="text-sm text-text-dim mt-1">
            Extra protection for your account.
          </p>
        </div>
        <div className="rounded-card bg-surface border border-border p-5">
          <p className="text-text-dim text-sm">
            Two-factor authentication is coming soon. For now, use a strong unique password and avoid signing in on shared devices.
          </p>
        </div>
      </section>
    </div>
  )
}
