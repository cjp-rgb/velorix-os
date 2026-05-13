'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  TrendingUp,
  Sparkles,
  Zap,
  Settings as SettingsIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type BottomTabsProps = {
  className?: string
}

const tabs = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Earnings', href: '/dashboard/earnings', icon: TrendingUp },
  { label: 'Content', href: '/content', icon: Sparkles },
  { label: 'Automations', href: '/automations', icon: Zap },
  { label: 'Settings', href: '/settings', icon: SettingsIcon },
] as const

function isRouteActive(pathname: string, route: string) {
  if (route === '/dashboard') {
    return pathname === '/dashboard'
  }
  return pathname === route || pathname.startsWith(route + '/')
}

export function BottomTabs({ className }: BottomTabsProps) {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Primary"
      className={cn(
        'fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface/80 backdrop-blur-md',
        'pb-[env(safe-area-inset-bottom)]',
        className
      )}
    >
      <div className="flex h-16">
        {tabs.map(({ label, href, icon: Icon }) => {
          const active = isRouteActive(pathname, href)
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex flex-1 flex-col items-center justify-center gap-1 transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-blue-bright',
                active
                  ? 'text-brand-blue'
                  : 'text-text-dim hover:text-text active:text-text'
              )}
            >
              <Icon className="h-6 w-6" aria-hidden="true" />
              <span className="text-[10px] font-medium leading-none">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
