const { Router } = require('express');
const { protect } = require('../middleware/auth');
const { uploadPcapMiddleware, uploadPcapScan } = require('../controllers/pcapScanController');

const router = Router();
router.use(protect);

router.post('/upload', uploadPcapMiddleware, uploadPcapScan);

module.exports = router;
