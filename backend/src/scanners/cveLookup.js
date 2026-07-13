// src/scanners/cveLookup.js
// Heuristic scanner that checks for known software versions
// and simulates a lookup for known CVEs (Common Vulnerabilities and Exposures).
// Real implementation would integrate with the NVD API, simplified here for reliability.

const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

const SCANNER_NAME = 'CVE Lookup';

const scan = async (targetUrl) => {
  const findings = [];
  try {
    const response = await axios.get(targetUrl, {
      timeout: 10000,
      validateStatus: () => true,
    });

    const serverHeader = response.headers['server'] || '';
    const poweredBy = response.headers['x-powered-by'] || '';
    
    // Simulate mapping common outdated software to CVEs
    
    // Check for significantly old Nginx version vulnerable to HTTP/2 Rapid Reset or similar (e.g. 1.18.0)
    if (serverHeader.includes('nginx/1.18.0')) {
      findings.push({
        findingId: uuidv4(),
        scanner: SCANNER_NAME,
        severity: 'HIGH',
        title: 'Vulnerable Software Component (Nginx < 1.19)',
        description: 'The server is running an outdated version of Nginx with known published vulnerabilities.',
        evidence: `Server Header: ${serverHeader}\nMatched signature: nginx/1.18.0`,
        owaspCategory: 'A06:2021 – Vulnerable and Outdated Components',
        remediation: 'Upgrade Nginx to the latest stable branch.',
        references: ['https://nvd.nist.gov/vuln/search/results?form_type=Advanced&results_type=overview&query=nginx+1.18'],
      });
    }

    // Check for old PHP versions
    if (poweredBy.includes('PHP/5') || poweredBy.includes('PHP/7.0') || poweredBy.includes('PHP/7.1')) {
      findings.push({
        findingId: uuidv4(),
        scanner: SCANNER_NAME,
        severity: 'HIGH',
        title: 'Vulnerable/End-of-Life PHP Version',
        description: 'The application runs on an End-of-Life (EOL) PHP version that no longer receives security updates.',
        evidence: `X-Powered-By: ${poweredBy}`,
        owaspCategory: 'A06:2021 – Vulnerable and Outdated Components',
        remediation: 'Upgrade to a currently supported version of PHP (e.g., PHP 8.2+).',
        references: ['https://www.php.net/supported-versions.php'],
      });
    }

  } catch (error) {
    logger.error(`[${SCANNER_NAME}] Error on ${targetUrl}: ${error.message}`);
  }

  return findings;
};

module.exports = { scan, SCANNER_NAME };
