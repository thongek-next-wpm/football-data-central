const express = require('express');
const {
  COMPETITIONS,
  resolveCompetitionCode,
  getCompetitionByCode,
} = require('../config/competitions');
const { getCurrentEuropeanSeason, extractSeasonMeta } = require('../config/season');
const { getDbStatus, getRecentSyncLogs } = require('../config/db');
const { getRedisStatus } = require('../config/redis');
const {
  isApiKeyConfigured,
  fetchStandings,
  fetchMatches,
  fetchScorers,
  fetchCompetitionTeams,
  fetchTeam,
  fetchTeamMatches,
  fetchPlayer,
  fetchPlayerMatches,
  fetchMatch,
  fetchMatchHead2Head,
} = require('../services/footballApi');
const {
  getCachedOrFetch,
  getCachedEntryMeta,
  listCachedSnapshotsSummary,
  searchCachedAndSeed,
  readFromLocalDisk,
  saveSnapshot,
} = require('../services/cacheService');
const { rateLimiter } = require('../services/rateLimiter');
const { getSyncStatus } = require('../jobs/syncJobs');
const {
  buildTeamRatings,
  predictMatchOutcome,
  runSupercomputerSimulation,
  predictSingleMatchFromStandings,
} = require('../services/supercomputer');
const {
  buildCrestSvgDataUri,
  getSeedStandings,
  getSeedMatches,
  getSeedScorers,
  getSeedCompetitionTeams,
  getSeedTeam,
  getSeedTeamMatches,
  getSeedPlayer,
  getSeedPlayerMatches,
  getSeedMatch,
  getSeedMatchHead2Head,
} = require('../data/seedData');

const router = express.Router();

const STANDINGS_TTL = Number(process.env.CACHE_TTL_STANDINGS) || 7200;
const TEAMS_TTL = Number(process.env.CACHE_TTL_TEAMS) || 21600;
const PLAYERS_TTL = Number(process.env.CACHE_TTL_PLAYERS) || 14400;
const MATCHES_TTL = Number(process.env.CACHE_TTL_MATCHES_ACTIVE) || 600;

const manualSyncCooldown = new Map();
const supercomputerMemo = new Map();

function getCachedSimulation(code, standingsRes, matchesRes, { simulations = 10000, seedOffset = 0 } = {}) {
  const memoKey = `${code}:${standingsRes?.updatedAt || 'seed'}:${matchesRes?.updatedAt || 'seed'}:${simulations}:${seedOffset}`;
  if (supercomputerMemo.has(memoKey)) {
    return supercomputerMemo.get(memoKey);
  }
  const result = runSupercomputerSimulation(code, standingsRes?.data, matchesRes?.data, {
    simulations,
    seedOffset,
  });
  if (supercomputerMemo.size > 60) {
    supercomputerMemo.clear();
  }
  supercomputerMemo.set(memoKey, result);
  return result;
}

function buildPlayerStatsFromScorers(personId, playerMatchesData) {
  const pid = Number(personId);
  const stats = {
    playedMatches: 0,
    goals: 0,
    assists: 0,
    penalties: 0,
    competitions: [],
  };

  for (const comp of COMPETITIONS) {
    const cached = readFromLocalDisk(`scorers:${comp.code}`, { allowStale: true });
    const scorers = cached?.data?.scorers || getSeedScorers(comp.code, 50)?.scorers || [];
    const hit = scorers.find((s) => Number(s.player?.id) === pid);
    if (hit) {
      stats.playedMatches += hit.playedMatches || 0;
      stats.goals += hit.goals || 0;
      stats.assists += hit.assists || 0;
      stats.penalties += hit.penalties || 0;
      stats.competitions.push({
        code: comp.code,
        name: comp.name,
        thaiName: comp.thaiName,
        playedMatches: hit.playedMatches || 0,
        goals: hit.goals || 0,
        assists: hit.assists || 0,
        penalties: hit.penalties || 0,
      });
    }
  }

  if (stats.playedMatches === 0 && playerMatchesData?.aggregations) {
    stats.playedMatches = playerMatchesData.aggregations.matchesOnPitch || 0;
    stats.goals = playerMatchesData.aggregations.goals || 0;
    stats.assists = playerMatchesData.aggregations.assists || 0;
  }

  return stats;
}

