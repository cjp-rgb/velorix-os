import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database.types'

// Parsing 15k rows can take 10-15s; default 10s isn't enough.
export const maxDuration = 60

type ParsedTradeRow = {
  account_id: number
  trade_date: string
  instrument: string
  notional_value_usd: number
  rebate_usd: number
  total_volume: number | null
  lots_type: string | null
  user_id: number | null
  client_name: string | null
  campaign_source: string | null
}

type RejectionReason = {
  row: number
  reason: string
}

type ParseResult = {
  parsed_rows: ParsedTradeRow[]
  rejections: RejectionReason[]
  total_rows_in_sheet: number
}

type AggregatedDailyVolume = {
  account_id: number
  trade_date: string
  instrument: string
  total_volume: number
  total_notional_usd: number
  total_rebate_usd: number
  trade_count: number
  user_id: number | null
  client_name: string | null
  lots_type: string | null
  campaign_source: string | null
}

function safeNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null
  const num = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(num) ? num : null
}

function safeDate(value: unknown): string | null {
  if (value === null || value === undefined || value === '') return null
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10)
  }
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
      const parsed = new Date(trimmed)
      return Number.isFinite(parsed.getTime()) ? parsed.toISOString().slice(0, 10) : null
    }
    const dmy = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
    if (dmy) {
      return `${dmy[3]}-${dmy[2]}-${dmy[1]}`
    }
  }
  return null
}

/**
 * Parse the 'account rebate' sheet into typed rows. Rejects rows that can't
 * be safely inserted (missing date, account_id, instrument, notional, rebate).
 */
function parseRebateXlsx(buffer: ArrayBuffer): ParseResult {
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true })

  if (!workbook.SheetNames.includes('account rebate')) {
    throw new Error(
      `Missing 'account rebate' sheet. Available: ${workbook.SheetNames.join(', ')}`
    )
  }

  const sheet = workbook.Sheets['account rebate']
  if (!sheet) {
    throw new Error("'account rebate' sheet is empty or unreadable")
  }

  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: null,
    raw: false,
  })

  const parsed: ParsedTradeRow[] = []
  const rejections: RejectionReason[] = []

  rows.forEach((row, index) => {
    const rowNumber = index + 2

    const accountId = safeNumber(row['Account'])
    const tradeDate = safeDate(row['Date'])
    const instrument =
      typeof row['Instrument'] === 'string' ? row['Instrument'].trim() : null
    const notionalValue = safeNumber(row['Notional ValueUSD'])
    const rebate = safeNumber(row['Rebate(USD)'])

    if (accountId === null) {
      rejections.push({ row: rowNumber, reason: 'Missing or invalid Account ID' })
      return
    }
    if (tradeDate === null) {
      rejections.push({ row: rowNumber, reason: `Invalid date: ${row['Date']}` })
      return
    }
    if (!instrument) {
      rejections.push({ row: rowNumber, reason: 'Missing instrument' })
      return
    }
    if (notionalValue === null) {
      rejections.push({
        row: rowNumber,
        reason: `Invalid notional value: ${row['Notional ValueUSD']}`,
      })
      return
    }
    if (rebate === null) {
      rejections.push({
        row: rowNumber,
        reason: `Invalid rebate: ${row['Rebate(USD)']}`,
      })
      return
    }

    parsed.push({
      account_id: accountId,
      trade_date: tradeDate,
      instrument,
      notional_value_usd: notionalValue,
      rebate_usd: rebate,
      total_volume: safeNumber(row['Total Volume']),
      lots_type:
        typeof row['Lots Type'] === 'string' ? row['Lots Type'].trim() : null,
      user_id: safeNumber(row['User ID']),
      client_name:
        typeof row['Name'] === 'string' ? row['Name'].trim() : null,
      campaign_source:
        typeof row['Campaign source'] === 'string'
          ? row['Campaign source'].trim()
          : null,
    })
  })

  return {
    parsed_rows: parsed,
    rejections,
    total_rows_in_sheet: rows.length,
  }
}

