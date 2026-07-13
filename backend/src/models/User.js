// src/models/User.js
// User model with bcrypt password hashing and JWT generation methods.
// Passwords are never returned in queries (select: false).

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,10})+$/,
        'Please provide a valid email address',
      ],
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true, // allows multiple null values (for non-Google users)
    },
    avatar: {
      type: String,
      default: null,
    },
    password: {
      type: String,
      // Required only when the user does NOT sign in via Google
      required: function () {
        return !this.googleId;
      },
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
      validate: {
        validator: function (v) {
          // Skip validation for Google-authenticated users
          if (this.googleId) return true;
          return /(?=.*[A-Z])(?=.*\d)/.test(v);
        },
        message: 'Password must contain at least 1 uppercase letter and 1 number',
      },
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    refreshToken: {
      type: String,
      select: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    planTier: {
      type: String,
      enum: ['free', 'pro'],
      default: 'free',
    },
    lastLogin: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook: hash password before saving (only when modified)
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;

  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

// Instance method: compare plaintext password with hashed password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Instance method: generate short-lived JWT access token (15 min)
userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    { id: this._id, email: this.email, role: this.role },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );
};

// Instance method: generate long-lived refresh token (7 days)
userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    { id: this._id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
};

// Remove sensitive fields before returning JSON
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.refreshToken;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
