const express    = require('express');
const authRouter = express.Router();
const jwt        = require("jsonwebtoken");
const rateLimit  = require("express-rate-limit");
const passport   = require("../config/passport");
const User       = require('../Models/User');
const userMiddleware  = require("../middleware/userMiddleware");
const adminMiddleware = require('../middleware/adminMiddleware');
const {
  verifyResetOTP, sendVerificationLink, verifyEmail,
  resendVerification, register, sendResetOtp,
  resetPassword, login, logout, adminRegister, deleteProfile
} = require('../controllers/userAuthent');

// ── Rate limiters ─────────────────────────────────────────────────────

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      50,
  message:  "Too many requests from this IP, please try again later",
});

const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      5,
  message:  "Too many registration attempts, please try again later",
});

const verificationLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max:      10,
  message:  "Too many verification attempts, please try again later",
});

const resetPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      5,
  message:  "Too many reset attempts",
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      5,
  message:  "Too many login attempts",
});

// ── Shared helper — create JWT + set cookie ───────────────────────────

// ✅ Extracted so Google and GitHub use identical logic
const issueTokenAndRedirect = (res, user) => {
  const JWT_EXPIRY = parseInt(process.env.JWT_EXPIRY_SECONDS) || 15 * 60;

  const token = jwt.sign(
    { _id: user._id, emailId: user.emailId, role: user.role },
    process.env.JWT_KEY,
    { expiresIn: JWT_EXPIRY } // ✅ seconds, not ms
  );

  res.cookie("token", token, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge:   JWT_EXPIRY * 1000, // ✅ matches JWT expiry exactly
  });

  res.redirect(`${process.env.FRONTEND_URL}/`);
};

// ── Auth routes ───────────────────────────────────────────────────────

authRouter.post('/register',               registerLimiter,     register);
authRouter.get( '/verify-email/:token',                         verifyEmail);
authRouter.post('/send-verification-link', userMiddleware, verificationLimiter, sendVerificationLink);
authRouter.post('/resend-verification',    verificationLimiter, resendVerification);
authRouter.post('/login',                  loginLimiter,        login);
authRouter.post('/logout',                 userMiddleware,      logout);
authRouter.post('/admin/register',         adminMiddleware,     adminRegister);
authRouter.delete('/deleteProfile',        userMiddleware,      deleteProfile);
authRouter.post('/send-reset-otp',                              sendResetOtp);
authRouter.post('/verify-reset-otp',                            verifyResetOTP);
authRouter.post('/reset-password',         resetPasswordLimiter, resetPassword);

// ── Check auth ────────────────────────────────────────────────────────

authRouter.get('/check', userMiddleware, (req, res) => {
  res.status(200).json({
    user: {
      firstName: req.result.firstName,
      emailId:   req.result.emailId,
      _id:       req.result._id,
      role:      req.result.role, // ✅ added — needed for admin panel
    },
    message: "Valid User"
  });
});

// ── Google OAuth ─

authRouter.get("/google",
  passport.authenticate("google", {
    scope:   ["profile", "email"],
    session: false,
  })
);

authRouter.get("/google/callback", (req, res, next) => {
  passport.authenticate("google", { session: false },
    (err, user, info) => {
      if (err) {
        console.error("Google OAuth error:", err);
        return res.redirect(`${process.env.FRONTEND_URL}/login?error=server_error`);
      }
      if (!user) {
        const message = encodeURIComponent(info?.message || "google_failed");
        return res.redirect(`${process.env.FRONTEND_URL}/login?error=${message}`);
      }
      try {
        issueTokenAndRedirect(res, user); // ✅ shared helper
      } catch (err) {
        console.error("JWT creation error:", err);
        res.redirect(`${process.env.FRONTEND_URL}/login?error=server_error`);
      }
    }
  )(req, res, next);
});

// ── GitHub OAuth ────

authRouter.get("/github",
  passport.authenticate("github", {
    scope:   ["user:email"],
    session: false,
  })
);

