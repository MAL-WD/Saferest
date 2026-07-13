// src/routes/reports.js
// Routes for accessing AI-generated remediation reports.

const { Router } = require('express');
const Joi = require('joi');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { getReportByScanId, receiveReportWebhook, listReports } = require('../controllers/reportController');

const router = Router();

// Define validation schema for GET /:scanId

const scanIdSchema = Joi.object({
  scanId: Joi.string().hex().length(24).required().label('Scan ID'),
});

// POST /api/reports/webhook
// This route is NOT protected by standard JWT auth because it's called by the internal Python service.
// It uses its own secret header validation inside the controller.
router.post('/webhook', receiveReportWebhook);

// GET /api/reports — list all reports for the user
router.get('/', protect, listReports);

// GET /api/reports/:scanId
// Gets full AI report for a scan, with gracefully handled pending states
router.get('/:scanId', protect, validate(scanIdSchema, 'params'), getReportByScanId);

module.exports = router;
