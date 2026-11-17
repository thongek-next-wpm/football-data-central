import { Link } from 'react-router-dom';
import ClubBadge from './ClubBadge';
import { formatBangkokTime, formatThaiDateTime, getMatchStatusBadge } from '../utils/formatters';

export default function MatchCard({ match, onSelect, showCompetition = false, showDate = false }) {
  const badge = getMatchStatusBadge(match.status);
  const home = match.homeTeam || {};
  const away = match.awayTeam || {};
  const ft = match.score?.fullTime || {};
  const ht = match.score?.halfTime || {};
  const hasScore = ft.home !== null && ft.home !== undefined && ft.away !== null && ft.away !== undefined;
  const compName = match.competitionMeta?.name || match.competition?.name;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect && onSelect(match)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && onSelect) onSelect(match);
      }}
      className="group cursor-pointer rounded-2xl border border-slate-800/90 bg-slate-900/75 p-4 transition hover:border-emerald-500/40 hover:bg-slate-900"
    >
      <div className="mb-3 flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 text-slate-400">
          {showCompetition && compName && (
            <span className="rounded-md border border-slate-700/80 bg-slate-800/80 px-2 py-0.5 font-medium text-slate-200">
              {compName.replace('UEFA ', '')}
            </span>
          )}
          {match.matchday && <span>MD {match.matchday}</span>}
          <span>• {showDate ? formatThaiDateTime(match.utcDate) : `${formatBangkokTime(match.utcDate)} น.`}</span>
        </div>

        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${badge.className}`}>
          {badge.isLive && <span className="h-1.5 w-1.5 animate-ping rounded-full bg-rose-400" />}
          {badge.label}
        </span>
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <Link
          to={`/teams/${home.id}`}
          onClick={(e) => e.stopPropagation()}
          className="flex items-center justify-end gap-2.5 text-right font-semibold text-white transition hover:text-emerald-300"
        >
          <span className="truncate text-sm sm:text-base">{home.shortName || home.name}</span>
          <ClubBadge crest={home.crest} name={home.name} tla={home.tla} size="md" />
        </Link>

        <div className="flex flex-col items-center">
          <div
            className={`min-w-[68px] rounded-xl border px-3 py-1.5 text-center text-base font-extrabold tabular-nums ${
              badge.isLive
                ? 'border-rose-500/40 bg-rose-950/50 text-rose-200'
                : hasScore
                  ? 'border-emerald-500/30 bg-slate-950 text-emerald-300'
                  : 'border-slate-800 bg-slate-950 text-slate-400'
            }`}
          >
            {hasScore ? `${ft.home} - ${ft.away}` : 'vs'}
          </div>
          {ht.home !== null && ht.home !== undefined && (
            <span className="mt-1 text-[10px] text-slate-500 tabular-nums">
              HT {ht.home}-{ht.away}
            </span>
          )}
        </div>

        <Link
          to={`/teams/${away.id}`}
          onClick={(e) => e.stopPropagation()}
          className="flex items-center justify-start gap-2.5 text-left font-semibold text-white transition hover:text-emerald-300"
        >
          <ClubBadge crest={away.crest} name={away.name} tla={away.tla} size="md" />
          <span className="truncate text-sm sm:text-base">{away.shortName || away.name}</span>
        </Link>
      </div>
    </div>
  );
}
