export function formatThaiDateTime(iso) {
  if (!iso) return '-';
  return new Date(iso).toLocaleString('th-TH', {
    timeZone: 'Asia/Bangkok',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatThaiDateHeader(iso) {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('th-TH', {
    timeZone: 'Asia/Bangkok',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function formatBangkokTime(iso) {
  if (!iso) return '-';
  return new Date(iso).toLocaleTimeString('th-TH', {
    timeZone: 'Asia/Bangkok',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getBangkokDateKey(iso) {
  if (!iso) return 'unknown';
  return new Date(iso).toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' });
}

export function formatRelativeTime(iso) {
  if (!iso) return '-';
  const diffSec = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (diffSec < 60) return 'เมื่อสักครู่';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} นาทีที่แล้ว`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} ชั่วโมงที่แล้ว`;
  return `${Math.floor(diffHour / 24)} วันที่แล้ว`;
}

export function calculateAge(dob) {
  if (!dob) return null;
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age -= 1;
  return age;
}

export function getMatchStatusBadge(status) {
  switch (status) {
    case 'IN_PLAY':
    case 'LIVE':
      return {
        label: 'กำลังแข่ง',
        short: 'LIVE',
        isLive: true,
        className: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
      };
    case 'PAUSED':
    case 'HALFTIME':
      return {
        label: 'พักครึ่ง',
        short: 'HT',
        isLive: true,
        className: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      };
    case 'FINISHED':
      return {
        label: 'จบเกม',
        short: 'FT',
        isLive: false,
        className: 'bg-slate-800 text-slate-300 border-slate-700',
      };
    case 'POSTPONED':
      return {
        label: 'เลื่อนแข่ง',
        short: 'PPD',
        isLive: false,
        className: 'bg-amber-950/60 text-amber-300 border-amber-700/40',
      };
    case 'CANCELLED':
      return {
        label: 'ยกเลิก',
        short: 'CAN',
        isLive: false,
        className: 'bg-rose-950/60 text-rose-300 border-rose-700/40',
      };
    default:
      return {
        label: 'โปรแกรมถัดไป',
        short: 'UPCOMING',
        isLive: false,
        className: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
      };
  }
}

export function getPositionGroup(position = '') {
  const p = position.toLowerCase();
  if (p.includes('goalkeeper')) return 'GK';
  if (p.includes('back') || p.includes('defence') || p.includes('defender')) return 'DEF';
  if (p.includes('midfield')) return 'MID';
  return 'FWD';
}

export function translatePosition(position = '') {
  const p = position.toLowerCase();
  if (p.includes('goalkeeper')) return 'ผู้รักษาประตู';
  if (p.includes('centre-back')) return 'เซ็นเตอร์แบ็ก';
  if (p.includes('left-back')) return 'แบ็กซ้าย';
  if (p.includes('right-back')) return 'แบ็กขวา';
  if (p.includes('defence') || p.includes('defender')) return 'กองหลัง';
  if (p.includes('defensive midfield')) return 'กองกลางตัวรับ';
  if (p.includes('attacking midfield')) return 'กองกลางตัวรุก';
  if (p.includes('central midfield') || p.includes('midfield')) return 'กองกลาง';
  if (p.includes('left winger')) return 'ปีกซ้าย';
  if (p.includes('right winger')) return 'ปีกขวา';
  if (p.includes('centre-forward') || p.includes('striker')) return 'กองหน้าตัวเป้า';
  if (p.includes('offence') || p.includes('forward')) return 'กองหน้า';
  return position || '-';
}

export function getStandingZone(position, competitionMeta) {
  const zones = competitionMeta?.zones;
  if (!zones) return null;

  if (competitionMeta.type === 'CUP') {
    if (position <= (zones.ucl || 8)) {
      return { color: 'bg-emerald-500', label: 'รอบ 16 ทีมอัตโนมัติ (Top 8)' };
    }
    if (position >= (zones.playoffStart || 9) && position <= (zones.playoffEnd || 24)) {
      return { color: 'bg-sky-500', label: 'รอบเพลย์ออฟ (อันดับ 9–24)' };
    }
    if (position >= (zones.eliminatedStart || 25)) {
      return { color: 'bg-rose-500', label: 'ตกรอบ' };
    }
    return null;
  }

  if (position <= (zones.ucl || 4)) {
    return { color: 'bg-emerald-500', label: 'ยูฟ่า แชมเปี้ยนส์ลีก' };
  }
  if (position === (zones.uel || 5)) {
    return { color: 'bg-amber-500', label: 'ยูฟ่า ยูโรปาลีก' };
  }
  if (position === (zones.uecl || 6)) {
    return { color: 'bg-sky-500', label: 'ยูฟ่า คอนเฟอเรนซ์ลีก' };
  }
  if (zones.relegationStart && position >= zones.relegationStart) {
    return { color: 'bg-rose-500', label: 'โซนตกชั้น' };
  }
  return null;
}

export function getSourceLabel(source, isDemo) {
  if (isDemo || source?.startsWith('demo')) {
    return {
      text: source === 'demo-tier-fallback' ? 'Demo (Free Tier Restriction)' : 'Demo Dataset',
      color: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    };
  }
  if (source === 'redis') {
    return { text: 'Redis Cache (Live)', color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' };
  }
  if (source === 'postgres') {
    return { text: 'PostgreSQL Cache', color: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30' };
  }
  if (source === 'local-cache') {
    return { text: 'Backend Cache', color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' };
  }
  if (source?.includes('fallback')) {
    return { text: 'Stale Cache Fallback', color: 'bg-orange-500/15 text-orange-300 border-orange-500/30' };
  }
  return { text: 'Live API', color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' };
}
