import { useState, useEffect } from 'react';
import { FiAlertTriangle, FiShield, FiFilter, FiDownload } from 'react-icons/fi';
import api from '../services/api';

export default function GlobalFindings() {
  const [findings, setFindings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    document.title = 'Findings - Saferest AI';
    const fetchFindings = async () => {
      try {
        const { data } = await api.get('/scans/global-findings');
        if (data.success) {
          setFindings(data.findings);
        }
      } catch (err) {
        console.error('Failed to fetch findings', err);
      } finally {
        setLoading(false);
      }
    };
    fetchFindings();
  }, []);

  const filteredFindings = findings.filter(f => 
    filter === 'all' || f.severity.toLowerCase() === filter.toLowerCase()
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex-between">
        <div>
          <h2>Global Findings</h2>
          <p className="text-muted">Aggregated security vulnerabilities across all your targets.</p>
        </div>
        <div className="flex gap-12">
          <select 
            className="form-input" 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
            style={{ minWidth: '150px' }}
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
            <option value="info">Info</option>
          </select>
          <button className="btn btn-outline">
            <FiDownload /> Export CSV
          </button>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div className="flex-center" style={{ padding: '60px' }}>
            <div className="spinner" style={{ width: '40px', height: '40px', color: 'var(--primary)' }} />
          </div>
        ) : filteredFindings.length === 0 ? (
          <div className="flex-col flex-center" style={{ padding: '60px', color: 'var(--text-muted)' }}>
            <FiShield size={48} style={{ marginBottom: '16px', color: 'var(--success)' }} />
            <h3>No vulnerabilities found</h3>
            <p>Your attack surface looks secure.</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-soft)' }}>
                <th style={{ padding: '16px 12px', color: 'var(--text-muted)' }}>Target</th>
                <th style={{ padding: '16px 12px', color: 'var(--text-muted)' }}>Severity</th>
                <th style={{ padding: '16px 12px', color: 'var(--text-muted)' }}>Title</th>
                <th style={{ padding: '16px 12px', color: 'var(--text-muted)' }}>Category</th>
              </tr>
            </thead>
            <tbody>
              {filteredFindings.map((f, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--border-soft)' }}>
                  <td style={{ padding: '16px 12px' }}>
                    <div style={{ fontWeight: '500' }}>{f.target?.sanitizedUrl}</div>
                  </td>
                  <td style={{ padding: '16px 12px' }}>
                    <span className={`badge badge-${f.severity.toLowerCase()}`}>
                      {f.severity}
                    </span>
                  </td>
                  <td style={{ padding: '16px 12px', fontWeight: '500' }}>
                    {f.title}
                  </td>
                  <td style={{ padding: '16px 12px' }}>
                    {f.category}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
