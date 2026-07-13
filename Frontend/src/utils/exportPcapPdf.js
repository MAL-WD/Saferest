/**
 * exportPcapPdf.js
 * Professional PDF export for PCAP Scan.
 */
import {
  createDoc, addPageHeader, addSection, addStatRow,
  wrapText, finalizeDoc, BRAND, PAGE
} from './exportReportUtils';

export async function exportPcapPdf(filename, summary) {
  const doc = createDoc();
  const m = PAGE.margin;
  
  const statusLower = (summary?.status || '').toLowerCase();
  const isCritical = statusLower.includes('critical');
  const isHigh = statusLower.includes('high');
  const color = isCritical ? BRAND.critical : isHigh ? BRAND.high : BRAND.pass;
  const statusLabel = isCritical ? 'CRITICAL' : isHigh ? 'HIGH' : 'OK';

  // ── Header ─────────────────────────────────────────────────────────────────
  let y = await addPageHeader(doc, {
    reportTitle:    'PCAP Analysis Report',
    reportSubtitle: `Generated ${new Date().toLocaleDateString()}`,
    meta: [
      { label: 'File',       value: filename || 'Unknown' },
      { label: 'Status',     value: summary?.status || 'Unknown' },
      { label: 'Confidence', value: summary?.confidence || 'N/A' },
    ],
  });

  // ── Summary stat boxes ─────────────────────────────────────────────────────
  y = addSection(doc, 'Traffic Analysis Summary', y);
  y = addStatRow(doc, [
    { label: 'Risk Level',  value: statusLabel,               color: color },
    { label: 'Attack Type', value: summary?.attackType || 'None Detected', color: BRAND.blue },
    { label: 'Confidence',  value: summary?.confidence || '0%', color: BRAND.blue },
    { label: 'Packets',     value: summary?.packets || '0',    color: BRAND.green },
  ], y);

  // ── Detail & Recommendation ────────────────────────────────────────────────
  y = addSection(doc, 'Analysis Details', y);
  
  // Status Box
  doc.setFillColor(...BRAND.bgCard);
  doc.roundedRect(m, y, PAGE.w - m * 2, 25, 2, 2, 'F');
  
  // Left border
  doc.setFillColor(...color);
  doc.roundedRect(m, y, 3, 25, 1, 1, 'F');
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...color);
  doc.text('Detected Status', m + 8, y + 8);
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...BRAND.textPrimary);
  wrapText(doc, summary?.status || 'No issues detected in the capture file.', m + 8, y + 15, PAGE.w - m * 2 - 16, 5);
  
  y += 35;

  // Recommendation Box
  y = addSection(doc, 'AI Recommendations', y, { color: BRAND.green });
  
  doc.setFillColor(...BRAND.bgCard);
  doc.roundedRect(m, y, PAGE.w - m * 2, 35, 2, 2, 'F');
  
  // Left border
  doc.setFillColor(...BRAND.green);
  doc.roundedRect(m, y, 3, 35, 1, 1, 'F');
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...BRAND.green);
  doc.text('Recommended Actions', m + 8, y + 8);
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...BRAND.textPrimary);
  wrapText(doc, summary?.recommendation || 'No specific actions required. Traffic appears normal.', m + 8, y + 15, PAGE.w - m * 2 - 16, 5);

  // ── Finalize ───────────────────────────────────────────────────────────────
  finalizeDoc(doc);
  const safeFilename = String(filename).replace(/[^a-z0-9.-]/gi, '_').substring(0, 30) || 'export';
  doc.save(`webguard-pcap-${safeFilename}.pdf`);
}
