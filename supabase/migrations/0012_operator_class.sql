-- Migration 0012 — Operator class on profiles
-- Distinguishes which operating layer a profile belongs to.
--
-- This column was added to production directly via the Supabase dashboard
-- during the Inner Circle vs Velorix architecture discussion on May 14, 2026.
-- This migration retroactively captures the existing production state so
-- the version-controlled schema reflects reality. Future fresh deployments
-- get the column via this migration.
--
-- Values:
--   inner_circle — operator on Inner Circle AOS (Telegram-based, sub-IB)
--   velorix      — Master Affiliate on Velorix OS (default)
--   migrating    — transitional state during Inner Circle → Velorix migration
--
-- Graduation rule (captured in velorix-v3-roadmap.md): operators move from
-- inner_circle → migrating → velorix when they reach 5+ performing affiliates.
-- This is not enforced in this migration — that's v3 retention layer work.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS operator_class TEXT
  DEFAULT 'velorix'
  CHECK (operator_class IN ('inner_circle', 'velorix', 'migrating'));
