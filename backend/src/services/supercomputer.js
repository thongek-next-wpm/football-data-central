const { COMPETITIONS, getCompetitionByCode } = require('../config/competitions');

const DEFAULT_SIMULATIONS = 10000;
const MAX_GOALS = 7;

function hashString(str) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function createPrng(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function factorial(n) {
  let f = 1;
  for (let i = 2; i <= n; i += 1) f *= i;
  return f;
}

const FACTORIALS = Array.from({ length: MAX_GOALS + 1 }, (_, i) => factorial(i));

function poissonPmf(lambda, k) {
  const safeLambda = Math.max(0.05, Math.min(6.0, lambda));
  return (Math.exp(-safeLambda) * Math.pow(safeLambda, k)) / FACTORIALS[k];
}

function parseFormScore(formStr) {
  if (!formStr) return 0.5;
  const tokens = String(formStr)
    .split(',')
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean)
    .slice(-5);
  if (tokens.length === 0) return 0.5;
  let pts = 0;
  let maxPts = 0;
  tokens.forEach((t, idx) => {
    const weight = 1 + idx * 0.15; // Slightly higher weight for most recent match
    maxPts += 3 * weight;
    if (t === 'W') pts += 3 * weight;
    else if (t === 'D') pts += 1 * weight;
  });
  return maxPts > 0 ? pts / maxPts : 0.5;
}

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

function round1(n) {
  return Math.round(n * 10) / 10;
}

/**
 * Builds calibrated Attack, Defense, Home/Away, Form, and Power ratings for each club.
 */
function buildTeamRatings(standingsPayload) {
  const standings = standingsPayload?.standings || [];
  const totalGroup = standings.find((s) => s.type === 'TOTAL') || standings[0];
  const homeGroup = standings.find((s) => s.type === 'HOME');
  const awayGroup = standings.find((s) => s.type === 'AWAY');

  const table = totalGroup?.table || [];
  if (table.length === 0) {
    return { ratings: new Map(), avgGoalsPerTeamGame: 1.38, table: [] };
  }

  let totalGoals = 0;
  let totalPlayed = 0;
  for (const row of table) {
    totalGoals += row.goalsFor || 0;
    totalPlayed += row.playedGames || 0;
  }

  const avgGoalsPerTeamGame = totalPlayed > 0 ? clamp(totalGoals / totalPlayed, 0.9, 2.2) : 1.38;

  const homeMap = new Map((homeGroup?.table || []).map((r) => [r.team?.id, r]));
  const awayMap = new Map((awayGroup?.table || []).map((r) => [r.team?.id, r]));

  const ratings = new Map();
  const priorWeight = 6; // Bayesian smoothing games

  for (const row of table) {
    const tid = row.team?.id;
    if (!tid) continue;

    const played = row.playedGames || 0;
    const gf = row.goalsFor || 0;
    const ga = row.goalsAgainst || 0;

    // Smoothed attack & defense relative to league mean
    const smoothedGF = (gf + priorWeight * avgGoalsPerTeamGame) / (played + priorWeight);
    const smoothedGA = (ga + priorWeight * avgGoalsPerTeamGame) / (played + priorWeight);

    const attack = clamp(smoothedGF / avgGoalsPerTeamGame, 0.45, 2.25);
    const defense = clamp(smoothedGA / avgGoalsPerTeamGame, 0.45, 2.15); // Lower = stronger defense

    // Home/Away adjustments when split data exists
    const hRow = homeMap.get(tid);
    const aRow = awayMap.get(tid);

    const homeAttackAdj =
      hRow && hRow.playedGames > 0
        ? clamp(((hRow.goalsFor + 3 * avgGoalsPerTeamGame * 1.1) / (hRow.playedGames + 3)) / (avgGoalsPerTeamGame * 1.1), 0.7, 1.45)
        : 1.0;
    const awayAttackAdj =
      aRow && aRow.playedGames > 0
        ? clamp(((aRow.goalsFor + 3 * avgGoalsPerTeamGame * 0.9) / (aRow.playedGames + 3)) / (avgGoalsPerTeamGame * 0.9), 0.7, 1.45)
        : 1.0;

    const formRatio = parseFormScore(row.form);
    const formMomentum = 0.92 + formRatio * 0.16; // 0.92 .. 1.08

    const ppg = played > 0 ? (row.points || 0) / played : 1.2;
    const gdPerGame = played > 0 ? (row.goalDifference || 0) / played : 0;

    // Power index calibrated around ~55-96
    const rawPower =
      62 +
      (attack - defense) * 16 +
      (ppg - 1.35) * 10 +
      gdPerGame * 3.5 +
      (formRatio - 0.5) * 6;
    const powerRating = round1(clamp(rawPower, 35, 98.5));

    ratings.set(tid, {
      team: row.team,
      position: row.position,
      playedGames: played,
      points: row.points || 0,
      goalsFor: gf,
      goalsAgainst: ga,
      goalDifference: row.goalDifference || 0,
      form: row.form || null,
      attack,
      defense,
      homeAttackAdj,
      awayAttackAdj,
      formMomentum,
      powerRating,
    });
  }

  return { ratings, avgGoalsPerTeamGame, table };
}

