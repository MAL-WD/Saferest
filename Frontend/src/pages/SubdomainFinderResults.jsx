import { useMemo, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiCopy, FiExternalLink, FiSearch, FiDownload } from 'react-icons/fi';
import { exportSubdomainPdf } from '../utils/exportSubdomainPdf';
import styles from './SubdomainFinderResults.module.css';

const STORAGE_KEY = 'subdomainFinderLastResult';

function inferSource(f) {
  if (f.source) return f.source;
  const t = (f.title || '').toLowerCase();
  if (t.includes('subfinder')) return 'subfinder';
  if (t.includes('hackertarget') || t.includes('public intelligence')) return 'passive_intelligence';
  if (t.includes('securitytrails') || t.includes('historical dns')) return 'dns_history';
  return 'other';
}

function hostsFromFinding(f) {
  const ev = f?.evidence != null ? String(f.evidence).trim() : '';
  if (!ev) return [];
  const source = inferSource(f);
  if (source === 'dns_history' || (ev.startsWith('[') && ev.endsWith(']'))) {
    try {
      const arr = JSON.parse(ev);
      if (Array.isArray(arr)) {
        return [...new Set(arr.map((x) => String(x).trim()).filter(Boolean))];
      }
    } catch {
      /* fall through */
    }
  }
  return [...new Set(ev.split(/\r?\n/).map((s) => s.trim()).filter(Boolean))];
}

function displayHost(input) {
  const s = String(input).trim();
  if (!s) return '';
  try {
    if (s.includes('://')) return new URL(s).hostname;
    if (!s.includes('/') && !s.includes(' ')) return s;
  } catch {
    /* ignore */
  }
  return s;
}

/** Build https URL only when valid — avoids broken / blocked navigations */
function httpsUrlForHost(host) {
  const raw = displayHost(host).trim().split(/[,\s]/)[0];
  if (!raw) return null;
  try {
    const u = new URL(`https://${raw}`);
    if (!u.hostname) return null;
    return u.href;
  } catch {
    return null;
  }
}

