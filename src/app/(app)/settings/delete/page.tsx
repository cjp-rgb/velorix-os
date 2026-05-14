import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { getCurrentUserProfile } from '@/lib/velorix/data'
import { DeleteAccountForm } from './DeleteAccountForm'

export default async function DeleteAccountPage() {
  const profile = await getCurrentUserProfile()

  return (
    <div className="px-4 md:px-8 py-6 md:py-10 max-w-2xl mx-auto">
      <Link
        href="/settings"
        className="inline-flex items-center gap-1.5 text-text-dim hover:text-text text-sm mb-6 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        Settings
      </Link>

      <div className="mb-8">
        <p className="text-sm text-warning font-mono">Delete Account</p>
        <h1 className="mt-1 text-3xl md:text-4xl font-display font-semibold text-text">
          Close Your Velorix Account
        </h1>
        <p className="mt-2 text-text-dim">
          This is permanent. Read carefully before confirming.
        </p>
      </div>

      <DeleteAccountForm
        operatorEmail={profile.email}
        operatorName={profile.display_name || profile.full_name}
      />
    </div>
  )
}
