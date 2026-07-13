const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function aggregateScansByMonth(scans, monthsBack = 7) {
  const now = new Date();
  const buckets = [];

  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({
      key: `${d.getFullYear()}-${d.getMonth()}`,
      label: MONTHS[d.getMonth()],
      count: 0,
    });
  }

  const bucketMap = Object.fromEntries(buckets.map((b) => [b.key, b]));

  scans.forEach((scan) => {
    const d = new Date(scan.createdAt);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    if (bucketMap[key]) bucketMap[key].count += 1;
  });

  return buckets;
}

export function countByStatus(scans) {
  return scans.reduce(
    (acc, s) => {
      acc[s.status] = (acc[s.status] || 0) + 1;
      return acc;
    },
    { queued: 0, running: 0, completed: 0, failed: 0 }
  );
}

export function scannedTargetCount(scans, targetCount) {
  const scanned = new Set(
    scans
      .filter((s) => s.status === 'completed' && s.target?._id)
      .map((s) => String(s.target._id))
  );
  return { scanned: scanned.size, total: targetCount };
}

export function percentChange(current, previous) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

export function scansInLastDays(scans, days) {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return scans.filter((s) => new Date(s.createdAt).getTime() >= cutoff);
}
