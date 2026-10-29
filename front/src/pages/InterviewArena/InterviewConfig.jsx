import { useState } from "react";
import { useNavigate, NavLink } from "react-router";
import axiosClient from "../../utils/axiosClient";

const TOPICS = [
  { value: 'array', label: '📦 Arrays' },
  { value: 'string', label: '🔤 Strings' },
  { value: 'binarySearch', label: '🔍 Binary Search' },
  { value: 'linkedList', label: '🔗 Linked Lists' },
  { value: 'stackQueue', label: '📚 Stacks & Queues' },
  { value: 'tree', label: '🌳 Trees' },
  { value: 'graph', label: '🕸 Graphs' },
  { value: 'greedy', label: '💰 Greedy' },
  { value: 'recursionBacktracking', label: '🔄 Recursion & Backtracking' },
  { value: 'dp', label: '🧠 Dynamic Programming' },
];

const DIFFICULTIES = ['easy', 'medium', 'hard'];
const DURATIONS = [30, 45, 60];
const PROBLEM_COUNTS = [1, 2, 3];
const LANGUAGES = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'python', label: 'Python' },
  { value: 'cpp', label: 'C++' },
  { value: 'java', label: 'Java' },
];

const sectionStyle = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '14px',
  padding: '20px 24px',
  marginBottom: '16px',
};

const radioStyle = (selected) => ({
  padding: '10px 18px', borderRadius: '10px', fontSize: '13px', fontWeight: '600',
  cursor: 'pointer', border: '1px solid',
  borderColor: selected ? 'rgba(124,58,237,0.6)' : 'rgba(255,255,255,0.08)',
  background: selected ? 'rgba(124,58,237,0.18)' : 'rgba(255,255,255,0.02)',
  color: selected ? '#c4b5fd' : '#94a3b8',
  transition: 'all 0.15s',
});

