const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { createApp } = require('../src/app');
const { clearMemoryCacheForTests } = require('../src/services/cacheService');

let server;
let baseUrl;

test.before(async () => {
  clearMemoryCacheForTests();
  const app = createApp();
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  baseUrl = `http://127.0.0.1:${port}`;
});

test.after(async () => {
  await new Promise((resolve) => server.close(resolve));
});

async function getJson(path) {
  const res = await fetch(`${baseUrl}${path}`);
  const body = await res.json();
  return { status: res.status, body };
}

test('GET /api/health and /api/system/status return expected structure', async () => {
  const health = await getJson('/api/health');
  assert.equal(health.status, 200);
  assert.equal(health.body.status, 'ok');
  assert.equal(health.body.authRequired, false);

  const sys = await getJson('/api/system/status');
  assert.equal(sys.status, 200);
  assert.equal(sys.body.rateLimiter.maxRequestsPerMinute, 10);
});

test('GET /api/competitions returns all 8 competitions across Top 5 and UEFA', async () => {
  const res = await getJson('/api/competitions');
  assert.equal(res.status, 200);
  assert.equal(res.body.competitions.length, 8);
  assert.equal(res.body.groups.top5Leagues.length, 5);
  assert.equal(res.body.groups.uefaCompetitions.length, 3);
});

test('Standings, matches, and scorers work for all 8 competition codes including EC alias', async () => {
  for (const code of ['PL', 'PD', 'SA', 'BL1', 'FL1', 'CL', 'EL', 'UCL', 'EC']) {
    const st = await getJson(`/api/competitions/${code}/standings`);
    assert.equal(st.status, 200, `standings failed for ${code}`);
    assert.ok(st.body.data.standings[0].table.length > 0);
    assert.equal(st.body.seasonMeta.isLatest, true);
    assert.ok(st.body.seasonMeta.label.includes('/'));

    const mt = await getJson(`/api/competitions/${code}/matches`);
    assert.equal(mt.status, 200, `matches failed for ${code}`);
    assert.ok(mt.body.data.matches.length > 0);
    assert.equal(mt.body.seasonMeta.isLatest, true);

    const sc = await getJson(`/api/competitions/${code}/scorers`);
    assert.equal(sc.status, 200, `scorers failed for ${code}`);
    assert.ok(sc.body.data.scorers.length > 0);
    assert.equal(sc.body.seasonMeta.isLatest, true);
  }
});

test('Team profile, player profile, match H2H, overview, and search endpoints work end-to-end', async () => {
  const overview = await getJson('/api/overview');
  assert.equal(overview.status, 200);
  assert.equal(overview.body.competitions.length, 8);

  // Arsenal (id 57) & Bukayo Saka (id 9001)
  const team = await getJson('/api/teams/57');
  assert.equal(team.status, 200);
  assert.equal(team.body.data.tla, 'ARS');
  assert.ok(team.body.data.squad.length >= 10);
  assert.ok(team.body.data.matches.length > 0);

  const player = await getJson('/api/players/9001');
  assert.equal(player.status, 200);
  assert.equal(player.body.data.name, 'Bukayo Saka');
  assert.ok(player.body.data.seasonStats.goals > 0);
  assert.ok(player.body.data.matches.length > 0);

  const search = await getJson('/api/search?q=Arsenal');
  assert.equal(search.status, 200);
  assert.ok(search.body.teams.some((t) => t.id === 57));

  const playerSearch = await getJson('/api/search?q=Haaland');
  assert.equal(playerSearch.status, 200);
  assert.ok(playerSearch.body.players.some((p) => p.name.includes('Haaland')));
});

test('Unsupported competition returns 404 cleanly', async () => {
  const res = await getJson('/api/competitions/UNKNOWN/standings');
  assert.equal(res.status, 404);
});
