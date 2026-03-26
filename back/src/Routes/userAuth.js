const express = require('express');

const authRouter =  express.Router();
const {register, sendVerifyOtp, verifyEmail, sendResetOtp, resetPassword, login,logout, adminRegister,deleteProfile} = require('../controllers/userAuthent')
const userMiddleware = require("../middleware/userMiddleware");
const adminMiddleware = require('../middleware/adminMiddleware');

const rateLimit = require("express-rate-limit");
const passport = require("../config/passport");
const jwt = require("jsonwebtoken");

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: "Too many requests from this IP, please try again later",
});

const resetPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: "Too many reset attempts",
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: "Too many login attempts",
});


// Register
authRouter.post('/register',authLimiter, register);
authRouter.post('/login',loginLimiter, login);
authRouter.post('/logout', userMiddleware, logout);
authRouter.post('/admin/register', adminMiddleware ,adminRegister);
authRouter.delete('/deleteProfile',userMiddleware,deleteProfile);
authRouter.post('/send-verify-otp', userMiddleware, sendVerifyOtp);
authRouter.post('/verify-account', userMiddleware,authLimiter, verifyEmail);
authRouter.post('/send-reset-otp', resetPasswordLimiter, sendResetOtp);
authRouter.post('/reset-password',resetPasswordLimiter, resetPassword);

authRouter.get('/check',userMiddleware,(req,res)=>{

    const reply = {
        firstName: req.result.firstName,
        emailId: req.result.emailId,
        _id:req.result._id
    }

    res.status(200).json({
        user:reply,
        message:"Valid User"
    });
})
// authRouter.get('/getProfile',getProfile);


//OAuth routes
authRouter.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  }),
);

authRouter.get("/google/callback", (req, res, next) => {
  passport.authenticate(
    "google",
    {
      session: false,
    },
    (err, user, info) => {
      if (err) {
        console.log("Google OAuth error:", err);
        return res.redirect(
          `${process.env.FRONTEND_URL}/login?error=server_error`,
        );
      }
      if (!user) {
        // info.message has your provider mismatch message
        const message = encodeURIComponent(info?.message || "google_failed");
        return res.redirect(
          `${process.env.FRONTEND_URL}/login?error=${message}`,
        );
      }

      // Success
      try {
        const token = jwt.sign({ _id: user._id, emailId: user.emailId, role: user.role }, process.env.JWT_KEY, {
          expiresIn: process.env.JWT_EXPIRY_SECONDS || 3600,
        });
        res.cookie("token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: (process.env.JWT_EXPIRY_SECONDS || 3600) * 1000,
        });
        res.redirect(`${process.env.FRONTEND_URL}/`);
      } catch (err) {
        console.log("JWT creation error:", err);
        res.redirect(`${process.env.FRONTEND_URL}/login?error=server_error`);
      }
    },
  )(req, res, next);
});

authRouter.get(
  "/github",
  passport.authenticate("github", {
    scope: ["user:email"],
    session: false,
  }),
);

authRouter.get("/github/callback", (req, res, next) => {
  passport.authenticate(
    "github",
    {
      session: false,
    },
    (err, user, info) => {
      if (err) {
        console.log("GitHub OAuth error:", err);
        return res.redirect(
          `${process.env.FRONTEND_URL}/login?error=server_error`,
        );
      }
      if (!user) {
        const message = encodeURIComponent(info?.message || "github_failed");
        return res.redirect(
          `${process.env.FRONTEND_URL}/login?error=${message}`,
        );
      }

      // Success
      try {
        const token = jwt.sign({ _id: user._id, emailId: user.emailId, role: user.role }, process.env.JWT_KEY, {
          expiresIn: process.env.JWT_EXPIRY_SECONDS || 3600,
        });
        res.cookie("token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: (process.env.JWT_EXPIRY_SECONDS || 3600) * 1000,
        });
        res.redirect(`${process.env.FRONTEND_URL}/`);
      } catch (err) {
        console.log("JWT creation error:", err);
        res.redirect(`${process.env.FRONTEND_URL}/login?error=server_error`);
      }
    },
  )(req, res, next);
});

module.exports = authRouter;

// login
// logout
// GetProfile

// Test endpoint to verify OAuth URLs
authRouter.get('/oauth-test', (req, res) => {
  res.json({
    googleCallbackURL: `${process.env.BASE_URL}/user/google/callback`,
    githubCallbackURL: `${process.env.BASE_URL}/user/github/callback`,
    baseURL: process.env.BASE_URL,
    frontendURL: process.env.FRONTEND_URL
  });
});