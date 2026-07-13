const Scan = require('../models/Scan');
const crypto = require('crypto');

const fingerprint = (f) =>
  crypto
    .createHash('sha256')
    .update(`${f.scanner}|${f.title}|${f.severity}|${(f.evidence || '').slice(0, 200)}`)
    .digest('hex');

async function diffFindings(previousScanId, newScanId) {
  const prev = await Scan.findById(previousScanId).select('findings');
  const cur = await Scan.findById(newScanId).select('findings');
  if (!prev || !cur) return { newFindings: [], resolvedFindings: [] };

  const prevSet = new Set((prev.findings || []).map(fingerprint));
  const curSet = new Set((cur.findings || []).map(fingerprint));

  const newFindings = (cur.findings || []).filter((f) => !prevSet.has(fingerprint(f)));
  const resolvedFindings = (prev.findings || []).filter((f) => !curSet.has(fingerprint(f)));
  return { newFindings, resolvedFindings };
}

module.exports = { diffFindings, fingerprint };
