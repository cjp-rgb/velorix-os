export default function PlaceholderPage() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center max-w-md px-6">
        <p className="text-text-dim text-sm font-mono">v0.1</p>
        <h1 className="mt-2 text-2xl font-display font-semibold text-text">
          Security
        </h1>
        <p className="mt-3 text-text-dim">
          Password, active sessions, 2FA
        </p>
        <p className="mt-6 text-xs text-text-muted">
          Building in Phase 1.
        </p>
      </div>
    </div>
  )
}
