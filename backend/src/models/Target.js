// src/models/Target.js
// Scan target model — represents a URL a user wants to scan.
// Requires confirmedOwnership: true to comply with legal requirements.
// Every scan must be associated with a Target document.

const mongoose = require('mongoose');

const targetSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Target must belong to a user'],
      index: true,
    },
    url: {
      type: String,
      required: [true, 'Target URL is required'],
      trim: true,
      validate: {
        validator: function (v) {
          try {
            const url = new URL(v);
            return url.protocol === 'http:' || url.protocol === 'https:';
          } catch {
            return false;
          }
        },
        message: 'Target URL must be a valid http or https URL',
      },
    },
    // Sanitized version of the URL used for display (no credentials/fragments)
    sanitizedUrl: {
      type: String,
    },
    label: {
      type: String,
      trim: true,
      maxlength: [100, 'Label cannot exceed 100 characters'],
      default: '',
    },
    // LEGAL REQUIREMENT: User must explicitly confirm they own or have written
    // authorization to scan this target. Without this, scans are rejected.
    confirmedOwnership: {
      type: Boolean,
      required: [true, 'Ownership confirmation is required'],
      validate: {
        validator: function (v) {
          return v === true;
        },
        message:
          'You must confirm that you own or have written authorization to scan this target. Unauthorized scanning is illegal.',
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    schedule: {
      enabled: { type: Boolean, default: false },
      frequency: {
        type: String,
        enum: ['daily', 'weekly', 'monthly', 'custom'],
        default: 'weekly',
      },
      customIntervalMinutes: {
        type: Number,
        min: 60,
        max: 43200,
        default: 1440,
      },
      nextScanAt: { type: Date, default: null },
      lastAlertAt: { type: Date, default: null },
      emailAlerts: { type: Boolean, default: false },
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook: sanitize URL (strip credentials/fragment) and auto-set label
targetSchema.pre('save', function () {
  try {
    const parsed = new URL(this.url);
    // Strip username:password from URL
    parsed.username = '';
    parsed.password = '';
    parsed.hash = '';
    this.sanitizedUrl = parsed.toString();

    if (!this.label) {
      this.label = parsed.hostname;
    }
  } catch (err) {
    throw err;
  }
});

// Compound index: one user can't add the same URL twice
targetSchema.index({ user: 1, sanitizedUrl: 1 }, { unique: true });

module.exports = mongoose.model('Target', targetSchema);