export default function InterviewConfig() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    difficulty: 'medium',
    durationMinutes: 45,
    numberOfProblems: 2,
    topics: [],
    language: 'javascript',
    mode: 'guided',
    targetRole: 'Software Development Engineer',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const toggleTopic = (t) => {
    setForm(f => ({
      ...f,
      topics: f.topics.includes(t) ? f.topics.filter(x => x !== t) : [...f.topics, t],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await axiosClient.post('/interview/create', form);
      navigate(`/interview-arena/session/${res.data.session._id}`);
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || 'Failed to create session';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', background: '#09090f',
      fontFamily: "'DM Sans', sans-serif", color: '#f1f5f9',
    }}>
      {/* Navbar */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 32px', borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(9,9,15,0.95)', backdropFilter: 'blur(12px)',
      }}>
        <NavLink to="/interview-arena" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
          <span style={{ color: '#94a3b8', fontSize: '18px' }}>←</span>
          <span style={{ fontSize: '13px', fontWeight: '600', color: '#94a3b8' }}>Interview Arena</span>
        </NavLink>
        <span style={{
          fontSize: '11px', fontWeight: '700', padding: '3px 12px', borderRadius: '99px',
          background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.35)',
          color: '#c4b5fd',
        }}>
          Configure Interview
        </span>
      </nav>

      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '40px 24px' }}>
        <h1 style={{
          fontFamily: "'Instrument Serif', serif", fontSize: '32px', fontWeight: '400',
          color: '#f1f5f9', marginBottom: '8px',
        }}>
          Configure Your Interview
        </h1>
        <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '32px' }}>
          Set up your session. Sensible defaults are pre-selected — just hit Start to begin quickly.
        </p>

        {error && (
          <div style={{
            background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)',
            borderRadius: '10px', padding: '14px 18px', marginBottom: '20px',
            color: '#fca5a5', fontSize: '14px',
          }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Difficulty */}
          <div style={sectionStyle}>
            <div style={{ fontSize: '13px', fontWeight: '700', color: '#94a3b8', marginBottom: '12px', letterSpacing: '0.05em' }}>
              DIFFICULTY
            </div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {DIFFICULTIES.map(d => (
                <button key={d} type="button" style={radioStyle(form.difficulty === d)}
                  onClick={() => setForm(f => ({ ...f, difficulty: d }))}>
                  {d === 'easy' ? '🟢' : d === 'medium' ? '🟡' : '🔴'} {d.charAt(0).toUpperCase() + d.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Duration */}
          <div style={sectionStyle}>
            <div style={{ fontSize: '13px', fontWeight: '700', color: '#94a3b8', marginBottom: '12px', letterSpacing: '0.05em' }}>
              DURATION
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              {DURATIONS.map(d => (
                <button key={d} type="button" style={radioStyle(form.durationMinutes === d)}
                  onClick={() => setForm(f => ({ ...f, durationMinutes: d }))}>
                  ⏱ {d} min
                </button>
              ))}
            </div>
          </div>

          {/* Number of Problems */}
          <div style={sectionStyle}>
            <div style={{ fontSize: '13px', fontWeight: '700', color: '#94a3b8', marginBottom: '12px', letterSpacing: '0.05em' }}>
              NUMBER OF PROBLEMS
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              {PROBLEM_COUNTS.map(n => (
                <button key={n} type="button" style={radioStyle(form.numberOfProblems === n)}
                  onClick={() => setForm(f => ({ ...f, numberOfProblems: n }))}>
                  {n} {n === 1 ? 'Problem' : 'Problems'}
                </button>
              ))}
            </div>
          </div>

          {/* Topics */}
          <div style={sectionStyle}>
            <div style={{ fontSize: '13px', fontWeight: '700', color: '#94a3b8', marginBottom: '4px', letterSpacing: '0.05em' }}>
              TOPICS
            </div>
            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '12px' }}>
              Leave empty to include all topics, or select specific ones.
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {TOPICS.map(t => {
                const sel = form.topics.includes(t.value);
                return (
                  <button key={t.value} type="button"
                    onClick={() => toggleTopic(t.value)}
                    style={{
                      padding: '7px 14px', borderRadius: '99px', fontSize: '12px', fontWeight: '600',
                      cursor: 'pointer', border: '1px solid',
                      borderColor: sel ? 'rgba(96,165,250,0.5)' : 'rgba(255,255,255,0.08)',
                      background: sel ? 'rgba(96,165,250,0.12)' : 'rgba(255,255,255,0.02)',
                      color: sel ? '#93c5fd' : '#64748b',
                      transition: 'all 0.15s',
                    }}>
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Language */}
          <div style={sectionStyle}>
            <div style={{ fontSize: '13px', fontWeight: '700', color: '#94a3b8', marginBottom: '12px', letterSpacing: '0.05em' }}>
              PROGRAMMING LANGUAGE
            </div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {LANGUAGES.map(l => (
                <button key={l.value} type="button" style={radioStyle(form.language === l.value)}
                  onClick={() => setForm(f => ({ ...f, language: l.value }))}>
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          {/* Mode */}
          <div style={sectionStyle}>
            <div style={{ fontSize: '13px', fontWeight: '700', color: '#94a3b8', marginBottom: '12px', letterSpacing: '0.05em' }}>
              INTERVIEW MODE
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {[
                { value: 'guided', icon: '🟢', label: 'Guided Practice', desc: 'Hints and explanations available. Best for learning.' },
                { value: 'strict', icon: '🔴', label: 'Strict Mock', desc: 'No hints. Realistic interviewer. Feedback after session.' },
              ].map(m => {
                const sel = form.mode === m.value;
                return (
                  <div key={m.value} onClick={() => setForm(f => ({ ...f, mode: m.value }))}
                    style={{
                      padding: '16px', borderRadius: '12px', cursor: 'pointer', border: '1px solid',
                      borderColor: sel ? 'rgba(124,58,237,0.5)' : 'rgba(255,255,255,0.08)',
                      background: sel ? 'rgba(124,58,237,0.1)' : 'rgba(255,255,255,0.02)',
                      transition: 'all 0.15s',
                    }}>
                    <div style={{ fontSize: '18px', marginBottom: '6px' }}>{m.icon}</div>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: sel ? '#c4b5fd' : '#e2e8f0', marginBottom: '4px' }}>
                      {m.label}
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b', lineHeight: 1.5 }}>{m.desc}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Target Role */}
          <div style={sectionStyle}>
            <div style={{ fontSize: '13px', fontWeight: '700', color: '#94a3b8', marginBottom: '12px', letterSpacing: '0.05em' }}>
              TARGET ROLE <span style={{ color: '#475569', fontWeight: '400' }}>(optional)</span>
            </div>
            <input
              type="text"
              value={form.targetRole}
              onChange={e => setForm(f => ({ ...f, targetRole: e.target.value }))}
              placeholder="e.g. Software Engineer Intern, SDE-2..."
              style={{
                width: '100%', padding: '10px 14px', borderRadius: '10px', fontSize: '14px',
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                color: '#f1f5f9', outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Submit */}
          <button type="submit" disabled={loading} style={{
            width: '100%', padding: '14px', borderRadius: '12px', fontSize: '15px', fontWeight: '700',
            background: loading ? 'rgba(124,58,237,0.4)' : 'linear-gradient(135deg, #7c3aed, #3b82f6)',
            border: 'none', color: '#fff', cursor: loading ? 'not-allowed' : 'pointer',
            marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
          }}>
            {loading ? (
              <>
                <span className="loading loading-spinner loading-sm"></span>
                Setting up your interview...
              </>
            ) : (
              '🚀 Start Interview'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
