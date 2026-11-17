const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);

const pool = hasDatabaseUrl
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      connectionTimeoutMillis: 2500,
      idleTimeoutMillis: 30000,
    })
  : null;

let dbReady = false;
let lastDbError = null;
const recentSyncLogs = [];
const MAX_MEMORY_LOGS = 50;

if (pool) {
  pool.on('error', (err) => {
    dbReady = false;
    lastDbError = err.message;
    console.warn('[PostgreSQL] Unexpected pool error:', err.message);
  });
}

async function initDatabase() {
  if (!pool) {
    dbReady = false;
    lastDbError = 'DATABASE_URL not configured';
    console.warn('[PostgreSQL] DATABASE_URL not configured; using local disk cache fallback.');
    return false;
  }

  try {
    await pool.query('SELECT 1');
    const schemaPath = path.join(__dirname, '..', 'db', 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    await pool.query(schemaSql);

    // Ensure columns exist if upgrading from minimal table schema
    await pool.query(`
      ALTER TABLE cached_snapshots ADD COLUMN IF NOT EXISTS category VARCHAR(40) NOT NULL DEFAULT 'general';
      ALTER TABLE cached_snapshots ADD COLUMN IF NOT EXISTS competition_code VARCHAR(16);
      ALTER TABLE cached_snapshots ADD COLUMN IF NOT EXISTS source VARCHAR(40) NOT NULL DEFAULT 'api';
      ALTER TABLE cached_snapshots ADD COLUMN IF NOT EXISTS ttl_seconds INTEGER NOT NULL DEFAULT 3600;
      ALTER TABLE cached_snapshots ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '1 hour');
    `);

    dbReady = true;
    lastDbError = null;
    console.log('[PostgreSQL] Connected and schema initialized');
    return true;
  } catch (err) {
    dbReady = false;
    lastDbError = err.message;
    console.warn('[PostgreSQL] Unavailable (using local disk cache fallback):', err.message);
    return false;
  }
}

async function recordSyncLog({ jobName, competitionCode = null, status, source = null, detail = null, durationMs = null }) {
  const entry = {
    jobName,
    competitionCode,
    status,
    source,
    detail,
    durationMs,
    createdAt: new Date().toISOString(),
  };

  recentSyncLogs.unshift(entry);
  if (recentSyncLogs.length > MAX_MEMORY_LOGS) {
    recentSyncLogs.length = MAX_MEMORY_LOGS;
  }

  if (!dbReady || !pool) return;

  try {
    await pool.query(
      `INSERT INTO sync_logs (job_name, competition_code, status, source, detail, duration_ms)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [jobName, competitionCode, status, source, detail, durationMs]
    );
  } catch (err) {
    console.warn('[PostgreSQL] Failed to write sync log:', err.message);
  }
}

function getRecentSyncLogs() {
  return recentSyncLogs;
}

module.exports = {
  pool,
  initDatabase,
  isDbReady: () => dbReady,
  getDbStatus: () => ({
    configured: hasDatabaseUrl,
    connected: dbReady,
    lastError: lastDbError,
  }),
  recordSyncLog,
  getRecentSyncLogs,
};
