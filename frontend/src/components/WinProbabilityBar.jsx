import { Cpu } from 'lucide-react';

export default function WinProbabilityBar({
  prediction,
  homeName = 'เจ้าบ้าน',
  awayName = 'ทีมเยือน',
  compact = false,
}) {
  if (!prediction) return null;

  const h = prediction.homeWinProb ?? 0;
  const d = prediction.drawProb ?? 0;
  const a = prediction.awayWinProb ?? 0;

  return (
    <div className="space-y-3 rounded-2xl border border-violet-500/25 bg-slate-950/70 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="inline-flex items-center gap-1.5 font-bold text-violet-300">
          <Cpu className="h-3.5 w-3.5" />
          FDC Supercomputer Forecast
        </span>
        {prediction.verdict && (
          <span className="rounded-full border border-violet-500/30 bg-violet-500/10 px-2.5 py-0.5 text-[11px] font-medium text-violet-200">
            {prediction.verdict}
          </span>
        )}
      </div>

      {/* Labels */}
      <div className="grid grid-cols-3 text-xs tabular-nums">
        <div className="text-left">
          <span className="block truncate font-semibold text-emerald-300">{homeName}</span>
          <span className="text-base font-extrabold text-white">{h}%</span>
        </div>
        <div className="text-center">
          <span className="block font-medium text-slate-400">เสมอ</span>
          <span className="text-base font-extrabold text-slate-200">{d}%</span>
        </div>
        <div className="text-right">
          <span className="block truncate font-semibold text-sky-300">{awayName}</span>
          <span className="text-base font-extrabold text-white">{a}%</span>
        </div>
      </div>

      {/* Tri-color bar */}
      <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-slate-800">
        <div style={{ width: `${h}%` }} className="bg-emerald-500 transition-all" />
        <div style={{ width: `${d}%` }} className="bg-slate-500 transition-all" />
        <div style={{ width: `${a}%` }} className="bg-sky-500 transition-all" />
      </div>

      {!compact && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800/80 pt-2.5 text-[11px] text-slate-400 tabular-nums">
          <div className="flex flex-wrap items-center gap-3">
            <span>
              Expected Goals (xG):{' '}
              <strong className="text-emerald-300">{prediction.homeXg}</strong> -{' '}
              <strong className="text-sky-300">{prediction.awayXg}</strong>
            </span>
            <span>
              Over 2.5: <strong className="text-slate-200">{prediction.over25Prob}%</strong>
            </span>
            <span>
              BTTS: <strong className="text-slate-200">{prediction.bttsProb}%</strong>
            </span>
          </div>

          {prediction.mostLikelyScores?.length > 0 && (
            <div className="flex items-center gap-1.5">
              <span>สกอร์ที่มีโอกาสสูงสุด:</span>
              {prediction.mostLikelyScores.map((s) => (
                <span
                  key={s.score}
                  className="rounded-md border border-slate-700 bg-slate-900 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-slate-200"
                >
                  {s.score} ({s.probability}%)
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
