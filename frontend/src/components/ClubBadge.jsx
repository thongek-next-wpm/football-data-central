import { useState } from 'react';

export default function ClubBadge({ crest, name = '', tla = '', size = 'md' }) {
  const [imgFailed, setImgFailed] = useState(false);

  const sizeClass =
    size === 'xl'
      ? 'h-16 w-16 text-sm'
      : size === 'lg'
        ? 'h-11 w-11 text-xs'
        : size === 'sm'
          ? 'h-5 w-5 text-[9px]'
          : 'h-7 w-7 text-[10px]';

  const initials = (tla || name || 'FDC').slice(0, 3).toUpperCase();

  if (crest && !imgFailed) {
    return (
      <img
        src={crest}
        alt={name}
        onError={() => setImgFailed(true)}
        className={`${sizeClass} shrink-0 rounded object-contain`}
        loading="lazy"
      />
    );
  }

  return (
    <span
      className={`${sizeClass} inline-flex shrink-0 items-center justify-center rounded-lg border border-slate-700 bg-slate-800 font-bold text-emerald-300`}
      title={name}
    >
      {initials}
    </span>
  );
}
