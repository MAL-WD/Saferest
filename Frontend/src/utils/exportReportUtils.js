/**
 * exportReportUtils.js
 * Shared PDF utilities for all WebGuard AI report exports.
 * Provides consistent branding, logo embedding, headers/footers,
 * section rendering, tables, and severity coloring.
 */
import { jsPDF } from 'jspdf';

// ─── Brand constants (Light Theme) ────────────────────────────────────────────
export const BRAND = {
  // Main page background (white)
  bgDark:   [255, 255, 255],
  bgMid:    [245, 247, 250],
  bgCard:   [240, 244, 248],
  // Accent green
  green:    [143, 201, 0], // Slightly darker green for light bg
  greenDim: [100, 160, 0],
  // Blue
  blue:     [1,   63,  246],
  // Text
  textPrimary: [15, 23, 42],
  textMuted:   [71, 85, 105],
  // Severity
  critical: [220, 38,  38],
  high:     [217, 119, 6],
  medium:   [202, 138, 4],
  low:      [8,  145, 178],
  info:     [37,  99,  235],
  // Checks
  pass:     [5,  150, 105],
  warn:     [217, 119, 6],
  fail:     [220, 38,  38],
};

export const PAGE = { w: 210, h: 297, margin: 16 };

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Convert [r,g,b] to hex string for setTextColor etc */
function rgb(arr) { return arr; }

/** Set fill + text color convenience */
function setFill(doc, arr)  { doc.setFillColor(...arr); }
function setText(doc, arr)  { doc.setTextColor(...arr); }

/**
 * Word-wrap text and return updated Y position.
 * Adds a new page automatically when near the bottom.
 */
export function wrapText(doc, text, x, y, maxW, lineH, { pageFooterY = 278 } = {}) {
  if (!text && text !== 0) return y;
  const lines = doc.splitTextToSize(String(text), maxW);
  for (const line of lines) {
    if (y > pageFooterY) {
      doc.addPage();
      // Repeat background on new page
      setFill(doc, BRAND.bgDark);
      doc.rect(0, 0, PAGE.w, PAGE.h, 'F');
      y = PAGE.margin + 4;
    }
    doc.text(line, x, y);
    y += lineH;
  }
  return y;
}

// ─── Logo loader ──────────────────────────────────────────────────────────────

let _logoDataUrl = null;

async function getLogoDataUrl() {
  if (_logoDataUrl) return _logoDataUrl;
  try {
    const resp = await fetch('/logo.png');
    const blob = await resp.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        _logoDataUrl = reader.result;
        resolve(_logoDataUrl);
      };
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

// ─── Core document factory ────────────────────────────────────────────────────

/**
 * Creates a jsPDF A4 document with a full light background on page 1.
 */
export function createDoc() {
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
  setFill(doc, BRAND.bgDark);
  doc.rect(0, 0, PAGE.w, PAGE.h, 'F');
  return doc;
}

// ─── Page decoration ──────────────────────────────────────────────────────────

/**
 * Add the top accent bar + background header block.
 * Returns the Y position just below the header.
 */
function addHeaderBlock(doc) {
  const m = PAGE.margin;

  // Full light bg already set on page creation / new pages

  // Top accent bar
  setFill(doc, BRAND.green);
  doc.rect(0, 0, PAGE.w, 2.5, 'F');

  // Header block background
  setFill(doc, BRAND.bgCard);
  doc.rect(0, 2.5, PAGE.w, 44, 'F'); // Increased height

  return 52; // Y below header
}

/**
 * Stamp the page footer: thin line + confidentiality text + page number.
 */
export function addFooter(doc, pageNum, totalPages) {
  const m   = PAGE.margin;
  const y   = 287;

  // Line
  doc.setDrawColor(...BRAND.bgCard);
  doc.setLineWidth(0.4);
  doc.line(m, y - 4, PAGE.w - m, y - 4);

  doc.setFontSize(7.5);
  setText(doc, BRAND.textMuted);
  doc.text('CONFIDENTIAL — Saferest Security Report', m, y);
  doc.text(`Page ${pageNum} of ${totalPages}`, PAGE.w - m, y, { align: 'right' });
}

// ─── Main branded page header ─────────────────────────────────────────────────

/**
 * Add logo + header block + report title/subtitle.
 * Returns the Y cursor after the header.
 */
export async function addPageHeader(doc, {
  reportTitle,
  reportSubtitle,
  meta = [],          // array of { label, value }
} = {}) {
  const logoDataUrl = await getLogoDataUrl();
  const m = PAGE.margin;
  let y = addHeaderBlock(doc);

  // Logo (right side)
  const logoW = 21;
  const logoH = 21;
  if (logoDataUrl) {
    try {
      doc.addImage(logoDataUrl, 'PNG', PAGE.w - m - logoW, 8, logoW, logoH, '', 'FAST');
    } catch { /* ignore broken logo */ }
  }

  // "Saferest" wordmark (left of the logo, right-aligned)
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  setText(doc, BRAND.green);
  doc.text('Saferest', PAGE.w - m - logoW - 6, 15, { align: 'right' });
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  setText(doc, BRAND.textMuted);
  doc.text('Security Intelligence Platform', PAGE.w - m - logoW - 6, 20, { align: 'right' });

  // Report type label (top left)
  if (reportTitle) {
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    setText(doc, BRAND.textPrimary);
    doc.text(reportTitle, m, 15, { align: 'left' });
  }
  if (reportSubtitle) {
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    setText(doc, BRAND.textMuted);
    doc.text(reportSubtitle, m, 21, { align: 'left' });
  }

  // Meta key-value pairs (left side under title)
  if (meta.length) {
    let my = 28;
    for (const { label, value } of meta) {
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      setText(doc, BRAND.textMuted);
      doc.text(`${label}:`, m, my, { align: 'left' });
      
      doc.setFont('helvetica', 'normal');
      setText(doc, BRAND.textPrimary);
      const val = String(value || '—').slice(0, 60);
      doc.text(val, m + 22, my, { align: 'left' });
      my += 5.5;
    }
  }

  return y;
}

// ─── Section heading ──────────────────────────────────────────────────────────

/**
 * Render a section divider with an accent left bar.
 * Returns new Y cursor.
 */
export function addSection(doc, title, y, { color = BRAND.green } = {}) {
  const m = PAGE.margin;

  // Accent bar
  setFill(doc, color);
  doc.rect(m, y, 3, 6, 'F');

  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'bold');
  setText(doc, BRAND.textPrimary);
  doc.text(title, m + 5.5, y + 4.5);

  // Thin rule
  doc.setDrawColor(...BRAND.bgCard);
  doc.setLineWidth(0.3);
  doc.line(m + 5.5 + doc.getTextWidth(title) + 3, y + 2, PAGE.w - m, y + 2);

  return y + 11;
}

