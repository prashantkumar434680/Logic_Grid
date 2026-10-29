import { useEffect, useState } from "react";
import { useNavigate, NavLink } from "react-router";
import axiosClient from "../../utils/axiosClient";

const cardStyle = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '16px',
  padding: '24px',
};

const badgeStyle = (color) => ({
  display: 'inline-flex', alignItems: 'center', gap: '4px',
  padding: '2px 10px', borderRadius: '99px', fontSize: '11px', fontWeight: '600',
  background: `rgba(${color},0.12)`, color: `rgb(${color})`,
  border: `1px solid rgba(${color},0.25)`,
});

const STATUS_COLOR = {
  completed: '134,239,172',
  abandoned: '248,113,113',
  in_progress: '251,191,36',
  submitted: '96,165,250',
};

function ScoreCircle({ score }) {
  const color = score >= 75 ? '#4ade80' : score >= 50 ? '#fbbf24' : '#f87171';
  return (
    <div style={{
      width: '44px', height: '44px', borderRadius: '50%',
      border: `3px solid ${color}`, display: 'flex', alignItems: 'center',
      justifyContent: 'center', flexShrink: 0,
    }}>
      <span style={{ fontSize: '13px', fontWeight: '700', color }}>{score ?? '–'}</span>
    </div>
  );
}