router.get('/health', (req, res) => {
  const db = getDbStatus();
  const redis = getRedisStatus();
  res.json({
    status: 'ok',
    service: 'fdc-backend',
    authRequired: false,
    apiKeyConfigured: isApiKeyConfigured(),
    mode: isApiKeyConfigured() ? 'live-api-with-cache' : 'demo-seed-fallback',
    dbConnected: db.connected,
    redisConnected: redis.connected,
    timestamp: new Date().toISOString(),
  });
});

router.get('/system/status', (req, res) => {
  res.json({
    authRequired: false,
    apiProvider: 'football-data.org (v4)',
    dataLatencyNotice:
      'ข้อมูลจาก football-data.org Free Tier จำกัดที่ 10 requests/นาที และผลบอลสดอาจมีดีเลย์เล็กน้อย ระบบจึงใช้ Backend Caching (Redis + PostgreSQL + Local Snapshot) เป็นตัวกลางทั้งหมด',
    redis: getRedisStatus(),
    postgres: getDbStatus(),
    rateLimiter: rateLimiter.getStats(),
    sync: getSyncStatus(),
    snapshots: listCachedSnapshotsSummary().slice(0, 40),
    recentLogs: getRecentSyncLogs().slice(0, 20),
  });
});

router.get('/competitions', (req, res) => {
  res.json({
    competitions: COMPETITIONS,
    groups: {
      top5Leagues: COMPETITIONS.filter((c) => c.category === 'TOP_5_LEAGUE'),
      uefaCompetitions: COMPETITIONS.filter((c) => c.category === 'UEFA_COMPETITION'),
    },
  });
});

router.get('/overview', async (req, res) => {
  try {
    const competitionSummaries = [];
    const allMatches = [];
    const sources = new Set();
    let anyDemo = false;

    for (const comp of COMPETITIONS) {
      // Read from cache if warm; otherwise serve seed immediately on overview without blocking on 24 API calls
      const standingsSnap = readFromLocalDisk(`standings:${comp.code}`, { allowStale: true });
      const matchesSnap = readFromLocalDisk(`matches:${comp.code}`, { allowStale: true });
      const scorersSnap = readFromLocalDisk(`scorers:${comp.code}`, { allowStale: true });

      const standingsRes = standingsSnap || {
        source: 'demo-seed',
        isDemo: true,
        updatedAt: new Date().toISOString(),
        data: getSeedStandings(comp.code),
      };
      const matchesRes = matchesSnap || {
        source: 'demo-seed',
        isDemo: true,
        updatedAt: new Date().toISOString(),
        data: getSeedMatches(comp.code),
      };
      const scorersRes = scorersSnap || {
        source: 'demo-seed',
        isDemo: true,
        updatedAt: new Date().toISOString(),
        data: getSeedScorers(comp.code, 5),
      };

      sources.add(standingsRes.source);
      if (standingsRes.isDemo || matchesRes.isDemo) anyDemo = true;

      const table = standingsRes.data?.standings?.[0]?.table || [];
      const leader = table[0] || null;
      const topScorer = scorersRes.data?.scorers?.[0] || null;
      const compMatches = (matchesRes.data?.matches || []).map((m) => ({
        ...m,
        competitionMeta: comp,
      }));
      allMatches.push(...compMatches);

      competitionSummaries.push({
        ...comp,
        leader: leader
          ? {
              position: leader.position,
              points: leader.points,
              playedGames: leader.playedGames,
              goalDifference: leader.goalDifference,
              team: leader.team,
            }
          : null,
        topScorer: topScorer
          ? {
              player: topScorer.player,
              team: topScorer.team,
              goals: topScorer.goals,
              assists: topScorer.assists,
            }
          : null,
        matchCount: compMatches.length,
        source: standingsRes.source,
        updatedAt: standingsRes.updatedAt,
      });
    }

    const liveStatuses = new Set(['LIVE', 'IN_PLAY', 'PAUSED', 'HALFTIME']);
    const liveMatches = allMatches.filter((m) => liveStatuses.has(m.status));
    const recentResults = allMatches
      .filter((m) => m.status === 'FINISHED')
      .sort((a, b) => new Date(b.utcDate) - new Date(a.utcDate))
      .slice(0, 8);
    const upcomingFixtures = allMatches
      .filter((m) => m.status === 'SCHEDULED' || m.status === 'TIMED')
      .sort((a, b) => new Date(a.utcDate) - new Date(b.utcDate))
      .slice(0, 8);

    res.json({
      competitions: competitionSummaries,
      highlights: {
        liveMatches,
        recentResults,
        upcomingFixtures,
      },
      meta: {
        isDemo: anyDemo,
        apiKeyConfigured: isApiKeyConfigured(),
        sources: Array.from(sources),
        seasonMeta: extractSeasonMeta(
          { season: competitionSummaries.length > 0 ? undefined : null },
          'latest'
        ),
        currentSeason: getCurrentEuropeanSeason(),
        rateLimiter: rateLimiter.getStats(),
      },
    });
  } catch (err) {
    res.status(500).json({ error: 'Unable to build overview', detail: err.message });
  }
});

