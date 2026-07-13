/**
 * exportScanPdf.js  (Security Scan / Port Scanner)
 * Professional PDF export with WebGuard AI branding.
 */
import {
  createDoc, addPageHeader, addSection, addStatRow,
  addTable, addKV, addBadge, addRiskBar, wrapText,
  addDivider, finalizeDoc, BRAND, PAGE,
} from './exportReportUtils';

// ─── Severity color map ───────────────────────────────────────────────────────
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

// ─── Main export ──────────────────────────────────────────────────────────────

export async function exportScanPdf({ scan, report, resolvedFindings = [] }) {
  const doc = createDoc();
  const m   = PAGE.margin;

  const isPort      = scan?.options?.scanner === 'port';
  const targetUrl   = scan?.target?.sanitizedUrl || scan?.target?.url || '—';
  const scanType    = isPort ? 'Port Scanner' : (scan?.type || '—');
  const completedAt = scan?.completedAt
    ? new Date(scan.completedAt).toLocaleString()
    : '—';
  const durationSec = scan?.startedAt && scan?.completedAt
    ? `${Math.round((new Date(scan.completedAt) - new Date(scan.startedAt)) / 1000)}s`
    : '—';

  // ── Header ─────────────────────────────────────────────────────────────────
  let y = await addPageHeader(doc, {
    reportTitle:    isPort ? 'Port Scanner Report' : 'Security Scan Report',
    reportSubtitle: `Generated ${new Date().toLocaleDateString()}`,
    meta: [
      { label: 'Target',    value: targetUrl   },
      { label: 'Scan type', value: scanType    },
      { label: 'Status',    value: scan?.status || '—' },
      { label: 'Duration',  value: durationSec },
    ],
  });

  // ── Risk score (if AI report present) ──────────────────────────────────────
  if (report?.overallRiskScore != null) {
    y = addSection(doc, 'AI Risk Score', y);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...BRAND.textMuted);
    doc.text('Overall risk score calculated by the AI remediation engine.', m, y);
    y += 6;
    y = addRiskBar(doc, report.overallRiskScore, y);
    y += 2;
  }

  // ── Summary stat boxes ─────────────────────────────────────────────────────
  const findings = scan?.findings || [];
  const counts   = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
  for (const f of findings) counts[(f.severity || 'info').toLowerCase()] = (counts[(f.severity || 'info').toLowerCase()] || 0) + 1;

  y = addSection(doc, 'Scan Summary', y);
  y = addStatRow(doc, [
    { label: 'Total Findings',    value: findings.length,    color: BRAND.green    },
    { label: 'Critical',          value: counts.critical,    color: BRAND.critical },
    { label: 'High',              value: counts.high,        color: BRAND.high     },
    { label: 'Medium',            value: counts.medium,      color: BRAND.medium   },
    { label: 'Low / Info',        value: counts.low + counts.info, color: BRAND.low },
    ...(resolvedFindings.length ? [{ label: 'Resolved', value: resolvedFindings.length, color: BRAND.pass }] : []),
  ], y);

  // ── Metadata table ─────────────────────────────────────────────────────────
  y = addSection(doc, 'Scan Metadata', y);
  y = addKV(doc, 'Scan ID',       scan?._id   || '—', m, y);
  y = addKV(doc, 'Target URL',    targetUrl,           m, y);
  y = addKV(doc, 'Scan Type',     scanType,            m, y);
  y = addKV(doc, 'Completed At',  completedAt,         m, y);
  y = addKV(doc, 'Source',        scan?.source || '—', m, y);
  y += 4;

  // ── AI Executive Summary ───────────────────────────────────────────────────
  if (report?.executiveSummary) {
    y = addSection(doc, 'Executive Summary (AI Generated)', y, { color: BRAND.blue });

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...BRAND.textPrimary);
    y = wrapText(doc, report.executiveSummary, m, y, PAGE.w - m * 2, 5.5);
    y += 6;
  }

  // ── Findings table ─────────────────────────────────────────────────────────
  if (findings.length > 0) {
    y = addSection(doc, `Detailed Findings (${findings.length})`, y);
    y = addTable(doc, [
      { header: 'Severity', key: 'severity', width: 22,
        colorFn: (v) => sevColor(v) },
      { header: 'Title',    key: 'title',    flex: 3 },
      { header: 'Scanner',  key: 'scanner',  flex: 2 },
      { header: 'Status',   key: 'diffStatus', width: 20,
        colorFn: (v) => v === 'new' ? BRAND.critical : BRAND.textMuted },
    ], findings.map(f => ({
      ...f,
      severity:   (f.severity  || 'info').toUpperCase(),
      diffStatus: f.diffStatus === 'new' ? 'NEW' : '',
    })), y);
  }

  // ── Per-finding detail (evidence) ──────────────────────────────────────────
  const importantFindings = findings.filter(
    f => ['critical', 'high'].includes((f.severity || '').toLowerCase())
  ).slice(0, 20);

  if (importantFindings.length > 0) {
    y = addSection(doc, 'Critical & High Findings — Detail', y, { color: BRAND.critical });

    for (const f of importantFindings) {
      if (y > 255) {
        doc.addPage();
        doc.setFillColor(...BRAND.bgDark);
        doc.rect(0, 0, PAGE.w, PAGE.h, 'F');
        y = PAGE.margin + 6;
      }

      // Finding header pill
      doc.setFillColor(...BRAND.bgCard);
      doc.roundedRect(m, y, PAGE.w - m * 2, 9, 2, 2, 'F');
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...BRAND.textPrimary);
      doc.text(f.title || 'Finding', m + 3, y + 5.5);
      addBadge(doc, (f.severity || 'info').toUpperCase(), PAGE.w - m - 26, y + 3);
      y += 11;

      if (f.evidence) {
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...BRAND.textMuted);
        y = wrapText(doc, `Evidence: ${String(f.evidence).slice(0, 600)}`, m + 2, y, PAGE.w - m * 2 - 4, 4.8);
        y += 2;
      }

      // AI remediation steps if available
      const aiRem = report?.findings?.find(r => r.findingId === f.findingId);
      if (aiRem?.remediationSteps?.length) {
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...BRAND.green);
        doc.text('Remediation Steps:', m + 2, y);
        y += 4.5;
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...BRAND.textPrimary);
        for (const step of aiRem.remediationSteps.slice(0, 5)) {
          y = wrapText(doc, `• ${step}`, m + 4, y, PAGE.w - m * 2 - 8, 4.5);
        }
        y += 2;
      }

      y = addDivider(doc, y);
    }
  }

  // ── Resolved findings ──────────────────────────────────────────────────────
  if (resolvedFindings.length > 0) {
    y = addSection(doc, `Resolved Since Last Scan (${resolvedFindings.length})`, y, { color: BRAND.pass });
    y = addTable(doc, [
      { header: 'Severity', key: 'severity', width: 22, colorFn: (v) => sevColor(v) },
      { header: 'Title',    key: 'title',    flex: 3 },
      { header: 'Scanner',  key: 'scanner',  flex: 2 },
    ], resolvedFindings.map(f => ({
      ...f,
      severity: (f.severity || 'info').toUpperCase(),
    })), y);
  }

  // ── Finalize ───────────────────────────────────────────────────────────────
  finalizeDoc(doc);
  doc.save(`webguard-scan-${scan?._id || 'export'}.pdf`);
}
