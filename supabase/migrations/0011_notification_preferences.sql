-- Migration 0011 — Notification preferences on profiles
-- JSONB column for flexible per-category, per-channel notification toggles.
-- Used by Phase 4+ notification firing system (not yet built — preferences
-- saved now so they're ready when notifications start firing).

ALTER TABLE profiles
  ADD COLUMN notification_preferences JSONB
  NOT NULL
  DEFAULT '{}'::jsonb;

COMMENT ON COLUMN profiles.notification_preferences IS
  'JSONB of notification toggles. Shape: { category: { email: bool, push: bool, in_app: bool } }. Categories include: tier_promotion, downline_activity, monthly_summary, system_updates, education_releases.';
