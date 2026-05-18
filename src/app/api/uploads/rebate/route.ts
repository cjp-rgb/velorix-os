import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database.types'

// Increase body size limit for this route — default is 1MB, rebate reports can be 5.8MB+
export const maxDuration = 60  // seconds — parsing 15k rows can take 10-15s

type ParsedTradeRow = {
  account_id: number
  trade_date: string  // ISO date string
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

/**
 * Safely coerces a value to a finite number. Returns null on failure.
 */
function safeNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null
  const num = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(num) ? num : null
}

/**
 * Coerces a PU Prime date value into ISO date string (YYYY-MM-DD).
 * Handles: native Date objects (Excel converts dates), string formats like
 * '2026-04-22' or '22/04/2026'. Returns null if unparseable.
 */
function safeDate(value: unknown): string | null {
  if (value === null || value === undefined || value === '') return null
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10)
  }
  if (typeof value === 'string') {
    const trimmed = value.trim()
    // Try ISO format first
    if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
      const parsed = new Date(trimmed)
      return Number.isFinite(parsed.getTime()) ? parsed.toISOString().slice(0, 10) : null
    }
    // Try DD/MM/YYYY format (common PU Prime format)
    const dmy = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
    if (dmy) {
      return `${dmy[3]}-${dmy[2]}-${dmy[1]}`
    }
  }
  return null
}

/**
 * Parses the rebate XLSX 'account rebate' sheet into trade rows.
 * Rejects only rows where we can't safely insert (missing critical fields).
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
    throw new Error("Could not access 'account rebate' sheet contents")
  }
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: null,
    raw: false,  // string-format consistently so date parsing is predictable
  })

  const parsed: ParsedTradeRow[] = []
  const rejections: RejectionReason[] = []

  rows.forEach((row, index) => {
    // Row index is 0-based after header; user sees 1-based + 1 for header = +2
    const rowNumber = index + 2

    const accountId = safeNumber(row['Account'])
    const tradeDate = safeDate(row['Date'])
    const instrument =
      typeof row['Instrument'] === 'string' ? row['Instrument'].trim() : null
    const notionalValue = safeNumber(row['Notional ValueUSD'])
    const rebate = safeNumber(row['Rebate(USD)'])

    // Reject if any critical field is missing/unparseable
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
 * Resolves account_id → operator_id by looking up the most recent
 * client_snapshots row for each account.
 *
 * On first upload (before any ib_accounts has been uploaded), all
 * lookups return null. That's fine — rows are inserted with
 * operator_id=NULL and can be reconciled later.
 */
async function resolveOperatorIds(
  supabase: ReturnType<typeof createClient> extends Promise<infer T> ? T : never,
  accountIds: number[]
): Promise<Map<number, string>> {
  const map = new Map<number, string>()
  if (accountIds.length === 0) return map

  // Get the most recent operator_id for each account from client_snapshots
  // Note: this may miss accounts if client_snapshots is empty (first upload)
  const { data, error } = await supabase
    .from('client_snapshots')
    .select('account_id, operator_id, snapshot_date')
    .in('account_id', accountIds)
    .not('operator_id', 'is', null)
    .order('snapshot_date', { ascending: false })

  if (error || !data) return map

  // First occurrence per account_id wins (most recent snapshot due to order)
  for (const row of data) {
    if (!map.has(row.account_id) && row.operator_id) {
      map.set(row.account_id, row.operator_id)
    }
  }

  return map
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()

  // Admin gate
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

  // Extract file
  const formData = await req.formData()
  const file = formData.get('file')

  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: 'No file provided in form data' },
      { status: 400 }
    )
  }

  // Create data_uploads row in 'processing' state
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
    // Parse the XLSX
    const buffer = await file.arrayBuffer()
    const { parsed_rows, rejections, total_rows_in_sheet } = parseRebateXlsx(buffer)

    // Resolve operators for all unique accounts
    const uniqueAccounts = Array.from(new Set(parsed_rows.map((r) => r.account_id)))
    const operatorMap = await resolveOperatorIds(supabase, uniqueAccounts)

    // Build client_trades insert payload
    const tradeInserts = parsed_rows.map((row) => ({
      account_id: row.account_id,
      trade_date: row.trade_date,
      instrument: row.instrument,
      notional_value_usd: row.notional_value_usd,
      rebate_usd: row.rebate_usd,
      total_volume: row.total_volume,
      lots_type: row.lots_type,
      user_id: row.user_id,
      client_name: row.client_name,
      campaign_source: row.campaign_source,
      operator_id: operatorMap.get(row.account_id) ?? null,
      source_upload_id: uploadId,
    }))

    // Upsert client_trades in batches (Supabase has a 1000-row limit per upsert)
    const BATCH_SIZE = 500
    let tradesImported = 0
    for (let i = 0; i < tradeInserts.length; i += BATCH_SIZE) {
      const batch = tradeInserts.slice(i, i + BATCH_SIZE)
      const { error: batchError } = await supabase.from('client_trades').upsert(batch, {
        onConflict: 'account_id,trade_date,instrument,notional_value_usd,rebate_usd',
      })
      if (batchError) {
        throw new Error(`Failed to upsert client_trades batch: ${batchError.message}`)
      }
      tradesImported += batch.length
    }

    // Aggregate to daily totals per operator (in-memory)
    // Key: `${operator_id}|${trade_date}` — operator_id can be null for unresolved accounts
    const dailyAgg = new Map<
      string,
      { operator_id: string | null; date: string; rebate: number; notional: number }
    >()

    for (const row of parsed_rows) {
      const opId = operatorMap.get(row.account_id) ?? null
      const key = `${opId ?? 'null'}|${row.trade_date}`
      const existing = dailyAgg.get(key)
      if (existing) {
        existing.rebate += row.rebate_usd
        existing.notional += row.notional_value_usd
      } else {
        dailyAgg.set(key, {
          operator_id: opId,
          date: row.trade_date,
          rebate: row.rebate_usd,
          notional: row.notional_value_usd,
        })
      }
    }

    // Upsert daily_rebate_snapshots — but ONLY for resolved operators
    // (the table has operator_id NOT NULL via FK, so unresolved rows are
    // dropped here. They're still preserved in client_trades.)
    const dailyInserts = Array.from(dailyAgg.values())
      .filter((agg) => agg.operator_id !== null)
      .map((agg) => ({
        operator_id: agg.operator_id!,
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

    // Update data_uploads row to completed
    const result = {
      rows_parsed: total_rows_in_sheet,
      rows_imported: tradesImported,
      rows_rejected: rejections.length,
      rejection_reasons: rejections.slice(0, 100),  // cap at 100 to keep response small
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

    return NextResponse.json({
      ...result,
      message: `Imported ${tradesImported.toLocaleString()} trades and ${snapshotsImported} daily snapshot${snapshotsImported === 1 ? '' : 's'}. ${
        dailyAgg.size - snapshotsImported > 0
          ? `${dailyAgg.size - snapshotsImported} day(s) had unresolved operator — upload ib_accounts first for full resolution.`
          : ''
      }`,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown parsing error'
    console.error('Rebate parser error:', err)

    // Mark upload as failed
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
