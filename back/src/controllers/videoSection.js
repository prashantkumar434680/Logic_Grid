const User = require('../Models/User');
const solutionVideo = require('../Models/solutionVideo');
const Problem = require('../Models/Problem');
const cloudinary = require('cloudinary').v2;
const {sanitizeFilter} = require('mongoose');

cloudinary.config({
    cloud_name: process.env.cloudinary_cloud_name,
    api_key: process.env.cloudinary_api_key,
    api_secret: process.env.cloudinary_api_secret
});

