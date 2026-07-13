const axios = require('axios');
const EmailScan = require('../models/EmailScan');
const { runEmailChecks } = require('../scanners/email/email-scanner');
const { emailBertPredict } = require('../services/externalAPIs');
const logger = require('../utils/logger');

const requestAiEmailReport = async (payload) => {
  const base = (process.env.AI_SERVICE_URL || '').replace(/\/$/, '');
  if (!base) return null;
  try {
    const res = await axios.post(`${base}/api/generate-email-report`, payload, {
      timeout: 120000,
      headers: { 'Content-Type': 'application/json' },
    });
    if (res.status === 200 && res.data) return res.data;
  } catch (e) {
    logger.error(`[EmailScan] AI report failed: ${e.message}`);
  }
  return null;
};

const createEmailScan = async (req, res, next) => {
  try {
    const { domain, emailText, confirmedAuthorization } = req.body;
    if (!confirmedAuthorization) {
      return res.status(400).json({
        success: false,
        message: 'You must confirm authorization to analyze this domain.',
      });
    }

    let normalized = String(domain).trim().toLowerCase();
    if (normalized.includes('@')) {
      normalized = normalized.split('@').pop();
    }
    normalized = normalized
      .replace(/^https?:\/\//, '')
      .split('/')[0]
      .replace(/^www\./, '');

    const doc = await EmailScan.create({
      user: req.user._id,
      domain: normalized,
      status: 'running',
    });

    try {
      const results = await runEmailChecks(normalized);

      // ── BERT Phishing Analysis (local model on :5001) ──────────────────
      let bertResult = null;
      if (emailText && String(emailText).trim().length > 0) {
        try {
          bertResult = await emailBertPredict(String(emailText).trim());
          if (bertResult) {
            logger.info(`[EmailScan] BERT: status=${bertResult.status} confidence=${bertResult.confidence}`);
          }
        } catch (bertErr) {
          logger.warn(`[EmailScan] BERT model unavailable: ${bertErr.message}`);
        }
      }

      let aiReport = await requestAiEmailReport({
        userId: req.user._id.toString(),
        emailScanId: doc._id.toString(),
        results,
        emailText: emailText || '',
        bertResult: bertResult || null,
      });
      if (!aiReport) {
        const bertIsMalicious = bertResult?.status === 'PHISHING';
        aiReport = {
          grade: deriveLetterGrade(results, bertResult),
          summary: bertResult
            ? `BERT Phishing Scan: Classified as ${bertResult.status} (${bertResult.confidence} confidence). Threat Level: ${bertResult.threat_level}. ${bertResult.reason}`
            : 'Automated summary (AI unavailable). Review SPF, DMARC, DKIM, and MX results below.',
          spoofable: !!results.spoofable,
          criticalIssues: [
            ...(results.spoofable ? ['Domain may be spoofable (SPF/DMARC)'] : []),
            ...(bertResult ? [`BERT Phishing Scan: ${bertResult.status} (${bertResult.confidence} confidence)`] : []),
          ],
          recommendations: [
            'Enable DMARC with p=reject when ready',
            'Tighten SPF to -all or ~all with explicit includes',
            ...(bertResult?.status === 'PHISHING' || bertResult?.status === 'SUSPICIOUS' ? ['Warning: Do not click links or input credentials based on this email body.'] : [])
          ],
        };
      }

      doc.results = { ...results, bertAnalysis: bertResult };
      doc.aiReport = aiReport;
      doc.grade = aiReport.grade || deriveLetterGrade(results, bertResult);
      doc.status = 'completed';
      doc.markModified('results');
      doc.markModified('aiReport');
      await doc.save();

      return res.status(201).json({ success: true, emailScan: doc });
    } catch (err) {
      doc.status = 'failed';
      doc.errorMessage = err.message;
      await doc.save();
      throw err;
    }
  } catch (e) {
    next(e);
  }
};

function deriveLetterGrade(results, bertResult = null) {
  if (bertResult) {
    if (bertResult.threat_level === 'HIGH') return 'F';
    if (bertResult.threat_level === 'MEDIUM') return 'C';
    if (bertResult.threat_level === 'LOW') return 'A';
  }
  if (!results) return 'F';
  let score = 100;
  if (results.spf?.status === 'FAIL') score -= 25;
  if (results.spf?.status === 'WARN') score -= 10;
  if (results.dmarc?.status === 'FAIL') score -= 25;
  if (results.dmarc?.status === 'WARN') score -= 10;
  if (results.dkim?.status === 'WARN') score -= 5;
  if (results.mx?.status === 'FAIL') score -= 15;
  if (results.spoofable) score -= 15;
  if (results.virusTotal?.malicious > 0) score -= 20;
  score = Math.max(0, Math.min(100, score));
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

const listEmailScans = async (req, res, next) => {
  try {
    const rows = await EmailScan.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50)
      .select('domain status grade createdAt');
    res.json({ success: true, scans: rows });
  } catch (e) {
    next(e);
  }
};

const getEmailScan = async (req, res, next) => {
  try {
    const row = await EmailScan.findOne({ _id: req.params.id, user: req.user._id });
    if (!row) {
      return res.status(404).json({ success: false, message: 'Not found.' });
    }
    res.json({ success: true, emailScan: row });
  } catch (e) {
    next(e);
  }
};

module.exports = { createEmailScan, listEmailScans, getEmailScan };
