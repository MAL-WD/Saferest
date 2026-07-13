function computeNextScanAt(frequency, customIntervalMinutes, from = new Date()) {
  const d = new Date(from.getTime());
  switch (frequency) {
    case 'minute':
      d.setMinutes(d.getMinutes() + 1);
      return d;
    case 'hourly':
      d.setHours(d.getHours() + 1);
      return d;
    case 'daily':
      d.setDate(d.getDate() + 1);
      return d;
    case 'weekly':
      d.setDate(d.getDate() + 7);
      return d;
    case 'monthly':
      d.setMonth(d.getMonth() + 1);
      return d;
    case 'custom': {
      const mins = Math.min(Math.max(Number(customIntervalMinutes) || 1440, 60), 43200);
      d.setMinutes(d.getMinutes() + mins);
      return d;
    }
    default:
      d.setDate(d.getDate() + 7);
      return d;
  }
}

module.exports = { computeNextScanAt };
