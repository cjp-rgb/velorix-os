-- Migration 0019 — Replace client_trades with client_daily_volume
--
-- Background: Migration 0018 created client_trades for per-individual-trade
-- storage. Real-data testing with April rebate_report revealed that PU Prime
-- legitimately reports duplicate scalp trades (same account, date, instrument,
-- notional, rebate) without providing a stable trade_id to disambiguate.
-- This caused ON CONFLICT DO UPDATE conflicts within batch upserts.
--
-- Pivot: aggregate to (account, date, instrument) granularity. This:
--   - Eliminates duplicate-key collisions (one row per account-day-instrument)
--   - Preserves all analytics Velorix actually needs (per-instrument revenue,
--     volume trends, top contributors, MoM growth)
--   - Stops Velorix from duplicating PU Prime's per-trade storage
--   - Reduces storage ~5-10x (15k trade rows → ~1-3k aggregate rows per month)
--
-- Trade-off accepted: cannot show individual trade detail in Velorix. Operators
-- needing per-trade resolution use their PU Prime dashboard directly.
--
-- Safe to drop and recreate: client_trades has zero rows in production
-- (confirmed in pre-flight before first parser test).

DROP TABLE IF EXISTS client_trades CASCADE;

CREATE TABLE client_daily_volume (
  id BIGSERIAL PRIMARY KEY,

  -- Identity (composite UNIQUE for idempotent upsert)
  account_id BIGINT NOT NULL,
  trade_date DATE NOT NULL,
  instrument TEXT NOT NULL,

  -- Aggregated metrics
  total_volume DECIMAL(14, 6),      -- sum of "Total Volume" (lots) across trades
  total_notional_usd DECIMAL(18, 4),-- sum of "Notional ValueUSD" across trades
  total_rebate_usd DECIMAL(12, 6),  -- sum of "Rebate(USD)" across trades
  trade_count INTEGER NOT NULL DEFAULT 1,  -- number of trades aggregated into this row

  -- Resolution
  user_id BIGINT,
  client_name TEXT,
  operator_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  campaign_source TEXT,
  lots_type TEXT,                   -- denormalised — assumed consistent within a day

  -- Provenance
  source_upload_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (account_id, trade_date, instrument)
);

CREATE INDEX idx_client_daily_volume_operator_date
  ON client_daily_volume (operator_id, trade_date DESC);

CREATE INDEX idx_client_daily_volume_account_date
  ON client_daily_volume (account_id, trade_date DESC);

CREATE INDEX idx_client_daily_volume_instrument
  ON client_daily_volume (instrument);

ALTER TABLE client_daily_volume ENABLE ROW LEVEL SECURITY;

CREATE POLICY client_daily_volume_select_own
  ON client_daily_volume
  FOR SELECT
  USING (operator_id = auth.uid());

CREATE POLICY client_daily_volume_select_downline
  ON client_daily_volume
  FOR SELECT
  USING (operator_id IS NOT NULL AND is_in_my_downline(operator_id));

CREATE POLICY client_daily_volume_select_admin
  ON client_daily_volume
  FOR SELECT
  USING (is_admin());

CREATE POLICY client_daily_volume_insert_admin
  ON client_daily_volume
  FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY client_daily_volume_update_admin
  ON client_daily_volume
  FOR UPDATE
  USING (is_admin());

CREATE TRIGGER update_client_daily_volume_updated_at
  BEFORE UPDATE ON client_daily_volume
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
