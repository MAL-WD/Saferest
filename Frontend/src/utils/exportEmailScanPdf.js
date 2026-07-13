/**
 * exportEmailScanPdf.js
 * Professional PDF export for Email Security Scans.
 */
import {
  createDoc, addPageHeader, addSection, addStatRow,
  wrapText, addDivider, addBadge, finalizeDoc, BRAND, PAGE
} from './exportReportUtils';

const STATUS_COLOR = {
  PASS: BRAND.pass,
  WARN: BRAND.warn,
  FAIL: BRAND.fail,
};

function statusColor(status) {
  return STATUS_COLOR[(status || '').toUpperCase()] || BRAND.info;
}

export async function exportEmailScanPdf(domain, result) {
  const doc = createDoc();
  const m = PAGE.margin;

  const res = result?.results || {};
  const ai = result?.aiReport || {};
  
  // ── Header ─────────────────────────────────────────────────────────────────
  let y = await addPageHeader(doc, {
    reportTitle:    'Email Security Scan',
    reportSubtitle: `Generated ${new Date().toLocaleDateString()}`,
    meta: [
      { label: 'Domain',    value: domain },
      { label: 'Grade',     value: result?.grade || '—' },
      { label: 'Spoofable', value: res.spoofable ? 'Yes (High Risk)' : 'No' },
    ],
  });

  // ── Summary stat boxes ─────────────────────────────────────────────────────
  y = addSection(doc, 'Configuration Status', y);
  y = addStatRow(doc, [
    { label: 'SPF',   value: res.spf?.status || 'N/A',   color: statusColor(res.spf?.status) },
    { label: 'DMARC', value: res.dmarc?.status || 'N/A', color: statusColor(res.dmarc?.status) },
    { label: 'DKIM',  value: res.dkim?.status || 'N/A',  color: statusColor(res.dkim?.status) },
    { label: 'MX',    value: res.mx?.status || 'N/A',    color: statusColor(res.mx?.status) },
  ], y);

  // ── Detailed Analysis ──────────────────────────────────────────────────────
  y = addSection(doc, 'Detailed Analysis', y);
  
  const records = [
    { title: 'SPF Record',   data: res.spf },
    { title: 'DMARC Record', data: res.dmarc },
    { title: 'DKIM Record',  data: res.dkim },
    { title: 'MX Records',   data: res.mx },
  ];

  for (const rec of records) {
    if (!rec.data) continue;
    
    // Header
    doc.setFillColor(...BRAND.bgCard);
    doc.roundedRect(m, y, PAGE.w - m * 2, 9, 2, 2, 'F');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...BRAND.textPrimary);
    doc.text(rec.title, m + 3, y + 5.5);
    addBadge(doc, (rec.data.status || 'INFO').toUpperCase(), PAGE.w - m - 26, y + 3);
    y += 12;

    // Detail
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...BRAND.textPrimary);
    y = wrapText(doc, rec.data.detail || 'No details available.', m + 2, y, PAGE.w - m * 2 - 4, 4.8);
    y += 4;
    
    y = addDivider(doc, y);
  }

  // ── AI Summary & Recommendations ───────────────────────────────────────────
  if (ai.summary || (ai.recommendations && ai.recommendations.length > 0)) {
    if (y > 230) {
      doc.addPage();
      doc.setFillColor(...BRAND.bgDark);
      doc.rect(0, 0, PAGE.w, PAGE.h, 'F');
      y = PAGE.margin + 6;
    }

    y = addSection(doc, 'AI Recommendations', y, { color: BRAND.blue });

    if (ai.summary) {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...BRAND.textPrimary);
      y = wrapText(doc, ai.summary, m, y, PAGE.w - m * 2, 5.5);
      y += 6;
    }

    if (ai.recommendations?.length) {
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...BRAND.textMuted);
      doc.text('Action Items:', m, y);
      y += 6;

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...BRAND.textPrimary);
      for (const rec of ai.recommendations) {
        y = wrapText(doc, `• ${rec}`, m + 4, y, PAGE.w - m * 2 - 8, 5);
      }
    }
  }

  // ── Finalize ───────────────────────────────────────────────────────────────
  finalizeDoc(doc);
  doc.save(`webguard-emailscan-${domain}.pdf`);
}
