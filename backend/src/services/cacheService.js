const fs = require('fs');
const path = require('path');
const { redisClient, isRedisReady } = require('../config/redis');
const { pool, isDbReady } = require('../config/db');
const { rateLimiter } = require('./rateLimiter');
const { isApiKeyConfigured } = require('./footballApi');
const { searchSeedEntities } = require('../data/seedData');

const CACHE_DIR = path.join(__dirname, '..', '..', 'data');
const DISK_CACHE_FILE = path.join(CACHE_DIR, 'cache-store.json');

const memoryStore = new Map();
let diskLoaded = false;
let diskFlushTimer = null;

function ensureDiskLoaded() {
  if (diskLoaded) return;
  diskLoaded = true;
  try {
    if (fs.existsSync(DISK_CACHE_FILE)) {
      const raw = fs.readFileSync(DISK_CACHE_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        for (const [k, entry] of Object.entries(parsed)) {
          if (entry && entry.data !== undefined) {
            memoryStore.set(k, entry);
          }
        }
      }
    }
  } catch (err) {
    console.warn('[Cache] Failed to read local disk cache:', err.message);
  }
}

function scheduleDiskFlush() {
  if (diskFlushTimer) return;
  diskFlushTimer = setTimeout(() => {
    diskFlushTimer = null;
    try {
      fs.mkdirSync(CACHE_DIR, { recursive: true });
      const serializable = {};
      for (const [k, v] of memoryStore.entries()) {
        // Persist non-demo snapshots (or snapshots <= 50 entries) cleanly
        if (v && v.source !== 'demo-seed') {
          serializable[k] = v;
        }
      }
      fs.writeFileSync(DISK_CACHE_FILE, JSON.stringify(serializable), 'utf8');
    } catch (err) {
      console.warn('[Cache] Failed to flush local disk cache:', err.message);
    }
  }, 400);
}

async function readFreshFromRedis(cacheKey) {
  if (!isRedisReady()) return null;
  try {
    const raw = await redisClient.get(cacheKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.data !== undefined) {
      return {
        source: 'redis',
        stale: false,
        cached: true,
        isDemo: false,
        updatedAt: parsed.updatedAt || new Date().toISOString(),
        expiresAt: parsed.expiresAt || null,
        data: parsed.data,
      };
    }
  } catch (err) {
    console.warn('[Cache] Redis read failed:', err.message);
  }
  return null;
}

async function readFromPostgres(cacheKey, { allowStale = false } = {}) {
  if (!isDbReady() || !pool) return null;
  try {
    const { rows } = await pool.query(
      'SELECT payload, source, updated_at, expires_at FROM cached_snapshots WHERE cache_key = $1',
      [cacheKey]
    );
    if (rows.length === 0) return null;
    const row = rows[0];
    const expiresAtMs = new Date(row.expires_at).getTime();
    const isFresh = expiresAtMs > Date.now();
    if (!isFresh && !allowStale) return null;

    return {
      source: isFresh ? 'postgres' : 'postgres-fallback',
      stale: !isFresh,
      cached: true,
      isDemo: false,
      updatedAt: new Date(row.updated_at).toISOString(),
      expiresAt: new Date(row.expires_at).toISOString(),
      data: row.payload,
    };
  } catch (err) {
    console.warn('[Cache] PostgreSQL read failed:', err.message);
    return null;
  }
}

function readFromLocalDisk(cacheKey, { allowStale = false } = {}) {
  ensureDiskLoaded();
  const entry = memoryStore.get(cacheKey);
  if (!entry) return null;

  const isFresh = Number(entry.expiresAtMs || 0) > Date.now();
  if (!isFresh && !allowStale) return null;

  return {
    source: isFresh ? 'local-cache' : 'local-fallback',
    stale: !isFresh,
    cached: true,
    isDemo: false,
    updatedAt: entry.updatedAt,
    expiresAt: entry.expiresAtMs ? new Date(entry.expiresAtMs).toISOString() : null,
    data: entry.data,
  };
}

