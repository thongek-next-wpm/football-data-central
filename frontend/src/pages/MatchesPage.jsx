import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Calendar, Filter, Search } from 'lucide-react';
import { getAllMatches, getCompetitions, getMatches } from '../api/client';
import DataSourceBanner from '../components/DataSourceBanner';
import LeagueSelector from '../components/LeagueSelector';
import MatchCard from '../components/MatchCard';
import MatchDetailModal from '../components/MatchDetailModal';
import { formatThaiDateHeader, getBangkokDateKey } from '../utils/formatters';

export default function MatchesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialLeague = searchParams.get('league') || 'PL';

  const [competitions, setCompetitions] = useState([]);
  const [selectedCode, setSelectedCode] = useState(initialLeague);
  const [statusTab, setStatusTab] = useState('ALL');
  const [matchdayFilter, setMatchdayFilter] = useState('ALL');
  const [teamSearch, setTeamSearch] = useState('');
  const [matchesRes, setMatchesRes] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState(null);

  useEffect(() => {
    const paramLeague = searchParams.get('league');
    if (paramLeague && paramLeague !== selectedCode) {
      setSelectedCode(paramLeague);
    }
  }, [searchParams]);

  useEffect(() => {
    getCompetitions()
      .then((res) => setCompetitions(res.competitions || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    setMatchdayFilter('ALL');
    const loader = selectedCode === 'ALL' ? getAllMatches() : getMatches(selectedCode);
    loader
      .then((res) => setMatchesRes(res))
      .catch(() => setMatchesRes(null))
      .finally(() => setLoading(false));
  }, [selectedCode]);

  const handleSelectLeague = (code) => {
    setSelectedCode(code);
    setSearchParams({ league: code });
  };

  const allMatches = matchesRes?.data?.matches || [];

  const availableMatchdays = useMemo(() => {
    if (selectedCode === 'ALL') return [];
    const set = new Set(allMatches.map((m) => m.matchday).filter(Boolean));
    return Array.from(set).sort((a, b) => a - b);
  }, [allMatches, selectedCode]);

  const filteredMatches = useMemo(() => {
    let list = allMatches;
    if (statusTab === 'LIVE') {
      list = list.filter((m) => ['LIVE', 'IN_PLAY', 'PAUSED', 'HALFTIME'].includes(m.status));
    } else if (statusTab === 'FINISHED') {
      list = list.filter((m) => m.status === 'FINISHED');
    } else if (statusTab === 'UPCOMING') {
      list = list.filter((m) => ['SCHEDULED', 'TIMED'].includes(m.status));
    }

    if (matchdayFilter !== 'ALL') {
      list = list.filter((m) => String(m.matchday) === String(matchdayFilter));
    }

    if (teamSearch.trim()) {
      const q = teamSearch.trim().toLowerCase();
      list = list.filter(
        (m) =>
          m.homeTeam?.name?.toLowerCase().includes(q) ||
          m.homeTeam?.shortName?.toLowerCase().includes(q) ||
          m.awayTeam?.name?.toLowerCase().includes(q) ||
          m.awayTeam?.shortName?.toLowerCase().includes(q)
      );
    }

    return [...list].sort((a, b) =>
      statusTab === 'FINISHED'
        ? new Date(b.utcDate) - new Date(a.utcDate)
        : new Date(a.utcDate) - new Date(b.utcDate)
    );
  }, [allMatches, statusTab, matchdayFilter, teamSearch]);

  const groupedByDate = useMemo(() => {
    const groups = [];
    const map = new Map();
    for (const m of filteredMatches) {
      const key = getBangkokDateKey(m.utcDate);
      if (!map.has(key)) {
        const entry = { key, label: formatThaiDateHeader(m.utcDate), items: [] };
        map.set(key, entry);
        groups.push(entry);
      }
      map.get(key).items.push(m);
    }
    return groups;
  }, [filteredMatches]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2.5 text-2xl font-extrabold text-white">
          <Calendar className="h-6 w-6 text-emerald-400" />
          <span>ผลการแข่งขันและโปรแกรมล่วงหน้า</span>
        </h1>
        <p className="text-sm text-slate-400">
          ผลบอลย้อนหลัง แมตช์กำลังแข่ง และตารางแข่งขันที่กำลังจะมาถึง (คลิกที่คู่แข่งเพื่อดูสถิติ Head-to-Head)
        </p>
      </div>

      <LeagueSelector
        competitions={competitions}
        selectedCode={selectedCode}
        onSelect={handleSelectLeague}
        includeAll
      />

      {matchesRes && (
        <DataSourceBanner
          source={matchesRes.source}
          isDemo={matchesRes.isDemo}
          stale={matchesRes.stale}
          warning={matchesRes.warning}
          seasonMeta={matchesRes.seasonMeta}
          updatedAt={matchesRes.updatedAt}
        />
      )}

      {/* Filter Controls */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-3.5 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {[
            { id: 'ALL', label: `ทั้งหมด (${allMatches.length})` },
            { id: 'LIVE', label: 'กำลังแข่ง (Live)' },
            { id: 'UPCOMING', label: 'โปรแกรมถัดไป' },
            { id: 'FINISHED', label: 'ผลบอลย้อนหลัง' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusTab(tab.id)}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                statusTab === tab.id
                  ? 'bg-emerald-500 text-slate-950'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {availableMatchdays.length > 0 && (
            <div className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-xs">
              <Filter className="h-3.5 w-3.5 text-slate-400" />
              <select
                id="matchday-filter"
                name="matchday"
                aria-label="กรองตาม Matchday"
                value={matchdayFilter}
                onChange={(e) => setMatchdayFilter(e.target.value)}
                className="bg-transparent text-slate-200 outline-none"
              >
                <option value="ALL" className="bg-slate-900">ทุก Matchday</option>
                {availableMatchdays.map((md) => (
                  <option key={md} value={md} className="bg-slate-900">
                    Matchday {md}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs">
            <Search className="h-3.5 w-3.5 text-slate-400" />
            <input
              id="matches-team-filter"
              name="teamSearch"
              aria-label="กรองชื่อทีม"
              type="text"
              value={teamSearch}
              onChange={(e) => setTeamSearch(e.target.value)}
              placeholder="กรองชื่อทีม..."
              className="w-36 bg-transparent text-white placeholder-slate-500 outline-none"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-3 md:grid-cols-2">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="h-28 animate-pulse rounded-2xl border border-slate-800 bg-slate-900/50" />
          ))}
        </div>
      ) : groupedByDate.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 text-center text-sm text-slate-400">
          ไม่พบการแข่งขันตามเงื่อนไขที่เลือก
        </div>
      ) : (
        <div className="space-y-6">
          {groupedByDate.map((grp) => (
            <div key={grp.key} className="space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-800/80 pb-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                <h2 className="text-sm font-bold text-slate-200">{grp.label}</h2>
                <span className="text-xs text-slate-500">({grp.items.length} คู่)</span>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {grp.items.map((m) => (
                  <MatchCard
                    key={m.id}
                    match={m}
                    showCompetition={selectedCode === 'ALL'}
                    onSelect={setSelectedMatch}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <MatchDetailModal match={selectedMatch} onClose={() => setSelectedMatch(null)} />
    </div>
  );
}
