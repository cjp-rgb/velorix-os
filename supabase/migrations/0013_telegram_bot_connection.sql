-- Migration 0013 — Add telegram_bot_connection to automation_type values
-- Allows operators to connect their personal Telegram bot to Velorix.
-- This bot is the channel through which all operator-level automations fire
-- (sign-up bot, EOD message, profit shots, redeposit push, free group posts).
--
-- Built in Phase 1.9f (May 14, 2026). Actual automations that use this
-- connection ship in Phases 4 (sub-affiliate onboarding) and 8 (automations).
--
-- Security note: bot tokens stored in config_jsonb are plaintext for v1.
-- Migrate to Supabase Vault in v1.1 security hardening (backlog).

ALTER TABLE automation_configs
  DROP CONSTRAINT IF EXISTS automation_configs_automation_type_check;

ALTER TABLE automation_configs
  ADD CONSTRAINT automation_configs_automation_type_check
  CHECK (automation_type IN (
    'signup_bot',
    'eod_bot',
    'profit_shot_pipeline',
    'tier_progress_notifier',
    'telegram_bot_connection'
  ));
