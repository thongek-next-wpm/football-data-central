import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Calendar, ExternalLink, MapPin, Shield, Trophy, UserCheck, Users } from 'lucide-react';
import { getTeamProfile } from '../api/client';
import ClubBadge from '../components/ClubBadge';
import DataSourceBanner from '../components/DataSourceBanner';
import MatchCard from '../components/MatchCard';
import MatchDetailModal from '../components/MatchDetailModal';
import { calculateAge, getPositionGroup, translatePosition } from '../utils/formatters';

const POSITION_GROUPS = [
  { id: 'GK', title: 'ผู้รักษาประตู (Goalkeepers)' },
  { id: 'DEF', title: 'กองหลัง (Defenders)' },
  { id: 'MID', title: 'กองกลาง (Midfielders)' },
  { id: 'FWD', title: 'กองหน้า (Forwards)' },
];

export default function TeamPage() {
  const { id } = useParams();
  const [teamRes, setTeamRes] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('squad');
  const [selectedMatch, setSelectedMatch] = useState(null);

  useEffect(() => {
    setLoading(true);
    getTeamProfile(id)
      .then((res) => setTeamRes(res))
      .catch(() => setTeamRes(null))
      .finally(() => setLoading(false));
  }, [id]);

  const team = teamRes?.data;

  const groupedSquad = useMemo(() => {
    const groups = { GK: [], DEF: [], MID: [], FWD: [] };
    for (const p of team?.squad || []) {
      const grp = getPositionGroup(p.position);
      groups[grp].push(p);
    }
    return groups;
  }, [team]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-40 animate-pulse rounded-3xl border border-slate-800 bg-slate-900/60" />
        <div className="h-72 animate-pulse rounded-2xl border border-slate-800 bg-slate-900/60" />
      </div>
    );
  }

  if (!team) {
    return (
      <div className="rounded-2xl border border-rose-500/30 bg-rose-950/40 p-8 text-center">
        <p className="mb-3 text-base font-semibold text-rose-300">ไม่พบข้อมูลสโมสร</p>
        <Link to="/standings" className="text-sm text-emerald-400 hover:underline">
          ← กลับไปหน้าตารางคะแนน
        </Link>
      </div>
    );
  }

  const upcoming = (team.matches || [])
    .filter((m) => ['SCHEDULED', 'TIMED', 'IN_PLAY', 'LIVE', 'PAUSED'].includes(m.status))
    .sort((a, b) => new Date(a.utcDate) - new Date(b.utcDate));
  const finished = (team.matches || [])
    .filter((m) => m.status === 'FINISHED')
    .sort((a, b) => new Date(b.utcDate) - new Date(a.utcDate));

  return (
    <div className="space-y-6">
      <Link
        to="/standings"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-emerald-300"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        <span>กลับสู่ตารางคะแนน</span>
      </Link>

      {/* Club Hero Banner */}
      <section className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 p-6 sm:p-8">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div className="flex items-start gap-5">
            <ClubBadge crest={team.crest} name={team.name} tla={team.tla} size="xl" />
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-extrabold text-white sm:text-3xl">{team.name}</h1>
                {team.tla && (
                  <span className="rounded-lg border border-slate-700 bg-slate-800 px-2 py-0.5 font-mono text-xs font-bold text-emerald-300">
                    {team.tla}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-300">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-emerald-400" />
                  สนาม: {team.venue || '-'}
                </span>
                <span>ก่อตั้ง: {team.founded || '-'}</span>
                {team.clubColors && <span>สีสโมสร: {team.clubColors}</span>}
                {team.coach?.name && (
                  <span className="inline-flex items-center gap-1.5">
                    <UserCheck className="h-3.5 w-3.5 text-sky-400" />
                    ผู้จัดการทีม: <strong className="text-white">{team.coach.name}</strong>
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                {(team.runningCompetitions || []).map((rc) => (
                  <Link
                    key={rc.code || rc.id}
                    to={`/standings?league=${rc.code}`}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700/80 bg-slate-800/80 px-2.5 py-1 text-xs font-medium text-slate-200 hover:border-emerald-500/40"
                  >
                    <Trophy className="h-3 w-3 text-emerald-400" />
                    {rc.name}
                  </Link>
                ))}
                {team.website && (
                  <a
                    href={team.website}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-emerald-300"
                  >
                    <ExternalLink className="h-3 w-3" />
                    เว็บไซต์สโมสร
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* League Standing Snapshot */}
          {team.standingsPositions?.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[300px]">
              {team.standingsPositions.slice(0, 2).map((st) => (
                <div
                  key={st.competition?.code}
                  className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3.5 tabular-nums"
                >
                  <p className="mb-1 text-[11px] font-semibold text-emerald-400">
                    {st.competition?.name}
                  </p>
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-extrabold text-white">อันดับ #{st.position}</span>
                    <span className="text-sm font-bold text-emerald-300">{st.points} pts</span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-400">
                    แข่ง {st.playedGames} • ชนะ {st.won} เสมอ {st.draw} แพ้ {st.lost} • GD{' '}
                    {st.goalDifference > 0 ? `+${st.goalDifference}` : st.goalDifference}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <DataSourceBanner
        source={teamRes.source}
        isDemo={teamRes.isDemo}
        stale={teamRes.stale}
        updatedAt={teamRes.updatedAt}
      />

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3">
        {[
          { id: 'squad', label: `รายชื่อนักเตะประจำฤดูกาล (${team.squad?.length || 0})`, icon: Users },
          { id: 'matches', label: `ผลบอล & โปรแกรมแข่ง (${team.matches?.length || 0})`, icon: Calendar },
          { id: 'scorers', label: `ดาวซัลโวสโมสร (${team.teamScorers?.length || 0})`, icon: Shield },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold transition ${
                activeTab === tab.id
                  ? 'bg-emerald-500 text-slate-950'
                  : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Squad Tab */}
      {activeTab === 'squad' && (
        <div className="space-y-6">
          {POSITION_GROUPS.map((grp) => {
            const players = groupedSquad[grp.id] || [];
            if (players.length === 0) return null;
            return (
              <div key={grp.id} className="rounded-2xl border border-slate-800 bg-slate-900/75 p-5">
                <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-emerald-400">
                  {grp.title} ({players.length})
                </h2>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {players.map((player) => {
                    const age = calculateAge(player.dateOfBirth);
                    return (
                      <Link
                        key={player.id}
                        to={`/players/${player.id}`}
                        className="group flex items-center justify-between rounded-xl border border-slate-800/90 bg-slate-950/60 p-3.5 transition hover:border-emerald-500/40 hover:bg-slate-950"
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-xs font-extrabold text-emerald-400 tabular-nums">
                            {player.shirtNumber || '-'}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-white group-hover:text-emerald-300">
                              {player.name}
                            </p>
                            <p className="truncate text-[11px] text-slate-400">
                              {translatePosition(player.position)} • {player.nationality || '-'}
                              {age ? ` • ${age} ปี` : ''}
                            </p>
                          </div>
                        </div>

                        {player.stats && (player.stats.goals > 0 || player.stats.assists > 0) && (
                          <div className="shrink-0 text-right text-[11px] tabular-nums">
                            <span className="block font-bold text-emerald-400">{player.stats.goals}G</span>
                            <span className="block text-slate-400">{player.stats.assists}A</span>
                          </div>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Matches Tab */}
      {activeTab === 'matches' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-3">
            <h2 className="text-base font-bold text-white">โปรแกรมที่กำลังจะมาถึง</h2>
            {upcoming.length === 0 ? (
              <p className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 text-xs text-slate-400">
                ไม่มีโปรแกรมแข่งขันถัดไป
              </p>
            ) : (
              upcoming.map((m) => (
                <MatchCard key={m.id} match={m} showCompetition showDate onSelect={setSelectedMatch} />
              ))
            )}
          </div>

          <div className="space-y-3">
            <h2 className="text-base font-bold text-white">ผลการแข่งขันล่าสุด</h2>
            {finished.length === 0 ? (
              <p className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 text-xs text-slate-400">
                ไม่มีข้อมูลผลบอลย้อนหลัง
              </p>
            ) : (
              finished.map((m) => (
                <MatchCard key={m.id} match={m} showCompetition showDate onSelect={setSelectedMatch} />
              ))
            )}
          </div>
        </div>
      )}

      {/* Scorers Tab */}
      {activeTab === 'scorers' && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
          {team.teamScorers?.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {team.teamScorers.map((s, idx) => (
                <Link
                  key={`${s.player?.id}-${idx}`}
                  to={`/players/${s.player?.id}`}
                  className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 p-4 hover:border-emerald-500/40"
                >
                  <div>
                    <p className="font-bold text-white">{s.player?.name}</p>
                    <p className="text-xs text-slate-400">
                      {s.competition?.name} • ลงเล่น {s.playedMatches} นัด
                    </p>
                  </div>
                  <div className="text-right tabular-nums">
                    <p className="text-lg font-extrabold text-emerald-400">{s.goals} ประตู</p>
                    <p className="text-xs text-sky-400">{s.assists ?? 0} แอสซิสต์</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400">ยังไม่มีสถิติผู้ทำประตูในรายการหลักของฤดูกาลนี้</p>
          )}
        </div>
      )}

      <MatchDetailModal match={selectedMatch} onClose={() => setSelectedMatch(null)} />
    </div>
  );
}
