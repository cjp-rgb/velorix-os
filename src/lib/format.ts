/**
 * Formats a number as USD currency.
 *
 * formatUSD(1234.56) → "$1,234.56"
 * formatUSD(1234.56, { showCents: false }) → "$1,235"
 * formatUSD(50000, { compact: true }) → "$50.0k"
 * formatUSD(1_234_567, { compact: true }) → "$1.2M"
 * formatUSD(0) → "$0.00"
 */
export function formatUSD(
  amount: number,
  options: { showCents?: boolean; compact?: boolean } = {}
): string {
  const { showCents = true, compact = false } = options

  if (compact && Math.abs(amount) >= 1000) {
    if (Math.abs(amount) >= 1_000_000) {
      return `$${(amount / 1_000_000).toFixed(1)}M`
    }
    return `$${(amount / 1_000).toFixed(1)}k`
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: showCents ? 2 : 0,
    maximumFractionDigits: showCents ? 2 : 0,
  }).format(amount)
}

/**
 * Formats a lot count to 2 decimal places.
 *
 * formatLots(123.4567) → "123.46"
 * formatLots(0.05) → "0.05"
 */
export function formatLots(lots: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(lots)
}

/**
 * Formats a rebate as "$XX.XX/lot".
 */
export function formatRebate(rebate: number): string {
  return `$${rebate.toFixed(2)}/lot`
}

/**
 * Formats a tier name with proper capitalisation.
 *
 * formatTier('entry') → "Entry"
 * formatTier(null) → "—"
 */
export function formatTier(tier: 'entry' | 'growth' | 'scale' | null): string {
  if (!tier) return '—'
  return tier.charAt(0).toUpperCase() + tier.slice(1)
}

/**
 * Formats a 0-1 value as a percentage.
 *
 * formatPercent(0.5) → "50.0%"
 * formatPercent(0.5, 0) → "50%"
 */
export function formatPercent(value: number, decimals: number = 1): string {
  return `${(value * 100).toFixed(decimals)}%`
}

/**
 * Formats a number as a thousand-separated integer.
 *
 * formatInt(1234) → "1,234"
 * formatInt(1234567) → "1,234,567"
 */
export function formatInt(value: number): string {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
  }).format(value)
}
