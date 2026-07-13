// Active-scan DNS reconnaissance — HackerTarget, SecurityTrails, Shodan, AbuseIPDB via externalAPIs.

const dns = require('dns').promises;
const { v4: uuidv4 } = require('uuid');
const external = require('../../services/externalAPIs');
const logger = require('../../utils/logger');

const SCANNER_NAME = 'DNS Recon (Active)';

const scan = async (targetUrl) => {
  const findings = [];
  try {
    const hostname = new URL(targetUrl).hostname;

    const dnsHt = await external.hackerTargetDnsLookup(hostname);
    if (dnsHt?.raw) {
      findings.push({
        findingId: uuidv4(),
        scanner: SCANNER_NAME,
        severity: 'INFO',
        title: 'HackerTarget DNS lookup',
        description: 'Passive DNS lookup results from HackerTarget API.',
        evidence: dnsHt.raw.slice(0, 8000),
        owaspCategory: 'Other',
        remediation: '',
        references: ['https://api.hackertarget.com'],
      });
    }

    const zt = await external.hackerTargetZoneTransfer(hostname);
    if (zt?.raw && !/failed|error|not allowed/i.test(zt.raw) && zt.raw.length > 50) {
      findings.push({
        findingId: uuidv4(),
        scanner: SCANNER_NAME,
        severity: 'HIGH',
        title: 'Possible DNS Zone Transfer Exposure',
        description: 'Zone transfer test returned substantial data — verify AXFR is locked down.',
        evidence: zt.raw.slice(0, 4000),
        owaspCategory: 'A05:2021 – Security Misconfiguration',
        remediation: 'Restrict zone transfers to secondary nameservers only.',
        references: [],
      });
    }

    const hist = await external.securityTrailsDnsHistory(hostname);
    if (hist) {
      findings.push({
        findingId: uuidv4(),
        scanner: SCANNER_NAME,
        severity: 'INFO',
        title: 'DNS history (SecurityTrails)',
        description: 'Historical DNS A records when API key configured.',
        evidence: JSON.stringify(hist).slice(0, 6000),
        owaspCategory: 'Other',
        remediation: '',
        references: [],
      });
    }

    let ip = null;
    try {
      const a = await dns.resolve4(hostname);
      ip = a[0];
    } catch {
      try {
        const a6 = await dns.resolve6(hostname);
        ip = a6[0];
      } catch {
        /* no A/AAAA */
      }
    }
    const idb = ip ? await external.shodanInternetDb(ip).catch(() => null) : null;
    if (idb && idb.ports?.length) {
      findings.push({
        findingId: uuidv4(),
        scanner: SCANNER_NAME,
        severity: 'LOW',
        title: 'Shodan InternetDB host exposure',
        description: 'Publicly indexed ports/services for resolved host.',
        evidence: JSON.stringify(idb),
        owaspCategory: 'A05:2021 – Security Misconfiguration',
        remediation: 'Review exposed services and firewall rules.',
        references: ['https://internetdb.shodan.io/'],
      });
    }
  } catch (e) {
    logger.error(`[${SCANNER_NAME}] ${e.message}`);
  }
  return findings;
};

module.exports = { scan, SCANNER_NAME };
