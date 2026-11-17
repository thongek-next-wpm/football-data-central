import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Calendar, Cpu, Flame, ShieldCheck, Trophy, Users } from 'lucide-react';
import { getOverview, getScorers, getStandings, getSupercomputerOverview } from '../api/client';
import ClubBadge from '../components/ClubBadge';
import DataSourceBanner from '../components/DataSourceBanner';
import LeagueSelector from '../components/LeagueSelector';
import MatchCard from '../components/MatchCard';
import MatchDetailModal from '../components/MatchDetailModal';
import StandingsTable from '../components/StandingsTable';

export default function DashboardPage() {
  const [overview, setOverview] = useState(null);
  const [superOverview, setSuperOverview] = useState(null);
  const [selectedCode, setSelectedCode] = useState('PL');
  const [standingsRes, setStandingsRes] = useState(null);
  const [scorersRes, setScorersRes] = useState(null);
  const [matchTab, setMatchTab] = useState('live');
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [loadingOverview, setLoadingOverview] = useState(true);
  const [loadingLeague, setLoadingLeague] = useState(true);

  useEffect(() => {
    setLoadingOverview(true);
    Promise.all([getOverview(), getSupercomputerOverview().catch(() => null)])
      .then(([res, sc]) => {
        setOverview(res);
        setSuperOverview(sc);
        if (res.highlights?.liveMatches?.length > 0) {
          setMatchTab('live');
        } else {
          setMatchTab('upcoming');
        }
      })
      .catch(() => setOverview(null))
      .finally(() => setLoadingOverview(false));
  }, []);

  useEffect(() => {
    setLoadingLeague(true);
    Promise.all([getStandings(selectedCode), getScorers(selectedCode, 5)])
      .then(([st, sc]) => {
        setStandingsRes(st);
        setScorersRes(sc);
      })
      .catch(() => {})
      .finally(() => setLoadingLeague(false));
  }, [selectedCode]);

  const competitions = overview?.competitions || [];
  const highlights = overview?.highlights || {};
  const displayedMatches =
    matchTab === 'live'
      ? highlights.liveMatches || []
      : matchTab === 'results'
        ? highlights.recentResults || []
        : highlights.upcomingFixtures || [];

  return (
    <div className="space-y-8">
      {/* Hero Banner */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-800/90 bg-gradient-to-br from-slate-900 via-slate-900/95 to-emerald-950/50 p-6 sm:p-8">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>
                Public Read-Only • {overview?.meta?.seasonMeta?.label ? `ฤดูกาลล่าสุด ${overview.meta.seasonMeta.label}` : 'ฤดูกาลล่าสุด'} • 8 Competitions
              </span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-4xl">
              ฐานข้อมูลฟุตบอลยุโรปครบวงจร
            </h1>
            <p className="text-sm leading-relaxed text-slate-300 sm:text-base">
              ติดตามตารางคะแนน ผลการแข่งขัน โปรแกรมล่วงหน้า และสถิตินักเตะจาก 5 ลีกใหญ่ยุโรปและ 3 ถ้วยสโมสรยุโรป
              เข้าดูได้ทันทีโดยไม่ต้องสมัครสมาชิก พร้อมระบบ Backend Caching ป้องกัน API Rate Limit
            </p>
            <div className="flex flex-wrap gap-2.5 pt-1">
              <Link
                to="/standings"
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-bold text-slate-950 transition hover:bg-emerald-400"
              >
                <Trophy className="h-4 w-4" />
                ดูตารางคะแนนทั้งหมด
              </Link>
              <Link
                to="/matches"
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2 text-sm font-semibold text-white transition hover:border-slate-600 hover:bg-slate-800"
              >
                <Calendar className="h-4 w-4 text-emerald-400" />
                ผลบอล & โปรแกรมแข่ง
              </Link>
              <Link
                to="/players"
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2 text-sm font-semibold text-white transition hover:border-slate-600 hover:bg-slate-800"
              >
                <Users className="h-4 w-4 text-sky-400" />
                สถิตินักเตะ & ดาวซัลโว
              </Link>
              <Link
                to="/supercomputer"
                className="inline-flex items-center gap-1.5 rounded-xl border border-violet-500/40 bg-violet-500/15 px-4 py-2 text-sm font-semibold text-violet-200 transition hover:bg-violet-500/25"
              >
                <Cpu className="h-4 w-4 text-violet-300" />
                Supercomputer
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3.5">
              <p className="text-2xl font-extrabold text-emerald-400 tabular-nums">5</p>
              <p className="text-xs text-slate-400">ลีกใหญ่ยุโรป</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3.5">
              <p className="text-2xl font-extrabold text-sky-400 tabular-nums">3</p>
              <p className="text-xs text-slate-400">ถ้วยสโมสรยุโรป</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3.5">
              <p className="text-2xl font-extrabold text-amber-400 tabular-nums">10/m</p>
              <p className="text-xs text-slate-400">Rate-Limit Safe</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3.5">
              <p className="text-2xl font-extrabold text-white tabular-nums">0</p>
              <p className="text-xs text-slate-400">ไม่ต้องล็อกอิน</p>
            </div>
          </div>
        </div>
      </section>

      {overview?.meta && (
        <DataSourceBanner
          source={overview.meta.sources?.[0] || 'demo-seed'}
          isDemo={overview.meta.isDemo}
          seasonMeta={overview.meta.seasonMeta}
          updatedAt={competitions[0]?.updatedAt}
        />
      )}

      {/* Highlights: Live / Upcoming / Results */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-white">แมตช์เด่น & โปรแกรมการแข่งขัน</h2>
          </div>

          <div className="inline-flex rounded-xl border border-slate-800 bg-slate-900 p-1 text-xs">
            <button
              type="button"
              onClick={() => setMatchTab('live')}
              className={`rounded-lg px-3 py-1.5 font-medium transition ${
                matchTab === 'live' ? 'bg-rose-500 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              กำลังแข่ง ({highlights.liveMatches?.length || 0})
            </button>
            <button
              type="button"
              onClick={() => setMatchTab('upcoming')}
              className={`rounded-lg px-3 py-1.5 font-medium transition ${
                matchTab === 'upcoming' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              โปรแกรมถัดไป
            </button>
            <button
              type="button"
              onClick={() => setMatchTab('results')}
              className={`rounded-lg px-3 py-1.5 font-medium transition ${
                matchTab === 'results' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              ผลบอลล่าสุด
            </button>
          </div>
        </div>

        {loadingOverview ? (
          <div className="grid gap-3 md:grid-cols-2">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-28 animate-pulse rounded-2xl border border-slate-800 bg-slate-900/50" />
            ))}
          </div>
        ) : displayedMatches.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 text-center text-sm text-slate-400">
            ขณะนี้ยังไม่มีแมตช์ที่กำลังแข่งขัน สามารถสลับดูโปรแกรมถัดไปหรือผลบอลล่าสุดได้
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {displayedMatches.slice(0, 6).map((m) => (
              <MatchCard
                key={m.id}
                match={m}
                showCompetition
                showDate
                onSelect={setSelectedMatch}
              />
            ))}
          </div>
        )}
      </section>

      {/* Interactive League Standings + Top Scorers */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-white">เจาะลึกตารางคะแนน & ดาวซัลโว</h2>
            <p className="text-xs text-slate-400">เลือกดูทั้ง 5 ลีกใหญ่ยุโรปและ 3 ถ้วยสโมสรยุโรปได้ทันที</p>
          </div>
          <Link
            to={`/standings?league=${selectedCode}`}
            className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 hover:text-emerald-300"
          >
            <span>ดูตารางคะแนนเต็ม</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {competitions.length > 0 && (
          <LeagueSelector
            competitions={competitions}
            selectedCode={selectedCode}
            onSelect={setSelectedCode}
          />
        )}

        <div className="grid gap-6 lg:grid-cols-[1.65fr_1fr]">
          <div>
            {loadingLeague ? (
              <div className="h-80 animate-pulse rounded-2xl border border-slate-800 bg-slate-900/60" />
            ) : (
              <StandingsTable
                standingsPayload={standingsRes?.data}
                competitionMeta={standingsRes?.competitionMeta}
                compact
                maxRows={8}
              />
            )}
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">
                ดาวซัลโว ({standingsRes?.competitionMeta?.name || selectedCode})
              </h3>
              <Link
                to={`/players?league=${selectedCode}`}
                className="text-xs font-medium text-emerald-400 hover:text-emerald-300"
              >
                ดูทั้งหมด →
              </Link>
            </div>
            <div className="space-y-2.5">
              {(scorersRes?.data?.scorers || []).map((item, idx) => (
                <div
                  key={item.player?.id || idx}
                  className="flex items-center justify-between rounded-xl border border-slate-800/80 bg-slate-950/60 px-3 py-2.5"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <span className="w-4 text-center text-xs font-bold text-slate-500">{idx + 1}</span>
                    <ClubBadge
                      crest={item.team?.crest}
                      name={item.team?.name}
                      tla={item.team?.tla}
                      size="sm"
                    />
                    <div className="min-w-0">
                      <Link
                        to={`/players/${item.player?.id}`}
                        className="block truncate text-sm font-semibold text-white hover:text-emerald-300"
                      >
                        {item.player?.name}
                      </Link>
                      <Link
                        to={`/teams/${item.team?.id}`}
                        className="block truncate text-[11px] text-slate-400 hover:text-slate-200"
                      >
                        {item.team?.shortName || item.team?.name}
                      </Link>
                    </div>
                  </div>
                  <div className="text-right tabular-nums">
                    <span className="block text-sm font-extrabold text-emerald-400">{item.goals} ประตู</span>
                    <span className="block text-[10px] text-slate-400">{item.assists ?? 0} แอสซิสต์</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FDC Supercomputer Favorites Strip */}
      {superOverview?.favorites?.length > 0 && (
        <section className="space-y-4 rounded-3xl border border-violet-500/30 bg-gradient-to-br from-slate-900 via-slate-900 to-violet-950/35 p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-bold text-white">
                <Cpu className="h-5 w-5 text-violet-400" />
                <span>FDC Supercomputer — เต็งแชมป์ทั้ง 8 รายการ (10,000 Simulations)</span>
              </h2>
              <p className="text-xs text-slate-400">
                คำนวณความน่าจะเป็นแชมป์ คะแนนคาดการณ์ (xPts) และโอกาสผลบอลจากโมเดล Poisson + Monte Carlo
              </p>
            </div>
            <Link
              to="/supercomputer"
              className="inline-flex items-center gap-1 text-xs font-semibold text-violet-300 hover:text-violet-200"
            >
              <span>เปิด Supercomputer เต็มรูปแบบ</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {superOverview.favorites.map((fav) => {
              const top = fav.topContenders?.[0];
              if (!top) return null;
              return (
                <Link
                  key={fav.competition.code}
                  to={`/supercomputer?league=${fav.competition.code}`}
                  className="flex items-center justify-between rounded-2xl border border-slate-800/90 bg-slate-950/65 p-3.5 transition hover:border-violet-500/40"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <ClubBadge crest={top.team?.crest} name={top.team?.name} tla={top.team?.tla} size="md" />
                    <div className="min-w-0">
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-violet-300">
                        {fav.competition.name.replace('UEFA ', '')}
                      </span>
                      <span className="block truncate text-sm font-bold text-white">
                        {top.team?.shortName || top.team?.name}
                      </span>
                      <span className="block text-[11px] text-slate-400 tabular-nums">
                        คาดการณ์ {top.projectedPoints} xPts
                      </span>
                    </div>
                  </div>
                  <div className="text-right tabular-nums">
                    <span className="block text-base font-extrabold text-amber-300">{top.titleProb}%</span>
                    <span className="block text-[10px] text-slate-500">โอกาสแชมป์</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* 8 Competitions Directory Cards */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-white">ครอบคลุม 8 รายการฟุตบอลอาชีพยุโรป</h2>
          <p className="text-xs text-slate-400">คลิกที่รายการเพื่อดูตารางคะแนน ผลบอล และสถิติผู้เล่น</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {competitions.map((comp) => (
            <div
              key={comp.code}
              className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/75 p-4 transition hover:border-slate-700"
            >
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <span
                    className="rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-950"
                    style={{ backgroundColor: comp.accent || '#10b981' }}
                  >
                    {comp.category === 'TOP_5_LEAGUE' ? comp.thaiArea : 'UEFA'}
                  </span>
                  <span className="font-mono text-xs text-slate-500">{comp.code}</span>
                </div>

                <h3 className="text-base font-bold text-white">{comp.name}</h3>
                <p className="mb-3 text-xs text-slate-400">{comp.thaiName}</p>

                {comp.leader && (
                  <Link
                    to={`/teams/${comp.leader.team?.id}`}
                    className="mb-2 flex items-center justify-between rounded-xl border border-slate-800/80 bg-slate-950/60 px-3 py-2 text-xs hover:border-emerald-500/40"
                  >
                    <span className="flex items-center gap-2 truncate font-medium text-slate-200">
                      <ClubBadge
                        crest={comp.leader.team?.crest}
                        name={comp.leader.team?.name}
                        tla={comp.leader.team?.tla}
                        size="sm"
                      />
                      <span className="truncate">{comp.leader.team?.shortName || comp.leader.team?.name}</span>
                    </span>
                    <span className="font-bold text-emerald-400 tabular-nums">{comp.leader.points} pts</span>
                  </Link>
                )}

                {comp.topScorer && (
                  <Link
                    to={`/players/${comp.topScorer.player?.id}`}
                    className="flex items-center justify-between rounded-xl bg-slate-950/40 px-3 py-1.5 text-[11px] text-slate-400 hover:text-white"
                  >
                    <span className="truncate">ดาวซัลโว: {comp.topScorer.player?.name}</span>
                    <span className="font-semibold text-amber-300 tabular-nums">{comp.topScorer.goals}G</span>
                  </Link>
                )}
              </div>

              <div className="mt-4 flex gap-2 border-t border-slate-800/80 pt-3 text-xs font-medium">
                <Link
                  to={`/standings?league=${comp.code}`}
                  className="flex-1 rounded-lg bg-slate-800 py-1.5 text-center text-slate-200 hover:bg-emerald-500 hover:text-slate-950"
                >
                  ตาราง
                </Link>
                <Link
                  to={`/matches?league=${comp.code}`}
                  className="flex-1 rounded-lg bg-slate-800 py-1.5 text-center text-slate-200 hover:bg-slate-700"
                >
                  ผลบอล
                </Link>
                <Link
                  to={`/players?league=${comp.code}`}
                  className="flex-1 rounded-lg bg-slate-800 py-1.5 text-center text-slate-200 hover:bg-slate-700"
                >
                  นักเตะ
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      <MatchDetailModal match={selectedMatch} onClose={() => setSelectedMatch(null)} />
    </div>
  );
}
