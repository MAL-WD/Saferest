import React, { useState, useEffect, useRef } from 'react';
import CodeInputTabs from '../components/code/CodeInputTabs';
import ScanProgress from '../components/code/ScanProgress';
import CodeScanResults from '../components/code/CodeScanResults';
import { CodeScannerIcon } from '../components/ui/Icons';
import api from '../services/api';
import styles from './CodeScan.module.css';

const CodeScan = () => {
  const [state, setState] = useState('input'); // input, scanning, results
  const [scanId, setScanId] = useState(null);
  const [scan, setScan] = useState(null);
  const [submittedCode, setSubmittedCode] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [claudeTest, setClaudeTest] = useState({ status: 'idle', message: '' });
  const pollRef = useRef(null);
  const submittingRef = useRef(false);

  useEffect(() => {
    document.title = 'Code Scanner - Saferest AI';
  }, []);

  useEffect(
    () => () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
      submittingRef.current = false;
    },
    []
  );

  const handleScanStart = async ({ endpoint, payload }) => {
    if (submittingRef.current || loading) return;
    submittingRef.current = true;

    try {
      setError(null);
      setLoading(true);
      setState('scanning');

      let response;
      if (endpoint === 'upload') {
        try {
          const file = payload.get('file');
          if (file) {
            const text = await file.text();
            setSubmittedCode(text);
          }
        } catch (e) {
          setSubmittedCode('// Unable to read file locally');
        }
        response = await api.postMultipart('/code-scan/upload', payload);
      } else if (endpoint === 'github') {
        setSubmittedCode('// Code fetched directly from GitHub by the backend. Cannot be previewed here.');
        response = await api.post('/code-scan/github', payload);
      } else {
        setSubmittedCode(payload.code || '');
        response = await api.post('/code-scan', payload);
      }

      const { data } = response;
      const targetScanId = data.scanId || (data.scans && data.scans[0]?.scanId);

      if (!targetScanId) {
        throw new Error('No scan ID returned from server');
      }

      setScanId(targetScanId);
      setLoading(false);
      submittingRef.current = false;

      pollForResults(targetScanId);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      setState('input');
      setLoading(false);
      submittingRef.current = false;
    }
  };

  const pollForResults = (id) => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }

    const started = Date.now();
    const maxMs = 15 * 60 * 1000;
    let consecutiveErrors = 0;
    const MAX_CONSECUTIVE_ERRORS = 4;

    pollRef.current = setInterval(async () => {
      if (Date.now() - started > maxMs) {
        if (pollRef.current) clearInterval(pollRef.current);
        pollRef.current = null;
        setError(
          'Scan timed out waiting for results. Ensure the backend is running.'
        );
        setState('input');
        return;
      }

      try {
        const { data } = await api.get(`/code-scan/${id}`);
        const scanData = data.codeScan;

        if (!scanData) {
          throw new Error('Scan data not found');
        }

        consecutiveErrors = 0;
        setScan(scanData);

        if (scanData.status === 'completed' || scanData.status === 'failed') {
          if (pollRef.current) clearInterval(pollRef.current);
          pollRef.current = null;
          setState('results');
        }
      } catch (err) {
        consecutiveErrors++;
        const status = err?.response?.status;
        const isFatal = (status >= 400 && status < 500 && status !== 429) || consecutiveErrors > MAX_CONSECUTIVE_ERRORS;
        if (isFatal) {
          if (pollRef.current) clearInterval(pollRef.current);
          pollRef.current = null;
          setError(err?.response?.data?.message || 'Failed to fetch scan status. Please try again.');
          setState('input');
        }
      }
    }, 3000);
  };

  const runClaudeTest = async () => {
    setClaudeTest({ status: 'running', message: 'Testing Claude connectivity...' });
    try {
      const { data } = await api.get('/code-scan/ai/test');
      if (!data?.success) throw new Error(data?.message || 'Claude test failed');
      setClaudeTest({
        status: 'ok',
        message: `OK • ${data.model} • ${data.latencyMs}ms`,
      });
    } catch (e) {
      setClaudeTest({ status: 'fail', message: e.response?.data?.message || e.message || 'Claude test failed' });
    }
  };

  const handleReset = () => {
    setState('input');
    setScanId(null);
    setScan(null);
    setError(null);
  };

  return (
    <div className={styles.container}>
      <div className={styles.heroLayout}>
        {/* Left Side: Information */}
        <div className={styles.infoSide}>
          <div className={styles.toolIcon}>
            <CodeScannerIcon size={50} />
          </div>
          <h1 className={styles.title}>Code Security Scanner</h1>
          <p className={styles.description}>
            Paste code, upload a file, or scan a GitHub repository. Saferest highlights issues, explains risk, and suggests fixes.
          </p>
          <div className="flex" style={{ gap: 10, flexWrap: 'wrap', marginBottom: '24px' }}>
            <span className="badge badge-info">Static checks</span>
            <span className="badge badge-low">OWASP mapping</span>
            <span className="badge badge-medium">AI guidance</span>
          </div>

          <div className="card card-glass" style={{ padding: 18, marginTop: 'auto' }}>
            <div style={{ display: 'grid', gap: 10 }}>
              <div className="flex-between" style={{ gap: 12 }}>
                <span className="text-muted" style={{ fontSize: 13, fontWeight: 700, letterSpacing: 0.4 }}>
                  Status
                </span>
                <span
                  className="badge"
                  style={{
                    background:
                      state === 'scanning'
                        ? 'rgba(172, 236, 0, 0.10)'
                        : state === 'results'
                        ? 'rgba(16, 185, 129, 0.12)'
                        : 'rgba(59, 130, 246, 0.12)',
                    border:
                      state === 'scanning'
                        ? '1px solid rgba(172, 236, 0, 0.26)'
                        : state === 'results'
                        ? '1px solid rgba(16, 185, 129, 0.28)'
                        : '1px solid rgba(59, 130, 246, 0.22)',
                    color:
                      state === 'scanning'
                        ? 'var(--primary)'
                        : state === 'results'
                        ? 'var(--success)'
                        : 'var(--secondary)',
                  }}
                >
                  {state === 'input' ? 'Ready' : state === 'scanning' ? 'Scanning' : 'Results'}
                </span>
              </div>
              <div className="flex-between" style={{ gap: 12 }}>
                <span className="text-muted" style={{ fontSize: 13, fontWeight: 700, letterSpacing: 0.4 }}>
                  Scan ID
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text)' }}>
                  {scanId || '—'}
                </span>
              </div>
              <div className="flex-between" style={{ gap: 12, alignItems: 'center' }}>
                <span className="text-muted" style={{ fontSize: 13, fontWeight: 700, letterSpacing: 0.4 }}>
                  Claude
                </span>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={runClaudeTest}
                  disabled={claudeTest.status === 'running'}
                  title="Verify Claude API connectivity"
                >
                  {claudeTest.status === 'running' ? 'Testing…' : 'Test API'}
                </button>
              </div>
              {claudeTest.status !== 'idle' && (
                <div
                  style={{
                    fontSize: 12,
                    color:
                      claudeTest.status === 'ok'
                        ? 'var(--success)'
                        : claudeTest.status === 'fail'
                        ? 'var(--danger)'
                        : 'var(--info)',
                    fontFamily: 'var(--font-mono)',
                    lineHeight: 1.35,
                  }}
                >
                  {claudeTest.message}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Form and Tools */}
        <div className={styles.formSide}>
          {error && (
            <div className="card" style={{ borderColor: 'rgba(239, 68, 68, 0.38)', marginBottom: 18, padding: 18 }}>
              <div className="flex-between" style={{ gap: 14, alignItems: 'flex-start' }}>
                <div className="flex" style={{ gap: 12, alignItems: 'flex-start' }}>
                  <div className="badge badge-critical">Error</div>
                  <div>
                    <div style={{ fontWeight: 800, marginBottom: 6, letterSpacing: -0.2, color: 'var(--text)' }}>Something went wrong</div>
                    <div style={{ color: 'var(--danger)', fontSize: 13, lineHeight: 1.55 }}>{error}</div>
                  </div>
                </div>
                <button className="btn btn-ghost" onClick={() => setError(null)}>
                  Dismiss
                </button>
              </div>
            </div>
          )}

          {state === 'input' && (
            <div className="animate-fade-in">
              <CodeInputTabs onScanStart={handleScanStart} isScanning={loading} />
            </div>
          )}

          {state === 'scanning' && (
            <div className="animate-fade-in">
              <ScanProgress scan={scan} />
            </div>
          )}

          {state === 'results' && (
            <div className="animate-fade-in">
              <CodeScanResults scan={scan} submittedCode={submittedCode} onReset={handleReset} />
              <div style={{ marginTop: 18 }}>
                <button
                  className="btn btn-outline btn-lg"
                  onClick={handleReset}
                >
                  Start New Scan
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CodeScan;
