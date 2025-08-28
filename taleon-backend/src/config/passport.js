import passport from 'passport';
import GoogleStrategy from 'passport-google-oauth20';
import LocalStrategy from 'passport-local';
import User from '../models/User.js';

// Function to configure Google OAuth strategy
const configureGoogleStrategy = () => {
  // Debug environment variables
  console.log('[PASSPORT DEBUG] Checking Google OAuth environment variables:');
  console.log('[PASSPORT DEBUG] GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? 'SET' : 'NOT SET');
  console.log('[PASSPORT DEBUG] GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? 'SET' : 'NOT SET');

  // Remove existing Google strategy if it exists
  passport.unuse('google');

  // Google OAuth Strategy - Only load if credentials are available
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: '/auth/google/callback',
        scope: ['profile', 'email'],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Check if user already exists
          let user = await User.findOne({ googleId: profile.id });
          
          if (user) {
            return done(null, user);
          }
          
          // Check if user exists with same email
          user = await User.findOne({ email: profile.emails[0].value });
          
          if (user) {
            // Link existing account with Google
            user.googleId = profile.id;
            await user.save();
            return done(null, user);
          }
          
          // Create new user
          user = await User.create({
            googleId: profile.id,
            username: profile.displayName || profile.emails[0].value.split('@')[0],
            email: profile.emails[0].value,
            password: Math.random().toString(36).slice(-12), // Random password
            avatar: profile.photos[0]?.value,
          });
          
          return done(null, user);
        } catch (error) {
          return done(error, null);
        }
      }
    )
  );
  console.log('[PASSPORT] Google OAuth strategy loaded successfully');
  } else {
    console.log('[PASSPORT] Google OAuth credentials not found, strategy disabled');
    console.log('[PASSPORT] To enable Google OAuth, add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to your .env file');
  }
};

// Configure Google strategy initially
configureGoogleStrategy();

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Add a default strategy for non-OAuth users
passport.use('local', new LocalStrategy(
  {
    usernameField: 'email',
    passwordField: 'password'
  },
  async (email, password, done) => {
    try {
      const user = await User.findOne({ email });
      if (!user) {
        return done(null, false, { message: 'User not found' });
      }
      
      const isMatch = await user.matchPassword(password);
      if (!isMatch) {
        return done(null, false, { message: 'Invalid password' });
      }
      
      return done(null, user);
    } catch (error) {
      return done(error);
    }
  }
));

export default passport;
