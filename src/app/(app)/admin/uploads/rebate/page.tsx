import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { getRecentUploadsForType } from '@/lib/velorix/data'
import { UploadShell } from '@/components/admin/UploadShell'

export default async function RebateUploadPage() {
  const recentUploads = await getRecentUploadsForType('rebate_report', 10)

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
        <p className="text-sm text-text-dim font-mono">Admin · Uploads · Rebate Report</p>
        <h1 className="mt-1 text-3xl md:text-4xl font-display font-semibold text-text">
          Rebate Report
        </h1>
        <p className="mt-2 text-text-dim">
          Daily rebate totals per operator, plus per-trade granularity in the
          &apos;account rebate&apos; sheet. Populates daily_rebate_snapshots.
        </p>
      </div>

      <UploadShell
        reportType="rebate_report"
        title="Rebate Report"
        description="Daily rebate totals"
        sampleFilename="rebate_report_2026-04-01_2026-04-30_..."
        expectedColumns={['Day', 'Notional Value', 'Total Rebate']}
        recentUploads={recentUploads}
      />
    </div>
  )
}
