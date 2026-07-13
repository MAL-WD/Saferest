const axios = require('axios');
const logger = require('../utils/logger');

const advise = async (req, res, next) => {
  try {
    const { findingsSummary, stackHint } = req.body;
    const base = (process.env.AI_SERVICE_URL || '').replace(/\/$/, '');
    const { data } = await axios.post(
      `${base}/api/firewall-advise`,
      { findingsSummary, stackHint },
      { timeout: 120000 }
    );
    res.json({ success: true, ...data });
  } catch (e) {
    logger.error(`Firewall advise: ${e.message}`);
    next(e);
  }
};

module.exports = { advise };
