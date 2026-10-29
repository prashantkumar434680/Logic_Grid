import { useEffect, useState } from "react";
import { useParams, useNavigate, NavLink } from "react-router";
import axiosClient from "../../utils/axiosClient";

const DIMENSION_META = {
  problemSolving: { label: 'Problem Solving', icon: '🧩', weight: '20%' },
  correctness: { label: 'Correctness', icon: '✅', weight: '30%' },
  complexity: { label: 'Time & Space Complexity', icon: '⚡', weight: '15%' },
  codeQuality: { label: 'Code Quality', icon: '💎', weight: '15%' },
  optimization: { label: 'Optimization', icon: '🚀', weight: '10%' },
  communication: { label: 'Communication', icon: '💬', weight: '10%' },
};

const STATUS_STYLE = {
  solved: { bg: 'rgba(134,239,172,0.1)', border: 'rgba(134,239,172,0.3)', color: '#86efac', label: 'Solved' },
  failed: { bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.3)', color: '#f87171', label: 'Not Accepted' },
  not_attempted: { bg: 'rgba(148,163,184,0.1)', border: 'rgba(148,163,184,0.2)', color: '#94a3b8', label: 'Unattempted' },
};

function ScoreGauge({ score }) {
  const color = score >= 75 ? '#4ade80' : score >= 50 ? '#fbbf24' : '#f87171';
  const label = score >= 75 ? 'Strong' : score >= 50 ? 'Average' : 'Needs Work';
  const pct = Math.min(100, Math.max(0, score));
  return (
    <div style={{ textAlign: 'center' }}>
      <svg width="140" height="140" viewBox="0 0 140 140">
        <circle cx="70" cy="70" r="60" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="14" />
        <circle cx="70" cy="70" r="60" fill="none" stroke={color} strokeWidth="14"
          strokeDasharray={`${(pct / 100) * 376.8} 376.8`}
          strokeLinecap="round"
          transform="rotate(-90 70 70)"
          style={{ transition: 'stroke-dasharray 1s ease' }}
        />
        <text x="70" y="65" textAnchor="middle" fill={color} fontSize="28" fontWeight="700" fontFamily="DM Sans, sans-serif">{score ?? '–'}</text>
        <text x="70" y="85" textAnchor="middle" fill="#64748b" fontSize="11" fontFamily="DM Sans, sans-serif">/100</text>
      </svg>
      <div style={{ fontSize: '13px', fontWeight: '700', color }}>{label}</div>
    </div>
  );
}

function ScoreBar({ score }) {
  const color = score >= 75 ? '#4ade80' : score >= 50 ? '#fbbf24' : '#f87171';
  return (
    <div style={{ marginTop: '6px' }}>
      <div style={{
        height: '6px', borderRadius: '3px',
        background: 'rgba(255,255,255,0.06)', overflow: 'hidden',
      }}>
        <div style={{
          width: `${Math.min(100, score || 0)}%`, height: '100%',
          background: color, borderRadius: '3px',
          transition: 'width 0.8s ease',
        }} />
      </div>
    </div>
  );
}

