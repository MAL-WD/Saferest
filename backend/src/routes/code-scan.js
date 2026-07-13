const { Router } = require('express');
const Joi = require('joi');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  createCodeScan,
  uploadCodeScan,
  githubCodeScan,
  listCodeScans,
  getCodeScan,
  deleteCodeScan,
  exportJSON,
  testAI,
  upload,
} = require('../controllers/codeScanController');

const router = Router();

// Public routes (no auth required)
// Quick connectivity test for AI API
router.get('/ai/test', testAI);

// All routes below require authentication
router.use(protect);

const postSchema = Joi.object({
  code: Joi.string().min(1).max(500000).required(),
  language: Joi.string().min(1).max(32).optional(),
  filename: Joi.string().max(200).optional(),
});

const githubSchema = Joi.object({
  repoUrl: Joi.string().uri().required(),
  branch: Joi.string().max(100).optional(),
  path: Joi.string().max(500).optional(),
  token: Joi.string().max(500).optional(),
});

const idSchema = Joi.object({
  id: Joi.string().hex().length(24).required(),
});

// Paste code
router.post('/', validate(postSchema), createCodeScan);

// Upload file
router.post('/upload', upload.single('file'), uploadCodeScan);

// GitHub repository
router.post('/github', validate(githubSchema), githubCodeScan);

// List scans
router.get('/', listCodeScans);

// Get scan by ID
router.get('/:id', validate(idSchema, 'params'), getCodeScan);

// Export as JSON
router.get('/:id/export/json', validate(idSchema, 'params'), exportJSON);

// Delete scan
router.delete('/:id', validate(idSchema, 'params'), deleteCodeScan);

module.exports = router;
