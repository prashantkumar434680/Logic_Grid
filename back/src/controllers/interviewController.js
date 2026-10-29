const InterviewSession = require('../Models/InterviewSession');
const Problem = require('../Models/Problem');
const User = require('../Models/User');
const { getLanguageById, submitBatch, submitToken } = require('../utils/problemUtility');
const { generateOpeningQuestion, generateInterviewerResponse } = require('../services/interviewAiService');
const { evaluateInterviewSession } = require('../services/interviewEvaluationService');

/**
 * Sanitizes problem statement for candidate (removes hidden test cases)
 */
const sanitizeProblemForCandidate = (problem, targetLanguage = 'javascript') => {
  if (!problem) return null;
  const aliases = {
    cpp: ['C++', 'c++'],
    'c++': ['C++', 'c++'],
    java: ['Java', 'java'],
    javascript: ['JavaScript', 'Javascript', 'javascript', 'js'],
    python: ['Python', 'python', 'Python3', 'python3'],
  }[targetLanguage.toLowerCase()] || ['JavaScript', 'javascript'];

  const startCodeObj = (problem.startCode || []).find((sc) => aliases.includes(sc.language));
  const starterCode = startCodeObj?.initialCode || `// Write your ${targetLanguage} solution here\n`;

  return {
    _id: problem._id,
    title: problem.title,
    description: problem.description,
    difficulty: problem.difficulty,
    tags: problem.tags,
    visibleTestCases: problem.visibleTestCases || [],
    starterCode,
  };
};

/**
 * Create a new interview session
 */
const createInterviewSession = async (req, res) => {
  try {
    const userId = req.result._id;
    const {
      mode = 'strict',
      difficulty = 'medium',
      durationMinutes = 45,
      problemCount = 1,
      topics = [],
      language = 'javascript',
      targetRole = 'Software Development Engineer',
    } = req.body;

    const validatedDuration = Math.max(15, Math.min(90, Number(durationMinutes) || 45));
    const validatedCount = Math.max(1, Math.min(3, Number(problemCount) || 1));

    // Check if user already has an active session
    const existingActive = await InterviewSession.findOne({
      userId,
      status: 'in_progress',
      expiresAt: { $gt: new Date() },
    });

    if (existingActive) {
      return res.status(200).json({
        message: 'Resuming existing active interview session.',
        session: existingActive,
        isExisting: true,
      });
    }

    // Problem query filter
    const query = {};
    if (difficulty && difficulty !== 'any') {
      query.difficulty = difficulty.toLowerCase();
    }
    if (Array.isArray(topics) && topics.length > 0) {
      query.tags = { $in: topics };
    }

    let candidateProblems = await Problem.find(query).limit(validatedCount * 3);

    // Fallback if specific tags + difficulty combination returned insufficient problems
    if (candidateProblems.length < validatedCount) {
      const fallbackQuery = difficulty && difficulty !== 'any' ? { difficulty: difficulty.toLowerCase() } : {};
      const fallbackProblems = await Problem.find(fallbackQuery).limit(validatedCount * 2);
      candidateProblems = [...candidateProblems, ...fallbackProblems];
    }

    // Absolute fallback to any problems in DB
    if (candidateProblems.length === 0) {
      candidateProblems = await Problem.find({}).limit(validatedCount);
    }

    if (candidateProblems.length === 0) {
      return res.status(404).json({
        message: 'No coding problems available in the platform to configure an interview. Please add problems first.',
      });
    }

    // Shuffle and pick
    const shuffled = candidateProblems.sort(() => 0.5 - Math.random());
    const selectedProblems = shuffled.slice(0, validatedCount);

    const now = new Date();
    const expiresAt = new Date(now.getTime() + validatedDuration * 60 * 1000);

    const firstProblem = selectedProblems[0];
    const initialGreeting = await generateOpeningQuestion({
      problem: firstProblem,
      mode,
      targetRole,
      difficulty,
    });

    const sessionProblems = selectedProblems.map((p, idx) => {
      const sanitized = sanitizeProblemForCandidate(p, language);
      return {
        problemId: p._id,
        order: idx,
        status: idx === 0 ? 'in_progress' : 'unattempted',
        code: sanitized.starterCode,
        language,
        testCasesPassed: 0,
        testCasesTotal: (p.visibleTestCases || []).length + (p.hiddenTestCases || []).length,
      };
    });

    const newSession = await InterviewSession.create({
      userId,
      mode,
      difficulty,
      durationMinutes: validatedDuration,
      targetRole,
      language,
      topics,
      problems: sessionProblems,
      currentProblemIndex: 0,
      status: 'in_progress',
      startTime: now,
      expiresAt,
      conversation: [
        {
          role: 'interviewer',
          type: 'question',
          content: initialGreeting,
          timestamp: now,
        },
      ],
    });

    return res.status(201).json({
      message: 'Interview session initialized successfully.',
      session: newSession,
      currentProblem: sanitizeProblemForCandidate(firstProblem, language),
    });
  } catch (err) {
    console.error('Error creating interview session:', err);
    return res.status(500).json({ message: err.message || 'Failed to initialize interview session.' });
  }
};

