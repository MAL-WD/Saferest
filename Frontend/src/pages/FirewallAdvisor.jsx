import { useState, useEffect } from 'react';
import { FiShield } from 'react-icons/fi';
import api from '../services/api';
import styles from './WebsiteScan.module.css';

export default function FirewallAdvisor() {
  const [summary, setSummary] = useState('');
  const [stack, setStack] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    document.title = 'Firewall Advisor - Saferest AI';
  }, []);

  const run = async (e) => {
    e.preventDefault();
    setErr('');
    setLoading(true);
    setData(null);
    try {
      const r = await api.post('/firewall/advise', { findingsSummary: summary, stackHint: stack || undefined });
      setData(r.data);
    } catch (ex) {
      setErr(ex.response?.data?.message || ex.message);
    } finally {
      setLoading(false);
    }
  };

  const tabs = data
    ? [
        ['iptables', data.iptables],
        ['nftables', data.nftables],
        ['nginx', data.nginx],
        ['Cloudflare', data.cloudflareWAF],
      ].filter(([, v]) => Array.isArray(v) && v.length)
    : [];

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h2><FiShield style={{ verticalAlign: 'middle', marginRight: 8 }} />Firewall advisor</h2>
        <p>Paste a summary of findings; get suggested rules. {data?.disclaimer}</p>
      </div>
      <form onSubmit={run} className={`card ${styles.formCard}`}>
        <div className="form-group">
          <label className="form-label">Findings summary</label>
          <textarea className="form-input" rows={8} value={summary} onChange={(e) => setSummary(e.target.value)} required placeholder="e.g. XSS on /search, open admin /admin, weak TLS..." />
        </div>
        <div className="form-group">
          <label className="form-label">Stack (optional)</label>
          <input className="form-input" value={stack} onChange={(e) => setStack(e.target.value)} placeholder="nginx on Ubuntu, Cloudflare proxy…" />
        </div>
        {err && <p className="form-error">{err}</p>}
        <button className="btn btn-primary" disabled={loading}>{loading ? 'Generating…' : 'Generate rules'}</button>
      </form>
      {tabs.length > 0 && (
        <div className="card" style={{ marginTop: 24 }}>
          {tabs.map(([name, lines]) => (
            <div key={name} style={{ marginBottom: 20 }}>
              <h4>{name}</h4>
              <pre style={{ fontSize: '0.8rem', overflow: 'auto', padding: 12, background: 'var(--surface-2)', borderRadius: 8 }}>
                {lines.join('\n')}
              </pre>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => navigator.clipboard.writeText(lines.join('\n'))}>Copy</button>
            </div>
          ))}
          {data.notes && <p>{data.notes}</p>}
          <p style={{ fontSize: '0.85rem', opacity: 0.85 }}><strong>{data.disclaimer}</strong></p>
        </div>
      )}
    </div>
  );
}
