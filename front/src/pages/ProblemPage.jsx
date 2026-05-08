import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import Editor from '@monaco-editor/react';
import { useParams } from 'react-router';
import axiosClient from "../utils/axiosClient"
import ChatAi from '../components/ChatAi';
import SubmissionHistory from '../components/SubmissionHistory';
import ProblemInteraction from '../components/ProblemInteraction';

const ProblemPage = () => {
  const [problem,          setProblem]          = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState('javascript');
  const [code,             setCode]             = useState('');
  const [loading,          setLoading]          = useState(false);
  const [runResult,        setRunResult]        = useState(null);
  const [submitResult,     setSubmitResult]     = useState(null);
  const [activeLeftTab,    setActiveLeftTab]    = useState('description');
  const [activeRightTab,   setActiveRightTab]   = useState('code');
  const editorRef = useRef(null);
  const { problemId } = useParams();
  const { handleSubmit } = useForm();

  const getLanguageAliases = (language) => {
    const aliases = {
      cpp: ['C++'],
      java: ['Java'],
      javascript: ['JavaScript', 'Javascript'],
    };

    return aliases[language] || [];
  };

  const getInitialCode = (startCode = [], language) => {
    const aliases = getLanguageAliases(language);
    return startCode.find((sc) => aliases.includes(sc.language))?.initialCode || '';
  };

  // ── Fetch problem on mount ──────────────────────────────────────────
  useEffect(() => {
    const fetchProblem = async () => {
      setLoading(true);
      try {
        const response = await axiosClient.get(`/problem/problemById/${problemId}`);
        const initialCode = getInitialCode(response.data.startCode, selectedLanguage);

        setProblem(response.data);
        setCode(initialCode);
        setLoading(false);

      } catch (error) {
        // console.error('Error fetching problem:', error);
        setLoading(false);
      }
    };

    fetchProblem();
  }, [problemId]);

  // ── Update code when language changes ───────────────────────────────
  useEffect(() => {
    if (!problem) return;

    const initialCode = getInitialCode(problem.startCode, selectedLanguage);

    setCode(initialCode);
  }, [selectedLanguage, problem]);

  // ── Handlers ────────────────────────────────────────────────────────

  const handleEditorChange = (value) => setCode(value || '');

  const handleEditorDidMount = (editor) => { editorRef.current = editor; };

  const handleLanguageChange = (language) => setSelectedLanguage(language);

  const handleRun = async () => {
    setLoading(true);
    setRunResult(null);
    try {
      const response = await axiosClient.post(`/submission/run/${problemId}`, {
        code,
        language: selectedLanguage
      });
      setRunResult(response.data);
      setActiveRightTab('testcase');
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.response?.data ||
        error.message ||
        'Internal server error';
      setRunResult({ success: false, error: message, testCases: [] });
      setActiveRightTab('testcase');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitCode = async () => {
    setLoading(true);
    setSubmitResult(null);
    try {
      const response = await axiosClient.post(`/submission/submit/${problemId}`, {
        code,
        language: selectedLanguage
      });
      setSubmitResult(response.data);
      setActiveRightTab('result');
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.response?.data ||
        error.message ||
        'Internal server error';
      setSubmitResult({
        accepted: false,
        error: message,
        passedTestCases: 0,
        totalTestCases: 0,
      });
      setActiveRightTab('result');
    } finally {
      setLoading(false);
    }
  };

  const getLanguageForMonaco = (lang) => {
    const monacoMap = {
      javascript: 'javascript',
      java:       'java',
      cpp:        'cpp',
    };
    return monacoMap[lang] || 'javascript';
  };

  const getDifficultyColor = (difficulty) => {
    const colors = {
      easy:   'text-green-500',
      medium: 'text-yellow-500',
      hard:   'text-red-500',
    };
    return colors[difficulty] || 'text-gray-500';
  };

  // ── Loading screen ──────────────────────────────────────────────────

  if (loading && !problem) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  // ── Render ──────────────────────────────────────────────────────────

  return (
    <div className="h-screen flex bg-base-100">

      {/* ── Left Panel ── */}
      <div className="w-1/2 flex flex-col border-r border-base-300">

        {/* Tabs */}
        <div className="tabs tabs-bordered bg-base-200 px-4">
          {['description', 'editorial', 'solutions', 'submissions','ChatAI'].map(tab => (
            <button
              key={tab}
              className={`tab ${activeLeftTab === tab ? 'tab-active' : ''}`}
              onClick={() => setActiveLeftTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {problem && (
            <>
              {/* Description */}
              {activeLeftTab === 'description' && (
                <div>
                  <div className="flex items-center gap-4 mb-6">
                    <h1 className="text-2xl font-bold">{problem.title}</h1>
                    <div className={`badge badge-outline ${getDifficultyColor(problem.difficulty)}`}>
                      {problem.difficulty.charAt(0).toUpperCase() + problem.difficulty.slice(1)}
                    </div>
                    <div className="badge badge-primary">{problem.tags}</div>
                  </div>

                  <div className="prose max-w-none">
                    <div className="whitespace-pre-wrap text-sm leading-relaxed">
                      {problem.description}
                    </div>
                  </div>

                  <div className="mt-8">
                    <h3 className="text-lg font-semibold mb-4">Examples:</h3>
                    <div className="space-y-4">
                      {problem.visibleTestCases.map((example, index) => (
                        <div key={index} className="bg-base-200 p-4 rounded-lg">
                          <h4 className="font-semibold mb-2">Example {index + 1}:</h4>
                          <div className="space-y-2 text-sm font-mono">
                            <div><strong>Input:</strong> {example.input}</div>
                            <div><strong>Output:</strong> {example.output}</div>
                            <div><strong>Explanation:</strong> {example.explanation}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Like and Comment Section */}
                  <ProblemInteraction problemId={problemId} />
                </div>
              )}

              {/* Editorial */}
              {activeLeftTab === 'editorial' && (
                <div className="prose max-w-none">
                  <h2 className="text-xl font-bold mb-4">Editorial</h2>
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">
                    Editorial is here for the problem
                  </div>
                </div>
              )}

              {/* Solutions */}
              {activeLeftTab === 'solutions' && (
                <div>
                  <h2 className="text-xl font-bold mb-4">Solutions</h2>
                  <div className="space-y-6">
                    {problem.referenceSolution?.map((solution, index) => (
                      <div key={index} className="border border-base-300 rounded-lg">
                        <div className="bg-base-200 px-4 py-2 rounded-t-lg">
                          <h3 className="font-semibold">
                            {problem.title} — {solution.language}
                          </h3>
                        </div>
                        <div className="p-4">
                          <pre className="bg-base-300 p-4 rounded text-sm overflow-x-auto">
                            <code>{solution.completeCode}</code>
                          </pre>
                        </div>
                      </div>
                    )) || (
                      <p className="text-gray-500">
                        Solutions will be available after you solve the problem.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Submissions */}
              {activeLeftTab === 'submissions' && (
                <div>
                  <h2 className="text-xl font-bold mb-4">My Submissions</h2>
                  <SubmissionHistory problemId={problemId} />
                </div>
              )}

              {/* ChatAI */}
              {activeLeftTab === 'ChatAI' && (
                <div>
                  <h2 className="text-xl font-bold mb-4">ChatAI</h2>
                  <div className="text-gray-500">
                    {<ChatAi problem={problem}/>}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Right Panel ── */}
      <div className="w-1/2 flex flex-col">

        {/* Tabs */}
        <div className="tabs tabs-bordered bg-base-200 px-4">
          {['code', 'testcase', 'result'].map(tab => (
            <button
              key={tab}
              className={`tab ${activeRightTab === tab ? 'tab-active' : ''}`}
              onClick={() => setActiveRightTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col">

          {/* Code tab */}
          {activeRightTab === 'code' && (
            <div className="flex-1 flex flex-col">

              {/* Language selector */}
              <div className="flex justify-between items-center p-4 border-b border-base-300">
                <div className="flex gap-2">
                  {['javascript', 'java', 'cpp'].map(lang => (
                    <button
                      key={lang}
                      className={`btn btn-sm ${selectedLanguage === lang ? 'btn-primary' : 'btn-ghost'}`}
                      onClick={() => handleLanguageChange(lang)}
                    >
                      {lang === 'cpp' ? 'C++' : lang === 'javascript' ? 'JavaScript' : 'Java'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Monaco editor */}
              <div className="flex-1">
                <Editor
                  height="100%"
                  language={getLanguageForMonaco(selectedLanguage)}
                  value={code}
                  onChange={handleEditorChange}
                  onMount={handleEditorDidMount}
                  theme="vs-dark"
                  options={{
                    fontSize:              14,
                    minimap:               { enabled: false },
                    scrollBeyondLastLine:  false,
                    automaticLayout:       true,
                    tabSize:               2,
                    insertSpaces:          true,
                    wordWrap:              'on',
                    lineNumbers:           'on',
                    glyphMargin:           false,
                    folding:               true,
                    lineDecorationsWidth:  10,
                    lineNumbersMinChars:   3,
                    renderLineHighlight:   'line',
                    selectOnLineNumbers:   true,
                    roundedSelection:      false,
                    readOnly:              false,
                    cursorStyle:           'line',
                    mouseWheelZoom:        true,
                  }}
                />
              </div>

              {/* Run / Submit buttons */}
              <div className="p-4 border-t border-base-300 flex justify-between">
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => setActiveRightTab('testcase')}
                >
                  Console
                </button>
                <div className="flex gap-2">
                  <button
                    className={`btn btn-outline btn-sm ${loading ? 'loading' : ''}`}
                    onClick={handleRun}
                    disabled={loading}
                  >
                    Run
                  </button>
                  <button
                    className={`btn btn-primary btn-sm ${loading ? 'loading' : ''}`}
                    onClick={handleSubmitCode}
                    disabled={loading}
                  >
                    Submit
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Testcase tab */}
          {activeRightTab === 'testcase' && (
            <div className="flex-1 p-4 overflow-y-auto">
              <h3 className="font-semibold mb-4">Test Results</h3>
              {runResult ? (
                <div className={`alert ${runResult.success ? 'alert-success' : 'alert-error'} mb-4`}>
                  <div>
                    {runResult.success ? (
                      <div>
                        <h4 className="font-bold">✅ All test cases passed!</h4>
                        <p className="text-sm mt-2">Runtime: {runResult.runtime} sec</p>
                        <p className="text-sm">Memory: {runResult.memory} KB</p>
                        <div className="mt-4 space-y-2">
                          {(runResult.testCases || []).map((tc, i) => (
                            <div key={i} className="bg-base-100 p-3 rounded text-xs">
                              <div className="font-mono">
                                <div><strong>Input:</strong>    {tc.stdin}</div>
                                <div><strong>Expected:</strong> {tc.expected_output}</div>
                                <div><strong>Output:</strong>   {tc.stdout}</div>
                                <div className="text-green-600">✓ Passed</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div>
                        <h4 className="font-bold">❌ {runResult.error || 'Some test cases failed'}</h4>
                        <div className="mt-4 space-y-2">
                          {(runResult.testCases || []).map((tc, i) => (
                            <div key={i} className="bg-base-100 p-3 rounded text-xs">
                              <div className="font-mono">
                                <div><strong>Input:</strong>    {tc.stdin}</div>
                                <div><strong>Expected:</strong> {tc.expected_output}</div>
                                <div><strong>Output:</strong>   {tc.stdout}</div>
                                <div className={tc.status_id === 3 ? 'text-green-600' : 'text-red-600'}>
                                  {tc.status_id === 3 ? '✓ Passed' : '✗ Failed'}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-gray-500">
                  Click "Run" to test your code with the example test cases.
                </div>
              )}
            </div>
          )}

          {/* Result tab */}
          {activeRightTab === 'result' && (
            <div className="flex-1 p-4 overflow-y-auto">
              <h3 className="font-semibold mb-4">Submission Result</h3>
              {submitResult ? (
                <div className={`alert ${submitResult.accepted ? 'alert-success' : 'alert-error'}`}>
                  <div>
                    {submitResult.accepted ? (
                      <div>
                        <h4 className="font-bold text-lg">🎉 Accepted</h4>
                        <div className="mt-4 space-y-2">
                          <p>Test Cases Passed: {submitResult.passedTestCases}/{submitResult.totalTestCases}</p>
                          <p>Runtime: {submitResult.runtime} sec</p>
                          <p>Memory: {submitResult.memory} KB</p>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <h4 className="font-bold text-lg">❌ {submitResult.error}</h4>
                        <div className="mt-4 space-y-2">
                          <p>Test Cases Passed: {submitResult.passedTestCases}/{submitResult.totalTestCases}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-gray-500">
                  Click "Submit" to submit your solution for evaluation.
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default ProblemPage;
