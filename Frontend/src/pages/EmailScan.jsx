import { useState, useEffect } from 'react';
import { 
  FiMail, 
  FiAlertTriangle, 
  FiDownload, 
  FiCheckCircle, 
  FiXCircle, 
  FiInfo, 
  FiShield, 
  FiLoader,
  FiTerminal,
  FiCpu,
  FiActivity
} from 'react-icons/fi';
import { EmailScannerIcon } from '../components/ui/Icons';
import api from '../services/api';
import { exportEmailScanPdf } from '../utils/exportEmailScanPdf';
import styles from './EmailScan.module.css';


function ShieldCheckIcon(props) {
  return <FiShield {...props} style={{ color: '#10B981', ...props.style }} />;
}

function Badge({ status }) {
  let statusClass = styles.badgeFail;
  let icon = <FiXCircle />;

  if (status === 'PASS') {
    statusClass = styles.badgePass;
    icon = <FiCheckCircle />;
  } else if (status === 'WARN') {
    statusClass = styles.badgeWarn;
    icon = <FiInfo />;
  }

  return (
    <span className={`badge ${statusClass}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      {icon} {status}
    </span>
  );
}

export default function EmailScan() {
  const [domain, setDomain] = useState('');
  const [emailText, setEmailText] = useState('');
  const [confirm, setConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [result, setResult] = useState(null);

  const getGradeColor = (grade) => {
    if (grade === 'F') return { color: '#EF4444', bg: 'rgba(239, 68, 68, 0.08)', border: 'rgba(239, 68, 68, 0.25)', shadow: 'rgba(239, 68, 68, 0.1)' };
    if (grade === 'C' || grade === 'D') return { color: '#FBBF24', bg: 'rgba(251, 191, 36, 0.08)', border: 'rgba(251, 191, 36, 0.25)', shadow: 'rgba(251, 191, 36, 0.1)' };
    return { color: '#10B981', bg: 'rgba(16, 185, 129, 0.08)', border: 'rgba(16, 185, 129, 0.25)', shadow: 'rgba(16, 185, 129, 0.1)' };
  };
  
  // Terminal log state for active scanning
  const [logs, setLogs] = useState([]);
  const [logIndex, setLogIndex] = useState(0);

  const scanLogs = [
    'Connecting to public DNS nameservers...',
    'Resolving A, AAAA, and MX records...',
    'Found mail exchanger servers. Inspecting MX priorities...',
    'Querying SPF TXT records at root...',
    'Parsing SPF record IP ranges & authorized qualifiers...',
    'Evaluating _dmarc policy TXT records...',
    'Checking DMARC alignment modes and reporting targets...',
    'Testing common selector keys for DKIM verification...',
    'Starting BERT AI Phishing classification on email content...',
    'Analyzing semantic threat signatures and impersonation risk...',
    'Awaiting final evaluation from WebGuard reasoning engine...',
    'Email scan finished successfully!'
  ];

  useEffect(() => {
    let interval;
    if (loading) {
      setLogs(['[SYSTEM] Initializing Email Security Scanner...']);
      setLogIndex(0);
      
      interval = setInterval(() => {
        setLogIndex((prevIndex) => {
          const nextIndex = prevIndex + 1;
          if (nextIndex < scanLogs.length) {
            setLogs((prevLogs) => [
              ...prevLogs,
              `[${nextIndex % 2 === 0 ? 'INFO' : 'CHECK'}] ${scanLogs[nextIndex]}`
            ]);
            return nextIndex;
          } else {
            clearInterval(interval);
            return prevIndex;
          }
        });
      }, 1200);
    } else {
      setLogs([]);
    }

    return () => clearInterval(interval);
  }, [loading]);

  useEffect(() => {
    document.title = 'Email Scanner - Saferest AI';
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    setLoading(true);
    setResult(null);
    try {
      const r = await api.post('/email-scan', { domain, emailText, confirmedAuthorization: confirm });
      setResult(r.data.emailScan);
    } catch (ex) {
      setErr(ex.response?.data?.message || ex.message);
    } finally {
      setLoading(false);
    }
  };

  const res = result?.results;
  const ai = result?.aiReport;

  return (
    <div className={styles.container}>
      <div className={styles.heroLayout}>
        <div className={styles.infoSide}>
          <div className={styles.toolIcon}>
            <EmailScannerIcon size={50} />
          </div>
          <h1 className={styles.title}>Email Security Scanner</h1>
          <p className={styles.description}>
            Passive DNS checks for SPF, DMARC, DKIM, MX, and reputation signals.
          </p>
        </div>

        <div className={styles.formSide}>
          <div className={styles.formCard}>
            <form onSubmit={submit} className={styles.form}>
              <div className="form-group">
                <label className={styles.label}>Domain Name</label>
              <input 
                className="form-input" 
                value={domain} 
                onChange={(e) => setDomain(e.target.value)} 
                placeholder="example.com" 
                required 
                disabled={loading}
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Raw Email Content (Optional BERT phishing scan)</label>
              <textarea 
                className="form-input" 
                value={emailText} 
                onChange={(e) => setEmailText(e.target.value)} 
                placeholder="Paste raw headers or body to check for phishing markers..." 
                rows={5}
                disabled={loading}
              />
            </div>

            <label className={styles.checkboxLabel}>
              <input 
                type="checkbox" 
                checked={confirm} 
                onChange={(e) => setConfirm(e.target.checked)} 
                disabled={loading}
              />
              <span>I confirm that I am authorized to perform a security and reputation scan for this domain.</span>
            </label>

            {err && <p className="form-error">{err}</p>}

            <button 
              className={styles.scanBtn} 
              disabled={loading || !confirm}
            >
              {loading ? (
                <>
                  <FiLoader className="spinner" style={{ marginRight: 8 }} />
                  Running analysis...
                </>
              ) : (
                'Run Security Scan'
              )}
            </button>
          </form>
        </div>
      </div>
      </div>

      {/* Full Width Below: Onboarding / Loading / Results State */}
      <div className={styles.resultsArea}>
          {/* 1. Onboarding State (Pre-scan) */}
          {!loading && !result && (
            <div className={styles.onboardingCard}>
              <div className={styles.onboardingGlow} />
              <div className={styles.onboardingIcon}>
                <EmailScannerIcon size={32} />
              </div>
              <div style={{ zIndex: 2 }}>
                <h3 style={{ color: '#fff', fontSize: '1.25rem', marginBottom: 8 }}>Ready for Diagnostics</h3>
                <p style={{ fontSize: '0.88rem', maxWidth: '380px', margin: '0 auto 16px' }}>
                  Enter a target domain name on the left to evaluate defensive record compliance and spoofing metrics.
                </p>
              </div>
              <div className={styles.onboardingGrid}>
                <div className={styles.onboardingItem}>
                  <div className={styles.onboardingItemDot} />
                  <span>SPF Record Validation</span>
                </div>
                <div className={styles.onboardingItem}>
                  <div className={styles.onboardingItemDot} />
                  <span>DMARC Policy Check</span>
                </div>
                <div className={styles.onboardingItem}>
                  <div className={styles.onboardingItemDot} />
                  <span>DKIM Key Discovery</span>
                </div>
                <div className={styles.onboardingItem}>
                  <div className={styles.onboardingItemDot} />
                  <span>MX DNS Vulnerability</span>
                </div>
              </div>
            </div>
          )}

          {/* 2. Loading State (Active Scan) */}
          {loading && (
            <div className={styles.scanningCard}>
              <div className={styles.scanningHeader}>
                <span className={styles.scanningTitle}>
                  <FiActivity className="spinner" style={{ color: 'var(--primary)' }} />
                  Scan Active: {domain}
                </span>
                <span className={styles.scanningPulse} />
              </div>

              {/* Radar Simulation */}
              <div className={styles.radarContainer}>
                <div className={styles.radarWrapper}>
                  <div className={styles.radarSweep} />
                  <div className={`${styles.radarRing} ${styles.radarRing1}`} />
                  <div className={`${styles.radarRing} ${styles.radarRing2}`} />
                  <div className={`${styles.radarRing} ${styles.radarRing3}`} />
                  <div className={styles.radarCenter}>
                    <FiMail size={12} color="#000" />
                  </div>
                </div>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Analyzing MX & SPF compliance...
                </span>
              </div>

              {/* Cybernetic Hacker Terminal logs */}
              <div className={styles.terminalContainer}>
                <div className={styles.terminalHeader}>
                  <span>Diagnostic logs</span>
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
                    <span>
                      <span className={styles.terminalCursor} />
                    </span>
                  </div>
                </div>
              </div>

              {/* Skeleton checks */}
              <div className={styles.loadingGrid}>
                <div className={styles.loadingItem}>
                  <span className={styles.loadingTitle}>SPF Configuration</span>
                  <div className={styles.loadingBar} />
                </div>
                <div className={styles.loadingItem}>
                  <span className={styles.loadingTitle}>DMARC Compliance</span>
                  <div className={styles.loadingBar} />
                </div>
              </div>
            </div>
          )}

          {/* 3. Completed State (Scan Results) */}
          {result && res && (
            <div className={styles.resultsCard}>
              <div className={styles.resultsHeader}>
                <div className={styles.gradeContainer}>
                  <span className={styles.gradeLabel}>Threat Grade:</span>
                  <span 
                    className={styles.gradeBadge}
                    style={result ? {
                      color: getGradeColor(result.grade).color,
                      backgroundColor: getGradeColor(result.grade).bg,
                      borderColor: getGradeColor(result.grade).border,
                      boxShadow: `0 0 20px ${getGradeColor(result.grade).shadow}`
                    } : {}}
                  >
                    {result.grade}
                  </span>
                </div>
                
                <button 
                  className="btn btn-outline btn-sm" 
                  onClick={() => exportEmailScanPdf(domain, result)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <FiDownload /> Export PDF
                </button>
              </div>


              {res.bertAnalysis && (
                <div 
                  className={styles.bertCard} 
                  style={{
                    background: res.bertAnalysis.status === 'PHISHING' 
                      ? 'rgba(239, 68, 68, 0.04)' 
                      : res.bertAnalysis.status === 'SUSPICIOUS' 
                        ? 'rgba(251, 191, 36, 0.04)' 
                        : 'rgba(16, 185, 129, 0.04)',
                    border: '1px solid ' + (
                      res.bertAnalysis.status === 'PHISHING' 
                        ? 'rgba(239, 68, 68, 0.2)' 
                        : res.bertAnalysis.status === 'SUSPICIOUS' 
                          ? 'rgba(251, 191, 36, 0.2)' 
                          : 'rgba(16, 185, 129, 0.2)'
                    ),
                    padding: 20,
                    borderRadius: 12,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 style={{ fontSize: '0.9rem', color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <FiTerminal style={{ color: 'var(--primary)' }} /> BERT AI Email Content Scan
                    </h4>
                    <span 
                      style={{
                        padding: '4px 10px',
                        borderRadius: 6,
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                        textTransform: 'uppercase',
                        background: res.bertAnalysis.status === 'PHISHING' 
                          ? 'rgba(239, 68, 68, 0.15)' 
                          : res.bertAnalysis.status === 'SUSPICIOUS' 
                            ? 'rgba(251, 191, 36, 0.15)' 
                            : 'rgba(16, 185, 129, 0.15)',
                        color: res.bertAnalysis.status === 'PHISHING' 
                          ? '#EF4444' 
                          : res.bertAnalysis.status === 'SUSPICIOUS' 
                            ? '#FBBF24' 
                            : '#10B981',
                        border: '1px solid ' + (
                          res.bertAnalysis.status === 'PHISHING' 
                            ? 'rgba(239, 68, 68, 0.3)' 
                            : res.bertAnalysis.status === 'SUSPICIOUS' 
                              ? 'rgba(251, 191, 36, 0.3)' 
                              : 'rgba(16, 185, 129, 0.3)'
                        ),
                      }}
                    >
                      {res.bertAnalysis.status}
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Confidence Score</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                        <div style={{ flex: 1, height: 6, background: 'rgba(255, 255, 255, 0.05)', borderRadius: 3, overflow: 'hidden' }}>
                          <div 
                            style={{ 
                              width: res.bertAnalysis.confidence, 
                              height: '100%', 
                              background: res.bertAnalysis.status === 'PHISHING' 
                                ? '#EF4444' 
                                : res.bertAnalysis.status === 'SUSPICIOUS' 
                                  ? '#FBBF24' 
                                  : '#10B981' 
                            }} 
                          />
                        </div>
                        <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#fff' }}>{res.bertAnalysis.confidence}</span>
                      </div>
                    </div>

                    <div>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Threat Level</span>
                      <div 
                        style={{ 
                          fontSize: '0.85rem', 
                          fontWeight: 'bold', 
                          marginTop: 4, 
                          color: res.bertAnalysis.threat_level === 'HIGH' 
                            ? '#EF4444' 
                            : res.bertAnalysis.threat_level === 'MEDIUM' 
                              ? '#FBBF24' 
                              : '#10B981' 
                        }}
                      >
                        {res.bertAnalysis.threat_level}
                      </div>
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: 10 }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Reasoning & Indicators</span>
                    <p style={{ fontSize: '0.82rem', margin: '4px 0 0 0', lineHeight: 1.45, color: '#b7c7da' }}>
                      {res.bertAnalysis.reason}
                    </p>
                  </div>
                </div>
              )}

              {ai?.summary && (
                <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)', padding: 18, borderRadius: 12 }}>
                  <h4 style={{ fontSize: '0.9rem', color: '#fff', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <FiCpu style={{ color: 'var(--primary)' }} /> AI Reasoning Summary
                  </h4>
                  <p style={{ fontSize: '0.85rem', lineHeight: 1.5, margin: 0 }}>{ai.summary}</p>
                </div>
              )}

              {/* Removed Check cards grid and Actionable recommendations */}
            </div>
          )}
      </div>
    </div>
  );
}
