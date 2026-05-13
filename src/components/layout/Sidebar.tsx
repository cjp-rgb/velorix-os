'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  TrendingUp,
  UserCircle,
  Network,
  Sparkles,
  GraduationCap,
  Zap,
  Settings as SettingsIcon,
  Shield,
  LogOut,
} from 'lucide-react'
import { signOut } from '@/lib/auth/actions'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'

type SidebarProps = {
  user: {
    id: string
    full_name: string
    display_name: string | null
    role: 'admin' | 'master' | 'sub_affiliate'
    velorix_tier: 'entry' | 'growth' | 'scale' | null
    profile_photo_url: string | null
  }
  className?: string
}

const baseNavItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Earnings', href: '/dashboard/earnings', icon: TrendingUp },
  { label: 'Clients', href: '/dashboard/clients', icon: UserCircle },
  { label: 'Downline', href: '/dashboard/downline', icon: Network },
  { label: 'Content', href: '/content', icon: Sparkles },
  { label: 'Education', href: '/education', icon: GraduationCap },
  { label: 'Automations', href: '/automations', icon: Zap },
  { label: 'Settings', href: '/settings', icon: SettingsIcon },
] as const

const roleLabel = {
  admin: 'Admin',
  master: 'Master',
  sub_affiliate: 'Sub-affiliate',
} as const

function isRouteActive(pathname: string, route: string) {
  if (route === '/dashboard') {
    return pathname === '/dashboard'
  }
  return pathname === route || pathname.startsWith(route + '/')
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  const first = parts[0]
  if (!first) return '?'
  if (parts.length === 1) return first.charAt(0).toUpperCase()
  const last = parts[parts.length - 1]
  return (first.charAt(0) + (last?.charAt(0) ?? '')).toUpperCase()
}

export function Sidebar({ user, className }: SidebarProps) {
  const pathname = usePathname()
  const displayName = user.display_name ?? user.full_name

  const navItems = [
    ...baseNavItems,
    ...(user.role === 'admin'
      ? ([{ label: 'Admin', href: '/admin', icon: Shield }] as const)
      : []),
  ]

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-30 flex w-60 flex-col border-r border-border bg-surface',
        className
      )}
    >
      <div className="border-b-[0.5px] border-border px-5 py-5">
        <Link href="/dashboard" className="flex items-baseline">
          <span className="font-display font-semibold text-text">Velorix</span>
          <span className="ml-1 font-mono text-xs text-text-dim">OS</span>
        </Link>
        <div className="mt-2">
          {user.velorix_tier ? (
            <Badge variant={user.velorix_tier} className="uppercase tracking-wide">
              {user.velorix_tier}
            </Badge>
          ) : (
            <Badge variant="neutral">—</Badge>
          )}
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-4">
        {navItems.map(({ label, href, icon: Icon }) => {
          const active = isRouteActive(pathname, href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-2 rounded-btn border-l-2 px-3 py-2 text-sm transition-colors',
                active
                  ? 'border-brand-blue bg-surface-2 text-text'
                  : 'border-transparent text-text-dim hover:bg-surface-2 hover:text-text'
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="border-t-[0.5px] border-border p-3">
        <div className="flex items-center gap-2">
          {user.profile_photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.profile_photo_url}
              alt=""
              className="h-8 w-8 shrink-0 rounded-full border-[0.5px] border-border object-cover"
            />
          ) : (
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-[0.5px] border-border bg-surface-2 text-2xs font-semibold text-text">
              {getInitials(displayName)}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs text-text" title={displayName}>
              {displayName}
            </p>
            <Badge variant="neutral" className="mt-0.5">
              {roleLabel[user.role]}
            </Badge>
          </div>
          <form action={signOut}>
            <button
              type="submit"
              aria-label="Sign out"
              title="Sign out"
              className={cn(
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-btn border-[0.5px] border-transparent text-text-dim',
                'hover:border-border hover:bg-surface-2 hover:text-text',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue-bright'
              )}
            >
              <LogOut className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </aside>
  )
}
