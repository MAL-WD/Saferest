const Automation = require('../models/Automation');
const { computeNextScanAt } = require('../services/scheduleUtils');
const logger = require('../utils/logger');

exports.createAutomation = async (req, res, next) => {
  try {
    const { target, customInput, tool, schedule } = req.body;

    if (!target && !customInput) {
      return res.status(400).json({ error: 'Either target or customInput is required' });
    }

    const nextRunAt = computeNextScanAt(schedule, 1440, new Date()); // using 1440 mins default for custom

    const automation = await Automation.create({
      user: req.user.id,
      target,
      customInput,
      tool,
      schedule,
      nextRunAt,
    });

    res.status(201).json({ success: true, data: automation });
  } catch (error) {
    logger.error(`Error creating automation: ${error.message}`);
    next(error);
  }
};

exports.getAutomations = async (req, res, next) => {
  try {
    const automations = await Automation.find({ user: req.user.id })
      .populate('target', 'url sanitizedUrl label')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: automations });
  } catch (error) {
    logger.error(`Error fetching automations: ${error.message}`);
    next(error);
  }
};

exports.updateAutomation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isActive, schedule } = req.body;

    const automation = await Automation.findOne({ _id: id, user: req.user.id });
    if (!automation) {
      return res.status(404).json({ error: 'Automation not found' });
    }

    if (isActive !== undefined) automation.isActive = isActive;
    if (schedule) {
      automation.schedule = schedule;
      automation.nextRunAt = computeNextScanAt(schedule, 1440, new Date());
    }

    await automation.save();
    res.status(200).json({ success: true, data: automation });
  } catch (error) {
    logger.error(`Error updating automation: ${error.message}`);
    next(error);
  }
};

exports.deleteAutomation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const automation = await Automation.findOneAndDelete({ _id: id, user: req.user.id });

    if (!automation) {
      return res.status(404).json({ error: 'Automation not found' });
    }

    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    logger.error(`Error deleting automation: ${error.message}`);
    next(error);
  }
};
