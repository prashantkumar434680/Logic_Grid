const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const GithubStrategy = require("passport-github2").Strategy;
const User = require("../Models/User");
const bcrypt = require("bcrypt");
require("dotenv").config();

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.BASE_URL}/user/google/callback`,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // profile is what Google gives you
        const emailId = profile.emails[0].value;
        const firstName = profile.name.givenName;
        const lastName = profile.name.familyName;
        const googleId = profile.id;
        const avatar = profile.photos[0]?.value;

        // Check if user already exists by googleId or email
        let user = await User.findOne({
          $or: [{ googleId }, { emailId }]
        });

        if (user) {
          // User exists — update their googleId if missing and verify them
          if (!user.googleId) {
            user.googleId = googleId;
          }
          if (!user.isAccountVerified) {
            user.isAccountVerified = true;
          }
          if (!user.avatar && avatar) {
            user.avatar = avatar;
          }
          await user.save();
          return done(null, user);
        }

        // New user — create them
        const hashedPassword = await bcrypt.hash('oauth_user_' + googleId, 10);
        user = await User.create({
          firstName,
          lastName,
          emailId,
          googleId,
          avatar,
          isAccountVerified: true,
          password: hashedPassword,
          role: 'user'
        });

        return done(null, user);
      } catch (err) {
        console.log("Google OAuth error:", err);
        return done(err, null);
      }
    },
  ),
);

// GitHub Strategy
passport.use(
  new GithubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: `${process.env.BASE_URL}/user/github/callback`,
      scope: ["user:email"], // GitHub needs explicit email scope
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // GitHub sometimes hides email — handle null case
        const emailId = profile.emails?.[0]?.value || `${profile.username}@github.local`;
        const firstName = profile.displayName?.split(' ')[0] || profile.username;
        const lastName = profile.displayName?.split(' ').slice(1).join(' ') || '';
        const githubId = profile.id.toString();
        const avatar = profile.photos[0]?.value;

        let user = await User.findOne({
          $or: [{ githubId }, { emailId }]
        });

        if (user) {
          // User exists — update their githubId if missing and verify them
          if (!user.githubId) {
            user.githubId = githubId;
          }
          if (!user.isAccountVerified) {
            user.isAccountVerified = true;
          }
          if (!user.avatar && avatar) {
            user.avatar = avatar;
          }
          await user.save();
          return done(null, user);
        }

        // New user — create them
        const hashedPassword = await bcrypt.hash('oauth_user_' + githubId, 10);
        user = await User.create({
          firstName,
          lastName,
          emailId,
          githubId,
          avatar,
          isAccountVerified: true,
          password: hashedPassword,
          role: 'user'
        });

        return done(null, user);
      } catch (err) {
        console.log("GitHub OAuth error:", err);
        return done(err, null);
      }
    },
  ),
);

module.exports = passport;
