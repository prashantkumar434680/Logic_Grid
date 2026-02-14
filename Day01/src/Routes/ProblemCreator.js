const express = require('express');
const adminMiddleware = require('../middleware/adminMiddleware');

const problemRouter = express.Router();

// these API for Admin User
problemRouter.post('/create',adminMiddleware,createProblem);
problemRouter.patch('/:id',updateProblem);
problemRouter.delete('/:id',deleteProblem);

// These API are for Normal user
problemRouter.get('user',solvedAllProblembyUser);
problemRouter.get('/',getAllProblems);
problemRouter.get('/:id',getProblemById);

