// src/controllers/authController.js
// Handles all authentication logic: register, login, token refresh, logout, and /me.
// Access tokens are returned in the JSON body. Refresh tokens are stored in httpOnly cookies.

const jwt = require('jsonwebtoken');
const axios = require('axios');
const User = require('../models/User');
const logger = require('../utils/logger');

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'Strict',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
};

// POST /api/auth/register
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists.',
      });
    }

    const user = await User.create({ name, email, password });

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    // Store refresh token hash in DB
    user.refreshToken = refreshToken;
    await user.save();

    res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);

    logger.info(`New user registered: ${user.email}`);

    res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      accessToken,
      user: user.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    user.lastLogin = new Date();
    await user.save();

    res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);

    logger.info(`User logged in: ${user.email}`);

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      accessToken,
      user: user.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/refresh
// Reads refreshToken from httpOnly cookie and issues a new access token
const refresh = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No refresh token provided.',
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token. Please log in again.',
      });
    }

    const user = await User.findById(decoded.id).select('+refreshToken');

    if (!user || !user.isActive || user.refreshToken !== token) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token is invalid or has been revoked.',
      });
    }

    const newAccessToken = user.generateAccessToken();

    res.status(200).json({
      success: true,
      accessToken: newAccessToken,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/logout
// Clears the refresh token cookie and removes it from the database
const logout = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken;

    if (token) {
      // Invalidate refresh token in DB (prevents reuse)
      await User.findOneAndUpdate(
        { refreshToken: token },
        { $unset: { refreshToken: 1 } }
      );
    }

    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Strict',
    });

    res.status(200).json({ success: true, message: 'Logged out successfully.' });
  } catch (error) {
    next(error);
  }
};

// GET /api/auth/me
// Returns the authenticated user's profile (requires protect middleware)
const getMe = async (req, res, next) => {
  try {
    // req.user is already attached by the protect middleware
    res.status(200).json({
      success: true,
      user: req.user.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/google
// Accepts a Google OAuth2 access token from the client, fetches the user profile
// via Google's userinfo endpoint, then logs in or registers the user.
const googleLogin = async (req, res, next) => {
  try {
    const { access_token } = req.body;
    if (!access_token) {
      return res.status(400).json({ success: false, message: 'Google access token is required.' });
    }

    // Fetch the authenticated user's profile from Google
    let googleUser;
    try {
      const { data } = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${access_token}` },
      });
      googleUser = data;
    } catch (err) {
      logger.warn(`Google userinfo fetch failed: ${err.message}`);
      return res.status(401).json({ success: false, message: 'Invalid Google token. Please try again.' });
    }

    const { sub: googleId, email, name, picture } = googleUser;

    // Find an existing user by googleId, or fall back to email (link existing account)
    let user = await User.findOne({ $or: [{ googleId }, { email }] });

    if (user) {
      // Link Google account if they previously registered with email/password
      if (!user.googleId) {
        user.googleId = googleId;
        user.avatar = picture || user.avatar;
        await user.save();
      }
    } else {
      // Create a new user for first-time Google sign-ins
      user = await User.create({
        name,
        email,
        googleId,
        avatar: picture || null,
      });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Your account has been deactivated.' });
    }

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;
    user.lastLogin = new Date();
    await user.save();

    res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);
    logger.info(`Google auth successful: ${user.email}`);

    res.status(200).json({
      success: true,
      message: 'Google authentication successful.',
      accessToken,
      user: user.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/test-account
// Instantly logs in as the teacher test account, creating it if it doesn't exist.
const testLogin = async (req, res, next) => {
  try {
    const email = 'test-admin@saferest.ai';
    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        name: 'Teacher Test Account',
        email,
        password: 'TestPassword123!', // Hardcoded test password
      });
    }

    if (!user.isActive) {
      user.isActive = true;
    }

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    user.lastLogin = new Date();
    await user.save();

    res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);

    logger.info(`Test account login: ${user.email}`);

    res.status(200).json({
      success: true,
      message: 'Test login successful.',
      accessToken,
      user: user.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, refresh, logout, getMe, googleLogin, testLogin };
