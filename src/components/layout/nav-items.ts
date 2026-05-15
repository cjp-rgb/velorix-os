import type { ComponentType } from 'react'
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
} from 'lucide-react'

// Shared between Sidebar (desktop) and NavDrawer (mobile).
// One source of truth for nav items — change here, both surfaces update.

export type NavItem = {
  label: string
  href: string
  icon: ComponentType<{ className?: string }>
}

export const BASE_NAV_ITEMS: readonly NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Earnings', href: '/dashboard/earnings', icon: TrendingUp },
  { label: 'Clients', href: '/dashboard/clients', icon: UserCircle },
  { label: 'Downline', href: '/dashboard/downline', icon: Network },
  { label: 'Content', href: '/content', icon: Sparkles },
  { label: 'Education', href: '/education', icon: GraduationCap },
  { label: 'Automations', href: '/automations', icon: Zap },
  { label: 'Settings', href: '/settings', icon: SettingsIcon },
] as const

export const ADMIN_NAV_ITEM: NavItem = {
  label: 'Admin',
  href: '/admin',
  icon: Shield,
}

/**
 * Returns the appropriate nav items for a given user role.
 * Admin role gets the Admin item appended; others see only base items.
 */
export function getNavItemsForRole(role: string): readonly NavItem[] {
  if (role === 'admin') {
    return [...BASE_NAV_ITEMS, ADMIN_NAV_ITEM]
  }
  return BASE_NAV_ITEMS
}