export default function SubdomainFinderResults() {
  const navigate = useNavigate();
  const [payload, setPayload] = useState(null);
  const [filter, setFilter] = useState('');
  const [copied, setCopied] = useState(null);

  useEffect(() => {
    document.title = 'Subdomain Finder Results - Saferest AI';
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) setPayload(JSON.parse(raw));
    } catch {
      setPayload(null);
    }
  }, []);

  const findings = payload?.findings || [];
  const targetUrl = payload?.targetUrl || '';
  const queriedAt = payload?.queriedAt;

  const domain = useMemo(() => {
    if (!targetUrl) return '';
    try {
      return new URL(targetUrl).hostname.replace(/^www\./, '');
    } catch {
      return targetUrl.replace(/^https?:\/\//i, '').split('/')[0] || targetUrl;
    }
  }, [targetUrl]);

  /** One deduplicated list: includes passive feed hosts but we do not show that as a separate section */
  const allHostsUnique = useMemo(() => {
    const set = new Set();
    for (const f of findings) {
      for (const h of hostsFromFinding(f)) {
        const d = displayHost(h);
        if (d) set.add(d);
      }
    }
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [findings]);

  const filteredAll = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return allHostsUnique;
    return allHostsUnique.filter((h) => h.toLowerCase().includes(q));
  }, [allHostsUnique, filter]);

  const totalHosts = allHostsUnique.length;

  const handleCopy = async (text, id) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(id);
      setTimeout(() => setCopied((c) => (c === id ? null : c)), 2000);
    } catch {
      /* ignore */
    }
  };

  if (!payload) {
    return (
      <div className={styles.page}>
        <div className={styles.empty}>
          <h2 className={styles.emptyTitle}>No results here yet</h2>
          <p className={styles.emptyText}>Run Subdomain Finder from the tool page. Results are kept for this browser session.</p>
          <Link to="/subdomain-finder" className={styles.emptyCta}>
            Go to Subdomain Finder
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.backRow}>
        <button type="button" className={styles.backLink} onClick={() => navigate('/subdomain-finder')}>
          <FiArrowLeft size={18} />
          New search
        </button>
      </div>

      <header className={styles.hero}>
        <div className={styles.heroInner}>
          <p className={styles.meta}>Subdomain Finder · Results</p>
          <h1 className={styles.domain}>{domain || 'Target'}</h1>
          {queriedAt && (
            <p className={styles.meta}>
              Completed {new Date(queriedAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
            </p>
          )}
          <div className={styles.stats}>
            <div className={styles.stat}>
              <div className={styles.statValue}>{totalHosts}</div>
              <div className={styles.statLabel}>Unique hostnames</div>
            </div>
          </div>
        </div>
      </header>

      {totalHosts > 0 && (
        <div className={styles.toolbar}>
          <div className={styles.searchWrap}>
            <FiSearch className={styles.searchIcon} size={18} />
            <input
              type="search"
              className={styles.searchInput}
              placeholder="Filter hostnames…"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              aria-label="Filter hostnames"
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <p className={styles.exportHint} style={{ margin: 0 }}>Open uses a real HTTPS link in a new tab (Brave-friendly).</p>
            <button 
              className="btn btn-primary btn-sm" 
              onClick={() => exportSubdomainPdf(domain, filteredAll, queriedAt)}
            >
              <FiDownload style={{ marginRight: 6 }} /> Export PDF
            </button>
          </div>
        </div>
      )}

      {totalHosts > 0 && (
        <section className={`${styles.section} ${styles.allHostsSection}`} aria-labelledby="hosts-heading">
          <h2 id="hosts-heading" className={styles.allHostsTitle}>
            Hostnames ({filteredAll.length}
            {filter.trim() ? ` of ${totalHosts}` : ''})
          </h2>
          <div className={styles.card}>
            <div className={styles.tableScroll}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Hostname</th>
                    <th style={{ width: 200 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAll.map((host) => {
                    const openUrl = httpsUrlForHost(host);
                    const canOpen = Boolean(openUrl);
                    return (
                      <tr key={host}>
                        <td className={styles.hostCell}>{host}</td>
                        <td>
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            <button
                              type="button"
                              className={`${styles.copyBtn} ${copied === `row-${host}` ? styles.copied : ''}`}
                              onClick={() => handleCopy(host, `row-${host}`)}
                            >
                              <FiCopy size={14} style={{ marginRight: 6 }} />
                              {copied === `row-${host}` ? 'Copied' : 'Copy'}
                            </button>
                            {canOpen ? (
                              <a
                                className={styles.copyBtn}
                                href={openUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Open in new tab (HTTPS)"
                              >
                                <FiExternalLink size={14} style={{ marginRight: 6 }} />
                                Open
                              </a>
                            ) : (
                              <span
                                className={`${styles.copyBtn} ${styles.copyBtnMuted}`}
                                title="Not a valid HTTPS hostname"
                                aria-disabled
                              >
                                <FiExternalLink size={14} style={{ marginRight: 6 }} />
                                Open
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {findings.length === 0 && (
        <div className={styles.empty}>
          <h2 className={styles.emptyTitle}>No hostnames returned</h2>
          <p className={styles.emptyText}>
            Passive feeds may have no data for this domain, or optional keys and CLI are not configured on the server.
          </p>
          <Link to="/subdomain-finder" className={styles.emptyCta}>
            Try another domain
          </Link>
        </div>
      )}

      {findings.length > 0 && totalHosts === 0 && (
        <div className={styles.empty}>
          <h2 className={styles.emptyTitle}>No hostnames in this run</h2>
          <p className={styles.emptyText}>Findings had no extractable host list. Try another domain or check server configuration.</p>
          <Link to="/subdomain-finder" className={styles.emptyCta}>
            New search
          </Link>
        </div>
      )}
    </div>
  );
}