function resolveSeasonQuery(rawSeason) {
  if (!rawSeason || String(rawSeason).toLowerCase() === 'latest') {
    return { requestedSeason: 'latest', upstreamParams: {}, keySuffix: '' };
  }
  const clean = String(rawSeason).trim();
  if (/^\d{4}$/.test(clean)) {
    return { requestedSeason: clean, upstreamParams: { season: clean }, keySuffix: `:${clean}` };
  }
  return { requestedSeason: 'latest', upstreamParams: {}, keySuffix: '' };
}

router.get('/competitions/:code/standings', async (req, res) => {
  const code = resolveCompetitionCode(req.params.code);
  if (!code) {
    return res.status(404).json({ error: 'Unsupported competition code', requested: req.params.code });
  }

  const competition = getCompetitionByCode(code);
  const { requestedSeason, upstreamParams, keySuffix } = resolveSeasonQuery(req.query.season);
  try {
    const result = await getCachedOrFetch(
      `standings:${code}${keySuffix}`,
      STANDINGS_TTL,
      () => fetchStandings(code, { priority: 'high' }, upstreamParams),
      {
        meta: { category: 'standings', competitionCode: code },
        seedFallback: () => getSeedStandings(code),
      }
    );
    res.json({
      ...result,
      competitionMeta: competition,
      seasonMeta: extractSeasonMeta(result.data, requestedSeason),
    });
  } catch (err) {
    res.status(502).json({ error: 'Unable to load standings', detail: err.message });
  }
});

router.get('/competitions/:code/matches', async (req, res) => {
  const code = resolveCompetitionCode(req.params.code);
  if (!code) {
    return res.status(404).json({ error: 'Unsupported competition code', requested: req.params.code });
  }

  const competition = getCompetitionByCode(code);
  const { status, matchday, teamId, season } = req.query;
  const { requestedSeason, upstreamParams, keySuffix } = resolveSeasonQuery(season);

  try {
    const result = await getCachedOrFetch(
      `matches:${code}${keySuffix}`,
      MATCHES_TTL,
      () => fetchMatches(code, upstreamParams, { priority: 'high' }),
      {
        meta: { category: 'matches', competitionCode: code },
        seedFallback: () => getSeedMatches(code),
      }
    );

    let matches = result.data?.matches || [];
    if (status) {
      const upperStatus = String(status).toUpperCase();
      if (upperStatus === 'LIVE') {
        matches = matches.filter((m) => ['LIVE', 'IN_PLAY', 'PAUSED', 'HALFTIME'].includes(m.status));
      } else if (upperStatus === 'UPCOMING') {
        matches = matches.filter((m) => ['SCHEDULED', 'TIMED'].includes(m.status));
      } else {
        matches = matches.filter((m) => m.status === upperStatus);
      }
    }
    if (matchday) {
      matches = matches.filter((m) => Number(m.matchday) === Number(matchday));
    }
    if (teamId) {
      const tid = Number(teamId);
      matches = matches.filter((m) => m.homeTeam?.id === tid || m.awayTeam?.id === tid);
    }

    res.json({
      ...result,
      competitionMeta: competition,
      seasonMeta: extractSeasonMeta(result.data, requestedSeason),
      data: {
        ...result.data,
        matches,
      },
    });
  } catch (err) {
    res.status(502).json({ error: 'Unable to load matches', detail: err.message });
  }
});

