const { Resend } = require('resend');
const logger = require('../utils/logger');

async function sendScheduledScanAlert({ to, domain, newFindings, scanId }) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    logger.warn('[emailAlert] RESEND_API_KEY not set; skipping alert');
    return false;
  }
  const from = process.env.RESEND_FROM || 'Saferest <onboarding@resend.dev>';
  const base = (process.env.FRONTEND_URL || '').replace(/\/$/, '');
  const link = `${base}/scans/${scanId}`;

  const resend = new Resend(key);
  const crit = newFindings.filter((f) => f.severity === 'CRITICAL' || f.severity === 'HIGH');

  const html = `
  <h2>New vulnerabilities detected</h2>
  <p>Domain: <strong>${domain}</strong></p>
  <p>New findings: <strong>${newFindings.length}</strong></p>
  <ul>
    ${crit
      .slice(0, 15)
      .map((f) => `<li><b>${f.severity}</b> — ${f.title}</li>`)
      .join('')}
  </ul>
  <p><a href="${link}">View full results</a></p>
  `;

  try {
    await resend.emails.send({
      from,
      to: [to],
      subject: `Saferest: New vulnerabilities found on ${domain}`,
      html,
    });
    return true;
  } catch (e) {
    logger.error(`[emailAlert] Resend error: ${e.message}`);
    return false;
  }
}

module.exports = { sendScheduledScanAlert };
