const mongoose = require('mongoose');

const findingSchema = new mongoose.Schema(
  {
    findingId: String,
    line: Number,
    lineEnd: Number,
    column: Number,
    severity: {
      type: String,
      enum: ['critical', 'high', 'medium', 'low', 'info'],
    },
    category: String, // e.g. 'SQL Injection', 'Hardcoded Secret'
    owaspCategory: String, // e.g. 'A03:2021'
    cwe: String, // e.g. 'CWE-89'
    title: String,
    description: String,
    vulnerableCode: String, // The exact vulnerable snippet
    fixedCode: String, // The corrected version
    explanation: String, // Why it's dangerous
    remediation: String, // How to fix it
    references: [String], // OWASP links, CVEs
  },
  { _id: false }
);

const summarySchema = new mongoose.Schema(
  {
    total: Number,
    critical: Number,
    high: Number,
    medium: Number,
    low: Number,
    info: Number,
    riskScore: Number, // 0-100
    grade: String, // A+ / A / B / C / D / F
    overallAssessment: String,
  },
  { _id: false }
);

const codeScanSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    source: {
      type: String,
      enum: ['paste', 'upload', 'github'],
      required: true,
    },
    filename: String,
    language: { type: String, required: true },
    linesOfCode: Number,
    githubRepo: String, // e.g. 'owner/repo'
    githubBranch: String, // e.g. 'main'
    githubPath: String, // e.g. 'src/auth.js'
    status: {
      type: String,
      enum: ['queued', 'scanning', 'completed', 'failed'],
      default: 'queued',
      index: true,
    },
    startedAt: Date,
    summary: summarySchema,
    findings: { type: [findingSchema], default: [] },
    aiModel: String,
    scanDuration: Number, // ms
    completedAt: Date,
    error: String, // If status is 'failed'
    preScanHints: { type: [String], default: [] },
    progressPercent: { type: Number, default: 0, min: 0, max: 100 },
    progressStage: { type: String, default: 'queued' },
    progressMessage: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('CodeScan', codeScanSchema);
