import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiShield, FiArrowRight, FiPlusCircle } from 'react-icons/fi';
import api from '../services/api';
import styles from './ScansIndex.module.css';

const STATUS_BADGE = {
  queued:    { label: 'Queued',    color: 'var(--info)'    },
  running:   { label: 'Running',   color: 'var(--primary)' },
  completed: { label: 'Completed', color: 'var(--success)' },
  failed:    { label: 'Failed',    color: 'var(--danger)'  },
};

const SEVERITY_COLORS = {
  CRITICAL: 'var(--danger)',
  HIGH: 'var(--warning)',
};

export default function ScansIndex() {
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = 'Scans - Saferest AI';
    api.get('/scans')
      .then(res => setScans(res.data.scans || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h2>All Scans</h2>
          <p className={styles.subtitle}>History of all vulnerability scans across your targets.</p>
        </div>
        <Link to="/scans/new" className="btn btn-primary">
          <FiPlusCircle size={16} /> New Scan
        </Link>
      </div>

      {loading ? (
        <div className="skeleton" style={{ height: 400, borderRadius: 16 }} />
      ) : scans.length === 0 ? (
        <div className={`card ${styles.empty}`}>
          <FiShield size={48} className={styles.emptyIcon} />
          <h3>No scans found</h3>
          <p style={{ marginBottom: 24 }}>You haven't run any security scans yet.</p>
          <Link to="/scans/new" className="btn btn-primary">Start your first scan</Link>
        </div>
      ) : (
        <div className={`card ${styles.tableCard}`}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Target</th>
                <th>Type</th>
                <th>Status</th>
                <th>Findings</th>
                <th>Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {scans.map(scan => {
                const sb = STATUS_BADGE[scan.status] || STATUS_BADGE.queued;
                return (
                  <tr key={scan._id}>
                    <td>
                      <span className={styles.target}>
                        <span className={styles.targetDot} />
                        {scan.target?.sanitizedUrl || scan.target?.url || '—'}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-info" style={{ textTransform: 'capitalize' }}>
                        {scan.type}
                      </span>
                    </td>
                    <td>
                      <span className={styles.status} style={{ color: sb.color }}>
                        <span className={styles.statusDot} style={{ background: sb.color }} />
                        {sb.label}
                      </span>
                    </td>
                    <td className={styles.findings}>
                      {scan.summary?.critical > 0 && <span style={{ color: SEVERITY_COLORS.CRITICAL, marginRight: 8 }}>{scan.summary.critical} Crit</span>}
                      {scan.summary?.high > 0 && <span style={{ color: SEVERITY_COLORS.HIGH, marginRight: 8 }}>{scan.summary.high} High</span>}
                      {!scan.summary?.critical && !scan.summary?.high && <span style={{ color: 'var(--text-muted)' }}>{scan.summary?.total || 0} Total</span>}
                    </td>
                    <td className={styles.date}>
                      {new Date(scan.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <Link to={scan.status === 'running' ? `/scans/${scan._id}/live` : `/scans/${scan._id}`} className="btn btn-ghost btn-sm">
                        View <FiArrowRight size={14} />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
