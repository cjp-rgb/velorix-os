'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [show, setShow] = useState(false)

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      // Show prompt after 30 seconds of activity
      setTimeout(() => setShow(true), 30000)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setShow(false)
    }
    setDeferredPrompt(null)
  }

  if (!show || !deferredPrompt) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md rounded-card border border-border bg-surface p-4 shadow-2xl">
      <button onClick={() => setShow(false)} className="absolute right-2 top-2 text-text-muted hover:text-text">
        <X className="h-4 w-4" />
      </button>
      <p className="text-sm font-semibold">Install Velorix</p>
      <p className="mt-1 text-xs text-text-dim">
        Add Velorix to your home screen for faster access and a native experience.
      </p>
      <button
        onClick={handleInstall}
        className="mt-3 w-full rounded-btn bg-brand-blue px-3 py-2 text-sm font-medium text-white hover:bg-brand-blue-bright"
      >
        Install
      </button>
    </div>
  )
}
