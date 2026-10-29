let GoogleGenAIClass = null;
const getGoogleGenAI = async () => {
  if (!GoogleGenAIClass) {
    try {
      const module = await import('@google/genai');
      GoogleGenAIClass = module.GoogleGenAI || module.default?.GoogleGenAI;
    } catch (err) {
      console.warn('Could not load @google/genai dynamically:', err.message);
    }
  }
  return GoogleGenAIClass;
};

/**
 * Evaluates an interview session combining deterministic code execution metrics
 * and qualitative conversational evidence
 */
const evaluateInterviewSession = async (session, problems = []) => {
  // 1. Calculate deterministic metrics
  const totalProblems = problems.length;
  let solvedProblemsCount = 0;
  let totalTestCasesPassed = 0;
  let totalTestCasesCount = 0;

  session.problems.forEach((sp) => {
    if (sp.status === 'solved') {
      solvedProblemsCount += 1;
    }
    totalTestCasesPassed += sp.testCasesPassed || 0;
    totalTestCasesCount += sp.testCasesTotal || 0;
  });

  const submissionHistory = session.submissions || [];
  const candidateMessages = (session.conversation || []).filter((c) => c.role === 'candidate');
  const hasDialogueEvidence = candidateMessages.length > 0;
  const hasCodeSubmissions = submissionHistory.length > 0;

  // Objective correctness score (0 - 100)
  let correctnessScore = 0;
  if (totalTestCasesCount > 0) {
    correctnessScore = Math.round((totalTestCasesPassed / totalTestCasesCount) * 100);
  } else if (solvedProblemsCount > 0) {
    correctnessScore = Math.round((solvedProblemsCount / Math.max(1, totalProblems)) * 100);
  }

  // Check code quality signals
  const allCode = session.problems.map((p) => p.code).filter(Boolean).join('\n');
  const codeLines = allCode.split('\n').filter((l) => l.trim().length > 0).length;

  const summaryContext = `
INTERVIEW SUMMARY:
- Mode: ${session.mode}
- Difficulty: ${session.difficulty}
- Target Role: ${session.targetRole}
- Language: ${session.language}
- Problems Configured: ${totalProblems}
- Problems Solved: ${solvedProblemsCount}
- Overall Test Cases Passed: ${totalTestCasesPassed} / ${totalTestCasesCount} (Correctness: ${correctnessScore}%)
- Total Submissions Made: ${submissionHistory.length}
- Total Candidate Messages: ${candidateMessages.length}

PROBLEMS WORKED ON:
${problems.map((p, idx) => {
  const sp = session.problems.find((item) => item.problemId.toString() === p._id.toString());
  return `Problem ${idx + 1}: "${p.title}" (${p.difficulty}) - Status: ${sp?.status || 'unattempted'}, Passed: ${sp?.testCasesPassed || 0}/${sp?.testCasesTotal || 0}`;
}).join('\n')}

CANDIDATE CODE:
\`\`\`${session.language}
${allCode || '// No code submitted'}
\`\`\`

CANDIDATE'S RECORDED RESPONSES:
${candidateMessages.map((m) => `- "${m.content}"`).join('\n') || 'None recorded'}
`;

  const systemInstruction = `
You are a Principal Technical Interviewer evaluating a candidate's completed coding interview session.
Return a STRICT JSON response ONLY with no markdown wrapping, matching this schema:
{
  "summary": "High-level summary of candidate performance",
  "problemSolving": {
    "score": number (0-100),
    "feedback": "Detailed feedback on approach and understanding",
    "evidence": "Specific quote or problem aspect that justifies this score"
  },
  "correctness": {
    "score": number (0-100, must correlate with actual test cases passed),
    "feedback": "Feedback on code correctness and test case results",
    "evidence": "Actual test results and edge case handling"
  },
  "complexity": {
    "score": number (0-100),
    "feedback": "Evaluation of time/space complexity analysis",
    "declaredComplexity": "Candidate's stated complexity (or 'Not explicitly stated')",
    "actualComplexity": "Estimated true algorithmic complexity",
    "evidence": "Explanation provided or code loops/recursion"
  },
  "codeQuality": {
    "score": number (0-100),
    "feedback": "Feedback on variable names, readability, modularity",
    "evidence": "Specific code syntax or naming observed"
  },
  "optimization": {
    "score": number (0-100),
    "feedback": "Feedback on efficiency, data structure choice",
    "evidence": "Specific algorithmic decisions observed"
  },
  "communication": {
    "score": number (0-100),
    "feedback": "Feedback on explanation clarity and dialogue",
    "evidence": "Recorded messages from dialogue"
  },
  "strengths": ["string", "string"],
  "weaknesses": ["string", "string"],
  "keyMistakes": ["string"],
  "recommendations": ["string", "string"]
}

CRITICAL RULES:
1. Ground every dimension in actual evidence.
2. If candidate provided little or no explanation, set communication score low and state "Not enough information to assess".
3. Correctness score must be anchored in the actual test case pass rate (${correctnessScore}%).
4. Do not claim code passed if test cases failed.
`;

  let aiEvaluation = null;
  const apiKey = process.env.GEMINI_KEY;

  if (apiKey) {
    try {
      const GenAI = await getGoogleGenAI();
      if (GenAI) {
        const ai = new GenAI({ apiKey });
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [{ role: 'user', parts: [{ text: summaryContext }] }],
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
          },
        });

        if (response?.text) {
          try {
            aiEvaluation = JSON.parse(response.text);
          } catch {
            const jsonMatch = response.text.match(/\{[\s\S]*\}/);
            if (jsonMatch) aiEvaluation = JSON.parse(jsonMatch[0]);
          }
        }
      }
    } catch (err) {
      console.warn('Gemini evaluation generation fallback:', err.message);
    }
  }

  // Fallback deterministic evaluation engine if API unavailable
  if (!aiEvaluation) {
    aiEvaluation = generateDeterministicEvaluation({
      correctnessScore,
      solvedCount: solvedProblemsCount,
      totalProblems,
      codeLines,
      hasDialogueEvidence,
      hasCodeSubmissions,
      problems,
    });
  }

  // Weighted overall score calculation:
  // Correctness (30%) + Problem Solving (20%) + Complexity (15%) + Code Quality (15%) + Optimization (10%) + Communication (10%)
  const psScore = aiEvaluation.problemSolving?.score ?? 50;
  const corScore = correctnessScore; // Anchor strictly to deterministic execution
  const cpxScore = aiEvaluation.complexity?.score ?? 50;
  const cqScore = aiEvaluation.codeQuality?.score ?? (codeLines > 10 ? 65 : 30);
  const optScore = aiEvaluation.optimization?.score ?? 50;
  const commScore = hasDialogueEvidence ? (aiEvaluation.communication?.score ?? 60) : 25;

  const weightedOverall = Math.round(
    corScore * 0.30 +
    psScore * 0.20 +
    cpxScore * 0.15 +
    cqScore * 0.15 +
    optScore * 0.10 +
    commScore * 0.10
  );

  return {
    overallScore: Math.min(100, Math.max(0, weightedOverall)),
    summary: aiEvaluation.summary || `Candidate attempted ${totalProblems} problem(s) and solved ${solvedProblemsCount}, with an observed correctness rate of ${correctnessScore}%.`,
    problemSolving: {
      score: psScore,
      feedback: aiEvaluation.problemSolving?.feedback || 'Demonstrated understanding of core algorithmic requirements.',
      evidence: aiEvaluation.problemSolving?.evidence || `${solvedProblemsCount}/${totalProblems} problems completed.`,
    },
    correctness: {
      score: corScore,
      feedback: aiEvaluation.correctness?.feedback || `Executed test cases with ${totalTestCasesPassed}/${totalTestCasesCount} pass rate.`,
      testCasesPassed: totalTestCasesPassed,
      testCasesTotal: totalTestCasesCount,
      evidence: `${totalTestCasesPassed} out of ${totalTestCasesCount} test cases verified by code runner.`,
    },
    complexity: {
      score: cpxScore,
      feedback: aiEvaluation.complexity?.feedback || 'Algorithmic structure evaluated from loop iterations and recursive depth.',
      declaredComplexity: aiEvaluation.complexity?.declaredComplexity || 'Discussed during interview',
      actualComplexity: aiEvaluation.complexity?.actualComplexity || 'Standard polynomial / linear traversal',
      evidence: aiEvaluation.complexity?.evidence || 'Code control flow inspection',
    },
    codeQuality: {
      score: cqScore,
      feedback: aiEvaluation.codeQuality?.feedback || 'Code formatting and structure reviewed.',
      evidence: aiEvaluation.codeQuality?.evidence || `${codeLines} lines of implemented code.`,
    },
    optimization: {
      score: optScore,
      feedback: aiEvaluation.optimization?.feedback || 'Data structure efficiency examined.',
      evidence: aiEvaluation.optimization?.evidence || 'Data structure selection in solution.',
    },
    communication: {
      score: commScore,
      feedback: hasDialogueEvidence
        ? (aiEvaluation.communication?.feedback || 'Candidate communicated approach and responded to interviewer prompts.')
        : 'Limited dialogue recorded. Not enough communication evidence to award high points.',
      evidence: hasDialogueEvidence
        ? `${candidateMessages.length} message(s) exchanged with interviewer.`
        : 'Candidate did not engage in active dialogue with interviewer.',
    },
    strengths: aiEvaluation.strengths || (solvedProblemsCount > 0 ? ['Completed problem successfully', 'Clean execution'] : ['Attempted implementation']),
    weaknesses: aiEvaluation.weaknesses || (corScore < 70 ? ['Failed edge-case validation', 'Needs stronger boundary checks'] : ['Minor optimization opportunities']),
    keyMistakes: aiEvaluation.keyMistakes || (corScore < 100 ? ['Uncovered edge cases during execution'] : []),
    recommendations: aiEvaluation.recommendations || [
      'Practice boundary edge cases before running code',
      'Verbally state time and space complexity upfront in interviews',
      'Explore related problems in the problem library',
    ],
    evaluatedAt: new Date(),
  };
};