/**
 * Get active session for authenticated user
 */
const getActiveSession = async (req, res) => {
  try {
    const userId = req.result._id;
    const session = await InterviewSession.findOne({
      userId,
      status: 'in_progress',
    }).populate('problems.problemId');

    if (!session) {
      return res.status(200).json({ activeSession: null });
    }

    // Check server-side expiration
    if (new Date(session.expiresAt) <= new Date()) {
      session.status = 'completed';
      session.endTime = new Date();

      // Trigger background evaluation
      const problems = session.problems.map((p) => p.problemId).filter(Boolean);
      session.evaluation = await evaluateInterviewSession(session, problems);
      await session.save();

      return res.status(200).json({
        activeSession: null,
        expiredSessionId: session._id,
        message: 'Your previous interview timer expired and was finalized.',
      });
    }

    const currentProblemDoc = session.problems[session.currentProblemIndex]?.problemId;
    const sanitizedCurrent = currentProblemDoc
      ? sanitizeProblemForCandidate(currentProblemDoc, session.language)
      : null;

    return res.status(200).json({
      activeSession: session,
      currentProblem: sanitizedCurrent,
      timeRemainingSeconds: Math.max(0, Math.floor((new Date(session.expiresAt) - Date.now()) / 1000)),
    });
  } catch (err) {
    console.error('Error getting active session:', err);
    return res.status(500).json({ message: 'Failed to retrieve active session.' });
  }
};

/**
 * Get session by ID
 */
const getSessionById = async (req, res) => {
  try {
    const userId = req.result._id;
    const { id } = req.params;

    const session = await InterviewSession.findOne({ _id: id, userId }).populate('problems.problemId');
    if (!session) {
      return res.status(404).json({ message: 'Interview session not found or unauthorized.' });
    }

    // Auto-complete if expired
    if (session.status === 'in_progress' && new Date(session.expiresAt) <= new Date()) {
      session.status = 'completed';
      session.endTime = new Date();
      const problems = session.problems.map((p) => p.problemId).filter(Boolean);
      session.evaluation = await evaluateInterviewSession(session, problems);
      await session.save();
    }

    const currentProblemDoc = session.problems[session.currentProblemIndex]?.problemId;
    const sanitizedCurrent = currentProblemDoc
      ? sanitizeProblemForCandidate(currentProblemDoc, session.language)
      : null;

    return res.status(200).json({
      session,
      currentProblem: sanitizedCurrent,
      timeRemainingSeconds: Math.max(0, Math.floor((new Date(session.expiresAt) - Date.now()) / 1000)),
    });
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Failed to fetch session.' });
  }
};

/**
 * Candidate sends response to AI interviewer
 */
const respondToInterviewer = async (req, res) => {
  try {
    const userId = req.result._id;
    const { id } = req.params;
    const { message, currentCode } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ message: 'Candidate message is required.' });
    }

    const session = await InterviewSession.findOne({ _id: id, userId, status: 'in_progress' }).populate(
      'problems.problemId'
    );
    if (!session) {
      return res.status(404).json({ message: 'Active session not found.' });
    }

    // Check timer
    if (new Date(session.expiresAt) <= new Date()) {
      return res.status(403).json({ message: 'Interview session time has expired.' });
    }

    // Record candidate message
    session.conversation.push({
      role: 'candidate',
      type: 'message',
      content: message.trim(),
      timestamp: new Date(),
    });

    // Update code state for current problem
    if (currentCode && session.problems[session.currentProblemIndex]) {
      session.problems[session.currentProblemIndex].code = currentCode;
    }

    const currentProb = session.problems[session.currentProblemIndex]?.problemId;

    // Generate adaptive interviewer response
    const interviewerReply = await generateInterviewerResponse({
      session,
      problem: currentProb,
      candidateMessage: message.trim(),
      currentCode: currentCode || session.problems[session.currentProblemIndex]?.code,
    });

    session.conversation.push({
      role: 'interviewer',
      type: interviewerReply.type || 'followup',
      content: interviewerReply.content,
      timestamp: new Date(),
    });

    await session.save();

    return res.status(200).json({
      conversation: session.conversation,
    });
  } catch (err) {
    console.error('Error in respondToInterviewer:', err);
    return res.status(500).json({ message: err.message || 'Failed to process interviewer response.' });
  }
};

