import { Globe, Trophy } from 'lucide-react';

export default function LeagueSelector({
  competitions = [],
  selectedCode,
  onSelect,
  includeAll = false,
  allLabel = 'ทุกรายการ (8 ลีก/ถ้วย)',
}) {
  const top5 = competitions.filter((c) => c.category === 'TOP_5_LEAGUE' || c.type === 'LEAGUE');
  const uefa = competitions.filter((c) => c.category === 'UEFA_COMPETITION' || c.type === 'CUP');

  const btnClass = (active) =>
    `inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs sm:text-sm font-medium transition ${
      active
        ? 'border-emerald-400/60 bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-500/20'
        : 'border-slate-800 bg-slate-900/90 text-slate-300 hover:border-slate-700 hover:bg-slate-800 hover:text-white'
    }`;

  return (
    <div className="space-y-3 rounded-2xl border border-slate-800/90 bg-slate-900/60 p-3.5">
      {includeAll && (
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-800/80 pb-2.5">
          <button
            type="button"
            onClick={() => onSelect('ALL')}
            className={btnClass(selectedCode === 'ALL')}
          >
            <Globe className="h-3.5 w-3.5" />
            <span>{allLabel}</span>
          </button>
        </div>
      )}

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            <Trophy className="h-3.5 w-3.5 text-emerald-400" />
            5 ลีกใหญ่ยุโรป
          </span>
          {top5.map((comp) => (
            <button
              key={comp.code}
              type="button"
              onClick={() => onSelect(comp.code)}
              className={btnClass(selectedCode === comp.code)}
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: selectedCode === comp.code ? '#020617' : comp.accent || '#10b981' }}
              />
              <span>{comp.name}</span>
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            3 ถ้วยยุโรป
          </span>
          {uefa.map((comp) => (
            <button
              key={comp.code}
              type="button"
              onClick={() => onSelect(comp.code)}
              className={btnClass(selectedCode === comp.code)}
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: selectedCode === comp.code ? '#020617' : comp.accent || '#6366f1' }}
              />
              <span>{comp.name.replace('UEFA ', '')}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
