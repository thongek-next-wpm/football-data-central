import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Cpu, Crown, RefreshCw, Sparkles, Swords, Zap } from 'lucide-react';
import {
  getCompetitions,
  getCompetitionSupercomputer,
  predictCustomMatchup,
} from '../api/client';
import ClubBadge from '../components/ClubBadge';
import DataSourceBanner from '../components/DataSourceBanner';
import LeagueSelector from '../components/LeagueSelector';
import WinProbabilityBar from '../components/WinProbabilityBar';
import { formatThaiDateTime } from '../utils/formatters';

function ProbPill({ value, tone = 'emerald' }) {
  const v = Number(value) || 0;
  let cls = 'bg-slate-900/60 text-slate-500 border-slate-800/60';
  if (tone === 'title') {
    if (v >= 35) cls = 'bg-amber-400/20 text-amber-300 border-amber-400/40 font-bold';
    else if (v >= 10) cls = 'bg-amber-500/10 text-amber-200 border-amber-500/25';
    else if (v > 0) cls = 'bg-slate-800/80 text-slate-300 border-slate-700/60';
  } else if (tone === 'ucl') {
    if (v >= 70) cls = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold';
    else if (v >= 25) cls = 'bg-emerald-500/10 text-emerald-200 border-emerald-500/25';
    else if (v > 0) cls = 'bg-slate-800/80 text-slate-300 border-slate-700/60';
  } else if (tone === 'secondary') {
    if (v >= 40) cls = 'bg-sky-500/20 text-sky-300 border-sky-500/40 font-semibold';
    else if (v > 0) cls = 'bg-slate-800/80 text-slate-300 border-slate-700/60';
  } else if (tone === 'relegation') {
    if (v >= 50) cls = 'bg-rose-500/25 text-rose-300 border-rose-500/40 font-bold';
    else if (v >= 15) cls = 'bg-rose-500/10 text-rose-200 border-rose-500/25';
    else if (v > 0) cls = 'bg-slate-800/80 text-slate-300 border-slate-700/60';
  }

  return (
    <span className={`inline-block min-w-[54px] rounded-lg border px-2 py-0.5 text-center text-xs tabular-nums ${cls}`}>
      {v.toFixed(1)}%
    </span>
  );
}

