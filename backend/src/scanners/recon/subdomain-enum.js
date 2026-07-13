// Subdomain enumeration — optional subfinder CLI + passive host feeds + historical DNS (when keys exist).

const { v4: uuidv4 } = require('uuid');
const external = require('../../services/externalAPIs');
const { runSubfinder } = require('../../services/subfinderService');
const logger = require('../../utils/logger');

const SCANNER_NAME = 'Subdomain Enumeration';

const scan = async (targetUrl) => {
  const findings = [];
  try {
    const hostname = new URL(targetUrl).hostname;
    const domain = hostname.replace(/^www\./, '');

    const sf = await runSubfinder(domain);
    if (sf.subdomains?.length) {
      const lines = sf.subdomains.join('\n');
      findings.push({
        findingId: uuidv4(),
        scanner: SCANNER_NAME,
        source: 'subfinder',
        severity: sf.subdomains.length > 20 ? 'MEDIUM' : 'INFO',
        title: 'Subfinder',
        description: `${sf.subdomains.length} hostnames${sf.timedOut ? ' (stopped at time limit; list may be partial).' : '.'}`,
        evidence: lines.slice(0, 12000),
        owaspCategory: 'A05:2021 – Security Misconfiguration',
        remediation: 'Remove stale DNS records and reduce exposed attack surface.',
        references: ['https://github.com/projectdiscovery/subfinder'],
      });
    } else if (sf.error && sf.skipped !== 'not_found') {
      logger.warn(`[${SCANNER_NAME}] Subfinder: ${sf.error}`);
    }

    const ht = await external.hackerTargetHostSearch(domain);
    if (ht?.raw) {
      const lines = ht.raw.split('\n').filter(Boolean).length;
      findings.push({
        findingId: uuidv4(),
        scanner: SCANNER_NAME,
        source: 'passive_intelligence',
        severity: lines > 20 ? 'MEDIUM' : 'INFO',
        title: 'Public intelligence',
        description: `About ${lines} hostnames from open hostname intelligence feeds.`,
        evidence: ht.raw.slice(0, 12000),
        owaspCategory: 'A05:2021 – Security Misconfiguration',
        remediation: 'Remove stale DNS records and protect origin infrastructure.',
        references: [],
      });
    }

    const st = await external.securityTrailsSubdomains(domain);
    if (st?.subdomains?.length) {
      findings.push({
        findingId: uuidv4(),
        scanner: SCANNER_NAME,
        source: 'dns_history',
        severity: 'INFO',
        title: 'Historical DNS',
        description: `${st.subdomains.length} hostnames from historical DNS data (when a provider key is configured).`,
        evidence: JSON.stringify(st.subdomains.slice(0, 200)),
        owaspCategory: 'Other',
        remediation: '',
        references: [],
      });
    }
  } catch (e) {
    logger.error(`[${SCANNER_NAME}] ${e.message}`);
  }
  return findings;
};

module.exports = { scan, SCANNER_NAME };
