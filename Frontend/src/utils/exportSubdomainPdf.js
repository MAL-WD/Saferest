/**
 * exportSubdomainPdf.js
 * Professional PDF export for Subdomain Finder.
 */
import {
  createDoc, addPageHeader, addSection, addStatRow,
  addTable, finalizeDoc, BRAND, PAGE
} from './exportReportUtils';

export async function exportSubdomainPdf(domain, hosts, queriedAt) {
  const doc = createDoc();
  const m = PAGE.margin;
  
  const formattedDate = queriedAt 
    ? new Date(queriedAt).toLocaleString() 
    : new Date().toLocaleString();

  // ── Header ─────────────────────────────────────────────────────────────────
  let y = await addPageHeader(doc, {
    reportTitle:    'Subdomain Discovery',
    reportSubtitle: `Generated ${new Date().toLocaleDateString()}`,
    meta: [
      { label: 'Target Domain', value: domain },
      { label: 'Total Found',   value: hosts.length },
      { label: 'Scan Time',     value: formattedDate },
    ],
  });

  // ── Summary stat boxes ─────────────────────────────────────────────────────
  y = addSection(doc, 'Scan Summary', y);
  y = addStatRow(doc, [
    { label: 'Unique Hostnames', value: hosts.length, color: BRAND.blue },
    { label: 'Target Domain',    value: domain,       color: BRAND.green },
    { label: 'Status',           value: 'COMPLETED',  color: BRAND.pass },
  ], y);

  // ── Hostnames table ────────────────────────────────────────────────────────
  if (hosts.length > 0) {
    y = addSection(doc, `Discovered Hostnames (${hosts.length})`, y);
    
    // Format hosts into an array of objects for the table
    const rows = hosts.map((host, idx) => ({
      index: idx + 1,
      hostname: host
    }));

    y = addTable(doc, [
      { header: '#',        key: 'index',    width: 15 },
      { header: 'Hostname', key: 'hostname', flex: 1 },
    ], rows, y, { rowH: 8 });
  }

  // ── Finalize ───────────────────────────────────────────────────────────────
  finalizeDoc(doc);
  doc.save(`webguard-subdomains-${domain || 'export'}.pdf`);
}
