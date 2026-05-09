import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import axiosClient from '../utils/axiosClient';
import { useNavigate } from 'react-router';

const problemSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  tags: z.enum(['array', 'linkedList', 'graph', 'dp']),
  visibleTestCases: z.array(
    z.object({
      input: z.string().min(1, 'Input is required'),
      output: z.string().min(1, 'Output is required'),
      explanation: z.string().min(1, 'Explanation is required'),
    })
  ).min(1, 'At least one visible test case required'),
  hiddenTestCases: z.array(
    z.object({
      input: z.string().min(1, 'Input is required'),
      output: z.string().min(1, 'Output is required'),
    })
  ).min(1, 'At least one hidden test case required'),
  startCode: z.array(
    z.object({
      language: z.enum(['C++', 'Java', 'JavaScript']),
      initialCode: z.string().min(1, 'Initial code is required'),
    })
  ).length(3, 'All three languages required'),
  referenceSolution: z.array(
    z.object({
      language: z.enum(['C++', 'Java', 'JavaScript']),
      completeCode: z.string().min(1, 'Complete code is required'),
    })
  ).length(3, 'All three languages required'),
});

const LANGS = ['C++', 'Java', 'JavaScript'];
const LANG_COLORS = { 'C++': '#ef4444', 'Java': '#f59e0b', 'JavaScript': '#eab308' };

const sections = ['basics', 'testcases', 'code'];

function SectionPill({ id, label, active, onClick, done }) {
  return (
    <button
      type="button"
      onClick={() => onClick(id)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '10px 16px',
        borderRadius: '10px',
        border: 'none',
        cursor: 'pointer',
        width: '100%',
        textAlign: 'left',
        background: active ? 'rgba(99,102,241,0.12)' : 'transparent',
        color: active ? '#818cf8' : done ? '#6ee7b7' : '#9ca3af',
        fontFamily: "'DM Sans', sans-serif",
        fontSize: '14px',
        fontWeight: active ? '600' : '400',
        transition: 'all 0.15s ease',
      }}
    >
      <span style={{
        width: '24px', height: '24px', borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '11px', fontWeight: '700',
        background: active ? '#6366f1' : done ? '#059669' : 'rgba(255,255,255,0.06)',
        color: active || done ? '#fff' : '#6b7280',
        flexShrink: 0,
        transition: 'all 0.15s ease',
      }}>
        {done && !active ? '✓' : label.charAt(0).toUpperCase()}
      </span>
      {label}
    </button>
  );
}

function Field({ label, error, children, hint }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label style={{
        fontSize: '12px', fontWeight: '600', letterSpacing: '0.06em',
        textTransform: 'uppercase', color: '#6b7280', fontFamily: "'DM Sans', sans-serif",
      }}>
        {label}
      </label>
      {children}
      {hint && !error && (
        <span style={{ fontSize: '12px', color: '#6b7280' }}>{hint}</span>
      )}
      {error && (
        <span style={{
          fontSize: '12px', color: '#f87171',
          display: 'flex', alignItems: 'center', gap: '4px',
        }}>
          ⚠ {error}
        </span>
      )}
    </div>
  );
}

const inputStyle = (hasError) => ({
  width: '100%',
  padding: '10px 14px',
  borderRadius: '8px',
  border: `1px solid ${hasError ? '#f87171' : 'rgba(255,255,255,0.08)'}`,
  background: 'rgba(255,255,255,0.04)',
  color: '#f1f5f9',
  fontSize: '14px',
  fontFamily: "'DM Sans', sans-serif",
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.15s ease',
});

const monoStyle = {
  width: '100%',
  padding: '12px 14px',
  borderRadius: '8px',
  border: '1px solid rgba(255,255,255,0.08)',
  background: '#0d1117',
  color: '#e2e8f0',
  fontSize: '13px',
  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
  lineHeight: '1.7',
  resize: 'vertical',
  outline: 'none',
  boxSizing: 'border-box',
};