/**
 * Run candidate code on visible test cases via Judge0
 */
const runSessionCode = async (req, res) => {
  try {
    const userId = req.result._id;
    const { id } = req.params;
    let { code, language } = req.body;

    const session = await InterviewSession.findOne({ _id: id, userId, status: 'in_progress' }).populate(
      'problems.problemId'
    );
    if (!session) {
      return res.status(404).json({ message: 'Active session not found.' });
    }

    if (new Date(session.expiresAt) <= new Date()) {
      return res.status(403).json({ message: 'Interview session time has expired.' });
    }

    const currentProb = session.problems[session.currentProblemIndex]?.problemId;
    if (!currentProb) {
      return res.status(404).json({ message: 'Problem not found in session.' });
    }

    if (!currentProb.visibleTestCases || currentProb.visibleTestCases.length === 0) {
      return res.status(400).json({ message: 'No visible test cases available for this problem.' });
    }

    const languageId = getLanguageById(language || session.language);
    const submissionsPayload = currentProb.visibleTestCases.map((tc) => ({
      source_code: code,
      language_id: languageId,
      stdin: tc.input,
      expected_output: tc.output,
    }));

    const batchRes = await submitBatch(submissionsPayload);
    const tokens = batchRes.map((v) => v.token);
    const testResults = await submitToken(tokens);

    let testCasesPassed = 0;
    let runtime = 0;
    let memory = 0;
    let status = 'passed';
    let errorMessage = null;

    testResults.forEach((t) => {
      if (t.status_id === 3) {
        testCasesPassed += 1;
        runtime += parseFloat(t.time) || 0;
        memory = Math.max(memory, t.memory || 0);
      } else {
        status = t.status_id === 4 ? 'wrong_answer' : 'runtime_error';
        errorMessage = t.stderr || t.compile_output || t.status?.description;
      }
    });

    const isAllPassed = testCasesPassed === currentProb.visibleTestCases.length;

    // Record submission event
    session.submissions.push({
      problemId: currentProb._id,
      code,
      language: language || session.language,
      action: 'run',
      status: isAllPassed ? 'passed' : status,
      testCasesPassed,
      testCasesTotal: currentProb.visibleTestCases.length,
      runtime,
      memory,
      errorMessage,
      timestamp: new Date(),
    });

    // Update problem code in session
    if (session.problems[session.currentProblemIndex]) {
      session.problems[session.currentProblemIndex].code = code;
      session.problems[session.currentProblemIndex].lastExecutionStatus = isAllPassed ? 'passed' : status;
    }

    // Trigger interviewer reaction
    const interviewerReply = await generateInterviewerResponse({
      session,
      problem: currentProb,
      candidateMessage: '',
      currentCode: code,
      codeExecutionEvent: {
        action: 'run',
        passed: testCasesPassed,
        total: currentProb.visibleTestCases.length,
        status: isAllPassed ? 'passed' : status,
        error: errorMessage,
      },
    });

    session.conversation.push({
      role: 'interviewer',
      type: interviewerReply.type || 'feedback',
      content: interviewerReply.content,
      timestamp: new Date(),
    });

    await session.save();

    return res.status(200).json({
      runResult: {
        allPassed: isAllPassed,
        testCasesPassed,
        totalTestCases: currentProb.visibleTestCases.length,
        runtime,
        memory,
        errorMessage,
        testResults: testResults.map((t, idx) => ({
          caseIndex: idx + 1,
          passed: t.status_id === 3,
          stdin: currentProb.visibleTestCases[idx]?.input,
          expected_output: currentProb.visibleTestCases[idx]?.output,
          stdout: t.stdout,
          error: t.stderr || t.compile_output,
        })),
      },
      conversation: session.conversation,
    });
  } catch (err) {
    console.error('Error running code in interview session:', err);
    return res.status(500).json({ message: err.message || 'Code execution failed.' });
  }
};

