// src/routes/targets.js
// Routes for managing scan targets.
// All routes are protected by JWT authentication.

const { Router } = require('express');
const Joi = require('joi');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  createTarget,
  getTargets,
  getTarget,
  deleteTarget,
  patchSchedule,
} = require('../controllers/targetController');

const router = Router();

// Apply auth middleware to all target routes
router.use(protect);

const targetSchema = Joi.object({
  url: Joi.string().uri({ scheme: ['http', 'https'] }).required().label('URL'),
  label: Joi.string().allow('').max(100).optional().label('Label'),
  confirmedOwnership: Joi.boolean().valid(true).required().messages({
    'any.only': 'You must confirm ownership to add a target.',
  }),
});

const idSchema = Joi.object({
  id: Joi.string().hex().length(24).required().label('Target ID'),
});

const scheduleSchema = Joi.object({
  schedule: Joi.object({
    enabled: Joi.boolean(),
    frequency: Joi.string().valid('daily', 'weekly', 'monthly', 'custom'),
    customIntervalMinutes: Joi.number().min(60).max(43200),
    emailAlerts: Joi.boolean(),
    nextScanAt: Joi.date(),
  }).required(),
});

// POST /api/targets
router.post('/', validate(targetSchema), createTarget);

// GET /api/targets
router.get('/', getTargets);

router.patch('/:id/schedule', validate(idSchema, 'params'), validate(scheduleSchema), patchSchedule);

// GET /api/targets/:id
router.get('/:id', validate(idSchema, 'params'), getTarget);

// DELETE /api/targets/:id
router.delete('/:id', validate(idSchema, 'params'), deleteTarget);

module.exports = router;
