import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 15000,
});

export const getHealth = () => api.get('/health').then((res) => res.data);
export const getSystemStatus = () => api.get('/system/status').then((res) => res.data);
export const getCompetitions = () => api.get('/competitions').then((res) => res.data);
export const getOverview = () => api.get('/overview').then((res) => res.data);

export const getStandings = (code) =>
  api.get(`/competitions/${code}/standings`).then((res) => res.data);

export const getMatches = (code, params = {}) =>
  api.get(`/competitions/${code}/matches`, { params }).then((res) => res.data);

export const getAllMatches = (params = {}) =>
  api.get('/matches', { params }).then((res) => res.data);

export const getMatchDetail = (id) =>
  api.get(`/matches/${id}`).then((res) => res.data);

export const getScorers = (code, limit = 25) =>
  api.get(`/competitions/${code}/scorers`, { params: { limit } }).then((res) => res.data);

export const getCompetitionTeams = (code) =>
  api.get(`/competitions/${code}/teams`).then((res) => res.data);

export const getAllPlayers = (params = {}) =>
  api.get('/players', { params }).then((res) => res.data);

export const getTeamProfile = (id) =>
  api.get(`/teams/${id}`).then((res) => res.data);

export const getPlayerProfile = (id) =>
  api.get(`/players/${id}`).then((res) => res.data);

export const searchEntities = (q) =>
  api.get('/search', { params: { q } }).then((res) => res.data);

export const triggerManualSync = (code) =>
  api.post(`/system/sync/${code}`).then((res) => res.data);

export const getSupercomputerOverview = () =>
  api.get('/supercomputer').then((res) => res.data);

export const getCompetitionSupercomputer = (code, params = {}) =>
  api.get(`/competitions/${code}/supercomputer`, { params }).then((res) => res.data);

export const predictCustomMatchup = (code, homeId, awayId) =>
  api
    .get(`/competitions/${code}/supercomputer/matchup`, { params: { homeId, awayId } })
    .then((res) => res.data);
