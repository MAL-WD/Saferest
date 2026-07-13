import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiActivity } from 'react-icons/fi';
import api from '../services/api';
import { SubdomainFinderIcon } from '../components/ui/Icons';
import styles from './PortScanner.module.css';

const STORAGE_KEY = 'subdomainFinderLastResult';

function normalizeTargetUrl(raw) {
  const t = raw.trim();
  if (!t) return '';
  if (/^https?:\/\//i.test(t)) return t;
  return `https://${t}`;
}

export default function SubdomainFinder() {
  const navigate = useNavigate();
  const [target, setTarget] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    document.title = 'Subdomain Finder - Saferest AI';
  }, []);

  const handleRun = async (e) => {
    e.preventDefault();
    if (!target.trim()) {
      setError('Please enter a domain or URL');
      return;
    }
    setError(null);
    setLoading(true);

    try {
      const targetUrl = normalizeTargetUrl(target);
      const { data } = await api.post('/recon/subdomain-finder', { targetUrl });
      if (data.success) {
        const payload = {
          ...data,
          queriedAt: new Date().toISOString(),
        };
        try {
          sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
        } catch {
          /* quota / private mode */
        }
        navigate('/subdomain-finder/results');
      } else {
        setError(data.message || 'Request failed');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to run Subdomain Finder');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.heroLayout}>
        <div className={styles.infoSide}>
          <div className={styles.toolIcon}>
            <SubdomainFinderIcon size={50} />
          </div>
          <h1 className={styles.title}>Subdomain Finder</h1>
          <p className={styles.description}>
            Discover hostnames for a domain using passive sources: optional Subfinder on your API server, public
            intelligence feeds, and historical DNS when a provider key is configured.
          </p>
          <div className={styles.badgeRow}>
            <span>Enumeration runs on your backend—only probe targets you are authorized to test.</span>
          </div>
        </div>

        <div className={styles.formSide}>
          <div className={styles.formCard}>
            <form className={styles.form} onSubmit={handleRun}>
              <div className="form-group">
                <label className={styles.label}>Domain or URL</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="example.com or https://www.example.com"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  autoComplete="off"
                />
              </div>

              <div className={styles.tosCheck}>
                <input type="checkbox" id="subdomain-tos" required />
                <label htmlFor="subdomain-tos">
                  I am authorized to enumerate this target and I agree with the Terms of Service.
                </label>
              </div>

              {error && <div className={styles.error}>{error}</div>}

              <button className={styles.scanBtn} type="submit" disabled={loading}>
                {loading ? (
                  'Running…'
                ) : (
                  <>
                    <FiActivity size={18} />
                    Find subdomains
                  </>
                )}
              </button>
            </form>
          </div>

          <div className={styles.formFooter}>
            <p>
              After the run finishes you will be taken to a results view with filters, copy actions, and grouped
              sources. Optional Subfinder widens coverage when installed on the server.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
