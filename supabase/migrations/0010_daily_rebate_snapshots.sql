-- Migration 0010 — Daily rebate snapshots
-- Per-operator per-day total rebate earned.
-- Source: PU Prime rebate_report nightly upload.
-- Populated by admin XLSX upload pipeline (Phase 5).

CREATE TABLE daily_rebate_snapshots (
  id BIGSERIAL PRIMARY KEY,
  operator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  notional_value_usd DECIMAL(18, 4),
  total_rebate_usd DECIMAL(14, 4),
  source_upload_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (operator_id, date)
);

CREATE INDEX idx_daily_rebate_operator_date
  ON daily_rebate_snapshots (operator_id, date DESC);

ALTER TABLE daily_rebate_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "operators read own daily snapshots"
  ON daily_rebate_snapshots
  FOR SELECT
  USING (operator_id = auth.uid());

CREATE POLICY "admins read all daily snapshots"
  ON daily_rebate_snapshots
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "admins insert daily snapshots"
  ON daily_rebate_snapshots
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "admins update daily snapshots"
  ON daily_rebate_snapshots
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE TRIGGER update_daily_rebate_snapshots_updated_at
  BEFORE UPDATE ON daily_rebate_snapshots
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
