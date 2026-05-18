'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Search, ChevronRight } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import type { Profile } from '@/lib/velorix/data'
import { formatTier } from '@/lib/format'

type OperatorListProps = {
  operators: Profile[]
}

type OperatorClassFilter = 'all' | 'velorix' | 'inner_circle' | 'migrating'
type RoleFilter = 'all' | 'admin' | 'master' | 'sub_affiliate'

const OPERATOR_CLASS_LABELS: Record<OperatorClassFilter, string> = {
  all: 'All',
  velorix: 'Velorix',
  inner_circle: 'Inner Circle',
  migrating: 'Migrating',
}

const ROLE_LABELS: Record<RoleFilter, string> = {
  all: 'All roles',
  admin: 'Admin',
  master: 'Master',
  sub_affiliate: 'Sub-affiliate',
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 0) return '?'
  if (parts.length === 1) {
    const first = parts[0]
    return first && first.length > 0 ? first.charAt(0).toUpperCase() : '?'
  }
  const firstInitial = parts[0]?.charAt(0) ?? ''
  const lastInitial = parts[parts.length - 1]?.charAt(0) ?? ''
  return (firstInitial + lastInitial).toUpperCase() || '?'
}

export function OperatorList({ operators }: OperatorListProps) {
  const [classFilter, setClassFilter] = useState<OperatorClassFilter>('all')
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all')
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return operators.filter((op) => {
      // operator_class filter
      if (classFilter !== 'all') {
        const opClass = op.operator_class ?? 'velorix'  // default to velorix per migration 0012
        if (opClass !== classFilter) return false
      }
      // role filter
      if (roleFilter !== 'all' && op.role !== roleFilter) return false
      // search filter
      if (q.length > 0) {
        const name = (op.display_name || op.full_name || '').toLowerCase()
        const email = (op.email || '').toLowerCase()
        if (!name.includes(q) && !email.includes(q)) return false
      }
      return true
    })
  }, [operators, classFilter, roleFilter, search])

  return (
    <div>
      {/* Filters */}
      <div className="mb-6 space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name or email..."
            className="w-full pl-10 pr-4 py-2.5 rounded-input bg-surface border border-border text-text placeholder:text-text-muted focus:outline-none focus:border-brand-blue transition-colors"
          />
        </div>

        {/* Class + Role pills */}
        <div className="flex flex-wrap gap-2">
          <span className="text-xs uppercase tracking-wider text-text-muted font-medium self-center mr-1">
            Class:
          </span>
          {(['all', 'velorix', 'inner_circle', 'migrating'] as OperatorClassFilter[]).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setClassFilter(c)}
              className={`px-3 py-1 rounded-btn text-xs font-medium transition-colors ${
                classFilter === c
                  ? 'bg-brand-blue text-white'
                  : 'bg-surface border border-border text-text-dim hover:text-text'
              }`}
            >
              {OPERATOR_CLASS_LABELS[c]}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="text-xs uppercase tracking-wider text-text-muted font-medium self-center mr-1">
            Role:
          </span>
          {(['all', 'admin', 'master', 'sub_affiliate'] as RoleFilter[]).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-1 rounded-btn text-xs font-medium transition-colors ${
                roleFilter === r
                  ? 'bg-brand-blue text-white'
                  : 'bg-surface border border-border text-text-dim hover:text-text'
              }`}
            >
              {ROLE_LABELS[r]}
            </button>
          ))}
        </div>
      </div>

      {/* Result count */}
      <p className="text-sm text-text-dim mb-3">
        {filtered.length} of {operators.length} shown
      </p>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="rounded-card bg-surface border border-border p-8 text-center">
          <p className="text-text-dim">No operators match the current filters.</p>
        </div>
      ) : (
        <div className="rounded-card bg-surface border border-border overflow-hidden">
          {filtered.map((op, i) => {
            const isLast = i === filtered.length - 1
            const isTerminated = op.account_status === 'terminated'
            const displayName = op.display_name || op.full_name || 'Unnamed'
            const opClass = op.operator_class ?? 'velorix'

            return (
              <Link
                key={op.id}
                href={`/admin/operators/${op.id}`}
                className={`flex items-center gap-4 p-4 md:p-5 transition-colors hover:bg-surface-2 ${
                  !isLast ? 'border-b border-border' : ''
                } ${isTerminated ? 'opacity-60' : ''}`}
              >
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-surface-2 flex items-center justify-center flex-shrink-0">
                  <span className="text-text font-medium text-sm">
                    {getInitials(displayName)}
                  </span>
                </div>

                {/* Name + email */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p
                      className={`font-medium text-text truncate ${
                        isTerminated ? 'line-through' : ''
                      }`}
                    >
                      {displayName}
                    </p>
                    {op.role === 'admin' && (
                      <span className="text-xs px-2 py-0.5 rounded-btn bg-warning/10 text-warning font-medium">
                        Admin
                      </span>
                    )}
                  </div>
                  <p className="text-text-dim text-xs font-mono mt-0.5 truncate">
                    {op.email}
                  </p>
                </div>

                {/* Badges — hidden on mobile, visible md+ */}
                <div className="hidden md:flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs px-2 py-1 rounded-btn bg-surface-2 text-text-dim font-mono">
                    {opClass.replace('_', ' ')}
                  </span>
                  {op.velorix_tier && (
                    <Badge variant={op.velorix_tier}>
                      {formatTier(op.velorix_tier)}
                    </Badge>
                  )}
                  {op.allocated_rebate !== null && (
                    <span className="text-xs px-2 py-1 rounded-btn bg-surface-2 text-text font-mono">
                      ${Number(op.allocated_rebate).toFixed(0)}/lot
                    </span>
                  )}
                </div>

                <ChevronRight className="w-5 h-5 text-text-muted flex-shrink-0" />
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
