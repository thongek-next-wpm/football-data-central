const axios = require('axios');
const { rateLimiter } = require('./rateLimiter');

const PLACEHOLDER_KEYS = new Set([
  '',
  'your_football_data_org_api_key',
  'YOUR_API_KEY',
  'changeme',
]);

function getApiKey() {
  return (process.env.FOOTBALL_DATA_API_KEY || '').trim();
}

function isApiKeyConfigured() {
  const key = getApiKey();
  return Boolean(key && !PLACEHOLDER_KEYS.has(key));
}

const apiClient = axios.create({
  baseURL: 'https://api.football-data.org/v4',
  timeout: 12000,
});

async function requestFootballData(endpoint, params = {}, { priority = 'normal' } = {}) {
  const apiKey = getApiKey();
  if (!isApiKeyConfigured()) {
    const err = new Error('FOOTBALL_DATA_API_KEY is not configured');
    err.code = 'API_KEY_MISSING';
    throw err;
  }

  return rateLimiter.schedule(
    async () => {
      try {
        const response = await apiClient.get(endpoint, {
          params,
          headers: {
            'X-Auth-Token': apiKey,
          },
        });
        rateLimiter.notifyHeaders(response.headers);
        return response.data;
      } catch (err) {
        const status = err.response?.status;
        if (status === 429) {
          const retryAfter = err.response?.headers?.['retry-after'] || err.response?.headers?.['x-requestcounter-reset'] || 60;
          rateLimiter.notifyRateLimit(retryAfter);
        }
        const wrapped = new Error(
          err.response?.data?.message || err.message || `football-data.org error (${status || 'network'})`
        );
        wrapped.httpStatus = status;
        wrapped.code =
          status === 403
            ? 'API_TIER_RESTRICTED'
            : status === 429
              ? 'API_RATE_LIMITED'
              : status === 404
                ? 'API_NOT_FOUND'
                : 'API_REQUEST_FAILED';
        throw wrapped;
      }
    },
    { priority }
  );
}

async function fetchStandings(competitionCode, options, params = {}) {
  return requestFootballData(`/competitions/${competitionCode}/standings`, params, options);
}

async function fetchMatches(competitionCode, params = {}, options) {
  return requestFootballData(`/competitions/${competitionCode}/matches`, params, options);
}

async function fetchScorers(competitionCode, limit = 20, options, extraParams = {}) {
  return requestFootballData(
    `/competitions/${competitionCode}/scorers`,
    { limit, ...extraParams },
    options
  );
}

async function fetchCompetitionTeams(competitionCode, options) {
  return requestFootballData(`/competitions/${competitionCode}/teams`, {}, options);
}

async function fetchTeam(teamId, options) {
  return requestFootballData(`/teams/${teamId}`, {}, options);
}

async function fetchTeamMatches(teamId, params = { limit: 25 }, options) {
  return requestFootballData(`/teams/${teamId}/matches`, params, options);
}

async function fetchPlayer(personId, options) {
  return requestFootballData(`/persons/${personId}`, {}, options);
}

async function fetchPlayerMatches(personId, params = { limit: 15 }, options) {
  return requestFootballData(`/persons/${personId}/matches`, params, options);
}

async function fetchMatch(matchId, options) {
  return requestFootballData(`/matches/${matchId}`, {}, options);
}

async function fetchMatchHead2Head(matchId, limit = 10, options) {
  return requestFootballData(`/matches/${matchId}/head2head`, { limit }, options);
}

module.exports = {
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
};
