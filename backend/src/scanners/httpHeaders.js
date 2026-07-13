// src/scanners/httpHeaders.js
// Analyzes HTTP security headers returned by the root URL.

const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

const SCANNER_NAME = 'HTTP Headers';

// Required security headers and their remediation advice
const REQUIRED_HEADERS = {
  'content-security-policy': {
    severity: 'HIGH',
    title: 'Missing Content-Security-Policy (CSP)',
    description: 'CSP mitigates Cross-Site Scripting (XSS) and data injection attacks by restricting where resources can be loaded from.',
    remediation: "Add a Content-Security-Policy header (e.g. default-src 'self').",
  },
  'strict-transport-security': {
    severity: 'MEDIUM',
    title: 'Missing HTTP Strict Transport Security (HSTS)',
    description: 'HSTS forces browsers to only connect using HTTPS, preventing protocol downgrade attacks.',
    remediation: 'Add Strict-Transport-Security: max-age=31536000; includeSubDomains.',
  },
  'x-frame-options': {
    severity: 'MEDIUM',
    title: 'Missing X-Frame-Options',
    description: 'Prevents the site from being framed, mitigating Clickjacking attacks.',
    remediation: 'Add X-Frame-Options: DENY or SAMEORIGIN.',
  },
  'x-content-type-options': {
    severity: 'LOW',
    title: 'Missing X-Content-Type-Options',
    description: 'Prevents the browser from MIME-sniffing a response away from the declared content-type.',
    remediation: 'Add X-Content-Type-Options: nosniff.',
  },
};

const scan = async (targetUrl) => {
  const findings = [];
  try {
    const response = await axios.get(targetUrl, {
      timeout: 10000,
      validateStatus: () => true, // resolve regardless of HTTP status
    });

    const headers = response.headers;

    for (const [key, spec] of Object.entries(REQUIRED_HEADERS)) {
      if (!headers[key]) {
        findings.push({
          findingId: uuidv4(),
          scanner: SCANNER_NAME,
          severity: spec.severity,
          title: spec.title,
          description: spec.description,
          evidence: `Header '${key}' was not found in the HTTP response.`,
          owaspCategory: 'A05:2021 – Security Misconfiguration',
          remediation: spec.remediation,
          references: ['https://owasp.org/www-project-secure-headers/'],
        });
      }
    }

    // Check for sensitive server disclosure
    if (headers['server']) {
      findings.push({
        findingId: uuidv4(),
        scanner: SCANNER_NAME,
        severity: 'INFO',
        title: 'Server Version Disclosure',
        description: 'The server discloses its software and version in the Server header. This helps attackers footprint the target.',
        evidence: `Server: ${headers['server']}`,
        owaspCategory: 'A05:2021 – Security Misconfiguration',
        remediation: 'Configure your web server to hide or spoof the Server banner.',
        references: ['https://cwe.mitre.org/data/definitions/200.html'],
      });
    }

    if (headers['x-powered-by']) {
      findings.push({
        findingId: uuidv4(),
        scanner: SCANNER_NAME,
        severity: 'LOW',
        title: 'Framework Version Disclosure',
        description: 'The X-Powered-By header reveals the backend framework (e.g., Express, PHP, ASP.NET).',
        evidence: `X-Powered-By: ${headers['x-powered-by']}`,
        owaspCategory: 'A05:2021 – Security Misconfiguration',
        remediation: 'Remove the X-Powered-By header attached by the framework.',
        references: ['https://cwe.mitre.org/data/definitions/200.html'],
      });
    }

  } catch (error) {
    logger.error(`[${SCANNER_NAME}] Error on ${targetUrl}: ${error.message}`);
  }
  return findings;
};

module.exports = { scan, SCANNER_NAME };
