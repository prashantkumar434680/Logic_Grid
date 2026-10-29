import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import axiosClient from '../utils/axiosClient';
import { Send, Copy, Check, BookOpen, AlertCircle, Sparkles, X, ChevronRight, Terminal, RefreshCw } from 'lucide-react';

const CopyButton = ({ text }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="p-1.5 hover:bg-slate-700/60 rounded text-slate-400 hover:text-cyan-400 transition-colors"
      title="Copy code"
    >
      {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
    </button>
  );
};

const formatMarkdown = (content) => {
  if (!content) return null;
  const parts = content.split(/(```[\s\S]*?```)/);

  return parts.map((part, idx) => {
    if (part.startsWith('```')) {
      const match = part.match(/```(\w*)\n?([\s\S]*?)```/);
      const language = match?.[1] || 'code';
      const code = match?.[2] || part;

      return (
        <div key={idx} className="my-4 rounded-xl overflow-hidden bg-[#0a0f1d] border border-cyan-500/20 shadow-lg">
          <div className="flex justify-between items-center bg-slate-900/80 px-4 py-2 border-b border-slate-800">
            <span className="text-xs font-mono font-medium text-cyan-400 uppercase tracking-wider">{language}</span>
            <CopyButton text={code} />
          </div>
          <pre className="p-4 overflow-x-auto font-mono text-xs md:text-sm text-slate-200 leading-relaxed">
            <code>{code.trim()}</code>
          </pre>
        </div>
      );
    }

    return (
      <div key={idx} className="space-y-2 text-slate-300 leading-relaxed text-sm md:text-base">
        {part.split('\n\n').map((paragraph, pIdx) => {
          if (paragraph.startsWith('###')) {
            return (
              <h4 key={pIdx} className="text-lg font-bold text-cyan-300 mt-6 mb-2 flex items-center gap-2 border-b border-white/5 pb-1">
                <span className="text-cyan-400 text-sm">▶</span>
                {paragraph.replace(/^###\s*/, '')}
              </h4>
            );
          }
          if (paragraph.startsWith('##')) {
            return (
              <h3 key={pIdx} className="text-xl font-bold text-white mt-8 mb-3 flex items-center gap-2">
                {paragraph.replace(/^##\s*/, '')}
              </h3>
            );
          }

          // Table handling
          if (paragraph.includes('|') && paragraph.includes('\n|')) {
            const rows = paragraph.split('\n').filter((r) => r.trim().startsWith('|'));
            if (rows.length >= 2) {
              const headers = rows[0].split('|').map((c) => c.trim()).filter(Boolean);
              const dataRows = rows.slice(2).map((r) => r.split('|').map((c) => c.trim()).filter(Boolean));

              return (
                <div key={pIdx} className="my-4 overflow-x-auto rounded-lg border border-slate-800 bg-slate-900/40">
                  <table className="min-w-full text-xs md:text-sm text-left">
                    <thead className="bg-slate-800/80 text-cyan-300 border-b border-slate-700">
                      <tr>
                        {headers.map((h, hIdx) => (
                          <th key={hIdx} className="px-3 py-2 font-semibold">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-300">
                      {dataRows.map((r, rIdx) => (
                        <tr key={rIdx} className="hover:bg-slate-800/40">
                          {r.map((cell, cIdx) => (
                            <td key={cIdx} className="px-3 py-2 font-mono text-xs">{cell}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            }
          }

          let formatted = paragraph.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>');
          formatted = formatted.replace(/\*(.*?)\*/g, '<em class="text-cyan-200/90">$1</em>');
          formatted = formatted.replace(/`([^`]+)`/g, '<code class="bg-cyan-950/40 text-cyan-300 px-1.5 py-0.5 rounded text-xs font-mono border border-cyan-800/40">$1</code>');
          formatted = formatted.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" class="text-cyan-400 hover:underline inline-flex items-center gap-1 font-medium">$1</a>');

          return <p key={pIdx} dangerouslySetInnerHTML={{ __html: formatted }} />;
        })}
      </div>
    );
  });
};

export default function DsaLearningAssistant({ topic, initialReason, onClose }) {
  const navigate = useNavigate();
  const [language, setLanguage] = useState('c++');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [queryInput, setQueryInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef(null);

  const fetchExplanation = async (selectedLang = language) => {
    try {
      setLoading(true);
      const res = await axiosClient.post('/learning/explain', {
        topic: topic?.topicKey || topic,
        language: selectedLang,
      });
      setData(res.data);
      setChatHistory([]);
    } catch (err) {
      console.error('Failed to load concept explanation:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (topic) {
      fetchExplanation(language);
    }
  }, [topic]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, chatLoading]);

  const handleSendFollowUp = async (textToSend) => {
    const text = textToSend || queryInput;
    if (!text.trim() || chatLoading) return;

    setQueryInput('');
    const newHistory = [...chatHistory, { role: 'user', content: text }];
    setChatHistory(newHistory);
    setChatLoading(true);

    try {
      const res = await axiosClient.post('/learning/chat', {
        topic: topic?.topicKey || topic,
        language,
        messages: newHistory,
        currentQuery: text,
      });

      setChatHistory([
        ...newHistory,
        {
          role: 'model',
          content: res.data.reply,
          citations: res.data.citations || [],
        },
      ]);
    } catch (err) {
      setChatHistory([
        ...newHistory,
        {
          role: 'model',
          content: `⚠️ Error fetching response: ${err.response?.data?.message || err.message}`,
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const quickPrompts = [
    '💡 Explain with a simpler everyday analogy',
    '🔍 Show a step-by-step variable dry run',
    '⚠️ What are common boundary & edge-case errors?',
    '⚡ Explain time and space complexity with proofs',
    `💻 Show this solution in ${language === 'python' ? 'C++' : 'Python'}`,
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-5xl h-[92vh] flex flex-col bg-[#070c17] border border-cyan-500/30 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-gradient-to-r from-slate-900 via-[#0b1426] to-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Sparkles size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white tracking-tight">
                  {topic?.topicLabel || topic}
                </h2>
                {data?.userSkillTier && (
                  <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                    {data.userSkillTier} Tier
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">Personalized DSA Tutor • Grounded in Textbook Knowledge</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Language Selector */}
            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700/80 rounded-lg px-2 py-1">
              <Terminal size={14} className="text-slate-400" />
              <select
                value={language}
                onChange={(e) => {
                  setLanguage(e.target.value);
                  fetchExplanation(e.target.value);
                }}
                className="bg-transparent text-xs text-cyan-300 font-mono focus:outline-none cursor-pointer"
              >
                <option value="c++" className="bg-slate-900 text-white">C++</option>
                <option value="python" className="bg-slate-900 text-white">Python</option>
                <option value="java" className="bg-slate-900 text-white">Java</option>
                <option value="javascript" className="bg-slate-900 text-white">JavaScript</option>
              </select>
            </div>

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Body Container */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 custom-scrollbar">
          {/* Recommendation Banner */}
          {initialReason && (
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-cyan-950/30 border border-cyan-500/20 text-cyan-200 text-xs md:text-sm">
              <span className="text-cyan-400 font-bold mt-0.5">🎯</span>
              <div>
                <span className="font-semibold text-white">Why this was recommended: </span>
                {initialReason}
              </div>
            </div>
          )}

          {/* Book Citations Bar */}
          {data?.citations && data.citations.length > 0 ? (
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="flex items-center gap-2 mb-2.5 text-xs font-semibold text-slate-300 uppercase tracking-wider">
                <BookOpen size={15} className="text-cyan-400" />
                <span>Textbook Passages Grounding This Lesson</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {data.citations.map((c, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0c1629] border border-cyan-500/20 text-xs text-slate-200"
                  >
                    <span className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center text-[10px] font-bold">
                      {idx + 1}
                    </span>
                    <span className="font-medium text-white">{c.bookTitle}</span>
                    <span className="text-slate-400">• {c.chapter} ({c.pageRange})</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            data && !data.hasSufficientEvidence && (
              <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs">
                <AlertCircle size={16} className="text-amber-400 mt-0.5 shrink-0" />
                <div>
                  <span className="font-semibold text-amber-300">Book Grounding Limitation: </span>
                  {data.warningMessage || 'The indexed textbook does not currently have passages dedicated to this topic. Explaining using general algorithmic principles.'}
                </div>
              </div>
            )
          )}

          {/* Main Lesson Content */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <div className="w-12 h-12 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-slate-400 text-sm">Retrieving book passages and crafting personalized explanation…</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="prose prose-invert max-w-none">
                {formatMarkdown(data?.explanation)}
              </div>

              {/* Related Coding Problems Section */}
              {data?.recommendedProblems && data.recommendedProblems.length > 0 && (
                <div className="mt-8 pt-6 border-t border-white/10">
                  <h4 className="text-base font-bold text-white mb-3 flex items-center gap-2">
                    <span>⚡</span> Practice Problems for {topic?.topicLabel || topic}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {data.recommendedProblems.map((prob) => (
                      <button
                        key={prob._id}
                        onClick={() => navigate(`/problem/${prob._id}`)}
                        className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/50 hover:bg-slate-800/80 border border-white/5 hover:border-cyan-500/30 text-left transition-all group cursor-pointer"
                      >
                        <div>
                          <p className="font-semibold text-sm text-slate-100 group-hover:text-cyan-400 transition-colors">
                            {prob.title}
                          </p>
                          <span
                            className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                              prob.difficulty === 'easy'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                : prob.difficulty === 'medium'
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                                : 'bg-red-500/10 text-red-400 border border-red-500/30'
                            }`}
                          >
                            {prob.difficulty}
                          </span>
                        </div>
                        <ChevronRight size={18} className="text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Chat / Follow-up Discussion Area */}
              {chatHistory.length > 0 && (
                <div className="mt-8 pt-6 border-t border-white/10 space-y-4">
                  <h4 className="text-sm font-bold text-cyan-400 uppercase tracking-wider">
                    Follow-Up Discussion
                  </h4>
                  {chatHistory.map((msg, i) => (
                    <div
                      key={i}
                      className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl p-4 text-sm ${
                          msg.role === 'user'
                            ? 'bg-cyan-600/20 border border-cyan-500/30 text-white rounded-br-none'
                            : 'bg-slate-900 border border-white/10 text-slate-200 rounded-bl-none shadow-lg'
                        }`}
                      >
                        {formatMarkdown(msg.content)}
                      </div>
                    </div>
                  ))}

                  {chatLoading && (
                    <div className="flex gap-3 justify-start">
                      <div className="bg-slate-900 border border-white/10 rounded-2xl rounded-bl-none p-4 flex items-center gap-2 text-cyan-400 text-xs">
                        <RefreshCw size={14} className="animate-spin" />
                        <span>Consulting book and thinking…</span>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Prompt Input & Quick Actions */}
        <div className="p-4 border-t border-white/10 bg-slate-900/90 space-y-3">
          {/* Quick Prompts Chips */}
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {quickPrompts.map((p, idx) => (
              <button
                key={idx}
                disabled={loading || chatLoading}
                onClick={() => handleSendFollowUp(p.replace(/^[^\s]+\s*/, ''))}
                className="whitespace-nowrap px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-slate-300 hover:text-cyan-300 transition-all disabled:opacity-50 cursor-pointer"
              >
                {p}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendFollowUp();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={queryInput}
              disabled={loading || chatLoading}
              onChange={(e) => setQueryInput(e.target.value)}
              placeholder={`Ask a follow-up about ${topic?.topicLabel || topic} or request another example…`}
              className="flex-1 bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
            />
            <button
              type="submit"
              disabled={loading || chatLoading || !queryInput.trim()}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium text-sm flex items-center gap-1.5 shadow-lg shadow-cyan-500/20 disabled:opacity-50 transition-all cursor-pointer"
            >
              <span>Ask</span>
              <Send size={15} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
