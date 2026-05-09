const express = require('express');
const adminMiddleware = require('../middleware/adminMiddleware');
const videoRouter = express.Router();

const {generateUploadSignature, saveVideoMetadata, VideoDelete, getVideoByProblemId} = require('../controllers/videoSection');

videoRouter.post('/save', adminMiddleware, saveVideoMetadata);
videoRouter.get('/create/:problemId', adminMiddleware, generateUploadSignature);
videoRouter.get('/problem/:problemId', getVideoByProblemId);
videoRouter.delete('/delete/:videoId', adminMiddleware, VideoDelete);



module.exports = videoRouter;