/**
 * Submit candidate solution on hidden test cases via Judge0
 */
const submitSessionCode = async (req, res) => {
  try {
    const userId = req.result._id;
    const { id } = req.params;
    let { code, language } = req.body;

    const session = await InterviewSession.findOne({ _id: id, userId, status: 'in_progress' }).populate(
      'problems.problemId'
    );
    if (!session) {
      return res.status(404).json({ message: 'Active session not found.' });
    }

    if (new Date(session.expiresAt) <= new Date()) {
      return res.status(403).json({ message: 'Interview session time has expired.' });
    }

    const currentProb = session.problems[session.currentProblemIndex]?.problemId;
    if (!currentProb) {
      return res.status(404).json({ message: 'Problem not found in session.' });
    }

    if (!currentProb.hiddenTestCases || currentProb.hiddenTestCases.length === 0) {
      return res.status(400).json({ message: 'No hidden test cases configured for this problem.' });
    }

    const languageId = getLanguageById(language || session.language);
    const submissionsPayload = currentProb.hiddenTestCases.map((tc) => ({
      source_code: code,
      language_id: languageId,
      stdin: tc.input,
      expected_output: tc.output,
    }));

    const batchRes = await submitBatch(submissionsPayload);
    const tokens = batchRes.map((v) => v.token);
    const testResults = await submitToken(tokens);

    let testCasesPassed = 0;
    let runtime = 0;
    let memory = 0;
    let status = 'accepted';
    let errorMessage = null;

    testResults.forEach((t) => {
      if (t.status_id === 3) {
        testCasesPassed += 1;
        runtime += parseFloat(t.time) || 0;
        memory = Math.max(memory, t.memory || 0);
      } else {
        status = t.status_id === 4 ? 'wrong' : 'error';
        errorMessage = t.stderr || t.compile_output || t.status?.description;
      }
    });

    const isAccepted = status === 'accepted' && testCasesPassed === currentProb.hiddenTestCases.length;

    // Record submission event
    session.submissions.push({
      problemId: currentProb._id,
      code,
      language: language || session.language,
      action: 'submit',
      status: isAccepted ? 'accepted' : status,
      testCasesPassed,
      testCasesTotal: currentProb.hiddenTestCases.length,
      runtime,
      memory,
      errorMessage,
      timestamp: new Date(),
    });

    // Update problem status in session
    if (session.problems[session.currentProblemIndex]) {
      session.problems[session.currentProblemIndex].code = code;
      session.problems[session.currentProblemIndex].status = isAccepted ? 'solved' : 'failed';
      session.problems[session.currentProblemIndex].testCasesPassed = testCasesPassed;
      session.problems[session.currentProblemIndex].testCasesTotal = currentProb.hiddenTestCases.length;
      session.problems[session.currentProblemIndex].runtime = runtime;
      session.problems[session.currentProblemIndex].memory = memory;
      session.problems[session.currentProblemIndex].lastExecutionStatus = isAccepted ? 'accepted' : status;
    }

    // If accepted, add to user's solved problems if not already present
    if (isAccepted) {
      const userDoc = await User.findById(userId);
      if (userDoc && !userDoc.problemSolved.some((pid) => pid.toString() === currentProb._id.toString())) {
        userDoc.problemSolved.push(currentProb._id);
        await userDoc.save();
      }
    }

    // Trigger interviewer reaction
    const interviewerReply = await generateInterviewerResponse({
      session,
      problem: currentProb,
      candidateMessage: '',
      currentCode: code,
      codeExecutionEvent: {
        action: 'submit',
        passed: testCasesPassed,
        total: currentProb.hiddenTestCases.length,
        status: isAccepted ? 'accepted' : status,
        error: errorMessage,
      },
    });

    session.conversation.push({
      role: 'interviewer',
      type: interviewerReply.type || 'feedback',
      content: interviewerReply.content,
      timestamp: new Date(),
    });

    await session.save();

    return res.status(200).json({
      submitResult: {
        accepted: isAccepted,
        passedTestCases: testCasesPassed,
        totalTestCases: currentProb.hiddenTestCases.length,
        runtime,
        memory,
        errorMessage,
      },
      conversation: session.conversation,
      problemStatus: isAccepted ? 'solved' : 'failed',
    });
  } catch (err) {
    console.error('Error submitting code in interview session:', err);
    return res.status(500).json({ message: err.message || 'Submission failed.' });
  }
};

