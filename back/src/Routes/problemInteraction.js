const express = require('express');
const userMiddleware = require('../middleware/userMiddleware');
const {
    toggleLike,
    getLikeStatus,
    getComments,
    addComment,
    deleteComment,
    likeComment
} = require('../controllers/problemInteraction');

const interactionRouter = express.Router();

// Like routes
interactionRouter.post('/problem/:problemId/like', userMiddleware, toggleLike);
interactionRouter.get('/problem/:problemId/like', userMiddleware, getLikeStatus);

// Comment routes
interactionRouter.get('/problem/:problemId/comments', getComments);
interactionRouter.post('/problem/:problemId/comments', userMiddleware, addComment);
interactionRouter.delete('/comment/:commentId', userMiddleware, deleteComment);
interactionRouter.post('/comment/:commentId/like', userMiddleware, likeComment);

module.exports = interactionRouter;