// src/models/Automation.js
const mongoose = require('mongoose');

const automationSchema = new mongoose.Schema(
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
      required: false, // Optional for tools that don't need a specific Target document
    },
    customInput: {
      type: String, // For email scan or code scan URL if target is not provided
      trim: true,
    },
    tool: {
      type: String,
      required: true,
      enum: ['subfinder', 'passive_scan', 'port_scan', 'email_scan', 'code_scan'],
    },
    schedule: {
      type: String,
      required: true,
      enum: ['minute', 'hourly', 'daily', 'weekly', 'monthly'],
      default: 'weekly',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastRunAt: {
      type: Date,
      default: null,
    },
    nextRunAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Automation', automationSchema);