export default function InterviewResults() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    axiosClient.get(`/interview/session/${sessionId}`)
      .then(r => setSession(r.data.session))
      .catch(err => setError(err.response?.data?.message || 'Failed to load results'))
      .finally(() => setLoading(false));
  }, [sessionId]);

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#09090f', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ textAlign: 'center', color: '#94a3b8' }}>
        <span className="loading loading-spinner loading-lg"></span>
        <div style={{ marginTop: '16px' }}>Loading your results...</div>
      </div>
    </div>
  );

  if (error) return (
    <div style={{ minHeight: '100vh', background: '#09090f', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ textAlign: 'center', color: '#f87171' }}>
        <div style={{ fontSize: '40px', marginBottom: '12px' }}>⚠️</div>
        <div style={{ marginBottom: '16px' }}>{error}</div>
        <NavLink to="/interview-arena" style={{ color: '#a78bfa', textDecoration: 'none' }}>← Back to Interview Arena</NavLink>
      </div>
    </div>
  );

  if (!session) return null;

  if (session.status === 'in_progress') return (
    <div style={{ minHeight: '100vh', background: '#09090f', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ textAlign: 'center', maxWidth: '400px' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
        <h2 style={{ color: '#f1f5f9', marginBottom: '8px' }}>Session Still Active</h2>
        <p style={{ color: '#94a3b8', marginBottom: '24px', fontSize: '14px' }}>
          This interview is still in progress. Complete the session to view your results.
        </p>
        <button onClick={() => navigate(`/interview-arena/session/${sessionId}`)} style={{
          padding: '10px 24px', borderRadius: '8px', fontWeight: '700', fontSize: '14px',
          background: 'linear-gradient(135deg, #7c3aed, #3b82f6)', border: 'none', color: '#fff', cursor: 'pointer',
        }}>
          Return to Interview
        </button>
      </div>
    </div>
  );

  const ev = session.evaluation;
  const cardStyle = {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '14px', padding: '20px',
  };

  return (
    <div style={{ minHeight: '100vh', background: '#09090f', fontFamily: "'DM Sans', sans-serif", color: '#f1f5f9' }}>
      {/* Navbar */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 32px', borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(9,9,15,0.95)', backdropFilter: 'blur(12px)',
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <NavLink to="/interview-arena" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
          ← Interview Arena
        </NavLink>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => navigate('/interview-arena/history')} style={{
            padding: '7px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '600',
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
            color: '#94a3b8', cursor: 'pointer',
          }}>
            View History
          </button>
          <button onClick={() => navigate('/interview-arena/config')} style={{
            padding: '7px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '700',
            background: 'linear-gradient(135deg, #7c3aed, #3b82f6)',
            border: 'none', color: '#fff', cursor: 'pointer',
          }}>
            Practice More
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 24px' }}>

        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', fontWeight: '700', padding: '3px 10px', borderRadius: '99px',
              background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.3)', color: '#c4b5fd' }}>
              {session.mode === 'guided' ? '🟢 Guided Practice' : '🔴 Strict Mock'}
            </span>
            <span style={{ fontSize: '11px', fontWeight: '600', color: '#64748b' }}>
              {session.difficulty?.toUpperCase()} · {session.durationMinutes} min · {new Date(session.createdAt).toLocaleDateString('en-US', { dateStyle: 'long' })}
            </span>
            {session.targetRole && (
              <span style={{ fontSize: '11px', color: '#64748b' }}>· {session.targetRole}</span>
            )}
          </div>
          <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: '32px', fontWeight: '400', color: '#f1f5f9', margin: 0 }}>
            Interview Results
          </h1>
        </div>

        {/* Score overview */}
        {ev ? (
          <>
            <div style={{ ...cardStyle, display: 'flex', gap: '32px', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap' }}>
              <ScoreGauge score={ev.overallScore} />
              <div style={{ flex: 1, minWidth: '200px' }}>
                <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '4px' }}>Overall Score</div>
                <div style={{ fontSize: '36px', fontWeight: '800', color: '#f1f5f9', marginBottom: '4px' }}>
                  {ev.overallScore}<span style={{ fontSize: '18px', color: '#64748b', fontWeight: '400' }}>/100</span>
                </div>
                <div style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.5 }}>
                  {ev.overallScore >= 75
                    ? 'Great performance! You demonstrated strong problem-solving skills.'
                    : ev.overallScore >= 50
                    ? 'Decent attempt. Review the feedback below to identify areas for improvement.'
                    : 'More practice needed. Focus on the areas highlighted below.'}
                </div>
                {ev.evaluationMethod && (
                  <div style={{ marginTop: '8px', fontSize: '11px', color: '#475569' }}>
                    Evaluated via: {ev.evaluationMethod === 'ai_with_fallback' ? 'AI + Test Results' : ev.evaluationMethod}
                  </div>
                )}
              </div>
            </div>

            {/* 6 dimension cards */}
            <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#94a3b8', letterSpacing: '0.05em', marginBottom: '16px' }}>
              PERFORMANCE DIMENSIONS
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '14px', marginBottom: '28px' }}>
              {Object.entries(DIMENSION_META).map(([key, meta]) => {
                const dim = ev.dimensions?.[key] || {};
                const score = dim.score ?? 0;
                return (
                  <div key={key} style={cardStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '18px' }}>{meta.icon}</span>
                        <span style={{ fontSize: '13px', fontWeight: '700', color: '#e2e8f0' }}>{meta.label}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px' }}>
                        <span style={{
                          fontSize: '20px', fontWeight: '800',
                          color: score >= 75 ? '#4ade80' : score >= 50 ? '#fbbf24' : '#f87171',
                        }}>{score}</span>
                        <span style={{ fontSize: '11px', color: '#64748b' }}>/100</span>
                      </div>
                    </div>
                    <ScoreBar score={score} />
                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>Weight: {meta.weight}</div>
                    {dim.feedback && (
                      <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '10px', lineHeight: 1.5 }}>
                        {dim.feedback}
                      </div>
                    )}
                    {dim.evidence && (
                      <div style={{ fontSize: '11px', color: '#475569', marginTop: '6px', fontStyle: 'italic' }}>
                        {dim.evidence}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Strengths & Weaknesses */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              {ev.strengths?.length > 0 && (
                <div style={cardStyle}>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#86efac', marginBottom: '12px' }}>✅ Strengths</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {ev.strengths.map((s, i) => (
                      <span key={i} style={{
                        padding: '4px 12px', borderRadius: '99px', fontSize: '12px', fontWeight: '600',
                        background: 'rgba(134,239,172,0.08)', border: '1px solid rgba(134,239,172,0.2)', color: '#86efac',
                      }}>{s}</span>
                    ))}
                  </div>
                </div>
              )}
              {ev.weaknesses?.length > 0 && (
                <div style={cardStyle}>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#f87171', marginBottom: '12px' }}>⚠️ Areas to Improve</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {ev.weaknesses.map((w, i) => (
                      <span key={i} style={{
                        padding: '4px 12px', borderRadius: '99px', fontSize: '12px', fontWeight: '600',
                        background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', color: '#f87171',
                      }}>{w}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Key Mistakes */}
            {ev.keyMistakes?.length > 0 && (
              <div style={{ ...cardStyle, marginBottom: '24px' }}>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#fbbf24', marginBottom: '12px' }}>🔍 Key Mistakes</div>
                <ul style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {ev.keyMistakes.map((m, i) => (
                    <li key={i} style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.5 }}>{m}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recommendations */}
            {ev.recommendations?.length > 0 && (
              <div style={{ ...cardStyle, marginBottom: '24px', border: '1px solid rgba(96,165,250,0.2)', background: 'rgba(96,165,250,0.03)' }}>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#93c5fd', marginBottom: '12px' }}>💡 Recommendations</div>
                <ol style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {ev.recommendations.map((r, i) => (
                    <li key={i} style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.5 }}>{r}</li>
                  ))}
                </ol>
              </div>
            )}
          </>
        ) : (
          <div style={{ ...cardStyle, textAlign: 'center', padding: '40px', marginBottom: '24px' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>📊</div>
            <div style={{ color: '#94a3b8', fontSize: '14px' }}>
              Evaluation is being generated. Please refresh in a moment.
            </div>
          </div>
        )}

        {/* Problems Table */}
        <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#94a3b8', letterSpacing: '0.05em', marginBottom: '16px' }}>
          PROBLEMS ATTEMPTED
        </h2>
        <div style={{ ...cardStyle, marginBottom: '24px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                {['Problem', 'Difficulty', 'Topic', 'Status', 'Tests Passed', ''].map(h => (
                  <th key={h} style={{
                    textAlign: 'left', padding: '10px 12px', fontSize: '11px',
                    fontWeight: '700', color: '#64748b', letterSpacing: '0.05em',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {session.problems?.map((p, i) => {
                const ss = STATUS_STYLE[p.status] || STATUS_STYLE.not_attempted;
                const passedCount = p.testCasesPassed ?? (p.status === 'solved' ? '✓' : '–');
                const totalCount = p.testCasesTotal ?? '–';
                return (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '12px', fontSize: '13px', fontWeight: '600', color: '#e2e8f0' }}>
                      {p.title}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        fontSize: '11px', fontWeight: '600', padding: '2px 8px', borderRadius: '99px',
                        background: p.difficulty === 'easy' ? 'rgba(134,239,172,0.1)' : p.difficulty === 'hard' ? 'rgba(248,113,113,0.1)' : 'rgba(251,191,36,0.1)',
                        color: p.difficulty === 'easy' ? '#86efac' : p.difficulty === 'hard' ? '#f87171' : '#fbbf24',
                        border: `1px solid ${p.difficulty === 'easy' ? 'rgba(134,239,172,0.2)' : p.difficulty === 'hard' ? 'rgba(248,113,113,0.2)' : 'rgba(251,191,36,0.2)'}`,
                      }}>
                        {p.difficulty}
                      </span>
                    </td>
                    <td style={{ padding: '12px', fontSize: '12px', color: '#64748b' }}>{p.tags || '–'}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        fontSize: '11px', fontWeight: '600', padding: '3px 10px', borderRadius: '99px',
                        background: ss.bg, border: `1px solid ${ss.border}`, color: ss.color,
                      }}>
                        {ss.label}
                      </span>
                    </td>
                    <td style={{ padding: '12px', fontSize: '13px', color: '#94a3b8' }}>
                      {typeof passedCount === 'number' ? `${passedCount}/${totalCount}` : passedCount}
                    </td>
                    <td style={{ padding: '12px' }}>
                      {p.problemId && (
                        <NavLink to={`/problem/${p.problemId}`} style={{ fontSize: '12px', color: '#a78bfa', textDecoration: 'none', fontWeight: '600' }}>
                          Practice →
                        </NavLink>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Disclaimer */}
        <div style={{
          padding: '14px 18px', borderRadius: '10px',
          background: 'rgba(251,191,36,0.05)', border: '1px solid rgba(251,191,36,0.15)',
          fontSize: '12px', color: '#78716c', lineHeight: 1.6,
        }}>
          ⚠️ <strong style={{ color: '#d4b96a' }}>Disclaimer:</strong>{' '}
          AI-generated qualitative scores are indicative and based on your submitted code and conversation. 
          They should not be interpreted as guarantees of real interview performance. 
          Correctness scores are grounded in actual Judge0 test execution results.
        </div>

        {/* CTA buttons */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '24px', flexWrap: 'wrap' }}>
          <button onClick={() => navigate('/interview-arena/config')} style={{
            padding: '12px 28px', borderRadius: '10px', fontSize: '14px', fontWeight: '700',
            background: 'linear-gradient(135deg, #7c3aed, #3b82f6)',
            border: 'none', color: '#fff', cursor: 'pointer',
          }}>
            🚀 Practice More
          </button>
          <button onClick={() => navigate('/interview-arena/history')} style={{
            padding: '12px 28px', borderRadius: '10px', fontSize: '14px', fontWeight: '600',
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
            color: '#94a3b8', cursor: 'pointer',
          }}>
            📋 View All Interviews
          </button>
        </div>
      </div>
    </div>
  );
}
