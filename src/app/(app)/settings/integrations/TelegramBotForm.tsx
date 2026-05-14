'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { CheckCircle, AlertCircle, Bot } from 'lucide-react'
import { connectTelegramBot, disconnectTelegramBot } from '@/lib/velorix/data'

const botSchema = z.object({
  token: z
    .string()
    .trim()
    .min(1, 'Bot token is required')
    .regex(
      /^\d+:[A-Za-z0-9_-]{30,}$/,
      'Invalid format. Token should look like: 123456789:ABC-DEF...'
    ),
})

type BotFormValues = z.infer<typeof botSchema>

type Connection = {
  is_enabled: boolean
  bot_username: string | null
  bot_first_name: string | null
  connected_at: string | null
}

type TelegramBotFormProps = {
  initialConnection: Connection | null
}

export function TelegramBotForm({ initialConnection }: TelegramBotFormProps) {
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)
  const [isDisconnecting, setIsDisconnecting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<BotFormValues>({
    resolver: zodResolver(botSchema),
    defaultValues: { token: '' },
  })

  const isConnected = initialConnection?.is_enabled === true && initialConnection.bot_username

  const onSubmit = async (values: BotFormValues) => {
    setIsSaving(true)
    try {
      const result = await connectTelegramBot(values.token)
      reset({ token: '' })
      toast.success(`Connected to @${result.bot_username}`)
      router.refresh()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to connect bot'
      toast.error(message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDisconnect = async () => {
    const confirmed = window.confirm(
      'Disconnect your Telegram bot? Automations using this bot will stop until you reconnect.'
    )
    if (!confirmed) return

    setIsDisconnecting(true)
    try {
      await disconnectTelegramBot()
      toast.success('Bot disconnected')
      router.refresh()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to disconnect'
      toast.error(message)
      setIsDisconnecting(false)
    }
  }

  if (isConnected) {
    return (
      <div className="rounded-card bg-surface border border-border p-5">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-success-bright/10 flex items-center justify-center flex-shrink-0">
            <CheckCircle className="w-5 h-5 text-success-bright" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-text font-medium">
              @{initialConnection?.bot_username}
            </p>
            {initialConnection?.bot_first_name && (
              <p className="text-text-dim text-sm mt-0.5">
                {initialConnection.bot_first_name}
              </p>
            )}
            <p className="text-text-muted text-xs font-mono mt-2">
              Connected · ready for automations
            </p>
          </div>
          <button
            type="button"
            onClick={handleDisconnect}
            disabled={isDisconnecting}
            className="px-3 py-1.5 rounded-btn bg-surface-2 border border-border text-text-dim hover:text-text hover:border-border-bright disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm flex-shrink-0"
          >
            {isDisconnecting ? 'Disconnecting...' : 'Disconnect'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="rounded-card bg-surface border border-border p-5">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-surface-2 flex items-center justify-center flex-shrink-0">
            <Bot className="w-5 h-5 text-text-dim" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-text font-medium">No bot connected</p>
            <p className="text-text-dim text-sm mt-0.5">
              Paste your bot token below to connect.
            </p>
          </div>
        </div>

        <div>
          <label htmlFor="token" className="block text-sm font-medium text-text mb-2">
            Bot token
          </label>
          <input
            id="token"
            type="text"
            {...register('token')}
            placeholder="123456789:ABC-DEF1234ghIkl..."
            autoComplete="off"
            autoCapitalize="none"
            spellCheck="false"
            className="w-full px-4 py-2.5 rounded-input bg-bg border border-border text-text font-mono text-sm placeholder:text-text-muted focus:outline-none focus:border-brand-blue transition-colors"
          />
          {errors.token && (
            <p className="text-warning text-xs mt-1.5 flex items-start gap-1">
              <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
              <span>{errors.token.message}</span>
            </p>
          )}
          <p className="text-text-muted text-xs mt-2">
            Velorix verifies the token with Telegram before saving.
          </p>
        </div>

        <div className="flex items-center justify-end mt-5">
          <button
            type="submit"
            disabled={isSaving}
            className="px-5 py-2.5 rounded-btn bg-brand-blue text-white font-medium hover:bg-brand-blue-bright disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSaving ? 'Connecting...' : 'Connect bot'}
          </button>
        </div>
      </div>
    </form>
  )
}
