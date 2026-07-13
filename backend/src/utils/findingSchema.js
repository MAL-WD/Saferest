// src/utils/findingSchema.js
// Shared Mongoose sub-schema and validator for the standard finding object shape
// used by both Scan.findings[] and AIReport.findings[]

const mongoose = require('mongoose');

// Standard OWASP Top 10 categories
const OWASP_CATEGORIES = [
  'A01:2021 – Broken Access Control',
  'A02:2021 – Cryptographic Failures',
  'A03:2021 – Injection',
  'A04:2021 – Insecure Design',
  'A05:2021 – Security Misconfiguration',
  'A06:2021 – Vulnerable and Outdated Components',
  'A07:2021 – Identification and Authentication Failures',
  'A08:2021 – Software and Data Integrity Failures',
  'A09:2021 – Security Logging and Monitoring Failures',
  'A10:2021 – Server-Side Request Forgery (SSRF)',
  'Other',
];

const SEVERITY_LEVELS = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'];

// Raw finding schema — used in Scan.findings[]
const rawFindingSchema = new mongoose.Schema(
  {
    findingId: {
      type: String,
      required: true,
    },
    scanner: {
      type: String,
      required: true,
      trim: true,
    },
    severity: {
      type: String,
      enum: SEVERITY_LEVELS,
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    evidence: {
      type: String,
      default: '',
    },
    owaspCategory: {
      type: String,
      enum: OWASP_CATEGORIES,
      default: 'Other',
    },
    remediation: {
      type: String,
      default: '',
    },
    references: {
      type: [String],
      default: [],
    },
    /** Optional tag for UI grouping (e.g. subdomain recon sources) */
    source: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { _id: false }
);

module.exports = {
  rawFindingSchema,
  SEVERITY_LEVELS,
  OWASP_CATEGORIES,
};
