-- ============================================================================
-- VELORIX OS — Migration 0002: Performance metrics, tree aggregates, accounts
-- ============================================================================

-- Per-operator per-month aggregated metrics
CREATE TABLE monthly_performance (
  id BIGSERIAL PRIMARY KEY,
  operator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  month_year DATE NOT NULL,

  -- Raw metrics from Sub IB Report (their personal row)
  net_deposits_usd DECIMAL(15,2) DEFAULT 0,
  gross_deposits_usd DECIMAL(15,2) DEFAULT 0,
  withdrawals_usd DECIMAL(15,2) DEFAULT 0,
  volume_lots DECIMAL(15,4) DEFAULT 0,  -- lots traded by their own direct clients
  volume_nv_usd DECIMAL(15,2) DEFAULT 0,
  registrations_count INTEGER DEFAULT 0,
  accounts_opened_count INTEGER DEFAULT 0,
  ftd_count INTEGER DEFAULT 0,

  -- Calculated earnings (two streams)
  calculated_direct_client_earnings DECIMAL(15,2) DEFAULT 0,
  -- own rate × lots traded by own direct clients

  calculated_downline_override_earnings DECIMAL(15,2) DEFAULT 0,
  -- sum across direct sub-IBs of: (own rate − sub-IB rate) × sub-IB tree-total lots

  calculated_total_earnings DECIMAL(15,2) DEFAULT 0,
  -- sum of the two above

  -- Provenance
  source_upload_id UUID,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (operator_id, month_year)
);

CREATE INDEX idx_monthly_perf_operator ON monthly_performance(operator_id);
CREATE INDEX idx_monthly_perf_month ON monthly_performance(month_year);
CREATE INDEX idx_monthly_perf_operator_month ON monthly_performance(operator_id, month_year DESC);

CREATE TRIGGER trigger_monthly_perf_updated_at
  BEFORE UPDATE ON monthly_performance
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Pre-computed tree-total metrics (for tier placement)
CREATE TABLE tree_monthly_aggregates (
  id BIGSERIAL PRIMARY KEY,
  operator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  month_year DATE NOT NULL,

  tree_net_deposits_usd DECIMAL(15,2) DEFAULT 0,
  tree_gross_deposits_usd DECIMAL(15,2) DEFAULT 0,
  tree_volume_lots DECIMAL(15,4) DEFAULT 0,
  tree_volume_nv_usd DECIMAL(15,2) DEFAULT 0,
  tree_member_count INTEGER DEFAULT 0,
  tree_active_member_count INTEGER DEFAULT 0,

  computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (operator_id, month_year)
);

CREATE INDEX idx_tree_agg_operator ON tree_monthly_aggregates(operator_id);
CREATE INDEX idx_tree_agg_month ON tree_monthly_aggregates(month_year);

-- Individual PU Prime accounts (from IB Accounts Report)
CREATE TABLE pu_prime_accounts (
  id BIGSERIAL PRIMARY KEY,
  account_number TEXT NOT NULL UNIQUE,
  pu_prime_user_id TEXT,
  account_owner_operator_id UUID REFERENCES profiles(id) ON DELETE SET NULL,

  client_name TEXT,
  account_type TEXT,
  platform TEXT CHECK (platform IN ('MT4', 'MT5')),
  base_currency TEXT,

  balance DECIMAL(15,2),
  equity DECIMAL(15,2),
  credit DECIMAL(15,2),
  profit DECIMAL(15,2),

  account_journey TEXT CHECK (account_journey IN ('pending', 'funded', 'trading_30', 'traded_30_ago', 'inactive')),

  last_trade_date DATE,
  last_traded_instrument TEXT,
  last_traded_lots TEXT,
  last_deposit_date DATE,
  last_deposit_amount DECIMAL(15,2),
  last_deposit_currency TEXT,

  account_opened_date DATE,
  campaign_source TEXT,

  last_synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_accounts_owner ON pu_prime_accounts(account_owner_operator_id);
CREATE INDEX idx_accounts_journey ON pu_prime_accounts(account_journey);
CREATE INDEX idx_accounts_last_trade ON pu_prime_accounts(last_trade_date DESC);
