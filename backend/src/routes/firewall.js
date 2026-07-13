const { Router } = require('express');
const Joi = require('joi');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { advise } = require('../controllers/firewallController');

const router = Router();
router.use(protect);

const bodySchema = Joi.object({
  findingsSummary: Joi.string().min(10).max(20000).required(),
  stackHint: Joi.string().max(200).optional(),
});

router.post('/advise', validate(bodySchema), advise);

module.exports = router;
