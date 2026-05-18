-- Migration 0017 — data_uploads fixes for Phase 2.2 ingest
--
-- Two changes:
--
-- 1. Extend report_type CHECK constraint to include 'ib_report'.
--    The original 0004_operational.sql only included 3 of the 4 PU Prime
--    report types Phase 2.2 needs to ingest.
--
-- 2. Retroactively capture the uploads_admin_only RLS policy that exists
--    in production but was applied via Supabase dashboard (not migration).
--    Same out-of-band pattern as profiles RLS (captured in 0015) and
--    operator_class column (captured in 0012). Brings version-controlled
--    schema into alignment with production.
--
-- Skipped: an uploads_select_own policy for operator-facing upload history.
-- Not needed at v1 — operators don't see upload UIs. Add later if Phase 4
-- builds an operator-visible sync history feature.

-- ============================================================================
-- 1. Extend report_type CHECK constraint
-- ============================================================================

ALTER TABLE data_uploads
  DROP CONSTRAINT IF EXISTS data_uploads_report_type_check;

ALTER TABLE data_uploads
  ADD CONSTRAINT data_uploads_report_type_check
  CHECK (report_type IN (
    'sub_ib_report',
    'ib_accounts_report',
    'rebate_report',
    'ib_report'
  ));

-- ============================================================================
-- 2. Capture uploads_admin_only RLS policy retroactively
-- ============================================================================

-- RLS is already enabled in production; this is a no-op if so.
ALTER TABLE data_uploads ENABLE ROW LEVEL SECURITY;

-- Drop-then-create makes this idempotent against the already-applied production state.
DROP POLICY IF EXISTS uploads_admin_only ON data_uploads;
CREATE POLICY uploads_admin_only
  ON data_uploads
  FOR ALL
  USING (is_admin());