/**
 * Predicts a single match outcome using bivariate Poisson + Dixon-Coles low-score adjustment.
 */
function predictMatchOutcome(homeRating, awayRating, avgGoalsPerTeamGame = 1.38) {
  const hAttack = homeRating?.attack ?? 1.0;
  const hDefense = homeRating?.defense ?? 1.0;
  const hHomeAdj = homeRating?.homeAttackAdj ?? 1.0;
  const hForm = homeRating?.formMomentum ?? 1.0;

  const aAttack = awayRating?.attack ?? 1.0;
  const aDefense = awayRating?.defense ?? 1.0;
  const aAwayAdj = awayRating?.awayAttackAdj ?? 1.0;
  const aForm = awayRating?.formMomentum ?? 1.0;

  const homeAdvantage = 1.12;
  const awayFactor = 0.90;

  const homeXg = clamp(
    avgGoalsPerTeamGame * homeAdvantage * hAttack * aDefense * Math.sqrt(hHomeAdj) * hForm,
    0.35,
    3.6
  );
  const awayXg = clamp(
    avgGoalsPerTeamGame * awayFactor * aAttack * hDefense * Math.sqrt(aAwayAdj) * aForm,
    0.25,
    3.2
  );

  const homeDist = Array.from({ length: MAX_GOALS + 1 }, (_, k) => poissonPmf(homeXg, k));
  const awayDist = Array.from({ length: MAX_GOALS + 1 }, (_, k) => poissonPmf(awayXg, k));

  let homeWinProb = 0;
  let drawProb = 0;
  let awayWinProb = 0;
  let over25Prob = 0;
  let bttsProb = 0;
  const scorelines = [];

  // Small Dixon-Coles correlation factor for 0-0 / 1-1 / 1-0 / 0-1
  const rho = -0.06;

  for (let h = 0; h <= MAX_GOALS; h += 1) {
    for (let a = 0; a <= MAX_GOALS; a += 1) {
      let p = homeDist[h] * awayDist[a];
      if (h === 0 && a === 0) p *= 1 - homeXg * awayXg * rho;
      else if (h === 1 && a === 0) p *= 1 + awayXg * rho;
      else if (h === 0 && a === 1) p *= 1 + homeXg * rho;
      else if (h === 1 && a === 1) p *= 1 - rho;

      p = Math.max(0, p);

      if (h > a) homeWinProb += p;
      else if (h === a) drawProb += p;
      else awayWinProb += p;

      if (h + a >= 3) over25Prob += p;
      if (h >= 1 && a >= 1) bttsProb += p;

      scorelines.push({ home: h, away: a, prob: p });
    }
  }

  const totalP = homeWinProb + drawProb + awayWinProb || 1;
  homeWinProb = homeWinProb / totalP;
  drawProb = drawProb / totalP;
  awayWinProb = awayWinProb / totalP;

  scorelines.sort((x, y) => y.prob - x.prob);

  const hPct = round1(homeWinProb * 100);
  const dPct = round1(drawProb * 100);
  const aPct = round1(Math.max(0, 100 - hPct - dPct));

  let verdict = 'สูสีมีลุ้นแบ่งแต้ม';
  let favorite = 'DRAW';
  if (hPct >= aPct + 12 && hPct > dPct) {
    verdict = hPct >= 60 ? 'เจ้าบ้านเหนือกว่าชัดเจน' : 'เจ้าบ้านมีโอกาสคว้า 3 แต้มสูง';
    favorite = 'HOME';
  } else if (aPct >= hPct + 12 && aPct > dPct) {
    verdict = aPct >= 60 ? 'ทีมเยือนเหนือกว่าชัดเจน' : 'ทีมเยือนมีโอกาสบุกชนะสูง';
    favorite = 'AWAY';
  }

  return {
    homeWinProb: hPct,
    drawProb: dPct,
    awayWinProb: aPct,
    homeXg: Math.round(homeXg * 100) / 100,
    awayXg: Math.round(awayXg * 100) / 100,
    over25Prob: round1((over25Prob / totalP) * 100),
    bttsProb: round1((bttsProb / totalP) * 100),
    mostLikelyScores: scorelines.slice(0, 3).map((s) => ({
      score: `${s.home}-${s.away}`,
      probability: round1((s.prob / totalP) * 100),
    })),
    favorite,
    verdict,
    _raw: { homeWinProb, drawProb, homeXg, awayXg },
  };
}

