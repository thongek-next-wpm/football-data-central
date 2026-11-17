import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Award, Search, Users } from 'lucide-react';
import { getAllPlayers, getCompetitions } from '../api/client';
import ClubBadge from '../components/ClubBadge';
import DataSourceBanner from '../components/DataSourceBanner';
import LeagueSelector from '../components/LeagueSelector';
import { translatePosition } from '../utils/formatters';

export default function PlayersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialLeague = searchParams.get('league') || 'ALL';

  const [competitions, setCompetitions] = useState([]);
  const [selectedCode, setSelectedCode] = useState(initialLeague);
  const [positionFilter, setPositionFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [playersRes, setPlayersRes] = useState(null);
  const [loading, setLoading] = useState(true);

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
    const params = {};
    if (selectedCode !== 'ALL') params.code = selectedCode;
    if (positionFilter !== 'ALL') params.position = positionFilter;
    if (searchTerm.trim()) params.search = searchTerm.trim();

    const timer = setTimeout(() => {
      getAllPlayers(params)
        .then((res) => setPlayersRes(res))
        .catch(() => setPlayersRes(null))
        .finally(() => setLoading(false));
    }, 150);

    return () => clearTimeout(timer);
  }, [selectedCode, positionFilter, searchTerm]);

  const handleSelectLeague = (code) => {
    setSelectedCode(code);
    setSearchParams(code === 'ALL' ? {} : { league: code });
  };

  const scorers = playersRes?.data?.scorers || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2.5 text-2xl font-extrabold text-white">
          <Users className="h-6 w-6 text-emerald-400" />
          <span>สถิตินักเตะ & ดาวซัลโว (Player Statistics)</span>
        </h1>
        <p className="text-sm text-slate-400">
          อันดับดาวซัลโว แอสซิสต์ จำนวนประตูจากจุดโทษ และสถิติรายบุคคล (คลิกชื่อนักเตะเพื่อดูโปรไฟล์เต็ม)
        </p>
      </div>

      <LeagueSelector
        competitions={competitions}
        selectedCode={selectedCode}
        onSelect={handleSelectLeague}
        includeAll
      />

      {playersRes && (
        <DataSourceBanner
          source={playersRes.source}
          isDemo={playersRes.isDemo}
          seasonMeta={playersRes.seasonMeta}
          updatedAt={playersRes.updatedAt}
        />
      )}

      <div className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-3.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {[
            { id: 'ALL', label: 'ทุกตำแหน่ง' },
            { id: 'FORWARD', label: 'กองหน้า / ปีก' },
            { id: 'MIDFIELD', label: 'กองกลาง' },
            { id: 'DEFENCE', label: 'กองหลัง' },
          ].map((pos) => (
            <button
              key={pos.id}
              type="button"
              onClick={() => setPositionFilter(pos.id)}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                positionFilter === pos.id
                  ? 'bg-emerald-500 text-slate-950'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {pos.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs">
          <Search className="h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ค้นหานักเตะ สัญชาติ หรือสโมสร..."
            className="w-52 bg-transparent text-white placeholder-slate-500 outline-none"
          />
        </div>
      </div>

      {loading ? (
        <div className="h-96 animate-pulse rounded-2xl border border-slate-800 bg-slate-900/60" />
      ) : scorers.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 text-center text-sm text-slate-400">
          ไม่พบข้อมูลนักเตะตามเงื่อนไขที่ค้นหา
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80 shadow-lg shadow-black/20">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm tabular-nums">
              <thead className="border-b border-slate-800 bg-slate-800/50 text-xs uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="w-12 px-4 py-3 text-center">#</th>
                  <th className="px-4 py-3">นักเตะ</th>
                  <th className="px-4 py-3">สโมสร</th>
                  <th className="hidden px-4 py-3 md:table-cell">ตำแหน่ง</th>
                  <th className="hidden px-3 py-3 text-right sm:table-cell">ลงเล่น</th>
                  <th className="px-3 py-3 text-right">ประตู</th>
                  <th className="px-3 py-3 text-right">แอสซิสต์</th>
                  <th className="hidden px-3 py-3 text-right sm:table-cell">จุดโทษ</th>
                  <th className="px-4 py-3 text-right">G+A</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {scorers.map((s, idx) => {
                  const ga = (s.goals || 0) + (s.assists || 0);
                  return (
                    <tr key={`${s.player?.id}-${idx}`} className="transition hover:bg-slate-800/40">
                      <td className="px-4 py-3 text-center">
                        {idx < 3 ? (
                          <span
                            className={`inline-flex h-6 w-6 items-center justify-center rounded-lg text-xs font-bold ${
                              idx === 0
                                ? 'bg-amber-400 text-slate-950'
                                : idx === 1
                                  ? 'bg-slate-300 text-slate-950'
                                  : 'bg-amber-700 text-white'
                            }`}
                          >
                            {idx + 1}
                          </span>
                        ) : (
                          <span className="text-slate-400">{idx + 1}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          to={`/players/${s.player?.id}`}
                          className="font-semibold text-white hover:text-emerald-300"
                        >
                          {s.player?.name}
                        </Link>
                        <span className="block text-[11px] text-slate-400">
                          {s.player?.nationality || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          to={`/teams/${s.team?.id}`}
                          className="inline-flex items-center gap-2 text-slate-200 hover:text-emerald-300"
                        >
                          <ClubBadge
                            crest={s.team?.crest}
                            name={s.team?.name}
                            tla={s.team?.tla}
                            size="sm"
                          />
                          <span className="truncate">{s.team?.shortName || s.team?.name}</span>
                        </Link>
                      </td>
                      <td className="hidden px-4 py-3 text-xs text-slate-300 md:table-cell">
                        {translatePosition(s.player?.position || s.player?.section)}
                      </td>
                      <td className="hidden px-3 py-3 text-right text-slate-300 sm:table-cell">
                        {s.playedMatches ?? '-'}
                      </td>
                      <td className="px-3 py-3 text-right font-extrabold text-emerald-400">
                        {s.goals ?? 0}
                      </td>
                      <td className="px-3 py-3 text-right font-semibold text-sky-400">
                        {s.assists ?? 0}
                      </td>
                      <td className="hidden px-3 py-3 text-right text-slate-400 sm:table-cell">
                        {s.penalties ?? 0}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-xs font-bold text-emerald-300">
                          <Award className="h-3 w-3" />
                          {ga}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
