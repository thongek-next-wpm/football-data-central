import { useState } from 'react';
import { Link } from 'react-router-dom';
import ClubBadge from './ClubBadge';
import { getStandingZone } from '../utils/formatters';

function FormPills({ form }) {
  if (!form) return <span className="text-slate-600">-</span>;
  const items = String(form)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(-5);

  return (
    <div className="flex items-center justify-end gap-1">
      {items.map((res, idx) => {
        const cls =
          res === 'W'
            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
            : res === 'D'
              ? 'bg-slate-700/70 text-slate-300 border-slate-600'
              : 'bg-rose-500/20 text-rose-300 border-rose-500/40';
        return (
          <span
            key={idx}
            className={`inline-flex h-5 w-5 items-center justify-center rounded border text-[10px] font-bold ${cls}`}
          >
            {res}
          </span>
        );
      })}
    </div>
  );
}

export default function StandingsTable({
  standingsPayload,
  competitionMeta,
  compact = false,
  maxRows = null,
}) {
  const [splitType, setSplitType] = useState('TOTAL');

  const standingsGroups = standingsPayload?.standings || [];
  const availableTypes = Array.from(new Set(standingsGroups.map((s) => s.type).filter(Boolean)));
  const activeType = availableTypes.includes(splitType) ? splitType : availableTypes[0] || 'TOTAL';

  const matchingGroups = standingsGroups.filter((s) => (s.type || 'TOTAL') === activeType);
  const firstGroup = matchingGroups[0];
  const rawTable = firstGroup?.table || [];
  const rows = maxRows ? rawTable.slice(0, maxRows) : rawTable;

  const isCup = competitionMeta?.type === 'CUP';

  return (
    <div className="space-y-3">
      {!compact && availableTypes.length > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="inline-flex rounded-xl border border-slate-800 bg-slate-900 p-1 text-xs">
            {[
              { id: 'TOTAL', label: 'รวมทั้งหมด' },
              { id: 'HOME', label: 'เกมเหย้า' },
              { id: 'AWAY', label: 'เกมเยือน' },
            ]
              .filter((tab) => availableTypes.includes(tab.id))
              .map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSplitType(tab.id)}
                  className={`rounded-lg px-3 py-1 font-medium transition ${
                    activeType === tab.id
                      ? 'bg-emerald-500 text-slate-950'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
          </div>

          {standingsPayload?.season?.currentMatchday && (
            <span className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-1 text-xs text-slate-300">
              Matchday {standingsPayload.season.currentMatchday}
            </span>
          )}
        </div>
      )}

      {matchingGroups.length > 1 ? (
        <div className="space-y-6">
          {matchingGroups.map((grp, gIdx) => (
            <div key={grp.group || gIdx} className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80">
              {grp.group && (
                <div className="border-b border-slate-800 bg-slate-800/40 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-emerald-300">
                  {grp.group.replace('_', ' ')}
                </div>
              )}
              <TableBody rows={grp.table || []} competitionMeta={competitionMeta} compact={compact} />
            </div>
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80 shadow-lg shadow-black/20">
          <TableBody rows={rows} competitionMeta={competitionMeta} compact={compact} />
        </div>
      )}

      {!compact && (
        <div className="flex flex-wrap items-center gap-4 px-1 text-xs text-slate-400">
          {isCup ? (
            <>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" /> เข้ารอบ 16 ทีมอัตโนมัติ (อันดับ 1–8)
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-sky-500" /> รอบเพลย์ออฟ (อันดับ 9–24)
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-rose-500" /> ตกรอบ (อันดับ 25+)
              </span>
            </>
          ) : (
            <>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" /> ยูฟ่า แชมเปี้ยนส์ลีก
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-amber-500" /> ยูฟ่า ยูโรปาลีก
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-sky-500" /> ยูฟ่า คอนเฟอเรนซ์ลีก
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-rose-500" /> โซนตกชั้น
              </span>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function TableBody({ rows, competitionMeta, compact }) {
  if (!rows || rows.length === 0) {
    return <p className="p-6 text-center text-sm text-slate-400">ยังไม่มีข้อมูลตารางคะแนน</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm tabular-nums">
        <thead className="border-b border-slate-800 bg-slate-800/50 text-xs uppercase tracking-wider text-slate-400">
          <tr>
            <th className="w-12 px-3 py-3 text-center">#</th>
            <th className="px-3 py-3">สโมสร</th>
            <th className="px-2.5 py-3 text-right">แข่ง</th>
            <th className="px-2.5 py-3 text-right">ชนะ</th>
            <th className="px-2.5 py-3 text-right">เสมอ</th>
            <th className="px-2.5 py-3 text-right">แพ้</th>
            {!compact && <th className="hidden px-2.5 py-3 text-right sm:table-cell">ได้</th>}
            {!compact && <th className="hidden px-2.5 py-3 text-right sm:table-cell">เสีย</th>}
            <th className="px-2.5 py-3 text-right">ได้เสีย</th>
            <th className="px-3 py-3 text-right">คะแนน</th>
            {!compact && <th className="hidden px-4 py-3 text-right md:table-cell">ฟอร์ม 5 นัด</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/70">
          {rows.map((row) => {
            const zone = getStandingZone(row.position, competitionMeta);
            const gd = row.goalDifference ?? 0;
            return (
              <tr key={row.team?.id || row.position} className="group transition hover:bg-slate-800/40">
                <td className="relative px-3 py-2.5 text-center font-semibold text-slate-300">
                  {zone && (
                    <span
                      title={zone.label}
                      className={`absolute inset-y-1.5 left-0 w-1 rounded-r ${zone.color}`}
                    />
                  )}
                  {row.position}
                </td>
                <td className="px-3 py-2.5">
                  <Link
                    to={`/teams/${row.team?.id}`}
                    className="flex items-center gap-2.5 font-medium text-slate-100 transition group-hover:text-emerald-300"
                  >
                    <ClubBadge crest={row.team?.crest} name={row.team?.name} tla={row.team?.tla} size="sm" />
                    <span className="truncate">{row.team?.shortName || row.team?.name}</span>
                  </Link>
                </td>
                <td className="px-2.5 py-2.5 text-right text-slate-300">{row.playedGames}</td>
                <td className="px-2.5 py-2.5 text-right text-slate-300">{row.won}</td>
                <td className="px-2.5 py-2.5 text-right text-slate-300">{row.draw}</td>
                <td className="px-2.5 py-2.5 text-right text-slate-300">{row.lost}</td>
                {!compact && (
                  <td className="hidden px-2.5 py-2.5 text-right text-slate-400 sm:table-cell">
                    {row.goalsFor ?? '-'}
                  </td>
                )}
                {!compact && (
                  <td className="hidden px-2.5 py-2.5 text-right text-slate-400 sm:table-cell">
                    {row.goalsAgainst ?? '-'}
                  </td>
                )}
                <td
                  className={`px-2.5 py-2.5 text-right font-medium ${
                    gd > 0 ? 'text-emerald-400' : gd < 0 ? 'text-rose-400' : 'text-slate-400'
                  }`}
                >
                  {gd > 0 ? `+${gd}` : gd}
                </td>
                <td className="px-3 py-2.5 text-right font-bold text-white">{row.points}</td>
                {!compact && (
                  <td className="hidden px-4 py-2.5 text-right md:table-cell">
                    <FormPills form={row.form} />
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
