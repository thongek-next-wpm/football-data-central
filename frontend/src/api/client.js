import axios from 'axios';

const configuredApiUrl = (import.meta.env.VITE_API_BASE_URL || '').trim();
const allowStaticFallback =
  import.meta.env.VITE_STATIC_PAGES === 'true' || !configuredApiUrl;

const api = axios.create({
  baseURL: configuredApiUrl || '/api',
  timeout: 15000,
});

const staticBase = `${import.meta.env.BASE_URL || '/'}static-api`.replace(/\/+/g, '/');

async function fetchStaticJson(relPath) {
  const res = await fetch(`${staticBase}/${relPath}`);
  if (!res.ok) {
    throw new Error(`Static snapshot not found: ${relPath}`);
  }
  return res.json();
}

async function requestWithFallback(apiCall, staticLoader) {
  if (!configuredApiUrl && allowStaticFallback) {
    return staticLoader();
  }
  try {
    return await apiCall();
  } catch (err) {
    if (allowStaticFallback) {
      return staticLoader();
    }
    throw err;
  }
}

function filterMatchesList(matches = [], params = {}) {
  let list = matches;
  if (params.status) {
    const upper = String(params.status).toUpperCase();
    if (upper === 'LIVE') {
      list = list.filter((m) => ['LIVE', 'IN_PLAY', 'PAUSED', 'HALFTIME'].includes(m.status));
    } else if (upper === 'UPCOMING') {
      list = list.filter((m) => ['SCHEDULED', 'TIMED'].includes(m.status));
    } else {
      list = list.filter((m) => m.status === upper);
    }
  }
  if (params.matchday) {
    list = list.filter((m) => Number(m.matchday) === Number(params.matchday));
  }
  if (params.teamId) {
    const tid = Number(params.teamId);
    list = list.filter((m) => m.homeTeam?.id === tid || m.awayTeam?.id === tid);
  }
  if (params.search) {
    const q = String(params.search).trim().toLowerCase();
    list = list.filter(
      (m) =>
        m.homeTeam?.name?.toLowerCase().includes(q) ||
        m.homeTeam?.shortName?.toLowerCase().includes(q) ||
        m.awayTeam?.name?.toLowerCase().includes(q) ||
        m.awayTeam?.shortName?.toLowerCase().includes(q)
    );
  }
  return list;
}

function computeClientMatchup(simData, homeId, awayId) {
  const table = simData?.table || [];
  const home = table.find((r) => Number(r.team?.id) === Number(homeId));
  const away = table.find((r) => Number(r.team?.id) === Number(awayId));
  if (!home || !away) return null;

  const avgGoals = simData?.modelInfo?.avgGoalsPerTeamGame || 1.38;
  const hAtt = (home.attackIndex || 100) / 100;
  const hDef = Math.max(0.45, (200 - (home.defenseIndex || 100)) / 100);
  const aAtt = (away.attackIndex || 100) / 100;
  const aDef = Math.max(0.45, (200 - (away.defenseIndex || 100)) / 100);

  const homeXg = Math.max(0.35, Math.min(3.6, avgGoals * 1.12 * hAtt * aDef));
  const awayXg = Math.max(0.25, Math.min(3.2, avgGoals * 0.9 * aAtt * hDef));

  const fact = [1, 1, 2, 6, 24, 120, 720, 5040];
  const pmf = (lam, k) => (Math.exp(-lam) * Math.pow(lam, k)) / fact[k];
  let hw = 0;
  let dr = 0;
  let aw = 0;
  let o25 = 0;
  let btts = 0;
  const scores = [];

  for (let h = 0; h <= 7; h += 1) {
    for (let a = 0; a <= 7; a += 1) {
      const p = pmf(homeXg, h) * pmf(awayXg, a);
      if (h > a) hw += p;
      else if (h === a) dr += p;
      else aw += p;
      if (h + a >= 3) o25 += p;
      if (h >= 1 && a >= 1) btts += p;
      scores.push({ score: `${h}-${a}`, prob: p });
    }
  }
  const tot = hw + dr + aw || 1;
  scores.sort((x, y) => y.prob - x.prob);
  const hPct = Math.round((hw / tot) * 1000) / 10;
  const dPct = Math.round((dr / tot) * 1000) / 10;
  const aPct = Math.round(Math.max(0, 100 - hPct - dPct) * 10) / 10;

  return {
    competition: simData.competition,
    homeTeam: { ...home.team, powerRating: home.powerRating, position: home.currentPosition },
    awayTeam: { ...away.team, powerRating: away.powerRating, position: away.currentPosition },
    prediction: {
      homeWinProb: hPct,
      drawProb: dPct,
      awayWinProb: aPct,
      homeXg: Math.round(homeXg * 100) / 100,
      awayXg: Math.round(awayXg * 100) / 100,
      over25Prob: Math.round((o25 / tot) * 1000) / 10,
      bttsProb: Math.round((btts / tot) * 1000) / 10,
      mostLikelyScores: scores.slice(0, 3).map((s) => ({
        score: s.score,
        probability: Math.round((s.prob / tot) * 1000) / 10,
      })),
      verdict:
        hPct >= aPct + 12
          ? 'เจ้าบ้านมีโอกาสคว้า 3 แต้มสูง'
          : aPct >= hPct + 12
            ? 'ทีมเยือนมีโอกาสบุกชนะสูง'
            : 'สูสีมีลุ้นแบ่งแต้ม',
    },
  };
}