router.get('/competitions/:code/scorers', async (req, res) => {
  const code = resolveCompetitionCode(req.params.code);
  if (!code) {
    return res.status(404).json({ error: 'Unsupported competition code', requested: req.params.code });
  }

  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
  const competition = getCompetitionByCode(code);
  const { requestedSeason, upstreamParams, keySuffix } = resolveSeasonQuery(req.query.season);

  try {
    const result = await getCachedOrFetch(
      `scorers:${code}${keySuffix}`,
      PLAYERS_TTL,
      () => fetchScorers(code, 30, { priority: 'high' }, upstreamParams),
      {
        meta: { category: 'scorers', competitionCode: code },
        seedFallback: () => getSeedScorers(code, 30),
      }
    );

    const scorers = (result.data?.scorers || []).slice(0, limit);
    res.json({
      ...result,
      competitionMeta: competition,
      seasonMeta: extractSeasonMeta(result.data, requestedSeason),
      data: {
        ...result.data,
        scorers,
      },
    });
  } catch (err) {
    res.status(502).json({ error: 'Unable to load top scorers', detail: err.message });
  }
});

router.get('/competitions/:code/teams', async (req, res) => {
  const code = resolveCompetitionCode(req.params.code);
  if (!code) {
    return res.status(404).json({ error: 'Unsupported competition code', requested: req.params.code });
  }

  const competition = getCompetitionByCode(code);
  try {
    const result = await getCachedOrFetch(
      `teams:${code}`,
      TEAMS_TTL,
      () => fetchCompetitionTeams(code, { priority: 'high' }),
      {
        meta: { category: 'teams', competitionCode: code },
        seedFallback: () => getSeedCompetitionTeams(code),
      }
    );
    res.json({ ...result, competitionMeta: competition });
  } catch (err) {
    res.status(502).json({ error: 'Unable to load competition teams', detail: err.message });
  }
});

router.get('/matches', (req, res) => {
  const { code, status, search } = req.query;
  const targetComps = code
    ? [getCompetitionByCode(code)].filter(Boolean)
    : COMPETITIONS;

  if (code && targetComps.length === 0) {
    return res.status(404).json({ error: 'Unsupported competition code', requested: code });
  }

  const allMatches = [];
  let anyDemo = false;
  const sources = new Set();

  for (const comp of targetComps) {
    const snap = readFromLocalDisk(`matches:${comp.code}`, { allowStale: true });
    const entry = snap || { source: 'demo-seed', isDemo: true, data: getSeedMatches(comp.code) };
    sources.add(entry.source);
    if (entry.isDemo) anyDemo = true;

    for (const m of entry.data?.matches || []) {
      allMatches.push({ ...m, competitionMeta: comp });
    }
  }

  let filtered = allMatches;
  if (status) {
    const upper = String(status).toUpperCase();
    if (upper === 'LIVE') {
      filtered = filtered.filter((m) => ['LIVE', 'IN_PLAY', 'PAUSED', 'HALFTIME'].includes(m.status));
    } else if (upper === 'UPCOMING') {
      filtered = filtered.filter((m) => ['SCHEDULED', 'TIMED'].includes(m.status));
    } else {
      filtered = filtered.filter((m) => m.status === upper);
    }
  }

  if (search) {
    const q = String(search).trim().toLowerCase();
    filtered = filtered.filter(
      (m) =>
        m.homeTeam?.name?.toLowerCase().includes(q) ||
        m.homeTeam?.shortName?.toLowerCase().includes(q) ||
        m.awayTeam?.name?.toLowerCase().includes(q) ||
        m.awayTeam?.shortName?.toLowerCase().includes(q)
    );
  }

  filtered.sort((a, b) => new Date(a.utcDate) - new Date(b.utcDate));

  res.json({
    source: anyDemo && sources.size === 1 ? 'demo-seed' : Array.from(sources).join(','),
    isDemo: anyDemo,
    seasonMeta: extractSeasonMeta(null, 'latest'),
    count: filtered.length,
    data: { matches: filtered },
  });
});