/**
 * Navigate to next problem in session
 */
const nextProblemInSession = async (req, res) => {
  try {
    const userId = req.result._id;
    const { id } = req.params;

    const session = await InterviewSession.findOne({ _id: id, userId, status: 'in_progress' }).populate(
      'problems.problemId'
    );
    if (!session) {
      return res.status(404).json({ message: 'Active session not found.' });
    }

    if (session.currentProblemIndex + 1 >= session.problems.length) {
      return res.status(400).json({ message: 'No more problems remaining in this interview session.' });
    }

    session.currentProblemIndex += 1;
    const nextProb = session.problems[session.currentProblemIndex]?.problemId;

    if (session.problems[session.currentProblemIndex].status === 'unattempted') {
      session.problems[session.currentProblemIndex].status = 'in_progress';
    }

    const greeting = await generateOpeningQuestion({
      problem: nextProb,
      mode: session.mode,
      targetRole: session.targetRole,
      difficulty: session.difficulty,
    });

    session.conversation.push({
      role: 'interviewer',
      type: 'question',
      content: `### Moving to Problem ${session.currentProblemIndex + 1} of ${session.problems.length}\n\n${greeting}`,
      timestamp: new Date(),
    });

    await session.save();

    return res.status(200).json({
      session,
      currentProblem: sanitizeProblemForCandidate(nextProb, session.language),
      conversation: session.conversation,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Failed to advance to next problem.' });
  }
};

/**
 * Complete interview session and generate final evaluation report
 */
const completeInterviewSession = async (req, res) => {
  try {
    const userId = req.result._id;
    const { id } = req.params;

    const session = await InterviewSession.findOne({ _id: id, userId }).populate('problems.problemId');
    if (!session) {
      return res.status(404).json({ message: 'Session not found.' });
    }

    session.status = 'completed';
    session.endTime = new Date();

    const problems = session.problems.map((p) => p.problemId).filter(Boolean);
    session.evaluation = await evaluateInterviewSession(session, problems);

    await session.save();

    return res.status(200).json({
      message: 'Interview session completed successfully.',
      session,
      evaluation: session.evaluation,
    });
  } catch (err) {
    console.error('Error completing interview session:', err);
    return res.status(500).json({ message: err.message || 'Failed to complete interview session.' });
  }
};

/**
 * Abandon interview session
 */
const abandonInterviewSession = async (req, res) => {
  try {
    const userId = req.result._id;
    const { id } = req.params;

    const session = await InterviewSession.findOne({ _id: id, userId });
    if (!session) {
      return res.status(404).json({ message: 'Session not found.' });
    }

    session.status = 'abandoned';
    session.endTime = new Date();
    await session.save();

    return res.status(200).json({ message: 'Interview session abandoned.' });
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Failed to abandon session.' });
  }
};

/**
 * Get interview history for authenticated user
 */
const getInterviewHistory = async (req, res) => {
  try {
    const userId = req.result._id;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(20, Math.max(1, parseInt(req.query.limit) || 10));

    const totalSessions = await InterviewSession.countDocuments({ userId });
    const sessions = await InterviewSession.find({ userId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select('_id mode difficulty durationMinutes targetRole language status startTime endTime evaluation createdAt problems')
      .populate('problems.problemId', 'title difficulty tags');

    return res.status(200).json({
      sessions,
      pagination: {
        page,
        limit,
        totalSessions,
        totalPages: Math.ceil(totalSessions / limit),
      },
    });
  } catch (err) {
    console.error('Error fetching interview history:', err);
    return res.status(500).json({ message: 'Failed to fetch interview history.' });
  }
};

module.exports = {
  createInterviewSession,
  getActiveSession,
  getSessionById,
  respondToInterviewer,
  runSessionCode,
  submitSessionCode,
  nextProblemInSession,
  completeInterviewSession,
  abandonInterviewSession,
  getInterviewHistory,
};
