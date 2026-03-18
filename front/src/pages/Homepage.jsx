import { useEffect, useState, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router';
import { useDispatch, useSelector } from 'react-redux';
import axiosClient from '../utils/axiosClient';
import { logoutUser } from '../authSlice';

// ── Animated grid canvas background ──────────────────────────────────

function GridBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animId;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const CELL = 38;
    let t = 0;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const cols = Math.floor(canvas.width / CELL) + 2;
      const rows = Math.floor(canvas.height / CELL) + 2;
      const cw = canvas.width / cols;
      const ch = canvas.height / rows;
      t += 0.012;

      for (let i = 0; i < cols * rows; i++) {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const phase = ((col * 0.7 + row * 0.5) % (Math.PI * 2));
        const o = Math.max(0, 0.06 + 0.09 * Math.sin(t + phase));
        ctx.strokeStyle = `rgba(124,92,233,${o})`;
        ctx.lineWidth = 0.5;
        ctx.strokeRect(col * cw, row * ch, cw, ch);
        if (Math.sin(t * 0.4 + phase) > 0.94) {
          ctx.fillStyle = `rgba(124,92,233,${o * 3})`;
          ctx.fillRect(col * cw + cw / 2 - 1, row * ch + ch / 2 - 1, 2, 2);
        }
      }
      animId = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ opacity: 0.35 }}
    />
  );
}

// ── Difficulty badge ──────────────────────────────────────────────────

