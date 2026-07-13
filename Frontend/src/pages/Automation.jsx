import { useEffect, useState } from 'react';
import { TbSettingsAutomation } from 'react-icons/tb';
import { FiPlus, FiTrash2, FiToggleLeft, FiToggleRight, FiClock, FiActivity } from 'react-icons/fi';
import api from '../services/api';
import styles from './Automation.module.css';

const TOOL_OPTIONS = [
  { value: 'subfinder', label: 'Subdomain Finder' },
  { value: 'passive_scan', label: 'Passive Scan' },
  { value: 'port_scan', label: 'Port Scanner' },
  { value: 'email_scan', label: 'Email Security Scan' },
  { value: 'code_scan', label: 'Code Scan' },
];

const SCHEDULE_OPTIONS = [
  { value: 'minute', label: 'Every Minute' },
  { value: 'hourly', label: 'Hourly' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
];

export default function Automation() {
  const [automations, setAutomations] = useState([]);
  const [targets, setTargets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ target: '', customInput: '', tool: 'passive_scan', schedule: 'weekly' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadData = async () => {
    try {
      const [autoRes, targetRes] = await Promise.all([
        api.get('/automations'),
        api.get('/targets'),
      ]);
      setAutomations(autoRes.data.data || []);
      setTargets(targetRes.data.targets || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = 'Automation - Saferest AI';
    loadData();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.post('/automations', form);
      setShowModal(false);
      setForm({ target: '', customInput: '', tool: 'passive_scan', schedule: 'weekly' });
      loadData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create automation');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (id, currentStatus) => {
    try {
      await api.put(`/automations/${id}`, { isActive: !currentStatus });
      loadData();
    } catch (err) {
      console.error('Failed to toggle automation status');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this automation?')) return;
    try {
      await api.delete(`/automations/${id}`);
      loadData();
    } catch (err) {
      console.error('Failed to delete automation');
    }
  };

  const getToolLabel = (val) => TOOL_OPTIONS.find((t) => t.value === val)?.label || val;

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Automation Workflows</h1>
          <p style={{ color: '#a1a1aa', marginTop: '0.5rem' }}>
            Schedule periodic security scans and routines.
          </p>
        </div>
        <button className={styles.btn} onClick={() => setShowModal(true)}>
          <FiPlus /> New Automation
        </button>
      </div>

      {loading ? (
        <div style={{ color: '#a1a1aa' }}>Loading automations...</div>
      ) : automations.length === 0 ? (
        <div className={styles.emptyState}>
          <TbSettingsAutomation size={48} style={{ color: 'var(--border-soft)', marginBottom: '1rem' }} />
          <h3>No Automations Yet</h3>
          <p>Create your first workflow to automate your security scans.</p>
        </div>
      ) : (
        <div className={styles.list}>
          {automations.map((auto) => (
            <div key={auto._id} className={styles.card}>
              <div className={styles.cardHeader}>
                <div>
                  <h3 className={styles.cardTool}>{getToolLabel(auto.tool)}</h3>
                  <p className={styles.cardTarget}>
                    {auto.target ? auto.target.sanitizedUrl : auto.customInput}
                  </p>
                </div>
                <button
                  className={`${styles.toggleBtn} ${auto.isActive ? styles.active : ''}`}
                  onClick={() => toggleActive(auto._id, auto.isActive)}
                  title={auto.isActive ? 'Active' : 'Paused'}
                >
                  {auto.isActive ? <FiToggleRight size={24} /> : <FiToggleLeft size={24} />}
                </button>
              </div>

              <div className={styles.cardBody}>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}><FiClock /> Schedule</span>
                  <span className={styles.infoValue} style={{ textTransform: 'capitalize' }}>
                    {auto.schedule}
                  </span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}><FiActivity /> Next Run</span>
                  <span className={styles.infoValue}>
                    {auto.nextRunAt ? new Date(auto.nextRunAt).toLocaleString() : 'N/A'}
                  </span>
                </div>
              </div>

              <div className={styles.cardFooter}>
                <span style={{ fontSize: '0.8rem', color: '#71717a' }}>
                  {auto.isActive ? 'Running smoothly' : 'Currently paused'}
                </span>
                <button className={styles.deleteBtn} onClick={() => handleDelete(auto._id)}>
                  <FiTrash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2>Create Workflow</h2>
            <form onSubmit={handleAdd}>
              <div className={styles.formGroup}>
                <label>Target</label>
                <select
                  className={styles.input}
                  value={form.target}
                  onChange={(e) => setForm({ ...form, target: e.target.value })}
                >
                  <option value="">-- Select a target (or use custom input below) --</option>
                  {targets.map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.sanitizedUrl} {t.label ? `(${t.label})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>Custom Input (If no target selected above)</label>
                <input
                  className={styles.input}
                  type="text"
                  placeholder="e.g. https://github.com/user/repo for Code Scan"
                  value={form.customInput}
                  onChange={(e) => setForm({ ...form, customInput: e.target.value })}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Tool to Run</label>
                <select
                  className={styles.input}
                  value={form.tool}
                  onChange={(e) => setForm({ ...form, tool: e.target.value })}
                  required
                >
                  {TOOL_OPTIONS.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>Frequency</label>
                <select
                  className={styles.input}
                  value={form.schedule}
                  onChange={(e) => setForm({ ...form, schedule: e.target.value })}
                  required
                >
                  {SCHEDULE_OPTIONS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              {error && <p style={{ color: '#ef4444', marginBottom: '1rem' }}>{error}</p>}

              <div className={styles.modalActions}>
                <button type="button" className={styles.cancelBtn} onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className={styles.btn} disabled={saving}>
                  {saving ? 'Creating...' : 'Create Workflow'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
