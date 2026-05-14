import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { getCurrentUserProfile } from '@/lib/velorix/data'
import { AccountForm } from './AccountForm'

export default async function AccountSettingsPage() {
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
        <p className="text-sm text-text-dim font-mono">Account</p>
        <h1 className="mt-1 text-3xl md:text-4xl font-display font-semibold text-text">
          Your Information
        </h1>
        <p className="mt-2 text-text-dim">
          Update your name, contact details, and location.
        </p>
      </div>

      <AccountForm
        initialProfile={{
          full_name: profile.full_name,
          display_name: profile.display_name,
          email: profile.email,
          phone: profile.phone,
          country: profile.country,
          timezone: profile.timezone,
        }}
      />
    </div>
  )
}
