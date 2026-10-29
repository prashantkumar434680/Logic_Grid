const mongoose = require('mongoose');
const { Schema } = mongoose;

const dsaBookSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    author: {
      type: String,
      trim: true,
      default: 'Unknown Author',
    },
    source: {
      type: String,
      trim: true,
      default: 'Administrator Upload',
    },
    filename: {
      type: String,
      required: true,
    },
    filePath: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['Uploaded', 'Processing', 'Indexed', 'Failed'],
      default: 'Uploaded',
      index: true,
    },
    errorMessage: {
      type: String,
      default: '',
    },
    pageCount: {
      type: Number,
      default: 0,
    },
    totalChunks: {
      type: Number,
      default: 0,
    },
    version: {
      type: Number,
      default: 1,
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: 'user',
      required: true,
    },
    detectedTopics: [
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

// Cascade delete chunks when book is removed
dsaBookSchema.post('findOneAndDelete', async function (doc) {
  if (doc) {
    await mongoose.model('bookChunk').deleteMany({ bookId: doc._id });
  }
});

const DsaBook = mongoose.model('dsaBook', dsaBookSchema);

module.exports = DsaBook;
