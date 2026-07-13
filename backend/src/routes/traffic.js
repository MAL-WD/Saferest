const { Router } = require('express');
const multer = require('multer');
const Joi = require('joi');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { uploadTraffic, listTraffic, getTraffic } = require('../controllers/trafficController');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
});

const router = Router();
router.use(protect);

const idSchema = Joi.object({
  id: Joi.string().hex().length(24).required(),
});

router.post('/upload', upload.single('file'), uploadTraffic);
router.get('/', listTraffic);
router.get('/:id', validate(idSchema, 'params'), getTraffic);

module.exports = router;
