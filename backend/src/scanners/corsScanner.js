// src/scanners/corsScanner.js
// Tests if the target allows arbitrary Origins in the Access-Control-Allow-Origin header.

const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

const SCANNER_NAME = 'CORS Scanner';

const EVIL_ORIGIN = 'https://evil-attacker-site.com';

const scan = async (targetUrl) => {
  const findings = [];
  try {
    const response = await axios.options(targetUrl, {
      headers: { Origin: EVIL_ORIGIN },
      validateStatus: () => true,
      timeout: 5000,
    });

    const acao = response.headers['access-control-allow-origin'];
    const acac = response.headers['access-control-allow-credentials'];

    if (acao === '*' || acao === EVIL_ORIGIN) {
      const severity = (acac === 'true' && acao !== '*') ? 'CRITICAL' : 'HIGH';
      const riskDescription = severity === 'CRITICAL'
        ? 'The server trusts arbitrary origins and allows credentials (cookies/tokens), enabling full account takeover via targeted XHR requests.'
        : 'The server trusts arbitrary origins (* or reflects the Origin header), allowing any website to read sensitive data from authenticated users.';

      findings.push({
        findingId: uuidv4(),
        scanner: SCANNER_NAME,
        severity,
        title: 'Insecure Cross-Origin Resource Sharing (CORS)',
        description: riskDescription,
        evidence: `Request Origin: ${EVIL_ORIGIN}\nAccess-Control-Allow-Origin: ${acao}\nAccess-Control-Allow-Credentials: ${acac || 'not set'}`,
        owaspCategory: 'A05:2021 – Security Misconfiguration',
        remediation: "Explicitly allowlist only trusted domains in the CORS configuration. Never reflect an untrusted Origin header or use '*' when exposing sensitive data.",
        references: [
          'https://portswigger.net/web-security/cors',
          'https://cwe.mitre.org/data/definitions/942.html',
        ],
      });
    }
  } catch (error) {
    logger.error(`[${SCANNER_NAME}] Error on ${targetUrl}: ${error.message}`);
  }

  return findings;
};

module.exports = { scan, SCANNER_NAME };
