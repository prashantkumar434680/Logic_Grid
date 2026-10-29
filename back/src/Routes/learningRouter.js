const express = require('express');
const learningRouter = express.Router();
const userMiddleware = require('../middleware/userMiddleware');
const {
  getUserDsaAnalytics,
  explainConcept,
  chatLearningSession,
  getTopicsList,
} = require('../controllers/learningController');

learningRouter.get('/analytics', userMiddleware, getUserDsaAnalytics);
learningRouter.post('/explain', userMiddleware, explainConcept);
learningRouter.post('/chat', userMiddleware, chatLearningSession);
learningRouter.get('/topics', userMiddleware, getTopicsList);

module.exports = learningRouter;
