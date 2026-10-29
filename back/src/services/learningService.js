const { retrieveGroundedContext } = require('./retrievalService');
const Problem = require('../Models/Problem');
const { calculateUserDsaAnalytics, normalizeTopicTag } = require('./skillAnalyticsService');

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
 * Determines skill tier based on mastery percentage
 */
const getSkillTier = (mastery = 0) => {
  if (mastery < 45) return 'Beginner';
  if (mastery < 75) return 'Intermediate';
  return 'Advanced';
};

/**
 * Generates an educational concept explanation grounded in book passages
 */
const generateConceptExplanation = async ({
  userId,
  topic,
  language = 'c++',
  customPrompt = null,
}) => {
  // 1. Fetch user skill analytics for this topic
  let userTier = 'Beginner';
  let topicAnalytics = null;
  try {
    const analytics = await calculateUserDsaAnalytics(userId);
    topicAnalytics = analytics.topicWise.find((t) => t.topicKey === topic);
    if (topicAnalytics) {
      userTier = getSkillTier(topicAnalytics.estimatedMastery);
    }
  } catch (err) {
    console.warn('Analytics calculation fallback:', err.message);
  }

  // 2. Fetch related coding problems from LOGIC Grid database
  const normalizedTag = normalizeTopicTag(topic);
  const relatedProblems = await Problem.find({
    $or: [{ tags: normalizedTag }, { tags: topic }],
  })
    .select('_id title difficulty tags description')
    .limit(4);

  // 3. Retrieve relevant grounded book passages
  const retrieval = await retrieveGroundedContext({
    topic,
    query: customPrompt || `Fundamental concepts, implementation, and intuition for ${topic}`,
    topK: 4,
    minRelevance: 0.38,
  });

  // 4. Construct prompt for Gemini
  const problemsSummary = relatedProblems.map((p) => `- "${p.title}" (${p.difficulty})`).join('\n');

  const systemInstruction = `
You are an expert Data Structures & Algorithms professor and tutor at LOGIC Grid.
Your goal is to explain the topic "${topic}" in an intuitive, rigorous, and beginner-friendly manner, grounded strictly in the retrieved textbook passages.

USER CONTEXT:
- Demonstated Skill Level: ${userTier}
- Target Programming Language: ${language}
- Mastery Score: ${topicAnalytics?.estimatedMastery ?? 0}%
- Status in Platform: ${topicAnalytics?.status ?? 'Practicing'}

${retrieval.contextString}

TEACHING INSTRUCTIONS:
1. Explain at the user's ${userTier} level.
   - For Beginners: use vivid everyday analogies, explain any technical jargon before using it, keep examples small and concrete.
   - For Intermediate/Advanced: emphasize invariant conditions, pointer transitions, algorithmic patterns, and optimization trade-offs.
2. Ground your explanations in the retrieved book passages. Reference specific book concepts and page numbers when available.
3. If the retrieved textbook passages DO NOT contain sufficient information about this topic, explicitly state:
   "⚠️ Note: The uploaded DSA textbook does not contain sufficient material on this specific topic. The explanation below is provided via general algorithmic knowledge."
   Do NOT invent or fabricate page numbers or citations.
4. Structure your response clearly using the following EXACT markdown sections:
   ### 1. Intuition (Everyday Analogy)
   ### 2. Core Algorithmic Concept
   ### 3. Step-by-Step Example
   ### 4. Visual Dry Run (Track variables step-by-step)
   ### 5. Pseudocode
   ### 6. Clean Implementation in ${language}
   ### 7. Time & Space Complexity Analysis
   ### 8. Common Pitfalls & Edge Cases
   ### 9. Recommended Practice Problems on LOGIC Grid:
   ${problemsSummary || 'Explore problem library'}
   ### 10. Book Grounding & References
`;

  const userMessage = customPrompt
    ? `Please explain ${topic} focusing on: ${customPrompt}. Provide full code in ${language}.`
    : `Please give me a complete, structured explanation of ${topic} suited for my ${userTier} level in ${language}.`;

  let explanationText = '';

  const apiKey = process.env.GEMINI_KEY;
  if (apiKey) {
    try {
      const GenAI = await getGoogleGenAI();
      if (GenAI) {
        const ai = new GenAI({ apiKey });
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [{ role: 'user', parts: [{ text: userMessage }] }],
          config: {
            systemInstruction,
          },
        });
        explanationText = response?.text || '';
      }
    } catch (err) {
      console.warn('Gemini API error during explanation:', err.message);
    }
  }

  // Fallback template if API was unavailable
  if (!explanationText) {
    explanationText = generateFallbackExplanation(topic, language, userTier, relatedProblems, retrieval);
  }

  return {
    topic,
    userSkillTier: userTier,
    selectedLanguage: language,
    hasSufficientEvidence: retrieval.hasSufficientEvidence,
    warningMessage: retrieval.warningMessage,
    explanation: explanationText,
    citations: retrieval.citations,
    recommendedProblems: relatedProblems.map((p) => ({
      _id: p._id,
      title: p.title,
      difficulty: p.difficulty,
      tags: p.tags,
    })),
  };
};

/**
 * Handles conversational follow-up questions
 */
