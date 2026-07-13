// src/controllers/reconController.js
// Handles individual recon tool execution (DNS, Website, Subdomain, Port, URL Fuzzer)

const logger = require('../utils/logger');
const { getIO } = require('../config/socket');
const { RECON_TOOLS_MENU } = require('../utils/reconToolsMenu');
const dnsRecon = require('../scanners/dnsRecon');
const httpHeaders = require('../scanners/httpHeaders');
const sslScanner = require('../scanners/sslScanner');
const cveLookup = require('../scanners/cveLookup');
const subdomainEnum = require('../scanners/recon/subdomain-enum');
const portScanner = require('../scanners/portScanner');

// Website Recon - runs a quick website fingerprint analysis
const getWebsiteRecon = async (req, res, next) => {
  try {
    const { targetUrl } = req.body;
    if (!targetUrl) {
      return res.status(400).json({ success: false, message: 'targetUrl required' });
    }

    logger.info(`Website Recon started on ${targetUrl} by ${req.user.email}`);

    // Website Recon runs HTTP Headers + SSL + CVE checks
    const httpHeadersFindings = await httpHeaders.scan(targetUrl);
    const sslFindings = await sslScanner.scan(targetUrl);
    const cveFindings = await cveLookup.scan(targetUrl);
    
    const findings = [
      ...httpHeadersFindings,
      ...sslFindings,
      ...cveFindings,
    ];

    res.status(200).json({
      success: true,
      tool: 'Website Recon',
      targetUrl,
      findingCount: findings.length,
      findings,
    });
  } catch (error) {
    logger.error(`Website Recon error: ${error.message}`);
    res.status(500).json({ success: false, error: error.message });
  }
};

// URL Fuzzer - endpoint discovery through fuzzing (to be implemented)
const getUrlFuzzer = async (req, res, next) => {
  try {
    const { targetUrl, wordlist } = req.body;
    if (!targetUrl) {
      return res.status(400).json({ success: false, message: 'targetUrl required' });
    }

    logger.info(`URL Fuzzer started on ${targetUrl} by ${req.user.email}`);

    // TODO: Implement URL Fuzzer scanner
    // This should attempt to discover hidden endpoints/directories
    // Can use wordlist for fuzzing or common paths

    res.status(200).json({
      success: true,
      tool: 'URL Fuzzer',
      targetUrl,
      status: 'Not yet implemented',
      message: 'URL Fuzzer functionality coming soon',
      findings: [],
    });
  } catch (error) {
    logger.error(`URL Fuzzer error: ${error.message}`);
    res.status(500).json({ success: false, error: error.message });
  }
};

// DNS Lookup
const getDnsLookup = async (req, res, next) => {
  try {
    const { targetUrl } = req.body;
    if (!targetUrl) {
      return res.status(400).json({ success: false, message: 'targetUrl required' });
    }

    logger.info(`DNS Lookup started on ${targetUrl} by ${req.user.email}`);

    const findings = await dnsRecon.scan(targetUrl);

    res.status(200).json({
      success: true,
      tool: 'DNS Lookup',
      targetUrl,
      findingCount: findings.length,
      findings,
    });
  } catch (error) {
    logger.error(`DNS Lookup error: ${error.message}`);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Subdomain Finder
const getSubdomainFinder = async (req, res, next) => {
  try {
    const { targetUrl } = req.body;
    if (!targetUrl) {
      return res.status(400).json({ success: false, message: 'targetUrl required' });
    }

    logger.info(`Subdomain Finder started on ${targetUrl} by ${req.user.email}`);

    const findings = await subdomainEnum.scan(targetUrl);

    res.status(200).json({
      success: true,
      tool: 'Subdomain Finder',
      targetUrl,
      findingCount: findings.length,
      findings,
    });
  } catch (error) {
    logger.error(`Subdomain Finder error: ${error.message}`);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Port Scanner
const getPortScanner = async (req, res, next) => {
  try {
    const { targetUrl } = req.body;
    if (!targetUrl) {
      return res.status(400).json({ success: false, message: 'targetUrl required' });
    }

    logger.info(`Port Scanner started on ${targetUrl} by ${req.user.email}`);

    const findings = await portScanner.scan(targetUrl);

    res.status(200).json({
      success: true,
      tool: 'Port Scanner',
      targetUrl,
      findingCount: findings.length,
      findings,
    });
  } catch (error) {
    logger.error(`Port Scanner error: ${error.message}`);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get Recon Tools Menu
const getReconMenu = (req, res) => {
  res.status(200).json({
    success: true,
    menu: RECON_TOOLS_MENU,
  });
};

module.exports = {
  getReconMenu,
  getDnsLookup,
  getWebsiteRecon,
  getUrlFuzzer,
  getSubdomainFinder,
  getPortScanner,
};
