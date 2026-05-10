// Quick script to delete all videos from database
// Run with: node deleteAllVideos.js

require('dotenv').config();
const mongoose = require('mongoose');
const SolutionVideo = require('./src/Models/solutionVideo');

async function deleteAllVideos() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');
        
        const result = await SolutionVideo.deleteMany({});
        console.log(`✓ Deleted ${result.deletedCount} videos from database`);
        console.log('Now you can upload videos again with the fixed code!');
        
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

deleteAllVideos();
