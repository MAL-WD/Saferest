import { useRef, useState, useEffect } from 'react';
import { FiUploadCloud } from 'react-icons/fi';
import api from '../services/api';
import styles from './WebsiteScan.module.css';

export default function TrafficAnalysis() {
  const ref = useRef(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [row, setRow] = useState(null);

  useEffect(() => {
    document.title = 'Traffic Analysis - Saferest AI';
  }, []);

  const upload = async () => {
    if (!ref.current?.files?.[0]) return;
    setErr('');
    setLoading(true);
    setRow(null);
    const fd = new FormData();
    fd.append('file', ref.current.files[0]);
    try {
      const r = await api.postMultipart('/traffic/upload', fd);
      setRow(r.data.analysis);
    } catch (ex) {
      setErr(ex.response?.data?.message || ex.message);
    } finally {
      setLoading(false);
    }
  };

  const rep = row?.aiReport;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h2><FiUploadCloud style={{ verticalAlign: 'middle', marginRight: 8 }} />Traffic & log analysis</h2>
        <p>Upload server logs (.log, .txt, .gz) for AI-assisted attack pattern review. PCAP filenames accepted for labeling (analysis uses sample text).</p>
      </div>
      <div className={`card ${styles.formCard}`}>
        <input ref={ref} type="file" accept=".log,.txt,.gz,.pcap,.pcapng" />
        {err && <p className="form-error">{err}</p>}
        <button type="button" className="btn btn-primary" style={{ marginTop: 12 }} disabled={loading} onClick={upload}>
          {loading ? 'Working…' : 'Upload'}
        </button>
      </div>
      {row && (
        <div className="card" style={{ marginTop: 24 }}>
          <p>Status: <strong>{row.status}</strong> · Type: {row.fileType} / {row.logFormat}</p>
          {rep?.summary && <p>{rep.summary}</p>}
          {rep?.patterns && <pre style={{ fontSize: '0.85rem', overflow: 'auto' }}>{JSON.stringify(rep.patterns, null, 2)}</pre>}
          {rep?.recommendations && (
            <ul>{rep.recommendations.map((x, i) => <li key={i}>{typeof x === 'string' ? x : JSON.stringify(x)}</li>)}</ul>
          )}
        </div>
      )}
    </div>
  );
}
