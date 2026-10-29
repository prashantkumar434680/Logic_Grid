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
 * Generates the interviewer's opening greeting and problem prompt
 */
const generateOpeningQuestion = async ({
  problem,
  mode = 'strict',
  targetRole = 'Software Development Engineer',
  difficulty = 'medium',
}) => {
  const isGuided = mode === 'guided';
  const roleTitle = targetRole || 'Software Development Engineer';

  const defaultGreeting = isGuided
    ? `Welcome to your **Guided Practice Interview** for the **${roleTitle}** role! 👋\n\nI'm your AI Interviewer. We'll be tackling **"${problem.title}"** (${problem.difficulty}).\n\nBefore jumping into code, take a look at the problem description and examples on the left. **Could you briefly explain how you understand the problem, any assumptions you are making, and your initial high-level approach?**\n\n*(Feel free to ask for hints whenever you feel stuck!)*`
    : `Hello and welcome to your **Technical Coding Interview** for the **${roleTitle}** role. 💼\n\nWe will be working on **"${problem.title}"** (${problem.difficulty}).\n\nPlease read through the problem statement carefully. Before writing any code in the editor:\n1. **Clarify any assumptions and constraints.**\n2. **Walk me through your proposed algorithmic approach.**\n3. **State the expected time and space complexity.**\n\nWhenever you are ready, please share your thoughts.`;

  const systemInstruction = `
You are an experienced Principal Software Engineer conducting a real technical coding interview for a ${roleTitle} position.
Current Problem: "${problem.title}" (${problem.difficulty})
Problem Description:
${problem.description}

Interview Mode: ${isGuided ? 'Guided Practice (friendly, supportive, gives hints)' : 'Strict Mock Interview (professional, rigorous, no hints)'}

Your Task:
Generate a concise, professional, warm opening greeting introducing the problem and asking the candidate to state their understanding, assumptions, and proposed approach before coding.
`;

  const apiKey = process.env.GEMINI_KEY;
  if (apiKey) {
    try {
      const GenAI = await getGoogleGenAI();
      if (GenAI) {
        const ai = new GenAI({ apiKey });
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [{ role: 'user', parts: [{ text: 'Generate opening interview message' }] }],
          config: { systemInstruction },
        });
        if (response?.text) {
          return response.text;
        }
      }
    } catch (err) {
      console.warn('Gemini opening question generation fallback:', err.message);
    }
  }

  return defaultGreeting;
};

/**
 * Generates adaptive interviewer reaction to candidate messages or code submission events
 */
