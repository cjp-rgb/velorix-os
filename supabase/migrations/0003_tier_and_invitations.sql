-- ============================================================================
-- VELORIX OS — Migration 0003: Tier promotions, rebate history, sub-affiliate invitations
-- ============================================================================

CREATE TABLE tier_changes (
  id BIGSERIAL PRIMARY KEY,
  operator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  from_tier TEXT CHECK (from_tier IN ('entry', 'growth', 'scale')),
  to_tier TEXT NOT NULL CHECK (to_tier IN ('entry', 'growth', 'scale')),

  triggered_by TEXT NOT NULL CHECK (triggered_by IN ('automatic', 'admin_override')),
  tree_deposits_at_promotion DECIMAL(15,2),
  tree_active_members_at_promotion INTEGER,

  rebate_before DECIMAL(10,2),
  rebate_after DECIMAL(10,2),

  admin_notes TEXT,
  confirmed_by_admin_at TIMESTAMPTZ,
  confirmed_by_admin_id UUID REFERENCES profiles(id),

  approval_status TEXT NOT NULL CHECK (approval_status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tier_changes_operator ON tier_changes(operator_id);
CREATE INDEX idx_tier_changes_status ON tier_changes(approval_status);
CREATE INDEX idx_tier_changes_created ON tier_changes(created_at DESC);

CREATE TABLE rebate_history (
  id BIGSERIAL PRIMARY KEY,
  operator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  previous_rebate DECIMAL(10,2),
  new_rebate DECIMAL(10,2) NOT NULL,

  changed_by_user_id UUID REFERENCES profiles(id),
  change_reason TEXT,

  effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_rebate_history_operator ON rebate_history(operator_id);
CREATE INDEX idx_rebate_history_effective ON rebate_history(effective_from DESC);

CREATE TABLE sub_affiliate_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  master_operator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  proposed_aff_id TEXT NOT NULL,
  proposed_name TEXT NOT NULL,
  proposed_email TEXT NOT NULL,
  proposed_rebate DECIMAL(10,2) NOT NULL,

  -- Auto-verification results
  auto_verification_result JSONB DEFAULT '{}'::jsonb,
  auto_verification_status TEXT CHECK (auto_verification_status IN ('verified', 'mismatch', 'not_found', 'pending')),
  auto_verified_at TIMESTAMPTZ,

  -- Admin review
  admin_review_status TEXT NOT NULL CHECK (admin_review_status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  admin_review_notes TEXT,
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,

  -- Invitation
  invitation_token UUID UNIQUE DEFAULT gen_random_uuid(),
  invitation_sent_at TIMESTAMPTZ,
  invitation_clicked_at TIMESTAMPTZ,
  invitation_expires_at TIMESTAMPTZ,

  -- Sub-affiliate confirmation
  sub_affiliate_confirmed_upline BOOLEAN,
  sub_affiliate_confirmed_at TIMESTAMPTZ,
  resulting_operator_id UUID REFERENCES profiles(id),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_invitations_master ON sub_affiliate_invitations(master_operator_id);
CREATE INDEX idx_invitations_status ON sub_affiliate_invitations(admin_review_status);
CREATE INDEX idx_invitations_token ON sub_affiliate_invitations(invitation_token);

CREATE TRIGGER trigger_invitations_updated_at
  BEFORE UPDATE ON sub_affiliate_invitations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
