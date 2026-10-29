const mongoose = require('mongoose');
const { Schema } = mongoose;

const interviewSessionSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'user',
      required: true,
      index: true,
    },
    mode: {
      type: String,
      enum: ['guided', 'strict'],
      default: 'strict',
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium',
    },
    durationMinutes: {
      type: Number,
      required: true,
      min: 15,
      max: 120,
      default: 45,
    },
    targetRole: {
      type: String,
      trim: true,
      default: 'Software Development Engineer',
    },
    language: {
      type: String,
      enum: ['javascript', 'c++', 'java', 'python', 'cpp'],
      default: 'javascript',
    },
    topics: [
      {
        type: String,
      },
    ],
    problems: [
      {
        problemId: {
          type: Schema.Types.ObjectId,
          ref: 'problem',
          required: true,
        },
        order: {
          type: Number,
          default: 0,
        },
        status: {
          type: String,
          enum: ['unattempted', 'in_progress', 'solved', 'failed'],
          default: 'unattempted',
        },
        code: {
          type: String,
          default: '',
        },
        language: {
          type: String,
          default: 'javascript',
        },
        testCasesPassed: {
          type: Number,
          default: 0,
        },
        testCasesTotal: {
          type: Number,
          default: 0,
        },
        runtime: {
          type: Number,
          default: 0,
        },
        memory: {
          type: Number,
          default: 0,
        },
        lastExecutionStatus: {
          type: String,
          default: null,
        },
      },
    ],
    currentProblemIndex: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['created', 'in_progress', 'submitted', 'completed', 'abandoned'],
      default: 'in_progress',
      index: true,
    },
    startTime: {
      type: Date,
      default: Date.now,
    },
    endTime: {
      type: Date,
      default: null,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    submissions: [
      {
        problemId: {
          type: Schema.Types.ObjectId,
          ref: 'problem',
        },
        code: String,
        language: String,
        action: {
          type: String,
          enum: ['run', 'submit'],
        },
        status: String,
        testCasesPassed: Number,
        testCasesTotal: Number,
        runtime: Number,
        memory: Number,
        errorMessage: String,
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    conversation: [
      {
        role: {
          type: String,
          enum: ['interviewer', 'candidate', 'system'],
          required: true,
        },
        type: {
          type: String,
          enum: ['question', 'hint', 'followup', 'feedback', 'message'],
          default: 'message',
        },
        content: {
          type: String,
          required: true,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    evaluation: {
      overallScore: {
        type: Number,
        default: 0,
      },
      summary: {
        type: String,
        default: '',
      },
      problemSolving: {
        score: { type: Number, default: 0 },
        feedback: { type: String, default: '' },
        evidence: { type: String, default: '' },
      },
      correctness: {
        score: { type: Number, default: 0 },
        feedback: { type: String, default: '' },
        testCasesPassed: { type: Number, default: 0 },
        testCasesTotal: { type: Number, default: 0 },
        evidence: { type: String, default: '' },
      },
      complexity: {
        score: { type: Number, default: 0 },
        feedback: { type: String, default: '' },
        declaredComplexity: { type: String, default: '' },
        actualComplexity: { type: String, default: '' },
        evidence: { type: String, default: '' },
      },
      codeQuality: {
        score: { type: Number, default: 0 },
        feedback: { type: String, default: '' },
        evidence: { type: String, default: '' },
      },
      optimization: {
        score: { type: Number, default: 0 },
        feedback: { type: String, default: '' },
        evidence: { type: String, default: '' },
      },
      communication: {
        score: { type: Number, default: 0 },
        feedback: { type: String, default: '' },
        evidence: { type: String, default: '' },
      },
      strengths: [String],
      weaknesses: [String],
      keyMistakes: [String],
      recommendations: [String],
      evaluatedAt: {
        type: Date,
        default: null,
      },
    },
  },
  { timestamps: true }
);

interviewSessionSchema.index({ userId: 1, createdAt: -1 });

const InterviewSession = mongoose.model('interviewSession', interviewSessionSchema);

module.exports = InterviewSession;
