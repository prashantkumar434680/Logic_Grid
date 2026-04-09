const express = require('express');
const userDataRouter = express.Router();
const {getUserData} = require('../controllers/userController');
const {
  generateProfileImageUploadSignature,
  getProfile,
  updateProfile,
} = require('../controllers/ProfileUpdate');
const userMiddleware = require('../middleware/userMiddleware');

userDataRouter.get('/data', userMiddleware, getUserData);
userDataRouter.get('/profile', userMiddleware, getProfile);
userDataRouter.get('/profile/upload-signature', userMiddleware, generateProfileImageUploadSignature);
userDataRouter.patch('/profile', userMiddleware, updateProfile);

module.exports = userDataRouter;
