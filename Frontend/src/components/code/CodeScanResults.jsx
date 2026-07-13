import React, { useState } from 'react';
import ScanSummaryCard from './ScanSummaryCard';
import FindingsSidebar from './FindingsSidebar';
import CodeViewer from './CodeViewer';
import FindingDetail from './FindingDetail';
import ExportMenu from './ExportMenu';

const CodeScanResults = ({ scan, submittedCode, onReset }) => {
  const [selectedFinding, setSelectedFinding] = useState(null);

  if (!scan) {
    return <div className="text-center py-12 text-gray-400">No scan data found</div>;
  }

  if (scan.status === 'failed') {
    return (
      <div className="card" style={{ borderColor: 'rgba(239, 68, 68, 0.38)', padding: 34, textAlign: 'center' }}>
        <div className="badge badge-critical" style={{ marginBottom: 16 }}>Scan Failed</div>
        <h3 className="text-2xl font-bold text-white mb-4">Security Analysis Interrupted</h3>
        <p className="text-gray-400 mb-8 max-w-lg mx-auto">
          {scan.error || 'An unexpected error occurred during the analysis process. This might be due to a service timeout or rate limiting.'}
        </p>
        <div className="flex gap-4 justify-center">
          <button className="btn btn-primary" onClick={onReset}>
            Try New Scan
          </button>
        </div>
      </div>
    );
  }

  if (scan.status !== 'completed') {
    return (
      <div className="text-center py-24">
        <div className="inline-block w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-4"></div>
        <div className="text-gray-400">Finalizing results...</div>
      </div>
    );
  }

  const findings = scan.findings || [];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-extrabold text-white m-0">Scan Results</h2>
        <ExportMenu scanId={scan._id || scan.scanId} scan={scan} />
      </div>

      <div>
        <ScanSummaryCard scan={scan} />
      </div>

      {findings.length === 0 ? (
        <div className="card card-blue" style={{ textAlign: 'center', padding: 38 }}>
          <div className="badge" style={{ background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.25)', color: 'rgba(110, 231, 183, 0.95)', marginBottom: 14 }}>
            All clear
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">No vulnerabilities detected</h3>
          <p className="text-muted text-base" style={{ margin: 0 }}>Your code passed the scan. Keep dependencies updated and re-scan after changes.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="col-span-2">
            <CodeViewer
              code={submittedCode || '// Code unavailable locally'}
              language={scan.language}
              findings={findings}
              selectedFinding={selectedFinding}
            />
            {selectedFinding && (
              <div className="animate-fade-up">
                <FindingDetail finding={selectedFinding} onClose={() => setSelectedFinding(null)} />
              </div>
            )}
          </div>

          <div className="col-span-1">
            <FindingsSidebar
              findings={findings}
              selectedFinding={selectedFinding}
              onSelectFinding={setSelectedFinding}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default CodeScanResults;
