import { useEffect, useMemo, useState } from 'react';
import { NavLink } from 'react-router';
import axiosClient from '../utils/axiosClient';

const formatRemaining = (ms) => {
  if (ms <= 0) return '00:00:00';
  const totalSeconds = Math.floor(ms / 1000);
  const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
  const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
};

const difficultyConfig = {
  Easy:   { label: 'Easy',   color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/30' },
  Medium: { label: 'Medium', color: 'text-amber-400',   bg: 'bg-amber-400/10',   border: 'border-amber-400/30'   },
  Hard:   { label: 'Hard',   color: 'text-red-400',     bg: 'bg-red-400/10',     border: 'border-red-400/30'     },
};

/* ─── Skeleton ─────────────────────────────────────────── */
function SkeletonLoader() {
  return (
    <div className="min-h-screen bg-[#0d1117] flex flex-col">
      <style>{`
        @keyframes shimmer {
          0%   { background-position: -700px 0; }
          100% { background-position:  700px 0; }
        }
        .shimmer {
          background: linear-gradient(90deg,
            #1c2333 25%, #252d3f 50%, #1c2333 75%);
          background-size: 700px 100%;
          animation: shimmer 1.6s infinite linear;
          border-radius: 6px;
        }
      `}</style>

      {/* header */}
      <div className="border-b border-white/5 px-6 py-4 flex items-center justify-between max-w-5xl mx-auto w-full">
        <div className="shimmer h-5 w-40 rounded" />
        <div className="shimmer h-8 w-24 rounded-lg" />
      </div>

      <div className="flex-1 flex items-start justify-center py-12 px-4">
        <div className="w-full max-w-3xl space-y-4">
          {/* title row */}
          <div className="shimmer h-8 w-2/3 rounded" />
          <div className="flex gap-2">
            <div className="shimmer h-5 w-16 rounded-full" />
            <div className="shimmer h-5 w-20 rounded-full" />
          </div>
          {/* description */}
          <div className="space-y-2 pt-2">
            {[100, 90, 95, 75, 88].map((w, i) => (
              <div key={i} className={`shimmer h-3`} style={{ width: `${w}%` }} />
            ))}
          </div>
          {/* timer box */}
          <div className="shimmer h-28 w-full rounded-xl mt-4" />
          {/* button */}
          <div className="flex justify-end pt-2">
            <div className="shimmer h-11 w-44 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Timer Block ───────────────────────────────────────── */
function TimerBlock({ label, value, urgent }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={`
          relative w-16 h-16 sm:w-20 sm:h-20
          rounded-xl flex items-center justify-center
          font-mono text-2xl sm:text-3xl font-bold tracking-tight select-none
          border transition-all duration-300
          ${urgent
            ? 'bg-red-500/10 border-red-500/40 text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.15)]'
            : 'bg-[#161b27] border-white/10 text-white'
          }
        `}
      >
        {value}
        {urgent && (
          <span className="absolute inset-0 rounded-xl animate-ping opacity-10 bg-red-500 pointer-events-none" />
        )}
      </div>
      <span className="text-[10px] uppercase tracking-widest text-white/30 font-medium">{label}</span>
    </div>
  );
}

/* ─── Main Component ────────────────────────────────────── */
function DailyChallenge() {
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');
  const [dailyProblem, setDailyProblem] = useState(null);
  const [expiresAt, setExpiresAt]       = useState(null);
  const [now, setNow]                   = useState(Date.now());

  useEffect(() => {
    const fetchDaily = async () => {
      setLoading(true);
      setError('');
      try {
        const { data } = await axiosClient.get('/problem/daily');
        setDailyProblem(data.problem);
        setExpiresAt(new Date(data.expiresAt).getTime());
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load daily challenge');
      } finally {
        setLoading(false);
      }
    };
    fetchDaily();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const remainingMs = useMemo(() => {
    if (!expiresAt) return 0;
    return Math.max(expiresAt - now, 0);
  }, [expiresAt, now]);

  const isExpired = remainingMs <= 0;
  const isUrgent  = !isExpired && remainingMs < 60 * 60 * 1000; // < 1 hour

  /* parse time parts for individual blocks */
  const totalSec = Math.floor(remainingMs / 1000);
  const hh = String(Math.floor(totalSec / 3600)).padStart(2, '0');
  const mm = String(Math.floor((totalSec % 3600) / 60)).padStart(2, '0');
  const ss = String(totalSec % 60).padStart(2, '0');

  const diff = difficultyConfig[dailyProblem?.difficulty] ?? difficultyConfig.Medium;
  const tags = Array.isArray(dailyProblem?.tags)
    ? dailyProblem.tags
    : dailyProblem?.tags
      ? [dailyProblem.tags]
      : [];

  if (loading) return <SkeletonLoader />;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&family=Syne:wght@600;700;800&family=Inter:wght@400;500&display=swap');

        .dc-root       { font-family: 'Inter', sans-serif; background: #0d1117; min-height: 100vh; }
        .dc-title-font { font-family: 'Syne', sans-serif; }
        .dc-mono       { font-family: 'JetBrains Mono', monospace; }

        .glow-line {
          height: 1px;
          background: linear-gradient(90deg, transparent 0%, #3b9eff33 40%, #3b9eff66 50%, #3b9eff33 60%, transparent 100%);
        }
        .card-glass {
          background: #111827;
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 16px;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.5), 0 2px 4px -2px rgba(0,0,0,0.3);
          transition: box-shadow 0.2s;
        }
        .card-glass:hover { box-shadow: 0 8px 30px -4px rgba(0,0,0,0.6), 0 0 0 1px rgba(59,158,255,0.08); }

        .btn-solve {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 0 24px; height: 44px; border-radius: 10px;
          font-family: 'Syne', sans-serif; font-weight: 700; font-size: 0.875rem;
          letter-spacing: 0.02em;
          background: linear-gradient(135deg, #3b9eff 0%, #1d7fe0 100%);
          color: white;
          border: 1px solid rgba(59,158,255,0.3);
          box-shadow: 0 0 20px rgba(59,158,255,0.2), inset 0 1px 0 rgba(255,255,255,0.1);
          cursor: pointer; text-decoration: none;
          transition: all 0.2s ease;
        }
        .btn-solve:hover:not(.btn-solve-disabled) {
          background: linear-gradient(135deg, #5aabff 0%, #3b9eff 100%);
          box-shadow: 0 0 28px rgba(59,158,255,0.35), inset 0 1px 0 rgba(255,255,255,0.15);
          transform: translateY(-1px);
        }
        .btn-solve:active:not(.btn-solve-disabled) { transform: translateY(0); }
        .btn-solve-disabled {
          background: #1c2333 !important;
          color: rgba(255,255,255,0.25) !important;
          border-color: rgba(255,255,255,0.06) !important;
          box-shadow: none !important;
          cursor: not-allowed;
        }

        .expired-overlay { opacity: 0.45; pointer-events: none; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-up { animation: fadeUp 0.4s ease both; }
        .anim-delay-1 { animation-delay: 0.06s; }
        .anim-delay-2 { animation-delay: 0.12s; }
        .anim-delay-3 { animation-delay: 0.18s; }
        .anim-delay-4 { animation-delay: 0.24s; }
      `}</style>

      <div className="dc-root">

        {/* ── Top nav bar ── */}
        <header className="border-b border-white/5 sticky top-0 z-10 backdrop-blur-sm bg-[#0d1117]/80">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* flame icon */}
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20
                              flex items-center justify-center text-base leading-none">
                🔥
              </div>
              <span className="dc-title-font text-white font-bold text-sm tracking-wide">
                Daily Challenge
              </span>
            </div>

            <NavLink
              to="/"
              className="flex items-center gap-1.5 text-xs font-medium text-white/40
                         hover:text-white/80 transition-colors duration-150 group"
            >
              <svg className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform"
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back home
            </NavLink>
          </div>
        </header>

        <div className="glow-line" />

        {/* ── Main ── */}
        <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-5">

          {/* Error */}
          {error && (
            <div className="animate-fade-up flex items-start gap-3 p-4 rounded-xl
                            bg-red-500/10 border border-red-500/20 text-red-400">
              <svg className="w-5 h-5 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71
                     c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898
                     0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              <div>
                <p className="font-semibold text-sm">Something went wrong</p>
                <p className="text-sm text-red-400/70 mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {/* ── Problem Card ── */}
          {dailyProblem && (
            <div className={`card-glass p-6 sm:p-8 space-y-6 animate-fade-up ${isExpired ? 'expired-overlay' : ''}`}>

              {/* Header row */}
              <div className="animate-fade-up anim-delay-1 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  {/* difficulty badge */}
                  <span className={`dc-mono text-[11px] font-bold px-2.5 py-0.5 rounded-full
                                    border uppercase tracking-wider
                                    ${diff.color} ${diff.bg} ${diff.border}`}>
                    {diff.label}
                  </span>
                  {/* tags */}
                  {tags.map((tag, i) => (
                    <span key={i}
                      className="text-[11px] font-medium px-2.5 py-0.5 rounded-full
                                 bg-[#3b9eff]/10 border border-[#3b9eff]/20 text-[#3b9eff]
                                 tracking-wide">
                      {tag}
                    </span>
                  ))}
                </div>

                <h2 className="dc-title-font text-2xl sm:text-3xl font-bold text-white leading-tight">
                  {dailyProblem.title}
                </h2>
              </div>

              {/* divider */}
              <div className="h-px bg-white/5" />

              {/* Description */}
              <div className="animate-fade-up anim-delay-2">
                <p className="text-[11px] uppercase tracking-widest text-white/25 font-semibold mb-3">
                  Problem Statement
                </p>
                <p className="text-[0.92rem] leading-7 text-white/65 whitespace-pre-wrap">
                  {dailyProblem.description}
                </p>
              </div>

              {/* divider */}
              <div className="h-px bg-white/5" />

              {/* Countdown */}
              <div className="animate-fade-up anim-delay-3">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[11px] uppercase tracking-widest text-white/25 font-semibold">
                    Time Remaining
                  </p>
                  {isUrgent && !isExpired && (
                    <span className="flex items-center gap-1.5 text-[11px] font-semibold
                                     text-red-400 bg-red-400/10 border border-red-400/20
                                     px-2.5 py-0.5 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                      Expiring soon
                    </span>
                  )}
                  {isExpired && (
                    <span className="flex items-center gap-1.5 text-[11px] font-semibold
                                     text-white/30 bg-white/5 border border-white/10
                                     px-2.5 py-0.5 rounded-full">
                      Expired
                    </span>
                  )}
                </div>

                {isExpired ? (
                  <div className="rounded-xl bg-white/3 border border-white/8 p-5 text-center">
                    <p className="dc-mono text-4xl font-bold text-white/15 tracking-widest">
                      00:00:00
                    </p>
                    <p className="text-sm text-white/30 mt-2">
                      A new challenge will be available soon.
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-3 sm:gap-4
                                  bg-[#0d1117] rounded-2xl border border-white/8 py-6">
                    <TimerBlock label="hours"   value={hh} urgent={isUrgent} />
                    <span className={`dc-mono text-3xl font-bold pb-5 select-none
                                      ${isUrgent ? 'text-red-400/60' : 'text-white/20'}`}>:</span>
                    <TimerBlock label="minutes" value={mm} urgent={isUrgent} />
                    <span className={`dc-mono text-3xl font-bold pb-5 select-none
                                      ${isUrgent ? 'text-red-400/60' : 'text-white/20'}`}>:</span>
                    <TimerBlock label="seconds" value={ss} urgent={isUrgent} />
                  </div>
                )}
              </div>

              {/* CTA */}
              <div className="animate-fade-up anim-delay-4 flex justify-end pt-1">
                <NavLink
                  to={isExpired ? '#' : `/problem/${dailyProblem._id}`}
                  onClick={(e) => { if (isExpired) e.preventDefault(); }}
                  className={`btn-solve ${isExpired ? 'btn-solve-disabled' : ''}`}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25
                         0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25
                         0 003 6v12a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                  Solve Challenge
                </NavLink>
              </div>

            </div>
          )}

          {/* No problem state (no error either) */}
          {!dailyProblem && !error && (
            <div className="card-glass p-10 text-center animate-fade-up">
              <div className="text-4xl mb-3">📭</div>
              <p className="dc-title-font text-lg font-bold text-white/60">No challenge today</p>
              <p className="text-sm text-white/30 mt-1">Check back later!</p>
            </div>
          )}

        </main>
      </div>
    </>
  );
}

export default DailyChallenge;