const generateInterviewerResponse = async ({
  session,
  problem,
  candidateMessage,
  currentCode,
  codeExecutionEvent = null, // { action: 'run'|'submit', passed, total, status, error }
}) => {
  const isGuided = session.mode === 'guided';
  const isStrict = session.mode === 'strict';

  // Bounded conversation history (last 8 turns)
  const conversationHistory = (session.conversation || []).slice(-8).map((msg) => ({
    role: msg.role === 'candidate' ? 'user' : 'model',
    parts: [{ text: msg.content }],
  }));

  const systemInstruction = `
You are a Staff Software Engineer at LOGIC Grid conducting a live technical interview for a ${session.targetRole || 'Software Engineer'} role.
Interview Mode: ${session.mode.toUpperCase()}
${isStrict ? 'STRICT RULES: Do NOT write code solutions. Do NOT give direct answers or hints. Challenge the candidate on edge cases, invariant conditions, and algorithmic complexity.' : 'GUIDED PRACTICE: Be encouraging. If candidate struggles or asks for help, provide progressive hints and guide them to the right path.'}

CURRENT PROBLEM:
Title: ${problem.title}
Difficulty: ${problem.difficulty}
Description:
${problem.description}

CANDIDATE'S CURRENT CODE (${session.language}):
\`\`\`${session.language}
${currentCode || '// No code written yet'}
\`\`\`

${codeExecutionEvent ? `RECENT CODE EXECUTION EVENT:
Action: ${codeExecutionEvent.action.toUpperCase()}
Execution Status: ${codeExecutionEvent.status}
Passed Test Cases: ${codeExecutionEvent.passed} / ${codeExecutionEvent.total}
Compiler / Runtime Error: ${codeExecutionEvent.error || 'None'}
` : ''}

INTERVIEW GUIDELINES:
1. Stay focused strictly on the current problem.
2. If candidate asks a clarification question, clarify the problem constraints.
3. If candidate explained an approach:
   - Ask for time and space complexity if not provided.
   - If approach is brute force, ask if it can be optimized.
   - If approach is solid, invite them to implement it in the code editor and run the test cases.
4. If code execution failed (run or submit):
   - In Guided Mode: pinpoint the line or condition that might be failing without writing the full fix.
   - In Strict Mode: ask them to inspect what edge cases might cause that status (e.g. empty input, off-by-one).
5. If code execution passed all test cases:
   - Congratulate them.
   - Ask for a final complexity summary and whether any further trade-offs exist before moving to the next problem or completing the interview.
6. Keep replies concise, conversational, and direct (2 to 4 paragraphs max).
`;

  let promptText = candidateMessage;
  if (codeExecutionEvent) {
    if (codeExecutionEvent.action === 'run') {
      promptText = `[Candidate executed Run Code on visible test cases: ${codeExecutionEvent.passed}/${codeExecutionEvent.total} passed. Status: ${codeExecutionEvent.status}. ${codeExecutionEvent.error ? `Error: ${codeExecutionEvent.error}` : ''}] ${candidateMessage ? `Candidate says: "${candidateMessage}"` : 'Please react to this execution result.'}`;
    } else {
      promptText = `[Candidate executed Submit Solution on hidden test cases: ${codeExecutionEvent.passed}/${codeExecutionEvent.total} passed. Status: ${codeExecutionEvent.status}. ${codeExecutionEvent.error ? `Error: ${codeExecutionEvent.error}` : ''}] ${candidateMessage ? `Candidate says: "${candidateMessage}"` : 'Please react to this submission result.'}`;
    }
  }

  conversationHistory.push({
    role: 'user',
    parts: [{ text: promptText }],
  });

  const apiKey = process.env.GEMINI_KEY;
  if (apiKey) {
    try {
      const GenAI = await getGoogleGenAI();
      if (GenAI) {
        const ai = new GenAI({ apiKey });
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: conversationHistory,
          config: { systemInstruction },
        });
        if (response?.text) {
          return {
            content: response.text,
            type: isGuided && promptText.toLowerCase().includes('hint') ? 'hint' : 'followup',
          };
        }
      }
    } catch (err) {
      console.warn('Gemini interviewer response fallback:', err.message);
    }
  }

  // Fallback response generator if API is unavailable or offline
  return generateFallbackInterviewerResponse({
    mode: session.mode,
    problem,
    candidateMessage,
    codeExecutionEvent,
  });
};

const generateFallbackInterviewerResponse = ({
  mode,
  problem,
  candidateMessage,
  codeExecutionEvent,
}) => {
  if (codeExecutionEvent) {
    if (codeExecutionEvent.status === 'accepted' || codeExecutionEvent.passed === codeExecutionEvent.total) {
      return {
        content: `Great job! Your solution passed all test cases (${codeExecutionEvent.passed}/${codeExecutionEvent.total}).\n\nCould you briefly summarize the **time and space complexity** of your implemented solution, and discuss if there are any edge cases you kept in mind?`,
        type: 'feedback',
      };
    } else {
      return {
        content: `I see that ${codeExecutionEvent.passed} out of ${codeExecutionEvent.total} test cases passed (Status: \`${codeExecutionEvent.status}\`).\n\n${codeExecutionEvent.error ? `Here is the error encountered:\n\`\`\`text\n${codeExecutionEvent.error}\n\`\`\`\n` : ''}Take a close look at your loop bounds and boundary conditions. What edge cases might cause this discrepancy?`,
        type: 'followup',
      };
    }
  }

  const lower = (candidateMessage || '').toLowerCase();
  if (lower.includes('hint') && mode === 'guided') {
    return {
      content: `💡 **Hint for "${problem.title}":** Think about the invariant property of the data structure. Can you use two pointers or a hash map to reduce redundant iterations from $\\mathcal{O}(N^2)$ down to $\\mathcal{O}(N)$?`,
      type: 'hint',
    };
  }

  if (lower.includes('complexity') || lower.includes('o(') || lower.includes('time')) {
    return {
      content: `Thanks for breaking down the complexity. That aligns with the expected algorithmic pattern for this class of problems. Go ahead and implement the solution in the editor, and click **Run Code** to test against the visible cases!`,
      type: 'followup',
    };
  }

  return {
    content: `That's an interesting approach. Before finalizing the code, make sure you consider constraints and potential edge cases (like empty arrays or single elements). Whenever you are ready, implement your idea and click **Run Code**!`,
    type: 'followup',
  };
};

module.exports = {
  generateOpeningQuestion,
  generateInterviewerResponse,
};
