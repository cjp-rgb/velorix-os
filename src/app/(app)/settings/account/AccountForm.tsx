'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { updateProfile } from '@/lib/velorix/data'

const accountSchema = z.object({
  full_name: z.string().trim().min(1, 'Full name is required').max(120),
  display_name: z.string().trim().max(60).optional().or(z.literal('')),
  phone: z.string().trim().max(40).optional().or(z.literal('')),
  country: z.string().trim().max(80).optional().or(z.literal('')),
  timezone: z.string().trim().max(80).optional().or(z.literal('')),
})

type AccountFormValues = z.infer<typeof accountSchema>

type AccountFormProps = {
  initialProfile: {
    full_name: string
    display_name: string | null
    email: string
    phone: string | null
    country: string | null
    timezone: string | null
  }
}

// Common timezone options. Add more as needed.
const TIMEZONE_OPTIONS = [
  'Europe/London',
  'Europe/Dublin',
  'Europe/Paris',
  'Europe/Madrid',
  'Europe/Berlin',
  'Asia/Dubai',
  'Asia/Singapore',
  'Asia/Tokyo',
  'America/New_York',
  'America/Chicago',
  'America/Los_Angeles',
  'Australia/Sydney',
] as const

// Common country options. Not exhaustive — operators can type free-text.
const COUNTRY_OPTIONS = [
  'United Kingdom',
  'Ireland',
  'United States',
  'United Arab Emirates',
  'Australia',
  'Canada',
  'Germany',
  'France',
  'Spain',
  'Singapore',
  'Other',
] as const

export function AccountForm({ initialProfile }: AccountFormProps) {
  const [isSaving, setIsSaving] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm<AccountFormValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      full_name: initialProfile.full_name,
      display_name: initialProfile.display_name ?? '',
      phone: initialProfile.phone ?? '',
      country: initialProfile.country ?? '',
      timezone: initialProfile.timezone ?? '',
    },
  })

  const onSubmit = async (values: AccountFormValues) => {
    setIsSaving(true)
    try {
      const updated = await updateProfile({
        full_name: values.full_name,
        display_name: values.display_name === '' ? null : values.display_name,
        phone: values.phone === '' ? null : values.phone,
        country: values.country === '' ? null : values.country,
        timezone: values.timezone === '' ? null : values.timezone,
      })
      reset({
        full_name: updated.full_name,
        display_name: updated.display_name ?? '',
        phone: updated.phone ?? '',
        country: updated.country ?? '',
        timezone: updated.timezone ?? '',
      })
      toast.success('Account updated')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update account'
      toast.error(message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-6"
    >
      {/* Full name */}
      <div>
        <label htmlFor="full_name" className="block text-sm font-medium text-text mb-2">
          Full name
        </label>
        <input
          id="full_name"
          type="text"
          {...register('full_name')}
          className="w-full px-4 py-2.5 rounded-input bg-surface border border-border text-text focus:outline-none focus:border-brand-blue transition-colors"
          autoComplete="name"
        />
        {errors.full_name && (
          <p className="text-warning text-xs mt-1.5">{errors.full_name.message}</p>
        )}
      </div>

      {/* Display name */}
      <div>
        <label htmlFor="display_name" className="block text-sm font-medium text-text mb-2">
          Display name
          <span className="text-text-muted font-normal ml-2">(optional)</span>
        </label>
        <input
          id="display_name"
          type="text"
          {...register('display_name')}
          placeholder="Shown across Velorix instead of full name"
          className="w-full px-4 py-2.5 rounded-input bg-surface border border-border text-text placeholder:text-text-muted focus:outline-none focus:border-brand-blue transition-colors"
          autoComplete="nickname"
        />
        {errors.display_name && (
          <p className="text-warning text-xs mt-1.5">{errors.display_name.message}</p>
        )}
      </div>

      {/* Email (read-only) */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-text mb-2">
          Email
          <span className="text-text-muted font-normal ml-2">(contact Carson to change)</span>
        </label>
        <input
          id="email"
          type="email"
          value={initialProfile.email}
          disabled
          className="w-full px-4 py-2.5 rounded-input bg-surface-2 border border-border text-text-dim cursor-not-allowed"
        />
      </div>

      {/* Phone */}
      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-text mb-2">
          Phone
          <span className="text-text-muted font-normal ml-2">(optional)</span>
        </label>
        <input
          id="phone"
          type="tel"
          {...register('phone')}
          placeholder="+44 7359 287626"
          className="w-full px-4 py-2.5 rounded-input bg-surface border border-border text-text placeholder:text-text-muted focus:outline-none focus:border-brand-blue transition-colors"
          autoComplete="tel"
        />
        {errors.phone && (
          <p className="text-warning text-xs mt-1.5">{errors.phone.message}</p>
        )}
      </div>

      {/* Country */}
      <div>
        <label htmlFor="country" className="block text-sm font-medium text-text mb-2">
          Country
        </label>
        <select
          id="country"
          {...register('country')}
          className="w-full px-4 py-2.5 rounded-input bg-surface border border-border text-text focus:outline-none focus:border-brand-blue transition-colors"
        >
          <option value="">Select country...</option>
          {COUNTRY_OPTIONS.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        {errors.country && (
          <p className="text-warning text-xs mt-1.5">{errors.country.message}</p>
        )}
      </div>

      {/* Timezone */}
      <div>
        <label htmlFor="timezone" className="block text-sm font-medium text-text mb-2">
          Timezone
        </label>
        <select
          id="timezone"
          {...register('timezone')}
          className="w-full px-4 py-2.5 rounded-input bg-surface border border-border text-text focus:outline-none focus:border-brand-blue transition-colors"
        >
          <option value="">Select timezone...</option>
          {TIMEZONE_OPTIONS.map((tz) => (
            <option key={tz} value={tz}>{tz}</option>
          ))}
        </select>
        {errors.timezone && (
          <p className="text-warning text-xs mt-1.5">{errors.timezone.message}</p>
        )}
      </div>

      {/* Submit */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="submit"
          disabled={isSaving || !isDirty}
          className="px-5 py-2.5 rounded-btn bg-brand-blue text-white font-medium hover:bg-brand-blue-bright disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSaving ? 'Saving...' : 'Save changes'}
        </button>
      </div>
    </form>
  )
}
