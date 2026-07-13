const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');
const external = require('../services/externalAPIs');

const SCANNER_NAME = 'URL Detection Model';

const scan = async (targetUrl) => {
  const findings = [];

  try {
    const prediction = await external.urlDetectionPredict(targetUrl);
    if (!prediction || !prediction.result) {
      return findings;
    }

    const normalized = String(prediction.result).trim().toLowerCase();
    const isMalicious = normalized === 'malicious';

    findings.push({
      findingId: uuidv4(),
      scanner: SCANNER_NAME,
      severity: isMalicious ? 'HIGH' : 'INFO',
      title: isMalicious
        ? 'ML URL model flagged target as malicious'
        : 'ML URL model classified target as benign',
      description: isMalicious
        ? 'The integrated URL detection model classified this URL as malicious. Treat this as strong risk intelligence and validate with additional context.'
        : 'The integrated URL detection model classified this URL as benign at scan time.',
      evidence: `Input URL: ${targetUrl}\nModel output: ${prediction.result}`,
      owaspCategory: 'A04:2021 – Insecure Design',
      remediation: isMalicious
        ? 'Block or quarantine the URL, investigate hosting and redirection chain, and correlate with threat intel sources before allowing user access.'
        : 'Continue layered checks (SSL, headers, content inspection) because benign classification does not guarantee safety.',
      references: [],
    });
  } catch (error) {
    logger.error(`[${SCANNER_NAME}] Error on ${targetUrl}: ${error.message}`);
  }

  return findings;
};

module.exports = { scan, SCANNER_NAME };
