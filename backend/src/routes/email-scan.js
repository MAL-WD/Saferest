const { Router } = require('express');
const Joi = require('joi');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createEmailScan, listEmailScans, getEmailScan } = require('../controllers/emailScanController');

const router = Router();
router.use(protect);

const postSchema = Joi.object({
  domain: Joi.string().min(3).max(253).required(),
  emailText: Joi.string().allow('', null).optional(),
  confirmedAuthorization: Joi.boolean().valid(true).required(),
});

const idSchema = Joi.object({
  id: Joi.string().hex().length(24).required(),
});

router.post('/', validate(postSchema), createEmailScan);
router.get('/', listEmailScans);
router.get('/:id', validate(idSchema, 'params'), getEmailScan);

module.exports = router;
