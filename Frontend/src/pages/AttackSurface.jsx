import { useState, useEffect } from 'react';
import { FiGlobe, FiServer, FiRadio, FiActivity } from 'react-icons/fi';
import api from '../services/api';

export default function AttackSurface() {
  const [attackSurface, setAttackSurface] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = 'Attack Surface - Saferest AI';
    const fetchAttackSurface = async () => {
      try {
        const { data } = await api.get('/scans/attack-surface');
        if (data.success) {
          setAttackSurface(data.attackSurface);
        }
      } catch (err) {
        console.error('Failed to fetch attack surface', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAttackSurface();
  }, []);

  return (
    <div className="container" style={{ padding: '40px 20px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h2>Global Attack Surface</h2>
        <p className="text-muted">An aggregated view of discovered infrastructure, subdomains, and active ports.</p>
      </div>

      {loading ? (
        <div className="flex-center" style={{ padding: '60px' }}>
          <div className="spinner" style={{ width: '40px', height: '40px', color: 'var(--primary)' }} />
        </div>
      ) : attackSurface.length === 0 ? (
        <div className="card flex-col flex-center" style={{ padding: '60px', color: 'var(--text-muted)' }}>
          <FiGlobe size={48} style={{ marginBottom: '16px', color: 'var(--primary)' }} />
          <h3>No assets discovered</h3>
          <p>Run a passive or active scan to map out your attack surface.</p>
        </div>
      ) : (
        <div className="flex-col gap-24">
          {attackSurface.map((entry, i) => (
            <div key={i} className="card">
              <div className="flex-between" style={{ borderBottom: '1px solid var(--border-soft)', paddingBottom: '16px', marginBottom: '16px' }}>
                <div className="flex gap-12 flex-center">
                  <div style={{ width: 40, height: 40, background: 'var(--primary-glow2)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FiServer size={20} color="var(--primary)" />
                  </div>
                  <div>
                    <h3 style={{ margin: 0 }}>{entry.target?.sanitizedUrl}</h3>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      {entry.reconData?.subdomains?.length || 0} subdomains • {entry.reconData?.openPorts?.length || 0} open ports
                    </div>
                  </div>
                </div>
                <div className="badge badge-info">Monitoring</div>
              </div>

              <div className="grid-3">
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-soft)' }}>
                  <div className="flex flex-between" style={{ marginBottom: 12 }}>
                    <h4 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>Subdomains</h4>
                    <FiGlobe size={14} color="var(--text-muted)" />
                  </div>
                  {entry.reconData?.subdomains?.slice(0, 5).map((sub, j) => (
                    <div key={j} style={{ fontSize: '0.85rem', padding: '4px 0', borderBottom: '1px dashed var(--border-soft)' }}>{sub}</div>
                  ))}
                  {entry.reconData?.subdomains?.length > 5 && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--primary)', marginTop: 8 }}>+ {entry.reconData.subdomains.length - 5} more</div>
                  )}
                  {(!entry.reconData?.subdomains || entry.reconData.subdomains.length === 0) && (
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>No subdomains discovered</div>
                  )}
                </div>

                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-soft)' }}>
                  <div className="flex flex-between" style={{ marginBottom: 12 }}>
                    <h4 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>Open Ports</h4>
                    <FiRadio size={14} color="var(--text-muted)" />
                  </div>
                  <div className="flex" style={{ gap: 8, flexWrap: 'wrap' }}>
                    {entry.reconData?.openPorts?.map((port, j) => (
                      <span key={j} style={{ padding: '2px 8px', background: 'rgba(59, 130, 246, 0.1)', color: '#60A5FA', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 100, fontSize: '0.8rem' }}>
                        {port}
                      </span>
                    ))}
                  </div>
                  {(!entry.reconData?.openPorts || entry.reconData.openPorts.length === 0) && (
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>No open ports detected</div>
                  )}
                </div>

                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-soft)' }}>
                  <div className="flex flex-between" style={{ marginBottom: 12 }}>
                    <h4 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>DNS & Technology</h4>
                    <FiActivity size={14} color="var(--text-muted)" />
                  </div>
                  {entry.reconData?.dnsRecords?.A?.map((ip, j) => (
                    <div key={j} style={{ fontSize: '0.85rem', padding: '4px 0', display: 'flex', gap: 8 }}>
                      <span style={{ color: 'var(--text-dim)', width: 24 }}>A</span> {ip}
                    </div>
                  ))}
                  {entry.reconData?.technologies?.map((tech, j) => (
                    <div key={j} style={{ fontSize: '0.85rem', padding: '4px 0', color: 'var(--primary)' }}>
                      {tech.name} {tech.version ? `v${tech.version}` : ''}
                    </div>
                  ))}
                  {(!entry.reconData?.dnsRecords?.A && (!entry.reconData?.technologies || entry.reconData.technologies.length === 0)) && (
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>No DNS intel found</div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