/**
 * Aggregate parsed trade rows by (account_id, trade_date, instrument).
 * Each row in the aggregate represents that account's total activity on
 * that instrument that day, summing volume/notional/rebate across trades.
 */
function aggregateToDaily(rows: ParsedTradeRow[]): AggregatedDailyVolume[] {
  const map = new Map<string, AggregatedDailyVolume>()

  for (const row of rows) {
    const key = `${row.account_id}|${row.trade_date}|${row.instrument}`
    const existing = map.get(key)
    if (existing) {
      existing.total_volume += row.total_volume ?? 0
      existing.total_notional_usd += row.notional_value_usd
      existing.total_rebate_usd += row.rebate_usd
      existing.trade_count += 1
    } else {
      map.set(key, {
        account_id: row.account_id,
        trade_date: row.trade_date,
        instrument: row.instrument,
        total_volume: row.total_volume ?? 0,
        total_notional_usd: row.notional_value_usd,
        total_rebate_usd: row.rebate_usd,
        trade_count: 1,
        user_id: row.user_id,
        client_name: row.client_name,
        lots_type: row.lots_type,
        campaign_source: row.campaign_source,
      })
    }
  }

  return Array.from(map.values())
}

/**
 * Resolve account_id → operator_id by looking up most recent
 * client_snapshots row per account. Returns empty map if client_snapshots
 * is empty (first upload scenario).
 */
