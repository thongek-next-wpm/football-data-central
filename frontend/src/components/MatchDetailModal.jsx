import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Shield, X } from 'lucide-react';
import { getMatchDetail } from '../api/client';
import ClubBadge from './ClubBadge';
import { formatThaiDateTime, getMatchStatusBadge } from '../utils/formatters';

export default function MatchDetailModal({ match, onClose }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!match?.id) return;
    setLoading(true);
    getMatchDetail(match.id)
      .then((res) => setDetail(res.data))
      .catch(() => setDetail({ match, head2head: null }))
      .finally(() => setLoading(false));
  }, [match]);

  if (!match) return null;

  const activeMatch = detail?.match || match;
  const h2h = detail?.head2head;
  const badge = getMatchStatusBadge(activeMatch.status);
  const ft = activeMatch.score?.fullTime || {};
  const ht = activeMatch.score?.halfTime || {};
  const hasScore = ft.home !== null && ft.home !== undefined;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
              {activeMatch.competition?.name || 'รายละเอียดการแข่งขัน'}
            </p>
            <p className="text-xs text-slate-400">
              {activeMatch.matchday ? `Matchday ${activeMatch.matchday}` : activeMatch.stage}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-800 bg-slate-800/70 p-1.5 text-slate-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
          <div className="mb-4 flex items-center justify-between text-xs text-slate-400">
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              {formatThaiDateTime(activeMatch.utcDate)}
            </span>
            <span className={`rounded-full border px-2.5 py-0.5 font-semibold ${badge.className}`}>
              {badge.label}
            </span>
          </div>

          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
            <Link
              to={`/teams/${activeMatch.homeTeam?.id}`}
              onClick={onClose}
              className="flex flex-col items-center gap-2 text-center hover:text-emerald-300"
            >
              <ClubBadge
                crest={activeMatch.homeTeam?.crest}
                name={activeMatch.homeTeam?.name}
                tla={activeMatch.homeTeam?.tla}
                size="lg"
              />
              <span className="text-sm font-bold text-white sm:text-base">
                {activeMatch.homeTeam?.name}
              </span>
            </Link>

            <div className="text-center">
              <div className="rounded-2xl border border-slate-800 bg-slate-900 px-5 py-2.5 text-2xl font-extrabold text-emerald-400 tabular-nums">
                {hasScore ? `${ft.home} - ${ft.away}` : 'VS'}
              </div>
              {ht.home !== null && ht.home !== undefined && (
                <p className="mt-1.5 text-xs text-slate-400 tabular-nums">
                  ครึ่งแรก: {ht.home} - {ht.away}
                </p>
              )}
            </div>

            <Link
              to={`/teams/${activeMatch.awayTeam?.id}`}
              onClick={onClose}
              className="flex flex-col items-center gap-2 text-center hover:text-emerald-300"
            >
              <ClubBadge
                crest={activeMatch.awayTeam?.crest}
                name={activeMatch.awayTeam?.name}
                tla={activeMatch.awayTeam?.tla}
                size="lg"
              />
              <span className="text-sm font-bold text-white sm:text-base">
                {activeMatch.awayTeam?.name}
              </span>
            </Link>
          </div>

          <div className="mt-4 flex flex-wrap justify-center gap-4 border-t border-slate-800/80 pt-3 text-xs text-slate-400">
            {activeMatch.venue && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-emerald-400" />
                {activeMatch.venue}
              </span>
            )}
            {activeMatch.referees?.[0]?.name && (
              <span className="inline-flex items-center gap-1">
                <Shield className="h-3.5 w-3.5 text-sky-400" />
                ผู้ตัดสิน: {activeMatch.referees[0].name}
              </span>
            )}
          </div>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-bold text-white">สถิติการพบกัน (Head-to-Head)</h3>
          {loading ? (
            <p className="text-xs text-slate-400">กำลังโหลดสถิติ H2H...</p>
          ) : h2h?.aggregations ? (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2 rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-center text-xs">
                <div>
                  <p className="text-lg font-bold text-emerald-400 tabular-nums">
                    {h2h.aggregations.homeTeam?.wins ?? 0}
                  </p>
                  <p className="truncate text-slate-400">{activeMatch.homeTeam?.shortName} ชนะ</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-slate-200 tabular-nums">
                    {h2h.aggregations.homeTeam?.draws ?? 0}
                  </p>
                  <p className="text-slate-400">เสมอ</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-sky-400 tabular-nums">
                    {h2h.aggregations.awayTeam?.wins ?? 0}
                  </p>
                  <p className="truncate text-slate-400">{activeMatch.awayTeam?.shortName} ชนะ</p>
                </div>
              </div>

              <div className="space-y-2">
                {(h2h.matches || []).slice(0, 5).map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between rounded-xl border border-slate-800/80 bg-slate-950/40 px-3 py-2 text-xs"
                  >
                    <span className="text-slate-500">
                      {new Date(m.utcDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })}
                    </span>
                    <span className="font-medium text-slate-200">
                      {m.homeTeam?.shortName} {m.score?.fullTime?.home ?? '-'} : {m.score?.fullTime?.away ?? '-'}{' '}
                      {m.awayTeam?.shortName}
                    </span>
                    <span className="text-slate-500">{m.competition?.code}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500">ไม่มีข้อมูลสถิติการพบกันย้อนหลัง</p>
          )}
        </div>
      </div>
    </div>
  );
}
