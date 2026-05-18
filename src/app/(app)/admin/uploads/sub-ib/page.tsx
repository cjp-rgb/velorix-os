import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { getRecentUploadsForType } from '@/lib/velorix/data'
import { UploadShell } from '@/components/admin/UploadShell'

export default async function SubIbUploadPage() {
  const recentUploads = await getRecentUploadsForType('sub_ib_report', 10)

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
        <p className="text-sm text-text-dim font-mono">Admin · Uploads · Sub IB Report</p>
        <h1 className="mt-1 text-3xl md:text-4xl font-display font-semibold text-text">
          Sub IB Report
        </h1>
        <p className="mt-2 text-text-dim">
          Per-affiliate monthly snapshot from PU Prime. Builds tree_relationships
          via Upper Affid mappings and populates monthly_performance.
        </p>
      </div>

      <UploadShell
        reportType="sub_ib_report"
        title="Sub IB Report"
        description="Per-affiliate monthly snapshot"
        sampleFilename="Sub_IB_Report_2026-04-01_2026-04-30..."
        expectedColumns={[
          'Aff ID', 'User ID', 'Name', 'Country', 'Email', 'Upper Affid',
          'Join Date', 'Net Deposit (USD)', 'Volume (Lots)',
        ]}
        recentUploads={recentUploads}
      />
    </div>
  )
}
