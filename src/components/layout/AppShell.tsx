import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/Sidebar'
import { AppHeader } from '@/components/layout/AppHeader'
import { BottomTabs } from '@/components/layout/BottomTabs'
import { PWAInstallPrompt } from '@/components/PWAInstallPrompt'

type ProfileShape = {
  id: string
  full_name: string
  display_name: string | null
  email: string
  role: 'admin' | 'master' | 'sub_affiliate'
  velorix_tier: 'entry' | 'growth' | 'scale' | null
  profile_photo_url: string | null
}

export async function AppShell({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, display_name, email, role, velorix_tier, profile_photo_url')
    .eq('id', user.id)
    .single()

  if (error || !data) {
    redirect('/auth/login')
  }

  const profile = data as ProfileShape

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
