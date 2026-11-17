import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Award, Trophy } from 'lucide-react';
import { getCompetitions, getScorers, getStandings, triggerManualSync } from '../api/client';
import ClubBadge from '../components/ClubBadge';
import DataSourceBanner from '../components/DataSourceBanner';
import LeagueSelector from '../components/LeagueSelector';
import StandingsTable from '../components/StandingsTable';

export default function StandingsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCode = searchParams.get('league') || 'PL';

  const [competitions, setCompetitions] = useState([]);
  const [selectedCode, setSelectedCode] = useState(initialCode);
  const [standingsRes, setStandingsRes] = useState(null);
  const [scorersRes, setScorersRes] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

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

  const loadData = (code) => {
    setLoading(true);
    setError('');
    Promise.all([getStandings(code), getScorers(code, 10)])
      .then(([st, sc]) => {
        setStandingsRes(st);
        setScorersRes(sc);
      })
      .catch(() => setError('ไม่สามารถโหลดตารางคะแนนได้ในขณะนี้'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData(selectedCode);
  }, [selectedCode]);

  const handleSelectLeague = (code) => {
    setSelectedCode(code);
    setSearchParams({ league: code });
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await triggerManualSync(selectedCode);
      loadData(selectedCode);
    } catch {
      loadData(selectedCode);
    } finally {
      setRefreshing(false);
    }
  };

  const compMeta = standingsRes?.competitionMeta || competitions.find((c) => c.code === selectedCode);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2.5 text-2xl font-extrabold text-white">
            <Trophy className="h-6 w-6 text-emerald-400" />
            <span>ตารางคะแนน (Standings)</span>
          </h1>
          <p className="text-sm text-slate-400">
            {compMeta ? `${compMeta.name} — ${compMeta.thaiName}` : 'รายละเอียดอันดับคะแนน ชนะ เสมอ แพ้ ประตูได้เสีย และฟอร์มล่าสุด'}
          </p>
        </div>
      </div>

      <LeagueSelector
        competitions={competitions}
        selectedCode={selectedCode}
        onSelect={handleSelectLeague}
      />

      {standingsRes && (
        <DataSourceBanner
          source={standingsRes.source}
          isDemo={standingsRes.isDemo}
          stale={standingsRes.stale}
          warning={standingsRes.warning}
          seasonMeta={standingsRes.seasonMeta}
          updatedAt={standingsRes.updatedAt}
          onRefresh={handleRefresh}
          refreshing={refreshing}
        />
      )}

      {error && (
        <div className="rounded-xl border border-rose-500/40 bg-rose-950/60 p-4 text-sm text-rose-200">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <div className="h-96 animate-pulse rounded-2xl border border-slate-800 bg-slate-900/60" />
          <div className="h-96 animate-pulse rounded-2xl border border-slate-800 bg-slate-900/60" />
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <div>
            <StandingsTable
              standingsPayload={standingsRes?.data}
              competitionMeta={compMeta}
            />
          </div>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
              <div className="mb-4 flex items-center justify-between border-b border-slate-800 pb-3">
                <h2 className="flex items-center gap-2 text-sm font-bold text-white">
                  <Award className="h-4 w-4 text-amber-400" />
                  <span>ดาวซัลโวประจำรายการ</span>
                </h2>
                <Link
                  to={`/players?league=${selectedCode}`}
                  className="text-xs font-medium text-emerald-400 hover:text-emerald-300"
                >
                  ทั้งหมด →
                </Link>
              </div>

              <div className="space-y-2.5">
                {(scorersRes?.data?.scorers || []).map((s, i) => (
                  <div
                    key={s.player?.id || i}
                    className="flex items-center justify-between rounded-xl border border-slate-800/70 bg-slate-950/60 px-3 py-2.5"
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <span
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[11px] font-bold ${
                          i === 0
                            ? 'bg-amber-400 text-slate-950'
                            : i === 1
                              ? 'bg-slate-300 text-slate-950'
                              : i === 2
                                ? 'bg-amber-700 text-white'
                                : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {i + 1}
                      </span>
                      <ClubBadge crest={s.team?.crest} name={s.team?.name} tla={s.team?.tla} size="sm" />
                      <div className="min-w-0">
                        <Link
                          to={`/players/${s.player?.id}`}
                          className="block truncate text-xs font-semibold text-white hover:text-emerald-300"
                        >
                          {s.player?.name}
                        </Link>
                        <Link
                          to={`/teams/${s.team?.id}`}
                          className="block truncate text-[11px] text-slate-400 hover:text-slate-200"
                        >
                          {s.team?.shortName || s.team?.name}
                        </Link>
                      </div>
                    </div>

                    <div className="text-right tabular-nums">
                      <span className="block text-sm font-extrabold text-emerald-400">{s.goals}</span>
                      <span className="block text-[10px] text-slate-500">{s.assists ?? 0}A</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
