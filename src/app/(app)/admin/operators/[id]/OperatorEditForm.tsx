'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import type { Profile } from '@/lib/velorix/data'
import { updateOperatorByAdmin } from '@/lib/velorix/data'

const operatorEditSchema = z.object({
  display_name: z.string().trim().max(60).optional().or(z.literal('')),
  velorix_tier: z.enum(['entry', 'growth', 'scale', '']),
  account_status: z.enum(['pending', 'active', 'terminated']),
  operator_class: z.enum(['inner_circle', 'velorix', 'migrating']),
  allocated_rebate: z.string().refine(
    (v) => v === '' || (Number.isFinite(Number(v)) && Number(v) >= 0),
    'Must be a non-negative number, or leave empty for none'
  ),
})

type OperatorEditValues = z.infer<typeof operatorEditSchema>

type OperatorEditFormProps = {
  operator: Profile
}

export function OperatorEditForm({ operator }: OperatorEditFormProps) {
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm<OperatorEditValues>({
    resolver: zodResolver(operatorEditSchema),
    defaultValues: {
      display_name: operator.display_name ?? '',
      velorix_tier: operator.velorix_tier ?? '',
      account_status: operator.account_status,
      operator_class:
        (operator.operator_class as 'inner_circle' | 'velorix' | 'migrating' | null) ?? 'velorix',
      allocated_rebate:
        operator.allocated_rebate !== null
          ? Number(operator.allocated_rebate).toString()
          : '',
    },
  })

  const onSubmit = async (values: OperatorEditValues) => {
    setIsSaving(true)
    try {
      const updated = await updateOperatorByAdmin({
        operator_id: operator.id,
        display_name: values.display_name === '' ? null : values.display_name,
        velorix_tier: values.velorix_tier === '' ? null : values.velorix_tier,
        account_status: values.account_status,
        operator_class: values.operator_class,
        allocated_rebate:
          values.allocated_rebate === '' ? null : Number(values.allocated_rebate),
      })
      reset({
        display_name: updated.display_name ?? '',
        velorix_tier: updated.velorix_tier ?? '',
        account_status: updated.account_status,
        operator_class:
          (updated.operator_class as 'inner_circle' | 'velorix' | 'migrating' | null) ?? 'velorix',
        allocated_rebate:
          updated.allocated_rebate !== null
            ? Number(updated.allocated_rebate).toString()
            : '',
      })
      toast.success('Operator updated')
      router.refresh()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update operator'
      toast.error(message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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
          className="w-full px-4 py-2.5 rounded-input bg-surface border border-border text-text placeholder:text-text-muted focus:outline-none focus:border-brand-blue transition-colors"
          autoComplete="off"
        />
        {errors.display_name && (
          <p className="text-warning text-xs mt-1.5">{errors.display_name.message}</p>
        )}
      </div>

      {/* Velorix tier */}
      <div>
        <label htmlFor="velorix_tier" className="block text-sm font-medium text-text mb-2">
          Velorix tier
        </label>
        <select
          id="velorix_tier"
          {...register('velorix_tier')}
          className="w-full px-4 py-2.5 rounded-input bg-surface border border-border text-text focus:outline-none focus:border-brand-blue transition-colors"
        >
          <option value="">No tier (not on Velorix tier system)</option>
          <option value="entry">Entry</option>
          <option value="growth">Growth</option>
          <option value="scale">Scale</option>
        </select>
      </div>

      {/* Account status */}
      <div>
        <label htmlFor="account_status" className="block text-sm font-medium text-text mb-2">
          Account status
        </label>
        <select
          id="account_status"
          {...register('account_status')}
          className="w-full px-4 py-2.5 rounded-input bg-surface border border-border text-text focus:outline-none focus:border-brand-blue transition-colors"
        >
          <option value="pending">Pending</option>
          <option value="active">Active</option>
          <option value="terminated">Terminated</option>
        </select>
      </div>

      {/* Operator class */}
      <div>
        <label htmlFor="operator_class" className="block text-sm font-medium text-text mb-2">
          Operator class
        </label>
        <select
          id="operator_class"
          {...register('operator_class')}
          className="w-full px-4 py-2.5 rounded-input bg-surface border border-border text-text focus:outline-none focus:border-brand-blue transition-colors"
        >
          <option value="velorix">Velorix</option>
          <option value="inner_circle">Inner Circle</option>
          <option value="migrating">Migrating (transitioning Inner Circle → Velorix)</option>
        </select>
      </div>

      {/* Allocated rebate */}
      <div>
        <label htmlFor="allocated_rebate" className="block text-sm font-medium text-text mb-2">
          Allocated rebate
          <span className="text-text-muted font-normal ml-2">($/lot)</span>
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">
            $
          </span>
          <input
            id="allocated_rebate"
            type="text"
            inputMode="decimal"
            {...register('allocated_rebate')}
            placeholder="e.g. 17 or 17.50"
            className="w-full pl-8 pr-4 py-2.5 rounded-input bg-surface border border-border text-text font-mono placeholder:text-text-muted focus:outline-none focus:border-brand-blue transition-colors"
            autoComplete="off"
          />
        </div>
        {errors.allocated_rebate && (
          <p className="text-warning text-xs mt-1.5">{errors.allocated_rebate.message}</p>
        )}
        <p className="text-text-muted text-xs mt-1.5">
          Validated against this operator&apos;s upline rate. Leave empty for none.
        </p>
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
