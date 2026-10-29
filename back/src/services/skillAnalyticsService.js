const Problem = require('../Models/Problem');
const Submission = require('../Models/submission');
const User = require('../Models/User');

const TOPIC_CONFIG = [
  { key: 'array', label: 'Arrays', targetWeight: 10 },
  { key: 'string', label: 'Strings', targetWeight: 8 },
  { key: 'binarySearch', label: 'Binary Search', targetWeight: 8 },
  { key: 'linkedList', label: 'Linked Lists', targetWeight: 8 },
  { key: 'stackQueue', label: 'Stacks & Queues', targetWeight: 8 },
  { key: 'tree', label: 'Trees & BST', targetWeight: 12 },
  { key: 'graph', label: 'Graphs', targetWeight: 14 },
  { key: 'greedy', label: 'Greedy Algorithms', targetWeight: 10 },
  { key: 'recursionBacktracking', label: 'Recursion & Backtracking', targetWeight: 12 },
  { key: 'dp', label: 'Dynamic Programming', targetWeight: 16 },
];

/**
 * Normalizes problem tag to standard key
 */
const normalizeTopicTag = (tag) => {
  if (!tag) return 'array';
  const clean = String(tag).trim().toLowerCase();
  if (clean.includes('array')) return 'array';
  if (clean.includes('string')) return 'string';
  if (clean.includes('binary') || clean.includes('search')) return 'binarySearch';
  if (clean.includes('list') || clean.includes('linked')) return 'linkedList';
  if (clean.includes('stack') || clean.includes('queue')) return 'stackQueue';
  if (clean.includes('tree')) return 'tree';
  if (clean.includes('graph')) return 'graph';
  if (clean.includes('greedy')) return 'greedy';
  if (clean.includes('recur') || clean.includes('backtrack')) return 'recursionBacktracking';
  if (clean.includes('dp') || clean.includes('dynamic')) return 'dp';
  return 'array';
};

/**
 * Calculates DSA Skill Analytics for a specific user
 */
