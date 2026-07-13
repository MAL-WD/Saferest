const mongoose = require('mongoose');

const securityScoreSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    domain: { type: String, required: true, lowercase: true, trim: true },
    score: { type: Number, min: 0, max: 100 },
    letterGrade: { type: String },
    breakdown: { type: mongoose.Schema.Types.Mixed, default: {} },
    fromScanId: { type: mongoose.Schema.Types.ObjectId, ref: 'Scan', default: null },
  },
  { timestamps: true }
);

securityScoreSchema.index({ user: 1, domain: 1, createdAt: -1 });

module.exports = mongoose.model('SecurityScore', securityScoreSchema);
