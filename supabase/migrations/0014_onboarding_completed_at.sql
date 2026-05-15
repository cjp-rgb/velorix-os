-- Migration 0014 — Onboarding completion timestamp
-- Tracks when an operator dismisses the first-login onboarding banner.
-- NULL = banner still shows. Non-null = banner hidden.
--
-- Full multi-step onboarding flow deferred to Phase 8+ when operator-facing
-- features (sign-up bot, CRM, full automations) exist. For now this is just
-- a single dismissal flag.

ALTER TABLE profiles
  ADD COLUMN onboarding_completed_at TIMESTAMPTZ NULL;
