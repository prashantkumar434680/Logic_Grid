import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import axiosClient from '../utils/axiosClient';

// ── Reusable field ────────────────────────────────────────────────────

function Field({ label, error, hint, children }) {
  return (
    <div className="flex flex-col gap-1.5 mb-5">
      <label className="text-[11px] font-semibold uppercase tracking-widest text-white/30">
        {label}
      </label>
      {hint && <p className="text-[11px] text-white/20 -mt-1">{hint}</p>}
      {children}
      {error && <p className="text-[11px] text-red-400 mt-0.5">{error}</p>}
    </div>
  );
}

const inputCls = "w-full px-3.5 py-[11px] bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-white/20 outline-none transition-all focus:bg-purple-500/[0.05] focus:border-purple-500/60";
const textareaCls = inputCls + " resize-none";

// ── Section wrapper ───────────────────────────────────────────────────

function Section({ title, children }) {
  return (
    <div className="rounded-2xl p-6 mb-6"
      style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
      <h2 className="font-['Instrument_Serif'] text-[18px] text-white mb-5">{title}</h2>
      {children}
    </div>
  );
}

// ── Languages ─────────────────────────────────────────────────────────

const LANGUAGES = ['C++', 'Java', 'Javascript'];

// ── Main component ────────────────────────────────────────────────────

