import { useEffect, useState } from 'react';
import { FiPlus, FiTrash2, FiExternalLink, FiTarget, FiCheck, FiX } from 'react-icons/fi';
import api from '../services/api';
import useAuthStore from '../store/authStore';
import ScheduleCard from '../components/targets/ScheduleCard';
import styles from './Targets.module.css';

export default function Targets() {
  const { user } = useAuthStore();
  const [targets, setTargets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ url: '', label: '', confirmedOwnership: false });
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const loadTargets = () => {
    api.get('/targets').then(r => setTargets(r.data.targets || [])).finally(() => setLoading(false));
  };

  useEffect(() => {
    document.title = 'Assets - Saferest AI';
    loadTargets();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.confirmedOwnership) { setFormError('You must confirm ownership of this target.'); return; }
    setSaving(true); setFormError('');
    try {
      await api.post('/targets', form);
      setShowModal(false);
      setForm({ url: '', label: '', confirmedOwnership: false });
      loadTargets();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to add target.');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this target?')) return;
    await api.delete(`/targets/${id}`);
    loadTargets();
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h2>Assets</h2>
          <p>Websites you've registered for security scanning.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <FiPlus size={16} /> Add Target
        </button>
      </div>

      {loading ? (
        <div className="skeleton" style={{ height: 200, borderRadius: 16 }} />
      ) : targets.length === 0 ? (
        <div className={`card ${styles.empty}`}>
          <FiTarget size={40} style={{ color: 'var(--border-soft)' }} />
          <h3>No targets yet</h3>
          <p>Add your first domain to start scanning.</p>
          <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>
            <FiPlus size={14} /> Add Target
          </button>
        </div>
      ) : (
        <div className={styles.grid}>
          {targets.map(t => (
            <div key={t._id} className={`card ${styles.targetCard}`}>
              <div className={styles.targetTop}>
                <div className={styles.targetIcon}><FiTarget size={18} /></div>
                <div className={styles.targetInfo}>
                  <div className={styles.targetUrl}>{t.sanitizedUrl || t.url}</div>
                  {t.label && <div className={styles.targetLabel}>{t.label}</div>}
                </div>
              </div>
              <div className={styles.targetMeta}>
                <span className={`badge ${t.confirmedOwnership ? 'badge-low' : 'badge-medium'}`}>
                  {t.confirmedOwnership ? <><FiCheck size={11} /> Verified</> : 'Pending'}
                </span>
                <span className={styles.date}>{new Date(t.createdAt).toLocaleDateString()}</span>
              </div>
              <div className={styles.targetActions}>
                <a href={t.sanitizedUrl || t.url} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm">
                  <FiExternalLink size={13} /> Visit
                </a>
                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(t._id)}>
                  <FiTrash2 size={13} />
                </button>
              </div>
              {user?.planTier === 'pro' ? (
                <ScheduleCard target={t} onSaved={loadTargets} />
              ) : (
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 10 }}>
                  Pro plan unlocks scheduled re-scans and email alerts.
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className={styles.overlay} onClick={() => setShowModal(false)}>
          <div className={`card ${styles.modal}`} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Add New Target</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}><FiX /></button>
            </div>
            <form onSubmit={handleAdd} className={styles.form}>
              <div className="form-group">
                <label className="form-label" htmlFor="tgt-url">Website URL *</label>
                <input id="tgt-url" className="form-input" type="url" placeholder="https://example.com"
                  value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="tgt-label">Label (optional)</label>
                <input id="tgt-label" className="form-input" type="text" placeholder="My Production App"
                  value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} />
              </div>
              <label className={styles.checkboxLabel}>
                <input type="checkbox" checked={form.confirmedOwnership}
                  onChange={e => setForm(f => ({ ...f, confirmedOwnership: e.target.checked }))} />
                <span>I confirm I own or have authorization to scan this domain.</span>
              </label>
              {formError && <p className="form-error">{formError}</p>}
              <div className={styles.modalFooter}>
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <><span className="spinner" /> Adding...</> : 'Add Target'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
