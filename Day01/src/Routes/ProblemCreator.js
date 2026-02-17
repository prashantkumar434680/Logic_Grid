const express = require('express');
const adminMiddleware = require('../middleware/adminMiddleware');
const userMiddleware = require('../middleware/userMiddleware');
const {createProblem} = require('../controllers/userProblem');

const problemRouter = express.Router();

// these API for Admin User
problemRouter.post('/create',adminMiddleware,createProblem);
problemRouter.patch('/:id',updateProblem);
problemRouter.delete('/:id',deleteProblem);

// These API are for Normal user
problemRouter.get('/user',userMiddleware,solvedAllProblembyUser);
problemRouter.get('/',userMiddleware,getAllProblems);
problemRouter.get('/:id',userMiddleware,getProblemById);

module.exports = problemRouter;