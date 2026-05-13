'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { Bell } from 'lucide-react'
import { signOut } from '@/lib/auth/actions'
import { cn } from '@/lib/utils'

type AppHeaderProps = {
  user: {
    id: string
    full_name: string
    display_name: string | null
    email: string
    profile_photo_url: string | null
  }
  pageTitle?: string
  notificationCount?: number
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  const first = parts[0]
  if (!first) return '?'
  if (parts.length === 1) return first.charAt(0).toUpperCase()
  const last = parts[parts.length - 1]
  return (first.charAt(0) + (last?.charAt(0) ?? '')).toUpperCase()
}

function NotificationBell({ count }: { count?: number }) {
  const hasUnread = (count ?? 0) > 0
  return (
    <Link
      href="/notifications"
      aria-label={hasUnread ? `Notifications (${count} unread)` : 'Notifications'}
      className="relative flex h-9 w-9 items-center justify-center rounded-btn text-text-dim hover:bg-surface hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue-bright"
    >
      <Bell className="h-5 w-5" />
      {hasUnread && (
        <span
          aria-hidden="true"
          className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-error"
        />
      )}
    </Link>
  )
}

function UserMenu({ user }: { user: AppHeaderProps['user'] }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const displayName = user.display_name ?? user.full_name

  useEffect(() => {
    if (!open) return
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [open])

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        onClick={() => setOpen((v) => !v)}
        className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border-[0.5px] border-border bg-surface-2 hover:border-border-bright focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue-bright"
      >
        {user.profile_photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.profile_photo_url}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="text-2xs font-semibold text-text">{getInitials(displayName)}</span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-40 mt-2 w-56 rounded-card border-[0.5px] border-border bg-surface shadow-xl"
        >
          <div className="px-3 py-3">
            <p className="truncate text-sm font-medium text-text" title={displayName}>
              {displayName}
            </p>
            <p className="truncate text-2xs text-text-dim" title={user.email}>
              {user.email}
            </p>
          </div>
          <div className="border-t-[0.5px] border-border py-1">
            <Link
              href="/settings/profile"
              role="menuitem"
              className="block px-3 py-2 text-sm text-text-dim hover:bg-surface-2 hover:text-text"
              onClick={() => setOpen(false)}
            >
              Profile
            </Link>
            <Link
              href="/settings"
              role="menuitem"
              className="block px-3 py-2 text-sm text-text-dim hover:bg-surface-2 hover:text-text"
              onClick={() => setOpen(false)}
            >
              Settings
            </Link>
          </div>
          <div className="border-t-[0.5px] border-border py-1">
            <form action={signOut}>
              <button
                type="submit"
                role="menuitem"
                className="block w-full px-3 py-2 text-left text-sm text-text-dim hover:bg-surface-2 hover:text-text"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export function AppHeader({ user, pageTitle, notificationCount }: AppHeaderProps) {
  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-30 h-14 border-b border-border bg-bg/80 backdrop-blur-md',
        'md:left-[240px] md:h-16'
      )}
    >
      {/* Mobile */}
      <div className="flex h-full items-center justify-between px-4 md:hidden">
        <div className="w-9" aria-hidden="true" />
        <Link href="/dashboard" className="flex items-baseline">
          <span className="font-display font-semibold text-text">Velorix</span>
        </Link>
        <NotificationBell count={notificationCount} />
      </div>

      {/* Desktop */}
      <div className="hidden h-full items-center justify-between px-6 md:flex">
        <h1 className="font-display text-base font-semibold text-text">{pageTitle ?? ''}</h1>
        <div className="flex items-center gap-2">
          <NotificationBell count={notificationCount} />
          <UserMenu user={user} />
        </div>
      </div>
    </header>
  )
}
