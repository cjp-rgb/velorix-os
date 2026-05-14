import Link from 'next/link'
import { Mail } from 'lucide-react'

export default function AccountTerminatedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-bg">
      <div className="max-w-md w-full">
        <div className="rounded-card bg-surface border border-border p-8 md:p-10">
          <div className="mb-6">
            <p className="text-sm text-text-dim font-mono">Velorix</p>
            <h1 className="mt-2 text-3xl md:text-4xl font-display font-semibold text-text">
              Account terminated
            </h1>
          </div>

          <div className="space-y-4 text-text-dim">
            <p>
              Your Velorix account has been permanently closed. All bot connections, automations, dashboard access, and platform tools are now inactive.
            </p>

            <p>
              Your PU Prime affiliate relationships continue at PU Prime independently of Velorix — they are unaffected by this termination.
            </p>

            <p>
              Per Velorix&apos;s data policy, your personal identity information will be hard-deleted from our systems in 30 days. Velorix-controlled data (CRM contents, captured leads, sub-affiliate relationships, performance history, generated content) remains within Velorix per the platform agreement.
            </p>
          </div>

          <div className="mt-8 pt-6 border-t border-border">
            <p className="text-text-muted text-sm mb-3">
              Questions about your termination or data?
            </p>
            <a
              href="mailto:carsonpickardd@velorix.org"
              className="inline-flex items-center gap-2 text-brand-cyan hover:underline text-sm font-medium"
            >
              <Mail className="w-4 h-4" />
              carsonpickardd@velorix.org
            </a>
          </div>

          <div className="mt-8 pt-6 border-t border-border">
            <Link
              href="/"
              className="text-text-muted text-sm hover:text-text-dim transition-colors"
            >
              Return to velorix.org
            </Link>
          </div>
        </div>

        <p className="text-center text-text-muted text-xs mt-6 font-mono">
          This page is shown only after permanent account termination.
        </p>
      </div>
    </div>
  )
}
