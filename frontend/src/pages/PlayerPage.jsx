import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Award, Calendar, Clock, Flag, User } from 'lucide-react';
import { getPlayerProfile } from '../api/client';
import ClubBadge from '../components/ClubBadge';
import DataSourceBanner from '../components/DataSourceBanner';
import MatchCard from '../components/MatchCard';
import MatchDetailModal from '../components/MatchDetailModal';
import { calculateAge, translatePosition } from '../utils/formatters';

export default function PlayerPage() {
  const { id } = useParams();
  const [playerRes, setPlayerRes] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState(null);

  useEffect(() => {
    setLoading(true);
    getPlayerProfile(id)
      .then((res) => setPlayerRes(res))
      .catch(() => setPlayerRes(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-44 animate-pulse rounded-3xl border border-slate-800 bg-slate-900/60" />
        <div className="h-64 animate-pulse rounded-2xl border border-slate-800 bg-slate-900/60" />
      </div>
    );
  }

  const player = playerRes?.data;
  if (!player) {
    return (
      <div className="rounded-2xl border border-rose-500/30 bg-rose-950/40 p-8 text-center">
        <p className="mb-3 text-base font-semibold text-rose-300">ไม่พบข้อมูลนักเตะ</p>
        <Link to="/players" className="text-sm text-emerald-400 hover:underline">
          ← กลับไปหน้านักเตะ & ดาวซัลโว
        </Link>
      </div>
    );
  }

  const age = calculateAge(player.dateOfBirth);
  const team = player.currentTeam;
  const stats = player.seasonStats || {};
  const matches = player.matches || [];
  const goals = stats.goals ?? 0;
  const assists = stats.assists ?? 0;
  const played = stats.playedMatches ?? 0;
  const penalties = stats.penalties ?? 0;
  const contributions = goals + assists;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-400">
        <Link to="/players" className="inline-flex items-center gap-1.5 hover:text-emerald-300">
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>หน้านักเตะ & ดาวซัลโว</span>
        </Link>
        {team?.id && (
          <Link to={`/teams/${team.id}`} className="hover:text-emerald-300">
            • ดูโปรไฟล์สโมสร {team.shortName || team.name}
          </Link>
        )}
      </div>

      {/* Player Hero Card */}
      <section className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/30 p-6 sm:p-8">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div className="flex items-start gap-5">
            <div className="flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-2xl border border-emerald-500/40 bg-slate-950 shadow-lg shadow-emerald-500/10">
              {player.shirtNumber ? (
                <>
                  <span className="text-[10px] font-semibold uppercase text-slate-400">NO.</span>
                  <span className="text-3xl font-extrabold text-emerald-400 tabular-nums">
                    {player.shirtNumber}
                  </span>
                </>
              ) : (
                <User className="h-9 w-9 text-emerald-400" />
              )}
            </div>

            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-extrabold text-white sm:text-3xl">{player.name}</h1>
                <span className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-300">
                  {translatePosition(player.position || player.section)}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-300">
                <span className="inline-flex items-center gap-1.5">
                  <Flag className="h-3.5 w-3.5 text-sky-400" />
                  สัญชาติ: <strong className="text-white">{player.nationality || '-'}</strong>
                </span>
                {player.dateOfBirth && (
                  <span>
                    วันเกิด: {player.dateOfBirth} {age ? `(${age} ปี)` : ''}
                  </span>
                )}
                {team?.contract?.until && (
                  <span>สัญญาถึง: {team.contract.until}</span>
                )}
              </div>
            </div>
          </div>

          {team && (
            <Link
              to={`/teams/${team.id}`}
              className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-950/75 px-4 py-3 transition hover:border-emerald-500/40"
            >
              <ClubBadge crest={team.crest} name={team.name} tla={team.tla} size="lg" />
              <div>
                <p className="text-[11px] text-slate-400">สโมสรปัจจุบัน</p>
                <p className="text-sm font-bold text-white">{team.name}</p>
              </div>
            </Link>
          )}
        </div>
      </section>

      <DataSourceBanner
        source={playerRes.source}
        isDemo={playerRes.isDemo}
        stale={playerRes.stale}
        updatedAt={playerRes.updatedAt}
      />

      {/* Season Stats Cards */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 tabular-nums">
          <p className="text-xs text-slate-400">ลงสนาม (Matches)</p>
          <p className="mt-1 text-2xl font-extrabold text-white">{played}</p>
        </div>
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-4 tabular-nums">
          <p className="text-xs text-emerald-300">ทำประตู (Goals)</p>
          <p className="mt-1 text-2xl font-extrabold text-emerald-400">{goals}</p>
        </div>
        <div className="rounded-2xl border border-sky-500/30 bg-sky-950/20 p-4 tabular-nums">
          <p className="text-xs text-sky-300">แอสซิสต์ (Assists)</p>
          <p className="mt-1 text-2xl font-extrabold text-sky-400">{assists}</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 tabular-nums">
          <p className="text-xs text-slate-400">มีส่วนร่วมประตู (G+A)</p>
          <p className="mt-1 text-2xl font-extrabold text-amber-300">{contributions}</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 tabular-nums">
          <p className="text-xs text-slate-400">ประตูจากจุดโทษ</p>
          <p className="mt-1 text-2xl font-extrabold text-slate-200">{penalties}</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 tabular-nums">
          <p className="flex items-center gap-1 text-xs text-slate-400">
            <Clock className="h-3 w-3" />
            นาทีที่ลงเล่น
          </p>
          <p className="mt-1 text-2xl font-extrabold text-slate-200">
            {stats.minutesPlayed ?? (played ? played * 78 : 0)}
          </p>
        </div>
      </section>

      {/* Competition Breakdown (when available) */}
      {stats.competitions?.length > 0 && (
        <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
          <h2 className="mb-3 flex items-center gap-2 text-base font-bold text-white">
            <Award className="h-4 w-4 text-amber-400" />
            <span>สถิติแยกตามรายการแข่งขัน</span>
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {stats.competitions.map((c) => (
              <div
                key={c.code}
                className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 tabular-nums"
              >
                <div>
                  <p className="font-semibold text-white">{c.name}</p>
                  <p className="text-xs text-slate-400">{c.thaiName} • ลงเล่น {c.playedMatches} นัด</p>
                </div>
                <div className="text-right">
                  <span className="font-bold text-emerald-400">{c.goals}G</span>
                  <span className="mx-1.5 text-slate-600">/</span>
                  <span className="font-bold text-sky-400">{c.assists}A</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recent & Upcoming Matches for Player's Club */}
      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-base font-bold text-white">
          <Calendar className="h-4 w-4 text-emerald-400" />
          <span>โปรแกรมและผลการแข่งขันล่าสุดของสโมสร</span>
        </h2>

        {matches.length === 0 ? (
          <p className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-center text-sm text-slate-400">
            ยังไม่มีข้อมูลแมตช์ล่าสุดสำหรับนักเตะคนนี้
          </p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {matches.slice(0, 10).map((m) => (
              <MatchCard key={m.id} match={m} showCompetition showDate onSelect={setSelectedMatch} />
            ))}
          </div>
        )}
      </section>

      <MatchDetailModal match={selectedMatch} onClose={() => setSelectedMatch(null)} />
    </div>
  );
}