async function saveSnapshot(cacheKey, ttlSeconds, data, meta = {}) {
  const now = Date.now();
  const expiresAtMs = now + ttlSeconds * 1000;
  const updatedAt = new Date(now).toISOString();
  const expiresAt = new Date(expiresAtMs).toISOString();
  const category = meta.category || cacheKey.split(':')[0] || 'general';
  const competitionCode = meta.competitionCode || null;
  const source = meta.source || 'api';

  const envelope = {
    updatedAt,
    expiresAt,
    expiresAtMs,
    source,
    category,
    competitionCode,
    data,
  };

  ensureDiskLoaded();
  memoryStore.set(cacheKey, envelope);
  scheduleDiskFlush();

  if (isRedisReady()) {
    try {
      await redisClient.setEx(cacheKey, ttlSeconds, JSON.stringify({ updatedAt, expiresAt, data }));
    } catch (err) {
      console.warn('[Cache] Redis write failed:', err.message);
    }
  }

  if (isDbReady() && pool) {
    try {
      await pool.query(
        `INSERT INTO cached_snapshots (cache_key, category, competition_code, payload, source, ttl_seconds, updated_at, expires_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW() + ($6 || ' seconds')::INTERVAL)
         ON CONFLICT (cache_key)
         DO UPDATE SET
           category = EXCLUDED.category,
           competition_code = EXCLUDED.competition_code,
           payload = EXCLUDED.payload,
           source = EXCLUDED.source,
           ttl_seconds = EXCLUDED.ttl_seconds,
           updated_at = NOW(),
           expires_at = NOW() + ($6 || ' seconds')::INTERVAL`,
        [cacheKey, category, competitionCode, JSON.stringify(data), source, ttlSeconds]
      );
    } catch (err) {
      console.warn('[Cache] PostgreSQL write failed:', err.message);
    }
  }
}

async function getCachedOrFetch(cacheKey, ttlSeconds, fetcher, options = {}) {
  const {
    meta = {},
    seedFallback = null,
    forceRefresh = false,
  } = options;

  const demoFallbackEnabled = process.env.ENABLE_DEMO_FALLBACK !== 'false';

  if (!forceRefresh) {
    // Tier 1: Redis L1 Cache
    const redisHit = await readFreshFromRedis(cacheKey);
    if (redisHit) return redisHit;

    // Tier 2: PostgreSQL L2 Cache (checks TTL before hitting API!)
    const pgHit = await readFromPostgres(cacheKey, { allowStale: false });
    if (pgHit) {
      if (isRedisReady()) {
        const remainingSec = Math.max(
          60,
          Math.floor((new Date(pgHit.expiresAt).getTime() - Date.now()) / 1000)
        );
        redisClient
          .setEx(cacheKey, remainingSec, JSON.stringify({ updatedAt: pgHit.updatedAt, expiresAt: pgHit.expiresAt, data: pgHit.data }))
          .catch(() => {});
      }
      return pgHit;
    }

    // Tier 3: Local Persistent Disk Cache (checks TTL before hitting API!)
    const localHit = readFromLocalDisk(cacheKey, { allowStale: false });
    if (localHit) return localHit;
  }

  // Deduplicate concurrent cold fetches for the same cacheKey (singleflight)
  return rateLimiter.dedupe(cacheKey, async () => {
    if (isApiKeyConfigured()) {
      try {
        const freshData = await fetcher();
        await saveSnapshot(cacheKey, ttlSeconds, freshData, { ...meta, source: 'api' });
        return {
          source: 'api',
          stale: false,
          cached: false,
          isDemo: false,
          updatedAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + ttlSeconds * 1000).toISOString(),
          data: freshData,
        };
      } catch (apiErr) {
        const isTierRestricted = apiErr.code === 'API_TIER_RESTRICTED' || apiErr.httpStatus === 403;
        console.warn(`[API] Fetch failed for ${cacheKey} (${apiErr.code || apiErr.message}), checking stale fallback`);

        // Fallback A: Stale PostgreSQL snapshot
        const stalePg = await readFromPostgres(cacheKey, { allowStale: true });
        if (stalePg) {
          return { ...stalePg, warning: apiErr.message };
        }

        // Fallback B: Stale Local Disk/Memory snapshot
        const staleLocal = readFromLocalDisk(cacheKey, { allowStale: true });
        if (staleLocal) {
          return { ...staleLocal, warning: apiErr.message };
        }

        // Fallback C: Demo / Seed dataset (especially useful when Free Tier restricts EL/UCL with 403)
        if (demoFallbackEnabled && typeof seedFallback === 'function') {
          const demoData = seedFallback();
          if (demoData) {
            return {
              source: isTierRestricted ? 'demo-tier-fallback' : 'demo-fallback',
              stale: false,
              cached: false,
              isDemo: true,
              apiTierRestricted: isTierRestricted,
              warning: isTierRestricted
                ? 'รายการนี้ไม่ได้อยู่ใน Free Tier ของ football-data.org จึงแสดงข้อมูลจำลองแทน'
                : `ไม่สามารถติดต่อ API ได้ชั่วคราว (${apiErr.message}) จึงแสดงข้อมูลจำลองแทน`,
              updatedAt: new Date().toISOString(),
              data: demoData,
            };
          }
        }

        throw apiErr;
      }
    }

    // API key not configured: check stale DB/local cache first, then serve clean Demo Seed
    const stalePg = await readFromPostgres(cacheKey, { allowStale: true });
    if (stalePg) return stalePg;

    const staleLocal = readFromLocalDisk(cacheKey, { allowStale: true });
    if (staleLocal) return staleLocal;

    if (demoFallbackEnabled && typeof seedFallback === 'function') {
      const demoData = seedFallback();
      if (demoData) {
        return {
          source: 'demo-seed',
          stale: false,
          cached: false,
          isDemo: true,
          apiTierRestricted: false,
          updatedAt: new Date().toISOString(),
          data: demoData,
        };
      }
    }

    const err = new Error('FOOTBALL_DATA_API_KEY is not configured and no cached data exists');
    err.code = 'API_KEY_MISSING';
    throw err;
  });
}

