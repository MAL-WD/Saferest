// Runs ProjectDiscovery subfinder (CLI) for passive subdomain discovery.
// Requires subfinder on PATH, or set SUBFINDER_PATH to the executable.
// Set SUBFINDER_DISABLED=1 to skip. SUBFINDER_TIMEOUT_MS caps runtime (default 180000).

const { spawn } = require('child_process');
const readline = require('readline');
const logger = require('../utils/logger');

const DEFAULT_TIMEOUT_MS = 180000;

/**
 * @param {string} domain - Apex or scan domain (e.g. example.com)
 * @returns {Promise<{ subdomains: string[]; skipped?: string; error?: string; timedOut?: boolean }>}
 */
function runSubfinder(domain) {
  if (process.env.SUBFINDER_DISABLED === '1' || process.env.SUBFINDER_DISABLED === 'true') {
    return Promise.resolve({ subdomains: [], skipped: 'disabled' });
  }

  const bin = (process.env.SUBFINDER_PATH || 'subfinder').trim();
  const timeoutMs = Math.max(
    5000,
    parseInt(process.env.SUBFINDER_TIMEOUT_MS || String(DEFAULT_TIMEOUT_MS), 10) || DEFAULT_TIMEOUT_MS
  );

  const args = ['-d', domain, '-silent', '-nc'];

  return new Promise((resolve) => {
    const subdomains = [];
    let stderrBuf = '';
    let settled = false;

    const child = spawn(bin, args, {
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    const finish = (payload) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(payload);
    };

    const timer = setTimeout(() => {
      try {
        child.kill('SIGTERM');
      } catch (e) {
        try {
          child.kill();
        } catch (e2) {}
      }
      finish({
        subdomains: [...new Set(subdomains)],
        timedOut: true,
      });
    }, timeoutMs);

    readline
      .createInterface({ input: child.stdout, crlfDelay: Infinity })
      .on('line', (line) => {
        const s = line.trim();
        if (s) subdomains.push(s);
      });

    child.stderr.on('data', (chunk) => {
      stderrBuf += chunk.toString();
    });

    child.on('error', (err) => {
      if (err.code === 'ENOENT') {
        // Expected when subfinder is not installed — avoid noisy logs; UI explains optional CLI.
        finish({ subdomains: [], skipped: 'not_found' });
        return;
      }
      logger.error(`[subfinder] ${err.message}`);
      finish({ subdomains: [], error: err.message });
    });

    child.on('close', (code, signal) => {
      if (settled) return;
      clearTimeout(timer);
      const unique = [...new Set(subdomains)];
      if (code !== 0 && signal !== 'SIGTERM' && unique.length === 0) {
        const tail = stderrBuf.trim().slice(-2000);
        logger.warn(`[subfinder] exited ${code}${tail ? `: ${tail}` : ''}`);
        finish({ subdomains: [], error: `exit ${code}` });
        return;
      }
      finish({ subdomains: unique });
    });
  });
}

module.exports = { runSubfinder };