export default function UpdateProblem() {
  const { problemId } = useParams();
  const navigate = useNavigate();

  const [loading,    setLoading]    = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState('');
  const [success,    setSuccess]    = useState('');

  // ── Form state ──
  const [title,       setTitle]       = useState('');
  const [description, setDescription] = useState('');
  const [difficulty,  setDifficulty]  = useState('easy');
  const [tags,        setTags]        = useState('array');

  const [visibleTestCases, setVisibleTestCases] = useState([
    { input: '', output: '', explanation: '' }
  ]);

  const [hiddenTestCases, setHiddenTestCases] = useState([
    { input: '', output: '' }
  ]);

  const [startCode, setStartCode] = useState(
    LANGUAGES.map(lang => ({ language: lang, initialCode: '' }))
  );

  const [referenceSolution, setReferenceSolution] = useState(
    LANGUAGES.map(lang => ({ language: lang, completeCode: '' }))
  );

  // ── Fetch existing problem ──
  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await axiosClient.get(`/problem/problemById/${problemId}`);
        setTitle(data.title       || '');
        setDescription(data.description || '');
        setDifficulty(data.difficulty   || 'easy');
        setTags(data.tags               || 'array');

        if (data.visibleTestCases?.length) setVisibleTestCases(data.visibleTestCases);
        if (data.hiddenTestCases?.length)  setHiddenTestCases(data.hiddenTestCases);

        // Merge fetched startCode with all languages
        if (data.startCode?.length) {
          setStartCode(LANGUAGES.map(lang => ({
            language:    lang,
            initialCode: data.startCode.find(s => s.language === lang)?.initialCode || ''
          })));
        }

        // Merge fetched referenceSolution with all languages
        if (data.referenceSolution?.length) {
          setReferenceSolution(LANGUAGES.map(lang => ({
            language:     lang,
            completeCode: data.referenceSolution.find(s => s.language === lang)?.completeCode || ''
          })));
        }

      } catch (err) {
        setError('Failed to load problem. Check the ID.');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [problemId]);

  // ── Test case helpers ──

  const addVisible = () =>
    setVisibleTestCases(v => [...v, { input: '', output: '', explanation: '' }]);

  const removeVisible = (i) =>
    setVisibleTestCases(v => v.filter((_, idx) => idx !== i));

  const updateVisible = (i, field, value) =>
    setVisibleTestCases(v => v.map((tc, idx) => idx === i ? { ...tc, [field]: value } : tc));

  const addHidden = () =>
    setHiddenTestCases(h => [...h, { input: '', output: '' }]);

  const removeHidden = (i) =>
    setHiddenTestCases(h => h.filter((_, idx) => idx !== i));

  const updateHidden = (i, field, value) =>
    setHiddenTestCases(h => h.map((tc, idx) => idx === i ? { ...tc, [field]: value } : tc));

  const updateStartCode = (lang, value) =>
    setStartCode(s => s.map(sc => sc.language === lang ? { ...sc, initialCode: value } : sc));

  const updateSolution = (lang, value) =>
    setReferenceSolution(s => s.map(sc => sc.language === lang ? { ...sc, completeCode: value } : sc));

  // ── Submit ──

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Basic validation
    if (!title.trim())       return setError('Title is required');
    if (!description.trim()) return setError('Description is required');

    const hasEmptyVisible = visibleTestCases.some(tc => !tc.input.trim() || !tc.output.trim());
    if (hasEmptyVisible)     return setError('All visible test cases must have input and output');

    const hasEmptyHidden = hiddenTestCases.some(tc => !tc.input.trim() || !tc.output.trim());
    if (hasEmptyHidden)      return setError('All hidden test cases must have input and output');

    const hasEmptySolution = referenceSolution.some(s => !s.completeCode.trim());
    if (hasEmptySolution)    return setError('All reference solutions are required');

    setSubmitting(true);

    try {
      await axiosClient.put(`/problem/update/${problemId}`, {
        title,
        description,
        difficulty,
        tags,
        visibleTestCases,
        hiddenTestCases,
        startCode,
        referenceSolution,
      });

      setSuccess('Problem updated successfully! Redirecting…');
      setTimeout(() => navigate('/admin'), 2000);

    } catch (err) {
      setError(err.response?.data?.message || err.response?.data || 'Update failed. Check your solutions.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Loading ──

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
          <p className="text-[13px] text-white/30">Loading problem…</p>
        </div>
      </div>
    );
  }

  // ── Render ──

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap');`}</style>

      <div className="min-h-screen bg-[#0a0a0f] font-['DM_Sans'] text-white">

        {/* Navbar */}
        <nav className="flex items-center justify-between px-8 py-4 border-b border-white/[0.06]"
          style={{ backdropFilter: "blur(12px)", background: "rgba(10,10,15,0.8)" }}>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/admin')}
              className="text-white/30 hover:text-white/70 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <span className="text-white/20 text-sm">/</span>
            <span className="text-[13px] text-white/40">Admin</span>
            <span className="text-white/20 text-sm">/</span>
            <span className="text-[13px] text-white/70">Update Problem</span>
          </div>

          {/* Problem ID badge */}
          <div className="px-3 py-1 rounded-lg text-[11px] text-purple-300 font-mono"
            style={{ background: "rgba(124,92,233,0.1)", border: "1px solid rgba(124,92,233,0.2)" }}>
            ID: {problemId?.slice(-8)}
          </div>
        </nav>

        {/* Content */}
        <div className="max-w-4xl mx-auto px-6 py-10">

          {/* Header */}
          <div className="mb-8">
            <h1 className="font-['Instrument_Serif'] text-[32px] text-white tracking-tight mb-1">
              Update problem
            </h1>
            <p className="text-[13px] text-white/35">
              Changes will be validated against all test cases before saving.
            </p>
          </div>

          {/* Banners */}
          {error && (
            <div className="mb-6 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/25 flex items-start gap-2">
              <svg className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-[13px] text-red-300">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 px-4 py-3 rounded-xl bg-teal-500/10 border border-teal-500/25 flex items-center gap-2">
              <svg className="w-4 h-4 text-teal-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-[13px] text-teal-300">{success}</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>

            {/* ── Basic Info ── */}
            <Section title="Basic information">
              <Field label="Title">
                <input type="text" placeholder="e.g. Two Sum"
                  className={inputCls} value={title}
                  onChange={e => setTitle(e.target.value)} />
              </Field>

              <Field label="Description">
                <textarea rows={6} placeholder="Problem description with examples…"
                  className={textareaCls} value={description}
                  onChange={e => setDescription(e.target.value)} />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Difficulty">
                  <select className={inputCls} value={difficulty}
                    onChange={e => setDifficulty(e.target.value)}
                    style={{ background: "rgba(255,255,255,0.04)" }}>
                    <option value="easy"   className="bg-[#1a1a2e]">Easy</option>
                    <option value="medium" className="bg-[#1a1a2e]">Medium</option>
                    <option value="hard"   className="bg-[#1a1a2e]">Hard</option>
                  </select>
                </Field>

                <Field label="Tag">
                  <select className={inputCls} value={tags}
                    onChange={e => setTags(e.target.value)}
                    style={{ background: "rgba(255,255,255,0.04)" }}>
                    <option value="array"      className="bg-[#1a1a2e]">Array</option>
                    <option value="linkedList" className="bg-[#1a1a2e]">Linked List</option>
                    <option value="graph"      className="bg-[#1a1a2e]">Graph</option>
                    <option value="dp"         className="bg-[#1a1a2e]">DP</option>
                    <option value="string"     className="bg-[#1a1a2e]">String</option>
                    <option value="tree"       className="bg-[#1a1a2e]">Tree</option>
                  </select>
                </Field>
              </div>
            </Section>

            {/* ── Visible Test Cases ── */}
            <Section title="Visible test cases">
              {visibleTestCases.map((tc, i) => (
                <div key={i} className="mb-4 p-4 rounded-xl relative"
                  style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-semibold uppercase tracking-widest text-white/30">
                      Test case {i + 1}
                    </span>
                    {visibleTestCases.length > 1 && (
                      <button type="button" onClick={() => removeVisible(i)}
                        className="text-red-400/60 hover:text-red-400 transition-colors">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="text-[10px] uppercase tracking-widest text-white/25 mb-1 block">Input</label>
                      <textarea rows={3} placeholder="nums = [2,7,11,15], target = 9"
                        className={textareaCls} value={tc.input}
                        onChange={e => updateVisible(i, 'input', e.target.value)} />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-widest text-white/25 mb-1 block">Output</label>
                      <textarea rows={3} placeholder="[0,1]"
                        className={textareaCls} value={tc.output}
                        onChange={e => updateVisible(i, 'output', e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-white/25 mb-1 block">Explanation</label>
                    <input type="text" placeholder="Because nums[0] + nums[1] == 9"
                      className={inputCls} value={tc.explanation}
                      onChange={e => updateVisible(i, 'explanation', e.target.value)} />
                  </div>
                </div>
              ))}
              <button type="button" onClick={addVisible}
                className="flex items-center gap-2 text-[12px] text-purple-400 hover:text-purple-300 transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Add visible test case
              </button>
            </Section>

            {/* ── Hidden Test Cases ── */}
            <Section title="Hidden test cases">
              {hiddenTestCases.map((tc, i) => (
                <div key={i} className="mb-4 p-4 rounded-xl"
                  style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-semibold uppercase tracking-widest text-white/30">
                      Test case {i + 1}
                    </span>
                    {hiddenTestCases.length > 1 && (
                      <button type="button" onClick={() => removeHidden(i)}
                        className="text-red-400/60 hover:text-red-400 transition-colors">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] uppercase tracking-widest text-white/25 mb-1 block">Input</label>
                      <textarea rows={3} placeholder="nums = [3,2,4], target = 6"
                        className={textareaCls} value={tc.input}
                        onChange={e => updateHidden(i, 'input', e.target.value)} />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-widest text-white/25 mb-1 block">Output</label>
                      <textarea rows={3} placeholder="[1,2]"
                        className={textareaCls} value={tc.output}
                        onChange={e => updateHidden(i, 'output', e.target.value)} />
                    </div>
                  </div>
                </div>
              ))}
              <button type="button" onClick={addHidden}
                className="flex items-center gap-2 text-[12px] text-purple-400 hover:text-purple-300 transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Add hidden test case
              </button>
            </Section>

            {/* ── Start Code ── */}
            <Section title="Starter code">
              <p className="text-[12px] text-white/30 -mt-3 mb-4">
                The template shown to users when they open the problem.
              </p>
              {LANGUAGES.map(lang => (
                <Field key={lang} label={lang}>
                  <textarea rows={6} placeholder={`// ${lang} starter code`}
                    className={textareaCls + " font-mono text-[13px]"}
                    value={startCode.find(s => s.language === lang)?.initialCode || ''}
                    onChange={e => updateStartCode(lang, e.target.value)} />
                </Field>
              ))}
            </Section>

            {/* ── Reference Solutions ── */}
            <Section title="Reference solutions">
              <p className="text-[12px] text-white/30 -mt-3 mb-4">
                Must pass all visible test cases — validated on save.
              </p>
              {LANGUAGES.map(lang => (
                <Field key={lang} label={lang}>
                  <textarea rows={8} placeholder={`// ${lang} complete solution`}
                    className={textareaCls + " font-mono text-[13px]"}
                    value={referenceSolution.find(s => s.language === lang)?.completeCode || ''}
                    onChange={e => updateSolution(lang, e.target.value)} />
                </Field>
              ))}
            </Section>

            {/* ── Submit ── */}
            <div className="flex items-center gap-4 mt-8 pb-12">
              <button type="submit" disabled={submitting}
                className="px-8 py-3 rounded-xl text-white text-sm font-semibold
                  transition-all hover:opacity-85 active:scale-[.98] disabled:opacity-40 cursor-pointer"
                style={{ background: "linear-gradient(135deg,#7c5ce9,#4a9cf6)" }}>
                {submitting
                  ? <span className="flex items-center gap-2">
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                      </svg>
                      Validating & saving…
                    </span>
                  : "Update problem →"
                }
              </button>

              <button type="button" onClick={() => navigate('/admin')}
                className="px-8 py-3 rounded-xl text-[13px] text-white/40
                  hover:text-white/70 transition-colors">
                Cancel
              </button>
            </div>

          </form>
        </div>
      </div>
    </>
  );
}
