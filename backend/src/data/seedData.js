const { COMPETITIONS, getCompetitionByCode } = require('../config/competitions');
const { getCurrentEuropeanSeason } = require('../config/season');
const { CLUBS, COMPETITION_ROSTERS } = require('./clubsCatalog');

function buildCrestSvgDataUri(tla = 'FDC', colors = ['#10b981', '#0f172a']) {
  const c1 = colors[0] || '#10b981';
  const c2 = colors[1] || '#0f172a';
  const label = String(tla).slice(0, 4).toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${c1}"/><stop offset="100%" stop-color="${c2}"/></linearGradient></defs><path d="M32 4 L56 12 V30 C56 45 45 55 32 60 C19 55 8 45 8 30 V12 Z" fill="url(#g)" stroke="#e2e8f0" stroke-width="2.5"/><path d="M32 8 L52 15 V30 C52 42 42 51 32 55.5 Z" fill="#ffffff" fill-opacity="0.12"/><text x="32" y="37" text-anchor="middle" font-family="Arial,sans-serif" font-weight="800" font-size="${label.length > 3 ? 13 : 15}" fill="#ffffff" stroke="#020617" stroke-width="0.6">${label}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function getClubSummary(clubId) {
  const club = CLUBS[Number(clubId)];
  if (!club) return null;
  return {
    id: club.id,
    name: club.name,
    shortName: club.shortName,
    tla: club.tla,
    crest: buildCrestSvgDataUri(club.tla, club.colors),
  };
}

const EXTRA_SQUAD_TEMPLATES = [
  { role: 'Goalkeeper', names: ['Lucas Chevalier', 'Marco Carnesecchi', 'Bart Verbruggen'], nums: [1, 13] },
  { role: 'Centre-Back', names: ['Murillo Santos', 'Piero Hincapié', 'Marc Guéhi', 'Alessandro Bastoni'], nums: [4, 5, 6] },
  { role: 'Left-Back', names: ['Milos Kerkez', 'Antonee Robinson', 'Alejandro Grimaldo'], nums: [3, 12] },
  { role: 'Right-Back', names: ['Malo Gusto', 'Jeremie Frimpong', 'Pedro Porro'], nums: [2, 24] },
  { role: 'Defensive Midfield', names: ['Martín Zubimendi', 'João Neves', 'Eduardo Camavinga'], nums: [6, 16] },
  { role: 'Central Midfield', names: ['Tijjani Reijnders', 'Kobbie Mainoo', 'Warren Zaïre-Emery'], nums: [8, 18] },
  { role: 'Attacking Midfield', names: ['Alex Baena', 'Álex Grimaldo', 'Xavi Simons'], nums: [10, 21] },
  { role: 'Left Winger', names: ['Anthony Elanga', 'Savinho Moreira', 'Kenan Yıldız'], nums: [11, 17] },
  { role: 'Right Winger', names: ['Johan Bakayoko', 'Pedro Neto', 'Nonso Madueke'], nums: [14, 20] },
  { role: 'Centre-Forward', names: ['Liam Delap', 'Jonathan David', 'Benjamin Šeško'], nums: [9, 19] },
];

const NATIONALITIES = ['England', 'Spain', 'France', 'Germany', 'Italy', 'Brazil', 'Argentina', 'Netherlands', 'Portugal', 'Belgium'];

function getClubSquad(club) {
  const usedNums = new Set((club.stars || []).map((s) => s.num));
  const usedNames = new Set((club.stars || []).map((s) => s.name));
  const squad = (club.stars || []).map((s, idx) => ({
    id: s.id,
    name: s.name,
    position: s.pos,
    dateOfBirth: `${1994 + ((s.id + idx) % 11)}-0${1 + (idx % 9)}-${10 + ((s.id + idx) % 18)}`,
    nationality: s.nat,
    shirtNumber: s.num,
    _stats: {
      playedMatches: 18 + ((club.id + idx) % 9),
      goals: s.g || 0,
      assists: s.a || 0,
      penalties: s.p || 0,
    },
  }));

  // Ensure each team has a rich 15-player seasonal roster
  let seq = 1;
  for (const tpl of EXTRA_SQUAD_TEMPLATES) {
    if (squad.length >= 15) break;
    const hasPos = squad.some((p) => p.position === tpl.role);
    if (hasPos && squad.length >= 12) continue;

    const pickedName = tpl.names[(club.id + seq) % tpl.names.length];
    if (usedNames.has(pickedName)) {
      seq += 1;
      continue;
    }

    let num = tpl.nums[seq % tpl.nums.length];
    while (usedNums.has(num)) num += 1;
    usedNums.add(num);
    usedNames.add(pickedName);

    const pid = club.id * 100 + seq;
    const isAttacker = tpl.role.includes('Forward') || tpl.role.includes('Winger') || tpl.role.includes('Attacking');
    squad.push({
      id: pid,
      name: pickedName,
      position: tpl.role,
      dateOfBirth: `${1996 + ((pid + seq) % 9)}-0${1 + (seq % 9)}-${11 + (pid % 17)}`,
      nationality: NATIONALITIES[(club.id + seq) % NATIONALITIES.length],
      shirtNumber: num,
      _stats: {
        playedMatches: 14 + ((club.id + seq) % 11),
        goals: isAttacker ? 2 + ((club.id + seq) % 5) : tpl.role === 'Goalkeeper' ? 0 : (club.id + seq) % 2,
        assists: tpl.role === 'Goalkeeper' ? 0 : 1 + ((club.id + seq) % 4),
        penalties: 0,
      },
    });
    seq += 1;
  }

  return squad;
}

function buildCompetitionHeader(comp) {
  return {
    id: comp.id,
    name: comp.name,
    code: comp.code,
    type: comp.type,
    emblem: buildCrestSvgDataUri(comp.code, [comp.accent, '#0f172a']),
    area: { name: comp.area },
  };
}

function generateForm(rank, totalTeams, seed) {
  const outcomes = [];
  for (let i = 0; i < 5; i += 1) {
    const score = ((rank * 3 + i * 7 + seed) % 10);
    if (rank <= Math.ceil(totalTeams * 0.25)) {
      outcomes.push(score < 6 ? 'W' : score < 9 ? 'D' : 'L');
    } else if (rank <= Math.ceil(totalTeams * 0.65)) {
      outcomes.push(score < 4 ? 'W' : score < 7 ? 'D' : 'L');
    } else {
      outcomes.push(score < 2 ? 'W' : score < 5 ? 'D' : 'L');
    }
  }
  return outcomes.join(',');
}

function getSeedStandings(code) {
  const comp = getCompetitionByCode(code);
  if (!comp) return null;

  const roster = COMPETITION_ROSTERS[comp.code] || [];
  const totalTeams = roster.length;
  const isCup = comp.type === 'CUP';
  const baseGames = isCup ? 8 : 26;

  const totalRows = [];
  const homeRows = [];
  const awayRows = [];

  roster.forEach((clubId, index) => {
    const club = CLUBS[clubId];
    if (!club) return;
    const position = index + 1;
    const playedGames = baseGames;
    const strength = Math.max(0.15, 1 - index / Math.max(totalTeams, 1));

    const won = Math.min(playedGames - 1, Math.max(1, Math.round(playedGames * (0.22 + strength * 0.56))));
    const remaining = playedGames - won;
    const draw = Math.min(remaining, Math.max(1, Math.round(remaining * (0.35 + ((clubId + index) % 3) * 0.08))));
    const lost = Math.max(0, playedGames - won - draw);

    const goalsFor = Math.max(won * 2 + 4, Math.round(playedGames * (0.85 + strength * 1.45)));
    const goalsAgainst = Math.max(8, Math.round(playedGames * (1.75 - strength * 0.95)));
    const goalDifference = goalsFor - goalsAgainst;
    const points = won * 3 + draw;

    const homePlayed = Math.ceil(playedGames / 2);
    const awayPlayed = playedGames - homePlayed;
    const homeWon = Math.min(homePlayed, Math.ceil(won * 0.58));
    const awayWon = won - homeWon;
    const homeDraw = Math.min(homePlayed - homeWon, Math.floor(draw * 0.5));
    const awayDraw = draw - homeDraw;
    const homeLost = Math.max(0, homePlayed - homeWon - homeDraw);
    const awayLost = Math.max(0, awayPlayed - awayWon - awayDraw);
    const homeGF = Math.ceil(goalsFor * 0.56);
    const awayGF = goalsFor - homeGF;
    const homeGA = Math.floor(goalsAgainst * 0.44);
    const awayGA = goalsAgainst - homeGA;

    const team = getClubSummary(clubId);
    const form = generateForm(position, totalTeams, comp.id);

    totalRows.push({
      position,
      team,
      playedGames,
      form,
      won,
      draw,
      lost,
      points,
      goalsFor,
      goalsAgainst,
      goalDifference,
    });

    homeRows.push({
      position,
      team,
      playedGames: homePlayed,
      form: null,
      won: homeWon,
      draw: homeDraw,
      lost: homeLost,
      points: homeWon * 3 + homeDraw,
      goalsFor: homeGF,
      goalsAgainst: homeGA,
      goalDifference: homeGF - homeGA,
    });

    awayRows.push({
      position,
      team,
      playedGames: awayPlayed,
      form: null,
      won: awayWon,
      draw: awayDraw,
      lost: awayLost,
      points: awayWon * 3 + awayDraw,
      goalsFor: awayGF,
      goalsAgainst: awayGA,
      goalDifference: awayGF - awayGA,
    });
  });

  // Sort TOTAL/HOME/AWAY properly by points desc, GD desc
  const sortTable = (rows) =>
    rows
      .sort((a, b) => b.points - a.points || b.goalDifference - a.goalDifference || b.goalsFor - a.goalsFor)
      .map((row, idx) => ({ ...row, position: idx + 1 }));

  const stageName = isCup ? 'LEAGUE_STAGE' : 'REGULAR_SEASON';
  const currentSeason = getCurrentEuropeanSeason();

  return {
    filters: { season: String(currentSeason.startYear) },
    area: { id: comp.id, name: comp.area, code: comp.code },
    competition: buildCompetitionHeader(comp),
    season: {
      id: currentSeason.startYear * 100 + comp.id,
      startDate: currentSeason.startDate,
      endDate: currentSeason.endDate,
      currentMatchday: baseGames,
      winner: null,
    },
    standings: [
      { stage: stageName, type: 'TOTAL', group: null, table: sortTable(totalRows) },
      { stage: stageName, type: 'HOME', group: null, table: sortTable(homeRows) },
      { stage: stageName, type: 'AWAY', group: null, table: sortTable(awayRows) },
    ],
  };
}

function isoOffset(daysOffset, hourUtc = 19, minuteUtc = 0) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + daysOffset);
  d.setUTCHours(hourUtc, minuteUtc, 0, 0);
  return d.toISOString();
}

