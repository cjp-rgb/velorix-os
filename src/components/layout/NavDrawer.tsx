'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { X, LogOut } from 'lucide-react'
import { getNavItemsForRole } from './nav-items'
import { signOut } from '@/lib/auth/actions'

type NavDrawerProps = {
  isOpen: boolean
  onClose: () => void
  user: {
    full_name: string
    display_name: string | null
    email: string
    role: string
  }
}

export function NavDrawer({ isOpen, onClose, user }: NavDrawerProps) {
  const pathname = usePathname()
  const navItems = getNavItemsForRole(user.role)
  const displayName = user.display_name || user.full_name

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [isOpen, onClose])

  // Prevent body scroll while drawer is open
  useEffect(() => {
    if (!isOpen) return
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = originalOverflow
    }
  }, [isOpen])

  // Close drawer when route changes (user tapped a nav item)
  useEffect(() => {
    onClose()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-200 md:hidden ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-surface border-r border-border transition-transform duration-200 ease-out md:hidden flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <p className="text-lg font-display font-semibold text-text">Velorix</p>
          <button
            type="button"
            onClick={onClose}
            className="text-text-muted hover:text-text-dim transition-colors p-1"
            aria-label="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User info */}
        <div className="px-5 py-4 border-b border-border">
          <p className="text-text font-medium truncate">{displayName}</p>
          <p className="text-text-dim text-sm truncate">{user.email}</p>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto py-3">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive =
              pathname === item.href ||
              (item.href !== '/dashboard' && pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-5 py-3 transition-colors ${
                  isActive
                    ? 'bg-surface-2 text-text border-l-2 border-brand-cyan'
                    : 'text-text-dim hover:bg-surface-2 hover:text-text border-l-2 border-transparent'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="font-medium">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Sign out */}
        <div className="border-t border-border p-3">
          <form action={signOut}>
            <button
              type="submit"
              className="w-full flex items-center gap-3 px-2 py-3 rounded-btn text-text-dim hover:bg-surface-2 hover:text-text transition-colors"
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              <span className="font-medium text-sm">Sign out</span>
            </button>
          </form>
        </div>
      </aside>
    </>
  )
}
