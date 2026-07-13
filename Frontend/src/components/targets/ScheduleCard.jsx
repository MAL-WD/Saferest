import { useState } from 'react';
import api from '../../services/api';

export default function ScheduleCard({ target, onSaved }) {
  const s = target.schedule || {};
  const [enabled, setEnabled] = useState(!!s.enabled);
  const [frequency, setFrequency] = useState(s.frequency || 'weekly');
  const [customIntervalMinutes, setCustomIntervalMinutes] = useState(s.customIntervalMinutes || 1440);
  const [emailAlerts, setEmailAlerts] = useState(!!s.emailAlerts);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const save = async () => {
    setSaving(true);
    setMsg('');
    try {
      await api.patch(`/targets/${target._id}/schedule`, {
        schedule: { enabled, frequency, emailAlerts, customIntervalMinutes },
      });
      onSaved?.();
      setMsg('Saved.');
    } catch (e) {
      setMsg(e.response?.data?.message || e.message || 'Failed');
    } finally {
      setSaving(false);
    }
  };

  const next = s.nextScanAt ? new Date(s.nextScanAt) : null;

  return (
    <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border-soft)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        {enabled && <span className="badge badge-low" title="Monitoring">●</span>}
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
          <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
          <span style={{ fontSize: '0.85rem' }}>Scheduled re-scan</span>
        </label>
        <select
          className="form-input"
          style={{ maxWidth: 120, padding: '4px 8px', fontSize: '0.85rem' }}
          value={frequency}
          onChange={(e) => setFrequency(e.target.value)}
        >
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
          <option value="custom">Custom</option>
        </select>
        {frequency === 'custom' && (
          <input
            type="number"
            className="form-input"
            style={{ width: 90, padding: '4px 8px', fontSize: '0.85rem' }}
            min={60}
            max={43200}
            value={customIntervalMinutes}
            onChange={(e) => setCustomIntervalMinutes(Number(e.target.value))}
            title="Minutes between scans"
          />
        )}
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
          <input type="checkbox" checked={emailAlerts} onChange={(e) => setEmailAlerts(e.target.checked)} />
          <span style={{ fontSize: '0.85rem' }}>Email alerts</span>
        </label>
        <button type="button" className="btn btn-primary btn-sm" disabled={saving} onClick={save}>
          {saving ? '…' : 'Apply'}
        </button>
      </div>
      {next && enabled && (
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '6px 0 0' }}>
          Next scan: {next.toLocaleString()}
        </p>
      )}
      {msg && <p style={{ fontSize: '0.8rem', marginTop: 6 }}>{msg}</p>}
    </div>
  );
}
