// src/scanners/sslScanner.js
// Fetches the SSL/TLS certificate of the target and checks expiry, grade, and protocol.

const sslChecker = require('ssl-checker');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

const SCANNER_NAME = 'SSL/TLS Scanner';

const scan = async (targetUrl, ctx = {}) => {
  const findings = [];
  try {
    const url = new URL(targetUrl);
    
    // Only test HTTPS
    if (url.protocol !== 'https:') {
      findings.push({
        findingId: uuidv4(),
        scanner: SCANNER_NAME,
        severity: 'CRITICAL',
        title: 'Insecure Protocol (HTTP instead of HTTPS)',
        description: 'The target is served over unencrypted HTTP. All data transmitted between the client and server can be intercepted.',
        evidence: `Target URL is ${targetUrl}`,
        owaspCategory: 'A02:2021 – Cryptographic Failures',
        remediation: 'Enforce HTTPS for the entire application and implement an HTTP to HTTPS redirect.',
        references: ['https://cheatsheetseries.owasp.org/cheatsheets/Transport_Layer_Protection_Cheat_Sheet.html'],
      });
      return findings;
    }

    const host = url.hostname;
    // ssl-checker throws if resolution fails or no cert exists
    const certInfo = await sslChecker(host, { method: 'GET', port: 443 }).catch((err) => {
      throw new Error(`Failed to check SSL: ${err.message}`);
    });

    if (!certInfo.valid) {
      findings.push({
        findingId: uuidv4(),
        scanner: SCANNER_NAME,
        severity: 'HIGH',
        title: 'Invalid SSL/TLS Certificate',
        description: 'The SSL certificate is invalid, untrusted, or mismatched with the hostname.',
        evidence: JSON.stringify(certInfo, null, 2),
        owaspCategory: 'A02:2021 – Cryptographic Failures',
        remediation: 'Install a valid TLS certificate from a trusted Certificate Authority (e.g. Let\'s Encrypt).',
        references: ['https://cwe.mitre.org/data/definitions/295.html'],
      });
    }

    if (certInfo.daysRemaining <= 15 && certInfo.daysRemaining > 0) {
      findings.push({
        findingId: uuidv4(),
        scanner: SCANNER_NAME,
        severity: 'MEDIUM',
        title: 'SSL Certificate Expiring Soon',
        description: `The TLS certificate will expire in ${certInfo.daysRemaining} days.`,
        evidence: `Valid To: ${certInfo.validTo}`,
        owaspCategory: 'A02:2021 – Cryptographic Failures',
        remediation: 'Renew the TLS certificate immediately or set up an auto-renewal process.',
        references: [],
      });
    } else     if (certInfo.daysRemaining <= 0) {
      findings.push({
        findingId: uuidv4(),
        scanner: SCANNER_NAME,
        severity: 'HIGH',
        title: 'SSL Certificate Expired',
        description: 'The TLS certificate has expired. Browsers will show a strict security warning to users.',
        evidence: `Valid To: ${certInfo.validTo}`,
        owaspCategory: 'A02:2021 – Cryptographic Failures',
        remediation: 'Renew and deploy a new TLS certificate immediately.',
        references: ['https://cwe.mitre.org/data/definitions/298.html'],
      });
    }

    if (url.protocol === 'https:' && ctx.scanId) {
      try {
        const { enqueueSslLabsJob } = require('../queues/sslLabsQueue');
        await enqueueSslLabsJob({ scanId: ctx.scanId.toString(), host: url.hostname });
      } catch (e) {
        logger.warn(`[${SCANNER_NAME}] SSL Labs enqueue skipped: ${e.message}`);
      }
    }

  } catch (error) {
    logger.error(`[${SCANNER_NAME}] Error on ${targetUrl}: ${error.message}`);
    // If we literally couldn't connect via HTTPS to check the cert, log as medium.
    findings.push({
      findingId: uuidv4(),
      scanner: SCANNER_NAME,
      severity: 'MEDIUM',
      title: 'SSL Connection Failed',
      description: 'Could not establish a secure TLS connection to analyze the certificate.',
      evidence: error.message,
      owaspCategory: 'A02:2021 – Cryptographic Failures',
      remediation: 'Ensure port 443 is open and a valid TLS cert is being served.',
      references: [],
    });
  }
  return findings;
};

module.exports = { scan, SCANNER_NAME };