router.get('/matches/:id', async (req, res) => {
  const matchId = req.params.id;
  try {
    const [matchResult, h2hResult] = await Promise.all([
      getCachedOrFetch(
        `match:${matchId}`,
        MATCHES_TTL,
        () => fetchMatch(matchId, { priority: 'high' }),
        {
          meta: { category: 'match' },
          seedFallback: () => getSeedMatch(matchId),
        }
      ),
      getCachedOrFetch(
        `match-h2h:${matchId}`,
        TEAMS_TTL,
        () => fetchMatchHead2Head(matchId, 10, { priority: 'normal' }),
        {
          meta: { category: 'head2head' },
          seedFallback: () => getSeedMatchHead2Head(matchId),
        }
      ).catch(() => null),
    ]);

    if (!matchResult?.data) {
      return res.status(404).json({ error: 'Match not found' });
    }

    const matchObj = matchResult.data;
    const compCode = resolveCompetitionCode(matchObj.competition?.code);
    let supercomputer = null;
    if (compCode) {
      const sSnap = readFromLocalDisk(`standings:${compCode}`, { allowStale: true });
      const standingsPayload = sSnap?.data || getSeedStandings(compCode);
      supercomputer = predictSingleMatchFromStandings(matchObj, standingsPayload);
    }

    res.json({
      ...matchResult,
      data: {
        match: matchObj,
        head2head: h2hResult?.data || null,
        supercomputer,
      },
    });
  } catch (err) {
    res.status(err.code === 'API_NOT_FOUND' ? 404 : 502).json({
      error: 'Unable to load match detail',
      detail: err.message,
    });
  }
});

router.get('/teams/:id', async (req, res) => {
  const teamId = req.params.id;
  try {
    const [teamResult, matchesResult] = await Promise.all([
      getCachedOrFetch(
        `team:${teamId}`,
        TEAMS_TTL,
        () => fetchTeam(teamId, { priority: 'high' }),
        {
          meta: { category: 'team' },
          seedFallback: () => getSeedTeam(teamId),
        }
      ),
      getCachedOrFetch(
        `team-matches:${teamId}`,
        MATCHES_TTL,
        () => fetchTeamMatches(teamId, { limit: 20 }, { priority: 'normal' }),
        {
          meta: { category: 'team-matches' },
          seedFallback: () => getSeedTeamMatches(teamId),
        }
      ).catch(() => null),
    ]);

    if (!teamResult?.data) {
      return res.status(404).json({ error: 'Team not found' });
    }

    // Collect standing snapshots & team scorers from cache/seed
    const standingsPositions = [];
    const teamScorers = [];
    const supercomputerProjections = [];
    const tid = Number(teamId);

    for (const comp of COMPETITIONS) {
      const sSnap = readFromLocalDisk(`standings:${comp.code}`, { allowStale: true });
      const standingsPayload = sSnap?.data || (!isApiKeyConfigured() || !comp.freeTierAvailable ? getSeedStandings(comp.code) : null);
      const totalTable = standingsPayload?.standings?.find((s) => s.type === 'TOTAL')?.table || standingsPayload?.standings?.[0]?.table || [];
      const row = totalTable.find((r) => Number(r.team?.id) === tid);
      if (row) {
        standingsPositions.push({
          competition: comp,
          ...row,
        });

        const mSnap = readFromLocalDisk(`matches:${comp.code}`, { allowStale: true });
        const matchesPayload = mSnap?.data || getSeedMatches(comp.code);
        const sim = getCachedSimulation(
          comp.code,
          { updatedAt: sSnap?.updatedAt || 'seed', data: standingsPayload },
          { updatedAt: mSnap?.updatedAt || 'seed', data: matchesPayload }
        );
        const simRow = sim.table.find((r) => Number(r.team?.id) === tid);
        if (simRow) {
          supercomputerProjections.push({ competition: comp, ...simRow });
        }
      }

      const scSnap = readFromLocalDisk(`scorers:${comp.code}`, { allowStale: true });
      const scPayload = scSnap?.data || (!isApiKeyConfigured() || !comp.freeTierAvailable ? getSeedScorers(comp.code, 40) : null);
      for (const s of scPayload?.scorers || []) {
        if (Number(s.team?.id) === tid) {
          teamScorers.push({ competition: comp, ...s });
        }
      }
    }

    // Attach quick seasonal stats to squad members when available
    const squadWithStats = (teamResult.data.squad || []).map((player) => {
      const seedPlayer = getSeedPlayer(player.id);
      const scorerMatch = teamScorers.find((ts) => Number(ts.player?.id) === Number(player.id));
      return {
        ...player,
        stats: scorerMatch
          ? {
              playedMatches: scorerMatch.playedMatches,
              goals: scorerMatch.goals,
              assists: scorerMatch.assists,
              penalties: scorerMatch.penalties,
            }
          : seedPlayer?.seasonStats || null,
      };
    });

    res.json({
      ...teamResult,
      data: {
        ...teamResult.data,
        squad: squadWithStats,
        matches: matchesResult?.data?.matches || [],
        standingsPositions,
        teamScorers,
        supercomputer: supercomputerProjections,
      },
    });
  } catch (err) {
    res.status(err.code === 'API_NOT_FOUND' ? 404 : 502).json({
      error: 'Unable to load team profile',
      detail: err.message,
    });
  }
});

