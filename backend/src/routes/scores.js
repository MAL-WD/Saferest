const { Router } = require('express');
const { protect } = require('../middleware/auth');
const { listScores, historyForDomain } = require('../controllers/scoreController');

const router = Router();
router.use(protect);
router.get('/', listScores);
router.get('/domain/:domain', historyForDomain);

module.exports = router;
