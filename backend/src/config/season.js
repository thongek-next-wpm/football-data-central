function getCurrentEuropeanSeason(now = new Date()) {
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth(); // 0-indexed: 6 = July, 7 = August
  const startYear = month >= 6 ? year : year - 1;
  const endYear = startYear + 1;
  const shortEnd = String(endYear).slice(-2);

  return {
    startYear,
    endYear,
    label: `${startYear}/${shortEnd}`,
    startDate: `${startYear}-08-15`,
    endDate: `${endYear}-05-25`,
  };
}

function extractSeasonMeta(payload, requestedSeason = 'latest') {
  const fallback = getCurrentEuropeanSeason();
  const seasonObj = payload?.season || payload?.matches?.[0]?.season || null;

  let startYear = null;
  if (seasonObj?.startDate) {
    const parsed = Number(String(seasonObj.startDate).slice(0, 4));
    if (!Number.isNaN(parsed)) startYear = parsed;
  } else if (payload?.filters?.season && /^\d{4}$/.test(String(payload.filters.season))) {
    startYear = Number(payload.filters.season);
  }

  const effectiveStart = startYear || fallback.startYear;
  let endYear = effectiveStart + 1;
  if (seasonObj?.endDate) {
    const parsedEnd = Number(String(seasonObj.endDate).slice(0, 4));
    if (!Number.isNaN(parsedEnd) && parsedEnd >= effectiveStart) {
      endYear = parsedEnd;
    }
  }

  const label =
    endYear > effectiveStart
      ? `${effectiveStart}/${String(endYear).slice(-2)}`
      : String(effectiveStart);

  return {
    startYear: effectiveStart,
    endYear,
    label,
    startDate: seasonObj?.startDate || `${effectiveStart}-08-15`,
    endDate: seasonObj?.endDate || `${endYear}-05-25`,
    currentMatchday: seasonObj?.currentMatchday || null,
    isLatest: !requestedSeason || requestedSeason === 'latest' || Number(requestedSeason) === fallback.startYear,
  };
}

module.exports = {
  getCurrentEuropeanSeason,
  extractSeasonMeta,
};
