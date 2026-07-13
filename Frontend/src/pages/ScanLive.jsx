import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FiShield, FiActivity, FiExternalLink } from 'react-icons/fi';
import { connectSocket, joinScanRoom } from '../services/socket';
import ScanProgressBar from '../components/ui/ScanProgressBar';
import SeverityBadge from '../components/ui/SeverityBadge';
import api from '../services/api';
import styles from './ScanLive.module.css';

export default function ScanLive() {
  const { id } = useParams();
  const [scan, setScan]         = useState(null);
  const [percent, setPercent]   = useState(0);
  const [scanner, setScanner]   = useState('');
  const [findings, setFindings] = useState([]);
  const [done, setDone]         = useState(false);
  const [failed, setFailed]     = useState(false);

  useEffect(() => {
    document.title = 'Live Scan - Saferest AI';
    // Load initial scan data
    api.get(`/scans/${id}`).then(r => {
      setScan(r.data.scan);
      setPercent(r.data.scan.progress || 0);
      setFindings(r.data.scan.findings || []);
      if (r.data.scan.status === 'completed') setDone(true);
      if (r.data.scan.status === 'failed')    setFailed(true);
    });

    // Connect and listen to real-time events
    const socket = connectSocket();
    joinScanRoom(id);

    socket.on('scan:started',  (d) => { setPercent(0); setScanner('Starting...'); });
    socket.on('scan:progress', (d) => { setPercent(d.percent); setScanner(d.scanner); });
    socket.on('scan:finding',  (d) => setFindings(prev => [d.finding, ...prev]));
    socket.on('scan:completed',(d) => { setPercent(100); setDone(true); });
    socket.on('scan:failed',   ()  => setFailed(true));

    return () => {
      socket.off('scan:started');
      socket.off('scan:progress');
      socket.off('scan:finding');
      socket.off('scan:completed');
      socket.off('scan:failed');
    };
  }, [id]);

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <div className={styles.breadcrumb}>
            <Link to="/scans">Scans</Link> / Live Feed
          </div>
          <h2>
            <FiActivity size={20} style={{ color: 'var(--primary)' }} />
            {scan?.target?.sanitizedUrl || 'Scanning...'}
          </h2>
        </div>
        {done && (
          <Link to={`/scans/${id}`} className="btn btn-primary">
            <FiShield size={16} /> View Full Report
          </Link>
        )}
      </div>

      {/* Progress */}
      <div className={`card ${styles.progressCard}`}>
        <div className={styles.statusRow}>
          <div className={`${styles.statusIndicator} ${done ? styles.done : failed ? styles.fail : styles.running}`}>
            {done ? 'Scan Complete' : failed ? 'Scan Failed' : 'Scanning in progress...'}
          </div>
          <span className={styles.findingCount}>{findings.length} findings so far</span>
        </div>
        <ScanProgressBar percent={percent} scanner={scanner} />
      </div>

      {/* Findings stream */}
      <div className={styles.findingsHeader}>
        <h3>Findings ({findings.length})</h3>
        {!done && !failed && (
          <span className={styles.live}>
            <span className={styles.liveDot} /> Live
          </span>
        )}
      </div>

      <div className={styles.findingsList}>
        {findings.length === 0 && !done ? (
          <div className={`card ${styles.waiting}`}>
            <div className="spinner" />
            <span>Waiting for findings...</span>
          </div>
        ) : findings.map((f, i) => (
          <div key={f.findingId || i} className={`card ${styles.findingCard} animate-fade-up`}>
            <div className={styles.findingMeta}>
              <SeverityBadge severity={f.severity} />
              <span className={styles.findingScanner}>{f.scanner}</span>
            </div>
            <h4 className={styles.findingTitle}>{f.title}</h4>
            <p className={styles.findingDesc}>{f.description}</p>
            {f.owaspCategory && (
              <div className={styles.owasp}>{f.owaspCategory}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
