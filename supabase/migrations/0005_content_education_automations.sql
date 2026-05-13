-- ============================================================================
-- VELORIX OS — Migration 0005: Content engine, education, automations
-- ============================================================================

CREATE TABLE content_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL CHECK (category IN ('educational', 'promotional', 'profit_shot', 'testimonial', 'cta', 'engagement')),
  platform TEXT NOT NULL CHECK (platform IN ('instagram', 'tiktok', 'telegram', 'twitter', 'linkedin')),

  template_text TEXT NOT NULL,
  hooks JSONB DEFAULT '[]'::jsonb,
  hashtags TEXT[],

  created_by UUID REFERENCES profiles(id),
  is_velorix_default BOOLEAN DEFAULT FALSE,

  usage_count INTEGER DEFAULT 0,
  performance_score DECIMAL(5,2),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_templates_category ON content_templates(category);
CREATE INDEX idx_templates_platform ON content_templates(platform);
CREATE INDEX idx_templates_default ON content_templates(is_velorix_default);

CREATE TRIGGER trigger_templates_updated_at
  BEFORE UPDATE ON content_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE generated_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  template_id UUID REFERENCES content_templates(id) ON DELETE SET NULL,

  content_text TEXT NOT NULL,
  platform TEXT NOT NULL,
  posted_at TIMESTAMPTZ,

  performance_data JSONB DEFAULT '{}'::jsonb,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_generated_operator ON generated_content(operator_id);
CREATE INDEX idx_generated_created ON generated_content(created_at DESC);

CREATE TABLE education_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  tier_required TEXT CHECK (tier_required IN ('entry', 'growth', 'scale', 'none')) DEFAULT 'none',

  module_order INTEGER NOT NULL,
  loom_video_url TEXT,
  content_markdown TEXT,
  quiz_questions JSONB DEFAULT '[]'::jsonb,
  estimated_minutes INTEGER,

  is_published BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_education_tier ON education_modules(tier_required);
CREATE INDEX idx_education_order ON education_modules(module_order);
CREATE INDEX idx_education_published ON education_modules(is_published);

CREATE TRIGGER trigger_education_updated_at
  BEFORE UPDATE ON education_modules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE education_progress (
  id BIGSERIAL PRIMARY KEY,
  operator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES education_modules(id) ON DELETE CASCADE,

  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  quiz_score INTEGER,
  time_spent_minutes INTEGER,

  UNIQUE (operator_id, module_id)
);

CREATE INDEX idx_progress_operator ON education_progress(operator_id);
CREATE INDEX idx_progress_completed ON education_progress(completed_at);

CREATE TABLE automation_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  automation_type TEXT NOT NULL CHECK (automation_type IN ('signup_bot', 'eod_bot', 'profit_shot_pipeline', 'tier_progress_notifier')),

  is_enabled BOOLEAN DEFAULT FALSE,
  config_jsonb JSONB DEFAULT '{}'::jsonb,
  -- Note: bot tokens stored here should be encrypted via Supabase Vault in production

  last_run_at TIMESTAMPTZ,
  last_run_status TEXT,
  last_run_error TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (operator_id, automation_type)
);

CREATE INDEX idx_automations_operator ON automation_configs(operator_id);
CREATE INDEX idx_automations_enabled ON automation_configs(is_enabled);

CREATE TRIGGER trigger_automations_updated_at
  BEFORE UPDATE ON automation_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
