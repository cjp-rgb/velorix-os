'use client'

import { useState } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { AlertTriangle, X } from 'lucide-react'
import { deleteAccount } from '@/lib/auth/actions'

type DeleteAccountFormProps = {
  operatorEmail: string
  operatorName: string
}

type Stage = 'review' | 'confirm' | 'final'

export function DeleteAccountForm({
  operatorEmail,
  operatorName,
}: DeleteAccountFormProps) {
  const [stage, setStage] = useState<Stage>('review')
  const [confirmText, setConfirmText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  const proceedToConfirm = () => setStage('confirm')
  const proceedToFinal = () => setStage('final')
  const cancel = () => {
    setStage('review')
    setConfirmText('')
  }

  const handleFinalDelete = async () => {
    if (confirmText !== 'DELETE') {
      toast.error('Type DELETE exactly to confirm')
      return
    }

    setIsDeleting(true)
    try {
      await deleteAccount({ confirmation: confirmText })
      // deleteAccount redirects to /auth/terminated, so this rarely executes
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete account'
      toast.error(message)
      setIsDeleting(false)
    }
  }

  // Stage 1: Review what will happen
  if (stage === 'review') {
    return (
      <div className="space-y-6">
        {/* What stops working */}
        <div className="rounded-card bg-surface border border-border p-6">
          <h2 className="text-lg font-display font-semibold text-text mb-4">
            What stops working immediately
          </h2>
          <ul className="space-y-2 text-text-dim text-sm">
            <li className="flex items-start gap-2">
              <X className="w-4 h-4 text-warning mt-0.5 flex-shrink-0" />
              <span>Your Velorix dashboard and all in-app tools</span>
            </li>
            <li className="flex items-start gap-2">
              <X className="w-4 h-4 text-warning mt-0.5 flex-shrink-0" />
              <span>Your connected Telegram bot and all automations running through it</span>
            </li>
            <li className="flex items-start gap-2">
              <X className="w-4 h-4 text-warning mt-0.5 flex-shrink-0" />
              <span>CRM access, lead lists, captured prospects, sub-affiliate tree</span>
            </li>
            <li className="flex items-start gap-2">
              <X className="w-4 h-4 text-warning mt-0.5 flex-shrink-0" />
              <span>Performance analytics, tier history, override calculations</span>
            </li>
            <li className="flex items-start gap-2">
              <X className="w-4 h-4 text-warning mt-0.5 flex-shrink-0" />
              <span>All Velorix-generated content (captions, recommendations, templates)</span>
            </li>
          </ul>
        </div>

        {/* What you keep */}
        <div className="rounded-card bg-surface border border-border p-6">
          <h2 className="text-lg font-display font-semibold text-text mb-4">
            What you keep
          </h2>
          <ul className="space-y-2 text-text-dim text-sm">
            <li>
              <span className="text-text">Your personal identity data.</span> Your name, email, phone, and account profile will be exported and emailed to you. Hard-deleted from Velorix systems 30 days after termination.
            </li>
            <li>
              <span className="text-text">Your PU Prime affiliate account.</span> Your relationship with PU Prime is independent of Velorix and continues unaffected. Your client tree at PU Prime is untouched.
            </li>
            <li>
              <span className="text-text">Pre-Velorix relationships.</span> Anyone you knew or worked with before Velorix remains yours — those records were never in Velorix.
            </li>
          </ul>
        </div>

        {/* Data policy note */}
        <div className="rounded-card bg-warning/5 border border-warning/20 p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
            <div className="text-text-dim text-sm space-y-2">
              <p>
                Velorix is membership-gated infrastructure. CRM contents, captured leads, sub-affiliate relationships, and platform data are retained by Velorix per the Data &amp; Termination Policy.
              </p>
              <p>
                If you change your mind, you cannot rejoin to recover the data — re-applications start with a fresh account.
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between gap-3 pt-2">
          <Link
            href="/settings"
            className="text-text-dim hover:text-text transition-colors text-sm"
          >
            Cancel and go back
          </Link>
          <button
            type="button"
            onClick={proceedToConfirm}
            className="px-5 py-2.5 rounded-btn bg-warning/10 border border-warning/30 text-warning hover:bg-warning/20 transition-colors text-sm font-medium"
          >
            Continue to confirmation
          </button>
        </div>
      </div>
    )
  }

  // Stage 2: Acknowledge — "Are you sure?"
  if (stage === 'confirm') {
    return (
      <div className="space-y-6">
        <div className="rounded-card bg-surface border border-border p-6">
          <h2 className="text-lg font-display font-semibold text-text mb-3">
            Are you sure, {operatorName}?
          </h2>
          <p className="text-text-dim text-sm">
            You are about to permanently close your Velorix account ({operatorEmail}). The next step requires typing &quot;DELETE&quot; to confirm.
          </p>
          <p className="text-text-dim text-sm mt-3">
            This action is irreversible. You will be signed out of all devices immediately and unable to log back in.
          </p>
        </div>

        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={cancel}
            className="text-text-dim hover:text-text transition-colors text-sm"
          >
            Go back
          </button>
          <button
            type="button"
            onClick={proceedToFinal}
            className="px-5 py-2.5 rounded-btn bg-warning/10 border border-warning/30 text-warning hover:bg-warning/20 transition-colors text-sm font-medium"
          >
            I&apos;m sure — proceed
          </button>
        </div>
      </div>
    )
  }

  // Stage 3: Final — type DELETE to confirm
  return (
    <div className="space-y-6">
      <div className="rounded-card bg-surface border border-warning/30 p-6">
        <h2 className="text-lg font-display font-semibold text-warning mb-3">
          Final confirmation
        </h2>
        <p className="text-text-dim text-sm mb-5">
          Type <span className="font-mono text-text">DELETE</span> in the field below to permanently close your account. There is no undo after this step.
        </p>

        <input
          type="text"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          placeholder="Type DELETE to confirm"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck="false"
          className="w-full px-4 py-2.5 rounded-input bg-bg border border-border text-text font-mono placeholder:text-text-muted focus:outline-none focus:border-warning transition-colors"
          disabled={isDeleting}
        />
      </div>

      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={cancel}
          disabled={isDeleting}
          className="text-text-dim hover:text-text disabled:opacity-50 transition-colors text-sm"
        >
          Go back
        </button>
        <button
          type="button"
          onClick={handleFinalDelete}
          disabled={isDeleting || confirmText !== 'DELETE'}
          className="px-5 py-2.5 rounded-btn bg-warning text-bg font-medium hover:bg-warning/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
        >
          {isDeleting ? 'Deleting...' : 'Permanently delete account'}
        </button>
      </div>
    </div>
  )
}
