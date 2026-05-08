const mongoose = require('mongoose');
const { Schema } = mongoose;

const commentSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    problemId: {
        type: Schema.Types.ObjectId,
        ref: 'problem',
        required: true
    },
    text: {
        type: String,
        required: true,
        maxlength: 1000
    },
    likes: [{
        type: Schema.Types.ObjectId,
        ref: 'user'
    }],
    parentComment: {
        type: Schema.Types.ObjectId,
        ref: 'comment',
        default: null
    }
}, {
    timestamps: true
});

// Index for efficient querying
commentSchema.index({ problemId: 1, createdAt: -1 });
commentSchema.index({ parentComment: 1 });

const Comment = mongoose.model('comment', commentSchema);

module.exports = Comment;