function getZoneCutoffs(teamCount, compMeta) {
  if (compMeta?.type === 'CUP') {
    if (teamCount >= 25) {
      return {
        uclCutoff: compMeta.zones?.ucl || 8,
        playoffEnd: compMeta.zones?.playoffEnd || 24,
        relegationStart: compMeta.zones?.eliminatedStart || 25,
        mode: 'UEFA_LEAGUE_PHASE',
      };
    }
    const uclCutoff = Math.max(2, Math.round(teamCount * 0.35));
    const playoffEnd = Math.max(uclCutoff + 1, Math.round(teamCount * 0.8));
    return {
      uclCutoff,
      playoffEnd,
      relegationStart: playoffEnd + 1,
      mode: 'UEFA_LEAGUE_PHASE',
    };
  }

  const zones = compMeta?.zones || {};
  const uclCutoff = Math.min(teamCount, zones.ucl || 4);
  const uelCutoff = Math.min(teamCount, zones.uel || 5);
  const ueclCutoff = Math.min(teamCount, zones.uecl || 6);
  const relegationStart =
    teamCount >= (zones.relegationStart || 18)
      ? zones.relegationStart
      : Math.max(ueclCutoff + 1, teamCount - 1);

  return {
    uclCutoff,
    uelCutoff,
    ueclCutoff,
    relegationStart,
    mode: 'DOMESTIC_LEAGUE',
  };
}

/**
 * Generates remaining fixture list to simulate up to end of regular/league season.
 */
function buildRemainingFixtures(table, matchesPayload, ratings, avgGoalsPerTeamGame, compMeta) {
  const N = table.length;
  if (N < 2) return [];

  const totalSeasonGames = compMeta?.type === 'CUP' ? 8 : Math.min(38, (N - 1) * 2);
  const pendingStatus = new Set(['SCHEDULED', 'TIMED', 'IN_PLAY', 'LIVE', 'PAUSED', 'HALFTIME']);

  const idxById = new Map(table.map((row, idx) => [row.team.id, idx]));
  const fixtures = [];
  const scheduledCounts = new Int32Array(N);

  // Use known scheduled matches first
  for (const m of matchesPayload?.matches || []) {
    if (!pendingStatus.has(m.status)) continue;
    const hIdx = idxById.get(m.homeTeam?.id);
    const aIdx = idxById.get(m.awayTeam?.id);
    if (hIdx === undefined || aIdx === undefined || hIdx === aIdx) continue;

    scheduledCounts[hIdx] += 1;
    scheduledCounts[aIdx] += 1;

    const pred = predictMatchOutcome(
      ratings.get(m.homeTeam.id),
      ratings.get(m.awayTeam.id),
      avgGoalsPerTeamGame
    );
    fixtures.push({
      hIdx,
      aIdx,
      pHome: pred._raw.homeWinProb,
      pHomeOrDraw: pred._raw.homeWinProb + pred._raw.drawProb,
      expDiff: pred._raw.homeXg - pred._raw.awayXg,
    });
  }

  // Synthesize remaining unscheduled season games up to totalSeasonGames for accurate full-season simulation
  const remainingNeed = table.map((row, idx) =>
    Math.max(0, totalSeasonGames - (row.playedGames || 0) - scheduledCounts[idx])
  );

  let guard = 0;
  while (guard < totalSeasonGames * N) {
    guard += 1;
    let firstIdx = -1;
    let maxNeed = 0;
    for (let i = 0; i < N; i += 1) {
      if (remainingNeed[i] > maxNeed) {
        maxNeed = remainingNeed[i];
        firstIdx = i;
      }
    }
    if (firstIdx === -1) break;

    let secondIdx = -1;
    let bestNeed = 0;
    for (let j = 0; j < N; j += 1) {
      if (j !== firstIdx && remainingNeed[j] > bestNeed) {
        bestNeed = remainingNeed[j];
        secondIdx = j;
      }
    }
    if (secondIdx === -1) break;

    remainingNeed[firstIdx] -= 1;
    remainingNeed[secondIdx] -= 1;

    const hIdx = guard % 2 === 0 ? firstIdx : secondIdx;
    const aIdx = guard % 2 === 0 ? secondIdx : firstIdx;
    const hId = table[hIdx].team.id;
    const aId = table[aIdx].team.id;

    const pred = predictMatchOutcome(ratings.get(hId), ratings.get(aId), avgGoalsPerTeamGame);
    fixtures.push({
      hIdx,
      aIdx,
      pHome: pred._raw.homeWinProb,
      pHomeOrDraw: pred._raw.homeWinProb + pred._raw.drawProb,
      expDiff: pred._raw.homeXg - pred._raw.awayXg,
    });
  }

  return fixtures;
}

