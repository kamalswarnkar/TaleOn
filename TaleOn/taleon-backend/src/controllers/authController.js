import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import User from '../models/User.js';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// Email transporter setup
const createTransporter = () => {
  console.log('[EMAIL DEBUG] Creating transporter...');
  console.log('[EMAIL DEBUG] EMAIL_USER:', process.env.EMAIL_USER);
  console.log('[EMAIL DEBUG] EMAIL_PASS length:', process.env.EMAIL_PASS ? process.env.EMAIL_PASS.length : 'NOT SET');
  console.log('[EMAIL DEBUG] FROM_NAME:', process.env.FROM_NAME);
  console.log('[EMAIL DEBUG] FROM_EMAIL:', process.env.FROM_EMAIL);
  
  // Check if email configuration is available
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('[EMAIL] Email configuration missing. Password reset emails will not be sent.');
    console.warn('[EMAIL] EMAIL_USER:', process.env.EMAIL_USER);
    console.warn('[EMAIL] EMAIL_PASS:', process.env.EMAIL_PASS ? 'SET' : 'NOT SET');
    return null;
  }
  
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      secure: true,
      port: 465,
    });
    
    console.log('[EMAIL] Transporter created successfully');
    return transporter;
  } catch (error) {
    console.error('[EMAIL] Failed to create transporter:', error.message);
    console.error('[EMAIL] Full error:', error);
    return null;
  }
};

// Send email helper
const sendEmail = async (options) => {
  const transporter = createTransporter();
  
  // If email is not configured, return success but log warning
  if (!transporter) {
    console.warn(`[EMAIL] Email not sent to ${options.email} - email not configured`);
    return;
  }
  
  const message = {
    from: `${process.env.FROM_NAME || 'TaleOn'} <${process.env.FROM_EMAIL || process.env.EMAIL_USER}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
  };

  try {
    console.log('[EMAIL] Attempting to send email to:', options.email);
    console.log('[EMAIL] From:', message.from);
    console.log('[EMAIL] Subject:', message.subject);
    
    const result = await transporter.sendMail(message);
    console.log('[EMAIL] Email sent successfully:', result.messageId);
    return result;
  } catch (error) {
    console.error('[EMAIL] Failed to send email:', error.message);
    console.error('[EMAIL] Error details:', error);
    throw error;
  }
};

// @desc    Register new user
export const signup = async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'User already exists' });

    const user = await User.create({ username, email, password });

    res.status(201).json({
      _id: user.id,
      username: user.username,
      email: user.email,
      token: generateToken(user.id),
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Login user
export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    
    // ✅ Block system accounts from logging in
    if (user?.system) {
      return res.status(403).json({ message: 'System accounts cannot log in' });
    }
    
    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user.id,
        username: user.username,
        email: user.email,
        token: generateToken(user.id),
      });
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Forgot password
export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get reset token
    const resetToken = user.getResetPasswordToken();

    await user.save({ validateBeforeSave: false });

    // Create reset url
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please make a PUT request to: \n\n ${resetUrl}`;

    try {
      await sendEmail({
        email: user.email,
        subject: 'Password reset token',
        message,
      });

      res.json({ message: 'Email sent' });
    } catch (err) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;

      await user.save({ validateBeforeSave: false });

      return res.status(500).json({ message: 'Email could not be sent' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Reset password
export const resetPassword = async (req, res) => {
  // Get hashed token
  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  try {
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    // Set new password
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.json({
      _id: user.id,
      username: user.username,
      email: user.email,
      token: generateToken(user.id),
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Test email configuration
export const testEmail = async (req, res) => {
  try {
    console.log('[EMAIL TEST] Environment variables:');
    console.log('[EMAIL TEST] EMAIL_USER:', process.env.EMAIL_USER);
    console.log('[EMAIL TEST] EMAIL_PASS:', process.env.EMAIL_PASS ? '***SET***' : 'NOT SET');
    console.log('[EMAIL TEST] FROM_NAME:', process.env.FROM_NAME);
    console.log('[EMAIL TEST] FROM_EMAIL:', process.env.FROM_EMAIL);
    console.log('[EMAIL TEST] FRONTEND_URL:', process.env.FRONTEND_URL);
    
    const transporter = createTransporter();
    if (!transporter) {
      return res.status(500).json({ 
        message: 'Email transporter creation failed',
        error: 'Check EMAIL_USER and EMAIL_PASS in .env file'
      });
    }
    
    // Test email
    const testResult = await sendEmail({
      email: 'test@example.com',
      subject: 'TaleOn Email Test',
      message: 'This is a test email from TaleOn backend.'
    });
    
    res.json({ 
      message: 'Email test successful',
      result: testResult
    });
  } catch (error) {
    console.error('[EMAIL TEST] Error:', error);
    res.status(500).json({ 
      message: 'Email test failed',
      error: error.message,
      details: error.toString()
    });
  }
};
