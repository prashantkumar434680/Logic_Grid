const mongoose = require("mongoose");
const { Schema } = mongoose;

const userSchema = new Schema(
  {
    firstName: {
      type: String,
      required: true,
      minLength: 3,
      maxLength: 20,
    },

    lastName: {
      type: String,
      minLength: 3,
      maxLength: 20,
    },

    emailId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      immutable: true,
    },

    password: {
      type: String,
      required: true,
      select: false,
    },

    // Email Verification (LINK BASED)
    verifyToken: {
      type: String,
      default: null,
    },

    verifyTokenExpireAt: {
      type: Number, // timestamp
      default: null,
    },

    isAccountVerified: {
      type: Boolean,
      default: false,
    },
    resetPasswordToken:   { type: String, default: null, select: false },
    resetPasswordTokenExpires: { type: Date,   default: null, select: false },
    resetOtp: {
      type: String,
      default: null,
    },

    resetOtpExpireAt: {
      type: Number,
      default: null,
    },

    isOtpVerified: {
      type: Boolean,
      default: false,
    },

    otpVerifiedAt: {
      type: Date,
      default: null,
    },

    // OAuth
    googleId: {
      type: String,
      default: null,
    },

    githubId: {
      type: String,
      default: null,
    },

    //  Profile
    avatar: {
      type: String,
      default: null,
    },

    bio: {
      type: String,
      maxLength: 200,
    },

    age: {
      type: Number,
      min: 6,
      max: 80,
    },

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },

    problemSolved: [
      {
        type: Schema.Types.ObjectId,
        ref: "problem",
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Cleanup submissions on delete
userSchema.post("findOneAndDelete", async function (userInfo) {
  if (userInfo) {
    await mongoose.model("submission").deleteMany({
      userId: userInfo._id,
    });
  }
});

const User = mongoose.model("user", userSchema);

module.exports = User;
