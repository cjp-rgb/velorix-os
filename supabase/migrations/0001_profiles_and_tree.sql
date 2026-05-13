-- ============================================================================
-- VELORIX OS — Migration 0001: Core profiles and tree relationships
-- ============================================================================

-- Profiles table extends Supabase auth.users
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'master', 'sub_affiliate')) DEFAULT 'sub_affiliate',
  full_name TEXT NOT NULL,
  display_name TEXT,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  country TEXT,
  timezone TEXT DEFAULT 'Europe/London',
  instagram_handle TEXT,
  telegram_handle TEXT,
  profile_photo_url TEXT,

  -- PU Prime linkage
  pu_prime_aff_id TEXT UNIQUE,
  pu_prime_user_id TEXT,

  -- Tree structure
  upline_operator_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  master_operator_id UUID REFERENCES profiles(id) ON DELETE SET NULL,

  -- Velorix-specific
  allocated_rebate DECIMAL(10,2),
  velorix_tier TEXT CHECK (velorix_tier IN ('entry', 'growth', 'scale')),
  account_status TEXT NOT NULL CHECK (account_status IN ('pending', 'active', 'terminated')) DEFAULT 'pending',
  onboarding_progress JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  terminated_at TIMESTAMPTZ,
  terminated_reason TEXT
);

-- Indexes for common queries
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_status ON profiles(account_status);
CREATE INDEX idx_profiles_master ON profiles(master_operator_id);
CREATE INDEX idx_profiles_upline ON profiles(upline_operator_id);
CREATE INDEX idx_profiles_aff_id ON profiles(pu_prime_aff_id);
CREATE INDEX idx_profiles_tier ON profiles(velorix_tier);

-- Denormalised tree relationships for fast ancestor/descendant queries
CREATE TABLE tree_relationships (
  ancestor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  descendant_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  depth INTEGER NOT NULL CHECK (depth > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (ancestor_id, descendant_id)
);

CREATE INDEX idx_tree_ancestor ON tree_relationships(ancestor_id);
CREATE INDEX idx_tree_descendant ON tree_relationships(descendant_id);
CREATE INDEX idx_tree_depth ON tree_relationships(depth);

-- Auto-update updated_at on profile changes
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to maintain tree_relationships when profile's upline changes
CREATE OR REPLACE FUNCTION maintain_tree_relationships()
RETURNS TRIGGER AS $$
BEGIN
  -- If upline_operator_id changed or this is a new row
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.upline_operator_id IS DISTINCT FROM NEW.upline_operator_id) THEN

    -- Remove old relationships if updating
    IF TG_OP = 'UPDATE' THEN
      DELETE FROM tree_relationships
      WHERE descendant_id = NEW.id
         OR descendant_id IN (
           SELECT descendant_id FROM tree_relationships WHERE ancestor_id = NEW.id
         );
    END IF;

    -- Build new relationships if upline exists
    IF NEW.upline_operator_id IS NOT NULL THEN
      -- Direct relationship: upline → this profile (depth 1)
      INSERT INTO tree_relationships (ancestor_id, descendant_id, depth)
      VALUES (NEW.upline_operator_id, NEW.id, 1);

      -- Inherit upline's ancestors as this profile's ancestors (depth + 1)
      INSERT INTO tree_relationships (ancestor_id, descendant_id, depth)
      SELECT ancestor_id, NEW.id, depth + 1
      FROM tree_relationships
      WHERE descendant_id = NEW.upline_operator_id;

      -- This profile's descendants also inherit new ancestors
      INSERT INTO tree_relationships (ancestor_id, descendant_id, depth)
      SELECT NEW.upline_operator_id, descendant_id, depth + 1
      FROM tree_relationships
      WHERE ancestor_id = NEW.id
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_maintain_tree
  AFTER INSERT OR UPDATE OF upline_operator_id ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION maintain_tree_relationships();
