

import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import Editor from '@monaco-editor/react';
import { useParams } from 'react-router';
import axiosClient from "../utils/axiosClient";
import ChatAi from '../components/ChatAi';
import Editorial from '../components/Editorial';
import SubmissionHistory from '../components/SubmissionHistory';
import ProblemInteraction from '../components/ProblemInteraction';

// ── helpers ──────────────────────────────────────────────────────────

const getLanguageAliases = (language) => ({
  cpp: ['C++'], java: ['Java'], javascript: ['JavaScript', 'Javascript'],
}[language] || []);

const getInitialCode = (startCode = [], language) => {
  const aliases = getLanguageAliases(language);
  return startCode.find(sc => aliases.includes(sc.language))?.initialCode || '';
};

const getLanguageForMonaco = (lang) =>
  ({ javascript: 'javascript', java: 'java', cpp: 'cpp' }[lang] || 'javascript');

const DIFF_META = {
  easy:   { color: '#4ade80', bg: 'rgba(74,222,128,0.1)',   border: 'rgba(74,222,128,0.25)'  },
  medium: { color: '#fb923c', bg: 'rgba(251,146,60,0.1)',   border: 'rgba(251,146,60,0.25)'  },
  hard:   { color: '#f87171', bg: 'rgba(248,113,113,0.1)',  border: 'rgba(248,113,113,0.25)' },
};

const LANG_LABELS = { javascript: 'JavaScript', java: 'Java', cpp: 'C++' };
const LANG_DOT    = { javascript: '#f7df1e',    java: '#f89820', cpp: '#659ad2' };

// ── sub-components ───────────────────────────────────────────────────

function TabBar({ tabs, active, onChange, size = 'md' }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      background: 'rgba(255,255,255,0.015)',
      paddingLeft: size === 'sm' ? '12px' : '16px',
      flexShrink: 0,
    }}>
      {tabs.map(({ id, label, icon }) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          style={{
            position: 'relative',
            padding: size === 'sm' ? '8px 14px' : '10px 18px',
            fontSize: size === 'sm' ? '12px' : '13px',
            fontWeight: active === id ? '600' : '400',
            color: active === id ? '#f1f5f9' : 'rgba(255,255,255,0.35)',
            background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: "'DM Sans', sans-serif",
            transition: 'color 0.15s',
            display: 'flex', alignItems: 'center', gap: '6px',
            whiteSpace: 'nowrap',
          }}
        >
          {icon && <span style={{ fontSize: '13px' }}>{icon}</span>}
          {label}
          {active === id && (
            <span style={{
              position: 'absolute', bottom: 0, left: '8px', right: '8px', height: '2px',
              background: 'linear-gradient(90deg, #7c3aed, #3b82f6)',
              borderRadius: '2px 2px 0 0',
            }} />
          )}
        </button>
      ))}
    </div>
  );
}

function DiffBadge({ difficulty }) {
  const m = DIFF_META[difficulty?.toLowerCase()] || { color: '#9ca3af', bg: 'rgba(156,163,175,0.1)', border: 'rgba(156,163,175,0.2)' };
  return (
    <span style={{
      fontSize: '11px', fontWeight: '700', padding: '3px 10px', borderRadius: '99px',
      background: m.bg, color: m.color, border: `1px solid ${m.border}`,
      letterSpacing: '0.04em', textTransform: 'capitalize',
    }}>
      {difficulty}
    </span>
  );
}

function TagChip({ tag }) {
  return (
    <span style={{
      fontSize: '11px', fontWeight: '600', padding: '3px 10px', borderRadius: '99px',
      background: 'rgba(139,92,246,0.12)', color: '#a78bfa',
      border: '1px solid rgba(139,92,246,0.25)',
    }}>
      {tag}
    </span>
  );
}

