// src/scanners/sqliScanner.js
// Advanced SQL Injection scanner. Uses crawling data to test all discovered URLs and forms.
// Implements Error-based and Time-based blind SQL Injection checks.

const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

const SCANNER_NAME = 'Advanced SQL Injection Scanner';

const ERROR_PAYLOADS = ["'", "' OR 1=1--", '"', '`', "admin'--", "') OR ('1'='1"];
// Sleep payloads for 5 seconds
const TIME_PAYLOADS = [
  "'; WAITFOR DELAY '0:0:5'--", // MSSQL
  "' AND (SELECT 1337 FROM (SELECT(SLEEP(5)))a)--", // MySQL
  "'; pg_sleep(5)--" // PostgreSQL
];

const SQL_ERRORS = [
  'syntax error at or near',     // PostgreSQL
  'mysql_fetch_array()',         // MySQL PHP
  'check the manual that corresponds to your MySQL', // MySQL
  'Unclosed quotation mark after the character string', // MS SQL Server
  'ORA-01756: quoted string not properly terminated', // Oracle
  'Microsoft OLE DB Provider for SQL Server',
  'SqlException',
];

const SCAN_PARAMS = ['id', 'user', 'category', 'search', 'page', 'q'];

const scan = async (targetUrl, ctx) => {
  const findings = [];
  const urlsToTest = ctx?.crawledData?.urls || [targetUrl];
  
  for (const urlStr of urlsToTest) {
    try {
      const urlObj = new URL(urlStr);
      
      if (urlObj.searchParams.toString() === '') {
        SCAN_PARAMS.forEach(p => urlObj.searchParams.append(p, 'test'));
      }

      const originalParams = Array.from(urlObj.searchParams.entries());

      for (const [paramName, _] of originalParams) {
        
        // 1. Error-based checks
        for (const payload of ERROR_PAYLOADS) {
          const testUrlObj = new URL(urlStr);
          testUrlObj.searchParams.set(paramName, payload);
          const testUrl = testUrlObj.toString();

          try {
            const response = await axios.get(testUrl, { timeout: 5000, validateStatus: () => true });
            const body = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);

            for (const errorStr of SQL_ERRORS) {
              if (body.includes(errorStr)) {
                findings.push({
                  findingId: uuidv4(),
                  scanner: SCANNER_NAME,
                  severity: 'CRITICAL',
                  title: 'Error-Based SQL Injection',
                  description: `The application leaks database errors when injecting SQL syntax into the '${paramName}' parameter.`,
                  evidence: `Payload: ${payload}\nError matched: ${errorStr}\nURL: GET ${testUrl}`,
                  owaspCategory: 'A03:2021 – Injection',
                  remediation: 'Use Prepared Statements or ORM.',
                  references: ['https://owasp.org/www-community/attacks/SQL_Injection'],
                });
                break;
              }
            }
          } catch (err) {}
        }
        
        // 2. Time-based Blind checks
        for (const payload of TIME_PAYLOADS) {
          const testUrlObj = new URL(urlStr);
          testUrlObj.searchParams.set(paramName, payload);
          const testUrl = testUrlObj.toString();
          
          try {
             const startTime = Date.now();
             await axios.get(testUrl, { timeout: 8000, validateStatus: () => true });
             const duration = Date.now() - startTime;
             
             // If response took 5+ seconds, likely time-based blind SQLi
             if (duration >= 4500 && duration < 8000) {
                 findings.push({
                  findingId: uuidv4(),
                  scanner: SCANNER_NAME,
                  severity: 'CRITICAL',
                  title: 'Time-Based Blind SQL Injection',
                  description: `The application took ${duration}ms to respond, indicating a successful sleep() execution via the '${paramName}' parameter.`,
                  evidence: `Payload: ${payload}\nURL: GET ${testUrl}`,
                  owaspCategory: 'A03:2021 – Injection',
                  remediation: 'Use Prepared Statements or ORM.',
                  references: ['https://owasp.org/www-community/attacks/SQL_Injection'],
                });
                break;
             }
          } catch(err) {
             // Timeout might also indicate successful sleep if timeout < sleep duration
          }
        }
      }
    } catch (error) {
      logger.warn(`[${SCANNER_NAME}] Error processing ${urlStr}: ${error.message}`);
    }
  }

  return findings;
};

module.exports = { scan, SCANNER_NAME };
