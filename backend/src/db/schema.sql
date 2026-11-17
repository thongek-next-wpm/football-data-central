CREATE TABLE IF NOT EXISTS cached_snapshots (
  cache_key VARCHAR(160) PRIMARY KEY,
  category VARCHAR(40) NOT NULL DEFAULT 'general',
  competition_code VARCHAR(16),
  payload JSONB NOT NULL,
  source VARCHAR(40) NOT NULL DEFAULT 'api',
  ttl_seconds INTEGER NOT NULL DEFAULT 3600,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '1 hour')
);

CREATE INDEX IF NOT EXISTS idx_cached_snapshots_updated_at
  ON cached_snapshots (updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_cached_snapshots_expires_at
  ON cached_snapshots (expires_at);

CREATE INDEX IF NOT EXISTS idx_cached_snapshots_competition
  ON cached_snapshots (competition_code);

CREATE TABLE IF NOT EXISTS sync_logs (
  id BIGSERIAL PRIMARY KEY,
  job_name VARCHAR(80) NOT NULL,
  competition_code VARCHAR(16),
  status VARCHAR(32) NOT NULL,
  source VARCHAR(40),
  detail TEXT,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sync_logs_created_at
  ON sync_logs (created_at DESC);