/**
 * Runs 10,000 Monte Carlo season simulations + match win probability predictions.
 */
function runSupercomputerSimulation(
  competitionCode,
  standingsPayload,
  matchesPayload,
  { simulations = DEFAULT_SIMULATIONS, seedOffset = 0 } = {}
) {
  const startedAt = Date.now();
  const compMeta = getCompetitionByCode(competitionCode);
  const { ratings, avgGoalsPerTeamGame, table } = buildTeamRatings(standingsPayload);
  const N = table.length;

  if (N === 0) {
    return {
      competition: compMeta,
      simulations: 0,
      executionMs: 0,
      table: [],
      matchPredictions: [],
    };
  }

  const cutoffs = getZoneCutoffs(N, compMeta);
  const fixtures = buildRemainingFixtures(table, matchesPayload, ratings, avgGoalsPerTeamGame, compMeta);

  const basePts = new Int32Array(N);
  const baseGD = new Float64Array(N);
  for (let i = 0; i < N; i += 1) {
    basePts[i] = table[i].points || 0;
    baseGD[i] = table[i].goalDifference || 0;
  }

  const simPtsSum = new Float64Array(N);
  const simGDSum = new Float64Array(N);
  const simPosSum = new Float64Array(N);
  const titleCount = new Int32Array(N);
  const uclCount = new Int32Array(N);
  const secondaryCount = new Int32Array(N); // UEL/UECL or UEFA Playoff
  const relegationCount = new Int32Array(N); // Relegation or UEFA Eliminated

  const fingerprint = `${competitionCode}:${N}:${table[0]?.points || 0}:${table[N - 1]?.points || 0}:${seedOffset}`;
  const rand = createPrng(hashString(fingerprint));

  const workPts = new Int32Array(N);
  const workGD = new Float64Array(N);
  const order = Array.from({ length: N }, (_, idx) => idx);
  const fixtureCount = fixtures.length;

  for (let sim = 0; sim < simulations; sim += 1) {
    for (let i = 0; i < N; i += 1) {
      workPts[i] = basePts[i];
      workGD[i] = baseGD[i];
    }

    for (let f = 0; f < fixtureCount; f += 1) {
      const fx = fixtures[f];
      const r = rand();
      if (r < fx.pHome) {
        workPts[fx.hIdx] += 3;
        const margin = 1 + (rand() < 0.35 ? 1 : 0) + (rand() < 0.12 ? 1 : 0);
        workGD[fx.hIdx] += margin;
        workGD[fx.aIdx] -= margin;
      } else if (r < fx.pHomeOrDraw) {
        workPts[fx.hIdx] += 1;
        workPts[fx.aIdx] += 1;
      } else {
        workPts[fx.aIdx] += 3;
        const margin = 1 + (rand() < 0.32 ? 1 : 0) + (rand() < 0.1 ? 1 : 0);
        workGD[fx.aIdx] += margin;
        workGD[fx.hIdx] -= margin;
      }
    }

    // Rank clubs by points desc, GD desc
    order.sort((a, b) => workPts[b] - workPts[a] || workGD[b] - workGD[a]);

    for (let rankIdx = 0; rankIdx < N; rankIdx += 1) {
      const teamIdx = order[rankIdx];
      const rank = rankIdx + 1;
      simPtsSum[teamIdx] += workPts[teamIdx];
      simGDSum[teamIdx] += workGD[teamIdx];
      simPosSum[teamIdx] += rank;

      if (rank === 1) titleCount[teamIdx] += 1;
      if (rank <= cutoffs.uclCutoff) uclCount[teamIdx] += 1;

      if (cutoffs.mode === 'UEFA_LEAGUE_PHASE') {
        if (rank > cutoffs.uclCutoff && rank <= cutoffs.playoffEnd) {
          secondaryCount[teamIdx] += 1;
        }
        if (rank >= cutoffs.relegationStart) {
          relegationCount[teamIdx] += 1;
        }
      } else {
        if (rank > cutoffs.uclCutoff && rank <= cutoffs.ueclCutoff) {
          secondaryCount[teamIdx] += 1;
        }
        if (rank >= cutoffs.relegationStart) {
          relegationCount[teamIdx] += 1;
        }
      }
    }
  }

  const simulatedTable = table.map((row, idx) => {
    const rating = ratings.get(row.team.id);
    return {
      currentPosition: row.position,
      team: row.team,
      playedGames: row.playedGames,
      currentPoints: row.points,
      currentGD: row.goalDifference,
      form: row.form,
      powerRating: rating?.powerRating ?? 65,
      attackIndex: round1((rating?.attack ?? 1) * 100),
      defenseIndex: round1((2 - (rating?.defense ?? 1)) * 100),
      projectedPoints: round1(simPtsSum[idx] / simulations),
      projectedGD: round1(simGDSum[idx] / simulations),
      projectedPosition: round1(simPosSum[idx] / simulations),
      titleProb: round1((titleCount[idx] / simulations) * 100),
      uclProb: round1((uclCount[idx] / simulations) * 100),
      secondaryProb: round1((secondaryCount[idx] / simulations) * 100),
      relegationProb: round1((relegationCount[idx] / simulations) * 100),
    };
  });

  simulatedTable.sort(
    (a, b) =>
      b.titleProb - a.titleProb ||
      b.projectedPoints - a.projectedPoints ||
      b.projectedGD - a.projectedGD
  );

  const rankedTable = simulatedTable.map((item, idx) => ({
    projectedRank: idx + 1,
    ...item,
  }));

  // Predict upcoming / live matches in this competition
  const upcomingStatuses = new Set(['SCHEDULED', 'TIMED', 'IN_PLAY', 'LIVE', 'PAUSED', 'HALFTIME']);
  const matchPredictions = (matchesPayload?.matches || [])
    .filter((m) => upcomingStatuses.has(m.status))
    .slice(0, 12)
    .map((m) => {
      const pred = predictMatchOutcome(
        ratings.get(m.homeTeam?.id),
        ratings.get(m.awayTeam?.id),
        avgGoalsPerTeamGame
      );
      const { _raw, ...cleanPred } = pred;
      return {
        matchId: m.id,
        utcDate: m.utcDate,
        status: m.status,
        matchday: m.matchday,
        venue: m.venue,
        homeTeam: m.homeTeam,
        awayTeam: m.awayTeam,
        prediction: cleanPred,
      };
    });

  return {
    competition: compMeta,
    simulations,
    remainingFixturesSimulated: fixtureCount,
    executionMs: Date.now() - startedAt,
    zoneMode: cutoffs.mode,
    cutoffs,
    modelInfo: {
      name: 'FDC Supercomputer Engine v1.0',
      methodology: 'Bivariate Poisson xG + Dixon-Coles Adjustment + 10,000 Monte Carlo Season Simulations',
      avgGoalsPerTeamGame: Math.round(avgGoalsPerTeamGame * 100) / 100,
    },
    table: rankedTable,
    matchPredictions,
  };
}

function predictSingleMatchFromStandings(match, standingsPayload) {
  if (!match) return null;
  const { ratings, avgGoalsPerTeamGame } = buildTeamRatings(standingsPayload);
  const pred = predictMatchOutcome(
    ratings.get(match.homeTeam?.id),
    ratings.get(match.awayTeam?.id),
    avgGoalsPerTeamGame
  );
  const { _raw, ...cleanPred } = pred;
  return {
    ...cleanPred,
    homePower: ratings.get(match.homeTeam?.id)?.powerRating ?? 70,
    awayPower: ratings.get(match.awayTeam?.id)?.powerRating ?? 70,
  };
}

module.exports = {
  DEFAULT_SIMULATIONS,
  buildTeamRatings,
  predictMatchOutcome,
  runSupercomputerSimulation,
  predictSingleMatchFromStandings,
};