function getSeedMatches(code) {
  const comp = getCompetitionByCode(code);
  if (!comp) return null;

  const roster = COMPETITION_ROSTERS[comp.code] || [];
  if (roster.length < 4) return { competition: buildCompetitionHeader(comp), matches: [] };

  const compHeader = buildCompetitionHeader(comp);
  const currentMatchday = comp.type === 'CUP' ? 8 : 26;
  const matches = [];
  const baseMatchId = comp.id * 1000;

  // Build 3 rounds:
  // Round 1 (Matchday current-1): FINISHED (-4 days & -3 days)
  // Round 2 (Matchday current): mix of FINISHED (-1 day), IN_PLAY / TIMED (today), SCHEDULED (+1 day)
  // Round 3 (Matchday current+1): SCHEDULED (+5 days & +7 days)
  const pairCount = Math.min(8, Math.floor(roster.length / 2));

  // Round 1: Finished results
  for (let i = 0; i < pairCount; i += 1) {
    const homeId = roster[(i * 2) % roster.length];
    const awayId = roster[(i * 2 + 1) % roster.length];
    const homeClub = CLUBS[homeId];
    const hg = 1 + ((comp.id + i) % 3);
    const ag = (comp.id + i * 2) % 3;
    const htH = Math.min(hg, i % 2);
    const htA = Math.min(ag, (i + 1) % 2);
    const winner = hg > ag ? 'HOME_TEAM' : ag > hg ? 'AWAY_TEAM' : 'DRAW';

    matches.push({
      id: baseMatchId + 100 + i,
      competition: compHeader,
      utcDate: isoOffset(i < 4 ? -4 : -3, 14 + (i % 4) * 2, i % 2 === 0 ? 0 : 30),
      status: 'FINISHED',
      matchday: currentMatchday - 1,
      stage: comp.type === 'CUP' ? 'LEAGUE_STAGE' : 'REGULAR_SEASON',
      group: null,
      venue: homeClub.venue,
      homeTeam: getClubSummary(homeId),
      awayTeam: getClubSummary(awayId),
      score: {
        winner,
        duration: 'REGULAR',
        fullTime: { home: hg, away: ag },
        halfTime: { home: htH, away: htA },
      },
      referees: [{ id: 800 + i, name: 'Michael Oliver', type: 'REFEREE', nationality: 'England' }],
    });
  }

  // Round 2: Recent + Live/Today + Tomorrow
  for (let i = 0; i < pairCount; i += 1) {
    const homeId = roster[(i * 2 + 1) % roster.length];
    const awayId = roster[(i * 2 + 2) % roster.length];
    const homeClub = CLUBS[homeId];

    let status = 'SCHEDULED';
    let dayOffset = 1;
    let hour = 19;
    let hg = null;
    let ag = null;
    let htH = null;
    let htA = null;
    let winner = null;

    if (i === 0) {
      status = 'FINISHED';
      dayOffset = -1;
      hour = 20;
      hg = 2;
      ag = 1;
      htH = 1;
      htA = 0;
      winner = 'HOME_TEAM';
    } else if (i === 1 && (comp.code === 'PL' || comp.code === 'CL' || comp.code === 'PD')) {
      status = 'IN_PLAY';
      dayOffset = 0;
      hour = new Date().getUTCHours();
      hg = 1;
      ag = 1;
      htH = 1;
      htA = 0;
      winner = 'DRAW';
    } else if (i <= 3) {
      status = 'TIMED';
      dayOffset = 0;
      hour = 18 + (i % 3);
    }

    matches.push({
      id: baseMatchId + 200 + i,
      competition: compHeader,
      utcDate: isoOffset(dayOffset, hour, 0),
      status,
      matchday: currentMatchday,
      stage: comp.type === 'CUP' ? 'LEAGUE_STAGE' : 'REGULAR_SEASON',
      group: null,
      venue: homeClub.venue,
      homeTeam: getClubSummary(homeId),
      awayTeam: getClubSummary(awayId),
      score: {
        winner,
        duration: 'REGULAR',
        fullTime: { home: hg, away: ag },
        halfTime: { home: htH, away: htA },
      },
      referees: [{ id: 810 + i, name: 'Anthony Taylor', type: 'REFEREE', nationality: 'England' }],
    });
  }

  // Round 3: Upcoming Fixtures
  for (let i = 0; i < pairCount; i += 1) {
    const homeId = roster[(i * 2 + 3) % roster.length];
    const awayId = roster[(i * 2) % roster.length];
    const homeClub = CLUBS[homeId];

    matches.push({
      id: baseMatchId + 300 + i,
      competition: compHeader,
      utcDate: isoOffset(i < 4 ? 5 : 7, 15 + (i % 4) * 2, 0),
      status: 'SCHEDULED',
      matchday: currentMatchday + 1,
      stage: comp.type === 'CUP' ? 'LEAGUE_STAGE' : 'REGULAR_SEASON',
      group: null,
      venue: homeClub.venue,
      homeTeam: getClubSummary(homeId),
      awayTeam: getClubSummary(awayId),
      score: {
        winner: null,
        duration: 'REGULAR',
        fullTime: { home: null, away: null },
        halfTime: { home: null, away: null },
      },
      referees: [],
    });
  }

  const currentSeason = getCurrentEuropeanSeason();

  return {
    filters: { season: String(currentSeason.startYear) },
    resultSet: { count: matches.length },
    competition: compHeader,
    season: {
      id: currentSeason.startYear * 100 + comp.id,
      startDate: currentSeason.startDate,
      endDate: currentSeason.endDate,
      currentMatchday,
    },
    matches: matches.sort((a, b) => new Date(a.utcDate) - new Date(b.utcDate)),
  };
}

