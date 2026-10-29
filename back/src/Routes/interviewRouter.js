const express = require('express');
const interviewRouter = express.Router();
const userMiddleware = require('../middleware/userMiddleware');
const {
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
} = require('../controllers/interviewController');

interviewRouter.post('/create', userMiddleware, createInterviewSession);
interviewRouter.get('/active', userMiddleware, getActiveSession);
interviewRouter.get('/session/:id', userMiddleware, getSessionById);
interviewRouter.post('/session/:id/respond', userMiddleware, respondToInterviewer);
interviewRouter.post('/session/:id/run', userMiddleware, runSessionCode);
interviewRouter.post('/session/:id/submit', userMiddleware, submitSessionCode);
interviewRouter.post('/session/:id/next-problem', userMiddleware, nextProblemInSession);
interviewRouter.post('/session/:id/complete', userMiddleware, completeInterviewSession);
interviewRouter.post('/session/:id/abandon', userMiddleware, abandonInterviewSession);
interviewRouter.get('/history', userMiddleware, getInterviewHistory);

module.exports = interviewRouter;
