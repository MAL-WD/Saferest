// src/scanners/portScanner.js
// Basic port scanner using the core 'net' module to scan common top 100 ports.
// We avoid node-libnmap here to prevent requiring an external nmap binary installation on the host system.

const net = require('net');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');
const { hackerTargetNmap } = require('../services/externalAPIs');

const SCANNER_NAME = 'Port Scanner';

// A selection of highly targeted/dangerous ports
const COMMON_PORTS = [
  21, 22, 23, 25, 53, 80, 110, 111, 135, 139, 143, 443, 445, 993, 995, 1723, 3306,
  3389, 5432, 5900, 6379, 8000, 8080, 8443, 9200
];

const checkPort = (host, port, timeout = 1500) => {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let status = 'closed';

    socket.setTimeout(timeout);
    
    socket.on('connect', () => {
      status = 'open';
      socket.destroy();
    });

    socket.on('timeout', () => {
      status = 'filtered';
      socket.destroy();
    });

    socket.on('error', () => {
      status = 'closed';
      socket.destroy();
    });

    socket.on('close', () => {
      resolve({ port, status });
    });

    socket.connect(port, host);
  });
};

const parseNmapOutput = (rawText) => {
  const ports = [];
  if (!rawText) return ports;
  
  // Look for lines like "22/tcp  open  ssh"
  const lines = rawText.split('\n');
  lines.forEach(line => {
    const match = line.match(/^(\d+)\/(tcp|udp)\s+(\w+)\s+(.*)/);
    if (match) {
      ports.push({
        port: parseInt(match[1]),
        status: match[3],
        service: match[4].trim()
      });
    }
  });
  return ports;
};

const scan = async (targetUrl) => {
  const findings = [];
  try {
    const url = new URL(targetUrl);
    const host = url.hostname;

    // Run scans concurrently with a limit to avoid fd exhaustion
    const results = [];
    const batchSize = 10;
    
    for (let i = 0; i < COMMON_PORTS.length; i += batchSize) {
      const batch = COMMON_PORTS.slice(i, i + batchSize);
      const batchResults = await Promise.all(batch.map(port => checkPort(host, port)));
      results.push(...batchResults);
    }

    const openPorts = results.filter(r => r.status === 'open');

    // --- Nmap API Integration ---
    try {
      const nmapResult = await hackerTargetNmap(host);
      if (nmapResult && nmapResult.raw) {
        const nmapPorts = parseNmapOutput(nmapResult.raw);
        nmapPorts.forEach(np => {
          if (!openPorts.find(p => p.port === np.port)) {
            openPorts.push({ port: np.port, status: np.status, service: np.service });
          }
        });
      }
    } catch (apiErr) {
      logger.warn(`[${SCANNER_NAME}] Nmap API failed for ${host}: ${apiErr.message}`);
    }

    // Filter out expected web ports (80, 443, 8080)
    const unexpectedOpenPorts = openPorts.filter(r => ![80, 443, 8080, 8443].includes(r.port));

    if (unexpectedOpenPorts.length > 0) {
      const dbPorts = unexpectedOpenPorts.filter(r => [3306, 5432, 6379, 9200].includes(r.port));
      
      // Critical issue: Databases exposed to the internet
      if (dbPorts.length > 0) {
        findings.push({
          findingId: uuidv4(),
          scanner: SCANNER_NAME,
          severity: 'CRITICAL',
          title: 'Exposed Database Ports',
          description: 'Database services are directly accessible from the internet. This drastically increases the risk of data breaches.',
          evidence: `Open database ports detected: ${dbPorts.map(p => p.port).join(', ')}`,
          owaspCategory: 'A05:2021 – Security Misconfiguration',
          remediation: 'Configure a firewall/security group to block external access to database ports. Only allow access from trusted internal IP addresses.',
          references: ['https://cwe.mitre.org/data/definitions/16.html'],
        });
      }

      // Medium issue: Generic unexpected open ports
      const genericPorts = unexpectedOpenPorts.filter(r => !dbPorts.find(dp => dp.port === r.port));
      if (genericPorts.length > 0) {
        findings.push({
          findingId: uuidv4(),
          scanner: SCANNER_NAME,
          severity: 'MEDIUM',
          title: 'Unexpected Open Ports Detected',
          description: 'One or more network ports were found open that are not typically required for web traffic. This increases the attack surface and could expose sensitive administrative services (like SSH, FTP, or databases) to unauthorized access.',
          evidence: `Open ports detected:\n${genericPorts.map(p => `- Port ${p.port}: ${p.service || 'Unknown'} ${p.version || ''}`).join('\n')}`,
          owaspCategory: 'A05:2021 – Security Misconfiguration',
          remediation: 'Review your firewall rules and close all ports not strictly required for the application to function. For administrative services, consider using a VPN or IP whitelisting.',
          references: ['https://cwe.mitre.org/data/definitions/1100.html'],
        });
      }
    }

  } catch (error) {
    logger.error(`[${SCANNER_NAME}] Error on ${targetUrl}: ${error.message}`);
  }

  return findings;
};

module.exports = { scan, SCANNER_NAME };
