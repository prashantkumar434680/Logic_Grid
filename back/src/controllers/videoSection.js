const User = require('../Models/User');
const solutionVideo = require('../Models/solutionVideo');
const Problem = require('../Models/Problem');
const cloudinary = require('cloudinary').v2;
const {sanitizeFilter} = require('mongoose');
const SolutionVideo = require('../../../14Dev/backend/src/models/solutionVideo');

cloudinary.config({
    cloud_name: process.env.cloudinary_cloud_name,
    api_key: process.env.cloudinary_api_key,
    api_secret: process.env.cloudinary_api_secret
});

const generateUploadSignature = async (req,res)=>{

    try{
    const {problemId} = req.params;
    const userId = req.result._id;

    // Verify that prblem exists or not
    const problem = Problem.findOne({_id: problemId});
    if(!problem){
        return res.status(404).json({error: "Problem not found"});
    }

    const timestamp = Math.round((new Date()).getTime() / 1000);
    const publicId = `logicgrid-solutions/${problemId}/${userId}_${timestamp}`;

    // upload parameters
    const uploadparams = {
        timestamp: timestamp,
        public_id: publicId,
    }

    // generate Signature
    const signature = cloudinary.utils.api_sign_request(uploadparams, process.env.cloudinary_api_secret);
    res.json({
        signature,
        timestamp,
        public_id: publicId,
        api_key: process.env.cloudinary_api_key,
        cloud_name: process.env.cloudinary_cloud_name,
        upload_url: `https://api.cloudinary.com/v1_1/${process.env.cloudinary_cloud_name}/video/upload`
    })
    }
    catch(err){
        res.status(500).json({error: "Failed to generate upload Credentials"});
    }

}

const saveVideoMetadata = async (req,res)=>{
    try{
        const {problemId, secureUrl, cloudinaryPublicId, duration} = req.body;
        const userId = req.result._id;

        // verify the upload with cloudinary
        const cloudinaryResource = await cloudinary.api.resource(cloudinaryPublicId, {resources_type: 'video'});
        if(!cloudinaryResource || cloudinaryResource.secureUrl !== secureUrl){
            return res.status(400).json({error: "video verification failed"})
        }

        // check that video already exists for this problem and user
        const existingVideo = await solutionVideo.findOne({problemId, userId, cloudinaryPublicId});
        if(existingVideo){
            return res.status(400).json({error: "Video already exists for this problem and user"});
        }

        // create new thumbnail for the video
        const thumbnailUrl = cloudinary.image(cloudinaryResource.public_id, {resource_type: 'video'});

        // now create videoSolution document in DB
        const videoSolution = SolutionVideo.create({
            problemId,
            userId,
            cloudinaryPublicId,
            secureUrl,
            duration: cloudinaryResource.duration || duration,
            thumbnailUrl
        })

        res.ststus(201).json(
            {
                message: "Video metaData Saved sucessfully",
                 videoSolution: {
                 id: videoSolution._id,
                 thumbnailUrl: videoSolution.thumbnailUrl,
                 duration: videoSolution.duration,
                 uploadedAt: videoSolution.createdAt
                 }
            }
        )
    }
    catch(err){
        res.status(500).json({error: "Failed to save video metaData"});
    }
}

const VideoDelete = async (req,res)=>{
    try{
        const {problemId} = req.params;
        const userId = req.result._id;

        const video = await SolutionVideo.findByIdAndDelete(problemId);
        if(!video){
            return res.status(404).json({error: "Video not found"});
        }

        await cloudinary.uploader.destroy(video.cloudinaryPublicId, {resource_type: 'video', invalidate: true});

        res.status(200).json({message: "Video deleted successfully"});
    }
    catch(err){
        res.status(500).json({error: "Failed to delete video"});
    }
}

module.exports = {
    generateUploadSignature,
    saveVideoMetadata,
    VideoDelete
}