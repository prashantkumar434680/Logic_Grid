import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate, NavLink } from "react-router";
import Editor from "@monaco-editor/react";
import axiosClient from "../../utils/axiosClient";

const LANG_MONACO = { javascript: 'javascript', python: 'python', cpp: 'cpp', java: 'java' };

const DIFF_COLOR = {
  easy: { bg: 'rgba(134,239,172,0.1)', border: 'rgba(134,239,172,0.3)', text: '#86efac' },
  medium: { bg: 'rgba(251,191,36,0.1)', border: 'rgba(251,191,36,0.3)', text: '#fbbf24' },
  hard: { bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.3)', text: '#f87171' },
};

function formatMsg(text) {
  if (!text) return '';
  return text
    .replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) =>
      `<pre style="background:rgba(255,255,255,0.05);border-radius:8px;padding:12px;overflow-x:auto;font-size:12px;margin:8px 0;"><code>${code.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</code></pre>`)
    .replace(/`([^`]+)`/g, '<code style="background:rgba(255,255,255,0.08);padding:2px 6px;border-radius:4px;font-size:12px;">$1</code>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br/>');
}

function Timer({ seconds }) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  const critical = seconds < 300;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '6px',
      padding: '6px 14px', borderRadius: '8px',
      background: critical ? 'rgba(248,113,113,0.15)' : 'rgba(255,255,255,0.05)',
      border: `1px solid ${critical ? 'rgba(248,113,113,0.4)' : 'rgba(255,255,255,0.1)'}`,
      color: critical ? '#f87171' : '#94a3b8', fontWeight: '700', fontSize: '15px',
      fontFamily: 'monospace',
    }}>
      ⏱ {String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}
    </div>
  );
}

export default function InterviewWorkspace() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Code editor
  const [code, setCode] = useState('');

  // Timer
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef(null);

  // Execution
  const [runResult, setRunResult] = useState(null);
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState(null);

  // Chat
  const [chatInput, setChatInput] = useState('');
  const [chatSending, setChatSending] = useState(false);
  const [conversation, setConversation] = useState([]);
  const chatEndRef = useRef(null);

  // UI
  const [completing, setCompleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [nextLoading, setNextLoading] = useState(false);

  const currentProblem = session?.problems?.[session.currentProblemIndex];

  const fetchSession = useCallback(async () => {
    try {
      const res = await axiosClient.get(`/interview/session/${sessionId}`);
      const s = res.data.session;
      setSession(s);
      setTimeLeft(res.data.timeRemainingSeconds ?? 0);
      setConversation(s.conversation || []);
      // Restore code
      const prob = s.problems?.[s.currentProblemIndex];
      if (prob?.code) setCode(prob.code);
      else setCode('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load session');
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => { fetchSession(); }, [fetchSession]);

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation]);

  // Countdown timer
  useEffect(() => {
    if (!session || session.status !== 'in_progress') return;
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleComplete(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [session?.status]);

  const handleRunCode = async () => {
    setRunning(true);
    setRunResult(null);
    setSubmitResult(null);
    try {
      const res = await axiosClient.post(`/interview/session/${sessionId}/run`, {
        code,
        problemIndex: session.currentProblemIndex,
      });
      setRunResult(res.data);
      if (res.data.interviewerResponse) {
        setConversation(prev => [...prev, {
          role: 'interviewer',
          content: res.data.interviewerResponse,
          timestamp: new Date().toISOString(),
        }]);
      }
    } catch (err) {
      setRunResult({ error: err.response?.data?.message || 'Execution failed' });
    } finally {
      setRunning(false);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setRunResult(null);
    setSubmitResult(null);
    try {
      const res = await axiosClient.post(`/interview/session/${sessionId}/submit`, {
        code,
        problemIndex: session.currentProblemIndex,
      });
      setSubmitResult(res.data);
      if (res.data.interviewerResponse) {
        setConversation(prev => [...prev, {
          role: 'interviewer',
          content: res.data.interviewerResponse,
          timestamp: new Date().toISOString(),
        }]);
      }
      // Refresh session to update problem status
      const refreshed = await axiosClient.get(`/interview/session/${sessionId}`);
      setSession(refreshed.data.session);
    } catch (err) {
      setSubmitResult({ error: err.response?.data?.message || 'Submission failed' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || chatSending) return;
    const msg = chatInput.trim();
    setChatInput('');
    setConversation(prev => [...prev, { role: 'candidate', content: msg, timestamp: new Date().toISOString() }]);
    setChatSending(true);
    try {
      const res = await axiosClient.post(`/interview/session/${sessionId}/respond`, { message: msg });
      if (res.data.response) {
        setConversation(prev => [...prev, {
          role: 'interviewer',
          content: res.data.response,
          timestamp: new Date().toISOString(),
        }]);
      }
    } catch (err) {
      setConversation(prev => [...prev, {
        role: 'system',
        content: 'Failed to get interviewer response. Please try again.',
        timestamp: new Date().toISOString(),
      }]);
    } finally {
      setChatSending(false);
    }
  };

  const handleNextProblem = async () => {
    setNextLoading(true);
    try {
      await axiosClient.post(`/interview/session/${sessionId}/next`);
      const res = await axiosClient.get(`/interview/session/${sessionId}`);
      const s = res.data.session;
      setSession(s);
      setCode(s.problems?.[s.currentProblemIndex]?.code || '');
      setRunResult(null);
      setSubmitResult(null);
      setConversation(s.conversation || []);
    } catch (err) {
      alert(err.response?.data?.message || 'Could not advance to next problem');
    } finally {
      setNextLoading(false);
    }
  };

  const handleComplete = async (auto = false) => {
    if (!auto) setShowConfirm(false);
    clearInterval(timerRef.current);
    setCompleting(true);
    try {
      await axiosClient.post(`/interview/session/${sessionId}/complete`);
      navigate(`/interview-arena/results/${sessionId}`);
    } catch (err) {
      // If already completed
      navigate(`/interview-arena/results/${sessionId}`);
    } finally {
      setCompleting(false);
    }
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#09090f', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ textAlign: 'center', color: '#94a3b8' }}>
        <span className="loading loading-spinner loading-lg"></span>
        <div style={{ marginTop: '16px' }}>Loading your interview session...</div>
      </div>
    </div>
  );

  if (error) return (
    <div style={{ minHeight: '100vh', background: '#09090f', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ textAlign: 'center', color: '#f87171', maxWidth: '400px' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
        <div style={{ fontSize: '16px', marginBottom: '16px' }}>{error}</div>
        <NavLink to="/interview-arena" style={{ color: '#a78bfa', textDecoration: 'none' }}>← Back to Interview Arena</NavLink>
      </div>
    </div>
  );

  if (!session) return null;

  const diffC = DIFF_COLOR[currentProblem?.difficulty] || DIFF_COLOR.medium;
  const isLastProblem = session.currentProblemIndex >= (session.problems?.length ?? 1) - 1;
  const currentStatus = session.problems?.[session.currentProblemIndex]?.status;
  const canAdvance = !isLastProblem && (currentStatus === 'solved' || currentStatus === 'failed');

  return (
    <div style={{
      height: '100vh', display: 'flex', flexDirection: 'column',
      background: '#09090f', fontFamily: "'DM Sans', sans-serif", color: '#f1f5f9',
      overflow: 'hidden',
    }}>
      {/* Top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(9,9,15,0.98)', flexShrink: 0, gap: '12px', flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <NavLink to="/interview-arena" style={{ color: '#64748b', fontSize: '18px', textDecoration: 'none' }}>←</NavLink>
          <span style={{
            fontSize: '11px', fontWeight: '700', padding: '3px 10px', borderRadius: '99px',
            background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.3)', color: '#c4b5fd',
          }}>
            {session.mode === 'guided' ? '🟢 Guided' : '🔴 Strict Mock'}
          </span>
          <span style={{ fontSize: '12px', color: '#64748b' }}>
            Problem {(session.currentProblemIndex ?? 0) + 1} / {session.problems?.length ?? 1}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Timer seconds={timeLeft} />
          {canAdvance && (
            <button onClick={handleNextProblem} disabled={nextLoading} style={{
              padding: '7px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '600',
              background: 'rgba(96,165,250,0.15)', border: '1px solid rgba(96,165,250,0.4)',
              color: '#93c5fd', cursor: 'pointer',
            }}>
              {nextLoading ? '...' : 'Next Problem →'}
            </button>
          )}
          <button onClick={() => setShowConfirm(true)} disabled={completing} style={{
            padding: '7px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '700',
            background: 'linear-gradient(135deg, #7c3aed, #3b82f6)',
            border: 'none', color: '#fff', cursor: 'pointer',
          }}>
            {completing ? 'Finishing...' : 'End Interview'}
          </button>
        </div>
      </div>

      {/* Main 3-panel layout */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* LEFT: Problem panel */}
        <div style={{
          width: '36%', minWidth: '280px', borderRight: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}>
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
            {currentProblem ? (
              <>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
                  <h2 style={{ fontSize: '17px', fontWeight: '700', color: '#e2e8f0', margin: 0, flex: 1 }}>
                    {currentProblem.title}
                  </h2>
                  <span style={{
                    padding: '3px 10px', borderRadius: '99px', fontSize: '11px', fontWeight: '600',
                    background: diffC.bg, border: `1px solid ${diffC.border}`, color: diffC.text, flexShrink: 0,
                  }}>
                    {currentProblem.difficulty}
                  </span>
                </div>
                {currentProblem.tags && (
                  <div style={{ marginBottom: '16px' }}>
                    <span style={{
                      padding: '3px 10px', borderRadius: '99px', fontSize: '11px', fontWeight: '600',
                      background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.25)', color: '#93c5fd',
                    }}>
                      {currentProblem.tags}
                    </span>
                  </div>
                )}
                <div style={{
                  fontSize: '13px', color: '#cbd5e1', lineHeight: 1.75,
                  whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                }}>
                  {currentProblem.description}
                </div>

                {/* Visible test cases */}
                {currentProblem.visibleTestCases?.length > 0 && (
                  <div style={{ marginTop: '20px' }}>
                    <div style={{ fontSize: '12px', fontWeight: '700', color: '#94a3b8', marginBottom: '10px', letterSpacing: '0.05em' }}>
                      EXAMPLES
                    </div>
                    {currentProblem.visibleTestCases.map((tc, i) => (
                      <div key={i} style={{
                        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
                        borderRadius: '8px', padding: '12px', marginBottom: '8px', fontSize: '12px', fontFamily: 'monospace',
                      }}>
                        <div style={{ color: '#94a3b8', marginBottom: '4px' }}>Input: <span style={{ color: '#e2e8f0' }}>{String(tc.input)}</span></div>
                        <div style={{ color: '#94a3b8' }}>Output: <span style={{ color: '#86efac' }}>{String(tc.output)}</span></div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Status badge */}
                {currentStatus && currentStatus !== 'not_attempted' && (
                  <div style={{
                    marginTop: '16px', padding: '10px 14px', borderRadius: '8px',
                    background: currentStatus === 'solved' ? 'rgba(134,239,172,0.08)' : 'rgba(248,113,113,0.08)',
                    border: `1px solid ${currentStatus === 'solved' ? 'rgba(134,239,172,0.25)' : 'rgba(248,113,113,0.25)'}`,
                    fontSize: '12px', fontWeight: '600',
                    color: currentStatus === 'solved' ? '#86efac' : '#f87171',
                  }}>
                    {currentStatus === 'solved' ? '✅ Problem Solved!' : '❌ Not Accepted'}
                  </div>
                )}
              </>
            ) : (
              <div style={{ color: '#64748b', fontSize: '14px' }}>No problem loaded.</div>
            )}
          </div>
        </div>

        {/* CENTER: Editor */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Editor toolbar */}
          <div style={{
            padding: '8px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexShrink: 0, gap: '10px',
          }}>
            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>
              {session.language?.toUpperCase()}
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={handleRunCode} disabled={running || submitting} style={{
                padding: '6px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '600',
                background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.35)',
                color: '#fbbf24', cursor: running ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', gap: '6px',
              }}>
                {running ? <><span className="loading loading-spinner loading-xs"></span> Running...</> : '▶ Run'}
              </button>
              <button onClick={handleSubmit} disabled={running || submitting} style={{
                padding: '6px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '700',
                background: submitting ? 'rgba(124,58,237,0.3)' : 'linear-gradient(135deg, #7c3aed, #3b82f6)',
                border: 'none', color: '#fff', cursor: submitting ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', gap: '6px',
              }}>
                {submitting ? <><span className="loading loading-spinner loading-xs"></span> Submitting...</> : '✓ Submit'}
              </button>
            </div>
          </div>

          {/* Monaco Editor */}
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <Editor
              height="100%"
              language={LANG_MONACO[session.language] || 'javascript'}
              value={code}
              onChange={v => setCode(v || '')}
              theme="vs-dark"
              options={{
                fontSize: 14, minimap: { enabled: false },
                lineNumbers: 'on', wordWrap: 'on',
                scrollBeyondLastLine: false, tabSize: 2,
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
              }}
            />
          </div>

          {/* Results panel */}
          {(runResult || submitResult) && (
            <div style={{
              maxHeight: '220px', overflowY: 'auto',
              borderTop: '1px solid rgba(255,255,255,0.06)',
              background: 'rgba(0,0,0,0.3)', padding: '14px 16px',
              flexShrink: 0,
            }}>
              {runResult && (
                <ResultsPanel result={runResult} type="run" />
              )}
              {submitResult && (
                <ResultsPanel result={submitResult} type="submit" />
              )}
            </div>
          )}
        </div>

        {/* RIGHT: AI Chat */}
        <div style={{
          width: '30%', minWidth: '240px', borderLeft: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}>
          <div style={{
            padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)',
            flexShrink: 0, display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            <div style={{
              width: '8px', height: '8px', borderRadius: '50%',
              background: '#4ade80', boxShadow: '0 0 6px #4ade80', animation: 'pulse 2s infinite',
            }}></div>
            <span style={{ fontSize: '13px', fontWeight: '700', color: '#e2e8f0' }}>AI Interviewer</span>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
            {conversation.map((msg, i) => (
              <div key={i} style={{
                marginBottom: '12px',
                display: 'flex',
                flexDirection: msg.role === 'candidate' ? 'row-reverse' : 'row',
                gap: '8px', alignItems: 'flex-start',
              }}>
                {msg.role !== 'candidate' && (
                  <div style={{
                    width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                    background: msg.role === 'system'
                      ? 'rgba(148,163,184,0.2)'
                      : 'linear-gradient(135deg, #7c3aed, #3b82f6)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '12px',
                  }}>
                    {msg.role === 'system' ? '⚙' : '🤖'}
                  </div>
                )}
                <div style={{
                  maxWidth: '85%', padding: '8px 12px', borderRadius: '10px',
                  fontSize: '12px', lineHeight: 1.6,
                  background: msg.role === 'candidate'
                    ? 'rgba(124,58,237,0.2)'
                    : msg.role === 'system'
                    ? 'rgba(255,255,255,0.04)'
                    : 'rgba(255,255,255,0.06)',
                  border: '1px solid',
                  borderColor: msg.role === 'candidate'
                    ? 'rgba(124,58,237,0.35)'
                    : 'rgba(255,255,255,0.07)',
                  color: msg.role === 'system' ? '#64748b' : '#e2e8f0',
                }}
                  dangerouslySetInnerHTML={{ __html: formatMsg(msg.content) }}
                />
              </div>
            ))}
            {chatSending && (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', padding: '4px 0' }}>
                <div style={{
                  width: '28px', height: '28px', borderRadius: '50%',
                  background: 'linear-gradient(135deg, #7c3aed, #3b82f6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px',
                }}>🤖</div>
                <div style={{
                  padding: '8px 12px', borderRadius: '10px', background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.07)', display: 'flex', gap: '4px', alignItems: 'center',
                }}>
                  <span className="loading loading-dots loading-xs" style={{ color: '#a78bfa' }}></span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Chat input */}
          <form onSubmit={handleSendMessage} style={{
            padding: '12px', borderTop: '1px solid rgba(255,255,255,0.06)',
            display: 'flex', gap: '8px', flexShrink: 0,
          }}>
            <input
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              placeholder={session.mode === 'guided' ? 'Ask for a hint...' : 'Explain your approach...'}
              disabled={chatSending}
              style={{
                flex: 1, padding: '8px 12px', borderRadius: '8px', fontSize: '12px',
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                color: '#f1f5f9', outline: 'none',
              }}
            />
            <button type="submit" disabled={chatSending || !chatInput.trim()} style={{
              padding: '8px 14px', borderRadius: '8px', fontSize: '14px',
              background: 'linear-gradient(135deg, #7c3aed, #3b82f6)',
              border: 'none', color: '#fff', cursor: 'pointer',
            }}>
              ↑
            </button>
          </form>
        </div>
      </div>

      {/* Confirm end dialog */}
      {showConfirm && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
        }}>
          <div style={{
            background: '#13131f', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '16px', padding: '32px', maxWidth: '380px', width: '90%', textAlign: 'center',
          }}>
            <div style={{ fontSize: '40px', marginBottom: '16px' }}>🏁</div>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#f1f5f9', marginBottom: '8px' }}>
              End Interview?
            </h3>
            <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '24px', lineHeight: 1.6 }}>
              This will finalize your session and generate your performance evaluation. This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button onClick={() => setShowConfirm(false)} style={{
                padding: '10px 24px', borderRadius: '8px', fontSize: '14px', fontWeight: '600',
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                color: '#94a3b8', cursor: 'pointer',
              }}>
                Cancel
              </button>
              <button onClick={() => handleComplete(false)} disabled={completing} style={{
                padding: '10px 24px', borderRadius: '8px', fontSize: '14px', fontWeight: '700',
                background: 'linear-gradient(135deg, #7c3aed, #3b82f6)',
                border: 'none', color: '#fff', cursor: 'pointer',
              }}>
                {completing ? 'Finalizing...' : 'Yes, End Interview'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ResultsPanel({ result, type }) {
  if (result.error) return (
    <div style={{ color: '#f87171', fontSize: '13px' }}>⚠️ {result.error}</div>
  );

  const isSubmit = type === 'submit';
  const passed = isSubmit ? result.testsPassed : result.results?.filter(r => r.passed)?.length;
  const total = isSubmit ? result.testsTotal : result.results?.length;
  const accepted = isSubmit ? result.accepted : null;

  return (
    <div>
      {isSubmit && (
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          padding: '4px 12px', borderRadius: '8px', marginBottom: '10px',
          background: accepted ? 'rgba(134,239,172,0.1)' : 'rgba(248,113,113,0.1)',
          border: `1px solid ${accepted ? 'rgba(134,239,172,0.3)' : 'rgba(248,113,113,0.3)'}`,
          color: accepted ? '#86efac' : '#f87171', fontSize: '13px', fontWeight: '700',
        }}>
          {accepted ? '✅ Accepted' : '❌ Wrong Answer'}
          <span style={{ fontSize: '12px', fontWeight: '400', color: '#94a3b8' }}>
            {passed}/{total} tests passed
          </span>
        </div>
      )}
      {!isSubmit && result.results && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {result.results.map((r, i) => (
            <div key={i} style={{
              display: 'flex', gap: '8px', alignItems: 'flex-start',
              padding: '6px 10px', borderRadius: '6px', fontSize: '12px',
              background: r.passed ? 'rgba(134,239,172,0.05)' : 'rgba(248,113,113,0.05)',
              border: `1px solid ${r.passed ? 'rgba(134,239,172,0.15)' : 'rgba(248,113,113,0.15)'}`,
            }}>
              <span>{r.passed ? '✅' : '❌'}</span>
              <div>
                <div style={{ color: '#94a3b8' }}>
                  In: <code style={{ color: '#e2e8f0' }}>{String(r.input).slice(0, 60)}</code>
                </div>
                <div style={{ color: '#94a3b8' }}>
                  Expected: <code style={{ color: '#86efac' }}>{String(r.expected).slice(0, 40)}</code>
                  {!r.passed && <> · Got: <code style={{ color: '#f87171' }}>{String(r.actual || r.output || '').slice(0, 40)}</code></>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