export default function InterviewArenaLanding() {
  const navigate = useNavigate();
  const [recentSessions, setRecentSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axiosClient.get('/interview/history?page=1&limit=3')
      .then(r => setRecentSessions(r.data.sessions || []))
      .catch(() => setRecentSessions([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{
      minHeight: '100vh', background: '#09090f',
      fontFamily: "'DM Sans', sans-serif", color: '#f1f5f9',
    }}>
      {/* Navbar */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 32px', borderBottom: '1px solid rgba(255,255,255,0.06)',
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(9,9,15,0.95)', backdropFilter: 'blur(12px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <NavLink to="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
            <div style={{
              width: '30px', height: '30px', borderRadius: '8px',
              background: 'linear-gradient(135deg, #7c3aed, #3b82f6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="white">
                <path d="M4 4h4v4H4zm6 0h4v4h-4zm6 0h4v4h-4zM4 10h4v4H4zm6 0h4v4h-4zm6 0h4v4h-4zM4 16h4v4H4zm6 0h4v4h-4zm6 0h4v4h-4z" />
              </svg>
            </div>
            <span style={{ fontFamily: "'Instrument Serif', serif", fontSize: '18px', color: '#f1f5f9' }}>
              LogicGrid
            </span>
          </NavLink>
          <span style={{
            fontSize: '11px', fontWeight: '700', padding: '3px 12px', borderRadius: '99px',
            background: 'linear-gradient(135deg, rgba(124,58,237,0.25), rgba(59,130,246,0.25))',
            border: '1px solid rgba(139,92,246,0.4)', color: '#c4b5fd', letterSpacing: '0.05em',
          }}>
            🎯 INTERVIEW ARENA
          </span>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={() => navigate('/interview-arena/history')} style={{
            padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '600',
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
            color: '#94a3b8', cursor: 'pointer',
          }}>
            View History
          </button>
          <button onClick={() => navigate('/interview-arena/config')} style={{
            padding: '8px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: '700',
            background: 'linear-gradient(135deg, #7c3aed, #3b82f6)',
            border: 'none', color: '#fff', cursor: 'pointer',
          }}>
            Start Interview →
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '48px 24px' }}>

        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: '56px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '6px 16px', borderRadius: '99px', marginBottom: '24px',
            background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.3)',
            fontSize: '12px', fontWeight: '600', color: '#a78bfa', letterSpacing: '0.05em',
          }}>
            AI-POWERED MOCK INTERVIEWS
          </div>
          <h1 style={{
            fontFamily: "'Instrument Serif', serif",
            fontSize: 'clamp(36px, 6vw, 60px)', fontWeight: '400',
            color: '#f1f5f9', margin: '0 0 16px', lineHeight: 1.1,
          }}>
            Ace Your{' '}
            <span style={{
              background: 'linear-gradient(135deg, #a78bfa, #60a5fa)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              Coding Interview
            </span>
          </h1>
          <p style={{ fontSize: '17px', color: '#94a3b8', maxWidth: '560px', margin: '0 auto 36px', lineHeight: 1.6 }}>
            Practice with an adaptive AI interviewer, real code execution, and evidence-based performance feedback — all inside LogicGrid.
          </p>
          <button onClick={() => navigate('/interview-arena/config')} style={{
            padding: '14px 36px', borderRadius: '12px', fontSize: '16px', fontWeight: '700',
            background: 'linear-gradient(135deg, #7c3aed, #3b82f6)',
            border: 'none', color: '#fff', cursor: 'pointer',
            boxShadow: '0 0 32px rgba(124,58,237,0.35)',
            transform: 'translateY(0)', transition: 'transform 0.15s, box-shadow 0.15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 40px rgba(124,58,237,0.5)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 0 32px rgba(124,58,237,0.35)'; }}
          >
            🚀 Start New Interview
          </button>
        </div>

        {/* Feature grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '56px' }}>
          {[
            { icon: '🤖', title: 'Adaptive AI Interviewer', desc: 'Responds to your code and approach in real-time, just like a real interviewer.' },
            { icon: '⚡', title: 'Real Code Execution', desc: 'Your solutions run against actual test cases via Judge0 — no fabrication.' },
            { icon: '📊', title: 'Evidence-Based Feedback', desc: '6-dimension evaluation grounded in your actual submissions and code.' },
            { icon: '🎯', title: 'Topic-Focused Practice', desc: 'Target your weak spots: arrays, DP, graphs, trees, and more.' },
          ].map(f => (
            <div key={f.title} style={cardStyle}>
              <div style={{ fontSize: '28px', marginBottom: '12px' }}>{f.icon}</div>
              <div style={{ fontSize: '14px', fontWeight: '700', color: '#e2e8f0', marginBottom: '6px' }}>{f.title}</div>
              <div style={{ fontSize: '12px', color: '#64748b', lineHeight: 1.5 }}>{f.desc}</div>
            </div>
          ))}
        </div>

        {/* Interview Modes */}
        <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#e2e8f0', marginBottom: '20px' }}>
          Interview Modes
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '56px' }}>
          <div style={{ ...cardStyle, border: '1px solid rgba(134,239,172,0.2)', background: 'rgba(134,239,172,0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <span style={{ fontSize: '28px' }}>🟢</span>
              <span style={{ fontSize: '16px', fontWeight: '700', color: '#86efac' }}>Guided Practice</span>
            </div>
            <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.6, margin: 0 }}>
              The AI interviewer provides hints, explains concepts, and guides you through difficult problems. 
              Perfect for learning and improving your approach without pressure.
            </p>
            <ul style={{ marginTop: '12px', paddingLeft: '16px', fontSize: '12px', color: '#64748b', lineHeight: 1.8 }}>
              <li>Hints available on request</li>
              <li>Concept explanations provided</li>
              <li>Encourages learning over performance</li>
            </ul>
          </div>
          <div style={{ ...cardStyle, border: '1px solid rgba(248,113,113,0.2)', background: 'rgba(248,113,113,0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <span style={{ fontSize: '28px' }}>🔴</span>
              <span style={{ fontSize: '16px', fontWeight: '700', color: '#f87171' }}>Strict Mock Interview</span>
            </div>
            <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.6, margin: 0 }}>
              The AI behaves like a real technical interviewer — no hints, no hand-holding, strict session rules. 
              Feedback and solutions revealed only after the session ends.
            </p>
            <ul style={{ marginTop: '12px', paddingLeft: '16px', fontSize: '12px', color: '#64748b', lineHeight: 1.8 }}>
              <li>No hints during session</li>
              <li>Realistic interviewer behavior</li>
              <li>Detailed debrief after completion</li>
            </ul>
          </div>
        </div>

        {/* Recent Sessions */}
        <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#e2e8f0', marginBottom: '20px' }}>
          Recent Interviews
        </h2>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
            <span className="loading loading-spinner"></span>
          </div>
        ) : recentSessions.length === 0 ? (
          <div style={{
            ...cardStyle, textAlign: 'center', padding: '48px 24px',
            border: '1px dashed rgba(255,255,255,0.1)',
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎯</div>
            <div style={{ fontSize: '16px', fontWeight: '600', color: '#e2e8f0', marginBottom: '8px' }}>
              No interviews yet
            </div>
            <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '24px' }}>
              Complete your first mock interview to see your performance here.
            </div>
            <button onClick={() => navigate('/interview-arena/config')} style={{
              padding: '10px 24px', borderRadius: '8px', fontSize: '14px', fontWeight: '600',
              background: 'linear-gradient(135deg, #7c3aed, #3b82f6)',
              border: 'none', color: '#fff', cursor: 'pointer',
            }}>
              Start Your First Interview
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
            {recentSessions.map(s => (
              <div key={s._id} onClick={() => navigate(`/interview-arena/results/${s._id}`)}
                style={{
                  ...cardStyle, display: 'flex', alignItems: 'center', gap: '16px',
                  cursor: 'pointer', transition: 'border-color 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(139,92,246,0.4)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}
              >
                <ScoreCircle score={s.evaluation?.overallScore} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '14px', fontWeight: '600', color: '#e2e8f0' }}>
                      {s.mode === 'guided' ? '🟢 Guided' : '🔴 Strict'} — {s.difficulty}
                    </span>
                    <span style={badgeStyle(STATUS_COLOR[s.status] || '148,163,184')}>
                      {s.status}
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>
                    {new Date(s.createdAt).toLocaleDateString()} · {s.durationMinutes} min ·{' '}
                    {s.problems?.filter(p => p.status === 'solved').length ?? 0}/{s.problems?.length ?? 0} solved
                  </div>
                </div>
                <span style={{ color: '#64748b', fontSize: '18px' }}>›</span>
              </div>
            ))}
            <button onClick={() => navigate('/interview-arena/history')} style={{
              marginTop: '8px', padding: '10px', background: 'transparent',
              border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px',
              color: '#94a3b8', fontSize: '13px', cursor: 'pointer',
            }}>
              View All Interviews →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
