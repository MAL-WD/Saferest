const SecurityScore = require('../models/SecurityScore');

function letterFromScore(score) {
  if (score >= 90) return 'A+';
  if (score >= 80) return 'A';
  if (score >= 70) return 'B';
  if (score >= 60) return 'C';
  if (score >= 50) return 'D';
  return 'F';
}

/**
 * @param {import('mongoose').Document} scan — completed scan with summary + findings
 */
function computeScoreFromScan(scan) {
  const sum = scan.summary || {};
  let score = 100;
  const deductions = {
    critical: (sum.critical || 0) * 12,
    high: (sum.high || 0) * 8,
    medium: (sum.medium || 0) * 5,
    low: (sum.low || 0) * 2,
    info: (sum.info || 0) * 0,
  };
  score -= deductions.critical + deductions.high + deductions.medium + deductions.low;

  const findings = scan.findings || [];
  const sslOk = findings.some(
    (f) =>
      (f.scanner && String(f.scanner).includes('SSL Labs') && f.title && f.title.includes('A')) ||
      (f.title && /grade:\s*A/i.test(f.title))
  );
  if (sslOk) score += 10;

  const headersOk = findings.some((f) => f.scanner === 'HTTP Headers' && f.severity === 'INFO');
  if (headersOk) score += 5;

  score = Math.max(0, Math.min(100, Math.round(score)));
  return {
    score,
    letterGrade: letterFromScore(score),
    breakdown: { deductions, bonuses: { sslLabs: sslOk, headers: headersOk } },
  };
}

async function recordScoreForScan(userId, domain, scan) {
  const { score, letterGrade, breakdown } = computeScoreFromScan(scan);
  return SecurityScore.create({
    user: userId,
    domain,
    score,
    letterGrade,
    breakdown,
    fromScanId: scan._id,
  });
}

module.exports = { computeScoreFromScan, recordScoreForScan, letterFromScore };
