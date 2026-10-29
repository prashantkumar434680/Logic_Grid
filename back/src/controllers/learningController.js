const { calculateUserDsaAnalytics, TOPIC_CONFIG } = require('../services/skillAnalyticsService');
const { generateConceptExplanation, continueLearningSession } = require('../services/learningService');
const DsaBook = require('../Models/DsaBook');
const Problem = require('../Models/Problem');

/**
 * Get user's DSA Skill Analytics
 */
const getUserDsaAnalytics = async (req, res) => {
  try {
    const userId = req.result._id;
    const analytics = await calculateUserDsaAnalytics(userId);
    return res.status(200).json(analytics);
  } catch (err) {
    console.error('Error in getUserDsaAnalytics:', err);
    return res.status(500).json({ message: err.message || 'Failed to calculate DSA skill analytics.' });
  }
};

/**
 * Generate comprehensive book-grounded DSA concept explanation
 */
const explainConcept = async (req, res) => {
  try {
    const userId = req.result._id;
    const { topic, language = 'c++', customPrompt } = req.body;

    if (!topic || typeof topic !== 'string') {
      return res.status(400).json({ message: 'Topic is required.' });
    }

    const explanation = await generateConceptExplanation({
      userId,
      topic: topic.trim(),
      language: language.toLowerCase(),
      customPrompt,
    });

    return res.status(200).json(explanation);
  } catch (err) {
    console.error('Error in explainConcept:', err);
    return res.status(500).json({ message: err.message || 'Failed to generate concept explanation.' });
  }
};

/**
 * Follow-up conversational chat with learning assistant
 */
const chatLearningSession = async (req, res) => {
  try {
    const userId = req.result._id;
    const { topic, language = 'c++', messages = [], currentQuery } = req.body;

    if (!topic || !currentQuery) {
      return res.status(400).json({ message: 'Topic and current query are required.' });
    }

    const response = await continueLearningSession({
      userId,
      topic: topic.trim(),
      language: language.toLowerCase(),
      messages,
      currentQuery: currentQuery.trim(),
    });

    return res.status(200).json(response);
  } catch (err) {
    console.error('Error in chatLearningSession:', err);
    return res.status(500).json({ message: err.message || 'Failed to process chat message.' });
  }
};

/**
 * List available topics with coverage and indexing status
 */
const getTopicsList = async (req, res) => {
  try {
    const indexedBooks = await DsaBook.find({ status: 'Indexed' }).select('detectedTopics title');
    const allDetectedTopics = new Set();
    indexedBooks.forEach((b) => {
      (b.detectedTopics || []).forEach((t) => allDetectedTopics.add(t));
    });

    const problems = await Problem.find({}).select('tags');
    const topicProblemCount = {};
    problems.forEach((p) => {
      const tag = p.tags;
      topicProblemCount[tag] = (topicProblemCount[tag] || 0) + 1;
    });

    const topics = TOPIC_CONFIG.map((t) => ({
      key: t.key,
      label: t.label,
      problemsCount: topicProblemCount[t.key] || 0,
      isCoveredInBooks: allDetectedTopics.has(t.key) || indexedBooks.length > 0,
    }));

    return res.status(200).json({
      topics,
      totalIndexedBooks: indexedBooks.length,
    });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to retrieve topics list.' });
  }
};

module.exports = {
  getUserDsaAnalytics,
  explainConcept,
  chatLearningSession,
  getTopicsList,
};
