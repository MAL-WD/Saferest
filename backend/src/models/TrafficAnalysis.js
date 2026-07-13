const mongoose = require('mongoose');

const trafficAnalysisSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    originalName: String,
    fileType: { type: String, enum: ['pcap', 'pcapng', 'log', 'txt', 'gz'], required: true },
    logFormat: {
      type: String,
      enum: ['apache', 'nginx', 'iis', 'custom', 'na'],
      default: 'na',
    },
    status: {
      type: String,
      enum: ['pending', 'running', 'completed', 'failed'],
      default: 'pending',
    },
    aiReport: { type: mongoose.Schema.Types.Mixed, default: null },
    summary: { type: String, default: '' },
    errorMessage: { type: String, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('TrafficAnalysis', trafficAnalysisSchema);