router.get('/teams/:id/matches', async (req, res) => {
  const teamId = req.params.id;
  try {
    const result = await getCachedOrFetch(
      `team-matches:${teamId}`,
      MATCHES_TTL,
      () => fetchTeamMatches(teamId, { limit: 25 }, { priority: 'high' }),
      {
        meta: { category: 'team-matches' },
        seedFallback: () => getSeedTeamMatches(teamId),
      }
    );
    if (!result?.data) {
      return res.status(404).json({ error: 'Team matches not found' });
    }
    res.json(result);
  } catch (err) {
    res.status(502).json({ error: 'Unable to load team matches', detail: err.message });
  }
});

router.get('/players', async (req, res) => {
  const { code, position, search } = req.query;
  const targetComps = code ? [getCompetitionByCode(code)].filter(Boolean) : COMPETITIONS;
  if (code && targetComps.length === 0) {
    return res.status(404).json({ error: 'Unsupported competition code', requested: code });
  }

  const playersMap = new Map();
  let anyDemo = false;
  const sources = new Set();

  for (const comp of targetComps) {
    let entry = readFromLocalDisk(`scorers:${comp.code}`, { allowStale: true });
    if (!entry && code) {
      entry = await getCachedOrFetch(
        `scorers:${comp.code}`,
        PLAYERS_TTL,
        () => fetchScorers(comp.code, 30, { priority: 'high' }),
        {
          meta: { category: 'scorers', competitionCode: comp.code },
          seedFallback: () => getSeedScorers(comp.code, 30),
        }
      ).catch(() => null);
    }
    if (!entry) {
      entry = { source: 'demo-seed', isDemo: true, data: getSeedScorers(comp.code, 30) };
    }

    sources.add(entry.source);
    if (entry.isDemo) anyDemo = true;

    for (const s of entry.data?.scorers || []) {
      const pid = s.player?.id;
      if (!pid) continue;
      if (!playersMap.has(pid)) {
        playersMap.set(pid, {
          ...s,
          competition: comp,
        });
      }
    }
  }

  let list = Array.from(playersMap.values());
  if (position && position !== 'ALL') {
    const posQuery = String(position).toLowerCase();
    list = list.filter((item) => {
      const p = (item.player?.position || item.player?.section || '').toLowerCase();
      if (posQuery === 'forward') return p.includes('forward') || p.includes('winger') || p.includes('striker') || p.includes('offence');
      if (posQuery === 'midfield') return p.includes('midfield');
      if (posQuery === 'defence') return p.includes('back') || p.includes('defence');
      if (posQuery === 'goalkeeper') return p.includes('goalkeeper');
      return p.includes(posQuery);
    });
  }

  if (search) {
    const q = String(search).trim().toLowerCase();
    list = list.filter(
      (item) =>
        item.player?.name?.toLowerCase().includes(q) ||
        item.team?.name?.toLowerCase().includes(q) ||
        item.team?.shortName?.toLowerCase().includes(q) ||
        item.player?.nationality?.toLowerCase().includes(q)
    );
  }

  list.sort((a, b) => (b.goals || 0) - (a.goals || 0) || (b.assists || 0) - (a.assists || 0));

  res.json({
    source: anyDemo && sources.size === 1 ? 'demo-seed' : Array.from(sources).join(','),
    isDemo: anyDemo,
    seasonMeta: extractSeasonMeta(null, 'latest'),
    count: list.length,
    data: { scorers: list },
  });
});