const continueLearningSession = async ({
  userId,
  topic,
  language = 'c++',
  messages = [],
  currentQuery = '',
}) => {
  // Retrieve relevant passages for new query
  const retrieval = await retrieveGroundedContext({
    topic,
    query: currentQuery,
    topK: 3,
    minRelevance: 0.35,
  });

  const systemInstruction = `
You are an interactive DSA Tutor at LOGIC Grid.
The current topic under discussion is "${topic}".
Code should be provided in "${language}" unless the user explicitly asks for another language.
Ground your answers in the following book passages when applicable:
${retrieval.contextString}

RULES:
- Answer the user's specific follow-up question directly, clearly, and concisely.
- If asked for a dry run, trace variables line by line in a clear table or bullet points.
- If asked for code, provide clean, idiomatic, well-commented ${language} code.
- If the question is outside DSA, gently guide the user back to Data Structures & Algorithms.
`;

  // Bounded conversation history (last 8 messages)
  const boundedHistory = messages.slice(-8).map((m) => ({
    role: m.role === 'user' ? 'user' : 'model',
    parts: [{ text: m.content || m.text || '' }],
  }));

  boundedHistory.push({
    role: 'user',
    parts: [{ text: currentQuery }],
  });

  let replyText = '';
  const apiKey = process.env.GEMINI_KEY;
  if (apiKey) {
    try {
      const GenAI = await getGoogleGenAI();
      if (GenAI) {
        const ai = new GenAI({ apiKey });
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: boundedHistory,
          config: {
            systemInstruction,
          },
        });
        replyText = response?.text || '';
      }
    } catch (err) {
      console.warn('Gemini chat follow-up error:', err.message);
    }
  }

  if (!replyText) {
    replyText = `### ${topic} Clarification\n\nRegarding your question: "${currentQuery}"\n\nIn ${topic}, pay special attention to pointer boundaries and edge cases. In ${language}, ensure your loop terminators and termination conditions prevent infinite loops or out-of-bounds indices.\n\n*Check the cited book passages for formal mathematical proofs.*`;
  }

  return {
    reply: replyText,
    citations: retrieval.citations,
    hasSufficientEvidence: retrieval.hasSufficientEvidence,
  };
};

/**
 * Fallback structured generator if LLM key is unavailable or offline
 */
const generateFallbackExplanation = (topic, language, tier, relatedProblems, retrieval) => {
  const problemsList = relatedProblems.map((p) => `- [${p.title}](/problem/${p._id}) (${p.difficulty})`).join('\n');
  const citationsList = retrieval.citations.length > 0
    ? retrieval.citations.map((c) => `- **${c.bookTitle}**, Chapter: ${c.chapter}, Section: ${c.section}, ${c.pageRange}`).join('\n')
    : '_No uploaded book passages were directly indexed for this topic._';

  return `
### 1. Intuition (Everyday Analogy)
Think of **${topic}** like searching for a word in an organized dictionary or navigating through a sequential checklist. Instead of examining every possibility blindly, we leverage structural invariants to rapidly narrow down our problem space.

### 2. Core Algorithmic Concept
The fundamental premise of **${topic}** is maintaining well-defined boundaries and state transitions. At each iteration or recursive call, the input space shrinks by a guaranteed factor, leading to optimal time complexity.

### 3. Step-by-Step Example
Consider an example input where we process elements sequentially while maintaining pointers:
1. Initialize pointers \`left = 0\` and \`right = n - 1\`.
2. Compute pivot or midpoint: \`mid = left + (right - left) / 2\`.
3. Check target condition against \`mid\`.
4. Adjust boundary based on evaluation.

### 4. Visual Dry Run
| Step | Variables State | Condition Evaluated | Action Taken |
| :--- | :--- | :--- | :--- |
| 1 | \`left = 0, right = 4\` | \`left <= right\` | Examined index 2 |
| 2 | \`left = 3, right = 4\` | Target in upper partition | Adjusted \`left = mid + 1\` |
| 3 | \`left = 3, right = 3\` | Match confirmed | Terminate loop successfully |

### 5. Pseudocode
\`\`\`text
function solveProblem(input):
    initialize state variables
    while condition is valid:
        evaluate candidate
        if target reached: return candidate
        advance boundaries
    return default
\`\`\`

### 6. Clean Implementation in ${language}
\`\`\`${language}
// Standard ${topic} implementation in ${language}
#include <iostream>
#include <vector>

int solve${topic}(const std::vector<int>& arr, int target) {
    int left = 0;
    int right = arr.size() - 1;
    
    while (left <= right) {
        int mid = left + (right - left) / 2;
        if (arr[mid] == target) {
            return mid; // Target found
        } else if (arr[mid] < target) {
            left = mid + 1; // Narrow to right half
        } else {
            right = mid - 1; // Narrow to left half
        }
    }
    return -1; // Not found
}
\`\`\`

### 7. Time & Space Complexity Analysis
- **Time Complexity:** $\\mathcal{O}(\\log N)$ or $\\mathcal{O}(N)$ depending on traversal structure.
- **Space Complexity:** $\\mathcal{O}(1)$ auxiliary space for iterative solutions; $\\mathcal{O}(\\log N)$ call stack frames for recursion.

### 8. Common Pitfalls & Edge Cases
- **Integer Overflow:** Use \`mid = left + (right - left) / 2\` instead of \`(left + right) / 2\`.
- **Infinite Loops:** Ensure loop invariant strictly decrements the search interval.
- **Off-by-One Boundaries:** Differentiate carefully between \`< \` and \`<= \`.

### 9. Recommended Practice Problems on LOGIC Grid
${problemsList || '- Explore problems in problem list'}

### 10. Book Grounding & References
${citationsList}
`.trim();
};

module.exports = {
  generateConceptExplanation,
  continueLearningSession,
  getSkillTier,
};
