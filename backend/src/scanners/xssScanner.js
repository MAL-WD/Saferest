// src/scanners/xssScanner.js
// Advanced Reflected/DOM XSS scanner. Uses Playwright to inject payloads into discovered URLs
// and listens for actual javascript execution (alert dialogs) to confirm vulnerability.

const { chromium } = require('playwright');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

const SCANNER_NAME = 'Advanced XSS Scanner';

const CANARY = 'wgXssCanary1337';
const PAYLOADS = [
  `"><script>alert('${CANARY}')</script>`,
  `'"><img src=x onerror=alert('${CANARY}')>`,
  `javascript:alert('${CANARY}')`
];

const COMMON_PARAMS = ['q', 'search', 'id', 'name', 'keyword', 'query'];

const scan = async (targetUrl, ctx) => {
  const findings = [];
  const urlsToTest = ctx?.crawledData?.urls || [targetUrl];
  
  let browser;
  try {
     browser = await chromium.launch({ headless: true });
  } catch (err) {
     logger.error(`[${SCANNER_NAME}] Failed to launch browser: ${err.message}`);
     return findings; // Fallback returning empty if playwright fails
  }

  const context = await browser.newContext({ ignoreHTTPSErrors: true });

  for (const urlStr of urlsToTest) {
    try {
      const urlObj = new URL(urlStr);
      
      if (urlObj.searchParams.toString() === '') {
        COMMON_PARAMS.forEach(p => urlObj.searchParams.append(p, 'test'));
      }

      const originalParams = Array.from(urlObj.searchParams.entries());

      for (const payload of PAYLOADS) {
        let xssFoundOnUrl = false;
        
        for (const [paramName, _] of originalParams) {
          const testUrlObj = new URL(urlStr);
          testUrlObj.searchParams.set(paramName, payload);
          const testUrl = testUrlObj.toString();

          let xssTriggered = false;
          
          try {
            const page = await context.newPage();
            
            // Listen for any alert, confirm, or prompt dialogs
            page.on('dialog', async dialog => {
              if (dialog.message().includes(CANARY)) {
                xssTriggered = true;
              }
              await dialog.dismiss();
            });

            await page.goto(testUrl, { waitUntil: 'domcontentloaded', timeout: 5000 });
            await page.close();

            if (xssTriggered) {
              findings.push({
                findingId: uuidv4(),
                scanner: SCANNER_NAME,
                severity: 'CRITICAL',
                title: 'Reflected/DOM Cross-Site Scripting (XSS)',
                description: `The application is vulnerable to XSS. Injecting a payload into the '${paramName}' parameter caused arbitrary JavaScript to execute in the browser.`,
                evidence: `Payload: ${payload}\nTriggered Javascript Alert on GET ${testUrl}`,
                owaspCategory: 'A03:2021 – Injection',
                remediation: 'Apply context-aware output encoding before rendering user data. Implement a strong Content Security Policy (CSP).',
                references: [
                  'https://owasp.org/www-community/attacks/xss/',
                ],
              });
              xssFoundOnUrl = true;
              break; 
            }
          } catch (err) {
             // Page timeout/navigation errors
          }
        }
        if (xssFoundOnUrl) break; // Move to next URL
      }
    } catch (error) {
      logger.warn(`[${SCANNER_NAME}] Error on ${urlStr}: ${error.message}`);
    }
  }

  await browser.close();
  return findings;
};

module.exports = { scan, SCANNER_NAME };
