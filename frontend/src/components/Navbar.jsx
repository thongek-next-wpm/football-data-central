import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Activity, Calendar, Cpu, Home, Search, Trophy, Users } from 'lucide-react';
import { getHealth, searchEntities } from '../api/client';
import ClubBadge from './ClubBadge';
import SystemStatusModal from './SystemStatusModal';

export default function Navbar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [health, setHealth] = useState(null);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const searchRef = useRef(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    getHealth().then(setHealth).catch(() => setHealth(null));
  }, []);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        inputRef.current?.focus();
      } else if (e.key === 'Escape') {
        setSearchOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults(null);
      return;
    }
    const timer = setTimeout(() => {
      searchEntities(trimmed)
        .then((res) => {
          setResults(res);
          setSearchOpen(true);
        })
        .catch(() => {});
    }, 200);
    return () => clearTimeout(timer);
  }, [query]);

  const linkClass = ({ isActive }) =>
    `inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs sm:text-sm font-medium transition ${
      isActive
        ? 'bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-500/20'
        : 'text-slate-300 hover:bg-slate-800/90 hover:text-white'
    }`;

  const goAndClose = (path) => {
    setSearchOpen(false);
    setQuery('');
    navigate(path);
  };

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-[#060b14]/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <Link to="/" className="flex items-center gap-2.5 font-extrabold tracking-tight text-white">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 text-slate-950 shadow-lg shadow-emerald-500/20">
              <Trophy className="h-5 w-5" />
            </span>
            <div className="leading-tight">
              <span className="block text-sm sm:text-base">Football Data Central</span>
              <span className="block text-[10px] font-medium text-emerald-400">FDC WEB PLATFORM</span>
            </div>
          </Link>

          <nav className="order-3 flex w-full items-center gap-1 overflow-x-auto pb-1 lg:order-2 lg:w-auto lg:pb-0">
            <NavLink to="/" end className={linkClass}>
              <Home className="h-4 w-4" />
              <span>ภาพรวม</span>
            </NavLink>
            <NavLink to="/standings" className={linkClass}>
              <Trophy className="h-4 w-4" />
              <span>ตารางคะแนน</span>
            </NavLink>
            <NavLink to="/matches" className={linkClass}>
              <Calendar className="h-4 w-4" />
              <span>ผลบอล & โปรแกรม</span>
            </NavLink>
            <NavLink to="/players" className={linkClass}>
              <Users className="h-4 w-4" />
              <span>นักเตะ & ดาวซัลโว</span>
            </NavLink>
            <NavLink to="/supercomputer" className={linkClass}>
              <Cpu className="h-4 w-4" />
              <span>Supercomputer</span>
            </NavLink>
          </nav>

          <div className="order-2 flex items-center gap-2 lg:order-3">
            <div ref={searchRef} className="relative">
              <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/90 px-3 py-1.5 text-sm focus-within:border-emerald-500/60">
                <Search className="h-4 w-4 text-slate-400" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onFocus={() => results && setSearchOpen(true)}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="ค้นหาสโมสร / นักเตะ..."
                  className="w-36 bg-transparent text-xs text-white placeholder-slate-500 outline-none sm:w-52 sm:text-sm"
                />
                <kbd className="hidden rounded border border-slate-700 bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-400 sm:inline">
                  /
                </kbd>
              </div>

              {searchOpen && results && (
                <div className="absolute right-0 mt-2 max-h-96 w-80 overflow-y-auto rounded-2xl border border-slate-800 bg-slate-900 p-2 shadow-2xl sm:w-96">
                  {results.teams?.length === 0 && results.players?.length === 0 && results.competitions?.length === 0 ? (
                    <p className="p-4 text-center text-xs text-slate-400">ไม่พบข้อมูลที่ตรงกับ "{query}"</p>
                  ) : (
                    <div className="space-y-3">
                      {results.competitions?.length > 0 && (
                        <div>
                          <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                            การแข่งขัน
                          </p>
                          {results.competitions.map((c) => (
                            <button
                              key={c.code}
                              type="button"
                              onClick={() => goAndClose(`/standings?league=${c.code}`)}
                              className="flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-left text-xs hover:bg-slate-800"
                            >
                              <span className="font-medium text-white">{c.name}</span>
                              <span className="text-slate-400">{c.thaiName}</span>
                            </button>
                          ))}
                        </div>
                      )}

                      {results.teams?.length > 0 && (
                        <div>
                          <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                            สโมสร
                          </p>
                          {results.teams.map((t) => (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() => goAndClose(`/teams/${t.id}`)}
                              className="flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-left text-xs hover:bg-slate-800"
                            >
                              <span className="flex items-center gap-2 font-medium text-white">
                                <ClubBadge crest={t.crest} name={t.name} tla={t.tla} size="sm" />
                                {t.name}
                              </span>
                              <span className="text-slate-400">{t.league || t.area}</span>
                            </button>
                          ))}
                        </div>
                      )}

                      {results.players?.length > 0 && (
                        <div>
                          <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                            นักเตะ
                          </p>
                          {results.players.map((p) => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => goAndClose(`/players/${p.id}`)}
                              className="flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-left text-xs hover:bg-slate-800"
                            >
                              <div>
                                <span className="block font-medium text-white">{p.name}</span>
                                <span className="text-[11px] text-slate-400">
                                  {p.team?.shortName || p.team?.name} • {p.position}
                                </span>
                              </div>
                              <span className="font-semibold text-emerald-400 tabular-nums">
                                {p.goals ?? 0}G
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setStatusModalOpen(true)}
              title="ตรวจสอบสถานะ Cache และ API Quota"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/90 px-2.5 py-1.5 text-xs font-medium text-slate-300 transition hover:border-emerald-500/40 hover:text-white"
            >
              <Activity
                className={`h-3.5 w-3.5 ${
                  health?.apiKeyConfigured ? 'text-emerald-400' : 'text-amber-400'
                }`}
              />
              <span className="hidden sm:inline">
                {health?.apiKeyConfigured ? 'Live Cache' : 'Demo Mode'}
              </span>
            </button>
          </div>
        </div>
      </header>

      <SystemStatusModal open={statusModalOpen} onClose={() => setStatusModalOpen(false)} />
    </>
  );
}