export default function SupercomputerPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCode = searchParams.get('league') || 'PL';

  const [competitions, setCompetitions] = useState([]);
  const [selectedCode, setSelectedCode] = useState(initialCode);
  const [seedOffset, setSeedOffset] = useState(0);
  const [simRes, setSimRes] = useState(null);
  const [loading, setLoading] = useState(true);

  // What-If custom matchup simulator
  const [homeId, setHomeId] = useState('');
  const [awayId, setAwayId] = useState('');
  const [customPred, setCustomPred] = useState(null);
  const [loadingMatchup, setLoadingMatchup] = useState(false);

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
    getCompetitionSupercomputer(selectedCode, { sims: 10000, seed: seedOffset })
      .then((res) => {
        setSimRes(res);
        const tbl = res.data?.table || [];
        if (tbl.length >= 2) {
          setHomeId(String(tbl[0].team.id));
          setAwayId(String(tbl[1].team.id));
        }
      })
      .catch(() => setSimRes(null))
      .finally(() => setLoading(false));
  }, [selectedCode, seedOffset]);

  useEffect(() => {
    if (!homeId || !awayId || homeId === awayId) {
      setCustomPred(null);
      return;
    }
    setLoadingMatchup(true);
    predictCustomMatchup(selectedCode, homeId, awayId)
      .then((res) => setCustomPred(res))
      .catch(() => setCustomPred(null))
      .finally(() => setLoadingMatchup(false));
  }, [selectedCode, homeId, awayId]);

  const handleSelectLeague = (code) => {
    setSelectedCode(code);
    setSeedOffset(0);
    setSearchParams({ league: code });
  };

  const sim = simRes?.data;
  const table = sim?.table || [];
  const isUefa = sim?.zoneMode === 'UEFA_LEAGUE_PHASE';
  const topContenders = table.slice(0, 3);
  const matchPredictions = sim?.matchPredictions || [];

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <section className="relative overflow-hidden rounded-3xl border border-violet-500/30 bg-gradient-to-br from-slate-900 via-slate-900 to-violet-950/50 p-6 sm:p-8">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div className="max-w-2xl space-y-2.5">
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-400/30 bg-violet-500/15 px-3 py-1 text-xs font-semibold text-violet-200">
              <Cpu className="h-3.5 w-3.5" />
              <span>Bivariate Poisson xG + 10,000 Monte Carlo Simulations</span>
            </div>
            <h1 className="flex items-center gap-2.5 text-2xl font-extrabold text-white sm:text-3xl">
              <Sparkles className="h-7 w-7 text-violet-400" />
              <span>FDC Supercomputer — คำนวณโอกาสแชมป์ & ผลแข่ง</span>
            </h1>
            <p className="text-sm text-slate-300">
              จำลองผลการแข่งขันที่เหลือของฤดูกาลจำนวน <strong>10,000 รอบ</strong> จากสถิติเกมรุก เกมรับ
              เหย้า-เยือน และฟอร์ม 5 นัดล่าสุด โดยประมวลผลจากข้อมูลแคชของ Backend ทันที (ไม่ใช้ API Quota เพิ่ม)
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {sim && (
              <div className="rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-xs tabular-nums">
                <p className="text-slate-400">การจำลองรอบล่าสุด</p>
                <p className="mt-0.5 text-lg font-extrabold text-violet-300">
                  {sim.simulations.toLocaleString()} ครั้ง ({sim.executionMs} ms)
                </p>
              </div>
            )}
            <button
              type="button"
              onClick={() => setSeedOffset((s) => s + 1)}
              className="inline-flex items-center gap-2 rounded-xl bg-violet-500 px-4 py-3 text-xs sm:text-sm font-bold text-white shadow-lg shadow-violet-500/20 transition hover:bg-violet-400"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span>จำลองใหม่ 10,000 รอบ</span>
            </button>
          </div>
        </div>
      </section>

      <LeagueSelector
        competitions={competitions}
        selectedCode={selectedCode}
        onSelect={handleSelectLeague}
      />

      {simRes && (
        <DataSourceBanner
          source={simRes.source}
          isDemo={simRes.isDemo}
          stale={simRes.stale}
          seasonMeta={simRes.seasonMeta}
          updatedAt={simRes.updatedAt}
        />
      )}

      {loading ? (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-36 animate-pulse rounded-2xl border border-slate-800 bg-slate-900/60" />
            ))}
          </div>
          <div className="h-96 animate-pulse rounded-2xl border border-slate-800 bg-slate-900/60" />
        </div>
      ) : (
        <>
          {/* Top 3 Title Favorites */}
          <section className="grid gap-4 md:grid-cols-3">
            {topContenders.map((row, idx) => (
              <div
                key={row.team.id}
                className={`rounded-2xl border p-5 ${
                  idx === 0
                    ? 'border-amber-400/40 bg-gradient-to-br from-amber-500/10 via-slate-900 to-slate-900'
                    : 'border-slate-800 bg-slate-900/80'
                }`}
              >
                <div className="mb-3 flex items-center justify-between">
                  <span
                    className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-0.5 text-xs font-bold ${
                      idx === 0
                        ? 'bg-amber-400 text-slate-950'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    <Crown className="h-3.5 w-3.5" />
                    เต็งแชมป์อันดับ {idx + 1}
                  </span>
                  <span className="rounded-lg border border-violet-500/30 bg-violet-500/10 px-2 py-0.5 text-xs font-bold text-violet-300 tabular-nums">
                    OVR {row.powerRating}
                  </span>
                </div>

                <Link
                  to={`/teams/${row.team.id}`}
                  className="mb-4 flex items-center gap-3 hover:text-emerald-300"
                >
                  <ClubBadge crest={row.team.crest} name={row.team.name} tla={row.team.tla} size="lg" />
                  <div className="min-w-0">
                    <p className="truncate text-base font-extrabold text-white">{row.team.name}</p>
                    <p className="text-xs text-slate-400 tabular-nums">
                      ปัจจุบัน #{row.currentPosition} ({row.currentPoints} pts)
                    </p>
                  </div>
                </Link>

                <div className="grid grid-cols-2 gap-2 border-t border-slate-800/80 pt-3 text-xs tabular-nums">
                  <div>
                    <span className="text-slate-400">โอกาสคว้าแชมป์</span>
                    <p className="text-xl font-extrabold text-amber-300">{row.titleProb}%</p>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400">คาดการณ์คะแนนจบฤดูกาล</span>
                    <p className="text-xl font-extrabold text-emerald-400">{row.projectedPoints} xPts</p>
                  </div>
                </div>
              </div>
            ))}
          </section>

          {/* Interactive What-If Matchup Simulator */}
          {table.length >= 2 && (
            <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="flex items-center gap-2 text-base font-bold text-white">
                    <Swords className="h-4 w-4 text-violet-400" />
                    <span>ทดลองจำลองคู่แข่งขัน (What-If Matchup Simulator)</span>
                  </h2>
                  <p className="text-xs text-slate-400">เลือกทีมเหย้าและทีมเยือนเพื่อดูเปอร์เซ็นต์ผลแพ้-ชนะและสกอร์คาดการณ์</p>
                </div>
              </div>

              <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
                <select
                  id="supercomputer-home-team"
                  name="homeTeam"
                  aria-label="เลือกทีมเหย้า"
                  value={homeId}
                  onChange={(e) => setHomeId(e.target.value)}
                  className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm font-medium text-white outline-none focus:border-emerald-500"
                >
                  {table.map((r) => (
                    <option key={r.team.id} value={r.team.id}>
                      เจ้าบ้าน: {r.team.name} (OVR {r.powerRating})
                    </option>
                  ))}
                </select>

                <span className="text-center text-xs font-extrabold text-slate-500">VS</span>

                <select
                  id="supercomputer-away-team"
                  name="awayTeam"
                  aria-label="เลือกทีมเยือน"
                  value={awayId}
                  onChange={(e) => setAwayId(e.target.value)}
                  className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm font-medium text-white outline-none focus:border-sky-500"
                >
                  {table.map((r) => (
                    <option key={r.team.id} value={r.team.id}>
                      ทีมเยือน: {r.team.name} (OVR {r.powerRating})
                    </option>
                  ))}
                </select>
              </div>

              {homeId === awayId ? (
                <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-center text-xs text-amber-200">
                  กรุณาเลือกทีมเหย้าและทีมเยือนคนละสโมสร
                </p>
              ) : loadingMatchup ? (
                <div className="h-28 animate-pulse rounded-2xl bg-slate-950/60" />
              ) : customPred?.prediction ? (
                <WinProbabilityBar
                  prediction={customPred.prediction}
                  homeName={customPred.homeTeam?.shortName || customPred.homeTeam?.name}
                  awayName={customPred.awayTeam?.shortName || customPred.awayTeam?.name}
                />
              ) : null}
            </section>
          )}

          {/* Full Simulated Season Table */}
          <section className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-bold text-white">
                ตารางคาดการณ์จบฤดูกาล ({sim?.competition?.name})
              </h2>
              <span className="text-xs text-slate-400">
                เฉลี่ยประตูต่อทีม/นัด: {sim?.modelInfo?.avgGoalsPerTeamGame} • จำลองเกมที่เหลือ {sim?.remainingFixturesSimulated} นัด
              </span>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80 shadow-lg">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm tabular-nums">
                  <thead className="border-b border-slate-800 bg-slate-800/60 text-xs uppercase tracking-wider text-slate-400">
                    <tr>
                      <th className="w-12 px-3 py-3 text-center">คาดการณ์</th>
                      <th className="px-3 py-3">สโมสร</th>
                      <th className="px-2.5 py-3 text-center">Power</th>
                      <th className="px-2.5 py-3 text-right">คะแนนจริง</th>
                      <th className="px-2.5 py-3 text-right text-emerald-300">คาดการณ์ (xPts)</th>
                      <th className="px-2.5 py-3 text-right">คาดการณ์ GD</th>
                      <th className="px-3 py-3 text-center">แชมป์ %</th>
                      <th className="px-3 py-3 text-center">{isUefa ? 'Top 8 (R16) %' : 'UCL %'}</th>
                      <th className="px-3 py-3 text-center">{isUefa ? 'เพลย์ออฟ %' : 'UEL/UECL %'}</th>
                      <th className="px-3 py-3 text-center">{isUefa ? 'ตกรอบ %' : 'ตกชั้น %'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/70">
                    {table.map((row) => (
                      <tr key={row.team.id} className="transition hover:bg-slate-800/40">
                        <td className="px-3 py-2.5 text-center font-bold text-slate-300">
                          {row.projectedRank}
                        </td>
                        <td className="px-3 py-2.5">
                          <Link
                            to={`/teams/${row.team.id}`}
                            className="flex items-center gap-2.5 font-medium text-white hover:text-emerald-300"
                          >
                            <ClubBadge crest={row.team.crest} name={row.team.name} tla={row.team.tla} size="sm" />
                            <span className="truncate">{row.team.shortName || row.team.name}</span>
                          </Link>
                        </td>
                        <td className="px-2.5 py-2.5 text-center">
                          <span className="rounded-md border border-violet-500/30 bg-violet-500/10 px-2 py-0.5 text-xs font-bold text-violet-300">
                            {row.powerRating}
                          </span>
                        </td>
                        <td className="px-2.5 py-2.5 text-right text-slate-300">{row.currentPoints}</td>
                        <td className="px-2.5 py-2.5 text-right font-extrabold text-emerald-400">
                          {row.projectedPoints.toFixed(1)}
                        </td>
                        <td className="px-2.5 py-2.5 text-right text-slate-300">
                          {row.projectedGD > 0 ? `+${row.projectedGD.toFixed(1)}` : row.projectedGD.toFixed(1)}
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <ProbPill value={row.titleProb} tone="title" />
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <ProbPill value={row.uclProb} tone="ucl" />
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <ProbPill value={row.secondaryProb} tone="secondary" />
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <ProbPill value={row.relegationProb} tone="relegation" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* Upcoming Matches Win Probabilities */}
          {matchPredictions.length > 0 && (
            <section className="space-y-4">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-bold text-white">
                  <Zap className="h-5 w-5 text-amber-400" />
                  <span>วิเคราะห์ความน่าจะเป็นโปรแกรมถัดไป ({sim?.competition?.name})</span>
                </h2>
                <p className="text-xs text-slate-400">โอกาสชนะ เสมอ แพ้ และคาดการณ์ประตู (xG) จากโมเดล Poisson</p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {matchPredictions.map((mp) => (
                  <div key={mp.matchId} className="space-y-2 rounded-2xl border border-slate-800 bg-slate-900/75 p-4">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Matchday {mp.matchday || '-'} • {formatThaiDateTime(mp.utcDate)}</span>
                      <span className="truncate text-slate-500">{mp.venue}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2 py-1 font-bold text-white">
                      <Link to={`/teams/${mp.homeTeam?.id}`} className="flex items-center gap-2 hover:text-emerald-300">
                        <ClubBadge crest={mp.homeTeam?.crest} name={mp.homeTeam?.name} tla={mp.homeTeam?.tla} size="sm" />
                        <span className="truncate">{mp.homeTeam?.shortName || mp.homeTeam?.name}</span>
                      </Link>
                      <span className="text-xs text-slate-500">VS</span>
                      <Link to={`/teams/${mp.awayTeam?.id}`} className="flex items-center gap-2 hover:text-sky-300">
                        <span className="truncate">{mp.awayTeam?.shortName || mp.awayTeam?.name}</span>
                        <ClubBadge crest={mp.awayTeam?.crest} name={mp.awayTeam?.name} tla={mp.awayTeam?.tla} size="sm" />
                      </Link>
                    </div>
                    <WinProbabilityBar
                      prediction={mp.prediction}
                      homeName={mp.homeTeam?.shortName || mp.homeTeam?.name}
                      awayName={mp.awayTeam?.shortName || mp.awayTeam?.name}
                    />
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
