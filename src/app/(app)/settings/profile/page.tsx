import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { getCurrentUserProfile } from '@/lib/velorix/data'
import { ProfileForm } from './ProfileForm'

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 0) return '?'
  if (parts.length === 1) {
    const first = parts[0]
    return first && first.length > 0 ? first.charAt(0).toUpperCase() : '?'
  }
  const firstInitial = parts[0]?.charAt(0) ?? ''
  const lastInitial = parts[parts.length - 1]?.charAt(0) ?? ''
  return (firstInitial + lastInitial).toUpperCase() || '?'
}

export default async function ProfileSettingsPage() {
  const profile = await getCurrentUserProfile()
  const displayName = profile.display_name || profile.full_name
  const initials = getInitials(displayName)

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
        <p className="text-sm text-text-dim font-mono">Profile</p>
        <h1 className="mt-1 text-3xl md:text-4xl font-display font-semibold text-text">
          Your Public Profile
        </h1>
        <p className="mt-2 text-text-dim">
          Other operators see this when they look you up across Velorix.
        </p>
      </div>

      {/* Photo section */}
      <section className="mb-10">
        <div className="mb-4">
          <h2 className="text-lg font-display font-semibold text-text">Profile Photo</h2>
          <p className="text-sm text-text-dim mt-1">
            Your image across Velorix.
          </p>
        </div>
        <div className="rounded-card bg-surface border border-border p-5">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-full bg-surface-2 flex items-center justify-center flex-shrink-0">
              <span className="text-text font-display font-semibold text-2xl">
                {initials}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-text font-medium">{displayName}</p>
              <p className="text-text-dim text-sm mt-1">
                Photo upload coming in v1.1. For now, your initials are shown across Velorix.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Public handles section */}
      <section>
        <div className="mb-4">
          <h2 className="text-lg font-display font-semibold text-text">Public Handles</h2>
          <p className="text-sm text-text-dim mt-1">
            How other operators can reach you across platforms.
          </p>
        </div>
        <ProfileForm
          initialProfile={{
            instagram_handle: profile.instagram_handle,
            telegram_handle: profile.telegram_handle,
          }}
        />
      </section>
    </div>
  )
}
