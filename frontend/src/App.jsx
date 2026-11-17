import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import DashboardPage from './pages/DashboardPage';
import StandingsPage from './pages/StandingsPage';
import MatchesPage from './pages/MatchesPage';
import PlayersPage from './pages/PlayersPage';
import TeamPage from './pages/TeamPage';
import PlayerPage from './pages/PlayerPage';
import SupercomputerPage from './pages/SupercomputerPage';

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen flex-col text-slate-100">
        <Navbar />
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/standings" element={<StandingsPage />} />
            <Route path="/matches" element={<MatchesPage />} />
            <Route path="/players" element={<PlayersPage />} />
            <Route path="/supercomputer" element={<SupercomputerPage />} />
            <Route path="/teams/:id" element={<TeamPage />} />
            <Route path="/players/:id" element={<PlayerPage />} />
          </Routes>
        </main>
        <footer className="mt-12 border-t border-slate-800/80 bg-slate-950/60 py-6 text-center text-xs text-slate-500">
          <div className="mx-auto max-w-7xl px-4">
            <p className="font-medium text-slate-400">
              Football Data Central (FDC Web Platform) — 5 ลีกใหญ่ยุโรป & 3 ถ้วยสโมสรยุโรป
            </p>
            <p className="mt-1">
              Public Read-Only • ข้อมูลจาก football-data.org (Free Tier: 10 requests/min) ผ่านระบบ Backend Caching (Redis + PostgreSQL)
            </p>
          </div>
        </footer>
      </div>
    </BrowserRouter>
  );
}
