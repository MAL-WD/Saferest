const mongoose = require('mongoose');

const emailScanSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    domain: { type: String, required: true, trim: true, lowercase: true },
    status: {
      type: String,
      enum: ['pending', 'running', 'completed', 'failed'],
      default: 'pending',
    },
    results: { type: mongoose.Schema.Types.Mixed, default: {} },
    grade: { type: String, default: '' },
    aiReport: { type: mongoose.Schema.Types.Mixed, default: null },
    errorMessage: { type: String, default: null },
  },
  { timestamps: true }
);

emailScanSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('EmailScan', emailScanSchema);