function getSeedScorers(code, limit = 20) {
  const comp = getCompetitionByCode(code);
  if (!comp) return null;

  const roster = COMPETITION_ROSTERS[comp.code] || [];
  const scale = comp.type === 'CUP' ? 0.48 : 1;
  const scorers = [];

  for (const clubId of roster) {
    const club = CLUBS[clubId];
    if (!club) continue;
    const teamSummary = getClubSummary(clubId);
    for (const star of club.stars || []) {
      if ((star.g || 0) === 0 && (star.a || 0) === 0) continue;
      const goals = Math.max(1, Math.round((star.g || 0) * scale));
      const assists = Math.max(0, Math.round((star.a || 0) * scale));
      const penalties = Math.min(goals, Math.round((star.p || 0) * scale));
      const playedMatches = comp.type === 'CUP' ? 7 + (star.id % 2) : 21 + (star.id % 6);

      scorers.push({
        player: {
          id: star.id,
          name: star.name,
          firstName: star.name.split(' ')[0],
          lastName: star.name.split(' ').slice(1).join(' ') || star.name,
          dateOfBirth: `${1994 + (star.id % 10)}-04-12`,
          nationality: star.nat,
          section: star.pos,
          position: star.pos,
          shirtNumber: star.num,
        },
        team: teamSummary,
        playedMatches,
        goals,
        assists,
        penalties,
      });
    }
  }

  scorers.sort((a, b) => b.goals - a.goals || b.assists - a.assists || a.playedMatches - b.playedMatches);

  const currentSeason = getCurrentEuropeanSeason();

  return {
    count: Math.min(limit, scorers.length),
    filters: { season: String(currentSeason.startYear), limit },
    competition: buildCompetitionHeader(comp),
    season: {
      id: currentSeason.startYear * 100 + comp.id,
      startDate: currentSeason.startDate,
      endDate: currentSeason.endDate,
      currentMatchday: comp.type === 'CUP' ? 8 : 26,
    },
    scorers: scorers.slice(0, limit),
  };
}

