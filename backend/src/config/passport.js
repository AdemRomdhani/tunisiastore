// Passport Google OAuth Configuration for Tunisia Store
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');
const TokenService = require('../services/token.service');

module.exports = function(passport) {
  // Google OAuth Strategy
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || '/api/auth/google/callback'
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // Find or create user
      let user = await User.findOne({ googleId: profile.id });
      
      if (user) {
        // Update login info
        user.lastLogin = new Date();
        user.loginCount = (user.loginCount || 0) + 1;
        await user.save();
        
        // Generate tokens
        const tokens = TokenService.generateTokenPair(user._id, user.role);
        return done(null, { user, tokens });
      }

      // Check if email already exists (registered differently)
      const existingUser = await User.findOne({ email: profile.emails[0].value });
      
      if (existingUser) {
        // Link Google account to existing user
        existingUser.googleId = profile.id;
        existingUser.googleProfile = {
          name: profile.displayName,
          picture: profile.photos[0]?.value
        };
        existingUser.lastLogin = new Date();
        existingUser.loginCount = (existingUser.loginCount || 0) + 1;
        existingUser.isVerified = true; // Google email is verified
        await existingUser.save();
        
        const tokens = TokenService.generateTokenPair(existingUser._id, existingUser.role);
        return done(null, { user: existingUser, tokens });
      }

      // Create new user
      const nameParts = profile.displayName.split(' ');
      const firstName = nameParts[0] || 'User';
      const lastName = nameParts.slice(1).join(' ') || 'Customer';

      user = await User.create({
        firstName,
        lastName,
        email: profile.emails[0].value,
        password: 'google-' + Date.now() + '-placeholder', // Placeholder (not used for Google login)
        phone: '+21600000000', // Placeholder
        role: 'customer',
        isVerified: true, // Google email is verified
        googleId: profile.id,
        googleProfile: {
          name: profile.displayName,
          picture: profile.photos[0]?.value
        },
        lastLogin: new Date(),
        loginCount: 1,
        firstLoginAt: new Date()
      });

      // Generate tokens
      const tokens = TokenService.generateTokenPair(user._id, user.role);
      
      return done(null, { user, tokens, isNew: true });
      
    } catch (error) {
      console.error('Google OAuth Error:', error);
      return done(error, null);
    }
  }));

  // Serialize/Deserialize
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser((id, done) => {
    User.findById(id).then(user => done(null, user)).catch(err => done(err, null));
  });
};