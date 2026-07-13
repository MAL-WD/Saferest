/**
 * exportCodeScanPdf.js
 * Professional PDF export for Code Security Scans.
 */
import {
  createDoc, addPageHeader, addSection, addStatRow,
  addTable, addKV, addBadge, wrapText, addDivider,
  finalizeDoc, BRAND, PAGE
} from './exportReportUtils';

const SEV_COLOR = {
  CRITICAL: BRAND.critical,
  HIGH:     BRAND.high,
  MEDIUM:   BRAND.medium,
  LOW:      BRAND.low,
  INFO:     BRAND.info,
};

function sevColor(sev) {
  return SEV_COLOR[(sev || '').toUpperCase()] || BRAND.info;
}

export async function exportCodeScanPdf(scan) {
  const doc = createDoc();
  const m = PAGE.margin;

  const summary = scan?.summary || {};
  const findings = scan?.findings || [];
  
  // ── Header ─────────────────────────────────────────────────────────────────
  let y = await addPageHeader(doc, {
    reportTitle:    'Code Security Scan',
    reportSubtitle: `Generated ${new Date().toLocaleDateString()}`,
    meta: [
      { label: 'Language',  value: scan?.language || '—' },
      { label: 'Filename',  value: scan?.filename || '—' },
      { label: 'Status',    value: scan?.status || '—' },
      { label: 'Grade',     value: summary.grade || '—' },
    ],
  });

  // ── Summary stat boxes ─────────────────────────────────────────────────────
  y = addSection(doc, 'Scan Summary', y);
  y = addStatRow(doc, [
    { label: 'Total Findings',    value: findings.length,    color: BRAND.green },
    { label: 'Critical',          value: summary.critical || 0, color: BRAND.critical },
    { label: 'High',              value: summary.high || 0,     color: BRAND.high },
    { label: 'Medium',            value: summary.medium || 0,   color: BRAND.medium },
    { label: 'Low',               value: summary.low || 0,      color: BRAND.low },
  ], y);

  if (summary.overallAssessment) {
    y = addSection(doc, 'Overall Assessment', y);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...BRAND.textPrimary);
    y = wrapText(doc, summary.overallAssessment, m, y, PAGE.w - m * 2, 5.5);
    y += 6;
  }

  // ── Findings table ─────────────────────────────────────────────────────────
  if (findings.length > 0) {
    y = addSection(doc, `Vulnerabilities (${findings.length})`, y);
    y = addTable(doc, [
      { header: 'Severity', key: 'severity', width: 22, colorFn: (v) => sevColor(v) },
      { header: 'Category', key: 'category', flex: 2 },
      { header: 'Title',    key: 'title',    flex: 3 },
      { header: 'Line',     key: 'line',     width: 15 },
    ], findings.map(f => ({
      ...f,
      severity: (f.severity || 'info').toUpperCase(),
    })), y);
  }

  // ── Per-finding detail ─────────────────────────────────────────────────────
  if (findings.length > 0) {
    y = addSection(doc, 'Vulnerability Details', y, { color: BRAND.critical });

    for (const f of findings) {
      if (y > 230) {
        doc.addPage();
        doc.setFillColor(...BRAND.bgDark);
        doc.rect(0, 0, PAGE.w, PAGE.h, 'F');
        y = PAGE.margin + 6;
      }

      // Title & Badge
      doc.setFillColor(...BRAND.bgCard);
      doc.roundedRect(m, y, PAGE.w - m * 2, 9, 2, 2, 'F');
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...BRAND.textPrimary);
      doc.text(f.title || 'Vulnerability', m + 3, y + 5.5);
      addBadge(doc, (f.severity || 'info').toUpperCase(), PAGE.w - m - 26, y + 3);
      y += 12;

      // Location & Category
      let loc = `Line ${f.line || '?'}`;
      if (f.cwe) loc += `  |  CWE: ${f.cwe}`;
      if (f.owaspCategory) loc += `  |  OWASP: ${f.owaspCategory}`;
      
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...BRAND.textMuted);
      doc.text(loc, m + 2, y);
      y += 6;

      // Description
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...BRAND.textPrimary);
      if (f.description) {
        y = wrapText(doc, f.description, m + 2, y, PAGE.w - m * 2 - 4, 4.8);
        y += 2;
      }

      // Remediation
      if (f.remediation) {
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...BRAND.green);
        doc.text('Remediation:', m + 2, y);
        y += 4.5;
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...BRAND.textPrimary);
        y = wrapText(doc, f.remediation, m + 4, y, PAGE.w - m * 2 - 8, 4.5);
        y += 4;
      }

      y = addDivider(doc, y);
    }
  }

  // ── Finalize ───────────────────────────────────────────────────────────────
  finalizeDoc(doc);
  doc.save(`webguard-codescan-${scan?._id || 'export'}.pdf`);
}
