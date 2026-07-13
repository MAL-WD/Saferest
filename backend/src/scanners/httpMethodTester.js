// Tests dangerous HTTP methods on the target (active).

const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

const SCANNER_NAME = 'HTTP Method Tester';

const METHODS = ['TRACE', 'TRACK', 'PUT', 'DELETE', 'PATCH'];

const scan = async (targetUrl) => {
  const findings = [];
  const results = [];

  for (const method of METHODS) {
    try {
      const res = await axios({
        method,
        url: targetUrl,
        validateStatus: () => true,
        timeout: 8000,
        maxRedirects: 0,
      });
      results.push({ method, status: res.status });
      if (method === 'TRACE' && res.status < 400) {
        findings.push({
          findingId: uuidv4(),
          scanner: SCANNER_NAME,
          severity: 'HIGH',
          title: 'HTTP TRACE enabled',
          description: 'TRACE can leak headers (including cookies) via cross-site techniques in some stacks.',
          evidence: `TRACE returned HTTP ${res.status}`,
          owaspCategory: 'A05:2021 – Security Misconfiguration',
          remediation: 'Disable TRACE/TRACK at the web server or edge.',
          references: ['https://owasp.org/www-community/attacks/Cross_Site_Tracing'],
        });
      }
      if ((method === 'PUT' || method === 'DELETE' || method === 'PATCH') && res.status < 400 && res.status !== 405) {
        findings.push({
          findingId: uuidv4(),
          scanner: SCANNER_NAME,
          severity: 'MEDIUM',
          title: `HTTP ${method} may be allowed`,
          description: `${method} returned ${res.status} — verify authorization and CSRF protections.`,
          evidence: `${method} HTTP ${res.status}`,
          owaspCategory: 'A01:2021 – Broken Access Control',
          remediation: 'Return 405/403 for unsafe methods on public endpoints.',
          references: [],
        });
      }
    } catch (e) {
      results.push({ method, error: e.message });
      logger.debug(`[${SCANNER_NAME}] ${method} ${e.message}`);
    }
  }

  if (findings.length === 0 && results.length) {
    findings.push({
      findingId: uuidv4(),
      scanner: SCANNER_NAME,
      severity: 'INFO',
      title: 'HTTP method probe summary',
      description: 'No high-risk methods appeared enabled from this unauthenticated probe.',
      evidence: JSON.stringify(results),
      owaspCategory: 'Other',
      remediation: '',
      references: [],
    });
  }

  return findings;
};

module.exports = { scan, SCANNER_NAME };