function DiffBadge({ difficulty }) {
  const styles = {
    easy:   "bg-teal-500/10 text-teal-300 border border-teal-500/20",
    medium: "bg-amber-500/10 text-amber-300 border border-amber-500/20",
    hard:   "bg-red-500/10   text-red-300   border border-red-500/20",
  };
  return (
    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${styles[difficulty?.toLowerCase()] || "bg-white/5 text-white/40"}`}>
      {difficulty}
    </span>
  );
}

// ── Tag badge ─────────────────────────────────────────────────────────

function TagBadge({ tag }) {
  return (
    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20">
      {tag}
    </span>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────

function StatCard({ num, label }) {
  return (
    <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-3.5">
      <p className="font-['Instrument_Serif'] text-[22px] text-white tracking-tight">{num}</p>
      <p className="text-[11px] text-white/30 mt-0.5">{label}</p>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────

export default function Homepage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);
  const [problems, setProblems] = useState([]);
  const [solvedProblems, setSolvedProblems] = useState([]);
  const [filters, setFilters] = useState({ difficulty: 'all', tag: 'all', status: 'all' });

  useEffect(() => {
    axiosClient.get('/problem/getAllProblem')
      .then(({ data }) => setProblems(data))
      .catch(console.error);

    if (user) {
      axiosClient.get('/problem/problemSolvedByUser')
        .then(({ data }) => setSolvedProblems(data))
        .catch(console.error);
    }
  }, [user]);

  const handleLogout = () => {
    dispatch(logoutUser());
    setSolvedProblems([]);
  };

  const isSolved = (id) => solvedProblems.some(sp => sp._id === id);

  const filtered = problems.filter(p => {
    if (filters.difficulty !== 'all' && p.difficulty !== filters.difficulty) return false;
    if (filters.tag !== 'all' && p.tags !== filters.tag) return false;
    if (filters.status === 'solved' && !isSolved(p._id)) return false;
    return true;
  });

  const solvedCount = problems.filter(p => isSolved(p._id)).length;

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap');`}</style>

      <div className="min-h-screen bg-[#0a0a0f] font-['DM_Sans'] relative overflow-hidden">

        {/* ── Animated grid background ── */}
        <GridBackground />

        {/* ── Radial glows ── */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 50% 0%,rgba(99,60,200,0.15) 0%,transparent 55%),radial-gradient(ellipse at 90% 80%,rgba(56,139,253,0.1) 0%,transparent 50%)" }}
        />

        {/* ── All content above canvas ── */}
        <div className="relative z-10">

          {/* Navbar */}
          <nav className="flex items-center justify-between px-7 py-4 border-b border-white/[0.06]"
            style={{ backdropFilter: "blur(12px)", background: "rgba(10,10,15,0.7)" }}>

            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: "linear-gradient(135deg,#7c5ce9,#4a9cf6)" }}>
                <svg className="w-3.5 h-3.5 fill-white" viewBox="0 0 24 24">
                  <path d="M4 4h4v4H4zm6 0h4v4h-4zm6 0h4v4h-4zM4 10h4v4H4zm6 0h4v4h-4zm6 0h4v4h-4zM4 16h4v4H4zm6 0h4v4h-4zm6 0h4v4h-4z" />
                </svg>
              </div>
              <NavLink to="/" className="font-['Instrument_Serif'] text-[17px] text-white tracking-tight">
                LogicGrid
              </NavLink>
            </div>

            <div className="flex items-center gap-3">
              {user && (
                <span className="text-[13px] text-white/50 px-3 py-1.5 bg-white/[0.04] border border-white/[0.08] rounded-lg">
                  {user.firstName}
                </span>
              )}
              <button
                onClick={handleLogout}
                className="text-[12px] text-purple-400 hover:text-purple-300 px-3 py-1.5
                  border border-purple-500/30 hover:border-purple-500/50 hover:bg-purple-500/10
                  rounded-lg transition-all font-medium"
              >
                Logout
              </button>
            </div>
          </nav>

          {/* Main content */}
          <div className="max-w-4xl mx-auto px-6 py-8">

            {/* Stats row */}
            {user && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
                <StatCard num={solvedCount} label="Problems solved" />
                <StatCard num={`${problems.length}+`} label="Total problems" />
                <StatCard num="7" label="Day streak 🔥" />
                <StatCard num={`#${Math.floor(Math.random() * 500) + 100}`} label="Leaderboard rank" />
              </div>
            )}

            {/* Filters */}
            <div className="flex flex-wrap gap-2 mb-6">
              {[
                {
                  key: "status",
                  options: [["all", "All Problems"], ["solved", "Solved"]],
                },
                {
                  key: "difficulty",
                  options: [["all", "All Difficulties"], ["easy", "Easy"], ["medium", "Medium"], ["hard", "Hard"]],
                },
                {
                  key: "tag",
                  options: [["all", "All Tags"], ["array", "Array"], ["linkedList", "Linked List"], ["graph", "Graph"], ["dp", "DP"]],
                },
              ].map(({ key, options }) => (
                <select
                  key={key}
                  value={filters[key]}
                  onChange={(e) => setFilters(f => ({ ...f, [key]: e.target.value }))}
                  className="px-3 py-1.5 bg-white/[0.04] border border-white/[0.08] rounded-lg
                    text-[12px] text-white/60 font-['DM_Sans'] outline-none cursor-pointer
                    hover:border-white/[0.15] focus:border-purple-500/50 transition-colors"
                >
                  {options.map(([val, label]) => (
                    <option key={val} value={val} className="bg-[#1a1a2e]">{label}</option>
                  ))}
                </select>
              ))}
            </div>

            {/* Section heading */}
            <p className="text-[11px] font-semibold text-white/30 uppercase tracking-widest mb-4">
              {filtered.length} problem{filtered.length !== 1 ? "s" : ""}
            </p>

            {/* Problem list */}
            {filtered.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-[13px] text-white/25">No problems match the current filters.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {filtered.map((problem, idx) => (
                  <NavLink
                    key={problem._id}
                    to={`/problem/${problem._id}`}
                    className="flex items-center justify-between px-5 py-4
                      bg-white/[0.025] border border-white/[0.06] rounded-xl
                      hover:bg-purple-500/[0.08] hover:border-purple-500/25
                      transition-all group"
                  >
                    {/* Left */}
                    <div className="flex items-center gap-4">
                      <span className="text-[12px] text-white/20 w-6 tabular-nums shrink-0">
                        {idx + 1}
                      </span>
                      <div>
                        <p className="text-[14px] text-white/85 font-medium group-hover:text-white transition-colors">
                          {problem.title}
                        </p>
                        <div className="flex gap-1.5 mt-1.5">
                          <DiffBadge difficulty={problem.difficulty} />
                          {problem.tags && <TagBadge tag={problem.tags} />}
                        </div>
                      </div>
                    </div>

                    {/* Right */}
                    <div className="flex items-center gap-3 shrink-0">
                      {isSolved(problem._id) && (
                        <span className="flex items-center gap-1.5 text-[11px] text-teal-300
                          bg-teal-500/10 border border-teal-500/20 px-2.5 py-1 rounded-full">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24"
                            stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                          Solved
                        </span>
                      )}
                      <span className="text-white/15 group-hover:text-white/40 transition-colors text-lg">›</span>
                    </div>
                  </NavLink>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}