function getSeedCompetitionTeams(code) {
  const comp = getCompetitionByCode(code);
  if (!comp) return null;
  const roster = COMPETITION_ROSTERS[comp.code] || [];
  return {
    count: roster.length,
    competition: buildCompetitionHeader(comp),
    teams: roster.map((id) => getSeedTeam(id)).filter(Boolean),
  };
}

function getSeedTeam(teamId) {
  const club = CLUBS[Number(teamId)];
  if (!club) return null;

  const runningCompetitions = [];
  if (club.league) {
    const l = getCompetitionByCode(club.league);
    if (l) runningCompetitions.push(buildCompetitionHeader(l));
  }
  if (club.uefa) {
    const u = getCompetitionByCode(club.uefa);
    if (u) runningCompetitions.push(buildCompetitionHeader(u));
  }

  return {
    id: club.id,
    name: club.name,
    shortName: club.shortName,
    tla: club.tla,
    crest: buildCrestSvgDataUri(club.tla, club.colors),
    area: { name: club.area },
    address: `${club.venue}, ${club.area}`,
    website: `https://www.football-data-central.local/clubs/${club.tla.toLowerCase()}`,
    founded: club.founded,
    clubColors: club.colors.join(' / '),
    venue: club.venue,
    runningCompetitions,
    coach: {
      id: club.id * 10 + 1,
      name: club.coach,
      nationality: club.coachNat,
      contract: { start: '2024-07', until: '2027-06' },
    },
    squad: getClubSquad(club),
  };
}