function getCachedEntryMeta(cacheKey) {
  ensureDiskLoaded();
  const entry = memoryStore.get(cacheKey);
  if (!entry) return null;
  return {
    updatedAt: entry.updatedAt,
    expiresAt: entry.expiresAt,
    fresh: Number(entry.expiresAtMs || 0) > Date.now(),
    source: entry.source,
  };
}

function listCachedSnapshotsSummary() {
  ensureDiskLoaded();
  const summary = [];
  for (const [key, entry] of memoryStore.entries()) {
    summary.push({
      cacheKey: key,
      category: entry.category,
      competitionCode: entry.competitionCode,
      source: entry.source,
      updatedAt: entry.updatedAt,
      expiresAt: entry.expiresAt,
      fresh: Number(entry.expiresAtMs || 0) > Date.now(),
    });
  }
  return summary.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
}

function searchCachedAndSeed(query) {
  const q = String(query || '').trim().toLowerCase();
  if (!q) return { competitions: [], teams: [], players: [] };

  // Start with seed results and enrich with any cached live API snapshots
  const base = searchSeedEntities(q);
  const teamMap = new Map(base.teams.map((t) => [t.id, t]));
  const playerMap = new Map(base.players.map((p) => [p.id, p]));

  ensureDiskLoaded();
  for (const [key, entry] of memoryStore.entries()) {
    if (!entry?.data) continue;
    if (key.startsWith('standings:') && Array.isArray(entry.data.standings)) {
      const code = entry.data.competition?.code || key.split(':')[1];
      for (const st of entry.data.standings) {
        for (const row of st.table || []) {
          const t = row.team;
          if (t && (t.name?.toLowerCase().includes(q) || t.shortName?.toLowerCase().includes(q) || t.tla?.toLowerCase().includes(q))) {
            teamMap.set(t.id, {
              id: t.id,
              name: t.name,
              shortName: t.shortName || t.name,
              tla: t.tla || '',
              crest: t.crest,
              league: code,
            });
          }
        }
      }
    } else if (key.startsWith('scorers:') && Array.isArray(entry.data.scorers)) {
      for (const s of entry.data.scorers) {
        const p = s.player;
        if (p && (p.name?.toLowerCase().includes(q) || p.nationality?.toLowerCase().includes(q))) {
          playerMap.set(p.id, {
            id: p.id,
            name: p.name,
            position: p.position || p.section || '-',
            nationality: p.nationality || '-',
            shirtNumber: p.shirtNumber || null,
            team: s.team,
            goals: s.goals ?? 0,
            assists: s.assists ?? 0,
          });
        }
      }
    }
  }

  return {
    competitions: base.competitions,
    teams: Array.from(teamMap.values()).slice(0, 12),
    players: Array.from(playerMap.values()).slice(0, 15),
  };
}

function clearMemoryCacheForTests() {
  memoryStore.clear();
  diskLoaded = true;
}

module.exports = {
  getCachedOrFetch,
  saveSnapshot,
  getCachedEntryMeta,
  listCachedSnapshotsSummary,
  searchCachedAndSeed,
  readFromLocalDisk,
  clearMemoryCacheForTests,
};
