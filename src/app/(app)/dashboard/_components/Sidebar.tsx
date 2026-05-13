'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, Network, BarChart3, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import { UserMenu } from './UserMenu'

const activeNav = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
] as const

const comingSoonNav = [
  { label: 'Clients', icon: Users },
  { label: 'Network', icon: Network },
  { label: 'Reports', icon: BarChart3 },
  { label: 'Settings', icon: Settings },
] as const

export function Sidebar({ userEmail }: { userEmail: string }) {
  const pathname = usePathname()

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r-[0.5px] border-border bg-surface">
      <div className="px-5 py-6">
        <Link href="/dashboard" className="flex items-baseline gap-1">
          <span className="font-display text-lg font-semibold tracking-tight text-text">
            Velorix
          </span>
          <span className="font-display text-2xs uppercase tracking-widest text-text-muted">
            OS
          </span>
        </Link>
      </div>

      <nav className="flex-1 space-y-6 px-3 pb-4">
        <div className="space-y-1">
          {activeNav.map(({ label, href, icon: Icon }) => {
            const isActive = pathname === href || pathname.startsWith(`${href}/`)
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-2 rounded-btn px-3 py-2 text-sm transition-colors',
                  isActive
                    ? 'bg-surface-2 text-text'
                    : 'text-text-dim hover:bg-surface-2 hover:text-text'
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            )
          })}
        </div>

        <div className="space-y-1">
          <p className="px-3 text-2xs uppercase tracking-wider text-text-muted">
            Coming soon
          </p>
          {comingSoonNav.map(({ label, icon: Icon }) => (
            <div
              key={label}
              aria-disabled="true"
              className="flex cursor-not-allowed items-center gap-2 rounded-btn px-3 py-2 text-sm text-text-muted"
            >
              <Icon className="h-4 w-4" />
              {label}
            </div>
          ))}
        </div>
      </nav>

      <div className="border-t-[0.5px] border-border p-3">
        <UserMenu email={userEmail} />
      </div>
    </aside>
  )
}
