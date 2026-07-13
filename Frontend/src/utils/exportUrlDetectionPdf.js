/**
 * exportUrlDetectionPdf.js
 * Professional PDF export for Malicious URL Detection.
 */
import {
  createDoc, addPageHeader, addSection, addStatRow,
  wrapText, finalizeDoc, BRAND, PAGE
} from './exportReportUtils';

export async function exportUrlDetectionPdf(result) {
  const doc = createDoc();
  const m = PAGE.margin;
  
  // ── Header ─────────────────────────────────────────────────────────────────
  let y = await addPageHeader(doc, {
    reportTitle:    'Malicious URL Detection',
    reportSubtitle: `Generated ${new Date().toLocaleDateString()}`,
    meta: [
      { label: 'Result', value: result.isMalicious ? 'MALICIOUS' : 'SAFE' },
      { label: 'Confidence', value: `${result.confidence}%` },
    ],
  });

  // ── Target URL ─────────────────────────────────────────────────────────────
  y = addSection(doc, 'Target URL', y);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...BRAND.textPrimary);
  y = wrapText(doc, result.url, m, y, PAGE.w - m * 2, 6);
  y += 6;

  // ── Summary stat boxes ─────────────────────────────────────────────────────
  y = addSection(doc, 'Detection Results', y);
  y = addStatRow(doc, [
    { label: 'Classification', value: result.detection, color: result.isMalicious ? BRAND.critical : BRAND.pass },
    { label: 'Confidence',     value: `${result.confidence}%`, color: BRAND.blue },
    { label: 'Status',         value: result.isMalicious ? 'DANGER' : 'CLEAN', color: result.isMalicious ? BRAND.critical : BRAND.pass },
  ], y);

  // ── Security Advisory ──────────────────────────────────────────────────────
  if (result.isMalicious) {
    y = addSection(doc, 'Security Advisory', y, { color: BRAND.critical });
    
    doc.setFillColor(254, 226, 226); // Light red bg
    doc.roundedRect(m, y, PAGE.w - m * 2, 45, 2, 2, 'F');
    
    // Left border
    doc.setFillColor(...BRAND.critical);
    doc.roundedRect(m, y, 3, 45, 1, 1, 'F');
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...BRAND.critical);
    doc.text('WARNING: Malicious URL Detected', m + 8, y + 8);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...BRAND.critical);
    let my = y + 16;
    my = wrapText(doc, 'This URL has been identified as potentially malicious by our advanced machine learning models. Interacting with this URL may compromise your system or data.', m + 8, my, PAGE.w - m * 2 - 16, 5);
    my += 2;
    doc.setFont('helvetica', 'bold');
    my = wrapText(doc, 'Recommended Actions:', m + 8, my, PAGE.w - m * 2 - 16, 5);
    doc.setFont('helvetica', 'normal');
    my = wrapText(doc, '• Do not click or visit this URL', m + 10, my, PAGE.w - m * 2 - 16, 5);
    my = wrapText(doc, '• Do not download any files or execute scripts from this domain', m + 10, my, PAGE.w - m * 2 - 16, 5);
    my = wrapText(doc, '• Block this URL at your network firewall or proxy', m + 10, my, PAGE.w - m * 2 - 16, 5);
    
    y += 50;
  } else {
    y = addSection(doc, 'Security Advisory', y, { color: BRAND.pass });
    
    doc.setFillColor(209, 250, 229); // Light green bg
    doc.roundedRect(m, y, PAGE.w - m * 2, 25, 2, 2, 'F');
    
    // Left border
    doc.setFillColor(...BRAND.pass);
    doc.roundedRect(m, y, 3, 25, 1, 1, 'F');
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...BRAND.pass);
    doc.text('URL Appears Safe', m + 8, y + 8);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...BRAND.textPrimary);
    wrapText(doc, 'Our models did not detect any known malicious signatures or behaviors associated with this URL. However, always exercise caution when interacting with unknown external links.', m + 8, y + 15, PAGE.w - m * 2 - 16, 5);
    
    y += 30;
  }

  // ── Finalize ───────────────────────────────────────────────────────────────
  finalizeDoc(doc);
  const safeFilename = String(result.url).replace(/[^a-z0-9]/gi, '_').substring(0, 30);
  doc.save(`webguard-urlscan-${safeFilename || 'export'}.pdf`);
}