router.get('/players/:id', async (req, res) => {
  const personId = req.params.id;
  try {
    const [playerResult, matchesResult] = await Promise.all([
      getCachedOrFetch(
        `player:${personId}`,
        PLAYERS_TTL,
        () => fetchPlayer(personId, { priority: 'high' }),
        {
          meta: { category: 'player' },
          seedFallback: () => getSeedPlayer(personId),
        }
      ),
      getCachedOrFetch(
        `player-matches:${personId}`,
        MATCHES_TTL,
        () => fetchPlayerMatches(personId, { limit: 15 }, { priority: 'normal' }),
        {
          meta: { category: 'player-matches' },
          seedFallback: () => getSeedPlayerMatches(personId),
        }
      ).catch(() => null),
    ]);

    if (!playerResult?.data) {
      return res.status(404).json({ error: 'Player not found' });
    }

    const basePlayer = playerResult.data;
    const computedStats = basePlayer.seasonStats || buildPlayerStatsFromScorers(personId, matchesResult?.data);

    res.json({
      ...playerResult,
      data: {
        ...basePlayer,
        seasonStats: computedStats,
        aggregations: matchesResult?.data?.aggregations || null,
        matches: matchesResult?.data?.matches || [],
      },
    });
  } catch (err) {
    res.status(err.code === 'API_NOT_FOUND' ? 404 : 502).json({
      error: 'Unable to load player profile',
      detail: err.message,
    });
  }
});

router.get('/search', (req, res) => {
  const q = req.query.q || '';
  if (String(q).trim().length < 2) {
    return res.json({ query: q, competitions: [], teams: [], players: [] });
  }
  const results = searchCachedAndSeed(q);
  res.json({ query: q, ...results });
});

router.get('/crests/:tla', (req, res) => {
  const tla = String(req.params.tla || 'FDC').slice(0, 4).toUpperCase();
  const c1 = req.query.c1 || '#10b981';
  const c2 = req.query.c2 || '#0f172a';
  const uri = buildCrestSvgDataUri(tla, [c1, c2]);
  const svg = decodeURIComponent(uri.replace('data:image/svg+xml;utf8,', ''));
  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.send(svg);
});

router.post('/system/sync/:code', async (req, res) => {
  const code = resolveCompetitionCode(req.params.code);
  if (!code) {
    return res.status(404).json({ error: 'Unsupported competition code' });
  }

  if (!isApiKeyConfigured()) {
    return res.status(200).json({
      synced: false,
      mode: 'demo',
      message: 'FOOTBALL_DATA_API_KEY ยังไม่ได้ตั้งค่า ระบบกำลังแสดงข้อมูล Demo',
    });
  }

  const lastAt = manualSyncCooldown.get(code) || 0;
  if (Date.now() - lastAt < 60000) {
    return res.status(429).json({
      error: 'Sync cooldown active',
      detail: 'กรุณารอสักครู่ (คูลดาวน์ 60 วินาทีต่อรายการ) เพื่อป้องกัน API Rate Limit',
    });
  }

  manualSyncCooldown.set(code, Date.now());
  try {
    const standingsData = await fetchStandings(code, { priority: 'high' });
    await saveSnapshot(`standings:${code}`, STANDINGS_TTL, standingsData, {
      category: 'standings',
      competitionCode: code,
    });
    const matchesData = await fetchMatches(code, {}, { priority: 'high' });
    await saveSnapshot(`matches:${code}`, MATCHES_TTL, matchesData, {
      category: 'matches',
      competitionCode: code,
    });

    res.json({
      synced: true,
      code,
      updatedAt: new Date().toISOString(),
      meta: getCachedEntryMeta(`standings:${code}`),
    });
  } catch (err) {
    res.status(err.httpStatus === 403 ? 403 : 502).json({
      synced: false,
      code,
      error: err.message,
    });
  }
});

