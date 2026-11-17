const cron = require('node-cron');
const { COMPETITIONS } = require('../config/competitions');
const { recordSyncLog } = require('../config/db');
const { fetchStandings, fetchMatches, fetchScorers, isApiKeyConfigured } = require('../services/footballApi');
const { saveSnapshot, getCachedEntryMeta, readFromLocalDisk } = require('../services/cacheService');
const { getSeedMatches } = require('../data/seedData');

const STANDINGS_TTL = Number(process.env.CACHE_TTL_STANDINGS) || 7200; // 2 hours
const MATCHES_ACTIVE_TTL = Number(process.env.CACHE_TTL_MATCHES_ACTIVE) || 480; // 8 mins
const MATCHES_IDLE_TTL = Number(process.env.CACHE_TTL_MATCHES_IDLE) || 3600; // 1 hour
const SCORERS_TTL = Number(process.env.CACHE_TTL_PLAYERS) || 14400; // 4 hours

let syncInProgress = false;
let lastStandingsSyncAt = null;
let lastMatchesSyncAt = null;

/**
 * Determines whether a competition currently has an active match window
 * (any live/in-play match, or a match scheduled within [now - 180m, now + 30m]).
 */
function hasActiveMatchWindow(matches = [], nowMs = Date.now()) {
  const activeStatuses = new Set(['LIVE', 'IN_PLAY', 'PAUSED', 'HALFTIME']);
  const windowStart = nowMs - 180 * 60 * 1000;
  const windowEnd = nowMs + 30 * 60 * 1000;

  for (const m of matches) {
    if (activeStatuses.has(m.status)) {
      return { active: true, reason: `Live match (${m.homeTeam?.shortName || m.homeTeam?.name} vs ${m.awayTeam?.shortName || m.awayTeam?.name})` };
    }
    if (m.utcDate && (m.status === 'SCHEDULED' || m.status === 'TIMED')) {
      const kickoffMs = new Date(m.utcDate).getTime();
      if (!Number.isNaN(kickoffMs) && kickoffMs >= windowStart && kickoffMs <= windowEnd) {
        return { active: true, reason: 'Upcoming or ongoing scheduled match window' };
      }
    }
  }
  return { active: false, reason: 'No active or imminent matches' };
}

function getCompetitionMatchesForWindowCheck(code) {
  const cached = readFromLocalDisk(`matches:${code}`, { allowStale: true });
  if (cached?.data?.matches) return cached.data.matches;
  return getSeedMatches(code)?.matches || [];
}

function getGlobalMatchWindowStatus() {
  const activeCompetitions = [];
  for (const comp of COMPETITIONS) {
    const matches = getCompetitionMatchesForWindowCheck(comp.code);
    const check = hasActiveMatchWindow(matches);
    if (check.active) {
      activeCompetitions.push({ code: comp.code, reason: check.reason });
    }
  }
  return {
    active: activeCompetitions.length > 0,
    activeCompetitions,
    recommendedMatchTtlSeconds: activeCompetitions.length > 0 ? MATCHES_ACTIVE_TTL : MATCHES_IDLE_TTL,
  };
}

async function syncCompetitionStandingsAndScorers(comp) {
  const startedAt = Date.now();
  try {
    const standingsData = await fetchStandings(comp.code, { priority: 'normal' });
    await saveSnapshot(`standings:${comp.code}`, STANDINGS_TTL, standingsData, {
      category: 'standings',
      competitionCode: comp.code,
    });

    const scorersData = await fetchScorers(comp.code, 20, { priority: 'normal' });
    await saveSnapshot(`scorers:${comp.code}`, SCORERS_TTL, scorersData, {
      category: 'scorers',
      competitionCode: comp.code,
    });

    await recordSyncLog({
      jobName: 'syncStandingsAndScorers',
      competitionCode: comp.code,
      status: 'SUCCESS',
      source: 'api',
      detail: 'Standings and top scorers updated',
      durationMs: Date.now() - startedAt,
    });
  } catch (err) {
    await recordSyncLog({
      jobName: 'syncStandingsAndScorers',
      competitionCode: comp.code,
      status: err.code === 'API_TIER_RESTRICTED' ? 'SKIPPED_TIER' : 'ERROR',
      source: 'api',
      detail: err.message,
      durationMs: Date.now() - startedAt,
    });
  }
}