export const getHealth = () =>
  requestWithFallback(
    () => api.get('/health').then((res) => res.data),
    () => fetchStaticJson('health.json')
  );

export const getSystemStatus = () =>
  requestWithFallback(
    () => api.get('/system/status').then((res) => res.data),
    () => fetchStaticJson('system/status.json')
  );

export const getCompetitions = () =>
  requestWithFallback(
    () => api.get('/competitions').then((res) => res.data),
    () => fetchStaticJson('competitions.json')
  );

export const getOverview = () =>
  requestWithFallback(
    () => api.get('/overview').then((res) => res.data),
    () => fetchStaticJson('overview.json')
  );

export const getStandings = (code) =>
  requestWithFallback(
    () => api.get(`/competitions/${code}/standings`).then((res) => res.data),
    () => fetchStaticJson(`competitions/${code}/standings.json`)
  );

export const getMatches = (code, params = {}) =>
  requestWithFallback(
    () => api.get(`/competitions/${code}/matches`, { params }).then((res) => res.data),
    async () => {
      const payload = await fetchStaticJson(`competitions/${code}/matches.json`);
      return {
        ...payload,
        data: {
          ...payload.data,
          matches: filterMatchesList(payload.data?.matches || [], params),
        },
      };
    }
  );

export const getAllMatches = (params = {}) =>
  requestWithFallback(
    () => api.get('/matches', { params }).then((res) => res.data),
    async () => {
      const base = params.code
        ? await fetchStaticJson(`competitions/${params.code}/matches.json`)
        : await fetchStaticJson('matches.json');
      const filtered = filterMatchesList(base.data?.matches || [], params);
      return { ...base, count: filtered.length, data: { matches: filtered } };
    }
  );

export const getMatchDetail = (id) =>
  requestWithFallback(
    () => api.get(`/matches/${id}`).then((res) => res.data),
    () => fetchStaticJson(`matches/${id}.json`)
  );

export const getScorers = (code, limit = 25) =>
  requestWithFallback(
    () => api.get(`/competitions/${code}/scorers`, { params: { limit } }).then((res) => res.data),
    async () => {
      const payload = await fetchStaticJson(`competitions/${code}/scorers.json`);
      return {
        ...payload,
        data: {
          ...payload.data,
          scorers: (payload.data?.scorers || []).slice(0, limit),
        },
      };
    }
  );

export const getCompetitionTeams = (code) =>
  requestWithFallback(
    () => api.get(`/competitions/${code}/teams`).then((res) => res.data),
    () => fetchStaticJson(`competitions/${code}/teams.json`)
  );