function getSeedTeamMatches(teamId) {
  const id = Number(teamId);
  if (!CLUBS[id]) return null;
  const allMatches = [];

  for (const comp of COMPETITIONS) {
    const roster = COMPETITION_ROSTERS[comp.code] || [];
    if (!roster.includes(id)) continue;
    const compMatches = getSeedMatches(comp.code)?.matches || [];
    for (const m of compMatches) {
      if (m.homeTeam.id === id || m.awayTeam.id === id) {
        allMatches.push(m);
      }
    }
  }

  allMatches.sort((a, b) => new Date(b.utcDate) - new Date(a.utcDate));
  return {
    resultSet: { count: allMatches.length },
    matches: allMatches,
  };
}

function findPlayerAndClub(personId) {
  const pid = Number(personId);
  for (const club of Object.values(CLUBS)) {
    const squad = getClubSquad(club);
    const found = squad.find((p) => p.id === pid);
    if (found) {
      return { player: found, club };
    }
  }
  return null;
}

function getSeedPlayer(personId) {
  const found = findPlayerAndClub(personId);
  if (!found) return null;
  const { player, club } = found;

  const runningCompetitions = [];
  if (club.league) runningCompetitions.push(buildCompetitionHeader(getCompetitionByCode(club.league)));
  if (club.uefa) runningCompetitions.push(buildCompetitionHeader(getCompetitionByCode(club.uefa)));

  return {
    id: player.id,
    name: player.name,
    firstName: player.name.split(' ')[0],
    lastName: player.name.split(' ').slice(1).join(' ') || player.name,
    dateOfBirth: player.dateOfBirth,
    nationality: player.nationality,
    section: player.position,
    position: player.position,
    shirtNumber: player.shirtNumber,
    currentTeam: {
      id: club.id,
      name: club.name,
      shortName: club.shortName,
      tla: club.tla,
      crest: buildCrestSvgDataUri(club.tla, club.colors),
      area: { name: club.area },
      runningCompetitions,
      contract: { start: '2024-07', until: '2028-06' },
    },
    seasonStats: {
      ...player._stats,
      minutesPlayed: player._stats.playedMatches * 79,
      goalContributions: player._stats.goals + player._stats.assists,
    },
  };
}

