/**
 * Pure unit tests — no HTTP, no MongoDB, no Redis.
 * Run: npm run test:v3-unit
 */

const assert = require('assert');
const { computeNextScanAt } = require('../services/scheduleUtils');
const { computeScoreFromScan } = require('../services/securityScoreService');
const { fingerprint, diffFindings } = require('../services/scanDiff');

let passed = 0;
let failed = 0;

function t(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  PASS  ${name}`);
  } catch (e) {
    failed++;
    console.log(`  FAIL  ${name} — ${e.message}`);
  }
}

console.log('\n=== Saferest v3 unit tests (offline) ===\n');

t('scheduleUtils daily advances ~1 day', () => {
  const from = new Date('2026-01-15T12:00:00Z');
  const next = computeNextScanAt('daily', null, from);
  assert(next.getUTCDate() === 16 || next - from > 20 * 3600 * 1000);
});

t('scheduleUtils custom uses minutes', () => {
  const from = new Date('2026-01-15T12:00:00Z');
  const next = computeNextScanAt('custom', 120, from);
  assert.strictEqual(next.getTime(), from.getTime() + 120 * 60 * 1000);
});

t('securityScoreService penalizes criticals', () => {
  const scan = {
    summary: { critical: 2, high: 0, medium: 0, low: 0, info: 0, total: 2 },
    findings: [],
  };
  const r = computeScoreFromScan(scan);
  assert(r.score < 100);
  assert(typeof r.letterGrade === 'string');
});

t('scanDiff.fingerprint differs for different titles', () => {
  const a = { scanner: 'X', title: 'A', severity: 'HIGH', evidence: 'e' };
  const b = { scanner: 'X', title: 'B', severity: 'HIGH', evidence: 'e' };
  assert.notStrictEqual(fingerprint(a), fingerprint(b));
});

t('scanDiff.diffFindings needs mongoose (skipped here)', () => {
  assert.strictEqual(typeof diffFindings, 'function');
});

console.log(`\n=== ${passed} passed, ${failed} failed ===\n`);
process.exit(failed ? 1 : 0);
