import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { getCurrentUserProfile } from '@/lib/velorix/data'
import { NotificationsForm } from './NotificationsForm'

export default async function NotificationsSettingsPage() {
  const profile = await getCurrentUserProfile()

  // notification_preferences is JSONB — cast to our expected shape
  const initialPrefs =
    (profile.notification_preferences as Record<
      string,
      { email: boolean; push: boolean; in_app: boolean }
    > | null) ?? {}

  return (
    <div className="px-4 md:px-8 py-6 md:py-10 max-w-3xl mx-auto">
      <Link
        href="/settings"
        className="inline-flex items-center gap-1.5 text-text-dim hover:text-text text-sm mb-6 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        Settings
      </Link>

      <div className="mb-8">
        <p className="text-sm text-text-dim font-mono">Notifications</p>
        <h1 className="mt-1 text-3xl md:text-4xl font-display font-semibold text-text">
          How Should We Reach You?
        </h1>
        <p className="mt-2 text-text-dim">
          Choose which categories notify you and through which channels.
        </p>
      </div>

      <div className="rounded-card bg-surface border border-border p-5 mb-6 flex items-start gap-3">
        <div className="w-2 h-2 rounded-full bg-brand-cyan mt-1.5 flex-shrink-0 animate-pulse" />
        <div>
          <p className="text-text text-sm font-medium">
            Notification delivery is launching soon
          </p>
          <p className="text-text-dim text-sm mt-1">
            Your preferences are saved now and will activate when email and push notifications launch. In-app notifications come first.
          </p>
        </div>
      </div>

      <NotificationsForm initialPreferences={initialPrefs} />
    </div>
  )
}
