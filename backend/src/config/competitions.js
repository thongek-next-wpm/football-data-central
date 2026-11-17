const COMPETITIONS = [
  {
    code: 'PL',
    id: 2021,
    name: 'Premier League',
    thaiName: 'พรีเมียร์ลีก อังกฤษ',
    area: 'England',
    thaiArea: 'อังกฤษ',
    category: 'TOP_5_LEAGUE',
    type: 'LEAGUE',
    freeTierAvailable: true,
    accent: '#38bdf8',
    zones: { ucl: 4, uel: 5, uecl: 6, relegationStart: 18 },
  },
  {
    code: 'PD',
    id: 2014,
    name: 'La Liga',
    thaiName: 'ลาลีกา สเปน',
    area: 'Spain',
    thaiArea: 'สเปน',
    category: 'TOP_5_LEAGUE',
    type: 'LEAGUE',
    freeTierAvailable: true,
    accent: '#f59e0b',
    zones: { ucl: 4, uel: 5, uecl: 6, relegationStart: 18 },
  },
  {
    code: 'SA',
    id: 2019,
    name: 'Serie A',
    thaiName: 'กัลโช เซเรีย อา อิตาลี',
    area: 'Italy',
    thaiArea: 'อิตาลี',
    category: 'TOP_5_LEAGUE',
    type: 'LEAGUE',
    freeTierAvailable: true,
    accent: '#3b82f6',
    zones: { ucl: 4, uel: 5, uecl: 6, relegationStart: 18 },
  },
  {
    code: 'BL1',
    id: 2002,
    name: 'Bundesliga',
    thaiName: 'บุนเดสลีกา เยอรมนี',
    area: 'Germany',
    thaiArea: 'เยอรมนี',
    category: 'TOP_5_LEAGUE',
    type: 'LEAGUE',
    freeTierAvailable: true,
    accent: '#ef4444',
    zones: { ucl: 4, uel: 5, uecl: 6, relegationStart: 16 },
  },
  {
    code: 'FL1',
    id: 2015,
    name: 'Ligue 1',
    thaiName: 'ลีกเอิง ฝรั่งเศส',
    area: 'France',
    thaiArea: 'ฝรั่งเศส',
    category: 'TOP_5_LEAGUE',
    type: 'LEAGUE',
    freeTierAvailable: true,
    accent: '#10b981',
    zones: { ucl: 3, uel: 5, uecl: 6, relegationStart: 16 },
  },
  {
    code: 'CL',
    id: 2001,
    name: 'UEFA Champions League',
    thaiName: 'ยูฟ่า แชมเปี้ยนส์ลีก',
    area: 'Europe',
    thaiArea: 'ยุโรป',
    category: 'UEFA_COMPETITION',
    type: 'CUP',
    freeTierAvailable: true,
    accent: '#6366f1',
    zones: { ucl: 8, playoffStart: 9, playoffEnd: 24, eliminatedStart: 25 },
  },
  {
    code: 'EL',
    id: 2146,
    name: 'UEFA Europa League',
    thaiName: 'ยูฟ่า ยูโรปาลีก',
    area: 'Europe',
    thaiArea: 'ยุโรป',
    category: 'UEFA_COMPETITION',
    type: 'CUP',
    freeTierAvailable: false,
    accent: '#f97316',
    zones: { ucl: 8, playoffStart: 9, playoffEnd: 24, eliminatedStart: 25 },
  },
  {
    code: 'UCL',
    id: 2154,
    name: 'UEFA Conference League',
    thaiName: 'ยูฟ่า คอนเฟอเรนซ์ลีก',
    area: 'Europe',
    thaiArea: 'ยุโรป',
    category: 'UEFA_COMPETITION',
    type: 'CUP',
    freeTierAvailable: false,
    accent: '#14b8a6',
    zones: { ucl: 8, playoffStart: 9, playoffEnd: 24, eliminatedStart: 25 },
  },
];

// Support common aliases (e.g. legacy EC or UECL for UEFA Conference League)
const CODE_ALIASES = {
  EC: 'UCL',
  UECL: 'UCL',
  EPL: 'PL',
  LALIGA: 'PD',
};

const COMPETITION_MAP = new Map(COMPETITIONS.map((c) => [c.code, c]));

function resolveCompetitionCode(rawCode) {
  if (!rawCode) return null;
  const upper = String(rawCode).trim().toUpperCase();
  const normalized = CODE_ALIASES[upper] || upper;
  return COMPETITION_MAP.has(normalized) ? normalized : null;
}

function getCompetitionByCode(rawCode) {
  const code = resolveCompetitionCode(rawCode);
  return code ? COMPETITION_MAP.get(code) : null;
}

module.exports = {
  COMPETITIONS,
  CODE_ALIASES,
  COMPETITION_MAP,
  resolveCompetitionCode,
  getCompetitionByCode,
};
