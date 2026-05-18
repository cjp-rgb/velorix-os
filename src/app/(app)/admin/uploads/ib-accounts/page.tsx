import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { getRecentUploadsForType } from '@/lib/velorix/data'
import { UploadShell } from '@/components/admin/UploadShell'

export default async function IbAccountsUploadPage() {
  const recentUploads = await getRecentUploadsForType('ib_accounts_report', 10)

  return (
    <div className="px-4 md:px-8 py-6 md:py-10 max-w-6xl mx-auto">
      <Link
        href="/admin/uploads"
        className="inline-flex items-center gap-1.5 text-text-dim hover:text-text text-sm mb-6 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        All upload types
      </Link>

      <div className="mb-8">
        <p className="text-sm text-text-dim font-mono">Admin · Uploads · IB Accounts</p>
        <h1 className="mt-1 text-3xl md:text-4xl font-display font-semibold text-text">
          IB Accounts
        </h1>
        <p className="mt-2 text-text-dim">
          Per-client account state. Populates client_snapshots historically.
          Owner-to-operator matching via Sub_IB_Report bridge.
        </p>
      </div>

      <UploadShell
        reportType="ib_accounts_report"
        title="IB Accounts"
        description="Per-client account state"
        sampleFilename="ib_accounts_2026-05-14_..."
        expectedColumns={[
          'Date', 'User ID', 'Account', 'Name', 'Account owner',
          'Account Type', 'Balance', 'Account Journey', 'Last Trade Date',
        ]}
        recentUploads={recentUploads}
      />
    </div>
  )
}
