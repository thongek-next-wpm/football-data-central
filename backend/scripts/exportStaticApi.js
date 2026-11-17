const fs = require('fs');
const path = require('path');
const http = require('http');
const { createApp } = require('../src/app');
const { COMPETITIONS } = require('../src/config/competitions');
const { isApiKeyConfigured } = require('../src/services/footballApi');

const OUTPUT_DIR = path.resolve(__dirname, '..', '..', 'frontend', 'public', 'static-api');

function writeJson(relPath, payload) {
  const fullPath = path.join(OUTPUT_DIR, relPath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, JSON.stringify(payload), 'utf8');
}

async function fetchJson(baseUrl, apiPath) {
  const res = await fetch(`${baseUrl}${apiPath}`);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for ${apiPath}`);
  }
  return res.json();
}

function markStaticSource(payload) {
  if (!payload || typeof payload !== 'object') return payload;
  return {
    ...payload,
    source: payload.isDemo === false ? 'github-pages-live-snapshot' : 'github-pages-static',
  };
}

async function main() {
  const startedAt = Date.now();
  fs.rmSync(OUTPUT_DIR, { recursive: true, force: true });
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const useLiveApi = process.env.STATIC_EXPORT_LIVE === 'true' && isApiKeyConfigured();
  if (!useLiveApi) {
    process.env.FOOTBALL_DATA_API_KEY = '';
  }

  const app = createApp();
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}/api`;

  try {
    const teamMap = new Map();
    const playerMap = new Map();
    const matchMap = new Map();
    const searchTeams = new Map();
    const searchPlayers = new Map();
    const standingsByTeam = new Map();
    const scorersByPlayer = new Map();
    const scorersByTeam = new Map();
    const matchesByTeam = new Map();

    // 1. Export competition-level endpoints first to warm cache & discover entities
    for (const comp of COMPETITIONS) {
      const code = comp.code;
      const [standings, matches, scorers, teams, supercomputer] = await Promise.all([
        fetchJson(baseUrl, `/competitions/${code}/standings`),
        fetchJson(baseUrl, `/competitions/${code}/matches`),
        fetchJson(baseUrl, `/competitions/${code}/scorers?limit=30`),
        fetchJson(baseUrl, `/competitions/${code}/teams`),
        fetchJson(baseUrl, `/competitions/${code}/supercomputer`),
      ]);

      writeJson(`competitions/${code}/standings.json`, markStaticSource(standings));
      writeJson(`competitions/${code}/matches.json`, markStaticSource(matches));
      writeJson(`competitions/${code}/scorers.json`, markStaticSource(scorers));
      writeJson(`competitions/${code}/teams.json`, markStaticSource(teams));
      writeJson(`competitions/${code}/supercomputer.json`, markStaticSource(supercomputer));

      const totalTable =
        standings?.data?.standings?.find((s) => s.type === 'TOTAL')?.table ||
        standings?.data?.standings?.[0]?.table ||
        [];

      for (const row of totalTable) {
        if (row.team?.id) {
          if (!standingsByTeam.has(row.team.id)) standingsByTeam.set(row.team.id, []);
          standingsByTeam.get(row.team.id).push({ competition: comp, ...row });
          searchTeams.set(row.team.id, {
            id: row.team.id,
            name: row.team.name,
            shortName: row.team.shortName || row.team.name,
            tla: row.team.tla || '',
            crest: row.team.crest,
            league: code,
          });
        }
      }

      for (const m of matches?.data?.matches || []) {
        if (!m.id) continue;
        matchMap.set(m.id, m);
        for (const tid of [m.homeTeam?.id, m.awayTeam?.id]) {
          if (!tid) continue;
          if (!matchesByTeam.has(tid)) matchesByTeam.set(tid, []);
          matchesByTeam.get(tid).push(m);
        }
      }

      for (const s of scorers?.data?.scorers || []) {
        if (!s.player?.id) continue;
        scorersByPlayer.set(s.player.id, s);
        if (s.team?.id) {
          if (!scorersByTeam.has(s.team.id)) scorersByTeam.set(s.team.id, []);
          scorersByTeam.get(s.team.id).push({ competition: comp, ...s });
        }
        searchPlayers.set(s.player.id, {
          id: s.player.id,
          name: s.player.name,
          position: s.player.position || s.player.section || '-',
          nationality: s.player.nationality || '-',
          shirtNumber: s.player.shirtNumber || null,
          team: s.team,
          goals: s.goals ?? 0,
          assists: s.assists ?? 0,
        });
      }

      for (const t of teams?.data?.teams || []) {
        if (!t.id) continue;
        teamMap.set(t.id, t);
        for (const p of t.squad || []) {
          if (!p.id) continue;
          playerMap.set(p.id, { player: p, team: t });
          if (!searchPlayers.has(p.id)) {
            const sc = scorersByPlayer.get(p.id);
            searchPlayers.set(p.id, {
              id: p.id,
              name: p.name,
              position: p.position || '-',
              nationality: p.nationality || '-',
              shirtNumber: p.shirtNumber || null,
              team: { id: t.id, name: t.name, shortName: t.shortName, tla: t.tla, crest: t.crest },
              goals: sc?.goals ?? 0,
              assists: sc?.assists ?? 0,
            });
          }
        }
      }
    }

    // 2. Export aggregated endpoints (now backed by warmed snapshots!)
    const [health, status, competitions, overview, allMatches, allPlayers, superOverview] =
      await Promise.all([
        fetchJson(baseUrl, '/health'),
        fetchJson(baseUrl, '/system/status'),
        fetchJson(baseUrl, '/competitions'),
        fetchJson(baseUrl, '/overview'),
        fetchJson(baseUrl, '/matches'),
        fetchJson(baseUrl, '/players'),
        fetchJson(baseUrl, '/supercomputer'),
      ]);

    writeJson('health.json', { ...health, staticExport: true });
    writeJson('system/status.json', status);
    writeJson('competitions.json', competitions);
    writeJson('overview.json', overview);
    writeJson('matches.json', markStaticSource(allMatches));
    writeJson('players.json', markStaticSource(allPlayers));
    writeJson('supercomputer.json', superOverview);

    // 3. Export team, player, and match detail files (disable upstream calls for bulk export)
    process.env.FOOTBALL_DATA_API_KEY = '';

    const allTeamIds = new Set([...teamMap.keys(), ...standingsByTeam.keys()]);
    for (const tid of allTeamIds) {
      try {
        const team = await fetchJson(baseUrl, `/teams/${tid}`);
        writeJson(`teams/${tid}.json`, markStaticSource(team));
      } catch {
        const rawTeam = teamMap.get(tid);
        if (rawTeam) {
          writeJson(`teams/${tid}.json`, {
            source: 'github-pages-live-snapshot',
            isDemo: false,
            updatedAt: new Date().toISOString(),
            data: {
              ...rawTeam,
              matches: matchesByTeam.get(tid) || [],
              standingsPositions: standingsByTeam.get(tid) || [],
              teamScorers: scorersByTeam.get(tid) || [],
            },
          });
        }
      }
    }

    const allPlayerIds = new Set([...playerMap.keys(), ...scorersByPlayer.keys()]);
    for (const pid of allPlayerIds) {
      try {
        const player = await fetchJson(baseUrl, `/players/${pid}`);
        writeJson(`players/${pid}.json`, markStaticSource(player));
      } catch {
        const ref = playerMap.get(pid);
        const sc = scorersByPlayer.get(pid);
        const pObj = ref?.player || sc?.player;
        const tObj = ref?.team || sc?.team;
        if (pObj) {
          writeJson(`players/${pid}.json`, {
            source: 'github-pages-live-snapshot',
            isDemo: false,
            updatedAt: new Date().toISOString(),
            data: {
              ...pObj,
              currentTeam: tObj || null,
              seasonStats: {
                playedMatches: sc?.playedMatches || 0,
                goals: sc?.goals || 0,
                assists: sc?.assists || 0,
                penalties: sc?.penalties || 0,
              },
              matches: tObj?.id ? matchesByTeam.get(tObj.id) || [] : [],
            },
          });
        }
      }
    }

    for (const [mid, mObj] of matchMap.entries()) {
      try {
        const match = await fetchJson(baseUrl, `/matches/${mid}`);
        writeJson(`matches/${mid}.json`, markStaticSource(match));
      } catch {
        writeJson(`matches/${mid}.json`, {
          source: 'github-pages-live-snapshot',
          isDemo: false,
          updatedAt: new Date().toISOString(),
          data: { match: mObj, head2head: null, supercomputer: null },
        });
      }
    }

    writeJson('search-index.json', {
      competitions: competitions.competitions || [],
      teams: Array.from(searchTeams.values()),
      players: Array.from(searchPlayers.values()),
    });

    console.log(
      `[Static Export] Generated static API snapshots in ${Date.now() - startedAt}ms ` +
        `(teams=${allTeamIds.size}, players=${allPlayerIds.size}, matches=${matchMap.size})`
    );
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

main().catch((err) => {
  console.error('[Static Export] Failed:', err);
  process.exit(1);
});
