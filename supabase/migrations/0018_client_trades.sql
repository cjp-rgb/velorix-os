-- Migration 0018 — Per-trade client trade records
--
-- Source: rebate_report.xlsx → "account rebate" sheet.
-- Each row is one trade by one client account on one instrument on one date.
--
-- Why this table exists (Phase 2.2.3 decision):
--   Daily aggregates (daily_rebate_snapshots) are sufficient for Phase 1's
--   earnings page, but per-trade granularity unlocks future features:
--   - per-instrument analytics ("which instruments generate most rebate")
--   - per-client trade history ("show me Mackai's biggest trades this month")
--   - retention analytics (Phase 3 / v3 — trading frequency, dropoff signals)
--
--   Aggregate-only would require keeping XLSX archives + re-ingesting later.
--   Same "all 4 reports non-negotiable" logic that drove migration 0016.
--
-- Scale estimate: ~15,800 rows/month for Carson's tree alone. At 5 Master
-- Operators each with similar volume, ~80k rows/month, ~1M rows/year.
-- Manageable for Postgres; partitioning becomes relevant at 10M+ rows.
--
-- Idempotency: PU Prime doesn't expose a stable trade_id. We use a composite
-- key of (account_id, trade_date, instrument, notional_value_usd, rebate_usd)
-- as a best-effort dedup. Re-uploading the same report should upsert cleanly.
-- Edge case: if two trades have identical date+instrument+notional+rebate
-- (unlikely but possible), they collapse to one row. Acceptable for v1.

CREATE TABLE client_trades (
  id BIGSERIAL PRIMARY KEY,

  -- Identity (composite UNIQUE for best-effort idempotency)
  account_id BIGINT NOT NULL,
  trade_date DATE NOT NULL,
  instrument TEXT NOT NULL,
  notional_value_usd DECIMAL(18, 4) NOT NULL,
  rebate_usd DECIMAL(12, 6) NOT NULL,

  -- Trade detail
  total_volume DECIMAL(14, 6),
  lots_type TEXT,

  -- Resolution
  user_id BIGINT,
  client_name TEXT,
  operator_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  campaign_source TEXT,

  -- Provenance
  source_upload_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (account_id, trade_date, instrument, notional_value_usd, rebate_usd)
);

CREATE INDEX idx_client_trades_operator_date
  ON client_trades (operator_id, trade_date DESC);

CREATE INDEX idx_client_trades_account_date
  ON client_trades (account_id, trade_date DESC);

CREATE INDEX idx_client_trades_instrument
  ON client_trades (instrument);

ALTER TABLE client_trades ENABLE ROW LEVEL SECURITY;

CREATE POLICY client_trades_select_own
  ON client_trades
  FOR SELECT
  USING (operator_id = auth.uid());

CREATE POLICY client_trades_select_downline
  ON client_trades
  FOR SELECT
  USING (operator_id IS NOT NULL AND is_in_my_downline(operator_id));

CREATE POLICY client_trades_select_admin
  ON client_trades
  FOR SELECT
  USING (is_admin());

CREATE POLICY client_trades_insert_admin
  ON client_trades
  FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY client_trades_update_admin
  ON client_trades
  FOR UPDATE
  USING (is_admin());

CREATE TRIGGER update_client_trades_updated_at
  BEFORE UPDATE ON client_trades
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