router.get('/supercomputer', (req, res) => {
  const favorites = [];
  const featuredMatches = [];
  let anyDemo = false;

  for (const comp of COMPETITIONS) {
    const sSnap = readFromLocalDisk(`standings:${comp.code}`, { allowStale: true });
    const mSnap = readFromLocalDisk(`matches:${comp.code}`, { allowStale: true });

    const standingsRes = sSnap || { source: 'demo-seed', isDemo: true, updatedAt: 'seed', data: getSeedStandings(comp.code) };
    const matchesRes = mSnap || { source: 'demo-seed', isDemo: true, updatedAt: 'seed', data: getSeedMatches(comp.code) };
    if (standingsRes.isDemo || matchesRes.isDemo) anyDemo = true;

    const sim = getCachedSimulation(comp.code, standingsRes, matchesRes);
    const topContenders = sim.table.slice(0, 3);
    favorites.push({
      competition: comp,
      simulations: sim.simulations,
      executionMs: sim.executionMs,
      topContenders,
    });

    for (const mp of sim.matchPredictions.slice(0, 2)) {
      featuredMatches.push({
        competition: comp,
        ...mp,
      });
    }
  }

  featuredMatches.sort((a, b) => new Date(a.utcDate) - new Date(b.utcDate));

  res.json({
    isDemo: anyDemo,
    seasonMeta: extractSeasonMeta(null, 'latest'),
    simulationsPerCompetition: 10000,
    favorites,
    featuredMatches: featuredMatches.slice(0, 10),
  });
});

router.get('/competitions/:code/supercomputer', async (req, res) => {
  const code = resolveCompetitionCode(req.params.code);
  if (!code) {
    return res.status(404).json({ error: 'Unsupported competition code', requested: req.params.code });
  }

  const simulations = Math.min(25000, Math.max(1000, Number(req.query.sims) || 10000));
  const seedOffset = Number(req.query.seed) || 0;

  try {
    const [standingsRes, matchesRes] = await Promise.all([
      getCachedOrFetch(
        `standings:${code}`,
        STANDINGS_TTL,
        () => fetchStandings(code, { priority: 'high' }),
        {
          meta: { category: 'standings', competitionCode: code },
          seedFallback: () => getSeedStandings(code),
        }
      ),
      getCachedOrFetch(
        `matches:${code}`,
        MATCHES_TTL,
        () => fetchMatches(code, {}, { priority: 'high' }),
        {
          meta: { category: 'matches', competitionCode: code },
          seedFallback: () => getSeedMatches(code),
        }
      ),
    ]);

    const simulation = getCachedSimulation(code, standingsRes, matchesRes, {
      simulations,
      seedOffset,
    });

    res.json({
      source: standingsRes.source,
      isDemo: Boolean(standingsRes.isDemo || matchesRes.isDemo),
      stale: Boolean(standingsRes.stale || matchesRes.stale),
      updatedAt: standingsRes.updatedAt,
      seasonMeta: extractSeasonMeta(standingsRes.data, 'latest'),
      data: simulation,
    });
  } catch (err) {
    res.status(502).json({ error: 'Unable to run supercomputer simulation', detail: err.message });
  }
});

router.get('/competitions/:code/supercomputer/matchup', async (req, res) => {
  const code = resolveCompetitionCode(req.params.code);
  if (!code) {
    return res.status(404).json({ error: 'Unsupported competition code', requested: req.params.code });
  }

  const homeId = Number(req.query.homeId);
  const awayId = Number(req.query.awayId);
  if (!homeId || !awayId || homeId === awayId) {
    return res.status(400).json({ error: 'Please select two distinct teams (homeId & awayId)' });
  }

  try {
    const standingsRes = await getCachedOrFetch(
      `standings:${code}`,
      STANDINGS_TTL,
      () => fetchStandings(code, { priority: 'high' }),
      {
        meta: { category: 'standings', competitionCode: code },
        seedFallback: () => getSeedStandings(code),
      }
    );

    const { ratings, avgGoalsPerTeamGame } = buildTeamRatings(standingsRes.data);
    const homeRating = ratings.get(homeId);
    const awayRating = ratings.get(awayId);
    if (!homeRating || !awayRating) {
      return res.status(404).json({ error: 'Selected teams not found in competition standings' });
    }

    const pred = predictMatchOutcome(homeRating, awayRating, avgGoalsPerTeamGame);
    const { _raw, ...cleanPred } = pred;

    res.json({
      competition: getCompetitionByCode(code),
      homeTeam: { ...homeRating.team, powerRating: homeRating.powerRating, position: homeRating.position },
      awayTeam: { ...awayRating.team, powerRating: awayRating.powerRating, position: awayRating.position },
      prediction: cleanPred,
    });
  } catch (err) {
    res.status(502).json({ error: 'Unable to predict custom matchup', detail: err.message });
  }
});

module.exports = router;
