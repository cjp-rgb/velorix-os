import Link from 'next/link'
import {
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  Network,
  Users,
  FileText,
} from 'lucide-react'

const UPLOAD_TYPES = [
  {
    href: '/admin/uploads/rebate',
    icon: FileSpreadsheet,
    label: 'Rebate Report',
    description: 'Daily rebate totals + per-trade granularity. Populates earnings page.',
  },
  {
    href: '/admin/uploads/sub-ib',
    icon: Network,
    label: 'Sub IB Report',
    description: 'Per-affiliate monthly snapshot. Builds the downline tree structure.',
  },
  {
    href: '/admin/uploads/ib-accounts',
    icon: Users,
    label: 'IB Accounts',
    description: 'Per-client account state. Populates clients page and snapshots.',
  },
  {
    href: '/admin/uploads/ib-report',
    icon: FileText,
    label: 'IB Report',
    description: 'Daily deposits, withdrawals, and new account events.',
  },
] as const

export default function AdminUploadsPage() {
  return (
    <div className="px-4 md:px-8 py-6 md:py-10 max-w-3xl mx-auto">
      <Link
        href="/admin"
        className="inline-flex items-center gap-1.5 text-text-dim hover:text-text text-sm mb-6 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        Admin
      </Link>

      <div className="mb-8">
        <p className="text-sm text-text-dim font-mono">Admin · Data Uploads</p>
        <h1 className="mt-1 text-3xl md:text-4xl font-display font-semibold text-text">
          PU Prime Reports
        </h1>
        <p className="mt-2 text-text-dim">
          Upload the four daily XLSX reports from PU Prime to populate Velorix.
          Each report type has its own ingest page below.
        </p>
      </div>

      <div className="rounded-card bg-surface border border-border overflow-hidden">
        {UPLOAD_TYPES.map((type, i) => {
          const Icon = type.icon
          const isLast = i === UPLOAD_TYPES.length - 1
          return (
            <Link
              key={type.href}
              href={type.href}
              className={`flex items-center gap-4 p-5 transition-colors hover:bg-surface-2 ${
                !isLast ? 'border-b border-border' : ''
              }`}
            >
              <div className="w-10 h-10 rounded-lg bg-surface-2 flex items-center justify-center flex-shrink-0">
                <Icon className="w-5 h-5 text-text-dim" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-text font-medium">{type.label}</p>
                <p className="text-text-dim text-sm mt-0.5">{type.description}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-text-muted flex-shrink-0" />
            </Link>
          )
        })}
      </div>
    </div>
  )
}
