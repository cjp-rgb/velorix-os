import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import type { Profile } from '@/lib/velorix/data'
import { OperatorEditForm } from './OperatorEditForm'

async function getOperatorById(id: string): Promise<Profile | null> {
  // UUID format check before hitting DB — saves a round trip on garbage URLs
  const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidPattern.test(id)) {
    return null
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) {
    console.error('getOperatorById error:', error)
    return null
  }

  return (data as Profile | null) ?? null
}

export default async function AdminOperatorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const operator = await getOperatorById(id)

  if (!operator) {
    notFound()
  }

  const displayName = operator.display_name || operator.full_name || 'Unnamed'
  const initials = displayName
    .trim()
    .split(/\s+/)
    .map((p) => p.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('')

  return (
    <div className="px-4 md:px-8 py-6 md:py-10 max-w-3xl mx-auto">
      <Link
        href="/admin/operators"
        className="inline-flex items-center gap-1.5 text-text-dim hover:text-text text-sm mb-6 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        All operators
      </Link>

      {/* Identity header */}
      <div className="rounded-card bg-surface border border-border p-5 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-surface-2 flex items-center justify-center flex-shrink-0">
            <span className="text-text font-display font-semibold text-lg">
              {initials}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-display font-semibold text-text truncate">
                {displayName}
              </h1>
              {operator.role === 'admin' && (
                <span className="text-xs px-2 py-0.5 rounded-btn bg-warning/10 text-warning font-medium">
                  Admin
                </span>
              )}
              {operator.account_status === 'terminated' && (
                <span className="text-xs px-2 py-0.5 rounded-btn bg-warning/10 text-warning font-medium">
                  Terminated
                </span>
              )}
            </div>
            <p className="text-text-dim text-sm font-mono mt-1 break-all">
              {operator.email}
            </p>
          </div>
        </div>
      </div>

      {/* Editable form */}
      <section className="mb-8">
        <div className="mb-4">
          <h2 className="text-lg font-display font-semibold text-text">Edit profile</h2>
          <p className="text-sm text-text-dim mt-1">
            Changes are immediate. Allocated rebate is validated against this operator&apos;s upline.
          </p>
        </div>
        <OperatorEditForm operator={operator} />
      </section>

      {/* Read-only context */}
      <section>
        <div className="mb-4">
          <h2 className="text-lg font-display font-semibold text-text">Context</h2>
          <p className="text-sm text-text-dim mt-1">
            Read-only fields. Managed elsewhere or set during onboarding.
          </p>
        </div>
        <div className="rounded-card bg-surface border border-border divide-y divide-border">
          <ReadOnlyRow label="Role" value={operator.role} hint="Change via direct SQL only" />
          <ReadOnlyRow
            label="PU Prime Affiliate ID"
            value={operator.pu_prime_aff_id ?? '—'}
            hint="Set during onboarding"
          />
          <ReadOnlyRow
            label="Full name"
            value={operator.full_name ?? '—'}
            hint="Operator edits their own"
          />
          <ReadOnlyRow
            label="Country"
            value={operator.country ?? '—'}
          />
          <ReadOnlyRow
            label="Timezone"
            value={operator.timezone ?? '—'}
          />
          <ReadOnlyRow
            label="Created"
            value={
              operator.created_at
                ? new Date(operator.created_at).toLocaleString('en-GB')
                : '—'
            }
          />
          <ReadOnlyRow
            label="Onboarding completed"
            value={
              operator.onboarding_completed_at
                ? new Date(operator.onboarding_completed_at).toLocaleString('en-GB')
                : 'Not yet'
            }
          />
        </div>
      </section>
    </div>
  )
}

function ReadOnlyRow({
  label,
  value,
  hint,
}: {
  label: string
  value: string
  hint?: string
}) {
  return (
    <div className="px-5 py-3 flex items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-wider text-text-muted font-medium">
          {label}
        </p>
        {hint && (
          <p className="text-text-muted text-xs mt-0.5">{hint}</p>
        )}
      </div>
      <p className="text-text font-mono text-sm text-right break-all">
        {value}
      </p>
    </div>
  )
}
