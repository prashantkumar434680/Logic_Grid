const express = require('express');
const userMiddleware = require("../middleware/userMiddleware");
const { submitCode, runCode, getSubmissionCalendar } = require("../controllers/userSubmission");
const submitRouter = express.Router();

submitRouter.get('/calendar', userMiddleware, getSubmissionCalendar);
submitRouter.post("/submit/:id", userMiddleware, submitCode);
submitRouter.post("/run/:id", userMiddleware, runCode);

module.exports = submitRouter;