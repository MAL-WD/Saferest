// src/models/AIReport.js
// Stores the AI-generated remediation report produced by the Python FastAPI service.
// One report per scan (enforced by unique index on scan field).
// Mirrors the JSON schema expected from Claude's response.

const mongoose = require('mongoose');

const aiRemediationFindingSchema = new mongoose.Schema(
  {
    findingId: {
      type: String,
      required: true,
    },
    priority: {
      type: Number,
      required: true,
      min: 1,
      max: 10,
    },
    remediationSteps: {
      type: [String],
      required: true,
      validate: {
        validator: (arr) => arr.length > 0,
        message: 'At least one remediation step is required',
      },
    },
    codeExample: {
      vulnerable: { type: String, default: '' },
      fixed: { type: String, default: '' },
    },
    references: {
      type: [String],
      default: [],
    },
  },
  { _id: false }
);

const aiReportSchema = new mongoose.Schema(
  {
    scan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Scan',
      required: true,
      unique: true, // one report per scan
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    executiveSummary: {
      type: String,
      required: [true, 'Executive summary is required'],
    },
    overallRiskScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    // AI-enriched findings with remediation steps, code examples, and references
    findings: {
      type: [aiRemediationFindingSchema],
      default: [],
    },
    // Whether the report was successfully generated or failed
    status: {
      type: String,
      enum: ['pending', 'generated', 'failed'],
      default: 'pending',
    },
    errorMessage: {
      type: String,
      default: null,
    },
    generatedAt: {
      type: Date,
      default: null,
    },
    // Model used to generate this report (for auditing)
    modelUsed: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('AIReport', aiReportSchema);
