// src/middleware/auth.js
// JWT authentication middleware — verifies the Bearer token in Authorization header.
// Attaches decoded user payload to req.user for downstream route handlers.

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../utils/logger');

// Short-lived in-memory user cache to reduce MongoDB round-trips during scan polling.
// Keyed by userId string, values expire after USER_CACHE_TTL_MS.
const USER_CACHE_TTL_MS = 30 * 1000; // 30 seconds
const userCache = new Map();

function getCachedUser(userId) {
  const entry = userCache.get(userId);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    userCache.delete(userId);
    return null;
  }
  return entry.user;
}

function setCachedUser(userId, user) {
  userCache.set(userId, { user, expiresAt: Date.now() + USER_CACHE_TTL_MS });
  // Prevent unbounded growth — evict old entries if cache grows too large
  if (userCache.size > 500) {
    const now = Date.now();
    for (const [key, val] of userCache) {
      if (now > val.expiresAt) userCache.delete(key);
    }
  }
}

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
      });
    }

    const token = authHeader.split(' ')[1];

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Access token expired. Please refresh your session.',
        });
      }
      return res.status(401).json({
        success: false,
        message: 'Invalid access token.',
      });
    }

    const userId = String(decoded.id);
    let user = getCachedUser(userId);

    if (!user) {
      user = await User.findById(userId);
      if (user && user.isActive) {
        setCachedUser(userId, user);
      }
    }

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User account not found or has been deactivated.',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    logger.error(`Auth middleware error: ${error.message}`);
    // Distinguish DB connectivity issues from unexpected errors
    const isMongoError =
      error.name === 'MongoNetworkError' ||
      error.name === 'MongoServerSelectionError' ||
      (error.message && error.message.toLowerCase().includes('mongodb'));
    if (isMongoError) {
      return res.status(503).json({
        success: false,
        message: 'Service temporarily unavailable. Please try again in a moment.',
      });
    }
    res.status(500).json({ success: false, message: 'Internal server error during authentication.' });
  }
};

// Admin-only guard — must be used after protect()
const adminOnly = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.',
    });
  }
  next();
};

module.exports = { protect, adminOnly };
