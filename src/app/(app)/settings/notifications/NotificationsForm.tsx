'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'
import { updateNotificationPreferences } from '@/lib/velorix/data'

// Canonical notification categories. Adding a new category later
// means adding a row here — the rest is automatic.
const NOTIFICATION_CATEGORIES = [
  {
    key: 'tier_promotion',
    label: 'Tier Promotion',
    description: 'When you reach a new tier (Entry → Growth → Scale)',
  },
  {
    key: 'downline_activity',
    label: 'Downline Activity',
    description: 'When sub-affiliates hit milestones, deposit, or promote',
  },
  {
    key: 'monthly_summary',
    label: 'Monthly Summary',
    description: 'End-of-month performance recap and earnings breakdown',
  },
  {
    key: 'system_updates',
    label: 'System Updates',
    description: 'Velorix product announcements and scheduled maintenance',
  },
  {
    key: 'education_releases',
    label: 'Education Releases',
    description: 'When new education modules and content publish',
  },
] as const

type ChannelPrefs = {
  email: boolean
  push: boolean
  in_app: boolean
}

type PrefsMap = Record<string, ChannelPrefs>

// Sensible defaults if no preferences saved yet:
// - In-app: ON for all categories
// - Email: ON for the more important categories (tier, monthly, system)
// - Push: OFF by default (less intrusive default)
function getDefaultPrefs(): PrefsMap {
  return {
    tier_promotion: { email: true, push: false, in_app: true },
    downline_activity: { email: false, push: false, in_app: true },
    monthly_summary: { email: true, push: false, in_app: true },
    system_updates: { email: true, push: false, in_app: true },
    education_releases: { email: false, push: false, in_app: true },
  }
}

// Merge initial preferences with defaults — ensures all categories
// have a value even if the stored JSONB is partial or empty.
function mergeWithDefaults(initial: PrefsMap): PrefsMap {
  const defaults = getDefaultPrefs()
  const merged: PrefsMap = { ...defaults }
  for (const key of Object.keys(initial)) {
    if (initial[key]) {
      merged[key] = initial[key]
    }
  }
  return merged
}

type ToggleProps = {
  checked: boolean
  onChange: () => void
  label: string
}

function Toggle({ checked, onChange, label }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand-blue focus:ring-offset-2 focus:ring-offset-bg ${
        checked ? 'bg-brand-blue' : 'bg-surface-2 border border-border'
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${
          checked ? 'translate-x-5' : 'translate-x-0.5'
        } mt-0.5`}
      />
    </button>
  )
}

export function NotificationsForm({ initialPreferences }: { initialPreferences: PrefsMap }) {
  const [prefs, setPrefs] = useState<PrefsMap>(() => mergeWithDefaults(initialPreferences))
  const [isSaving, setIsSaving] = useState(false)
  const [isDirty, setIsDirty] = useState(false)

  const togglePref = (categoryKey: string, channel: keyof ChannelPrefs) => {
    setPrefs((current) => {
      const existing = current[categoryKey] ?? { email: false, push: false, in_app: false }
      return {
        ...current,
        [categoryKey]: {
          ...existing,
          [channel]: !existing[channel],
        },
      }
    })
    setIsDirty(true)
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await updateNotificationPreferences(prefs)
      setIsDirty(false)
      toast.success('Notification preferences saved')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save preferences'
      toast.error(message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div>
      <div className="rounded-card bg-surface border border-border overflow-hidden">
        {/* Column headers */}
        <div className="hidden md:grid grid-cols-[1fr_64px_64px_64px] gap-4 px-5 py-3 bg-surface-2 border-b border-border">
          <div className="text-xs uppercase tracking-wider text-text-muted font-medium">
            Category
          </div>
          <div className="text-xs uppercase tracking-wider text-text-muted font-medium text-center">
            In-app
          </div>
          <div className="text-xs uppercase tracking-wider text-text-muted font-medium text-center">
            Email
          </div>
          <div className="text-xs uppercase tracking-wider text-text-muted font-medium text-center">
            Push
          </div>
        </div>

        {/* Category rows */}
        {NOTIFICATION_CATEGORIES.map((category, i) => {
          const categoryPrefs = prefs[category.key] ?? {
            email: false,
            push: false,
            in_app: false,
          }
          const isLast = i === NOTIFICATION_CATEGORIES.length - 1

          return (
            <div
              key={category.key}
              className={`px-5 py-4 ${!isLast ? 'border-b border-border' : ''}`}
            >
              {/* Desktop: grid layout */}
              <div className="hidden md:grid grid-cols-[1fr_64px_64px_64px] gap-4 items-center">
                <div>
                  <p className="text-text font-medium">{category.label}</p>
                  <p className="text-text-dim text-sm mt-0.5">{category.description}</p>
                </div>
                <div className="flex justify-center">
                  <Toggle
                    checked={categoryPrefs.in_app}
                    onChange={() => togglePref(category.key, 'in_app')}
                    label={`${category.label} in-app notifications`}
                  />
                </div>
                <div className="flex justify-center">
                  <Toggle
                    checked={categoryPrefs.email}
                    onChange={() => togglePref(category.key, 'email')}
                    label={`${category.label} email notifications`}
                  />
                </div>
                <div className="flex justify-center">
                  <Toggle
                    checked={categoryPrefs.push}
                    onChange={() => togglePref(category.key, 'push')}
                    label={`${category.label} push notifications`}
                  />
                </div>
              </div>

              {/* Mobile: stacked layout */}
              <div className="md:hidden">
                <p className="text-text font-medium">{category.label}</p>
                <p className="text-text-dim text-sm mt-0.5 mb-3">{category.description}</p>
                <div className="grid grid-cols-3 gap-3">
                  <div className="flex flex-col items-center gap-2">
                    <p className="text-xs uppercase tracking-wider text-text-muted">In-app</p>
                    <Toggle
                      checked={categoryPrefs.in_app}
                      onChange={() => togglePref(category.key, 'in_app')}
                      label={`${category.label} in-app notifications`}
                    />
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <p className="text-xs uppercase tracking-wider text-text-muted">Email</p>
                    <Toggle
                      checked={categoryPrefs.email}
                      onChange={() => togglePref(category.key, 'email')}
                      label={`${category.label} email notifications`}
                    />
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <p className="text-xs uppercase tracking-wider text-text-muted">Push</p>
                    <Toggle
                      checked={categoryPrefs.push}
                      onChange={() => togglePref(category.key, 'push')}
                      label={`${category.label} push notifications`}
                    />
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Save button */}
      <div className="flex items-center justify-end mt-6">
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving || !isDirty}
          className="px-5 py-2.5 rounded-btn bg-brand-blue text-white font-medium hover:bg-brand-blue-bright disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSaving ? 'Saving...' : 'Save preferences'}
        </button>
      </div>
    </div>
  )
}
