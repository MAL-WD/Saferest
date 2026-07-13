// src/routes/scans.js
// Routes for initiating and investigating security scans.

const { Router } = require('express');
const Joi = require('joi');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { scanLimiter } = require('../middleware/rateLimiter');
const { startScan, getScans, getScan, getGlobalFindings, getAttackSurface } = require('../controllers/scanController');

const router = Router();

// Apply auth middleware to all scan routes
router.use(protect);

const newScanSchema = Joi.object({
  targetId: Joi.string().hex().length(24).label('Target ID'),
  targetUrl: Joi.string().allow('').optional().label('Target URL'),
  type: Joi.string().valid('passive', 'active').required().label('Scan Type'),
  options: Joi.object().optional(),
}).or('targetId', 'targetUrl');

const idSchema = Joi.object({
  id: Joi.string().hex().length(24).required().label('Scan ID'),
});

// POST /api/scans — start a new scan (rate limited to prevent abuse)
router.post('/', scanLimiter, validate(newScanSchema), startScan);

// GET /api/scans — list all of a user's scans
router.get('/', getScans);

// GET /api/scans/global-findings — list aggregated findings
router.get('/global-findings', getGlobalFindings);

// GET /api/scans/attack-surface — list aggregated recon data
router.get('/attack-surface', getAttackSurface);

// GET /api/scans/:id — fetch full details and findings of a specific scan
router.get('/:id', validate(idSchema, 'params'), getScan);

module.exports = router;
