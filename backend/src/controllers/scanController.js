// src/controllers/scanController.js
// Handles scan initiation, status checks, and listing scans.

const Scan = require('../models/Scan');
const Target = require('../models/Target');
const logger = require('../utils/logger');
const { diffFindings, fingerprint } = require('../services/scanDiff');
const { getIO } = require('../config/socket');
const { enqueueScan } = require('../queues/scanQueue');

// Enqueues a scan to the background BullMQ worker
const startScan = async (req, res, next) => {
  try {
    const { targetId, targetUrl, type, options = {} } = req.body;
    let target;

    if (targetId) {
      // Verify user owns the target
      target = await Target.findOne({
        _id: targetId,
        user: req.user._id,
      });
    } else if (targetUrl) {
      // Find or create target on the fly for specific tools
      const sanitizedUrl = targetUrl.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
      target = await Target.findOne({
        user: req.user._id,
        $or: [{ url: targetUrl }, { sanitizedUrl }],
      });

      if (!target) {
        target = await Target.create({
          user: req.user._id,
          url: targetUrl,
          label: sanitizedUrl,
          confirmedOwnership: true, // User confirms this in the tool form
        });
      }
    }

    if (!target) {
      return res.status(404).json({
        success: false,
        message: 'Target not found or access denied.',
      });
    }

    // Create the record
    const scan = await Scan.create({
      user: req.user._id,
      target: target._id,
      type,
      options,
      source: 'manual',
      status: 'queued',
      progress: 0,
      startedAt: new Date(),
    });

    // Dispatch to BullMQ Queue
    await enqueueScan(scan._id.toString(), target.url);

    // Also optimistically notify listeners that a scan was queued
    try {
      getIO().to(`scan:${scan._id}`).emit('scan:queued', {
        scanId: scan._id,
        targetUrl: target.sanitizedUrl,
        type,
      });
    } catch (err) {
      logger.debug('Socket not fully initialized or no listeners, skipping emit');
    }

    logger.info(`Scan started by ${req.user.email} on ${target.sanitizedUrl}`);

    res.status(201).json({
      success: true,
      message: 'Scan initiated successfully.',
      scanId: scan._id,
      status: scan.status,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/scans
// List all scans for the user, with pagination
const getScans = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;

    const scans = await Scan.find({ user: req.user._id })
      .populate('target', 'url sanitizedUrl label')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-findings'); // exclude heavy findings array for the list view

    const total = await Scan.countDocuments({ user: req.user._id });

    res.status(200).json({
      success: true,
      count: scans.length,
      pagination: {
        page,
        pages: Math.ceil(total / limit),
        total,
      },
      scans,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/scans/:id
// Get details of a single scan including all findings
const getScan = async (req, res, next) => {
  try {
    const scan = await Scan.findOne({
      _id: req.params.id,
      user: req.user._id,
    }).populate('target', 'url sanitizedUrl label confirmedOwnership');

    if (!scan) {
      return res.status(404).json({
        success: false,
        message: 'Scan not found or access denied.',
      });
    }

    const scanObj = scan.toObject ? scan.toObject() : scan;
    if (scan.source === 'scheduled' && scan.previousScanId) {
      try {
        const { newFindings, resolvedFindings } = await diffFindings(scan.previousScanId, scan._id);
        const newFp = new Set(newFindings.map((f) => fingerprint(f)));
        scanObj.findings = (scan.findings || []).map((f) => {
          const o = f.toObject ? f.toObject() : { ...f };
          if (newFp.has(fingerprint(f))) o.diffStatus = 'new';
          return o;
        });
        scanObj.resolvedFindings = resolvedFindings.map((f) => {
          const o = f.toObject ? f.toObject() : { ...f };
          o.diffStatus = 'resolved';
          return o;
        });
      } catch (e) {
        logger.warn(`[getScan] diff enrich skipped: ${e.message}`);
      }
    }

    res.status(200).json({
      success: true,
      scan: scanObj,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/scans/global-findings
// Aggregates all findings across all scans for the user
const getGlobalFindings = async (req, res, next) => {
  try {
    const scans = await Scan.find({ user: req.user._id })
      .populate('target', 'url sanitizedUrl label')
      .sort({ createdAt: -1 })
      .select('findings target createdAt');

    let allFindings = [];
    scans.forEach(scan => {
      if (scan.findings && scan.findings.length > 0) {
        scan.findings.forEach(finding => {
          allFindings.push({
            ...finding.toObject(),
            target: scan.target,
            scanId: scan._id,
            discoveredAt: scan.createdAt
          });
        });
      }
    });

    // Optional: Deduplicate by title+target
    const uniqueFindingsMap = new Map();
    allFindings.forEach(f => {
      const targetId = f.target && f.target._id ? f.target._id : 'unknown-target';
      const key = `${targetId}-${f.title}`;
      if (!uniqueFindingsMap.has(key) || uniqueFindingsMap.get(key).severity < f.severity) {
        uniqueFindingsMap.set(key, f);
      }
    });

    res.status(200).json({
      success: true,
      count: uniqueFindingsMap.size,
      findings: Array.from(uniqueFindingsMap.values())
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/scans/attack-surface
// Aggregates all recon data across all scans for the user
const getAttackSurface = async (req, res, next) => {
  try {
    const scans = await Scan.find({ user: req.user._id })
      .populate('target', 'url sanitizedUrl')
      .sort({ createdAt: -1 })
      .select('reconData target');

    const attackSurface = [];
    const seenTargets = new Set();

    scans.forEach(scan => {
      if (scan.target && !seenTargets.has(scan.target._id.toString())) {
        seenTargets.add(scan.target._id.toString());
        if (scan.reconData) {
          attackSurface.push({
            target: scan.target,
            reconData: scan.reconData
          });
        }
      }
    });

    res.status(200).json({
      success: true,
      attackSurface
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { startScan, getScans, getScan, getGlobalFindings, getAttackSurface };
