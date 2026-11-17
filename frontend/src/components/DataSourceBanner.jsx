import { Database, Info, RefreshCw } from 'lucide-react';
import { formatRelativeTime, getSourceLabel } from '../utils/formatters';

export default function DataSourceBanner({
  source,
  isDemo,
  stale,
  warning,
  updatedAt,
  seasonMeta,
  onRefresh,
  refreshing = false,
}) {
  const badge = getSourceLabel(source, isDemo);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800/90 bg-slate-900/70 px-4 py-2.5 text-xs">
      <div className="flex flex-wrap items-center gap-2.5">
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-medium ${badge.color}`}>
          <Database className="h-3.5 w-3.5" />
          {badge.text}
        </span>

        {seasonMeta?.label && (
          <span className="inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 font-semibold text-emerald-300 tabular-nums">
            {seasonMeta.isLatest ? `ฤดูกาลล่าสุด ${seasonMeta.label}` : `ฤดูกาล ${seasonMeta.label}`}
          </span>
        )}

        {updatedAt && (
          <span className="text-slate-400">
            อัปเดตล่าสุด: <strong className="font-medium text-slate-200">{formatRelativeTime(updatedAt)}</strong>
          </span>
        )}

        {(isDemo || stale || warning) && (
          <span className="inline-flex items-center gap-1 text-slate-400">
            <Info className="h-3.5 w-3.5 text-amber-400" />
            {warning ||
              'แสดงข้อมูลตัวอย่างครบ 8 รายการ (ใส่ FOOTBALL_DATA_API_KEY ใน backend/.env เพื่อดึงข้อมูลจริง)'}
          </span>
        )}
      </div>

      {onRefresh && (
        <button
          type="button"
          onClick={onRefresh}
          disabled={refreshing}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-xs font-medium text-slate-200 transition hover:border-emerald-500/40 hover:text-emerald-300 disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          <span>{refreshing ? 'กำลังอัปเดต...' : 'รีเฟรชข้อมูล'}</span>
        </button>
      )}
    </div>
  );
}
