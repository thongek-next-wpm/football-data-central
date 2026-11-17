const test = require('node:test');
const assert = require('node:assert/strict');
const { COMPETITIONS, resolveCompetitionCode } = require('../src/config/competitions');
const { getCurrentEuropeanSeason, extractSeasonMeta } = require('../src/config/season');
const { RateLimiter } = require('../src/services/rateLimiter');
const { hasActiveMatchWindow } = require('../src/jobs/syncJobs');
const {
  getCachedOrFetch,
  saveSnapshot,
  clearMemoryCacheForTests,
} = require('../src/services/cacheService');

test('Competition scope covers exact 8 European competitions and resolves aliases', () => {
  assert.equal(COMPETITIONS.length, 8);
  const top5 = COMPETITIONS.filter((c) => c.category === 'TOP_5_LEAGUE');
  const uefa = COMPETITIONS.filter((c) => c.category === 'UEFA_COMPETITION');
  assert.equal(top5.length, 5);
  assert.equal(uefa.length, 3);

  assert.equal(resolveCompetitionCode('pl'), 'PL');
  assert.equal(resolveCompetitionCode('EC'), 'UCL');
  assert.equal(resolveCompetitionCode('UECL'), 'UCL');
  assert.equal(resolveCompetitionCode('INVALID'), null);
});

test('Season helpers compute latest European season label cleanly', () => {
  const novSeason = getCurrentEuropeanSeason(new Date('2026-11-17T00:00:00Z'));
  assert.equal(novSeason.startYear, 2026);
  assert.equal(novSeason.label, '2026/27');

  const febSeason = getCurrentEuropeanSeason(new Date('2026-02-10T00:00:00Z'));
  assert.equal(febSeason.startYear, 2025);
  assert.equal(febSeason.label, '2025/26');

  const meta = extractSeasonMeta({ season: { startDate: '2025-08-15', endDate: '2026-05-24', currentMatchday: 32 } });
  assert.equal(meta.label, '2025/26');
  assert.equal(meta.currentMatchday, 32);
  assert.equal(meta.isLatest, true);
});

test('RateLimiter enforces sliding window and singleflight deduplication', async () => {
  const limiter = new RateLimiter({ maxRequestsPerWindow: 2, windowMs: 120, minSpacingMs: 20 });

  let executions = 0;
  const results = await Promise.all([
    limiter.dedupe('same-key', async () => {
      executions += 1;
      await new Promise((r) => setTimeout(r, 15));
      return { ok: true };
    }),
    limiter.dedupe('same-key', async () => {
      executions += 1;
      return { ok: false };
    }),
  ]);

  assert.equal(executions, 1);
  assert.deepEqual(results, [{ ok: true }, { ok: true }]);

  const start = Date.now();
  await Promise.all([
    limiter.schedule(async () => 1),
    limiter.schedule(async () => 2),
    limiter.schedule(async () => 3),
  ]);
  const elapsed = Date.now() - start;
  assert.ok(elapsed >= 100, `Expected 3rd request to wait for window reset, elapsed=${elapsed}ms`);
});

test('hasActiveMatchWindow detects live and imminent matches accurately', () => {
  const now = Date.now();
  assert.equal(hasActiveMatchWindow([{ status: 'IN_PLAY' }], now).active, true);
  assert.equal(
    hasActiveMatchWindow([{ status: 'TIMED', utcDate: new Date(now + 10 * 60 * 1000).toISOString() }], now).active,
    true
  );
  assert.equal(
    hasActiveMatchWindow([{ status: 'SCHEDULED', utcDate: new Date(now + 48 * 60 * 60 * 1000).toISOString() }], now).active,
    false
  );
});

test('Cache service serves fresh cache, falls back to stale cache on failure, and falls back to demo seed', async () => {
  clearMemoryCacheForTests();
  const prevKey = process.env.FOOTBALL_DATA_API_KEY;

  try {
    // 1. No API key -> serves demo seed cleanly
    process.env.FOOTBALL_DATA_API_KEY = 'your_football_data_org_api_key';
    const demoRes = await getCachedOrFetch(
      'test:standings:PL',
      3600,
      async () => {
        throw new Error('Should not call upstream without key');
      },
      { seedFallback: () => ({ table: [{ position: 1 }] }) }
    );
    assert.equal(demoRes.isDemo, true);
    assert.equal(demoRes.data.table[0].position, 1);

    // 2. Valid key -> caches fresh snapshot and reuses it without calling fetcher again
    process.env.FOOTBALL_DATA_API_KEY = 'valid_test_token_12345';
    let fetchCount = 0;
    const liveRes1 = await getCachedOrFetch(
      'test:live:PL',
      3600,
      async () => {
        fetchCount += 1;
        return { live: true, count: fetchCount };
      }
    );
    const liveRes2 = await getCachedOrFetch(
      'test:live:PL',
      3600,
      async () => {
        fetchCount += 1;
        return { live: true, count: fetchCount };
      }
    );
    assert.equal(fetchCount, 1);
    assert.equal(liveRes1.source, 'api');
    assert.equal(liveRes2.source, 'local-cache');

    // 3. Expired snapshot + upstream failure -> returns stale fallback instead of failing
    await saveSnapshot('test:stale:PL', -10, { cached: 'stale-ok' });
    const staleRes = await getCachedOrFetch(
      'test:stale:PL',
      3600,
      async () => {
        throw new Error('Upstream 429');
      }
    );
    assert.equal(staleRes.stale, true);
    assert.equal(staleRes.source, 'local-fallback');
    assert.deepEqual(staleRes.data, { cached: 'stale-ok' });
  } finally {
    process.env.FOOTBALL_DATA_API_KEY = prevKey;
    clearMemoryCacheForTests();
  }
});
