const Like = require('../Models/Like');
const Comment = require('../Models/Comment');
const Problem = require('../Models/Problem');

// ============ LIKE CONTROLLERS ============

// Toggle like on a problem
const toggleLike = async (req, res) => {
    try {
        const userId = req.result._id;
        const { problemId } = req.params;

        // Check if problem exists
        const problem = await Problem.findById(problemId);
        if (!problem) {
            return res.status(404).json({ message: 'Problem not found' });
        }

        // Check if user already liked the problem
        const existingLike = await Like.findOne({ userId, problemId });

        if (existingLike) {
            // Unlike - remove the like
            await Like.deleteOne({ _id: existingLike._id });
            
            // Get updated like count
            const likesCount = await Like.countDocuments({ problemId });
            
            return res.status(200).json({
                message: 'Problem unliked',
                isLiked: false,
                likesCount
            });
        } else {
            // Like - create new like
            await Like.create({ userId, problemId });
            
            // Get updated like count
            const likesCount = await Like.countDocuments({ problemId });
            
            return res.status(200).json({
                message: 'Problem liked',
                isLiked: true,
                likesCount
            });
        }
    } catch (error) {
        console.error('Toggle like error:', error);
        return res.status(500).json({ message: error.message || 'Failed to toggle like' });
    }
};

// Get like status and count for a problem
const getLikeStatus = async (req, res) => {
    try {
        const userId = req.result?._id;
        const { problemId } = req.params;

        // Get total likes count
        const likesCount = await Like.countDocuments({ problemId });

        // Check if current user liked the problem
        let isLiked = false;
        if (userId) {
            const userLike = await Like.findOne({ userId, problemId });
            isLiked = !!userLike;
        }

        return res.status(200).json({
            likesCount,
            isLiked
        });
    } catch (error) {
        console.error('Get like status error:', error);
        return res.status(500).json({ message: error.message || 'Failed to get like status' });
    }
};

// ============ COMMENT CONTROLLERS ============

// Get all comments for a problem
const getComments = async (req, res) => {
    try {
        const { problemId } = req.params;
        const { limit = 50, skip = 0 } = req.query;

        // Check if problem exists
        const problem = await Problem.findById(problemId);
        if (!problem) {
            return res.status(404).json({ message: 'Problem not found' });
        }

        // Get comments with user details
        const comments = await Comment.find({ 
            problemId, 
            parentComment: null // Only get top-level comments
        })
            .populate('userId', 'firstName lastName avatar')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip(parseInt(skip))
            .lean();

        // Get total count
        const totalCount = await Comment.countDocuments({ problemId, parentComment: null });

        // Format comments
        const formattedComments = comments.map(comment => ({
            id: comment._id,
            username: `${comment.userId.firstName} ${comment.userId.lastName || ''}`.trim(),
            avatar: comment.userId.avatar || null,
            text: comment.text,
            timestamp: comment.createdAt,
            likes: comment.likes?.length || 0,
            userId: comment.userId._id
        }));

        return res.status(200).json({
            comments: formattedComments,
            totalCount,
            hasMore: skip + comments.length < totalCount
        });
    } catch (error) {
        console.error('Get comments error:', error);
        return res.status(500).json({ message: error.message || 'Failed to get comments' });
    }
};

// Add a new comment
const addComment = async (req, res) => {
    try {
        const userId = req.result._id;
        const { problemId } = req.params;
        const { text, parentComment } = req.body;

        // Validate input
        if (!text || !text.trim()) {
            return res.status(400).json({ message: 'Comment text is required' });
        }

        if (text.length > 1000) {
            return res.status(400).json({ message: 'Comment must be less than 1000 characters' });
        }

        // Check if problem exists
        const problem = await Problem.findById(problemId);
        if (!problem) {
            return res.status(404).json({ message: 'Problem not found' });
        }

        // If it's a reply, check if parent comment exists
        if (parentComment) {
            const parent = await Comment.findById(parentComment);
            if (!parent) {
                return res.status(404).json({ message: 'Parent comment not found' });
            }
        }

        // Create comment
        const comment = await Comment.create({
            userId,
            problemId,
            text: text.trim(),
            parentComment: parentComment || null
        });

        // Populate user details
        await comment.populate('userId', 'firstName lastName avatar');

        // Get updated comment count
        const commentsCount = await Comment.countDocuments({ problemId, parentComment: null });

        // Format response
        const formattedComment = {
            id: comment._id,
            username: `${comment.userId.firstName} ${comment.userId.lastName || ''}`.trim(),
            avatar: comment.userId.avatar || null,
            text: comment.text,
            timestamp: comment.createdAt,
            likes: 0,
            userId: comment.userId._id
        };

        return res.status(201).json({
            message: 'Comment added successfully',
            comment: formattedComment,
            commentsCount
        });
    } catch (error) {
        console.error('Add comment error:', error);
        return res.status(500).json({ message: error.message || 'Failed to add comment' });
    }
};

// Delete a comment
const deleteComment = async (req, res) => {
    try {
        const userId = req.result._id;
        const { commentId } = req.params;

        // Find comment
        const comment = await Comment.findById(commentId);
        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        // Check if user owns the comment or is admin
        if (comment.userId.toString() !== userId.toString() && req.result.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to delete this comment' });
        }

        // Delete comment and its replies
        await Comment.deleteMany({ 
            $or: [
                { _id: commentId },
                { parentComment: commentId }
            ]
        });

        // Get updated comment count
        const commentsCount = await Comment.countDocuments({ 
            problemId: comment.problemId, 
            parentComment: null 
        });

        return res.status(200).json({
            message: 'Comment deleted successfully',
            commentsCount
        });
    } catch (error) {
        console.error('Delete comment error:', error);
        return res.status(500).json({ message: error.message || 'Failed to delete comment' });
    }
};

// Like a comment
const likeComment = async (req, res) => {
    try {
        const userId = req.result._id;
        const { commentId } = req.params;

        // Find comment
        const comment = await Comment.findById(commentId);
        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        // Check if user already liked the comment
        const hasLiked = comment.likes.includes(userId);

        if (hasLiked) {
            // Unlike
            comment.likes = comment.likes.filter(id => id.toString() !== userId.toString());
        } else {
            // Like
            comment.likes.push(userId);
        }

        await comment.save();

        return res.status(200).json({
            message: hasLiked ? 'Comment unliked' : 'Comment liked',
            isLiked: !hasLiked,
            likesCount: comment.likes.length
        });
    } catch (error) {
        console.error('Like comment error:', error);
        return res.status(500).json({ message: error.message || 'Failed to like comment' });
    }
};

module.exports = {
    toggleLike,
    getLikeStatus,
    getComments,
    addComment,
    deleteComment,
    likeComment
};