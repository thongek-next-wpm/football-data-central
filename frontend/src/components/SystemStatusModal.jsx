import { useEffect, useState } from 'react';
import { Activity, Clock, Database, Server, ShieldAlert, X } from 'lucide-react';
import { getSystemStatus } from '../api/client';
import { formatRelativeTime } from '../utils/formatters';

export default function SystemStatusModal({ open, onClose }) {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    getSystemStatus()
      .then((res) => setStatus(res))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open]);

  if (!open) return null;

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
          <div className="flex items-center gap-2">
            <Server className="h-5 w-5 text-emerald-400" />
            <div>
              <h2 className="text-base font-bold text-white">สถาปัตยกรรม Backend Caching & API Quota</h2>
              <p className="text-xs text-slate-400">Public Read-Only • Backend Proxy Only • Rate Limit Protection</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-800 bg-slate-800 p-1.5 text-slate-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {loading && !status ? (
          <p className="py-8 text-center text-sm text-slate-400">กำลังตรวจสอบสถานะระบบ...</p>
        ) : status ? (
          <div className="space-y-4 text-xs">
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-amber-200">
              <div className="flex items-start gap-2">
                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                <p>{status.dataLatencyNotice}</p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
                <div className="mb-1 flex items-center gap-1.5 text-slate-400">
                  <Database className="h-3.5 w-3.5 text-emerald-400" />
                  Redis Cache (L1)
                </div>
                <p className={`font-bold ${status.redis?.connected ? 'text-emerald-400' : 'text-amber-300'}`}>
                  {status.redis?.connected ? 'เชื่อมต่อแล้ว (Active)' : 'Fallback Mode (ไม่พบ Redis)'}
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
                <div className="mb-1 flex items-center gap-1.5 text-slate-400">
                  <Database className="h-3.5 w-3.5 text-sky-400" />
                  PostgreSQL (L2)
                </div>
                <p className={`font-bold ${status.postgres?.connected ? 'text-emerald-400' : 'text-amber-300'}`}>
                  {status.postgres?.connected ? 'เชื่อมต่อแล้ว (Active)' : 'Local Disk Fallback'}
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
                <div className="mb-1 flex items-center gap-1.5 text-slate-400">
                  <Activity className="h-3.5 w-3.5 text-violet-400" />
                  API Key Status
                </div>
                <p className={`font-bold ${status.sync?.apiKeyConfigured ? 'text-emerald-400' : 'text-amber-300'}`}>
                  {status.sync?.apiKeyConfigured ? 'Live API Connected' : 'Demo Seed Mode'}
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-semibold text-white">โควตาการเรียก football-data.org (10 req/min)</span>
                <span className="font-bold text-emerald-400 tabular-nums">
                  ใช้ไป {status.rateLimiter?.usedInCurrentWindow ?? 0} / {status.rateLimiter?.safeCapPerWindow ?? 9} (ปลอดภัย)
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all"
                  style={{
                    width: `${Math.min(
                      100,
                      ((status.rateLimiter?.usedInCurrentWindow || 0) /
                        (status.rateLimiter?.safeCapPerWindow || 9)) *
                        100
                    )}%`,
                  }}
                />
              </div>
              <div className="mt-2 flex flex-wrap justify-between gap-2 text-[11px] text-slate-400">
                <span>คิวรอเรียก API: {status.rateLimiter?.queueDepth ?? 0}</span>
                <span>
                  โหมด Sync ผลบอล:{' '}
                  <strong className="text-slate-200">
                    {status.sync?.matchWindow?.active
                      ? 'ช่วงมีแข่ง (ทุก 5–10 นาที)'
                      : 'นอกเวลาแข่ง (ประหยัดโควตา)'}
                  </strong>
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
              <h3 className="mb-2 flex items-center gap-1.5 font-semibold text-white">
                <Clock className="h-3.5 w-3.5 text-emerald-400" />
                Cache TTL Policy & Snapshots ({status.snapshots?.length || 0})
              </h3>
              <div className="grid gap-2 text-[11px] text-slate-300 sm:grid-cols-2">
                <div className="rounded-lg bg-slate-900 px-3 py-2">
                  ตารางคะแนน (Standings): ทุก {(status.sync?.ttlConfig?.standingsSeconds || 7200) / 3600} ชั่วโมง
                </div>
                <div className="rounded-lg bg-slate-900 px-3 py-2">
                  ผลบอลช่วงมีแข่ง: ทุก {(status.sync?.ttlConfig?.matchesActiveSeconds || 480) / 60} นาที
                </div>
              </div>

              {status.snapshots?.length > 0 && (
                <div className="mt-3 max-h-36 space-y-1.5 overflow-y-auto pr-1">
                  {status.snapshots.slice(0, 12).map((snap) => (
                    <div
                      key={snap.cacheKey}
                      className="flex items-center justify-between rounded-lg bg-slate-900/90 px-3 py-1.5 text-[11px]"
                    >
                      <span className="font-mono text-slate-200">{snap.cacheKey}</span>
                      <div className="flex items-center gap-2">
                        <span className={snap.fresh ? 'text-emerald-400' : 'text-amber-400'}>
                          {snap.fresh ? 'Fresh' : 'Stale'}
                        </span>
                        <span className="text-slate-500">{formatRelativeTime(snap.updatedAt)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <p className="py-6 text-center text-xs text-rose-400">ไม่สามารถเชื่อมต่อ Backend ได้</p>
        )}
      </div>
    </div>
  );
}
