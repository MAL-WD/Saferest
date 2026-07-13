// Extended CORS misconfiguration tests (reflects null origin, file:// patterns).

const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

const SCANNER_NAME = 'CORS Deep Test';

const ORIGINS = [
  'https://evil.example',
  'null',
  'https://attacker.test',
];

const scan = async (targetUrl) => {
  const findings = [];
  const matrix = [];

  for (const origin of ORIGINS) {
    try {
      const res = await axios({
        method: 'options',
        url: targetUrl,
        headers: { Origin: origin },
        validateStatus: () => true,
        timeout: 6000,
      });
      const acao = res.headers['access-control-allow-origin'];
      const acac = res.headers['access-control-allow-credentials'];
      matrix.push({ origin, acao, acac, status: res.status });

      if (acao === origin || acao === '*') {
        const sev = acac === 'true' && acao !== '*' ? 'CRITICAL' : 'HIGH';
        findings.push({
          findingId: uuidv4(),
          scanner: SCANNER_NAME,
          severity: sev,
          title: 'Permissive CORS policy',
          description: `Origin ${origin} is reflected or wildcarded with ACAO.`,
          evidence: `Origin: ${origin}\nAccess-Control-Allow-Origin: ${acao}\nCredentials: ${acac}`,
          owaspCategory: 'A05:2021 – Security Misconfiguration',
          remediation: 'Allowlist specific trusted origins; avoid reflecting arbitrary Origin.',
          references: ['https://portswigger.net/web-security/cors'],
        });
      }
    } catch (e) {
      logger.debug(`[${SCANNER_NAME}] ${origin}: ${e.message}`);
    }
  }

  if (findings.length === 0) {
    findings.push({
      findingId: uuidv4(),
      scanner: SCANNER_NAME,
      severity: 'INFO',
      title: 'CORS probe matrix',
      description: 'No obvious misconfiguration from tested origins.',
      evidence: JSON.stringify(matrix),
      owaspCategory: 'Other',
      remediation: '',
      references: [],
    });
  }

  return findings;
};

module.exports = { scan, SCANNER_NAME };