// ─── Key-value info row ───────────────────────────────────────────────────────

/**
 * Render a simple two-column label: value row.
 */
export function addKV(doc, label, value, x, y, labelW = 32) {
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  setText(doc, BRAND.textMuted);
  doc.text(String(label), x, y);

  doc.setFont('helvetica', 'normal');
  setText(doc, BRAND.textPrimary);
  const maxW = PAGE.w - PAGE.margin - x - labelW;
  const lines = doc.splitTextToSize(String(value || '—'), maxW);
  doc.text(lines[0] || '—', x + labelW, y);

  return y + 5.5;
}

// ─── Severity badge ───────────────────────────────────────────────────────────

const SEVERITY_COLOR = {
  critical: BRAND.critical,
  high:     BRAND.high,
  medium:   BRAND.medium,
  low:      BRAND.low,
  info:     BRAND.info,
  pass:     BRAND.pass,
  warn:     BRAND.warn,
  fail:     BRAND.fail,
  malicious:[220, 38,  38],
  safe:     [5,  150, 105],
};

/**
 * Draw a colored pill badge at (x, y). Returns the width used.
 */
export function addBadge(doc, text, x, y, { fontSize = 7.5 } = {}) {
  const key = String(text).toLowerCase();
  const color = SEVERITY_COLOR[key] || BRAND.info;

  doc.setFontSize(fontSize);
  doc.setFont('helvetica', 'bold');
  const w = doc.getTextWidth(text) + 5;
  const h = 4.5;

  // Semi-transparent fill
  doc.setFillColor(color[0], color[1], color[2]);
  if (doc.GState) {
    doc.setGState(new doc.GState({ opacity: 0.18 }));
  }
  doc.roundedRect(x, y - h + 1, w, h, 1.2, 1.2, 'F');
  if (doc.GState) {
    doc.setGState(new doc.GState({ opacity: 1 }));
  }

  setText(doc, color);
  doc.text(text.toUpperCase(), x + 2.5, y);

  return w + 3;
}

// ─── Summary stat boxes ───────────────────────────────────────────────────────

/**
 * Render a row of colored summary stat boxes.
 * items: [{ label, value, color }]
 */
export function addStatRow(doc, items, y) {
  const m  = PAGE.margin;
  const total = items.length;
  const gap   = 4;
  const boxW  = (PAGE.w - m * 2 - gap * (total - 1)) / total;

  items.forEach(({ label, value, color }, i) => {
    const x = m + i * (boxW + gap);

    setFill(doc, BRAND.bgCard);
    doc.roundedRect(x, y, boxW, 18, 2, 2, 'F');

    // Left accent
    setFill(doc, color || BRAND.green);
    doc.roundedRect(x, y, 2.5, 18, 1, 1, 'F');

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    setText(doc, color || BRAND.green);
    doc.text(String(value ?? '—'), x + boxW / 2, y + 10, { align: 'center' });

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    setText(doc, BRAND.textMuted);
    doc.text(label.toUpperCase(), x + boxW / 2, y + 15, { align: 'center' });
  });

  return y + 22;
}

