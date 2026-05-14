import Link from 'next/link'
import {
  ChevronRight,
  User,
  Shield,
  IdCard,
  Bell,
  Link2,
  Trash2,
} from 'lucide-react'

const SETTINGS_LINKS = [
  {
    href: '/settings/account',
    icon: User,
    label: 'Account',
    description: 'Name, phone, country, timezone',
  },
  {
    href: '/settings/security',
    icon: Shield,
    label: 'Security',
    description: 'Password and active sessions',
  },
  {
    href: '/settings/profile',
    icon: IdCard,
    label: 'Profile',
    description: 'Photo and public handles',
  },
  {
    href: '/settings/notifications',
    icon: Bell,
    label: 'Notifications',
    description: 'Email and push preferences',
  },
  {
    href: '/settings/integrations',
    icon: Link2,
    label: 'Integrations',
    description: 'Telegram bot and PU Prime account',
  },
  {
    href: '/settings/delete',
    icon: Trash2,
    label: 'Delete Account',
    description: 'Permanently remove your account',
    destructive: true,
  },
] as const

export default function SettingsPage() {
  return (
    <div className="px-4 md:px-8 py-6 md:py-10 max-w-3xl mx-auto">
      <div className="mb-8">
        <p className="text-sm text-text-dim font-mono">Settings</p>
        <h1 className="mt-1 text-3xl md:text-4xl font-display font-semibold text-text">
          Preferences
        </h1>
        <p className="mt-2 text-text-dim">
          Manage your account, security, and integrations.
        </p>
      </div>

      <div className="rounded-card bg-surface border border-border overflow-hidden">
        {SETTINGS_LINKS.map((link, i) => {
          const Icon = link.icon
          const isDestructive = 'destructive' in link && link.destructive
          const isLast = i === SETTINGS_LINKS.length - 1

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-4 p-5 transition-colors hover:bg-surface-2 ${
                !isLast ? 'border-b border-border' : ''
              }`}
            >
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  isDestructive
                    ? 'bg-warning/10'
                    : 'bg-surface-2'
                }`}
              >
                <Icon
                  className={`w-5 h-5 ${
                    isDestructive ? 'text-warning' : 'text-text-dim'
                  }`}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className={`font-medium ${
                    isDestructive ? 'text-warning' : 'text-text'
                  }`}
                >
                  {link.label}
                </p>
                <p className="text-text-dim text-sm mt-0.5">
                  {link.description}
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-text-muted flex-shrink-0" />
            </Link>
          )
        })}
      </div>
    </div>
  )
}
