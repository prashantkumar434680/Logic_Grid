const express = require('express');

const problemRouter = express.Router();

// these API for Admin User
problemRouter.post('/create',problemCreate);
problemRouter.patch('/:id',problemUpdate);
problemRouter.delete('/:id',problemDelete);

// These API are for Normal user
problemRouter.get('user',solvedProblem);
problemRouter.get('/',getAllProblems);
problemRouter.get('/:id',Problemfetch);

