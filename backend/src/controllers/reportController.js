// src/controllers/reportController.js
// Handles fetching AI remediation reports.
// Does NOT trigger the generation (that's done by the orchestrator via the Python service).

const AIReport = require('../models/AIReport');
const Scan = require('../models/Scan');
const logger = require('../utils/logger');
const { getIO } = require('../config/socket');

const PRIORITY_TO_SCORE = {
  critical: 10,
  high: 8,
  medium: 5,
  low: 3,
  info: 1,
};

// GET /api/reports/:scanId
// Fetch the AI remediation report for a specific scan
const getReportByScanId = async (req, res, next) => {
  try {
    const { scanId } = req.params;

    // Verify user owns the scan
    const scan = await Scan.findOne({
      _id: scanId,
      user: req.user._id,
    });

    if (!scan) {
      return res.status(404).json({
        success: false,
        message: 'Scan not found or access denied.',
      });
    }

    const report = await AIReport.findOne({ scan: scanId });

    if (!report) {
      if (scan.status === 'completed') {
        // Scan finished but report never generated
        return res.status(202).json({
          success: true,
          status: 'pending',
          message: 'Scan completed, AI report generation in progress or failed.',
        });
      } else {
        // Scan hasn't finished yet
        return res.status(404).json({
          success: false,
          status: 'unavailable',
          message: 'Scan is not yet complete. Report unavailable.',
        });
      }
    }

    res.status(200).json({
      success: true,
      report,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/reports/webhook
// Internal webhook called by the Python AI Service when a report is fully generated.
// Expected body: { scanId, userId, executiveSummary, overallRiskScore, findingsRefinement, ... }
const receiveReportWebhook = async (req, res, next) => {
  try {
    // In a prod environment, you'd want to secure this webhook!
    // Options: A shared secret token in headers, or restricting by internal Docker network IP.
    const expectedSecret = process.env.AI_WEBHOOK_SECRET || 'saferest_internal_ai_webhook_secret_123';
    // Express lowercases all headers automatically
    const providedSecret = req.headers['x-ai-secret'] || '';

    // Temp debug logging:
    logger.debug(`Webhook debug: expected=${expectedSecret}, provided=${providedSecret}, req.headers keys: ${Object.keys(req.headers).join(', ')}`);

    if (providedSecret !== expectedSecret) {
      logger.warn(`Unauthorized webhook attempt from IP ${req.ip}`);
      return res.status(401).json({ success: false, message: 'Invalid webhook secret' });
    }

    const { scanId, userId, executiveSummary, overallRiskScore, findings, status, errorMessage, modelUsed } = req.body;

    // Verify scan actually exists
    const scan = await Scan.findById(scanId);
    if (!scan) {
      return res.status(404).json({ success: false, message: 'Associated scan not found' });
    }

    const normalizedFindings = Array.isArray(findings)
      ? findings.map((finding) => {
          const priorityRaw = finding?.priority;
          const priority =
            typeof priorityRaw === 'number'
              ? Math.min(10, Math.max(1, Math.round(priorityRaw)))
              : PRIORITY_TO_SCORE[String(priorityRaw || '').toLowerCase()] || 5;

          return {
            findingId: finding?.findingId || '',
            priority,
            remediationSteps: Array.isArray(finding?.remediationSteps) ? finding.remediationSteps : [],
            codeExample: {
              vulnerable: finding?.codeExample?.vulnerable || '',
              fixed: finding?.codeExample?.fixed || '',
            },
            references: Array.isArray(finding?.references) ? finding.references : [],
          };
        })
      : [];

    if (status === 'generated' && (!executiveSummary || typeof overallRiskScore !== 'number')) {
      return res.status(400).json({
        success: false,
        message: 'Generated reports require executiveSummary and overallRiskScore.',
      });
    }

    const updatePayload = {
      user: userId || scan.user,
      status: status || 'generated',
      findings: normalizedFindings,
      modelUsed: modelUsed || '',
      errorMessage: status === 'failed' ? errorMessage || 'AI report generation failed.' : null,
      generatedAt: status === 'generated' || !status ? new Date() : null,
    };

    updatePayload.executiveSummary =
      executiveSummary || (status === 'failed' ? 'AI report generation failed before a summary was produced.' : 'Report generation in progress.');
    updatePayload.overallRiskScore = typeof overallRiskScore === 'number' ? overallRiskScore : 0;

    // Upsert the report (in case the AI is paginating/updating an ongoing generation)
    const report = await AIReport.findOneAndUpdate(
      { scan: scanId },
      updatePayload,
      { new: true, upsert: true } // Create if doesn't exist
    );

    // Notify the frontend that the report is ready
    if (status === 'generated' || !status) {
      logger.info(`AI Report finalized for Scan ${scanId}`);
      try {
        getIO().to(`scan:${scanId}`).emit('report:ready', {
          scanId,
          reportId: report._id,
        });
      } catch (e) {}
    }

    res.status(200).json({
      success: true,
      message: 'Report received successfully.',
      reportId: report._id,
    });
  } catch (error) {
    logger.error(`Webhook error: ${error.message}`);
    next(error);
  }
};

// GET /api/reports
// List all AI reports for the authenticated user
const listReports = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 50;
    const page = parseInt(req.query.page, 10) || 1;
    const skip = (page - 1) * limit;

    const [reports, total] = await Promise.all([
      AIReport.find({ user: req.user._id })
        .populate({
          path: 'scan',
          select: 'type status createdAt target',
          populate: { path: 'target', select: 'url sanitizedUrl label' },
        })
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      AIReport.countDocuments({ user: req.user._id }),
    ]);

    res.status(200).json({
      success: true,
      count: reports.length,
      pagination: {
        page,
        pages: Math.ceil(total / limit) || 1,
        total,
      },
      reports,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getReportByScanId, receiveReportWebhook, listReports };
