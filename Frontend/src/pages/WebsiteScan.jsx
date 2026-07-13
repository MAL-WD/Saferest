import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiZap } from 'react-icons/fi';
import { WebsiteScannerIcon } from '../components/ui/Icons';
import api from '../services/api';
import styles from './WebsiteScan.module.css';

export default function WebsiteScan() {
  const [targets, setTargets] = useState([]);
  const [form, setForm]       = useState({ targetId: '', type: 'passive' });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Website Scanner - Saferest AI';
    api.get('/targets').then(r => setTargets(r.data.targets || []));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const res = await api.post('/scans', form);
      navigate(`/scans/${res.data.scanId}/live`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to start scan.');
    } finally { setLoading(false); }
  };

  return (
    <div className={styles.container}>
      <div className={styles.heroLayout}>
        <div className={styles.infoSide}>
          <div className={styles.toolIcon}>
            <WebsiteScannerIcon size={50} />
          </div>
          <h1 className={styles.title}>Website Scanner</h1>
          <p className={styles.description}>
            Choose a target and scan type. Results stream back in real-time.
          </p>
        </div>
        
        <div className={styles.formSide}>
          <div className={styles.formCard}>
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className="form-group">
                <label className={styles.label} htmlFor="ns-target">Select Target *</label>
                {targets.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    No targets found. <a href="/targets" style={{ color: 'var(--primary)' }}>Add a target first.</a>
                  </p>
                ) : (
                  <select id="ns-target" className="form-input" value={form.targetId}
                    onChange={e => setForm(f => ({ ...f, targetId: e.target.value }))} required
                    style={{ cursor: 'pointer' }}>
                    <option value="">-- Choose a target --</option>
                    {targets.map(t => (
                      <option key={t._id} value={t._id}>{t.sanitizedUrl || t.url}</option>
                    ))}
                  </select>
                )}
              </div>
              <div className="form-group">
                <label className={styles.label}>Scan Type</label>
                <div className={styles.typeGrid}>
                  {[{ v: 'passive', lbl: 'Passive', sub: 'Headers, DNS, SSL, CVEs. Safe, non-intrusive.' },
                    { v: 'active',  lbl: 'Active',  sub: 'Full XSS, SQLi, redirect, traversal testing.' }].map(({ v, lbl, sub }) => (
                    <label
                      key={v}
                      className={`${styles.typeCard} ${form.type === v ? styles.selected : ''}`}
                      htmlFor={`type-${v}`}
                    >
                      <input type="radio" id={`type-${v}`} name="type" value={v}
                        checked={form.type === v} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} />
                      <span className={styles.typeLbl}>{lbl}</span>
                      <span className={styles.typeSub}>{sub}</span>
                    </label>
                  ))}
                </div>
              </div>
              {error && <p className="form-error">{error}</p>}
              <button className={styles.scanBtn} type="submit" disabled={loading || !form.targetId}>
                {loading ? <><span className="spinner" /> Starting...</> : <><FiZap /> Launch Scan</>}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
