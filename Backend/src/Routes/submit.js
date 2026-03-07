const express = require('express');
const userMiddleware = require("../middleware/userMiddleware");
const submitRouter = express.Router();

const submitCode = submitRouter.post("/submit/:id",userMiddleware, submitCode);
const runCode = submitRouter.post("/run/:id",userMiddleware, runCode);

module.exports = {submitCode,runCode};