const mongoose = require('mongoose');
const { Schema } = mongoose;

const likeSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    problemId: {
        type: Schema.Types.ObjectId,
        ref: 'problem',
        required: true
    }
}, {
    timestamps: true
});

// Ensure a user can only like a problem once
likeSchema.index({ userId: 1, problemId: 1 }, { unique: true });

const Like = mongoose.model('like', likeSchema);

module.exports = Like;