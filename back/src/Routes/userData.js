const express = require('express');
const userDataRouter = express.Router();
const {getUserData} = require('../controllers/userController');
const userMiddleware = require('../middleware/userMiddleware');
userDataRouter.get('/data', userMiddleware, getUserData);

module.exports = userDataRouter;