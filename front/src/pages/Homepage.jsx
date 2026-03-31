import { useEffect, useState, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router';
import { useDispatch, useSelector } from 'react-redux';
import axiosClient from '../utils/axiosClient';
import { logoutUser } from '../authSlice';

// ── Animated grid ─────────────────────────────────────────────────────

function GridBackground() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animId;
    const resize = () => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);
    let t = 0;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const CELL = 38;
      const cols = Math.floor(canvas.width  / CELL) + 2;
      const rows = Math.floor(canvas.height / CELL) + 2;
      const cw = canvas.width  / cols;
      const ch = canvas.height / rows;
      t += 0.012;
      for (let i = 0; i < cols * rows; i++) {
        const col   = i % cols;
        const row   = Math.floor(i / cols);
        const phase = ((col * 0.7 + row * 0.5) % (Math.PI * 2));
        const o     = Math.max(0, 0.06 + 0.09 * Math.sin(t + phase));
        ctx.strokeStyle = `rgba(124,92,233,${o})`;
        ctx.lineWidth   = 0.5;
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
    <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" style={{ opacity: 0.35 }} />
  );
}

// ── Badges ────────────────────────────────────────────────────────────

function DiffBadge({ difficulty }) {
  const styles = {
    easy:   "bg-teal-500/10 text-teal-300 border border-teal-500/20",
    medium: "bg-amber-500/10 text-amber-300 border border-amber-500/20",
    hard:   "bg-red-500/10 text-red-300 border border-red-500/20",
  };
  return (
    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full
      ${styles[difficulty?.toLowerCase()] || "bg-white/5 text-white/40"}`}>
      {difficulty}
    </span>
  );
}

function TagBadge({ tag }) {
  return (
    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full
      bg-purple-500/10 text-purple-300 border border-purple-500/20">
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

// ── User dropdown ─────────────────────────────────────────────────────

function UserDropdown({ user, onLogout }) {
  const [open, setOpen] = useState(false);
  const ref             = useRef(null);
  const navigate        = useNavigate();

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg
          bg-white/[0.04] border border-white/[0.08]
          hover:bg-white/[0.08] hover:border-white/[0.15]
          transition-all text-[13px] text-white/70"
      >
        <div className="w-6 h-6 rounded-full flex items-center justify-center
          text-[11px] font-semibold text-white"
          style={{ background: "linear-gradient(135deg,#7c5ce9,#4a9cf6)" }}>
          {user?.firstName?.[0]?.toUpperCase()}
        </div>
        {user?.firstName}
        <svg className={`w-3 h-3 text-white/40 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-44 rounded-xl overflow-hidden z-50"
          style={{
            background:     "rgba(15,15,25,0.95)",
            border:         "1px solid rgba(255,255,255,0.08)",
            backdropFilter: "blur(12px)"
          }}>

          {/* Header */}
          <div className="px-4 py-3 border-b border-white/[0.06]">
            <p className="text-[13px] font-medium text-white">{user?.firstName}</p>
            <p className="text-[11px] text-white/35 mt-0.5">{user?.emailId}</p>
          </div>

          <div className="py-1">
            {/* Admin — only visible to admins */}
            {user?.role === 'admin' && (
              <button
                onClick={() => { navigate('/admin'); setOpen(false); }}
                className="w-full text-left px-4 py-2.5 text-[12px] text-purple-400
                  hover:bg-purple-500/10 transition-colors flex items-center gap-2"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24"
                  stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Admin panel
              </button>
            )}

            {/* Logout */}
            <button
              onClick={() => { onLogout(); setOpen(false); }}
              className="w-full text-left px-4 py-2.5 text-[12px] text-red-400
                hover:bg-red-500/10 transition-colors flex items-center gap-2"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24"
                stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────

export default function Homepage() {
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);
  const [loading, setLoading] = useState(true);
  const [problems, setProblems] = useState([]);
  const [solvedProblems, setSolvedProblems] = useState([]);
  const [filters, setFilters] = useState({
    difficulty: 'all',
    tag: 'all',
    status: 'all'
  });

  useEffect(() => {
    // ✅ fetch problems and solved together
    const fetchAll = async () => {
      setLoading(true);
      try {
        const { data } = await axiosClient.get('/problem/getAllProblem');
        setProblems(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error('Failed to fetch problems:', e);
        setProblems([]);
      }

      if (user) {
        try {
          const { data } = await axiosClient.get('/problem/problemSolvedByUser');
          setSolvedProblems(Array.isArray(data) ? data : []);
        } catch (e) {
          console.error('Failed to fetch solved problems:', e);
          setSolvedProblems([]);
        }
      } else {
        setSolvedProblems([]);
      }

      setLoading(false);
    };

    fetchAll();
  }, [user]);

  const handleLogout = () => {
    dispatch(logoutUser());
    setSolvedProblems([]);
  };

  const isSolved = (problemId) => {
    return solvedProblems.some((sp) => {
      if (sp?._id === problemId) return true;
      if (sp?.problemId === problemId) return true;
      if (sp?.problemId?._id === problemId) return true;
      if (sp?.problem?._id === problemId) return true;
      if (sp === problemId) return true;
      return false;
    });
  };

  // const filtered = problems.filter(p => {
  //   if (filters.difficulty !== 'all' && p.difficulty !== filters.difficulty) return false;
  //   if (filters.tag       !== 'all' && p.tags       !== filters.tag)       return false;
  //   if (filters.status === 'solved' && !isSolved(p._id))                   return false;
  //   return true;
  // });

  const filtered = problems.filter(problem => {
    const difficultyMatch = filters.difficulty === 'all' || problem.difficulty === filters.difficulty;
    const tagMatch = filters.tag === 'all' || problem.tags === filters.tag;
    const statusMatch = filters.status === 'all' || isSolved(problem._id);
    return difficultyMatch && tagMatch && statusMatch;
  });



  const solvedCount = solvedProblems.length;

  // ── Render ──────────────────────────────────────────────────────────
  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap');`}</style>

      <div className="min-h-screen bg-[#0a0a0f] font-['DM_Sans'] relative overflow-hidden">
        <GridBackground />

        {/* Glow */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: "radial-gradient(ellipse at 50% 0%,rgba(99,60,200,0.15) 0%,transparent 55%),radial-gradient(ellipse at 90% 80%,rgba(56,139,253,0.1) 0%,transparent 50%)"
        }} />

        <div className="relative z-10">

          {/* ── Navbar — brand LEFT, user RIGHT, both always visible ── */}
          <nav className="flex items-center justify-between px-7 py-4 border-b border-white/[0.06]"
            style={{ backdropFilter: "blur(12px)", background: "rgba(10,10,15,0.7)" }}>

            {/* Brand */}
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

            {/* ✅ User dropdown — always renders when user exists */}
            {user && <UserDropdown user={user} onLogout={handleLogout} />}
          </nav>

          {/* ── Content ── */}
          <div className="max-w-4xl mx-auto px-6 py-8">

            {/* Stats — only when user is logged in */}
            {user && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
                <StatCard num={solvedCount}                                                          label="Problems solved" />
                <StatCard num={problems.length}                                                     label="Total problems"  />
                <StatCard num={`${Math.round((solvedCount / (problems.length || 1)) * 100)}%`}     label="Completion"      />
                <StatCard num={problems.filter(p => p.difficulty === 'hard' && isSolved(p._id)).length} label="Hard solved" />
              </div>
            )}

            {/* Filters */}
            <div className="flex flex-wrap gap-2 mb-6">
              {[
                { key: "status",     options: [["all","All Problems"],    ["solved","Solved"]]                                                             },
                { key: "difficulty", options: [["all","All Difficulties"],["easy","Easy"],["medium","Medium"],["hard","Hard"]]                              },
                { key: "tag",        options: [["all","All Tags"],        ["array","Array"],["linkedList","Linked List"],["graph","Graph"],["dp","DP"]]      },
              ].map(({ key, options }) => (
                <select key={key} value={filters[key]}
                  onChange={(e) => setFilters(f => ({ ...f, [key]: e.target.value }))}
                  className="px-3 py-1.5 bg-white/[0.04] border border-white/[0.08] rounded-lg
                    text-[12px] text-white/60 outline-none cursor-pointer
                    hover:border-white/[0.15] focus:border-purple-500/50 transition-colors">
                  {options.map(([val, label]) => (
                    <option key={val} value={val} className="bg-[#1a1a2e]">{label}</option>
                  ))}
                </select>
              ))}
            </div>

            {/* Count label */}
            <p className="text-[11px] font-semibold text-white/30 uppercase tracking-widest mb-4">
              {loading ? "Loading..." : `${filtered.length} problem${filtered.length !== 1 ? "s" : ""}`}
            </p>

            {/* ✅ Loading skeleton */}
            {loading ? (
              <div className="flex flex-col gap-2">
                {[1,2,3,4,5].map(i => (
                  <div key={i} className="h-16 rounded-xl bg-white/[0.025] border border-white/[0.06]
                    animate-pulse" />
                ))}
              </div>

            ) : filtered.length === 0 ? (
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

                    {/* ✅ Right — solved or unsolved */}
                    <div className="flex items-center gap-3 shrink-0">
                      {isSolved(problem._id) ? (
                        <span className="flex items-center gap-1.5 text-[11px] text-teal-300
                          bg-teal-500/10 border border-teal-500/20 px-2.5 py-1 rounded-full">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24"
                            stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                          Solved
                        </span>
                      ) : (
                        <span className="text-[11px] text-white/15 px-2.5 py-1">
                          Unsolved
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
