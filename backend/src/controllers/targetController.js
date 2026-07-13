// src/controllers/targetController.js
// Handles CRUD operations for Scan Targets.
// All routes expect the user to be authenticated (req.user available).

const Target = require('../models/Target');
const User = require('../models/User');
const logger = require('../utils/logger');

// POST /api/targets
// Create a new target
const createTarget = async (req, res, next) => {
  try {
    const { url, label, confirmedOwnership } = req.body;

    const target = await Target.create({
      user: req.user._id,
      url,
      label,
      confirmedOwnership,
    });

    logger.info(`Target created by ${req.user.email}: ${target.sanitizedUrl}`);

    res.status(201).json({
      success: true,
      message: 'Target added successfully.',
      target,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/targets
// List all targets for the authenticated user
const getTargets = async (req, res, next) => {
  try {
    const targets = await Target.find({ user: req.user._id })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: targets.length,
      targets,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/targets/:id
// Get a specific target by ID
const getTarget = async (req, res, next) => {
  try {
    const target = await Target.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!target) {
      return res.status(404).json({
        success: false,
        message: 'Target not found or access denied.',
      });
    }

    res.status(200).json({
      success: true,
      target,
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/targets/:id
// Delete a target (does not aggressively cascade delete scans yet to preserve history)
const deleteTarget = async (req, res, next) => {
  try {
    const target = await Target.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!target) {
      return res.status(404).json({
        success: false,
        message: 'Target not found or access denied.',
      });
    }

    logger.info(`Target deleted by ${req.user.email}: ${target.sanitizedUrl}`);

    res.status(200).json({
      success: true,
      message: 'Target deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

const patchSchedule = async (req, res, next) => {
  try {
    const target = await Target.findOne({ _id: req.params.id, user: req.user._id });
    if (!target) {
      return res.status(404).json({ success: false, message: 'Target not found or access denied.' });
    }

    const u = await User.findById(req.user._id);
    const body = req.body.schedule || {};
    if (!target.schedule) target.schedule = {};
    if (body.enabled && u.planTier !== 'pro') {
      return res.status(403).json({
        success: false,
        message: 'Scheduled monitoring requires a Pro plan.',
      });
    }

    for (const k of Object.keys(body)) {
      target.schedule[k] = body[k];
    }
    if (target.schedule.enabled) {
      if (!target.schedule.nextScanAt || new Date(target.schedule.nextScanAt) < new Date()) {
        target.schedule.nextScanAt = new Date(Date.now() + 60_000);
      }
    }
    target.markModified('schedule');
    await target.save();
    res.json({ success: true, target });
  } catch (e) {
    next(e);
  }
};

module.exports = { createTarget, getTargets, getTarget, deleteTarget, patchSchedule };
