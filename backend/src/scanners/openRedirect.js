// src/scanners/openRedirect.js
// Tests the target URL by appending common redirect parameters.
// If the server returns a 3xx status pointing to our external domain, it's vulnerable.

const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

const SCANNER_NAME = 'Open Redirect';

const REDIRECT_PAYLOAD = 'http://example.com/malicious';
const PARAMETERS = ['next', 'url', 'target', 'rurl', 'dest', 'destination', 'redir', 'redirect_uri', 'return_to'];

const scan = async (targetUrl) => {
  const findings = [];
  try {
    const urlObj = new URL(targetUrl);
    const basePath = urlObj.origin + urlObj.pathname;

    for (const param of PARAMETERS) {
      // e.g. https://target.com/login?next=http://example.com/malicious
      const testUrl = `${basePath}?${param}=${encodeURIComponent(REDIRECT_PAYLOAD)}`;

      try {
        // maxRedirects: 0 prevents axios from following the redirect so we can inspect the Location header
        const response = await axios.get(testUrl, {
          maxRedirects: 0,
          validateStatus: (status) => status >= 200 && status < 400,
          timeout: 5000,
        });

        const isRedirect = response.status >= 300 && response.status < 400;
        const location = response.headers.location;

        if (isRedirect && location && location.includes('example.com/malicious')) {
          findings.push({
            findingId: uuidv4(),
            scanner: SCANNER_NAME,
            severity: 'HIGH',
            title: 'Unvalidated Redirect / Open Redirect',
            description: `The application accepts user-controlled input for a redirect relying on the '${param}' parameter. Attackers can use this to conduct phishing attacks by redirecting users to a malicious site after login.`,
            evidence: `Request: GET ${testUrl}\nResponse Status: ${response.status}\nLocation Header: ${location}`,
            owaspCategory: 'A03:2021 – Injection',
            remediation: 'Do not allow user-supplied input to directly dictate redirect destinations. If unavoidable, validate the URL against a strict whitelist of approved domains/paths.',
            references: [
              'https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/11-Client-side_Testing/04-Testing_for_Client-side_URL_Redirect',
              'https://cwe.mitre.org/data/definitions/601.html',
            ],
          });
          // Break early if we found one to avoid spamming the same finding for multiple parameters
          break;
        }
      } catch (err) {
        // Ignore timeouts or connection resets for individual payloads
      }
    }
  } catch (error) {
    logger.error(`[${SCANNER_NAME}] Error on ${targetUrl}: ${error.message}`);
  }

  return findings;
};

module.exports = { scan, SCANNER_NAME };
