import React, { useState } from 'react';

const SEVERITY_META = {
  critical: { label: 'Critical', chip: 'badge-critical', tint: 'rgba(239, 68, 68, 0.10)', bar: 'rgba(239, 68, 68, 0.45)' },
  high: { label: 'High', chip: 'badge-high', tint: 'rgba(255, 184, 48, 0.10)', bar: 'rgba(255, 184, 48, 0.45)' },
  medium: { label: 'Medium', chip: 'badge-medium', tint: 'rgba(234, 179, 8, 0.10)', bar: 'rgba(234, 179, 8, 0.45)' },
  low: { label: 'Low', chip: 'badge-low', tint: 'rgba(34, 211, 238, 0.10)', bar: 'rgba(34, 211, 238, 0.45)' },
  info: { label: 'Info', chip: 'badge-info', tint: 'rgba(96, 165, 250, 0.10)', bar: 'rgba(96, 165, 250, 0.45)' },
};

const FindingsSidebar = ({ findings, selectedFinding, onSelectFinding }) => {
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('severity');

  let filtered = findings;
  if (filter !== 'all') {
    filtered = findings.filter((f) => f.severity === filter);
  }

  if (sortBy === 'severity') {
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
    filtered = [...filtered].sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
  } else if (sortBy === 'line') {
    filtered = [...filtered].sort((a, b) => a.line - b.line);
  } else if (sortBy === 'category') {
    filtered = [...filtered].sort((a, b) => a.category.localeCompare(b.category));
  }

  const counts = {
    critical: findings.filter((f) => f.severity === 'critical').length,
    high: findings.filter((f) => f.severity === 'high').length,
    medium: findings.filter((f) => f.severity === 'medium').length,
    low: findings.filter((f) => f.severity === 'low').length,
    info: findings.filter((f) => f.severity === 'info').length,
  };

  return (
    <div className="card card-glass" style={{ padding: 0, overflow: 'hidden', height: '100%' }}>
      <div style={{ padding: 18, borderBottom: '1px solid var(--border-soft)' }}>
        <div className="flex-between" style={{ gap: 12 }}>
          <div>
            <div className="text-muted" style={{ fontSize: 12, fontWeight: 800, letterSpacing: 0.08, textTransform: 'uppercase' }}>
              Findings
            </div>
            <div style={{ fontSize: 18, fontWeight: 900, marginTop: 2 }}>
              {filtered.length}{' '}
              <span className="text-muted" style={{ fontWeight: 700, fontSize: 14 }}>
                total
              </span>
            </div>
          </div>
          <div className="badge badge-info" style={{ opacity: 0.95 }}>
            {sortBy === 'severity' ? 'Sorted: Severity' : sortBy === 'line' ? 'Sorted: Line' : 'Sorted: Category'}
          </div>
        </div>
      </div>

      <div style={{ padding: 18, borderBottom: '1px solid var(--border-soft)' }}>
        <div style={{ display: 'grid', gap: 12 }}>
          <div>
            <div className="form-label" style={{ marginBottom: 8 }}>Filter</div>
            <div className="flex" style={{ gap: 8, flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setFilter('all')}
                style={{
                  padding: '8px 12px',
                  color: filter === 'all' ? 'var(--text)' : 'var(--text-muted)',
                  border: filter === 'all' ? '1px solid rgba(172,236,0,0.30)' : '1px solid var(--border-soft)',
                  background: filter === 'all' ? 'rgba(172,236,0,0.10)' : 'transparent',
                }}
              >
                All <span style={{ fontFamily: 'var(--font-mono)', opacity: 0.9 }}>({findings.length})</span>
              </button>
              {['critical', 'high', 'medium', 'low', 'info'].map((severity) => (
                <button
                  key={severity}
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => setFilter(severity)}
                  style={{
                    padding: '8px 12px',
                    color: filter === severity ? 'var(--text)' : 'var(--text-muted)',
                    border: filter === severity ? `1px solid ${SEVERITY_META[severity].bar}` : '1px solid var(--border-soft)',
                    background: filter === severity ? SEVERITY_META[severity].tint : 'transparent',
                  }}
                >
                  {SEVERITY_META[severity].label}{' '}
                  <span style={{ fontFamily: 'var(--font-mono)', opacity: 0.9 }}>({counts[severity]})</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="form-label" style={{ marginBottom: 8 }}>Sort</div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="form-input"
              style={{ width: '100%', padding: '10px 12px' }}
            >
              <option value="severity">Severity</option>
              <option value="line">Line number</option>
              <option value="category">Category</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div style={{ padding: 22 }}>
            <div className="card" style={{ padding: 16, textAlign: 'center' }}>
              <div className="text-muted" style={{ fontWeight: 800, fontSize: 12, letterSpacing: 0.08, textTransform: 'uppercase' }}>
                No results
              </div>
              <p style={{ marginTop: 8, marginBottom: 0 }}>No findings match this filter.</p>
            </div>
          </div>
        ) : (
          filtered.map((finding) => (
            <div
              key={finding.findingId}
              className="cursor-pointer"
              onClick={() => onSelectFinding(finding)}
              style={{
                padding: '14px 16px',
                borderBottom: '1px solid var(--border-soft)',
                background:
                  selectedFinding?.findingId === finding.findingId
                    ? 'rgba(172, 236, 0, 0.08)'
                    : 'transparent',
              }}
              onMouseEnter={(e) => {
                if (selectedFinding?.findingId === finding.findingId) return;
                e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
              }}
              onMouseLeave={(e) => {
                if (selectedFinding?.findingId === finding.findingId) return;
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <div className="flex-between" style={{ gap: 12, alignItems: 'flex-start' }}>
                <div style={{ minWidth: 0 }}>
                  <div className="flex" style={{ gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                    <span className={`badge ${SEVERITY_META[finding.severity]?.chip || 'badge-info'}`}>{SEVERITY_META[finding.severity]?.label || finding.severity}</span>
                    {finding.owaspCategory && (
                      <span className="badge badge-info" style={{ opacity: 0.85 }}>
                        {finding.owaspCategory}
                      </span>
                    )}
                    <span className="text-muted" style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                      L{finding.line}
                    </span>
                  </div>
                  <div style={{ marginTop: 8, fontWeight: 900, fontSize: 14, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {finding.title}
                  </div>
                  <div className="text-muted" style={{ marginTop: 4, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {finding.category}
                  </div>
                </div>
                <div
                  style={{
                    width: 4,
                    borderRadius: 999,
                    background: SEVERITY_META[finding.severity]?.bar || 'rgba(255,255,255,0.15)',
                    height: 52,
                    flexShrink: 0,
                    opacity: 0.9,
                  }}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default FindingsSidebar;
