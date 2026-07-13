// src/routes/auth.js
// Auth routes — register, login, refresh, logout, and get current user.
// Applies Joi validation schemas and appropriate rate limiters per route.

const { Router } = require('express');
const Joi = require('joi');
const { register, login, refresh, logout, getMe, googleLogin, testLogin } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { loginLimiter } = require('../middleware/rateLimiter');
const validate = require('../middleware/validate');

const router = Router();

// Joi schemas
const registerSchema = Joi.object({
  name: Joi.string().trim().min(2).max(50).required().label('Name'),
  email: Joi.string().email({ tlds: { allow: false } }).lowercase().trim().required().label('Email'),
  password: Joi.string()
    .min(8)
    .pattern(/(?=.*[A-Z])(?=.*\d)/)
    .required()
    .label('Password')
    .messages({
      'string.pattern.base': 'Password must contain at least 1 uppercase letter and 1 number',
      'string.min': 'Password must be at least 8 characters',
    }),
  confirmPassword: Joi.string().valid(Joi.ref('password')).required().label('Confirm Password').messages({
    'any.only': 'Passwords do not match',
  }),
});

const loginSchema = Joi.object({
  email: Joi.string().email({ tlds: { allow: false } }).lowercase().trim().required().label('Email'),
  password: Joi.string().required().label('Password'),
});

// POST /api/auth/register
router.post('/register', validate(registerSchema), register);

// POST /api/auth/login — strict rate limited
router.post('/login', loginLimiter, validate(loginSchema), login);

// POST /api/auth/refresh — uses httpOnly cookie
router.post('/refresh', refresh);

// POST /api/auth/logout
router.post('/logout', logout);

// POST /api/auth/google — Google One-Tap / OAuth credential exchange
router.post('/google', loginLimiter, googleLogin);

// GET /api/auth/me — requires valid access token
router.get('/me', protect, getMe);

// POST /api/auth/test-account — skip auth for teachers
router.post('/test-account', testLogin);

module.exports = router;
