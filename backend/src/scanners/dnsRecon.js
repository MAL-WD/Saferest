// src/scanners/dnsRecon.js
// Scans for DNS configuration issues: missing SPF/DMARC, open zone transfers, etc.
// In this implementation, we use built-in node:dns to resolve TXT records.

const dns = require('dns').promises;
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

const SCANNER_NAME = 'DNS Recon';

const scan = async (targetUrl) => {
  const findings = [];
  try {
    const hostname = new URL(targetUrl).hostname;
    const txtRecords = await dns.resolveTxt(hostname).catch(() => []);
    
    // Flatten array of arrays returned by dns.resolveTxt
    const flattenedTxt = txtRecords.map((r) => r.join(''));
    
    // Check SPF
    const hasSpf = flattenedTxt.some((r) => r.startsWith('v=spf1'));
    if (!hasSpf) {
      findings.push({
        findingId: uuidv4(),
        scanner: SCANNER_NAME,
        severity: 'MEDIUM',
        title: 'Missing SPF Record',
        description: 'The domain is missing a Sender Policy Framework (SPF) DNS record. This allows attackers to forge emails appearing to come from your domain.',
        evidence: `No TXT records matching v=spf1 found for ${hostname}`,
        owaspCategory: 'A05:2021 – Security Misconfiguration',
        remediation: 'Add a TXT record for SPF (e.g., v=spf1 include:_spf.google.com ~all).',
        references: ['https://datatracker.ietf.org/doc/html/rfc7208'],
      });
    }

    // Check DMARC
    const dmarcRecords = await dns.resolveTxt(`_dmarc.${hostname}`).catch(() => []);
    const hasDmarc = dmarcRecords.map((r) => r.join('')).some((r) => r.startsWith('v=DMARC1'));
    
    if (!hasDmarc) {
      findings.push({
        findingId: uuidv4(),
        scanner: SCANNER_NAME,
        severity: 'LOW',
        title: 'Missing DMARC Record',
        description: 'Domain-based Message Authentication, Reporting, and Conformance (DMARC) is not configured. This limits your ability to track email delivery issues and block spoofing.',
        evidence: `No DMARC records found at _dmarc.${hostname}`,
        owaspCategory: 'A05:2021 – Security Misconfiguration',
        remediation: 'Publish a DMARC policy (e.g., v=DMARC1; p=none; rua=mailto:admin@domain.com).',
        references: ['https://mxtoolbox.com/dmarc/'],
      });
    }

  } catch (error) {
    logger.error(`[${SCANNER_NAME}] Error on ${targetUrl}: ${error.message}`);
  }
  
  return findings;
};

module.exports = { scan, SCANNER_NAME };
