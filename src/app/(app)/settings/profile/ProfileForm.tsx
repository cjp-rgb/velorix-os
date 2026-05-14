'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { updateProfile } from '@/lib/velorix/data'

const profileSchema = z.object({
  instagram_handle: z
    .string()
    .trim()
    .max(60)
    .regex(/^[a-zA-Z0-9._]*$/, 'Only letters, numbers, periods, and underscores allowed')
    .optional()
    .or(z.literal('')),
  telegram_handle: z
    .string()
    .trim()
    .max(60)
    .regex(/^[a-zA-Z0-9_]*$/, 'Only letters, numbers, and underscores allowed')
    .optional()
    .or(z.literal('')),
})

type ProfileFormValues = z.infer<typeof profileSchema>

type ProfileFormProps = {
  initialProfile: {
    instagram_handle: string | null
    telegram_handle: string | null
  }
}

// Strip @ prefix if user types it — we store the handle without it
function normaliseHandle(value: string): string {
  return value.trim().replace(/^@/, '')
}

export function ProfileForm({ initialProfile }: ProfileFormProps) {
  const [isSaving, setIsSaving] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      instagram_handle: initialProfile.instagram_handle ?? '',
      telegram_handle: initialProfile.telegram_handle ?? '',
    },
  })

  const onSubmit = async (values: ProfileFormValues) => {
    setIsSaving(true)
    try {
      const instagram = values.instagram_handle ? normaliseHandle(values.instagram_handle) : ''
      const telegram = values.telegram_handle ? normaliseHandle(values.telegram_handle) : ''

      const updated = await updateProfile({
        instagram_handle: instagram === '' ? null : instagram,
        telegram_handle: telegram === '' ? null : telegram,
      })
      reset({
        instagram_handle: updated.instagram_handle ?? '',
        telegram_handle: updated.telegram_handle ?? '',
      })
      toast.success('Profile updated')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update profile'
      toast.error(message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Instagram */}
      <div>
        <label htmlFor="instagram_handle" className="block text-sm font-medium text-text mb-2">
          Instagram
          <span className="text-text-muted font-normal ml-2">(optional)</span>
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">
            @
          </span>
          <input
            id="instagram_handle"
            type="text"
            {...register('instagram_handle')}
            placeholder="your_handle"
            className="w-full pl-9 pr-4 py-2.5 rounded-input bg-surface border border-border text-text placeholder:text-text-muted focus:outline-none focus:border-brand-blue transition-colors"
            autoComplete="off"
            autoCapitalize="none"
            spellCheck="false"
          />
        </div>
        {errors.instagram_handle && (
          <p className="text-warning text-xs mt-1.5">{errors.instagram_handle.message}</p>
        )}
      </div>

      {/* Telegram */}
      <div>
        <label htmlFor="telegram_handle" className="block text-sm font-medium text-text mb-2">
          Telegram
          <span className="text-text-muted font-normal ml-2">(optional)</span>
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">
            @
          </span>
          <input
            id="telegram_handle"
            type="text"
            {...register('telegram_handle')}
            placeholder="your_handle"
            className="w-full pl-9 pr-4 py-2.5 rounded-input bg-surface border border-border text-text placeholder:text-text-muted focus:outline-none focus:border-brand-blue transition-colors"
            autoComplete="off"
            autoCapitalize="none"
            spellCheck="false"
          />
        </div>
        {errors.telegram_handle && (
          <p className="text-warning text-xs mt-1.5">{errors.telegram_handle.message}</p>
        )}
      </div>

      <div className="flex items-center justify-end pt-2">
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
