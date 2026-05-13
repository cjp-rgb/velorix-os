-- ============================================================================
-- VELORIX OS — Migration 0004: Data uploads, audit log, notifications
-- ============================================================================

CREATE TABLE data_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uploaded_by UUID NOT NULL REFERENCES profiles(id),
  upload_date DATE NOT NULL DEFAULT CURRENT_DATE,
  report_type TEXT NOT NULL CHECK (report_type IN ('sub_ib_report', 'ib_accounts_report', 'rebate_report')),
  period_start DATE,
  period_end DATE,

  rows_parsed INTEGER DEFAULT 0,
  rows_imported INTEGER DEFAULT 0,
  rows_rejected INTEGER DEFAULT 0,
  rejection_reasons JSONB DEFAULT '[]'::jsonb,

  processing_status TEXT NOT NULL CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')) DEFAULT 'pending',
  processing_error TEXT,

  original_filename TEXT,
  storage_path TEXT,

  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_uploads_date ON data_uploads(upload_date DESC);
CREATE INDEX idx_uploads_type ON data_uploads(report_type);
CREATE INDEX idx_uploads_status ON data_uploads(processing_status);

CREATE TABLE audit_log (
  id BIGSERIAL PRIMARY KEY,
  actor_id UUID REFERENCES profiles(id),
  actor_type TEXT NOT NULL CHECK (actor_type IN ('admin', 'master', 'sub_affiliate', 'system')),

  action_type TEXT NOT NULL,
  -- Examples: rebate_change, tier_promotion, sub_affiliate_invited, sub_affiliate_approved,
  -- sub_affiliate_rejected, termination, login, login_failed, data_upload, content_generated,
  -- automation_run, settings_changed, etc.

  target_id UUID,
  target_type TEXT,
  -- Examples: operator, account, upload, content, automation, etc.

  change_data JSONB DEFAULT '{}'::jsonb,

  ip_address INET,
  user_agent TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_actor ON audit_log(actor_id);
CREATE INDEX idx_audit_target ON audit_log(target_id);
CREATE INDEX idx_audit_action ON audit_log(action_type);
CREATE INDEX idx_audit_created ON audit_log(created_at DESC);

CREATE TABLE notifications (
  id BIGSERIAL PRIMARY KEY,
  recipient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  notification_type TEXT NOT NULL,
  -- Examples: tier_promotion, sub_affiliate_request, sub_affiliate_approved, sub_affiliate_rejected,
  -- tree_grew, first_rebate, milestone, system, etc.

  title TEXT NOT NULL,
  body TEXT,
  link_to TEXT,

  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,

  delivered_in_app BOOLEAN DEFAULT TRUE,
  delivered_email BOOLEAN DEFAULT FALSE,
  delivered_push BOOLEAN DEFAULT FALSE,
  delivered_telegram BOOLEAN DEFAULT FALSE,

  metadata JSONB DEFAULT '{}'::jsonb,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_recipient ON notifications(recipient_id);
CREATE INDEX idx_notifications_unread ON notifications(recipient_id, is_read) WHERE is_read = FALSE;
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);
