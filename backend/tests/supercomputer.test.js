const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { createApp } = require('../src/app');
const { getSeedStandings, getSeedMatches } = require('../src/data/seedData');
const {
  buildTeamRatings,
  predictMatchOutcome,
  runSupercomputerSimulation,
} = require('../src/services/supercomputer');

test('Supercomputer Poisson match prediction produces valid probabilities summing to 100%', () => {
  const standings = getSeedStandings('PL');
  const { ratings, avgGoalsPerTeamGame } = buildTeamRatings(standings);
  const liverpool = ratings.get(64);
  const southampton = ratings.get(340);

  const pred = predictMatchOutcome(liverpool, southampton, avgGoalsPerTeamGame);
  const total = Math.round((pred.homeWinProb + pred.drawProb + pred.awayWinProb) * 10) / 10;
  assert.ok(Math.abs(total - 100) <= 0.2, `Probabilities sum was ${total}`);
  assert.ok(pred.homeWinProb > pred.awayWinProb, 'Top club at home should be favored over bottom club');
  assert.ok(pred.homeXg > pred.awayXg);
  assert.equal(pred.mostLikelyScores.length, 3);
});

test('Supercomputer 10,000 Monte Carlo simulations run fast and stay well-ordered', () => {
  const standings = getSeedStandings('PL');
  const matches = getSeedMatches('PL');
  const sim = runSupercomputerSimulation('PL', standings, matches, { simulations: 10000 });

  assert.equal(sim.simulations, 10000);
  assert.equal(sim.table.length, 20);
  assert.ok(sim.executionMs < 1500, `Expected <1500ms, got ${sim.executionMs}ms`);

  const titleSum = sim.table.reduce((acc, r) => acc + r.titleProb, 0);
  assert.ok(Math.abs(titleSum - 100) <= 2.5, `Title probs sum=${titleSum}`);
  assert.ok(sim.table[0].titleProb >= sim.table[3].titleProb);
  assert.ok(sim.table[0].projectedPoints > sim.table[19].projectedPoints);
});

test('Supercomputer HTTP endpoints work across all 8 competitions and custom matchups', async () => {
  const app = createApp();
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    const overviewRes = await fetch(`${baseUrl}/api/supercomputer`);
    assert.equal(overviewRes.status, 200);
    const overview = await overviewRes.json();
    assert.equal(overview.favorites.length, 8);

    const compRes = await fetch(`${baseUrl}/api/competitions/CL/supercomputer`);
    assert.equal(compRes.status, 200);
    const compData = await compRes.json();
    assert.equal(compData.data.simulations, 10000);
    assert.equal(compData.data.zoneMode, 'UEFA_LEAGUE_PHASE');

    const matchupRes = await fetch(`${baseUrl}/api/competitions/PL/supercomputer/matchup?homeId=57&awayId=64`);
    assert.equal(matchupRes.status, 200);
    const matchup = await matchupRes.json();
    assert.ok(matchup.prediction.homeWinProb > 0);
    assert.ok(matchup.prediction.mostLikelyScores.length === 3);

    // Team & Match endpoints also include supercomputer projections
    const teamRes = await fetch(`${baseUrl}/api/teams/57`);
    const teamJson = await teamRes.json();
    assert.ok(teamJson.data.supercomputer.length >= 1);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
