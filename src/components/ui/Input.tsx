import * as React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'prefix'> {
  label?: string
  error?: string
  helperText?: string
  prefix?: React.ReactNode
  suffix?: React.ReactNode
  containerClassName?: string
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      prefix,
      suffix,
      required,
      id,
      className,
      containerClassName,
      disabled,
      'aria-describedby': ariaDescribedBy,
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId()
    const inputId = id ?? generatedId
    const errorId = error ? `${inputId}-error` : undefined
    const helperId = helperText && !error ? `${inputId}-helper` : undefined
    const describedBy = errorId ?? helperId ?? ariaDescribedBy

    return (
      <div className={cn('flex flex-col gap-1.5', containerClassName)}>
        {label && (
          <label htmlFor={inputId} className="text-xs font-medium text-text-dim">
            {label}
            {required && (
              <span className="ml-1 text-error" aria-hidden="true">
                *
              </span>
            )}
          </label>
        )}

        <div
          className={cn(
            'flex h-10 items-center gap-2 rounded-btn border-[0.5px] bg-surface px-3',
            'border-border transition-colors duration-150',
            'focus-within:border-brand-blue-bright',
            error && 'border-error focus-within:border-error',
            disabled && 'cursor-not-allowed opacity-50'
          )}
        >
          {prefix && (
            <span className="flex shrink-0 items-center text-text-dim">{prefix}</span>
          )}
          <input
            ref={ref}
            id={inputId}
            required={required}
            disabled={disabled}
            aria-invalid={!!error || undefined}
            aria-describedby={describedBy}
            className={cn(
              'min-w-0 flex-1 bg-transparent text-sm text-text placeholder:text-text-muted',
              'outline-none disabled:cursor-not-allowed',
              className
            )}
            {...props}
          />
          {suffix && (
            <span className="flex shrink-0 items-center text-text-dim">{suffix}</span>
          )}
        </div>

        {error ? (
          <p id={errorId} className="text-2xs text-error">
            {error}
          </p>
        ) : helperText ? (
          <p id={helperId} className="text-2xs text-text-muted">
            {helperText}
          </p>
        ) : null}
      </div>
    )
  }
)
Input.displayName = 'Input'
