import Link from 'next/link'
import { ChevronLeft, AlertCircle } from 'lucide-react'

export default function OperatorNotFound() {
  return (
    <div className="px-4 md:px-8 py-6 md:py-10 max-w-2xl mx-auto">
      <Link
        href="/admin/operators"
        className="inline-flex items-center gap-1.5 text-text-dim hover:text-text text-sm mb-6 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        All operators
      </Link>

      <div className="rounded-card bg-surface border border-border p-8 text-center">
        <AlertCircle className="w-10 h-10 text-text-muted mx-auto mb-3" />
        <p className="text-text-dim">Operator not found.</p>
        <p className="text-text-muted text-sm mt-1">
          The ID may be invalid or the operator may have been deleted.
        </p>
      </div>
    </div>
  )
}
