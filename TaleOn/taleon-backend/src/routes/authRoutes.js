import express from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import { signup, login, forgotPassword, resetPassword, testEmail } from '../controllers/authController.js';

const router = express.Router();

// Regular auth routes
router.post('/signup', signup);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.get('/test-email', testEmail);

// Test Google OAuth configuration
router.get('/test-google', (_req, res) => {
  const hasGoogleConfig = process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET;
  res.json({
    message: 'Google OAuth configuration test',
    configured: hasGoogleConfig,
    clientId: hasGoogleConfig ? '✅ Found' : '❌ Missing',
    clientSecret: hasGoogleConfig ? '✅ Found' : '❌ Missing',
    status: hasGoogleConfig ? 'enabled' : 'disabled'
  });
});

// Google OAuth routes - Check configuration dynamically
router.get('/google', (req, res) => {
  const hasGoogleConfig = process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET;
  
  if (hasGoogleConfig) {
    passport.authenticate('google', { scope: ['profile', 'email'] })(req, res);
  } else {
    res.status(503).json({ 
      message: 'Google OAuth not configured',
      error: 'Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to your .env file',
      status: 'disabled',
      troubleshooting: 'Check your .env file and ensure both variables are set correctly'
    });
  }
});

router.get('/google/callback', (req, res) => {
  const hasGoogleConfig = process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET;
  
  if (hasGoogleConfig) {
    passport.authenticate('google', { failureRedirect: '/login' })(req, res, () => {
      // Successful authentication, redirect to frontend with token
      const token = jwt.sign({ id: req.user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });
      res.redirect(`${process.env.FRONTEND_URL}/auth-success?token=${token}&user=${encodeURIComponent(JSON.stringify({
        _id: req.user._id,
        username: req.user.username,
        email: req.user.email
      }))}`);
    });
  } else {
    res.status(503).json({ 
      message: 'Google OAuth not configured',
      error: 'Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to your .env file',
      status: 'disabled',
      troubleshooting: 'Check your .env file and ensure both variables are set correctly'
    });
  }
});

export default router;