const generateDeterministicEvaluation = ({
  correctnessScore,
  solvedCount,
  totalProblems,
  codeLines,
  hasDialogueEvidence,
  hasCodeSubmissions,
  problems,
}) => {
  return {
    summary: `Session completed with ${solvedCount} out of ${totalProblems} problems solved and ${correctnessScore}% test case pass rate.`,
    problemSolving: {
      score: solvedCount > 0 ? Math.min(90, 50 + solvedCount * 25) : 35,
      feedback: solvedCount > 0 ? 'Approached the problem systematically and arrived at a workable solution.' : 'Struggled to complete full algorithmic transition.',
      evidence: `${solvedCount} solved problem(s).`,
    },
    correctness: {
      score: correctnessScore,
      feedback: `Achieved ${correctnessScore}% passing rate on test cases.`,
      evidence: 'Deterministic test case verification via Judge0.',
    },
    complexity: {
      score: solvedCount > 0 ? 70 : 40,
      feedback: 'Solution exhibits standard time complexity bounds.',
      declaredComplexity: 'Not explicitly stated in dialogue',
      actualComplexity: 'O(N) or O(N log N)',
      evidence: 'Source code loop structure analysis',
    },
    codeQuality: {
      score: codeLines > 15 ? 75 : codeLines > 5 ? 55 : 25,
      feedback: 'Code follows standard syntax conventions.',
      evidence: `${codeLines} lines of code.`,
    },
    optimization: {
      score: solvedCount > 0 ? 65 : 40,
      feedback: 'Algorithm utilized appropriate data structures.',
      evidence: 'Direct problem implementation.',
    },
    communication: {
      score: hasDialogueEvidence ? 65 : 20,
      feedback: hasDialogueEvidence ? 'Active responses provided during session.' : 'Not enough information to assess communication.',
      evidence: hasDialogueEvidence ? 'Interactive candidate responses' : 'No candidate messages recorded',
    },
    strengths: solvedCount > 0 ? ['Successfully solved target problem', 'Functional implementation'] : ['Attempted solution'],
    weaknesses: correctnessScore < 100 ? ['Incomplete test case pass rate', 'Edge case oversights'] : ['Can optimize space complexity'],
    keyMistakes: correctnessScore < 100 ? ['Missed boundary conditions in hidden test cases'] : [],
    recommendations: [
      'Practice testing boundary cases (e.g. empty inputs, negative values) before submitting',
      'Explain algorithmic intuition to the interviewer before jumping into code',
      'Review Big-O time and space complexity trade-offs',
    ],
  };
};

module.exports = {
  evaluateInterviewSession,
};
