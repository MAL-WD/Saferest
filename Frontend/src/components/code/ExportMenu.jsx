import React from 'react';
import { exportCodeScanPdf } from '../../utils/exportCodeScanPdf';

const ExportMenu = ({ scanId, scan }) => {

  const handleExportJSON = async () => {
    try {
      const response = await fetch(`/api/code-scan/${scanId}/export/json`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `codescan-${scanId}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Failed to export JSON:', err);
    }
  };

  const handleExportPDF = async () => {
    try {
      if (!scan) throw new Error('Scan data missing');
      await exportCodeScanPdf(scan);
    } catch (err) {
      console.error('Failed to export PDF:', err);
      alert('PDF export failed');
    }
  };

  return (
    <div className="flex gap-3">
      <button
        className="btn btn-outline btn-sm"
        onClick={handleExportJSON}
        title="Download scan results as JSON"
      >
        Export JSON
      </button>
      <button
        className="btn btn-primary btn-sm"
        onClick={handleExportPDF}
        title="Download scan report as PDF"
      >
        Export PDF
      </button>
    </div>
  );
};

export default ExportMenu;
