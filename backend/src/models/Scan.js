// src/models/Scan.js
// Represents a single security scan run against one target.
// Tracks status, real-time progress, scanner activity, and all raw findings.
// Findings follow the rawFindingSchema from findingSchema.js.

const mongoose = require('mongoose');
const { rawFindingSchema } = require('../utils/findingSchema');

const scanSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    target: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Target',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['passive', 'active'],
      required: [true, 'Scan type is required (passive or active)'],
    },
    source: {
      type: String,
      enum: ['manual', 'scheduled'],
      default: 'manual',
    },
    previousScanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Scan',
      default: null,
    },
    status: {
      type: String,
      enum: ['queued', 'running', 'completed', 'failed'],
      default: 'queued',
      index: true,
    },
    // Overall progress (0-100)
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    // Name of the scanner currently running (e.g. "DNS Recon", "XSS Scanner")
    currentScanner: {
      type: String,
      default: '',
    },
    // BullMQ job ID for queue management
    jobId: {
      type: String,
      default: null,
    },
    // Array of raw findings from all scanner modules
    findings: {
      type: [rawFindingSchema],
      default: [],
    },
    // Summary counts per severity (populated when scan completes)
    summary: {
      critical: { type: Number, default: 0 },
      high: { type: Number, default: 0 },
      medium: { type: Number, default: 0 },
      low: { type: Number, default: 0 },
      info: { type: Number, default: 0 },
      total: { type: Number, default: 0 },
    },
    // Error message if scan failed
    errorMessage: {
      type: String,
      default: null,
    },
    startedAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    // Scanner-specific options (e.g. port range, scan intensity)
    options: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Virtual: duration in seconds
scanSchema.virtual('durationSeconds').get(function () {
  if (!this.startedAt || !this.completedAt) return null;
  return Math.floor((this.completedAt - this.startedAt) / 1000);
});

// Instance method: calculate and store summary counts from findings array
scanSchema.methods.calculateSummary = function () {
  const counts = { critical: 0, high: 0, medium: 0, low: 0, info: 0, total: 0 };
  for (const finding of this.findings) {
    const level = finding.severity.toLowerCase();
    if (counts[level] !== undefined) counts[level]++;
    counts.total++;
  }
  this.summary = counts;
};

module.exports = mongoose.model('Scan', scanSchema);