function TestCaseBlock({ tc, index, passed }) {
  const [open, setOpen] = useState(index === 0);
  return (
    <div style={{
      borderRadius: '10px', border: `1px solid ${passed ? 'rgba(74,222,128,0.2)' : 'rgba(248,113,113,0.2)'}`,
      background: passed ? 'rgba(74,222,128,0.04)' : 'rgba(248,113,113,0.04)',
      overflow: 'hidden', marginBottom: '8px',
    }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 14px', background: 'none', border: 'none', cursor: 'pointer',
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: '600', color: passed ? '#4ade80' : '#f87171' }}>
          <span>{passed ? '✓' : '✗'}</span> Case {index + 1}
        </span>
        <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px' }}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div style={{ padding: '0 14px 14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[['Input', tc.stdin], ['Expected', tc.expected_output], ['Output', tc.stdout]].map(([lbl, val]) => (
            <div key={lbl}>
              <span style={{ fontSize: '10px', fontWeight: '700', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{lbl}</span>
              <pre style={{
                margin: '4px 0 0', padding: '8px 12px', borderRadius: '7px',
                background: 'rgba(0,0,0,0.25)', color: '#e2e8f0',
                fontSize: '12px', fontFamily: "'JetBrains Mono', monospace",
                whiteSpace: 'pre-wrap', wordBreak: 'break-all', lineHeight: '1.5',
              }}>{val}</pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── main ─────────────────────────────────────────────────────────────

const ProblemPage = () => {
  const [problem,          setProblem]          = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState('javascript');
  const [code,             setCode]             = useState('');
  const [loading,          setLoading]          = useState(false);
  const [runResult,        setRunResult]        = useState(null);
  const [submitResult,     setSubmitResult]     = useState(null);
  const [activeLeftTab,    setActiveLeftTab]    = useState('description');
  const [activeRightTab,   setActiveRightTab]   = useState('code');
  const [videoData,        setVideoData]        = useState(null);
  const [panelWidth,       setPanelWidth]       = useState(50);          // left % width
  const isDragging = useRef(false);
  const editorRef = useRef(null);
  const { problemId } = useParams();
  const { handleSubmit } = useForm();

  // ── fetch ──────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchProblem = async () => {
      setLoading(true);
      try {
        const res = await axiosClient.get(`/problem/problemById/${problemId}`);
        setProblem(res.data);
        setCode(getInitialCode(res.data.startCode, selectedLanguage));
        try {
          const vr = await axiosClient.get(`/video/problem/${problemId}`);
          setVideoData(vr.data);
        } catch { setVideoData(null); }
      } catch { /* silent */ }
      setLoading(false);
    };
    fetchProblem();
  }, [problemId]);

  useEffect(() => {
    if (!problem) return;
    setCode(getInitialCode(problem.startCode, selectedLanguage));
  }, [selectedLanguage, problem]);

  // ── drag-resize ────────────────────────────────────────────────────
  const startDrag = (e) => {
    isDragging.current = true;
    e.preventDefault();
  };
  useEffect(() => {
    const onMove = (e) => {
      if (!isDragging.current) return;
      const pct = (e.clientX / window.innerWidth) * 100;
      setPanelWidth(Math.min(75, Math.max(25, pct)));
    };
    const onUp = () => { isDragging.current = false; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, []);

  // ── handlers ──────────────────────────────────────────────────────
  const handleRun = async () => {
    setLoading(true); setRunResult(null);
    try {
      const res = await axiosClient.post(`/submission/run/${problemId}`, { code, language: selectedLanguage });
      setRunResult(res.data);
    } catch (err) {
      setRunResult({ success: false, error: err.response?.data?.message || err.message, testCases: [] });
    } finally { setLoading(false); setActiveRightTab('testcase'); }
  };

  const handleSubmitCode = async () => {
    setLoading(true); setSubmitResult(null);
    try {
      const res = await axiosClient.post(`/submission/submit/${problemId}`, { code, language: selectedLanguage });
      setSubmitResult(res.data);
    } catch (err) {
      setSubmitResult({ accepted: false, error: err.response?.data?.message || err.message, passedTestCases: 0, totalTestCases: 0 });
    } finally { setLoading(false); setActiveRightTab('result'); }
  };

  // ── loading ───────────────────────────────────────────────────────
  if (loading && !problem) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', background: '#09090f', flexDirection: 'column', gap: '16px',
      }}>
        <div style={{
          width: '40px', height: '40px', borderRadius: '50%',
          border: '3px solid rgba(139,92,246,0.2)',
          borderTopColor: '#7c3aed',
          animation: 'spin 0.8s linear infinite',
        }} />
        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px', fontFamily: "'DM Sans', sans-serif" }}>Loading problem…</p>
      </div>
    );
  }

  const leftTabs  = [
    { id: 'description', label: 'Description', icon: '📋' },
    { id: 'editorial',   label: 'Editorial',   icon: '🎬' },
    { id: 'solutions',   label: 'Solutions',   icon: '💡' },
    { id: 'submissions', label: 'Submissions', icon: '📂' },
    { id: 'ChatAI',      label: 'AI Help',     icon: '✨' },
  ];
  const rightTabs = [
    { id: 'code',     label: 'Code',     icon: '⌨️' },
    { id: 'testcase', label: 'Console',  icon: '🧪' },
    { id: 'result',   label: 'Result',   icon: '📊' },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulse { 0%,100%{opacity:.4} 50%{opacity:.8} }
        .fade-in { animation: fadeIn 0.25s ease forwards; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
        .lang-btn:hover { background: rgba(255,255,255,0.06) !important; }
        .action-btn:hover { opacity: 0.85; }
        .example-card { transition: border-color 0.15s; }
        .example-card:hover { border-color: rgba(139,92,246,0.3) !important; }
        .solution-block { transition: border-color 0.15s; }
        .solution-block:hover { border-color: rgba(139,92,246,0.25) !important; }
      `}</style>

      <div style={{
        height: '100vh', display: 'flex', flexDirection: 'column',
        background: '#09090f', fontFamily: "'DM Sans', sans-serif",
        color: '#f1f5f9', overflow: 'hidden',
      }}>

        {/* ── Top bar ── */}
        <header style={{
          height: '48px', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 16px', borderBottom: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(255,255,255,0.015)', backdropFilter: 'blur(8px)',
        }}>
          {/* Left: logo + breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '26px', height: '26px', borderRadius: '6px',
              background: 'linear-gradient(135deg,#7c3aed,#3b82f6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
                <path d="M4 4h4v4H4zm6 0h4v4h-4zm6 0h4v4h-4zM4 10h4v4H4zm6 0h4v4h-4zm6 0h4v4h-4zM4 16h4v4H4zm6 0h4v4h-4zm6 0h4v4h-4z" />
              </svg>
            </div>
            <span style={{ fontFamily: "'Instrument Serif', serif", fontSize: '15px', color: 'rgba(255,255,255,0.6)' }}>LogicGrid</span>
            <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: '13px' }}>/</span>
            {problem && (
              <span style={{ fontSize: '13px', fontWeight: '500', color: 'rgba(255,255,255,0.75)' }}>
                {problem.title}
              </span>
            )}
          </div>

          {/* Right: diff badge + lang indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {problem && <DiffBadge difficulty={problem.difficulty} />}
            <span style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              fontSize: '12px', color: 'rgba(255,255,255,0.4)',
              padding: '4px 10px', borderRadius: '6px',
              border: '1px solid rgba(255,255,255,0.07)',
              background: 'rgba(255,255,255,0.03)',
            }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: LANG_DOT[selectedLanguage] }} />
              {LANG_LABELS[selectedLanguage]}
            </span>
          </div>
        </header>

        {/* ── Body ── */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

          {/* ── Left Panel ── */}
          <div style={{ width: `${panelWidth}%`, display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0 }}>
            <TabBar tabs={leftTabs} active={activeLeftTab} onChange={setActiveLeftTab} />

            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }} className="fade-in">
              {problem && (
                <>
                  {/* ── Description ── */}
                  {activeLeftTab === 'description' && (
                    <div>
                      <div style={{ marginBottom: '24px' }}>
                        <h1 style={{
                          fontFamily: "'Instrument Serif', serif", fontSize: '26px',
                          fontWeight: '400', margin: '0 0 12px', color: '#f1f5f9', lineHeight: 1.2,
                        }}>
                          {problem.title}
                        </h1>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                          <DiffBadge difficulty={problem.difficulty} />
                          {problem.tags && <TagChip tag={problem.tags} />}
                        </div>
                      </div>

                      <div style={{
                        fontSize: '14px', lineHeight: '1.75', color: 'rgba(255,255,255,0.7)',
                        whiteSpace: 'pre-wrap', marginBottom: '28px',
                      }}>
                        {problem.description}
                      </div>

                      <h3 style={{ fontSize: '13px', fontWeight: '700', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.07em', textTransform: 'uppercase', margin: '0 0 14px' }}>
                        Examples
                      </h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '28px' }}>
                        {problem.visibleTestCases.map((ex, i) => (
                          <div key={i} className="example-card" style={{
                            borderRadius: '12px', border: '1px solid rgba(255,255,255,0.07)',
                            background: 'rgba(255,255,255,0.025)', overflow: 'hidden',
                          }}>
                            <div style={{
                              padding: '8px 14px', borderBottom: '1px solid rgba(255,255,255,0.05)',
                              background: 'rgba(255,255,255,0.03)',
                              fontSize: '11px', fontWeight: '700', color: 'rgba(255,255,255,0.35)',
                              letterSpacing: '0.07em', textTransform: 'uppercase',
                            }}>
                              Example {i + 1}
                            </div>
                            <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              {[['Input', ex.input], ['Output', ex.output]].map(([lbl, val]) => (
                                <div key={lbl} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                                  <span style={{ fontSize: '12px', fontWeight: '700', color: 'rgba(255,255,255,0.35)', width: '56px', flexShrink: 0, paddingTop: '2px' }}>{lbl}</span>
                                  <code style={{
                                    fontSize: '12px', fontFamily: "'JetBrains Mono', monospace",
                                    color: '#e2e8f0', background: 'rgba(0,0,0,0.2)',
                                    padding: '3px 8px', borderRadius: '6px', wordBreak: 'break-all',
                                  }}>{val}</code>
                                </div>
                              ))}
                              {ex.explanation && (
                                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '8px', marginTop: '2px' }}>
                                  {ex.explanation}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      <ProblemInteraction problemId={problemId} />
                    </div>
                  )}

                  {/* ── Editorial ── */}
                  {activeLeftTab === 'editorial' && (
                    <div>
                      <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: '22px', margin: '0 0 20px' }}>Editorial</h2>
                      {videoData ? (
                        <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)' }}>
                          <Editorial secureUrl={videoData.secureUrl} thumbnailUrl={videoData.thumbnailUrl} duration={videoData.duration} />
                          {videoData.uploadedBy && (
                            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', marginTop: '16px' }}>
                              Uploaded by {videoData.uploadedBy} on {new Date(videoData.uploadedAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      ) : (
                        <div style={{ textAlign: 'center', padding: '60px 0' }}>
                          <div style={{ fontSize: '40px', marginBottom: '12px' }}>🎬</div>
                          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '14px', margin: '0 0 6px' }}>No video editorial available yet</p>
                          <p style={{ color: 'rgba(255,255,255,0.18)', fontSize: '12px', margin: 0 }}>Check back later for video solutions and explanations</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── Solutions ── */}
                  {activeLeftTab === 'solutions' && (
                    <div>
                      <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: '22px', margin: '0 0 20px' }}>Reference Solutions</h2>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {problem.referenceSolution?.map((sol, i) => (
                          <div key={i} className="solution-block" style={{
                            borderRadius: '12px', border: '1px solid rgba(255,255,255,0.07)',
                            background: 'rgba(255,255,255,0.02)', overflow: 'hidden',
                          }}>
                            <div style={{
                              display: 'flex', alignItems: 'center', gap: '10px',
                              padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)',
                              background: 'rgba(255,255,255,0.03)',
                            }}>
                              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: LANG_DOT[sol.language?.toLowerCase()] || '#9ca3af' }} />
                              <span style={{ fontSize: '13px', fontWeight: '600', color: 'rgba(255,255,255,0.7)' }}>{sol.language}</span>
                            </div>
                            <pre style={{
                              margin: 0, padding: '16px', overflowX: 'auto',
                              fontSize: '12px', fontFamily: "'JetBrains Mono', monospace",
                              color: '#e2e8f0', lineHeight: '1.65', background: 'rgba(0,0,0,0.2)',
                            }}>
                              <code>{sol.completeCode}</code>
                            </pre>
                          </div>
                        )) || (
                          <div style={{ textAlign: 'center', padding: '48px 0', color: 'rgba(255,255,255,0.25)', fontSize: '13px' }}>
                            Solutions available after solving the problem.
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* ── Submissions ── */}
                  {activeLeftTab === 'submissions' && (
                    <div>
                      <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: '22px', margin: '0 0 20px' }}>My Submissions</h2>
                      <SubmissionHistory problemId={problemId} />
                    </div>
                  )}

                  {/* ── AI Help ── */}
                  {activeLeftTab === 'ChatAI' && (
                    <div>
                      <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: '22px', margin: '0 0 20px' }}>✨ AI Assistant</h2>
                      <ChatAi problem={problem} />
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* ── Resize handle ── */}
          <div
            onMouseDown={startDrag}
            style={{
              width: '4px', flexShrink: 0, cursor: 'col-resize',
              background: 'rgba(255,255,255,0.04)',
              position: 'relative', zIndex: 10,
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(139,92,246,0.4)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
          />

          {/* ── Right Panel ── */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
            <TabBar tabs={rightTabs} active={activeRightTab} onChange={setActiveRightTab} />

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

              {/* Code tab */}
              {activeRightTab === 'code' && (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

                  {/* Language selector */}
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '8px 14px', borderBottom: '1px solid rgba(255,255,255,0.05)',
                    background: 'rgba(255,255,255,0.01)', flexShrink: 0,
                  }}>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {['javascript', 'java', 'cpp'].map(lang => (
                        <button
                          key={lang}
                          className="lang-btn"
                          onClick={() => setSelectedLanguage(lang)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '6px',
                            padding: '5px 12px', borderRadius: '7px', border: 'none', cursor: 'pointer',
                            fontSize: '12px', fontWeight: selectedLanguage === lang ? '600' : '400',
                            fontFamily: "'DM Sans', sans-serif",
                            background: selectedLanguage === lang ? 'rgba(255,255,255,0.07)' : 'transparent',
                            color: selectedLanguage === lang ? '#f1f5f9' : 'rgba(255,255,255,0.4)',
                            transition: 'all 0.15s',
                          }}
                        >
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: LANG_DOT[lang], opacity: selectedLanguage === lang ? 1 : 0.4 }} />
                          {LANG_LABELS[lang]}
                        </button>
                      ))}
                    </div>

                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        onClick={() => setActiveRightTab('testcase')}
                        style={{
                          padding: '5px 12px', borderRadius: '7px', fontSize: '12px', fontWeight: '500',
                          border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)',
                          color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                        }}
                      >
                        Console
                      </button>
                    </div>
                  </div>

                  {/* Monaco */}
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <Editor
                      height="100%"
                      language={getLanguageForMonaco(selectedLanguage)}
                      value={code}
                      onChange={(v) => setCode(v || '')}
                      onMount={(editor) => { editorRef.current = editor; }}
                      theme="vs-dark"
                      options={{
                        fontSize: 13,
                        fontFamily: "'JetBrains Mono', monospace",
                        fontLigatures: true,
                        minimap: { enabled: false },
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                        tabSize: 2,
                        insertSpaces: true,
                        wordWrap: 'on',
                        lineNumbers: 'on',
                        glyphMargin: false,
                        folding: true,
                        lineDecorationsWidth: 6,
                        lineNumbersMinChars: 3,
                        renderLineHighlight: 'line',
                        padding: { top: 12, bottom: 12 },
                        scrollbar: { verticalScrollbarSize: 4, horizontalScrollbarSize: 4 },
                        overviewRulerBorder: false,
                        hideCursorInOverviewRuler: true,
                        renderLineHighlightOnlyWhenFocus: true,
                      }}
                    />
                  </div>

                  {/* Run / Submit */}
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
                    gap: '8px', padding: '10px 14px',
                    borderTop: '1px solid rgba(255,255,255,0.05)',
                    background: 'rgba(255,255,255,0.01)', flexShrink: 0,
                  }}>
                    {loading && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginRight: 'auto' }}>
                        <div style={{
                          width: '14px', height: '14px', borderRadius: '50%',
                          border: '2px solid rgba(139,92,246,0.3)', borderTopColor: '#7c3aed',
                          animation: 'spin 0.7s linear infinite',
                        }} />
                        <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>Running…</span>
                      </div>
                    )}

                    <button
                      className="action-btn"
                      onClick={handleRun}
                      disabled={loading}
                      style={{
                        padding: '8px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: '600',
                        border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.06)',
                        color: loading ? 'rgba(255,255,255,0.3)' : '#f1f5f9', cursor: loading ? 'not-allowed' : 'pointer',
                        fontFamily: "'DM Sans', sans-serif", transition: 'opacity 0.15s',
                      }}
                    >
                      ▶ Run
                    </button>

                    <button
                      className="action-btn"
                      onClick={handleSubmitCode}
                      disabled={loading}
                      style={{
                        padding: '8px 22px', borderRadius: '8px', fontSize: '13px', fontWeight: '700',
                        border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                        background: loading ? 'rgba(124,58,237,0.4)' : 'linear-gradient(135deg,#7c3aed,#3b82f6)',
                        color: '#fff', fontFamily: "'DM Sans', sans-serif",
                        boxShadow: loading ? 'none' : '0 0 16px rgba(124,58,237,0.3)',
                        transition: 'opacity 0.15s, box-shadow 0.15s',
                      }}
                    >
                      Submit
                    </button>
                  </div>
                </div>
              )}

              {/* Testcase tab */}
              {activeRightTab === 'testcase' && (
                <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }} className="fade-in">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: 'rgba(255,255,255,0.7)' }}>Test Results</h3>
                    {runResult && (
                      <span style={{
                        fontSize: '12px', fontWeight: '700', padding: '3px 10px', borderRadius: '99px',
                        background: runResult.success ? 'rgba(74,222,128,0.1)' : 'rgba(248,113,113,0.1)',
                        color: runResult.success ? '#4ade80' : '#f87171',
                        border: `1px solid ${runResult.success ? 'rgba(74,222,128,0.2)' : 'rgba(248,113,113,0.2)'}`,
                      }}>
                        {runResult.success ? `✓ All passed` : `✗ ${runResult.error || 'Failed'}`}
                      </span>
                    )}
                  </div>

                  {runResult ? (
                    <>
                      {runResult.success && (
                        <div style={{
                          display: 'flex', gap: '12px', marginBottom: '16px',
                        }}>
                          {[['Runtime', `${runResult.runtime}s`], ['Memory', `${runResult.memory} KB`]].map(([k, v]) => (
                            <div key={k} style={{
                              padding: '10px 16px', borderRadius: '10px',
                              border: '1px solid rgba(74,222,128,0.15)',
                              background: 'rgba(74,222,128,0.05)',
                              flex: 1,
                            }}>
                              <p style={{ margin: '0 0 4px', fontSize: '11px', color: 'rgba(255,255,255,0.3)', fontWeight: '700', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{k}</p>
                              <p style={{ margin: 0, fontSize: '18px', fontFamily: "'JetBrains Mono', monospace", color: '#4ade80', fontWeight: '500' }}>{v}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      <div>
                        {(runResult.testCases || []).map((tc, i) => (
                          <TestCaseBlock key={i} tc={tc} index={i} passed={tc.status_id === 3 || runResult.success} />
                        ))}
                      </div>
                    </>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '64px 0' }}>
                      <div style={{ fontSize: '40px', marginBottom: '12px' }}>🧪</div>
                      <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '13px', margin: 0 }}>Click <strong style={{ color: 'rgba(255,255,255,0.4)' }}>Run</strong> to test against example cases</p>
                    </div>
                  )}
                </div>
              )}

              {/* Result tab */}
              {activeRightTab === 'result' && (
                <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }} className="fade-in">
                  <h3 style={{ margin: '0 0 20px', fontSize: '14px', fontWeight: '700', color: 'rgba(255,255,255,0.7)' }}>Submission Result</h3>

                  {submitResult ? (
                    <div>
                      {/* Status hero */}
                      <div style={{
                        borderRadius: '14px', padding: '24px',
                        border: `1px solid ${submitResult.accepted ? 'rgba(74,222,128,0.2)' : 'rgba(248,113,113,0.2)'}`,
                        background: submitResult.accepted ? 'rgba(74,222,128,0.05)' : 'rgba(248,113,113,0.05)',
                        marginBottom: '16px', textAlign: 'center',
                      }}>
                        <div style={{ fontSize: '40px', marginBottom: '10px' }}>{submitResult.accepted ? '🎉' : '💔'}</div>
                        <h2 style={{
                          fontFamily: "'Instrument Serif', serif", fontSize: '28px', margin: '0 0 8px',
                          color: submitResult.accepted ? '#4ade80' : '#f87171',
                        }}>
                          {submitResult.accepted ? 'Accepted' : (submitResult.error || 'Wrong Answer')}
                        </h2>
                        <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>
                          {submitResult.passedTestCases}/{submitResult.totalTestCases} test cases passed
                        </p>
                      </div>

                      {/* Metrics */}
                      {submitResult.accepted && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                          {[['Runtime', `${submitResult.runtime}s`], ['Memory', `${submitResult.memory} KB`]].map(([k, v]) => (
                            <div key={k} style={{
                              padding: '14px 18px', borderRadius: '10px',
                              border: '1px solid rgba(255,255,255,0.06)',
                              background: 'rgba(255,255,255,0.025)',
                            }}>
                              <p style={{ margin: '0 0 4px', fontSize: '11px', color: 'rgba(255,255,255,0.3)', fontWeight: '700', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{k}</p>
                              <p style={{ margin: 0, fontSize: '20px', fontFamily: "'JetBrains Mono', monospace", color: '#f1f5f9', fontWeight: '500' }}>{v}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '64px 0' }}>
                      <div style={{ fontSize: '40px', marginBottom: '12px' }}>📊</div>
                      <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '13px', margin: 0 }}>Click <strong style={{ color: 'rgba(255,255,255,0.4)' }}>Submit</strong> to evaluate your solution</p>
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>

        </div>
      </div>
    </>
  );
};

export default ProblemPage;