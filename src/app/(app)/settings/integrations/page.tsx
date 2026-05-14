import Link from 'next/link'
import { ChevronLeft, ExternalLink } from 'lucide-react'
import {
  getCurrentUserProfile,
  getOperatorBotConnection,
} from '@/lib/velorix/data'
import { TelegramBotForm } from './TelegramBotForm'

export default async function IntegrationsSettingsPage() {
  const [profile, botConnection] = await Promise.all([
    getCurrentUserProfile(),
    getOperatorBotConnection(),
  ])

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
        <p className="text-sm text-text-dim font-mono">Integrations</p>
        <h1 className="mt-1 text-3xl md:text-4xl font-display font-semibold text-text">
          Connect Your Tools
        </h1>
        <p className="mt-2 text-text-dim">
          Link your Telegram bot and view your PU Prime account connection.
        </p>
      </div>

      {/* Telegram bot section */}
      <section className="mb-10">
        <div className="mb-4">
          <h2 className="text-lg font-display font-semibold text-text">
            Telegram Bot
          </h2>
          <p className="text-sm text-text-dim mt-1">
            Your bot is the channel Velorix uses to fire automations — sign-up flows, EOD messages, profit shots, scheduled posts. One bot per operator. Create it via{' '}
            <a
              href="https://t.me/BotFather"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-cyan hover:underline inline-flex items-center gap-1"
            >
              @BotFather
              <ExternalLink className="w-3 h-3" />
            </a>{' '}
            on Telegram.
          </p>
        </div>
        <TelegramBotForm initialConnection={botConnection} />
      </section>

      {/* PU Prime section */}
      <section>
        <div className="mb-4">
          <h2 className="text-lg font-display font-semibold text-text">PU Prime Account</h2>
          <p className="text-sm text-text-dim mt-1">
            Your PU Prime affiliate ID. This is set during onboarding and managed by Velorix admin — contact support to change.
          </p>
        </div>
        <div className="rounded-card bg-surface border border-border p-5">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-xs uppercase tracking-wider text-text-muted font-medium">
                PU Prime Affiliate ID
              </p>
              <p className="text-text font-mono text-lg mt-1 break-all">
                {profile.pu_prime_aff_id ?? 'Not set'}
              </p>
            </div>
            <div className="flex-shrink-0">
              {profile.pu_prime_aff_id ? (
                <span className="text-xs text-success-bright font-medium uppercase tracking-wider">
                  Connected
                </span>
              ) : (
                <span className="text-xs text-text-muted font-medium uppercase tracking-wider">
                  Pending
                </span>
              )}
            </div>
          </div>
          {profile.allocated_rebate !== null && (
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-xs uppercase tracking-wider text-text-muted font-medium">
                Allocated Rebate
              </p>
              <p className="text-text font-mono mt-1">
                ${Number(profile.allocated_rebate).toFixed(2)} / lot
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
