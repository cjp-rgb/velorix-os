'use client'

import dynamic from 'next/dynamic'

const NetDepositSphere = dynamic(
  () => import('@/components/NetDepositSphere').then((m) => m.NetDepositSphere),
  {
    ssr: false,
    loading: () => (
      <div className="aspect-square max-w-md mx-auto rounded-card bg-surface border border-border animate-pulse" />
    ),
  }
)

export { NetDepositSphere }