async function resolveOperatorIds(
  supabase: Awaited<ReturnType<typeof createClient>>,
  accountIds: number[]
): Promise<Map<number, string>> {
  const map = new Map<number, string>()
  if (accountIds.length === 0) return map

  const { data, error } = await supabase
    .from('client_snapshots')
    .select('account_id, operator_id, snapshot_date')
    .in('account_id', accountIds)
    .not('operator_id', 'is', null)
    .order('snapshot_date', { ascending: false })

  if (error || !data) return map

  for (const row of data) {
    if (!map.has(row.account_id) && row.operator_id) {
      map.set(row.account_id, row.operator_id)
    }
  }

  return map
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const formData = await req.formData()
  const file = formData.get('file')

  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: 'No file provided in form data' },
      { status: 400 }
    )
  }

  const { data: uploadRow, error: uploadError } = await supabase
    .from('data_uploads')
    .insert({
      uploaded_by: user.id,
      report_type: 'rebate_report',
      processing_status: 'processing',
      original_filename: file.name,
      rows_parsed: 0,
      rows_imported: 0,
      rows_rejected: 0,
    })
    .select('id')
    .single()

  if (uploadError || !uploadRow) {
    console.error('Failed to create data_uploads row:', uploadError)
    return NextResponse.json(
      { error: 'Failed to track upload' },
      { status: 500 }
    )
  }

  const uploadId = uploadRow.id

  try {
    const buffer = await file.arrayBuffer()
    const { parsed_rows, rejections, total_rows_in_sheet } = parseRebateXlsx(buffer)

    // Aggregate to (account, date, instrument) granularity
    const aggregated = aggregateToDaily(parsed_rows)

    // Resolve operators for unique accounts (one batch query)
    const uniqueAccounts = Array.from(new Set(aggregated.map((r) => r.account_id)))
    const operatorMap = await resolveOperatorIds(supabase, uniqueAccounts)

    // Build client_daily_volume insert payload
    const volumeInserts = aggregated.map((row) => ({
      account_id: row.account_id,
      trade_date: row.trade_date,
      instrument: row.instrument,
      total_volume: row.total_volume,
      total_notional_usd: row.total_notional_usd,
      total_rebate_usd: row.total_rebate_usd,
      trade_count: row.trade_count,
      user_id: row.user_id,
      client_name: row.client_name,
      lots_type: row.lots_type,
      campaign_source: row.campaign_source,
      operator_id: operatorMap.get(row.account_id) ?? null,
      source_upload_id: uploadId,
    }))

    // Upsert in batches of 500
    const BATCH_SIZE = 500
    let volumeImported = 0
    for (let i = 0; i < volumeInserts.length; i += BATCH_SIZE) {
      const batch = volumeInserts.slice(i, i + BATCH_SIZE)
      const { error: batchError } = await supabase
        .from('client_daily_volume')
        .upsert(batch, {
          onConflict: 'account_id,trade_date,instrument',
        })
      if (batchError) {
        throw new Error(
          `Failed to upsert client_daily_volume batch: ${batchError.message}`
        )
      }
      volumeImported += batch.length
    }

    // Aggregate further: (operator, date) for daily_rebate_snapshots
    // Only rows with resolved operator make it through (FK constraint).
    const dailyOperatorAgg = new Map<
      string,
      { operator_id: string; date: string; rebate: number; notional: number }
    >()

    for (const row of aggregated) {
      const opId = operatorMap.get(row.account_id)
      if (!opId) continue
      const key = `${opId}|${row.trade_date}`
      const existing = dailyOperatorAgg.get(key)
      if (existing) {
        existing.rebate += row.total_rebate_usd
        existing.notional += row.total_notional_usd
      } else {
        dailyOperatorAgg.set(key, {
          operator_id: opId,
          date: row.trade_date,
          rebate: row.total_rebate_usd,
          notional: row.total_notional_usd,
        })
      }
    }

    const dailyInserts = Array.from(dailyOperatorAgg.values()).map((agg) => ({
      operator_id: agg.operator_id,
      date: agg.date,
      total_rebate_usd: agg.rebate,
      notional_value_usd: agg.notional,
      source_upload_id: uploadId,
    }))

    let snapshotsImported = 0
    if (dailyInserts.length > 0) {
      const { error: dailyError } = await supabase
        .from('daily_rebate_snapshots')
        .upsert(dailyInserts, { onConflict: 'operator_id,date' })
      if (dailyError) {
        throw new Error(`Failed to upsert daily snapshots: ${dailyError.message}`)
      }
      snapshotsImported = dailyInserts.length
    }

    // Count days where operator couldn't be resolved
    const unresolvedDays = new Set<string>()
    for (const row of aggregated) {
      if (!operatorMap.get(row.account_id)) {
        unresolvedDays.add(row.trade_date)
      }
    }

    const result = {
      rows_parsed: total_rows_in_sheet,
      rows_imported: volumeImported,
      rows_rejected: rejections.length,
      rejection_reasons: rejections.slice(0, 100),
    }

    await supabase
      .from('data_uploads')
      .update({
        processing_status: 'completed',
        rows_parsed: result.rows_parsed,
        rows_imported: result.rows_imported,
        rows_rejected: result.rows_rejected,
        rejection_reasons: result.rejection_reasons as unknown as Database['public']['Tables']['data_uploads']['Update']['rejection_reasons'],
        processed_at: new Date().toISOString(),
      })
      .eq('id', uploadId)

    const messageParts = [
      `Aggregated ${total_rows_in_sheet.toLocaleString()} trades into ${volumeImported.toLocaleString()} (account, date, instrument) rows.`,
      `${snapshotsImported} daily operator snapshot${snapshotsImported === 1 ? '' : 's'} populated.`,
    ]
    if (unresolvedDays.size > 0) {
      messageParts.push(
        `${unresolvedDays.size} day(s) had unresolved operator — upload ib_accounts first for full resolution.`
      )
    }

    return NextResponse.json({
      ...result,
      message: messageParts.join(' '),
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown parsing error'
    console.error('Rebate parser error:', err)

    await supabase
      .from('data_uploads')
      .update({
        processing_status: 'failed',
        processing_error: message,
        processed_at: new Date().toISOString(),
      })
      .eq('id', uploadId)

    return NextResponse.json(
      { error: message, rows_parsed: 0, rows_imported: 0, rows_rejected: 0 },
      { status: 500 }
    )
  }
}
