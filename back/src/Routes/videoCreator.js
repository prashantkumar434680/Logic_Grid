const express = require('express');
const adminMiddleware = require('../middleware/adminMiddleware');
const videoRouter = express.Router();

const {generateUploadSignature, saveVideoMetadata, VideoDelete} = require('../controllers/videoSection');

videoRouter.post('/save', adminMiddleware, saveVideoMetadata);
videoRouter.get('/create/:problemId', adminMiddleware, generateUploadSignature);
videoRouter.delete('/delete/:problemId', adminMiddleware, VideoDelete);



module.exports = videoRouter;