export const getAllPlayers = (params = {}) =>
  requestWithFallback(
    () => api.get('/players', { params }).then((res) => res.data),
    async () => {
      const base = params.code
        ? await fetchStaticJson(`competitions/${params.code}/scorers.json`)
        : await fetchStaticJson('players.json');
      let list = base.data?.scorers || [];
      if (params.position && params.position !== 'ALL') {
        const pq = String(params.position).toLowerCase();
        list = list.filter((item) => {
          const p = (item.player?.position || item.player?.section || '').toLowerCase();
          if (pq === 'forward') return p.includes('forward') || p.includes('winger') || p.includes('striker') || p.includes('offence');
          if (pq === 'midfield') return p.includes('midfield');
          if (pq === 'defence') return p.includes('back') || p.includes('defence');
          if (pq === 'goalkeeper') return p.includes('goalkeeper');
          return p.includes(pq);
        });
      }
      if (params.search) {
        const q = String(params.search).trim().toLowerCase();
        list = list.filter(
          (item) =>
            item.player?.name?.toLowerCase().includes(q) ||
            item.team?.name?.toLowerCase().includes(q) ||
            item.team?.shortName?.toLowerCase().includes(q) ||
            item.player?.nationality?.toLowerCase().includes(q)
        );
      }
      return { ...base, count: list.length, data: { scorers: list } };
    }
  );

export const getTeamProfile = (id) =>
  requestWithFallback(
    () => api.get(`/teams/${id}`).then((res) => res.data),
    () => fetchStaticJson(`teams/${id}.json`)
  );

export const getPlayerProfile = (id) =>
  requestWithFallback(
    () => api.get(`/players/${id}`).then((res) => res.data),
    () => fetchStaticJson(`players/${id}.json`)
  );

export const searchEntities = (q) =>
  requestWithFallback(
    () => api.get('/search', { params: { q } }).then((res) => res.data),
    async () => {
      const trimmed = String(q || '').trim().toLowerCase();
      if (trimmed.length < 2) return { query: q, competitions: [], teams: [], players: [] };
      const idx = await fetchStaticJson('search-index.json');
      return {
        query: q,
        competitions: (idx.competitions || [])
          .filter(
            (c) =>
              c.name?.toLowerCase().includes(trimmed) ||
              c.thaiName?.toLowerCase().includes(trimmed) ||
              c.code?.toLowerCase().includes(trimmed)
          )
          .slice(0, 5),
        teams: (idx.teams || [])
          .filter(
            (t) =>
              t.name?.toLowerCase().includes(trimmed) ||
              t.shortName?.toLowerCase().includes(trimmed) ||
              t.tla?.toLowerCase().includes(trimmed)
          )
          .slice(0, 12),
        players: (idx.players || [])
          .filter(
            (p) =>
              p.name?.toLowerCase().includes(trimmed) ||
              p.nationality?.toLowerCase().includes(trimmed)
          )
          .slice(0, 15),
      };
    }
  );

export const triggerManualSync = (code) =>
  requestWithFallback(
    () => api.post(`/system/sync/${code}`).then((res) => res.data),
    async () => ({ synced: false, mode: 'github-pages-static' })
  );

export const getSupercomputerOverview = () =>
  requestWithFallback(
    () => api.get('/supercomputer').then((res) => res.data),
    () => fetchStaticJson('supercomputer.json')
  );

export const getCompetitionSupercomputer = (code, params = {}) =>
  requestWithFallback(
    () => api.get(`/competitions/${code}/supercomputer`, { params }).then((res) => res.data),
    () => fetchStaticJson(`competitions/${code}/supercomputer.json`)
  );

export const predictCustomMatchup = (code, homeId, awayId) =>
  requestWithFallback(
    () =>
      api
        .get(`/competitions/${code}/supercomputer/matchup`, { params: { homeId, awayId } })
        .then((res) => res.data),
    async () => {
      const simRes = await fetchStaticJson(`competitions/${code}/supercomputer.json`);
      return computeClientMatchup(simRes.data, homeId, awayId);
    }
  );
