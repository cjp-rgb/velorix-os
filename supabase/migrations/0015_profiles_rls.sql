-- Migration 0015 — Profiles RLS policies and helper functions
--
-- Captures the RLS security model for the profiles table that was applied
-- to production directly via the Supabase dashboard (not via earlier migrations).
-- This migration retroactively brings version-controlled schema into alignment
-- with the production state.
--
-- This pattern (out-of-band production change captured later in a migration)
-- should be avoided going forward. All schema and policy changes should be
-- written as migrations first and applied via supabase db push.
--
-- Architecture summary:
--   - is_admin() — true if calling user has role = 'admin'
--   - is_in_my_downline(uuid) — true if calling user is an ancestor of
--       the given operator in tree_relationships (multi-depth via Phase 0
--       recursive tree structure)
--
-- Both functions are STABLE SECURITY DEFINER:
--   - STABLE: same result within a transaction, can be cached by planner
--   - SECURITY DEFINER: runs with function owner privileges, bypassing
--     the caller's RLS — required to prevent recursive "check RLS to check
--     RLS" deadlocks when these functions are called from RLS policies.
--
-- Policy summary (all on public.profiles):
--   SELECT:
--     profiles_select_own       — users see their own profile (id = auth.uid())
--     profiles_select_admin     — admins see all profiles
--     profiles_select_downline  — users see profiles of their downline
--   UPDATE:
--     profiles_update_own       — users update their own profile
--     profiles_update_admin     — admins update any profile
--   INSERT:
--     profiles_insert_admin     — admins create new profile rows
--       (auth.users rows still come from Supabase Auth — this controls
--        the linked profiles row, typically created by trigger or admin action)

-- ============================================================================
-- Helper functions (CREATE OR REPLACE makes this idempotent)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.is_admin()
  RETURNS boolean
  LANGUAGE plpgsql
  STABLE SECURITY DEFINER
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.is_in_my_downline(operator_id_to_check uuid)
  RETURNS boolean
  LANGUAGE plpgsql
  STABLE SECURITY DEFINER
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM tree_relationships
    WHERE ancestor_id = auth.uid()
    AND descendant_id = operator_id_to_check
  );
END;
$function$;

-- ============================================================================
-- RLS enable (no-op if already enabled, which it is in production)
-- ============================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Policies — DROP IF EXISTS then CREATE makes this idempotent
-- against the already-applied production state
-- ============================================================================

-- SELECT policies

DROP POLICY IF EXISTS profiles_select_own ON profiles;
CREATE POLICY profiles_select_own
  ON profiles
  FOR SELECT
  USING (id = auth.uid());

DROP POLICY IF EXISTS profiles_select_admin ON profiles;
CREATE POLICY profiles_select_admin
  ON profiles
  FOR SELECT
  USING (is_admin());

DROP POLICY IF EXISTS profiles_select_downline ON profiles;
CREATE POLICY profiles_select_downline
  ON profiles
  FOR SELECT
  USING (is_in_my_downline(id));

-- UPDATE policies

DROP POLICY IF EXISTS profiles_update_own ON profiles;
CREATE POLICY profiles_update_own
  ON profiles
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS profiles_update_admin ON profiles;
CREATE POLICY profiles_update_admin
  ON profiles
  FOR UPDATE
  USING (is_admin());

-- INSERT policy

DROP POLICY IF EXISTS profiles_insert_admin ON profiles;
CREATE POLICY profiles_insert_admin
  ON profiles
  FOR INSERT
  WITH CHECK (is_admin());
