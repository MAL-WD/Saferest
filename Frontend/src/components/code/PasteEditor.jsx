import React, { useState } from 'react';
import Editor from '@monaco-editor/react';
import LanguageSelector from './LanguageSelector';

const PasteEditor = ({ onScan, isScanning }) => {
  const [code, setCode] = useState('// Paste your code here\n');
  const [language, setLanguage] = useState('javascript');
  const [error, setError] = useState(null);

  const codeSize = code.length;
  const maxSize = 50 * 1024;
  const percentage = (codeSize / maxSize) * 100;
  const isExceeded = codeSize > maxSize;

  const handleScan = () => {
    if (isScanning) return; // already scanning — block extra clicks
    if (!code.trim()) {
      setError('Please paste some code');
      return;
    }
    if (isExceeded) {
      setError('Code exceeds maximum size of 50KB');
      return;
    }
    setError(null);
    onScan({ code, language });
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Header Section */}
      <div className="mb-2">
        <h2 className="text-2xl font-bold mb-1" style={{ color: 'var(--text)' }}>Paste or Upload Code</h2>
        <p className="text-sm text-muted">Paste your code, upload a file, or scan a GitHub repo. Select language and scan for vulnerabilities.</p>
      </div>

      {/* Input Buttons Section */}
      <div className="mb-4">
        {/* The input tabs (Paste/Upload/GitHub) are rendered by parent CodeInputTabs */}
      </div>

      {/* Language Selector Section */}
      <div className="mb-4">
        <LanguageSelector value={language} onChange={setLanguage} />
      </div>

      {/* Code Size and Progress Section */}
      <div className="card" style={{ padding: 18 }}>
        <div className="flex-between" style={{ gap: 16, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          {/* LanguageSelector moved above for spacing */}

          <div style={{ flex: 1, minWidth: 240 }}>
            <div className="flex-between" style={{ gap: 12, marginBottom: 8 }}>
              <span className="form-label" style={{ margin: 0 }}>
                Code size
              </span>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <span
                  className={`badge ${
                    isExceeded
                      ? 'badge-critical'
                      : percentage > 80
                      ? 'badge-high'
                      : 'badge-info'
                  }`}
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 800,
                  }}
                >
                  {(codeSize / 1024).toFixed(1)} KB
                </span>
                <span className="text-muted" style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                  / 50 KB
                </span>
              </div>
            </div>

            <div className="flex-between" style={{ gap: 12, marginBottom: 8 }}>
              <span className="text-muted" style={{ fontSize: 12 }}>
                Keep it under the limit for best results.
              </span>
              <span className="text-muted" style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                {Math.min(Math.round(percentage), 100)}%
              </span>
            </div>

            <div
              style={{
                height: 10,
                background: 'var(--border-soft)',
                border: '1px solid var(--border)',
                borderRadius: 999,
                overflow: 'hidden',
                boxShadow: 'inset 0 1px 0 var(--border-soft)',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${Math.min(percentage, 100)}%`,
                  background: isExceeded
                    ? 'linear-gradient(90deg, rgba(239,68,68,0.9), rgba(239,68,68,0.55))'
                    : percentage > 80
                    ? 'linear-gradient(90deg, rgba(251,191,36,0.9), rgba(251,191,36,0.55))'
                    : 'linear-gradient(90deg, rgba(59,130,246,0.95), rgba(172,236,0,0.75))',
                  transition: 'width 220ms var(--transition)',
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <Editor
          height="450px"
          language={language}
          value={code}
          onChange={(value) => setCode(value || '')}
          theme="vs-dark"
          options={{
            fontSize: 14,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            lineNumbers: 'on',
          }}
        />
      </div>

      {error && (
        <div className="card" style={{ borderColor: 'rgba(239, 68, 68, 0.38)', padding: 14 }}>
          {error}
        </div>
      )}

      <div className="card card-glass" style={{ padding: 16 }}>
        <div className="flex-between" style={{ gap: 14, flexWrap: 'wrap' }}>
          <div style={{ minWidth: 240 }}>
            <div style={{ fontWeight: 800, letterSpacing: -0.2, marginBottom: 4, color: 'var(--text)' }}>Ready to scan</div>
            <div className="text-muted" style={{ fontSize: 13 }}>
              We’ll analyze your code and generate findings with severity and remediation tips.
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {isExceeded ? (
              <span className="badge badge-critical" style={{ fontFamily: 'var(--font-mono)' }}>
                Limit exceeded
              </span>
            ) : null}
            <button
              className="btn btn-primary btn-lg"
              onClick={handleScan}
              disabled={isScanning || !code.trim() || isExceeded}
            >
              {isScanning ? 'Analysing Code...' : 'Scan Code'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PasteEditor;
