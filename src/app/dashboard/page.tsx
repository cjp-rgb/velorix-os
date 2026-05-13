import { Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { EmptyState } from '@/components/ui/EmptyState'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <header className="space-y-1">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-text">
          Welcome back
        </h1>
        <p className="text-sm text-text-dim">{user?.email}</p>
      </header>

      <EmptyState
        icon={<Sparkles className="h-5 w-5" />}
        title="Nothing here yet"
        description="Your dashboard will populate as you start building your network and inviting clients."
      />
    </div>
  )
}
