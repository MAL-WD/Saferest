import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FiCheckCircle, FiClock, FiTarget, FiActivity, FiCpu, FiArrowLeft, FiDownload, FiShield } from 'react-icons/fi';
import api from '../services/api';
import { exportScanPdf } from '../utils/exportScanPdf';
import OWASPCategoryChart from '../components/scanner/OWASPCategoryChart';
import RiskScoreGauge from '../components/scanner/RiskScoreGauge';
import FindingCard from '../components/scanner/FindingCard';
import styles from './ScanResults.module.css';

export default function ScanResults() {
  const { id } = useParams();
  const [scan, setScan] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = 'Scan Results - Saferest AI';
    api.get(`/scans/${id}`)
      .then(res => setScan(res.data.scan))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="skeleton" style={{ height: '80vh', borderRadius: 16, marginTop: 24 }} />;
  if (!scan) return <div style={{ padding: '40px 0', textAlign: 'center' }}>Scan not found</div>;

  const durationStr = scan.startedAt && scan.completedAt 
    ? `${Math.round((new Date(scan.completedAt) - new Date(scan.startedAt)) / 1000)}s` 
    : 'N/A';
  const urlDetectionFinding = scan.findings.find((f) => f.scanner === 'URL Detection Model');
  const urlModelVerdict = urlDetectionFinding
    ? (urlDetectionFinding.severity === 'HIGH' ? 'Malicious' : 'Benign')
    : null;

  // Calculate static risk score based on findings
  const calculateStaticRiskScore = (findings) => {
    if (!findings || findings.length === 0) return 0;
    
    let critical = 0, high = 0, medium = 0, low = 0;
    findings.forEach(f => {
      const s = (f.severity || '').toLowerCase();
      if (s === 'critical') critical++;
      else if (s === 'high') high++;
      else if (s === 'medium') medium++;
      else if (s === 'low') low++;
    });
    
    if (critical > 0) return Math.min(100, 80 + critical * 10);
    if (high > 0) return Math.min(79, 60 + high * 5);
    if (medium > 0) return Math.min(59, 30 + medium * 3);
    if (low > 0) return Math.min(29, 10 + low * 2);
    return 0;
  };

  const staticRiskScore = calculateStaticRiskScore(scan.findings);

  return (
    <div className={styles.page}>
      <Link to="/scans" className={`btn btn-ghost btn-sm ${styles.backLink}`}>
        <FiArrowLeft /> Back to Scans
      </Link>

      <div className={styles.header}>
        <div>
          <div className={styles.titleRow}>
            <h2>Scan Results</h2>
            {scan.status === 'completed' ? (
              <span className={`${styles.statusBadge} ${styles.completed}`}><FiCheckCircle /> Completed</span>
            ) : (
              <span className={`${styles.statusBadge} ${styles.pending}`}><FiClock /> {scan.status}</span>
            )}
          </div>
          <div className={styles.meta}>
            <span className={styles.metaItem}><FiTarget /> {scan.target.url}</span>
            <span className={styles.metaItem}><FiActivity /> Type: {scan.options?.scanner === 'port' ? 'Port Scanner' : scan.type}</span>
            {scan.source === 'scheduled' && (
              <span className={styles.metaItem}><FiClock /> Scheduled re-scan</span>
            )}
            <span className={styles.metaItem}><FiClock /> Duration: {durationStr}</span>
          </div>
        </div>

        {scan.status === 'completed' && (
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() =>
              exportScanPdf({
                scan,
                resolvedFindings: scan.resolvedFindings || [],
              })
            }
          >
            <FiDownload size={16} /> Export PDF
          </button>
        )}
      </div>

      {urlModelVerdict && (
        <div className={`card ${styles.modelVerdictCard}`}>
          <h3 className={styles.summaryTitle}>
            <FiShield /> URL Detection Model Verdict
          </h3>
          <p className={styles.summaryText}>
            Verdict for this target: {' '}
            <span
              className={
                urlModelVerdict === 'Malicious'
                  ? styles.modelVerdictBad
                  : styles.modelVerdictGood
              }
            >
              {urlModelVerdict}
            </span>
          </p>
        </div>
      )}

      {scan.options?.scanner !== 'port' && (
        <div className={styles.insights}>
          <div className="card">
            <h3 className={styles.cardTitle}>Top OWASP Categories</h3>
            <OWASPCategoryChart findings={scan.findings} />
          </div>
          
          <div className={`card ${styles.riskWrap}`}>
            <h3 className={styles.cardTitle} style={{ alignSelf: 'flex-start', width: '100%' }}>Overall Risk Score</h3>
            <RiskScoreGauge score={staticRiskScore} />
          </div>
        </div>
      )}

      {scan.options?.scanner === 'port' && scan.findings.length > 0 && (
        <div className={`card ${styles.summaryCard}`} style={{ borderColor: 'var(--primary-glow)' }}>
          <h3 className={styles.summaryTitle}>
            <FiShield color="var(--primary)" /> Network Security Summary
          </h3>
          <p className={styles.summaryText}>
            Infrastructure scan discovered <strong>{scan.findings.length}</strong> open or unusual ports. 
            Review the detailed findings below for service versions and potential entry points.
          </p>
        </div>
      )}



      {Array.isArray(scan.resolvedFindings) && scan.resolvedFindings.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h3 className={styles.findingsHeader}>Resolved since last scan ({scan.resolvedFindings.length})</h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: 12 }}>
            These issues appeared on the previous run but were not detected this time.
          </p>
          <div className={styles.findingsList}>
            {scan.resolvedFindings.map((f) => (
              <FindingCard key={`resolved-${f.findingId}`} finding={f} diffStatus="resolved" />
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className={styles.findingsHeader}>Detailed Findings ({scan.findings.length})</h3>
        {scan.findings.length === 0 ? (
          <div className={`card ${styles.emptyFindings}`}>
            <FiShield size={40} className={styles.okIcon} />
            <p style={{ margin: 0 }}>No vulnerabilities detected. All checks passed.</p>
          </div>
        ) : (
          <div className={styles.findingsList}>
            {scan.findings.map((f) => (
              <FindingCard key={f.findingId} finding={f} diffStatus={f.diffStatus} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
