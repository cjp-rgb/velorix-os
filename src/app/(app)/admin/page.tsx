import Link from 'next/link'
import {
  ChevronRight,
  Users,
  Upload,
  FileText,
  ShieldAlert,
} from 'lucide-react'

const ADMIN_LINKS = [
  {
    href: '/admin/operators',
    icon: Users,
    label: 'Operators',
    description: 'View, edit, and manage all operator profiles',
    available: true,
  },
  {
    href: '/admin/uploads',
    icon: Upload,
    label: 'Data Uploads',
    description: 'Upload PU Prime XLSX reports to populate the platform',
    available: false,
    availabilityNote: 'Building in Phase 2.2',
  },
  {
    href: '/admin/audit',
    icon: FileText,
    label: 'Audit Log',
    description: 'Sensitive operations history',
    available: false,
    availabilityNote: 'Building in v1.1 security hardening',
  },
] as const

export default function AdminLandingPage() {
  return (
    <div className="px-4 md:px-8 py-6 md:py-10 max-w-3xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <ShieldAlert className="w-4 h-4 text-brand-cyan" />
          <p className="text-sm text-text-dim font-mono">Admin</p>
        </div>
        <h1 className="mt-1 text-3xl md:text-4xl font-display font-semibold text-text">
          Control Panel
        </h1>
        <p className="mt-2 text-text-dim">
          Carson-only tools for managing operators, data, and platform state.
        </p>
      </div>

      <div className="rounded-card bg-surface border border-border overflow-hidden">
        {ADMIN_LINKS.map((link, i) => {
          const Icon = link.icon
          const isLast = i === ADMIN_LINKS.length - 1

          const rowClasses = `flex items-center gap-4 p-5 transition-colors ${
            !isLast ? 'border-b border-border' : ''
          } ${
            link.available
              ? 'hover:bg-surface-2 cursor-pointer'
              : 'opacity-60 cursor-not-allowed'
          }`

          const content = (
            <>
              <div className="w-10 h-10 rounded-lg bg-surface-2 flex items-center justify-center flex-shrink-0">
                <Icon className="w-5 h-5 text-text-dim" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-text">{link.label}</p>
                <p className="text-text-dim text-sm mt-0.5">
                  {link.description}
                </p>
                {!link.available && link.availabilityNote && (
                  <p className="text-text-muted text-xs mt-1 font-mono">
                    {link.availabilityNote}
                  </p>
                )}
              </div>
              {link.available && (
                <ChevronRight className="w-5 h-5 text-text-muted flex-shrink-0" />
              )}
            </>
          )

          if (link.available) {
            return (
              <Link key={link.href} href={link.href} className={rowClasses}>
                {content}
              </Link>
            )
          }

          return (
            <div key={link.href} className={rowClasses}>
              {content}
            </div>
          )
        })}
      </div>
    </div>
  )
}
