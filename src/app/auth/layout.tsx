import type { ReactNode } from 'react'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-dvh items-center justify-center px-6 py-12">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(0,102,255,0.08),_transparent_60%)]"
      />
      <div className="relative w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="font-display text-2xl font-semibold tracking-tight text-text">
            Velorix
          </h1>
          <p className="mt-1 text-xs text-text-dim">
            The operating network built for IBs who actually run a business.
          </p>
        </div>
        {children}
      </div>
    </div>
  )
}
