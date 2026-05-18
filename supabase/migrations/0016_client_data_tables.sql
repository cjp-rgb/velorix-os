-- Migration 0016 — Client data tables for Phase 2.2 data pipeline
--
-- Three new tables populated by the PU Prime XLSX ingest pipeline:
--   - client_snapshots: per-day-per-account state from ib_accounts reports
--   - client_deposits: daily deposit/withdrawal events from ib_report fund_report
--   - account_creation_events: new account events from ib_report opened_accounts
--
-- All three use composite UNIQUE constraints for idempotent upsert on re-upload.
-- operator_id is nullable: when name-based matching from XLSX to Velorix profile
-- fails, we still store the row (data preservation) and surface unmatched rows
-- in the upload result panel for admin visibility.
--
-- RLS policies follow the same pattern as profiles:
--   - operators see rows where operator_id = auth.uid() or downline match
--   - admins see all via is_admin()
--   - inserts/updates admin-only (XLSX upload pipeline runs as admin)

-- ============================================================================
-- client_snapshots
-- ============================================================================

CREATE TABLE client_snapshots (
  id BIGSERIAL PRIMARY KEY,

  -- Identity (composite UNIQUE for idempotency)
  account_id BIGINT NOT NULL,
  snapshot_date DATE NOT NULL,

  -- Resolution
  user_id BIGINT,
  account_owner_name TEXT,
  operator_id UUID REFERENCES profiles(id) ON DELETE SET NULL,

  -- Client identity
  client_name TEXT,
  campaign_source TEXT,

  -- Account specifics
  account_type TEXT,
  platform TEXT,
  base_currency TEXT,

  -- Financial state
  profit DECIMAL(14, 4),
  balance DECIMAL(14, 4),
  account_equity DECIMAL(14, 4),
  credit DECIMAL(14, 4),

  -- Journey + trading activity
  account_journey TEXT,
  last_trade_date DATE,
  last_traded_instrument TEXT,
  last_traded_lots TEXT,
  last_deposit_date DATE,
  last_deposit_amount TEXT,

  -- Provenance
  source_upload_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (account_id, snapshot_date)
);

CREATE INDEX idx_client_snapshots_operator_date
  ON client_snapshots (operator_id, snapshot_date DESC);

CREATE INDEX idx_client_snapshots_account
  ON client_snapshots (account_id, snapshot_date DESC);

ALTER TABLE client_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY client_snapshots_select_own
  ON client_snapshots
  FOR SELECT
  USING (operator_id = auth.uid());

CREATE POLICY client_snapshots_select_downline
  ON client_snapshots
  FOR SELECT
  USING (operator_id IS NOT NULL AND is_in_my_downline(operator_id));

CREATE POLICY client_snapshots_select_admin
  ON client_snapshots
  FOR SELECT
  USING (is_admin());

CREATE POLICY client_snapshots_insert_admin
  ON client_snapshots
  FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY client_snapshots_update_admin
  ON client_snapshots
  FOR UPDATE
  USING (is_admin());

CREATE TRIGGER update_client_snapshots_updated_at
  BEFORE UPDATE ON client_snapshots
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- client_deposits
-- ============================================================================

CREATE TABLE client_deposits (
  id BIGSERIAL PRIMARY KEY,

  -- Identity
  account_id BIGINT NOT NULL,
  date DATE NOT NULL,

  -- Resolution
  user_id BIGINT,
  operator_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  campaign_source TEXT,

  -- Financial activity
  deposits DECIMAL(14, 4),
  withdraws DECIMAL(14, 4),
  net_deposits DECIMAL(14, 4),

  -- Provenance
  source_upload_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (account_id, date)
);

CREATE INDEX idx_client_deposits_operator_date
  ON client_deposits (operator_id, date DESC);

CREATE INDEX idx_client_deposits_account_date
  ON client_deposits (account_id, date DESC);

ALTER TABLE client_deposits ENABLE ROW LEVEL SECURITY;

CREATE POLICY client_deposits_select_own
  ON client_deposits
  FOR SELECT
  USING (operator_id = auth.uid());

CREATE POLICY client_deposits_select_downline
  ON client_deposits
  FOR SELECT
  USING (operator_id IS NOT NULL AND is_in_my_downline(operator_id));

CREATE POLICY client_deposits_select_admin
  ON client_deposits
  FOR SELECT
  USING (is_admin());

CREATE POLICY client_deposits_insert_admin
  ON client_deposits
  FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY client_deposits_update_admin
  ON client_deposits
  FOR UPDATE
  USING (is_admin());

CREATE TRIGGER update_client_deposits_updated_at
  BEFORE UPDATE ON client_deposits
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- account_creation_events
-- ============================================================================

CREATE TABLE account_creation_events (
  id BIGSERIAL PRIMARY KEY,

  -- Identity
  account_id BIGINT NOT NULL,
  date DATE NOT NULL,

  -- Resolution
  user_id BIGINT,
  client_name TEXT,
  operator_id UUID REFERENCES profiles(id) ON DELETE SET NULL,

  -- Account specifics
  campaign_source TEXT,
  account_type TEXT,
  platform TEXT,
  base_currency TEXT,
  available_balance DECIMAL(14, 4),

  -- Provenance
  source_upload_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (account_id, date)
);

CREATE INDEX idx_account_creation_operator_date
  ON account_creation_events (operator_id, date DESC);

ALTER TABLE account_creation_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY account_creation_events_select_own
  ON account_creation_events
  FOR SELECT
  USING (operator_id = auth.uid());

CREATE POLICY account_creation_events_select_downline
  ON account_creation_events
  FOR SELECT
  USING (operator_id IS NOT NULL AND is_in_my_downline(operator_id));

CREATE POLICY account_creation_events_select_admin
  ON account_creation_events
  FOR SELECT
  USING (is_admin());

CREATE POLICY account_creation_events_insert_admin
  ON account_creation_events
  FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY account_creation_events_update_admin
  ON account_creation_events
  FOR UPDATE
  USING (is_admin());

CREATE TRIGGER update_account_creation_events_updated_at
  BEFORE UPDATE ON account_creation_events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
