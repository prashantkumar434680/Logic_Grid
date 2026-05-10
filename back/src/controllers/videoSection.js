// // VideoSection.js



const User = require('../Models/User');
const solutionVideo = require('../Models/solutionVideo');
const Problem = require('../Models/Problem');
const cloudinary = require('cloudinary').v2;
const SolutionVideo = require('../Models/solutionVideo');

const CLOUDINARY_CLOUD_NAME = String(
    process.env.CLOUDINARY_CLOUD_NAME || process.env.cloudinary_cloud_name || ''
).trim().toLowerCase();
const CLOUDINARY_API_KEY = String(
    process.env.CLOUDINARY_API_KEY || process.env.cloudinary_api_key || ''
).trim();
const CLOUDINARY_API_SECRET = String(
    process.env.CLOUDINARY_API_SECRET || process.env.cloudinary_api_secret || ''
).trim();

cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET
});

const generateUploadSignature = async (req,res)=>{

    try{
    if(!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET){
        return res.status(500).json({error: 'Cloudinary configuration is missing on server'});
    }

    const {problemId} = req.params;
    const userId = req.result._id;

    // Verify that prblem exists or not
    const problem = await Problem.findOne({_id: problemId});
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
    const signature = cloudinary.utils.api_sign_request(uploadparams, CLOUDINARY_API_SECRET);
    res.json({
        signature,
        timestamp,
        public_id: publicId,
        api_key: CLOUDINARY_API_KEY,
        cloud_name: CLOUDINARY_CLOUD_NAME,
         upload_url: `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/video/upload`,
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

        console.log('Saving video metadata:', { problemId, secureUrl, cloudinaryPublicId, duration });

        // verify the upload with cloudinary
        const cloudinaryResource = await cloudinary.api.resource(cloudinaryPublicId, {resource_type: 'video'});
        
        console.log('Cloudinary resource:', {
            public_id: cloudinaryResource.public_id,
            secure_url: cloudinaryResource.secure_url,
            duration: cloudinaryResource.duration
        });

        if(!cloudinaryResource || cloudinaryResource.secure_url !== secureUrl){
            console.error('Video verification failed:', {
                cloudinaryUrl: cloudinaryResource?.secure_url,
                providedUrl: secureUrl
            });
            return res.status(400).json({error: "video verification failed"})
        }

        // check that video already exists for this problem and user
        const existingVideo = await solutionVideo.findOne({problemId, userId, cloudinaryPublicId});
        if(existingVideo){
            return res.status(400).json({error: "Video already exists for this problem and user"});
        }

        // create new thumbnail for the video - use Cloudinary's automatic thumbnail generation
        // Extract frame at 0 seconds and convert to jpg
        const thumbnailUrl = cloudinary.url(cloudinaryResource.public_id, {
            resource_type: 'video',
            format: 'jpg',
            secure: true,
            quality: 'auto',
            width: 640,
            height: 360,
            crop: 'fill',
            flags: 'immutable_cache'
        });

        console.log('Generated thumbnail URL:', thumbnailUrl);

        // now create videoSolution document in DB
        const videoSolution = await SolutionVideo.create({
            problemId,
            userId,
            cloudinaryPublicId,
            secureUrl: cloudinaryResource.secure_url, // Use the verified URL from Cloudinary
            duration: cloudinaryResource.duration || duration,
            thumbnailUrl
        })

        console.log('Video solution saved:', {
            id: videoSolution._id,
            secureUrl: videoSolution.secureUrl,
            thumbnailUrl: videoSolution.thumbnailUrl,
            duration: videoSolution.duration
        });

        res.status(201).json(
            {
                message: "Video metaData Saved sucessfully",
                 videoSolution: {
                 id: videoSolution._id,
                 secureUrl: videoSolution.secureUrl,
                 thumbnailUrl: videoSolution.thumbnailUrl,
                 duration: videoSolution.duration,
                 uploadedAt: videoSolution.createdAt
                 }
            }
        )
    }
    catch(err){
        console.error('Save video metadata error:', err);
        res.status(500).json({error: "Failed to save video metaData"});
    }
}





// const deleteVideo = async (req, res) => {
//   try {
//     const { problemId } = req.params;
//     const userId = req.result._id;

//     const video = await SolutionVideo.findOneAndDelete({problemId:problemId});
    
   

//     if (!video) {
//       return res.status(404).json({ error: 'Video not found' });
//     }

//     await cloudinary.uploader.destroy(video.cloudinaryPublicId, { resource_type: 'video' , invalidate: true });

//     res.json({ message: 'Video deleted successfully' });

//   } catch (error) {
//     console.error('Error deleting video:', error);
//     res.status(500).json({ error: 'Failed to delete video' });
//   }
// };

const VideoDelete = async (req,res)=>{
    try{
        const {videoId} = req.params;
        const userId = req.result._id;

        const video = await SolutionVideo.findById(videoId);
        if(!video){
            return res.status(404).json({error: "Video not found"});
        }

        // Check if user owns the video or is admin
        if(video.userId.toString() !== userId.toString() && req.result.role !== 'admin'){
            return res.status(403).json({error: "Not authorized to delete this video"});
        }

        // Delete from cloudinary first
        try {
            await cloudinary.uploader.destroy(video.cloudinaryPublicId, {resource_type: 'video', invalidate: true});
        } catch (cloudErr) {
            console.log('Cloudinary delete warning:', cloudErr.message);
        }

        // Delete from database
        await SolutionVideo.findByIdAndDelete(videoId);

        res.status(200).json({message: "Video deleted successfully"});
    }
    catch(err){
        console.error('Video delete error:', err);
        res.status(500).json({error: "Failed to delete video"});
    }
}

const getVideoByProblemId = async (req, res) => {
    try {
        const { problemId } = req.params;

        // Find video for this problem
        const video = await SolutionVideo.findOne({ problemId })
            .populate('userId', 'firstName lastName')
            .lean();

        if (!video) {
            return res.status(404).json({ error: "No video found for this problem" });
        }

        console.log('Video found:', {
            _id: video._id,
            secureUrl: video.secureUrl,
            thumbnailUrl: video.thumbnailUrl,
            duration: video.duration
        });

        res.status(200).json({
            _id: video._id,
            secureUrl: video.secureUrl,
            thumbnailUrl: video.thumbnailUrl,
            duration: video.duration,
            uploadedBy: video.userId ? `${video.userId.firstName} ${video.userId.lastName || ''}`.trim() : 'Admin',
            uploadedAt: video.createdAt
        });
    } catch (err) {
        console.error('Get video error:', err);
        res.status(500).json({ error: "Failed to fetch video" });
    }
}

module.exports = {
    generateUploadSignature,
    saveVideoMetadata,
    VideoDelete,
    getVideoByProblemId
}