authRouter.get("/github/callback", (req, res, next) => {
  passport.authenticate("github", { session: false },
    (err, user, info) => {
      if (err) {
        console.error("GitHub OAuth error:", err);
        return res.redirect(`${process.env.FRONTEND_URL}/login?error=server_error`);
      }
      if (!user) {
        const message = encodeURIComponent(info?.message || "github_failed");
        return res.redirect(`${process.env.FRONTEND_URL}/login?error=${message}`);
      }
      try {
        issueTokenAndRedirect(res, user); // ✅ shared helper
      } catch (err) {
        console.error("JWT creation error:", err);
        res.redirect(`${process.env.FRONTEND_URL}/login?error=server_error`);
      }
    }
  )(req, res, next);
});

// ── Dev-only test routes ──────────────────────────────────────────────

// ✅ Only available in development — removed from production
if (process.env.NODE_ENV !== 'production') {
  authRouter.get('/oauth-test', (req, res) => {
    res.json({
      googleCallbackURL: `${process.env.BASE_URL}/user/google/callback`,
      githubCallbackURL: `${process.env.BASE_URL}/user/github/callback`,
      baseURL:           process.env.BASE_URL,
      frontendURL:       process.env.FRONTEND_URL,
    });
  });

  authRouter.get('/test-user/:email', async (req, res) => {
    try {
      const user = await User.findOne({ emailId: req.params.email });
      if (!user) return res.json({ message: "User not found" });
      res.json({
        user: {
          firstName:          user.firstName,
          emailId:            user.emailId,
          isAccountVerified:  user.isAccountVerified,
          verifyToken:        user.verifyToken ? "Present" : "None",
          verifyTokenExpireAt: user.verifyTokenExpireAt,
          tokenExpired:       user.verifyTokenExpireAt
            ? user.verifyTokenExpireAt < Date.now()
            : "No token",
        }
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
}

// ✅ module.exports is now the last line
module.exports = authRouter;






















// const express = require('express');

// const authRouter =  express.Router();
// const {verifyResetOTP,sendVerificationLink, verifyEmail, resendVerification, register, sendResetOtp, resetPassword, login,logout,adminRegister,deleteProfile} = require('../controllers/userAuthent')
// const userMiddleware = require("../middleware/userMiddleware");
// const adminMiddleware = require('../middleware/adminMiddleware');
// const User = require('../Models/User');
// const rateLimit = require("express-rate-limit");
// const passport = require("../config/passport");
// const jwt = require("jsonwebtoken");

// const authLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 50, // Increased from 10 to 50
//   message: "Too many requests from this IP, please try again later",
// });

// const registerLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 5, // 5 registrations per 15 minutes per IP
//   message: "Too many registration attempts, please try again later",
// });

// const verificationLimiter = rateLimit({
//   windowMs: 5 * 60 * 1000, // 5 minutes
//   max: 10, // 10 verification attempts per 5 minutes
//   message: "Too many verification attempts, please try again later",
// });

// const resetPasswordLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000,
//   max: 5,
//   message: "Too many reset attempts",
// });

// const loginLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000,
//   max: 5,
//   message: "Too many login attempts",
// });


// // Register
// authRouter.post('/register', registerLimiter, register);
// authRouter.get('/verify-email/:token', verifyEmail); 
// authRouter.post('/send-verification-link', userMiddleware, verificationLimiter, sendVerificationLink);
// authRouter.post('/resend-verification', verificationLimiter, resendVerification); 
// authRouter.post('/login', loginLimiter, login);
// authRouter.post('/logout', userMiddleware, logout);
// authRouter.post('/admin/register', adminMiddleware ,adminRegister);
// authRouter.delete('/deleteProfile',userMiddleware,deleteProfile);
// authRouter.post('/send-reset-otp', sendResetOtp);
// authRouter.post('/verify-reset-otp', verifyResetOTP);
// authRouter.post('/reset-password', resetPasswordLimiter, resetPassword);

// authRouter.get('/check',userMiddleware,(req,res)=>{

//     const reply = {
//         firstName: req.result.firstName,
//         emailId: req.result.emailId,
//         _id:req.result._id
//     }

//     res.status(200).json({
//         user:reply,
//         message:"Valid User"
//     });
// })
// // authRouter.get('/getProfile',getProfile);


// //OAuth routes
// authRouter.get(
//   "/google",
//   passport.authenticate("google", {
//     scope: ["profile", "email"],
//     session: false,
//   }),
// );

// authRouter.get("/google/callback", (req, res, next) => {
//   passport.authenticate(
//     "google",
//     {
//       session: false,
//     },
//     (err, user, info) => {
//       if (err) {
//         console.log("Google OAuth error:", err);
//         return res.redirect(
//           `${process.env.FRONTEND_URL}/login?error=server_error`,
//         );
//       }
//       if (!user) {
//         // info.message has your provider mismatch message
//         const message = encodeURIComponent(info?.message || "google_failed");
//         return res.redirect(
//           `${process.env.FRONTEND_URL}/login?error=${message}`,
//         );
//       }

//       // Success
//       try {
//         const token = jwt.sign({ _id: user._id, emailId: user.emailId, role: user.role }, process.env.JWT_KEY, {
//           expiresIn: 15*60*1000,
//         });
//         res.cookie("token", token, {
//           httpOnly: true,
//           secure: process.env.NODE_ENV === "production",
//           sameSite: "lax",
//           maxAge: (process.env.JWT_EXPIRY_SECONDS || 3600) * 1000,
//         });
//         res.redirect(`${process.env.FRONTEND_URL}/`);
//       } catch (err) {
//         console.log("JWT creation error:", err);
//         res.redirect(`${process.env.FRONTEND_URL}/login?error=server_error`);
//       }
//     },
//   )(req, res, next);
// });

// authRouter.get(
//   "/github",
//   passport.authenticate("github", {
//     scope: ["user:email"],
//     session: false,
//   }),
// );

// authRouter.get("/github/callback", (req, res, next) => {
//   passport.authenticate(
//     "github",
//     {
//       session: false,
//     },
//     (err, user, info) => {
//       if (err) {
//         console.log("GitHub OAuth error:", err);
//         return res.redirect(
//           `${process.env.FRONTEND_URL}/login?error=server_error`,
//         );
//       }
//       if (!user) {
//         const message = encodeURIComponent(info?.message || "github_failed");
//         return res.redirect(
//           `${process.env.FRONTEND_URL}/login?error=${message}`,
//         );
//       }

//       // Success
//       try {
//         const token = jwt.sign({ _id: user._id, emailId: user.emailId, role: user.role }, process.env.JWT_KEY, {
//           expiresIn: process.env.JWT_EXPIRY_SECONDS || 3600,
//         });
//         res.cookie("token", token, {
//           httpOnly: true,
//           secure: process.env.NODE_ENV === "production",
//           sameSite: "lax",
//           maxAge: (process.env.JWT_EXPIRY_SECONDS || 3600) * 1000,
//         });
//         res.redirect(`${process.env.FRONTEND_URL}/`);
//       } catch (err) {
//         console.log("JWT creation error:", err);
//         res.redirect(`${process.env.FRONTEND_URL}/login?error=server_error`);
//       }
//     },
//   )(req, res, next);
// });

// module.exports = authRouter;

// // login
// // logout
// // GetProfile

// // Test endpoint to verify OAuth URLs
// authRouter.get('/oauth-test', (req, res) => {
//   res.json({
//     googleCallbackURL: `${process.env.BASE_URL}/user/google/callback`,
//     githubCallbackURL: `${process.env.BASE_URL}/user/github/callback`,
//     baseURL: process.env.BASE_URL,
//     frontendURL: process.env.FRONTEND_URL
//   });
// });// Test 

// authRouter.get('/test-user/:email', async (req, res) => {
//   try {
//     const { email } = req.params;
//     const user = await User.findOne({ emailId: email });
    
//     if (!user) {
//       return res.json({ message: "User not found" });
//     }
    
//     res.json({
//       user: {
//         firstName: user.firstName,
//         emailId: user.emailId,
//         isAccountVerified: user.isAccountVerified,
//         verifyToken: user.verifyToken ? "Present" : "None",
//         verifyTokenExpireAt: user.verifyTokenExpireAt,
//         tokenExpired: user.verifyTokenExpireAt ? user.verifyTokenExpireAt < Date.now() : "No token"
//       }
//     });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });