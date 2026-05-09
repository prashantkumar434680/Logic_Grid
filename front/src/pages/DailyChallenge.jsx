import { useEffect, useMemo, useState } from 'react';
import { NavLink } from 'react-router';
import axiosClient from '../utils/axiosClient';

/* ─── Helpers ──────────────────────────────────────────────────────────────── */
const difficultyConfig = {
  Easy:   { label: 'Easy',   color: '#4ade80', bg: 'rgba(74,222,128,0.08)',   border: 'rgba(74,222,128,0.25)',   glow: 'rgba(74,222,128,0.15)'  },
  Medium: { label: 'Medium', color: '#fbbf24', bg: 'rgba(251,191,36,0.08)',   border: 'rgba(251,191,36,0.25)',   glow: 'rgba(251,191,36,0.15)'  },
  Hard:   { label: 'Hard',   color: '#f87171', bg: 'rgba(248,113,113,0.08)',  border: 'rgba(248,113,113,0.25)',  glow: 'rgba(248,113,113,0.15)' },
};

/* ─── Global styles ─────────────────────────────────────────────────────────── */
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Crimson+Pro:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Mono:wght@400;500&display=swap');

  .dc-wrap *, .dc-wrap *::before, .dc-wrap *::after { box-sizing: border-box; }
  .dc-wrap { font-family: 'Crimson Pro', Georgia, serif; }

  @keyframes dc-fadeUp   { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
  @keyframes dc-scaleIn  { from { opacity:0; transform:scale(0.94); }       to { opacity:1; transform:scale(1); }   }
  @keyframes dc-pulseRed { 0%,100% { box-shadow: 0 0 0 0 rgba(248,113,113,0); } 50% { box-shadow: 0 0 0 8px rgba(248,113,113,0.15); } }
  @keyframes dc-grain    { 0%,100%{transform:translate(0,0)} 10%{transform:translate(-1%,-2%)} 20%{transform:translate(2%,1%)} 30%{transform:translate(-1%,3%)} 40%{transform:translate(1%,-1%)} 50%{transform:translate(-2%,2%)} 60%{transform:translate(2%,-2%)} 70%{transform:translate(-1%,1%)} 80%{transform:translate(1%,2%)} 90%{transform:translate(-2%,-1%)} }
  @keyframes dc-tickFlip { 0%{transform:rotateX(0deg);opacity:1} 50%{transform:rotateX(-90deg);opacity:0} 51%{transform:rotateX(90deg);opacity:0} 100%{transform:rotateX(0deg);opacity:1} }
  @keyframes dc-orbSpin  { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  @keyframes dc-shimmer  { 0%{background-position:-700px 0} 100%{background-position:700px 0} }
  @keyframes dc-blink    { 0%,100%{opacity:1} 50%{opacity:0.3} }

  .dc-fade-up   { animation: dc-fadeUp 0.55s cubic-bezier(.22,1,.36,1) both; }
  .dc-scale-in  { animation: dc-scaleIn 0.4s cubic-bezier(.22,1,.36,1) both; }
  .dc-d1 { animation-delay: 0.08s; }
  .dc-d2 { animation-delay: 0.16s; }
  .dc-d3 { animation-delay: 0.24s; }
  .dc-d4 { animation-delay: 0.32s; }
  .dc-d5 { animation-delay: 0.40s; }

  .dc-shimmer-el {
    background: linear-gradient(90deg, #141c2e 25%, #1c2740 50%, #141c2e 75%);
    background-size: 700px 100%;
    animation: dc-shimmer 1.6s infinite linear;
    border-radius: 6px;
  }

  .dc-tick-flip { animation: dc-tickFlip 0.3s ease both; }
  .dc-blink     { animation: dc-blink 1s ease infinite; }
`;

/* ─── Skeleton ──────────────────────────────────────────────────────────────── */
function SkeletonLoader() {
  return (
    <div style={{ minHeight:'100vh', background:'#080d17', display:'flex', flexDirection:'column' }}>
      <style>{GLOBAL_CSS}</style>
      <div style={{ borderBottom:'1px solid rgba(255,255,255,0.05)', padding:'0 24px', height:60,
                    display:'flex', alignItems:'center', justifyContent:'space-between', maxWidth:900, margin:'0 auto', width:'100%' }}>
        <div className="dc-shimmer-el" style={{ height:18, width:160 }} />
        <div className="dc-shimmer-el" style={{ height:32, width:80, borderRadius:8 }} />
      </div>
      <div style={{ flex:1, display:'flex', justifyContent:'center', padding:'60px 16px' }}>
        <div style={{ width:'100%', maxWidth:720, display:'flex', flexDirection:'column', gap:16 }}>
          <div className="dc-shimmer-el" style={{ height:56, width:'70%' }} />
          <div style={{ display:'flex', gap:8 }}>
            <div className="dc-shimmer-el" style={{ height:22, width:64, borderRadius:99 }} />
            <div className="dc-shimmer-el" style={{ height:22, width:80, borderRadius:99 }} />
          </div>
          {[100,90,95,75].map((w,i)=>(
            <div key={i} className="dc-shimmer-el" style={{ height:14, width:w+'%' }} />
          ))}
          <div className="dc-shimmer-el" style={{ height:140, borderRadius:16, marginTop:8 }} />
        </div>
      </div>
    </div>
  );
}

/* ─── Tick (animated digit) ─────────────────────────────────────────────────── */
function Digit({ val, urgent }) {
  const [displayed, setDisplayed] = useState(val);
  const [flip, setFlip] = useState(false);

  useEffect(() => {
    if (val !== displayed) {
      setFlip(true);
      const t = setTimeout(() => { setDisplayed(val); setFlip(false); }, 300);
      return () => clearTimeout(t);
    }
  }, [val]);

  return (
    <span style={{
      display: 'inline-block',
      width: 52, height: 64,
      lineHeight: '64px',
      textAlign: 'center',
      background: urgent ? 'rgba(248,113,113,0.1)' : 'rgba(255,255,255,0.04)',
      border: `1px solid ${urgent ? 'rgba(248,113,113,0.35)' : 'rgba(255,255,255,0.08)'}`,
      borderRadius: 12,
      fontFamily: "'DM Mono', monospace",
      fontSize: 30,
      fontWeight: 500,
      color: urgent ? '#fca5a5' : '#e2e8f0',
      letterSpacing: '-1px',
      animation: flip ? 'dc-tickFlip 0.3s ease both' : 'none',
      boxShadow: urgent ? '0 0 20px rgba(248,113,113,0.12)' : 'none',
      transition: 'background 0.3s, border-color 0.3s, box-shadow 0.3s',
    }}>
      {displayed}
    </span>
  );
}

/* ─── Timer Unit ─────────────────────────────────────────────────────────────── */
function TimerUnit({ label, d1, d2, urgent }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8 }}>
      <div style={{ display:'flex', gap:4 }}>
        <Digit val={d1} urgent={urgent} />
        <Digit val={d2} urgent={urgent} />
      </div>
      <span style={{
        fontFamily:"'DM Mono',monospace", fontSize:10, letterSpacing:'0.18em',
        textTransform:'uppercase', color: urgent ? 'rgba(252,165,165,0.5)' : 'rgba(255,255,255,0.2)',
        fontWeight:500,
      }}>{label}</span>
    </div>
  );
}

/* ─── Separator ──────────────────────────────────────────────────────────────── */
function Sep({ urgent }) {
  return (
    <span style={{
      fontFamily:"'DM Mono',monospace", fontSize:28, fontWeight:500,
      color: urgent ? 'rgba(248,113,113,0.4)' : 'rgba(255,255,255,0.15)',
      paddingBottom: 22, lineHeight:1, userSelect:'none',
    }} className={urgent ? 'dc-blink' : ''}>:</span>
  );
}

/* ─── Tag Pill ───────────────────────────────────────────────────────────────── */
function TagPill({ label, color, bg, border }) {
  return (
    <span style={{
      fontFamily:"'DM Mono',monospace", fontSize:10, fontWeight:500,
      padding:'4px 12px', borderRadius:99,
      background: bg, border:`1px solid ${border}`, color,
      letterSpacing:'0.1em', textTransform:'uppercase',
    }}>{label}</span>
  );
}

/* ─── Main Component ─────────────────────────────────────────────────────────── */
export default function DailyChallenge() {
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');
  const [dailyProblem, setDailyProblem] = useState(null);
  const [expiresAt, setExpiresAt]       = useState(null);
  const [now, setNow]                   = useState(Date.now());

  useEffect(() => {
    const fetch_ = async () => {
      setLoading(true); setError('');
      try {
        const { data } = await axiosClient.get('/problem/daily');
        setDailyProblem(data.problem);
        setExpiresAt(new Date(data.expiresAt).getTime());
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load daily challenge');
      } finally { setLoading(false); }
    };
    fetch_();
  }, []);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const remainingMs = useMemo(() => expiresAt ? Math.max(expiresAt - now, 0) : 0, [expiresAt, now]);
  const isExpired = remainingMs <= 0;
  const isUrgent  = !isExpired && remainingMs < 3600000;

  const totalSec = Math.floor(remainingMs / 1000);
  const hhStr = String(Math.floor(totalSec / 3600)).padStart(2, '0');
  const mmStr = String(Math.floor((totalSec % 3600) / 60)).padStart(2, '0');
  const ssStr = String(totalSec % 60).padStart(2, '0');

  const diff = difficultyConfig[dailyProblem?.difficulty] ?? difficultyConfig.Medium;
  const tags = Array.isArray(dailyProblem?.tags)
    ? dailyProblem.tags
    : dailyProblem?.tags ? [dailyProblem.tags] : [];

  if (loading) return <SkeletonLoader />;

  return (
    <>
      <style>{GLOBAL_CSS}</style>

      <div className="dc-wrap" style={{
        minHeight: '100vh',
        background: '#080d17',
        position: 'relative',
        overflow: 'hidden',
      }}>

        {/* ── Atmospheric background ── */}
        <div style={{
          position:'absolute', inset:0, pointerEvents:'none', overflow:'hidden', zIndex:0,
        }}>
          {/* Radial top-center glow */}
          <div style={{
            position:'absolute', top:'-15%', left:'50%', transform:'translateX(-50%)',
            width:700, height:500,
            background:'radial-gradient(ellipse at center, rgba(59,130,246,0.07) 0%, transparent 65%)',
          }} />
          {/* Bottom-right warm accent */}
          <div style={{
            position:'absolute', bottom:'-10%', right:'-5%',
            width:500, height:400,
            background:'radial-gradient(ellipse at center, rgba(251,191,36,0.04) 0%, transparent 65%)',
          }} />
          {/* Rotating subtle orbit ring */}
          <div style={{
            position:'absolute', top:'50%', left:'50%',
            width:900, height:900,
            transform:'translate(-50%,-50%)',
            border:'1px solid rgba(255,255,255,0.018)',
            borderRadius:'50%',
            animation:'dc-orbSpin 80s linear infinite',
          }} />
          <div style={{
            position:'absolute', top:'50%', left:'50%',
            width:650, height:650,
            transform:'translate(-50%,-50%)',
            border:'1px solid rgba(59,130,246,0.03)',
            borderRadius:'50%',
            animation:'dc-orbSpin 50s linear infinite reverse',
          }} />
          {/* Horizontal rule lines */}
          {[...Array(8)].map((_,i)=>(
            <div key={i} style={{
              position:'absolute', left:0, right:0,
              top: `${10 + i*12}%`, height:1,
              background:'rgba(255,255,255,0.018)',
            }} />
          ))}
          {/* Vertical rule lines */}
          {[...Array(6)].map((_,i)=>(
            <div key={i} style={{
              position:'absolute', top:0, bottom:0,
              left:`${8 + i*17}%`, width:1,
              background:'rgba(255,255,255,0.012)',
            }} />
          ))}
        </div>

        {/* ── Sticky Header ── */}
        <header style={{
          position:'sticky', top:0, zIndex:50,
          borderBottom:'1px solid rgba(255,255,255,0.06)',
          backdropFilter:'blur(20px)',
          background:'rgba(8,13,23,0.82)',
        }}>
          <div style={{
            maxWidth:880, margin:'0 auto', padding:'0 24px',
            height:60, display:'flex', alignItems:'center', justifyContent:'space-between',
          }}>
            {/* Logo area */}
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <div style={{
                width:34, height:34, borderRadius:10,
                background:'linear-gradient(135deg, rgba(251,191,36,0.2), rgba(251,191,36,0.08))',
                border:'1px solid rgba(251,191,36,0.3)',
                display:'flex', alignItems:'center', justifyContent:'center', fontSize:17,
              }}>🔥</div>
              <div>
                <div style={{
                  fontFamily:"'Bebas Neue',sans-serif",
                  fontSize:18, letterSpacing:'0.12em', color:'#f1f5f9',
                  lineHeight:1,
                }}>Daily Challenge</div>
                <div style={{
                  fontFamily:"'DM Mono',monospace",
                  fontSize:9, color:'rgba(255,255,255,0.2)', letterSpacing:'0.15em',
                  marginTop:2, textTransform:'uppercase',
                }}>Code every day</div>
              </div>
            </div>

            {/* Back link */}
            <NavLink to="/" style={{
              display:'flex', alignItems:'center', gap:6,
              fontFamily:"'DM Mono',monospace", fontSize:11,
              color:'rgba(255,255,255,0.3)', textDecoration:'none', letterSpacing:'0.08em',
              transition:'color 0.15s',
              padding:'6px 12px', borderRadius:8,
              border:'1px solid rgba(255,255,255,0.06)',
              background:'rgba(255,255,255,0.02)',
            }}
            onMouseEnter={e=>{ e.currentTarget.style.color='rgba(255,255,255,0.7)'; e.currentTarget.style.borderColor='rgba(255,255,255,0.15)'; }}
            onMouseLeave={e=>{ e.currentTarget.style.color='rgba(255,255,255,0.3)'; e.currentTarget.style.borderColor='rgba(255,255,255,0.06)'; }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
              </svg>
              Back
            </NavLink>
          </div>

          {/* Accent line under header */}
          <div style={{
            height:1,
            background:'linear-gradient(90deg, transparent 0%, rgba(59,130,246,0.2) 30%, rgba(59,130,246,0.5) 50%, rgba(59,130,246,0.2) 70%, transparent 100%)',
          }} />
        </header>

        {/* ── Main Content ── */}
        <main style={{
          position:'relative', zIndex:1,
          maxWidth:780, margin:'0 auto', padding:'56px 24px 80px',
        }}>

          {/* Error state */}
          {error && (
            <div className="dc-fade-up" style={{
              display:'flex', gap:14, padding:'18px 20px', borderRadius:14,
              background:'rgba(248,113,113,0.06)', border:'1px solid rgba(248,113,113,0.2)',
              marginBottom:24,
            }}>
              <svg width={20} height={20} style={{ color:'#f87171', flexShrink:0, marginTop:1 }}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>
              </svg>
              <div>
                <p style={{ margin:0, fontWeight:600, fontSize:15, color:'#f87171' }}>Something went wrong</p>
                <p style={{ margin:'4px 0 0', fontSize:14, color:'rgba(248,113,113,0.6)' }}>{error}</p>
              </div>
            </div>
          )}

          {/* Empty state */}
          {!dailyProblem && !error && (
            <div className="dc-scale-in" style={{
              textAlign:'center', padding:'80px 20px',
              background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)',
              borderRadius:20,
            }}>
              <div style={{ fontSize:48, marginBottom:16 }}>📭</div>
              <p style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:24, letterSpacing:'0.1em', color:'rgba(255,255,255,0.4)', margin:0 }}>No challenge today</p>
              <p style={{ fontSize:15, color:'rgba(255,255,255,0.2)', marginTop:8 }}>Check back later!</p>
            </div>
          )}

          {/* ── Problem Card ── */}
          {dailyProblem && (
            <div style={{ opacity: isExpired ? 0.45 : 1, pointerEvents: isExpired ? 'none' : 'auto' }}>

              {/* ── SECTION 1 — Top label row ── */}
              <div className="dc-fade-up" style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
                {/* "Today's" label */}
                <div style={{
                  fontFamily:"'DM Mono',monospace", fontSize:10, letterSpacing:'0.2em',
                  textTransform:'uppercase', color:'rgba(255,255,255,0.22)',
                  display:'flex', alignItems:'center', gap:8,
                }}>
                  <div style={{ width:24, height:1, background:'rgba(255,255,255,0.12)' }} />
                  Today's Problem
                  <div style={{ width:24, height:1, background:'rgba(255,255,255,0.12)' }} />
                </div>
              </div>

              {/* ── SECTION 2 — Title + badges ── */}
              <div className="dc-fade-up dc-d1" style={{ marginBottom:32 }}>
                <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:16 }}>
                  <TagPill
                    label={diff.label}
                    color={diff.color}
                    bg={diff.bg}
                    border={diff.border}
                  />
                  {tags.map((tag, i) => (
                    <TagPill
                      key={i} label={tag}
                      color="rgba(148,163,184,0.8)"
                      bg="rgba(255,255,255,0.04)"
                      border="rgba(255,255,255,0.1)"
                    />
                  ))}
                </div>

                <h1 style={{
                  fontFamily:"'Bebas Neue',sans-serif",
                  fontSize: 'clamp(40px, 6vw, 64px)',
                  letterSpacing:'0.04em',
                  color:'#f1f5f9',
                  margin:0, lineHeight:0.95,
                  textShadow:`0 0 60px ${diff.glow}`,
                }}>
                  {dailyProblem.title}
                </h1>
              </div>

              {/* ── SECTION 3 — Description card ── */}
              <div className="dc-fade-up dc-d2" style={{
                background:'rgba(255,255,255,0.025)',
                border:'1px solid rgba(255,255,255,0.07)',
                borderRadius:16, padding:'28px 32px', marginBottom:20,
                position:'relative', overflow:'hidden',
              }}>
                {/* Colored left border accent */}
                <div style={{
                  position:'absolute', left:0, top:20, bottom:20, width:3,
                  borderRadius:99, background:diff.color, opacity:0.6,
                }} />

                <p style={{
                  fontFamily:"'DM Mono',monospace",
                  fontSize:10, letterSpacing:'0.18em', textTransform:'uppercase',
                  color:'rgba(255,255,255,0.2)', marginBottom:14, marginTop:0,
                }}>Problem Statement</p>

                <p style={{
                  margin:0, fontSize:17, lineHeight:1.85,
                  color:'rgba(255,255,255,0.6)', whiteSpace:'pre-wrap',
                  fontStyle:'italic', fontWeight:300,
                }}>
                  {dailyProblem.description}
                </p>
              </div>

              {/* ── SECTION 4 — Countdown ── */}
              <div className="dc-fade-up dc-d3" style={{
                background: isUrgent
                  ? 'linear-gradient(135deg, rgba(248,113,113,0.06), rgba(8,13,23,0.6))'
                  : 'rgba(255,255,255,0.022)',
                border: `1px solid ${isUrgent ? 'rgba(248,113,113,0.2)' : 'rgba(255,255,255,0.07)'}`,
                borderRadius:16, padding:'28px 32px 32px', marginBottom:20,
                transition:'all 0.4s ease',
                animation: isUrgent ? 'dc-pulseRed 2s ease infinite' : 'none',
              }}>
                {/* Timer header */}
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:28 }}>
                  <p style={{
                    fontFamily:"'DM Mono',monospace", fontSize:10,
                    letterSpacing:'0.18em', textTransform:'uppercase',
                    color:'rgba(255,255,255,0.2)', margin:0,
                  }}>
                    Time Remaining
                  </p>
                  {isUrgent && !isExpired && (
                    <span style={{
                      display:'flex', alignItems:'center', gap:6,
                      fontFamily:"'DM Mono',monospace", fontSize:10, fontWeight:500,
                      letterSpacing:'0.08em', textTransform:'uppercase',
                      color:'#fca5a5',
                      background:'rgba(248,113,113,0.1)',
                      border:'1px solid rgba(248,113,113,0.25)',
                      padding:'4px 12px', borderRadius:99,
                    }}>
                      <span style={{ width:6, height:6, borderRadius:'50%', background:'#f87171' }}
                        className="dc-blink" />
                      Expiring soon
                    </span>
                  )}
                  {isExpired && (
                    <span style={{
                      fontFamily:"'DM Mono',monospace", fontSize:10,
                      letterSpacing:'0.08em', textTransform:'uppercase',
                      color:'rgba(255,255,255,0.2)',
                      background:'rgba(255,255,255,0.04)',
                      border:'1px solid rgba(255,255,255,0.08)',
                      padding:'4px 12px', borderRadius:99,
                    }}>Expired</span>
                  )}
                </div>

                {isExpired ? (
                  <div style={{ textAlign:'center', padding:'16px 0' }}>
                    <p style={{
                      fontFamily:"'DM Mono',monospace",
                      fontSize:42, fontWeight:500,
                      letterSpacing:'0.12em', color:'rgba(255,255,255,0.1)',
                      margin:0,
                    }}>00 : 00 : 00</p>
                    <p style={{ fontSize:14, color:'rgba(255,255,255,0.25)', marginTop:12 }}>
                      A new challenge will be available soon.
                    </p>
                  </div>
                ) : (
                  <div style={{
                    display:'flex', alignItems:'center', justifyContent:'center',
                    gap:12,
                  }}>
                    <TimerUnit label="hours"   d1={hhStr[0]} d2={hhStr[1]} urgent={isUrgent} />
                    <Sep urgent={isUrgent} />
                    <TimerUnit label="minutes" d1={mmStr[0]} d2={mmStr[1]} urgent={isUrgent} />
                    <Sep urgent={isUrgent} />
                    <TimerUnit label="seconds" d1={ssStr[0]} d2={ssStr[1]} urgent={isUrgent} />
                  </div>
                )}
              </div>

              {/* ── SECTION 5 — CTA ── */}
              <div className="dc-fade-up dc-d4" style={{ display:'flex', justifyContent:'flex-end', gap:12, alignItems:'center' }}>
                <span style={{
                  fontFamily:"'DM Mono',monospace", fontSize:10,
                  color:'rgba(255,255,255,0.18)', letterSpacing:'0.12em',
                  textTransform:'uppercase',
                }}>
                  {isExpired ? 'Challenge closed' : 'Ready to solve?'}
                </span>

                <NavLink
                  to={isExpired ? '#' : `/problem/${dailyProblem._id}`}
                  onClick={(e) => { if (isExpired) e.preventDefault(); }}
                  style={{
                    display:'inline-flex', alignItems:'center', gap:10,
                    padding:'0 28px', height:48, borderRadius:12,
                    fontFamily:"'Bebas Neue',sans-serif",
                    fontSize:16, letterSpacing:'0.12em',
                    textDecoration:'none', transition:'all 0.2s ease',
                    ...(isExpired ? {
                      background:'rgba(255,255,255,0.03)',
                      border:'1px solid rgba(255,255,255,0.07)',
                      color:'rgba(255,255,255,0.2)',
                      cursor:'not-allowed',
                    } : {
                      background:'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                      border:'1px solid rgba(59,130,246,0.4)',
                      color:'#fff',
                      boxShadow:'0 0 32px rgba(59,130,246,0.25), inset 0 1px 0 rgba(255,255,255,0.1)',
                      cursor:'pointer',
                    }),
                  }}
                  onMouseEnter={e => {
                    if (!isExpired) {
                      e.currentTarget.style.background = 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)';
                      e.currentTarget.style.boxShadow  = '0 0 48px rgba(59,130,246,0.4), inset 0 1px 0 rgba(255,255,255,0.15)';
                      e.currentTarget.style.transform  = 'translateY(-2px)';
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isExpired) {
                      e.currentTarget.style.background = 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)';
                      e.currentTarget.style.boxShadow  = '0 0 32px rgba(59,130,246,0.25), inset 0 1px 0 rgba(255,255,255,0.1)';
                      e.currentTarget.style.transform  = 'translateY(0)';
                    }
                  }}
                >
                  <svg width={15} height={15} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z"/>
                  </svg>
                  Solve Challenge
                </NavLink>
              </div>

            </div>
          )}
        </main>

        {/* ── Footer strip ── */}
        <div style={{
          position:'relative', zIndex:1,
          borderTop:'1px solid rgba(255,255,255,0.04)',
          padding:'16px 24px',
          display:'flex', justifyContent:'center',
        }}>
          <span style={{
            fontFamily:"'DM Mono',monospace", fontSize:9,
            color:'rgba(255,255,255,0.12)', letterSpacing:'0.2em', textTransform:'uppercase',
          }}>Resets daily at midnight UTC</span>
        </div>

      </div>
    </>
  );
}