const calculateUserDsaAnalytics = async (userId) => {
  const user = await User.findById(userId).select('firstName lastName emailId problemSolved');
  if (!user) {
    throw new Error('User not found');
  }

  // Fetch all problems in the system
  const allProblems = await Problem.find({}).select('_id title difficulty tags');
  const problemMap = new Map();
  const topicProblemsMap = new Map();

  TOPIC_CONFIG.forEach((t) => topicProblemsMap.set(t.key, []));

  allProblems.forEach((p) => {
    problemMap.set(p._id.toString(), p);
    const normalizedTag = normalizeTopicTag(p.tags);
    if (!topicProblemsMap.has(normalizedTag)) {
      topicProblemsMap.set(normalizedTag, []);
    }
    topicProblemsMap.get(normalizedTag).push(p);
  });

  // Fetch all submissions by this user
  const submissions = await Submission.find({ userId })
    .sort({ createdAt: 1 })
    .select('problemId status runtime memory createdAt language');

  const totalSubmissions = submissions.length;
  const acceptedSubmissionsCount = submissions.filter((s) => s.status === 'accepted').length;
  const overallSuccessRate =
    totalSubmissions > 0 ? Math.round((acceptedSubmissionsCount / totalSubmissions) * 1000) / 10 : 0;

  // Track unique attempts and solved problems
  const attemptedProblemIds = new Set();
  const solvedProblemIds = new Set();
  const problemAttemptsMap = new Map(); // problemId -> { attempts: count, accepted: count }

  submissions.forEach((s) => {
    const pid = s.problemId?.toString();
    if (!pid) return;
    attemptedProblemIds.add(pid);

    if (!problemAttemptsMap.has(pid)) {
      problemAttemptsMap.set(pid, { attempts: 0, accepted: 0 });
    }
    const current = problemAttemptsMap.get(pid);
    current.attempts += 1;
    if (s.status === 'accepted') {
      current.accepted += 1;
      solvedProblemIds.add(pid);
    }
  });

  // Add any problems marked in user.problemSolved array
  if (Array.isArray(user.problemSolved)) {
    user.problemSolved.forEach((id) => {
      solvedProblemIds.add(id.toString());
      attemptedProblemIds.add(id.toString());
    });
  }

  // Difficulty counts for solved problems
  let easySolved = 0;
  let mediumSolved = 0;
  let hardSolved = 0;

  solvedProblemIds.forEach((pid) => {
    const p = problemMap.get(pid);
    if (p) {
      if (p.difficulty === 'easy') easySolved += 1;
      else if (p.difficulty === 'medium') mediumSolved += 1;
      else if (p.difficulty === 'hard') hardSolved += 1;
    }
  });

  const totalSolvedUnique = solvedProblemIds.size;
  const totalAttemptedUnique = attemptedProblemIds.size;

  // Topic-wise analysis
  const topicAnalytics = TOPIC_CONFIG.map((topicCfg) => {
    const topicKey = topicCfg.key;
    const availableProblems = topicProblemsMap.get(topicKey) || [];
    const totalInPlatform = availableProblems.length;

    let attemptedUnique = 0;
    let solvedUnique = 0;
    let totalAttempts = 0;
    let acceptedAttempts = 0;
    let tEasy = 0;
    let tMedium = 0;
    let tHard = 0;

    availableProblems.forEach((p) => {
      const pid = p._id.toString();
      if (attemptedProblemIds.has(pid)) {
        attemptedUnique += 1;
      }
      if (solvedProblemIds.has(pid)) {
        solvedUnique += 1;
        if (p.difficulty === 'easy') tEasy += 1;
        else if (p.difficulty === 'medium') tMedium += 1;
        else if (p.difficulty === 'hard') tHard += 1;
      }

      const stats = problemAttemptsMap.get(pid);
      if (stats) {
        totalAttempts += stats.attempts;
        acceptedAttempts += stats.accepted;
      }
    });

    const topicSuccessRate =
      totalAttempts > 0 ? Math.round((acceptedAttempts / totalAttempts) * 1000) / 10 : 0;

    // Explainable Mastery Calculation:
    // Difficulty weight earned
    const earnedWeight = tEasy * 1 + tMedium * 2 + tHard * 3;
    const targetWeight = topicCfg.targetWeight || 10;
    const weightFactor = Math.min(1, earnedWeight / targetWeight);

    const solveRate = attemptedUnique > 0 ? solvedUnique / attemptedUnique : 0;
    const accuracyRate = totalAttempts > 0 ? acceptedAttempts / totalAttempts : 0;

    // Base estimated mastery percentage (0 - 100)
    let estimatedMastery = 0;
    if (attemptedUnique > 0) {
      estimatedMastery = Math.round(
        (0.45 * solveRate + 0.3 * accuracyRate + 0.25 * weightFactor) * 100
      );
    }

    // Status classification:
    // "Do not classify a topic as weak merely because the user has not practiced it.
    // Use an 'Insufficient Practice' status when evidence is insufficient."
    let status = 'insufficient_practice';
    let recommendationReason = '';

    if (attemptedUnique < 2 && solvedUnique < 2) {
      status = 'insufficient_practice';
      recommendationReason = `You have only attempted ${attemptedUnique} problem(s) in ${topicCfg.label}. Practice at least 2 problems to establish your skill baseline.`;
    } else if (estimatedMastery < 50 || topicSuccessRate < 40) {
      status = 'weak';
      recommendationReason = `Demonstrated mastery is ${estimatedMastery}% with ${topicSuccessRate}% success rate over ${totalAttempts} submissions. Targeted practice will improve core fundamentals.`;
    } else if (estimatedMastery >= 75 && solvedUnique >= 2) {
      status = 'strong';
      recommendationReason = `Strong performance with ${estimatedMastery}% estimated mastery and ${solvedUnique} problem(s) solved. Ready for advanced variations.`;
    } else {
      status = 'moderate';
      recommendationReason = `Moderate grasp (${estimatedMastery}% mastery). Consistent practice on medium-difficulty problems will push this into strong mastery.`;
    }

    return {
      topicKey,
      topicLabel: topicCfg.label,
      totalInPlatform,
      attemptedUnique,
      solvedUnique,
      totalSubmissions: totalAttempts,
      acceptedSubmissions: acceptedAttempts,
      observedSuccessRate: topicSuccessRate,
      estimatedMastery,
      status,
      recommendationReason,
      difficultyBreakdown: {
        easy: tEasy,
        medium: tMedium,
        hard: tHard,
      },
      availableProblemIds: availableProblems.map((p) => p._id),
    };
  });

  // Calculate Overall Estimated Mastery
  const activeTopics = topicAnalytics.filter((t) => t.status !== 'insufficient_practice');
  let overallEstimatedMastery = 0;
  if (activeTopics.length > 0) {
    const sumMastery = activeTopics.reduce((acc, curr) => acc + curr.estimatedMastery, 0);
    overallEstimatedMastery = Math.round(sumMastery / activeTopics.length);
  } else if (totalSolvedUnique > 0) {
    overallEstimatedMastery = Math.min(45, totalSolvedUnique * 10);
  }

  // Recent Improvement Trend (last 15 submissions)
  let recentTrend = 'steady';
  if (submissions.length >= 6) {
    const lastWindow = submissions.slice(-15);
    const half = Math.floor(lastWindow.length / 2);
    const olderHalf = lastWindow.slice(0, half);
    const newerHalf = lastWindow.slice(half);

    const olderRate = olderHalf.filter((s) => s.status === 'accepted').length / olderHalf.length;
    const newerRate = newerHalf.filter((s) => s.status === 'accepted').length / newerHalf.length;

    if (newerRate - olderRate >= 0.15) {
      recentTrend = 'improving';
    } else if (olderRate - newerRate >= 0.2) {
      recentTrend = 'declining';
    }
  }

  const weakTopics = topicAnalytics.filter((t) => t.status === 'weak');
  const strongTopics = topicAnalytics.filter((t) => t.status === 'strong');
  const insufficientPracticeTopics = topicAnalytics.filter(
    (t) => t.status === 'insufficient_practice'
  );

  return {
    user: {
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
    },
    overview: {
      totalUniqueSolved: totalSolvedUnique,
      totalUniqueAttempted: totalAttemptedUnique,
      totalAvailableInPlatform: allProblems.length,
      difficulty: {
        easy: easySolved,
        medium: mediumSolved,
        hard: hardSolved,
      },
      totalSubmissions,
      acceptedSubmissions: acceptedSubmissionsCount,
      observedSuccessRate: overallSuccessRate,
      estimatedOverallMastery: overallEstimatedMastery,
      recentTrend,
    },
    topicWise: topicAnalytics,
    strongTopics,
    weakTopics,
    insufficientPracticeTopics,
    recommendedTopics: [...weakTopics, ...insufficientPracticeTopics].slice(0, 4),
  };
};

module.exports = {
  calculateUserDsaAnalytics,
  normalizeTopicTag,
  TOPIC_CONFIG,
};
