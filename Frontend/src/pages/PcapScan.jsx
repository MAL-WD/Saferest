import { useEffect, useMemo, useState } from 'react';
import { FiUploadCloud, FiActivity, FiShield, FiAlertTriangle, FiCheckCircle, FiDownload } from 'react-icons/fi';
import api from '../services/api';
import { connectSocket, joinPcapRoom } from '../services/socket';
import { exportPcapPdf } from '../utils/exportPcapPdf';
import { NetworkScannerIcon } from '../components/ui/Icons';
import styles from './PcapScan.module.css';

export default function PcapScan() {
  const [file, setFile] = useState(null);
  const [scanId, setScanId] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState('Idle');
  const [error, setError] = useState('');
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    document.title = 'PCAP Scanner - Saferest AI';
  }, []);

  useEffect(() => {
    if (!scanId) return undefined;

    const socket = connectSocket();
    joinPcapRoom(scanId);

    const onStarted = () => setStatusText('Scan started');
    const onProgress = (payload) => {
      const stage = payload?.stage || 'processing';
      const percent = payload?.percent ? ` (${payload.percent}%)` : '';
      setStatusText(`Processing: ${stage}${percent}`);
    };
    const onCompleted = () => setStatusText('Completed');
    const onFailed = (payload) => {
      setStatusText('Failed');
      setError(payload?.message || 'PCAP scan failed.');
    };

    socket.on('pcap_scan:started', onStarted);
    socket.on('pcap_scan:progress', onProgress);
    socket.on('pcap_scan:completed', onCompleted);
    socket.on('pcap_scan:failed', onFailed);

    return () => {
      socket.off('pcap_scan:started', onStarted);
      socket.off('pcap_scan:progress', onProgress);
      socket.off('pcap_scan:completed', onCompleted);
      socket.off('pcap_scan:failed', onFailed);
    };
  }, [scanId]);

  const submitDisabled = useMemo(() => loading || !file, [loading, file]);
  const statusLower = (summary?.status || '').toLowerCase();
  const isCritical = statusLower.includes('critical');
  const isHigh = statusLower.includes('high');
  const riskTone = isCritical ? 'critical' : isHigh ? 'high' : 'normal';

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!file) return;

    setLoading(true);
    setError('');
    setSummary(null);
    setStatusText('Uploading');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.postMultipart('/pcap-scan/upload', formData);
      const payload = response.data || {};
      setScanId(payload.scanId || '');
      setSummary(payload.summary || null);
      setStatusText('Completed');
    } catch (err) {
      setStatusText('Failed');
      setError(err.response?.data?.message || 'Unable to scan PCAP file.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.heroLayout}>
        {/* Left Side: Info */}
        <div className={styles.infoSide}>
          <div className={styles.toolIcon}>
            <NetworkScannerIcon size={50} />
          </div>
          <h1 className={styles.title}>Network Scanner</h1>
          <p className={styles.description}>
            Upload a network capture file and analyze attack signals using your AI engine.
            Detects anomalies, attack patterns, and suspicious traffic across your packet data.
          </p>
          <div className={styles.badgeRow}>
            <span>Network Scanner is available with any of our pricing plans.</span>
          </div>
          <button className="btn btn-outline" style={{ marginTop: '20px' }}>
            Scan with a Free account
          </button>
        </div>

        {/* Right Side: Form */}
        <div className={styles.formSide}>
          <div className={styles.formCard}>
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className="form-group">
                <label className={styles.label} htmlFor="pcap-file">PCAP File (.pcap / .pcapng)</label>
                <input
                  id="pcap-file"
                  type="file"
                  className="form-input"
                  accept=".pcap,.pcapng,application/vnd.tcpdump.pcap"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
              </div>

              {file && <div className={styles.meta}>Selected: {file.name}</div>}
              {scanId && <div className={styles.meta}>Scan ID: {scanId}</div>}
              {error && <div className={styles.error}>{error}</div>}

              <div className={styles.statusRow}>
                <FiActivity />
                <span>{statusText}</span>
              </div>

              <button
                type="submit"
                className={styles.scanBtn}
                disabled={submitDisabled}
              >
                {loading ? (
                  <>
                    <span className="spinner" />
                    Scanning...
                  </>
                ) : (
                  <>
                    <FiUploadCloud size={18} />
                    Scan File
                  </>
                )}
              </button>
            </form>

            {loading && (
              <div className={styles.radarContainer}>
                <div className={styles.radarWrapper}>
                  <div className={styles.radarSweep} />
                  <div className={`${styles.radarRing} ${styles.radarRing1}`} />
                  <div className={`${styles.radarRing} ${styles.radarRing2}`} />
                  <div className={`${styles.radarRing} ${styles.radarRing3}`} />
                  <div className={styles.radarCenter}>
                    <FiActivity size={12} color="#000" />
                  </div>
                </div>
                <div className={styles.scanningHeader}>
                  <span className={styles.scanningPulse} />
                  <span>Analyzing Network Traffic...</span>
                </div>
              </div>
            )}
          </div>

          <div className={styles.formFooter}>
            <p>
              Map network-layer attack indicators, detect port scans, brute-force attempts,
              and command-and-control traffic directly from your packet capture files.
            </p>
          </div>
        </div>
      </div>

      {/* Results */}
      {summary && (
        <div className={`${styles.card} ${styles.summaryCard}`}>
          <div className={styles.summaryHead}>
            <h3>Scan Summary</h3>
            <span className={`${styles.riskBadge} ${styles[riskTone]}`}>
              {isCritical ? <FiAlertTriangle /> : <FiCheckCircle />}
              {summary.status}
            </span>
          </div>
          <div className={styles.summaryGrid}>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Status</span>
              <span className={styles.summaryValue}>{summary.status}</span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Attack Type</span>
              <span className={styles.summaryValue}>{summary.attackType}</span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Confidence</span>
              <span className={styles.summaryValue}>{summary.confidence}</span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Packets</span>
              <span className={styles.summaryValue}>{summary.packets}</span>
            </div>
          </div>

          <div className={styles.recommendation}>
            <strong>Recommendation:</strong> {summary.recommendation}
          </div>

          <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
            <button
              className="btn btn-primary"
              onClick={() => exportPcapPdf(file?.name, summary)}
            >
              <FiDownload style={{ marginRight: 6 }} /> Export PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
