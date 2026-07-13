import React, { useState } from 'react';

const SEVERITY_COLORS = {
  critical: 'from-red-500 to-red-700 text-white shadow-red-500/20',
  high: 'from-orange-500 to-orange-700 text-white shadow-orange-500/20',
  medium: 'from-amber-500 to-yellow-600 text-white shadow-amber-500/20',
  low: 'from-blue-500 to-blue-700 text-white shadow-blue-500/20',
  info: 'from-purple-500 to-purple-700 text-white shadow-purple-500/20',
};

const FindingDetail = ({ finding, onClose }) => {
  const [copiedVuln, setCopiedVuln] = useState(false);
  const [copiedFixed, setCopiedFixed] = useState(false);

  if (!finding) return null;

  const handleCopy = (text, setter) => {
    navigator.clipboard.writeText(text);
    setter(true);
    setTimeout(() => setter(false), 2000);
  };

  return (
    <div className="rounded-2xl bg-[#0B1120] border border-gray-800 shadow-2xl overflow-hidden animate-fade-in relative" style={{ marginTop: '32px' }}>
      {/* HEADER */}
      <div className="relative bg-gradient-to-br from-[#111827] to-[#0B1120] border-b border-gray-800 flex flex-col gap-4" style={{ padding: '24px 32px' }}>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-500 hover:text-white bg-transparent hover:bg-gray-800 rounded-full transition border-0 cursor-pointer"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-gradient-to-r shadow-lg ${SEVERITY_COLORS[finding.severity]}`}>
            {finding.severity}
          </span>
          <span className="text-gray-400 text-sm font-medium">Line {finding.line}</span>
        </div>
        
        {/* Using div instead of h2 to prevent global index.css bleed */}
        <div className="text-xl sm:text-2xl font-bold text-white leading-tight m-0 pr-12">{finding.title}</div>

        <div className="flex flex-wrap gap-2 mt-2">
          {finding.owaspCategory && (
            <span className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-md text-xs text-blue-300 font-medium">
              OWASP: {finding.owaspCategory}
            </span>
          )}
          {finding.cwe && (
            <span className="px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-md text-xs text-cyan-300 font-medium">
              CWE: {finding.cwe}
            </span>
          )}
          {finding.category && (
            <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-md text-xs text-emerald-300 font-medium">
              {finding.category}
            </span>
          )}
        </div>
      </div>

      {/* BODY */}
      <div className="flex flex-col gap-8" style={{ padding: '24px 32px' }}>
        
        {/* Description */}
        {finding.description && finding.description.trim() !== '' && (
          <div>
            <div className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              Description
            </div>
            <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap m-0">{finding.description}</p>
          </div>
        )}

        {/* Code Blocks - Side by Side on large screens */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {finding.vulnerableCode && finding.vulnerableCode.trim() !== '' && (
            <div className="flex flex-col">
              <div className="text-sm font-bold text-red-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                Vulnerable Code
              </div>
              <div className="relative bg-[#05080f] rounded-xl border border-red-900/30 overflow-hidden flex-1 group shadow-inner">
                <div className="absolute top-0 left-0 w-1 h-full bg-red-500/50"></div>
                <pre className="text-gray-300 text-sm font-mono overflow-x-auto whitespace-pre-wrap break-words m-0" style={{ padding: '20px 20px 20px 24px' }}>{finding.vulnerableCode}</pre>
                <button
                  className="absolute top-3 right-3 px-3 py-1.5 bg-gray-800/80 hover:bg-gray-700 text-gray-300 rounded-md text-xs font-medium transition opacity-0 group-hover:opacity-100 backdrop-blur-sm border border-gray-600 cursor-pointer shadow-md"
                  onClick={() => handleCopy(finding.vulnerableCode, setCopiedVuln)}
                >
                  {copiedVuln ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
          )}

          {finding.fixedCode && finding.fixedCode.trim() !== '' && (
            <div className="flex flex-col">
              <div className="text-sm font-bold text-emerald-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Fixed Code
              </div>
              <div className="relative bg-[#05080f] rounded-xl border border-emerald-900/30 overflow-hidden flex-1 group shadow-inner">
                <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500/50"></div>
                <pre className="text-gray-300 text-sm font-mono overflow-x-auto whitespace-pre-wrap break-words m-0" style={{ padding: '20px 20px 20px 24px' }}>{finding.fixedCode}</pre>
                <button
                  className="absolute top-3 right-3 px-3 py-1.5 bg-gray-800/80 hover:bg-gray-700 text-gray-300 rounded-md text-xs font-medium transition opacity-0 group-hover:opacity-100 backdrop-blur-sm border border-gray-600 cursor-pointer shadow-md"
                  onClick={() => handleCopy(finding.fixedCode, setCopiedFixed)}
                >
                  {copiedFixed ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Details Grids */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-gray-800/50">
          {finding.explanation && (
            <div>
              <div className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <svg className="w-4 h-4 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Why This is Dangerous
              </div>
              <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap m-0">{finding.explanation}</p>
            </div>
          )}

          {finding.remediation && (
            <div>
              <div className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
                How to Fix
              </div>
              <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap m-0">{finding.remediation}</p>
            </div>
          )}
        </div>

        {finding.references && finding.references.length > 0 && (
          <div className="pt-6 border-t border-gray-800/50">
            <div className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
              References
            </div>
            <ul className="flex flex-col gap-2 p-0 m-0 list-none">
              {finding.references.map((ref, idx) => (
                <li key={idx} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0"></span>
                  <a
                    href={ref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 text-sm hover:underline transition truncate"
                  >
                    {ref}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default FindingDetail;
