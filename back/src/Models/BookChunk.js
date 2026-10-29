const mongoose = require('mongoose');
const { Schema } = mongoose;

const bookChunkSchema = new Schema(
  {
    bookId: {
      type: Schema.Types.ObjectId,
      ref: 'dsaBook',
      required: true,
      index: true,
    },
    bookTitle: {
      type: String,
      required: true,
      trim: true,
    },
    chapterTitle: {
      type: String,
      trim: true,
      default: 'General',
    },
    sectionTitle: {
      type: String,
      trim: true,
      default: 'General',
    },
    pageNumber: {
      type: Number,
      default: 1,
      index: true,
    },
    pageRange: {
      type: String,
      default: '',
    },
    chunkIndex: {
      type: Number,
      required: true,
    },
    chunkId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    content: {
      type: String,
      required: true,
    },
    tokenCount: {
      type: Number,
      default: 0,
    },
    embedding: {
      type: [Number],
      default: [],
      select: true,
    },
    topicTags: [
      {
        type: String,
      },
    ],
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

bookChunkSchema.index({ bookId: 1, chunkIndex: 1 });
bookChunkSchema.index({ topicTags: 1 });

const BookChunk = mongoose.model('bookChunk', bookChunkSchema);

module.exports = BookChunk;
