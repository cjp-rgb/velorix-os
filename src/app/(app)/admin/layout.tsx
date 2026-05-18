import { redirect } from 'next/navigation'
import { getCurrentUserProfile } from '@/lib/velorix/data'

/**
 * Admin route group layout. Gates all /admin/* routes.
 *
 * Only profiles with role === 'admin' can access these routes.
 * Non-admin operators get redirected to /dashboard with no further explanation.
 *
 * The narrowed Profile type from data.ts handles the role union,
 * so role === 'admin' is type-safe.
 *
 * Note: AppShell (the wrapping layout at (app)/) already enforces
 * the terminated-account redirect. This admin layout only adds the
 * role check on top.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const profile = await getCurrentUserProfile()

  if (profile.role !== 'admin') {
    redirect('/dashboard')
  }

  return <>{children}</>
}
