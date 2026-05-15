import { redirect } from 'next/navigation'
import { getCurrentUserProfile } from '@/lib/velorix/data'
import { Sidebar } from '@/components/layout/Sidebar'
import { AppHeader } from '@/components/layout/AppHeader'
import { BottomTabs } from '@/components/layout/BottomTabs'
import { PWAInstallPrompt } from '@/components/PWAInstallPrompt'

export async function AppShell({
  children,
}: {
  children: React.ReactNode
}) {
  // getCurrentUserProfile handles the missing-user redirect to /auth/login
  // internally; throws for missing-profile (data-integrity bug — surfaces via
  // Next.js error boundary, which is the desired louder signal for a state
  // that should never happen in production).
  const profile = await getCurrentUserProfile()

  if (profile.account_status === 'terminated') {
    redirect('/auth/terminated')
  }

  return (
    <div className="min-h-screen bg-bg">
      <Sidebar user={profile} className="hidden md:block" />
      <AppHeader user={profile} />
      <main className="md:ml-[240px] pt-[56px] md:pt-[64px] pb-[80px] md:pb-0 min-h-screen">
        {children}
      </main>
      <BottomTabs className="md:hidden" />
      <PWAInstallPrompt />
    </div>
  )
}