async function syncAllStandings() {
  if (!isApiKeyConfigured() || syncInProgress) return;
  syncInProgress = true;
  console.log('[Cron] Syncing standings & scorers via rate-limited queue...');
  try {
    for (const comp of COMPETITIONS) {
      await syncCompetitionStandingsAndScorers(comp);
    }
    lastStandingsSyncAt = new Date().toISOString();
  } finally {
    syncInProgress = false;
  }
}

async function syncMatchesSmart() {
  if (!isApiKeyConfigured() || syncInProgress) return;
  syncInProgress = true;

  try {
    const windowStatus = getGlobalMatchWindowStatus();
    const targetComps = windowStatus.active
      ? COMPETITIONS.filter((c) => windowStatus.activeCompetitions.some((a) => a.code === c.code))
      : COMPETITIONS.filter((c) => {
          const meta = getCachedEntryMeta(`matches:${c.code}`);
          if (!meta) return true;
          const ageSec = (Date.now() - new Date(meta.updatedAt).getTime()) / 1000;
          return ageSec >= MATCHES_IDLE_TTL;
        });

    if (targetComps.length === 0) return;

    console.log(
      `[Cron] Smart match sync (${windowStatus.active ? 'ACTIVE MATCH WINDOW' : 'IDLE WINDOW'}) for: ${targetComps.map((c) => c.code).join(', ')}`
    );

    const ttl = windowStatus.active ? MATCHES_ACTIVE_TTL : MATCHES_IDLE_TTL;

    for (const comp of targetComps) {
      const startedAt = Date.now();
      try {
        const data = await fetchMatches(comp.code, {}, { priority: 'normal' });
        await saveSnapshot(`matches:${comp.code}`, ttl, data, {
          category: 'matches',
          competitionCode: comp.code,
        });
        await recordSyncLog({
          jobName: 'syncMatchesSmart',
          competitionCode: comp.code,
          status: 'SUCCESS',
          source: 'api',
          detail: windowStatus.active ? 'Active match window sync' : 'Idle refresh sync',
          durationMs: Date.now() - startedAt,
        });
      } catch (err) {
        await recordSyncLog({
          jobName: 'syncMatchesSmart',
          competitionCode: comp.code,
          status: err.code === 'API_TIER_RESTRICTED' ? 'SKIPPED_TIER' : 'ERROR',
          source: 'api',
          detail: err.message,
          durationMs: Date.now() - startedAt,
        });
      }
    }

    lastMatchesSyncAt = new Date().toISOString();
  } finally {
    syncInProgress = false;
  }
}

function startSyncJobs() {
  // Standings & Scorers every 2 hours (within 1-6h recommendation)
  cron.schedule('0 */2 * * *', syncAllStandings);

  // Match-window-aware check every 5 minutes (only syncs frequently during active match windows)
  cron.schedule('*/5 * * * *', syncMatchesSmart);

  console.log('[Cron] Scheduled sync jobs registered (Standings: 2h, Matches: 5m window-aware)');

  // Warm up free-tier competitions gently if API key is configured and cache is cold
  if (isApiKeyConfigured()) {
    setTimeout(async () => {
      const hasPL = getCachedEntryMeta('standings:PL');
      if (!hasPL) {
        console.log('[Warmup] Cold cache detected with API key configured; scheduling background warmup...');
        await syncAllStandings();
        await syncMatchesSmart();
      }
    }, 2500);
  }
}

function getSyncStatus() {
  return {
    apiKeyConfigured: isApiKeyConfigured(),
    syncInProgress,
    lastStandingsSyncAt,
    lastMatchesSyncAt,
    matchWindow: getGlobalMatchWindowStatus(),
    ttlConfig: {
      standingsSeconds: STANDINGS_TTL,
      matchesActiveSeconds: MATCHES_ACTIVE_TTL,
      matchesIdleSeconds: MATCHES_IDLE_TTL,
      scorersSeconds: SCORERS_TTL,
    },
  };
}

module.exports = {
  startSyncJobs,
  syncAllStandings,
  syncMatchesSmart,
  hasActiveMatchWindow,
  getGlobalMatchWindowStatus,
  getSyncStatus,
};
