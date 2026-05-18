import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { getRecentUploadsForType } from '@/lib/velorix/data'
import { UploadShell } from '@/components/admin/UploadShell'

export default async function IbReportUploadPage() {
  const recentUploads = await getRecentUploadsForType('ib_report', 10)

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
        <p className="text-sm text-text-dim font-mono">Admin · Uploads · IB Report</p>
        <h1 className="mt-1 text-3xl md:text-4xl font-display font-semibold text-text">
          IB Report
        </h1>
        <p className="mt-2 text-text-dim">
          Two sheets: fund_report (daily deposits/withdrawals per account)
          populates client_deposits; opened_accounts populates
          account_creation_events.
        </p>
      </div>

      <UploadShell
        reportType="ib_report"
        title="IB Report"
        description="Daily deposits + new accounts"
        sampleFilename="ib_report_2026-04-01_2026-04-30..."
        expectedColumns={[
          'Date', 'User ID', 'Account', 'Deposits', 'Withdraw', 'Net Deposits',
        ]}
        recentUploads={recentUploads}
      />
    </div>
  )
}
