import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { getAllOperatorsForAdmin } from '@/lib/velorix/data'
import { OperatorList } from './OperatorList'

export default async function AdminOperatorsPage() {
  const operators = await getAllOperatorsForAdmin()

  return (
    <div className="px-4 md:px-8 py-6 md:py-10 max-w-6xl mx-auto">
      <Link
        href="/admin"
        className="inline-flex items-center gap-1.5 text-text-dim hover:text-text text-sm mb-6 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        Admin
      </Link>

      <div className="mb-8">
        <p className="text-sm text-text-dim font-mono">Admin · Operators</p>
        <h1 className="mt-1 text-3xl md:text-4xl font-display font-semibold text-text">
          All Operators
        </h1>
        <p className="mt-2 text-text-dim">
          {operators.length} profile{operators.length === 1 ? '' : 's'} across Velorix and Inner Circle.
        </p>
      </div>

      <OperatorList operators={operators} />
    </div>
  )
}