function BadgeDiff({ value }) {
  const map = { easy: ['#bbf7d0', '#166534'], medium: ['#fef08a', '#854d0e'], hard: ['#fecaca', '#991b1b'] };
  const [bg, color] = map[value] || ['#e5e7eb', '#374151'];
  return (
    <span style={{
      padding: '2px 8px', borderRadius: '99px', fontSize: '11px',
      fontWeight: '700', background: bg, color, letterSpacing: '0.04em',
      textTransform: 'uppercase',
    }}>
      {value}
    </span>
  );
}

function AdminPanel() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('basics');
  const [activeLang, setActiveLang] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const {
    register, control, handleSubmit, watch,
    formState: { errors, dirtyFields },
  } = useForm({
    resolver: zodResolver(problemSchema),
    defaultValues: {
      difficulty: 'easy',
      tags: 'array',
      startCode: LANGS.map(l => ({ language: l, initialCode: '' })),
      referenceSolution: LANGS.map(l => ({ language: l, completeCode: '' })),
    },
  });

  const { fields: visibleFields, append: appendVisible, remove: removeVisible } = useFieldArray({ control, name: 'visibleTestCases' });
  const { fields: hiddenFields, append: appendHidden, remove: removeHidden } = useFieldArray({ control, name: 'hiddenTestCases' });

  const watchedDiff = watch('difficulty');

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      await axiosClient.post('/problem/create', data);
      navigate('/');
    } catch (error) {
      const message = error.response?.data?.message || error.response?.data || error.message;
      alert(`Error: ${message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const sectionsDone = {
    basics: !!(dirtyFields.title && dirtyFields.description),
    testcases: visibleFields.length > 0 && hiddenFields.length > 0,
    code: false,
  };

  const navItems = [
    { id: 'basics', label: 'Problem basics' },
    { id: 'testcases', label: 'Test cases' },
    { id: 'code', label: 'Code templates' },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; }
        .ap-input:focus { border-color: #6366f1 !important; background: rgba(99,102,241,0.06) !important; }
        .ap-textarea:focus { border-color: #6366f1 !important; }
        .ap-mono:focus { border-color: #818cf8 !important; }
        .ap-btn-ghost:hover { background: rgba(255,255,255,0.06) !important; }
        .ap-btn-add:hover { background: rgba(99,102,241,0.18) !important; }
        .ap-btn-remove:hover { background: rgba(239,68,68,0.15) !important; color: #f87171 !important; }
        .ap-lang-tab:hover { background: rgba(255,255,255,0.05) !important; }
        .ap-section { display: none; }
        .ap-section.active { display: block; }
        select option { background: #1e2433; color: #f1f5f9; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 4px; }
      `}</style>

      <div style={{
        minHeight: '100vh',
        background: '#0f1117',
        color: '#f1f5f9',
        fontFamily: "'DM Sans', sans-serif",
        display: 'flex',
      }}>

        {/* Sidebar */}
        <aside style={{
          width: '240px',
          flexShrink: 0,
          borderRight: '1px solid rgba(255,255,255,0.06)',
          padding: '32px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          position: 'sticky',
          top: 0,
          height: '100vh',
          overflow: 'auto',
        }}>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="ap-btn-ghost"
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '8px 12px', borderRadius: '8px',
              border: 'none', background: 'transparent',
              color: '#9ca3af', cursor: 'pointer',
              fontSize: '13px', fontFamily: "'DM Sans', sans-serif",
              marginBottom: '24px',
            }}
          >
            ← Back
          </button>

          <div style={{ marginBottom: '24px', paddingLeft: '12px' }}>
            <p style={{ margin: 0, fontSize: '11px', color: '#4b5563', fontWeight: '600', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Admin Panel</p>
            <p style={{ margin: '4px 0 0', fontSize: '18px', fontWeight: '700', color: '#f1f5f9', lineHeight: '1.2' }}>New Problem</p>
          </div>

          {navItems.map(item => (
            <SectionPill
              key={item.id}
              id={item.id}
              label={item.label}
              active={activeSection === item.id}
              done={sectionsDone[item.id]}
              onClick={setActiveSection}
            />
          ))}

          <div style={{ marginTop: 'auto', paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ padding: '12px', borderRadius: '10px', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)' }}>
              <p style={{ margin: '0 0 4px', fontSize: '12px', fontWeight: '600', color: '#818cf8' }}>💡 Tip</p>
              <p style={{ margin: 0, fontSize: '12px', color: '#6b7280', lineHeight: '1.5' }}>Add at least 1 visible and 1 hidden test case before submitting.</p>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main style={{ flex: 1, padding: '40px 48px', maxWidth: '880px', overflow: 'auto' }}>
          <form onSubmit={handleSubmit(onSubmit)}>

            {/* ─── BASICS ─── */}
            <div className={`ap-section ${activeSection === 'basics' ? 'active' : ''}`}>
              <div style={{ marginBottom: '32px' }}>
                <h2 style={{ margin: '0 0 4px', fontSize: '22px', fontWeight: '700', color: '#f1f5f9' }}>Problem basics</h2>
                <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>Define the title, description, difficulty and category.</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <Field label="Title" error={errors.title?.message}>
                  <input
                    {...register('title')}
                    className="ap-input"
                    placeholder="e.g. Two Sum"
                    style={inputStyle(errors.title)}
                  />
                </Field>

                <Field label="Description" error={errors.description?.message} hint="Supports plain text. Markdown rendering coming soon.">
                  <textarea
                    {...register('description')}
                    className="ap-textarea"
                    rows={6}
                    placeholder="Describe the problem clearly. Include constraints, examples, edge cases…"
                    style={{ ...inputStyle(errors.description), resize: 'vertical', lineHeight: '1.6' }}
                  />
                </Field>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <Field label="Difficulty" error={errors.difficulty?.message}>
                    <div style={{ position: 'relative' }}>
                      <select
                        {...register('difficulty')}
                        className="ap-input"
                        style={{ ...inputStyle(errors.difficulty), appearance: 'none', paddingRight: '36px', cursor: 'pointer' }}
                      >
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                      </select>
                      <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#6b7280' }}>▾</span>
                    </div>
                    {watchedDiff && <BadgeDiff value={watchedDiff} />}
                  </Field>

                  <Field label="Category tag" error={errors.tags?.message}>
                    <div style={{ position: 'relative' }}>
                      <select
                        {...register('tags')}
                        className="ap-input"
                        style={{ ...inputStyle(errors.tags), appearance: 'none', paddingRight: '36px', cursor: 'pointer' }}
                      >
                        <option value="array">Array</option>
                        <option value="linkedList">Linked List</option>
                        <option value="graph">Graph</option>
                        <option value="dp">Dynamic Programming</option>
                      </select>
                      <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#6b7280' }}>▾</span>
                    </div>
                  </Field>
                </div>
              </div>

              <div style={{ marginTop: '40px', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setActiveSection('testcases')}
                  style={{
                    padding: '10px 24px', borderRadius: '8px',
                    background: '#6366f1', border: 'none',
                    color: '#fff', fontFamily: "'DM Sans', sans-serif",
                    fontSize: '14px', fontWeight: '600',
                    cursor: 'pointer', letterSpacing: '0.01em',
                  }}
                >
                  Continue → Test Cases
                </button>
              </div>
            </div>

            {/* ─── TEST CASES ─── */}
            <div className={`ap-section ${activeSection === 'testcases' ? 'active' : ''}`}>
              <div style={{ marginBottom: '32px' }}>
                <h2 style={{ margin: '0 0 4px', fontSize: '22px', fontWeight: '700', color: '#f1f5f9' }}>Test cases</h2>
                <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>Visible cases appear on the problem page. Hidden cases are used for judging.</p>
              </div>

              {/* Visible */}
              <div style={{ marginBottom: '40px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div>
                    <p style={{ margin: 0, fontSize: '15px', fontWeight: '600', color: '#e2e8f0' }}>Visible test cases</p>
                    <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#6b7280' }}>Shown to users as examples</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => appendVisible({ input: '', output: '', explanation: '' })}
                    className="ap-btn-add"
                    style={{
                      display: 'flex', alignItems: 'center', gap: '6px',
                      padding: '8px 16px', borderRadius: '8px',
                      border: '1px solid rgba(99,102,241,0.3)',
                      background: 'rgba(99,102,241,0.08)',
                      color: '#818cf8', fontSize: '13px', fontWeight: '600',
                      cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                      transition: 'background 0.15s',
                    }}
                  >
                    + Add case
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {visibleFields.map((field, index) => (
                    <div key={field.id} style={{
                      borderRadius: '10px',
                      border: '1px solid rgba(255,255,255,0.07)',
                      background: 'rgba(255,255,255,0.02)',
                      padding: '16px',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <span style={{ fontSize: '12px', fontWeight: '600', color: '#818cf8', letterSpacing: '0.05em' }}>
                          CASE #{index + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeVisible(index)}
                          className="ap-btn-remove"
                          style={{
                            padding: '4px 10px', borderRadius: '6px',
                            border: '1px solid rgba(239,68,68,0.2)',
                            background: 'transparent',
                            color: '#f87171', fontSize: '12px', cursor: 'pointer',
                            fontFamily: "'DM Sans', sans-serif",
                            transition: 'all 0.15s',
                          }}
                        >
                          Remove
                        </button>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                        <div>
                          <label style={{ fontSize: '11px', color: '#6b7280', fontWeight: '600', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Input</label>
                          <textarea
                            {...register(`visibleTestCases.${index}.input`)}
                            rows={3}
                            style={{ ...monoStyle, marginTop: '6px', fontSize: '12px' }}
                            className="ap-mono"
                            placeholder="nums = [2,7,11,15], target = 9"
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '11px', color: '#6b7280', fontWeight: '600', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Output</label>
                          <textarea
                            {...register(`visibleTestCases.${index}.output`)}
                            rows={3}
                            style={{ ...monoStyle, marginTop: '6px', fontSize: '12px' }}
                            className="ap-mono"
                            placeholder="[0,1]"
                          />
                        </div>
                      </div>
                      <div>
                        <label style={{ fontSize: '11px', color: '#6b7280', fontWeight: '600', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Explanation</label>
                        <textarea
                          {...register(`visibleTestCases.${index}.explanation`)}
                          rows={2}
                          style={{ ...inputStyle(false), marginTop: '6px', resize: 'vertical', lineHeight: '1.5', fontSize: '13px' }}
                          className="ap-textarea"
                          placeholder="Because nums[0] + nums[1] = 9, we return [0,1]"
                        />
                      </div>
                    </div>
                  ))}

                  {visibleFields.length === 0 && (
                    <div style={{
                      borderRadius: '10px', border: '1px dashed rgba(255,255,255,0.08)',
                      padding: '32px', textAlign: 'center', color: '#4b5563',
                    }}>
                      <div style={{ fontSize: '28px', marginBottom: '8px' }}>🧪</div>
                      <p style={{ margin: 0, fontSize: '14px' }}>No visible cases yet. Add one above.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Hidden */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div>
                    <p style={{ margin: 0, fontSize: '15px', fontWeight: '600', color: '#e2e8f0' }}>Hidden test cases</p>
                    <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#6b7280' }}>Used for automated judging only</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => appendHidden({ input: '', output: '' })}
                    className="ap-btn-add"
                    style={{
                      display: 'flex', alignItems: 'center', gap: '6px',
                      padding: '8px 16px', borderRadius: '8px',
                      border: '1px solid rgba(99,102,241,0.3)',
                      background: 'rgba(99,102,241,0.08)',
                      color: '#818cf8', fontSize: '13px', fontWeight: '600',
                      cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                      transition: 'background 0.15s',
                    }}
                  >
                    + Add case
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {hiddenFields.map((field, index) => (
                    <div key={field.id} style={{
                      borderRadius: '10px',
                      border: '1px solid rgba(255,255,255,0.07)',
                      background: 'rgba(255,255,255,0.02)',
                      padding: '14px 16px',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <span style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', letterSpacing: '0.05em' }}>
                          HIDDEN #{index + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeHidden(index)}
                          className="ap-btn-remove"
                          style={{
                            padding: '4px 10px', borderRadius: '6px',
                            border: '1px solid rgba(239,68,68,0.2)',
                            background: 'transparent',
                            color: '#ef4444', fontSize: '12px', cursor: 'pointer',
                            fontFamily: "'DM Sans', sans-serif",
                            transition: 'all 0.15s',
                          }}
                        >
                          Remove
                        </button>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <div>
                          <label style={{ fontSize: '11px', color: '#6b7280', fontWeight: '600', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Input</label>
                          <textarea
                            {...register(`hiddenTestCases.${index}.input`)}
                            rows={2}
                            style={{ ...monoStyle, marginTop: '6px', fontSize: '12px' }}
                            className="ap-mono"
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '11px', color: '#6b7280', fontWeight: '600', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Expected output</label>
                          <textarea
                            {...register(`hiddenTestCases.${index}.output`)}
                            rows={2}
                            style={{ ...monoStyle, marginTop: '6px', fontSize: '12px' }}
                            className="ap-mono"
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  {hiddenFields.length === 0 && (
                    <div style={{
                      borderRadius: '10px', border: '1px dashed rgba(255,255,255,0.08)',
                      padding: '24px', textAlign: 'center', color: '#4b5563',
                    }}>
                      <p style={{ margin: 0, fontSize: '14px' }}>No hidden cases yet.</p>
                    </div>
                  )}
                </div>
              </div>

              <div style={{ marginTop: '40px', display: 'flex', justifyContent: 'space-between' }}>
                <button type="button" onClick={() => setActiveSection('basics')} className="ap-btn-ghost"
                  style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)', background: 'transparent', color: '#9ca3af', fontSize: '14px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                  ← Back
                </button>
                <button type="button" onClick={() => setActiveSection('code')}
                  style={{ padding: '10px 24px', borderRadius: '8px', background: '#6366f1', border: 'none', color: '#fff', fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
                  Continue → Code Templates
                </button>
              </div>
            </div>

            {/* ─── CODE ─── */}
            <div className={`ap-section ${activeSection === 'code' ? 'active' : ''}`}>
              <div style={{ marginBottom: '32px' }}>
                <h2 style={{ margin: '0 0 4px', fontSize: '22px', fontWeight: '700', color: '#f1f5f9' }}>Code templates</h2>
                <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>Provide starter code and reference solutions for all three languages.</p>
              </div>

              {/* Language tabs */}
              <div style={{
                display: 'flex', gap: '4px', padding: '4px',
                background: 'rgba(255,255,255,0.04)', borderRadius: '10px',
                marginBottom: '24px', width: 'fit-content',
              }}>
                {LANGS.map((lang, i) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => setActiveLang(i)}
                    className="ap-lang-tab"
                    style={{
                      padding: '7px 18px', borderRadius: '7px', border: 'none',
                      background: activeLang === i ? 'rgba(255,255,255,0.08)' : 'transparent',
                      color: activeLang === i ? '#f1f5f9' : '#6b7280',
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: '13px', fontWeight: activeLang === i ? '600' : '400',
                      cursor: 'pointer', transition: 'all 0.15s',
                      display: 'flex', alignItems: 'center', gap: '6px',
                    }}
                  >
                    <span style={{
                      width: '6px', height: '6px', borderRadius: '50%',
                      background: activeLang === i ? LANG_COLORS[lang] : 'transparent',
                      flexShrink: 0, transition: 'background 0.15s',
                    }} />
                    {lang}
                  </button>
                ))}
              </div>

              {LANGS.map((lang, i) => (
                <div key={lang} style={{ display: activeLang === i ? 'flex' : 'none', flexDirection: 'column', gap: '20px' }}>
                  <div style={{
                    borderRadius: '10px', border: '1px solid rgba(255,255,255,0.07)',
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '10px 16px',
                      background: 'rgba(255,255,255,0.03)',
                      borderBottom: '1px solid rgba(255,255,255,0.07)',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b' }} />
                        <span style={{ fontSize: '12px', color: '#9ca3af', fontWeight: '600', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Starter code</span>
                      </div>
                      <span style={{ fontSize: '11px', color: '#4b5563', fontFamily: 'JetBrains Mono, monospace' }}>{lang.toLowerCase().replace('++', 'pp')}</span>
                    </div>
                    <textarea
                      {...register(`startCode.${i}.initialCode`)}
                      className="ap-mono"
                      rows={10}
                      style={{ ...monoStyle, borderRadius: 0, border: 'none', display: 'block' }}
                      placeholder={`// Starter template for ${lang}\n// User will see this code in the editor`}
                    />
                    {errors.startCode?.[i]?.initialCode && (
                      <div style={{ padding: '8px 16px', background: 'rgba(239,68,68,0.1)', borderTop: '1px solid rgba(239,68,68,0.2)' }}>
                        <span style={{ fontSize: '12px', color: '#f87171' }}>⚠ {errors.startCode[i].initialCode.message}</span>
                      </div>
                    )}
                  </div>

                  <div style={{
                    borderRadius: '10px', border: '1px solid rgba(255,255,255,0.07)',
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '10px 16px',
                      background: 'rgba(255,255,255,0.03)',
                      borderBottom: '1px solid rgba(255,255,255,0.07)',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#6ee7b7' }} />
                        <span style={{ fontSize: '12px', color: '#9ca3af', fontWeight: '600', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Reference solution</span>
                      </div>
                      <span style={{ fontSize: '11px', color: '#4b5563', fontFamily: 'JetBrains Mono, monospace' }}>{lang.toLowerCase().replace('++', 'pp')}</span>
                    </div>
                    <textarea
                      {...register(`referenceSolution.${i}.completeCode`)}
                      className="ap-mono"
                      rows={10}
                      style={{ ...monoStyle, borderRadius: 0, border: 'none', display: 'block' }}
                      placeholder={`// Complete reference solution for ${lang}\n// Used to verify test cases`}
                    />
                    {errors.referenceSolution?.[i]?.completeCode && (
                      <div style={{ padding: '8px 16px', background: 'rgba(239,68,68,0.1)', borderTop: '1px solid rgba(239,68,68,0.2)' }}>
                        <span style={{ fontSize: '12px', color: '#f87171' }}>⚠ {errors.referenceSolution[i].completeCode.message}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              <div style={{ marginTop: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button type="button" onClick={() => setActiveSection('testcases')} className="ap-btn-ghost"
                  style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)', background: 'transparent', color: '#9ca3af', fontSize: '14px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                  ← Back
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    padding: '12px 32px', borderRadius: '8px',
                    background: submitting ? 'rgba(99,102,241,0.5)' : 'linear-gradient(135deg, #6366f1, #818cf8)',
                    border: 'none', color: '#fff',
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: '15px', fontWeight: '700',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    letterSpacing: '0.01em',
                    boxShadow: '0 0 20px rgba(99,102,241,0.3)',
                    transition: 'all 0.2s',
                  }}
                >
                  {submitting ? 'Publishing…' : '🚀 Publish Problem'}
                </button>
              </div>
            </div>

          </form>
        </main>
      </div>
    </>
  );
}

export default AdminPanel;