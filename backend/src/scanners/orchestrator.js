// src/scanners/orchestrator.js
// Runs all 10 scanner modules concurrently, aggregates findings,
// and emits real-time progress events via Socket.io.

const Scan = require('../models/Scan');
const Target = require('../models/Target');
const logger = require('../utils/logger');
const { diffFindings } = require('../services/scanDiff');
const { sendScheduledScanAlert } = require('../services/emailAlert');
const { recordScoreForScan } = require('../services/securityScoreService');
const { getIO } = require('../config/socket');
const axios = require('axios');
const Spider = require('../services/spider');

// Import all 10 scanners
const dnsRecon = require('./dnsRecon');
const httpHeaders = require('./httpHeaders');
const sslScanner = require('./sslScanner');
const portScanner = require('./portScanner');
const openRedirect = require('./openRedirect');
const xssScanner = require('./xssScanner');
const sqliScanner = require('./sqliScanner');
const corsScanner = require('./corsScanner');
const directoryTraversal = require('./directoryTraversal');
const cveLookup = require('./cveLookup');
const dnsReconActive = require('./recon/dns-recon');
const subdomainEnum = require('./recon/subdomain-enum');
const httpMethodTester = require('./httpMethodTester');
const corsTester = require('./corsTester');
const urlDetectionScanner = require('./urlDetectionScanner');

const PASSIVE_SCANNERS = [
  dnsRecon,
  httpHeaders,
  sslScanner,
  portScanner,
  openRedirect,
  xssScanner,
  sqliScanner,
  corsScanner,
  directoryTraversal,
  cveLookup,
  urlDetectionScanner,
];

const ACTIVE_SCANNERS = [
  dnsRecon,
  httpHeaders,
  sslScanner,
  portScanner,
  openRedirect,
  xssScanner,
  sqliScanner,
  directoryTraversal,
  cveLookup,
  httpMethodTester,
  corsTester,
  urlDetectionScanner,
];

// Recon Tools - Separate from website scanners
const RECON_SCANNERS = [
  dnsReconActive,
  subdomainEnum,
];

const scannersForType = (type) => (type === 'active' ? ACTIVE_SCANNERS : PASSIVE_SCANNERS);

const triggerAIReportGeneration = async ({ scan, targetUrl }) => {
  const aiServiceBaseUrl = process.env.AI_SERVICE_URL;
  if (!aiServiceBaseUrl) {
    logger.warn(`[Orchestrator] AI_SERVICE_URL missing, skipping AI report request for ${scan._id}`);
    return;
  }

  const reportEndpoint = `${aiServiceBaseUrl.replace(/\/$/, '')}/report`;

  try {
    await axios.post(
      reportEndpoint,
      {
        scanId: scan._id.toString(),
        userId: scan.user.toString(),
        targetUrl,
        findings: scan.findings.map((finding) => ({
          findingId: finding.findingId,
          scanner: finding.scanner,
          severity: finding.severity,
          title: finding.title,
          description: finding.description,
          evidence: finding.evidence || '',
          owaspCategory: finding.owaspCategory || 'Other',
          remediation: finding.remediation || '',
          references: Array.isArray(finding.references) ? finding.references : [],
        })),
      },
      { timeout: 10000 }
    );

    logger.info(`[Orchestrator] AI report request accepted for scan ${scan._id}`);
  } catch (error) {
    const responseBody = error.response?.data ? JSON.stringify(error.response.data) : '';
    logger.error(
      `[Orchestrator] Failed to trigger AI report for scan ${scan._id}: ${error.message}${responseBody ? ` response=${responseBody}` : ''}`
    );
  }
};

