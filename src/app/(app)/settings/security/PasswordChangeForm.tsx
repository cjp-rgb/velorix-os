'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { changePassword } from '@/lib/auth/actions'

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(12, 'New password must be at least 12 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'New passwords do not match',
    path: ['confirmPassword'],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'New password must be different from current password',
    path: ['newPassword'],
  })

type PasswordFormValues = z.infer<typeof passwordSchema>

export function PasswordChangeForm() {
  const [isSaving, setIsSaving] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  })

  const onSubmit = async (values: PasswordFormValues) => {
    setIsSaving(true)
    try {
      await changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      })
      reset()
      toast.success('Password updated')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update password'
      toast.error(message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div>
        <label htmlFor="currentPassword" className="block text-sm font-medium text-text mb-2">
          Current password
        </label>
        <input
          id="currentPassword"
          type="password"
          {...register('currentPassword')}
          className="w-full px-4 py-2.5 rounded-input bg-surface border border-border text-text focus:outline-none focus:border-brand-blue transition-colors"
          autoComplete="current-password"
        />
        {errors.currentPassword && (
          <p className="text-warning text-xs mt-1.5">{errors.currentPassword.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="newPassword" className="block text-sm font-medium text-text mb-2">
          New password
        </label>
        <input
          id="newPassword"
          type="password"
          {...register('newPassword')}
          className="w-full px-4 py-2.5 rounded-input bg-surface border border-border text-text focus:outline-none focus:border-brand-blue transition-colors"
          autoComplete="new-password"
        />
        {errors.newPassword && (
          <p className="text-warning text-xs mt-1.5">{errors.newPassword.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-text mb-2">
          Confirm new password
        </label>
        <input
          id="confirmPassword"
          type="password"
          {...register('confirmPassword')}
          className="w-full px-4 py-2.5 rounded-input bg-surface border border-border text-text focus:outline-none focus:border-brand-blue transition-colors"
          autoComplete="new-password"
        />
        {errors.confirmPassword && (
          <p className="text-warning text-xs mt-1.5">{errors.confirmPassword.message}</p>
        )}
      </div>

      <div className="flex items-center justify-end pt-2">
        <button
          type="submit"
          disabled={isSaving}
          className="px-5 py-2.5 rounded-btn bg-brand-blue text-white font-medium hover:bg-brand-blue-bright disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSaving ? 'Updating...' : 'Update password'}
        </button>
      </div>
    </form>
  )
}