function getSeedPlayerMatches(personId) {
  const found = findPlayerAndClub(personId);
  if (!found) return null;
  const { player, club } = found;
  const teamMatches = getSeedTeamMatches(club.id)?.matches || [];

  return {
    resultSet: { count: teamMatches.length },
    person: {
      id: player.id,
      name: player.name,
      position: player.position,
    },
    aggregations: {
      matchesOnPitch: player._stats.playedMatches,
      startingXI: Math.max(1, player._stats.playedMatches - 2),
      minutesPlayed: player._stats.playedMatches * 79,
      goals: player._stats.goals,
      assists: player._stats.assists,
    },
    matches: teamMatches,
  };
}

function getSeedMatch(matchId) {
  const mid = Number(matchId);
  for (const comp of COMPETITIONS) {
    const payload = getSeedMatches(comp.code);
    const match = payload?.matches?.find((m) => m.id === mid);
    if (match) return match;
  }
  return null;
}

function getSeedMatchHead2Head(matchId) {
  const match = getSeedMatch(matchId);
  if (!match) return null;
  const h = match.homeTeam;
  const a = match.awayTeam;

  return {
    aggregations: {
      numberOfMatches: 6,
      totalGoals: 17,
      homeTeam: { id: h.id, name: h.name, wins: 3, draws: 1, losses: 2 },
      awayTeam: { id: a.id, name: a.name, wins: 2, draws: 1, losses: 3 },
    },
    matches: [
      {
        id: match.id * 10 + 1,
        utcDate: isoOffset(-110, 19, 45),
        status: 'FINISHED',
        competition: match.competition,
        homeTeam: a,
        awayTeam: h,
        score: { winner: 'AWAY_TEAM', fullTime: { home: 1, away: 2 } },
      },
      {
        id: match.id * 10 + 2,
        utcDate: isoOffset(-240, 17, 30),
        status: 'FINISHED',
        competition: match.competition,
        homeTeam: h,
        awayTeam: a,
        score: { winner: 'DRAW', fullTime: { home: 1, away: 1 } },
      },
      {
        id: match.id * 10 + 3,
        utcDate: isoOffset(-370, 20, 0),
        status: 'FINISHED',
        competition: match.competition,
        homeTeam: a,
        awayTeam: h,
        score: { winner: 'HOME_TEAM', fullTime: { home: 2, away: 0 } },
      },
    ],
  };
}

function searchSeedEntities(query) {
  const q = String(query || '').trim().toLowerCase();
  if (!q) return { competitions: [], teams: [], players: [] };

  const competitions = COMPETITIONS.filter(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      c.thaiName.toLowerCase().includes(q) ||
      c.code.toLowerCase().includes(q)
  ).slice(0, 5);

  const teams = [];
  const players = [];

  for (const club of Object.values(CLUBS)) {
    if (
      club.name.toLowerCase().includes(q) ||
      club.shortName.toLowerCase().includes(q) ||
      club.tla.toLowerCase().includes(q)
    ) {
      teams.push({
        id: club.id,
        name: club.name,
        shortName: club.shortName,
        tla: club.tla,
        area: club.area,
        league: club.league,
        crest: buildCrestSvgDataUri(club.tla, club.colors),
      });
    }

    for (const p of getClubSquad(club)) {
      if (p.name.toLowerCase().includes(q) || p.nationality.toLowerCase().includes(q)) {
        players.push({
          id: p.id,
          name: p.name,
          position: p.position,
          nationality: p.nationality,
          shirtNumber: p.shirtNumber,
          team: getClubSummary(club.id),
          goals: p._stats.goals,
          assists: p._stats.assists,
        });
      }
    }
  }

  return {
    competitions,
    teams: teams.slice(0, 12),
    players: players.slice(0, 15),
  };
}

module.exports = {
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
  searchSeedEntities,
};