// Execute a single scan job (called by the BullMQ worker)
const runScan = async (scanId, targetUrl) => {
  try {
    const scan = await Scan.findById(scanId);
    if (!scan) throw new Error(`Scan ${scanId} not found`);

    scan.status = 'running';
    scan.startedAt = new Date();
    await scan.save();

    // Notify listeners scan started
    try {
      getIO().to(`scan:${scan._id}`).emit('scan:started', {
        scanId: scan._id,
        startedAt: scan.startedAt,
      });
    } catch (e) {}

    let modules = scannersForType(scan.type);

    // Feature: Dedicated Tool Execution
    // If the scan was initiated from a specific tool (e.g. Port Scanner), only run that module.
    if (scan.options && scan.options.scanner === 'port') {
      modules = [portScanner];
    } else if (scan.options && scan.options.scanner === 'subfinder') {
      modules = [subdomainEnum];
    }

    let completedScanners = 0;
    const totalScanners = modules.length;
    
    let crawledData = { urls: [targetUrl], forms: [] };
    if (scan.type === 'active' && !scan.options?.scanner) {
      try {
        await Scan.findByIdAndUpdate(scanId, { currentScanner: 'Deep Application Spider' });
        const spider = new Spider(targetUrl);
        crawledData = await spider.crawl();
      } catch (err) {
        logger.error(`[Orchestrator] Spider failed for ${targetUrl}: ${err.message}`);
      }
    }

    const ctx = { scanId: scan._id, scanType: scan.type, crawledData };

    // Run all modules concurrently. 
    // Mongoose array push isn't strictly thread-safe in JS memory if we save concurrently,
    // so we await all promises and aggregate at the end, OR save individually.
    // For real-time updates without huge memory spikes, we process results as they finish.

    const scanPromises = modules.map(async (module) => {
      try {
        // Update DB currentScanner safely (last one wins but progress is correct)
        await Scan.findByIdAndUpdate(scanId, { currentScanner: module.SCANNER_NAME });

        // Run the specific scanner logic
        const moduleFindings = await module.scan(targetUrl, ctx);

        if (moduleFindings && moduleFindings.length > 0) {
          // Push findings to DB and update array
          const updatedScan = await Scan.findByIdAndUpdate(
            scanId,
            { $push: { findings: { $each: moduleFindings } } },
            { returnDocument: 'after' }
          );

          // Emit each finding live to UI
          try {
            const io = getIO();
            for (const finding of moduleFindings) {
              io.to(`scan:${scanId}`).emit('scan:finding', { scanId, finding });
            }
          } catch (e) {}
        }

        completedScanners++;
        const progress = Math.floor((completedScanners / totalScanners) * 100);

        // Update progress in DB and emit
        await Scan.findByIdAndUpdate(scanId, { progress });
        
        try {
          getIO().to(`scan:${scanId}`).emit('scan:progress', {
            scanId,
            scanner: module.SCANNER_NAME,
            percent: progress,
          });
        } catch (e) {}

      } catch (err) {
        logger.error(`[Orchestrator] Error running ${module.SCANNER_NAME} on ${targetUrl}: ${err.message}`);
      }
    });

    // Wait for all 10 modules to finish
    await Promise.allSettled(scanPromises);

    // Finalize scan
    const finalScan = await Scan.findById(scanId);
    finalScan.status = 'completed';
    finalScan.progress = 100;
    finalScan.completedAt = new Date();
    finalScan.calculateSummary(); // calculate counts per severity
    await finalScan.save();

    logger.info(`Scan ${scanId} completed. Total findings: ${finalScan.summary.total}`);

    try {
      const host = new URL(targetUrl).hostname.replace(/^www\./, '');
      await recordScoreForScan(finalScan.user, host, finalScan);
    } catch (e) {
      logger.warn(`[Orchestrator] Security score record skipped: ${e.message}`);
    }

    // Emit completion event
    try {
      getIO().to(`scan:${scanId}`).emit('scan:completed', {
        scanId,
        summary: finalScan.summary,
      });
    } catch (e) {}

    // Fire-and-forget AI report generation once scan findings are finalized.
    await triggerAIReportGeneration({
      scan: finalScan,
      targetUrl,
    });

    if (finalScan.source === 'scheduled' && finalScan.previousScanId) {
      try {
        const { newFindings } = await diffFindings(finalScan.previousScanId, finalScan._id);
        if (newFindings.length > 0) {
          const targetDoc = await Target.findById(finalScan.target).populate('user');
          if (targetDoc?.schedule?.emailAlerts && targetDoc.user?.email) {
            await sendScheduledScanAlert({
              to: targetDoc.user.email,
              domain: targetDoc.sanitizedUrl || targetDoc.url,
              newFindings,
              scanId: finalScan._id,
            });
            targetDoc.schedule.lastAlertAt = new Date();
            await targetDoc.save();
          }
        }
      } catch (e) {
        logger.error(`[Orchestrator] Scheduled scan alert: ${e.message}`);
      }
    }

    return finalScan;

  } catch (error) {
    logger.error(`[Orchestrator] Global scan failure for ${scanId}: ${error.message}`);
    
    // Mark scan as failed
    const failedScan = await Scan.findByIdAndUpdate(
      scanId,
      { status: 'failed', errorMessage: error.message, completedAt: new Date() },
      { returnDocument: 'after' }
    );

    try {
      getIO().to(`scan:${scanId}`).emit('scan:failed', { scanId, error: error.message });
    } catch (e) {}

    throw error;
  }
};

module.exports = { runScan, PASSIVE_SCANNERS, ACTIVE_SCANNERS, RECON_SCANNERS, scannersForType };