// ─── Table renderer ───────────────────────────────────────────────────────────

/**
 * Render a simple table.
 * columns: [{ header, key, width, align, colorFn }]
 * rows: array of objects
 */
export function addTable(doc, columns, rows, y, { rowH = 7, headerBg = BRAND.bgCard, footerY = 278 } = {}) {
  const m    = PAGE.margin;
  const maxW = PAGE.w - m * 2;

  // Compute widths
  const totalFlex = columns.reduce((s, c) => s + (c.flex || 1), 0);
  const colWidths = columns.map(c =>
    c.width != null ? c.width : ((c.flex || 1) / totalFlex) * maxW
  );
  // Re-normalise if fixed widths leave space
  const fixedTotal = columns.reduce((s, c, i) => c.width != null ? s + colWidths[i] : s, 0);
  const flexCount  = columns.filter(c => c.width == null).length;
  const remaining  = maxW - fixedTotal;
  columns.forEach((c, i) => {
    if (c.width == null) colWidths[i] = remaining / flexCount;
  });

  // Header row
  setFill(doc, headerBg);
  doc.rect(m, y, maxW, rowH, 'F');

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  setText(doc, BRAND.textMuted);

  let x = m;
  columns.forEach((col, i) => {
    doc.text(col.header, x + 2, y + rowH - 2, { align: col.align || 'left' });
    x += colWidths[i];
  });
  y += rowH;

  // Data rows
  rows.forEach((row, ri) => {
    if (y > footerY) {
      doc.addPage();
      setFill(doc, BRAND.bgDark);
      doc.rect(0, 0, PAGE.w, PAGE.h, 'F');
      y = PAGE.margin + 4;

      // Repeat header
      setFill(doc, headerBg);
      doc.rect(m, y, maxW, rowH, 'F');
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'bold');
      setText(doc, BRAND.textMuted);
      let hx = m;
      columns.forEach((col, i) => {
        doc.text(col.header, hx + 2, y + rowH - 2);
        hx += colWidths[i];
      });
      y += rowH;
    }

    // Alternate row bg
    if (ri % 2 === 0) {
      setFill(doc, [248, 250, 252]);
      doc.rect(m, y, maxW, rowH, 'F');
    }

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');

    x = m;
    columns.forEach((col, i) => {
      const cellVal = String(row[col.key] ?? '—');
      const cellColor = col.colorFn ? col.colorFn(row[col.key], row) : BRAND.textPrimary;
      setText(doc, cellColor);
      const truncated = doc.splitTextToSize(cellVal, colWidths[i] - 4)[0] || '';
      doc.text(truncated, x + 2, y + rowH - 2, { align: col.align || 'left' });
      x += colWidths[i];
    });

    // Row bottom border
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    doc.line(m, y + rowH, m + maxW, y + rowH);

    y += rowH;
  });

  return y + 4;
}

// ─── Horizontal divider ───────────────────────────────────────────────────────

export function addDivider(doc, y) {
  doc.setDrawColor(...BRAND.bgCard);
  doc.setLineWidth(0.3);
  doc.line(PAGE.margin, y, PAGE.w - PAGE.margin, y);
  return y + 4;
}

// ─── Risk score gauge ────────────────────────────────────────────────────────

/**
 * Render a simple horizontal progress bar risk score.
 */
export function addRiskBar(doc, score, y) {
  const m    = PAGE.margin;
  const maxW = PAGE.w - m * 2;
  const val  = Math.min(100, Math.max(0, score || 0));

  const color = val >= 80 ? BRAND.critical
              : val >= 60 ? BRAND.high
              : val >= 40 ? BRAND.medium
              : val >= 20 ? BRAND.low
              : BRAND.pass;

  // Track
  setFill(doc, BRAND.bgCard);
  doc.roundedRect(m, y, maxW, 6, 3, 3, 'F');

  // Fill
  setFill(doc, color);
  doc.roundedRect(m, y, (val / 100) * maxW, 6, 3, 3, 'F');

  // Label
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  setText(doc, color);
  doc.text(`${val} / 100`, PAGE.w - m, y + 4.5, { align: 'right' });

  return y + 10;
}

// ─── Finalize: add all footers ────────────────────────────────────────────────

/**
 * Iterate all pages and stamp footers. Call once, just before doc.save().
 */
export function finalizeDoc(doc) {
  const total = doc.getNumberOfPages();
  for (let p = 1; p <= total; p++) {
    doc.setPage(p);
    if (p > 1) {
      // Ensure light background on continuation pages
      setFill(doc, BRAND.bgDark);
      doc.rect(0, 0, PAGE.w, PAGE.h, 'F');
    }
    addFooter(doc, p, total);
  }
}
