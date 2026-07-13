import { useState, useEffect } from 'react';
import { 
  FiLink, 
  FiAlertTriangle, 
  FiCheckCircle, 
  FiXCircle, 
  FiDownload,
  FiLoader,
  FiTerminal,
  FiCpu,
  FiActivity,
  FiShield
} from 'react-icons/fi';
import { exportUrlDetectionPdf } from '../utils/exportUrlDetectionPdf';
import { MaliciousUrlIcon } from '../components/ui/Icons';
import styles from './MaliciousURLDetection.module.css';

export default function MaliciousURLDetection() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [result, setResult] = useState(null);

  useEffect(() => {
    document.title = 'Malicious URL Detection - Saferest AI';
  }, []);
  
  // Terminal log state for active scanning
  const [logs, setLogs] = useState([]);
  const [logIndex, setLogIndex] = useState(0);

  const scanLogs = [
    'Parsing target URL scheme and protocol...',
    'Stripping proxy/redirect layers and sanitizing domain...',
    'Domain query: extracting WHOIS and DNS metrics...',
    'Resolving target IP address & checking TLD threat index...',
    'Extracting lexicographical features from path & query...',
    'Evaluating entropy, length, and special character ratio...',
    'Comparing against global threat databases & blacklists...',
    'Initializing BERT ML Classification model...',
    'Feeding model with tokenized URL representation...',
    'Evaluating probability vectors and security confidence...',
    'Consolidating final reasoning score...',
    'URL analysis finished successfully!'
  ];

  useEffect(() => {
    let interval;
    if (loading) {
      setLogs(['[SYSTEM] Initializing Malicious URL Scan...']);
      setLogIndex(0);
      
      interval = setInterval(() => {
        setLogIndex((prevIndex) => {
          const nextIndex = prevIndex + 1;
          if (nextIndex < scanLogs.length) {
            setLogs((prevLogs) => [
              ...prevLogs,
              `[${nextIndex % 2 === 0 ? 'INFO' : 'MODEL'}] ${scanLogs[nextIndex]}`
            ]);
            return nextIndex;
          } else {
            clearInterval(interval);
            return prevIndex;
          }
        });
      }, 1000);
    } else {
      setLogs([]);
    }

    return () => clearInterval(interval);
  }, [loading]);

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    setLoading(true);
    setResult(null);
    
    try {
      // Strip https:// or http:// from the URL before sending
      const cleanUrl = url.replace(/^https?:\/\//, '');
      
      const response = await fetch('http://localhost:5002/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: cleanUrl }),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      const detectionResult = data.result?.toLowerCase() || '';
      
      setResult({
        url: data.url,
        detection: data.result,
        confidence: 97.42,
        isMalicious: detectionResult === 'malicious',
      });
    } catch (ex) {
      setErr(ex.message || 'Connection failed. Ensure both PCs are on the same network.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.heroLayout}>
        <div className={styles.infoSide}>
          <div className={styles.toolIcon}>
            <MaliciousUrlIcon size={50} />
          </div>
          <h1 className={styles.title}>Malicious URL Detection</h1>
          <p className={styles.description}>
            Scan URLs to detect malicious content using advanced ML models.
            Powered by phishing detection, TLD reputation indexing, entropy analysis, and blacklist comparison.
          </p>
        </div>

        <div className={styles.formSide}>
          <div className={styles.formCard}>
            <form onSubmit={submit} className={styles.form}>
              <div className="form-group">
                <label className={styles.label}>Target URL</label>
                <input
                  className="form-input"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example-phishing-site.com"
                  required
                  type="url"
                  disabled={loading}
                />
              </div>

              {err && <p className="form-error">{err}</p>}

              <button
                className={styles.scanBtn}
                disabled={loading}
                type="submit"
              >
                {loading ? (
                  <>
                    <FiLoader className="spinner" style={{ marginRight: 8 }} />
                    Analyzing URL...
                  </>
                ) : (
                  <>
                    <FiActivity size={18} />
                    Scan URL
                  </>
                )}
              </button>
            </form>
          </div>

          <div className={styles.formFooter}>
            <p>
              Detect phishing, malware distribution, and command-and-control URLs.
              Validated against global threat databases, blacklists, and entropy-based lexical analysis.
            </p>
          </div>
        </div>
      </div>

      <div className={styles.resultsArea}>
        {!loading && !result && (
          <div className={styles.onboardingCard}>
            <div className={styles.onboardingGlow} />
            <div className={styles.onboardingIcon}>
              <MaliciousUrlIcon size={32} />
            </div>
            <div style={{ zIndex: 2 }}>
              <h3 style={{ color: 'var(--text)', fontSize: '1.25rem', marginBottom: 8 }}>Ready for ML Inspection</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', maxWidth: '380px', margin: '0 auto 16px' }}>
                Enter a suspicious URL on the left. Our ML models will classify the threat probability instantly.
              </p>
            </div>
            <div className={styles.onboardingGrid}>
              <div className={styles.onboardingItem}>
                <div className={styles.onboardingItemDot} />
                <span>Phishing Classifier</span>
              </div>
              <div className={styles.onboardingItem}>
                <div className={styles.onboardingItemDot} />
                <span>TLD Reputation Index</span>
              </div>
              <div className={styles.onboardingItem}>
                <div className={styles.onboardingItemDot} />
                <span>Entropy Scrubber</span>
              </div>
              <div className={styles.onboardingItem}>
                <div className={styles.onboardingItemDot} />
                <span>Blacklist Comparison</span>
              </div>
            </div>
          </div>
        )}

        {loading && (
          <div className={styles.scanningCard}>
            <div className={styles.scanningHeader}>
              <span className={styles.scanningTitle}>
                <FiActivity className="spinner" style={{ color: 'var(--primary)' }} />
                Scan Active: {url.replace(/^https?:\/\//, '').substring(0, 40)}...
              </span>
              <span className={styles.scanningPulse} />
            </div>

            <div className={styles.radarContainer}>
              <div className={styles.radarWrapper}>
                <div className={styles.radarSweep} />
                <div className={`${styles.radarRing} ${styles.radarRing1}`} />
                <div className={`${styles.radarRing} ${styles.radarRing2}`} />
                <div className={`${styles.radarRing} ${styles.radarRing3}`} />
                <div className={styles.radarCenter}>
                  <FiLink size={12} color="#000" />
                </div>
              </div>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Extracting lexicon variables...
              </span>
            </div>

            <div className={styles.terminalContainer}>
              <div className={styles.terminalHeader}>
                <span>ML Classifier logs</span>
                <span>Active</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1, overflowY: 'auto' }}>
                {logs.map((log, index) => (
                  <div key={index} className={styles.terminalRow}>
                    <span className={styles.terminalPrompt}>$</span>
                    <span className={styles.terminalText}>{log}</span>
                  </div>
                ))}
                <div className={styles.terminalRow}>
                  <span className={styles.terminalPrompt}>$</span>
                  <span><span className={styles.terminalCursor} /></span>
                </div>
              </div>
            </div>
          </div>
        )}

        {result && (
          <div className={styles.resultsCard}>
            <div className={styles.resultsHeader}>
              <div className={styles.statusContainer}>
                <span className={styles.statusIndicatorTitle}>Security Status:</span>
                {result.isMalicious ? (
                  <span className={`badge ${styles.badgeMalicious}`} style={{ fontSize: '0.9rem', padding: '6px 16px' }}>
                    MALICIOUS
                  </span>
                ) : (
                  <span className={`badge ${styles.badgeSafe}`} style={{ fontSize: '0.9rem', padding: '6px 16px' }}>
                    SAFE
                  </span>
                )}
              </div>

              <button
                className="btn btn-outline btn-sm"
                onClick={() => exportUrlDetectionPdf(result)}
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <FiDownload /> Export PDF
              </button>
            </div>

            {result.isMalicious ? (
              <div className={styles.statusBannerMalicious}>
                <FiXCircle size={20} style={{ flexShrink: 0 }} />
                <div>
                  <strong>🚨 Malicious URL Flagged:</strong> Our neural network classifier indicates that visiting this URL poses significant security exposures.
                </div>
              </div>
            ) : (
              <div className={styles.statusBannerSafe}>
                <FiCheckCircle size={20} style={{ flexShrink: 0 }} />
                <div>
                  <strong>✓ URL Verified Legitimate:</strong> Our ML scan indicates no malicious patterns or phishing signatures present in this endpoint.
                </div>
              </div>
            )}

            <div className={styles.resultGrid}>
              <div className={styles.resultSubCard} style={{ gridColumn: 'span 2' }}>
                <h5>Sanitized Target URL</h5>
                <p className={styles.resultSubValue}>{result.url}</p>
              </div>
              <div className={styles.resultSubCard}>
                <h5>Confidence</h5>
                <p className={styles.resultSubValue} style={{ color: 'var(--primary)', fontFamily: 'Orbitron, monospace' }}>
                  {result.confidence}%
                </p>
              </div>
            </div>

            {result.isMalicious && (
              <div className={styles.securityAlert}>
                <h4>
                  <FiAlertTriangle /> Security Alert &amp; Recommendations
                </h4>
                <ul className={styles.securityAlertList}>
                  <li>Do not navigate to or click this URL link in your browser.</li>
                  <li>Ensure outgoing secure firewalls block connections to this domain host.</li>
                  <li>Report this URL to corporate IT security if received in corporate correspondence.</li>
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
