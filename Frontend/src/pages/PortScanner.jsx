import { useState, useEffect } from 'react';
import { FiMonitor, FiShield, FiSettings, FiActivity, FiArrowRight, FiCheckCircle, FiInfo } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { PortScannerIcon } from '../components/ui/Icons';
import styles from './PortScanner.module.css';

export default function PortScanner() {
  const navigate = useNavigate();
  const [target, setTarget] = useState('');
  const [scanType, setScanType] = useState('light'); // light, deep
  const [options, setOptions] = useState({
    detectService: true,
    detectOS: false,
    protocol: 'TCP',
    portSelection: 'common',
    portRange: 'top100'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  useEffect(() => {
    document.title = 'Port Scanner - Saferest AI';
  }, []);

  const handleStartScan = async (e) => {
    e.preventDefault();
    if (!target) return setError('Please enter a target IP or hostname');
    setError(null);
    setLoading(true);

    try {
      // In a real app, we'd have a specific endpoint for dedicated port scans
      // For now, we'll use the general scan endpoint with specific parameters
      const { data } = await api.post('/scans', {
        targetUrl: target.startsWith('http') ? target : `http://${target}`,
        type: 'active',
        options: {
          scanner: 'port',
          ...options,
          scanType
        }
      });
      
      if (data.success) {
        navigate(`/scans/${data.scanId}/live`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to initiate scan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.heroLayout}>
        {/* Left Side: Info */}
        <div className={styles.infoSide}>
          <div className={styles.toolIcon}>
            <PortScannerIcon size={50} />
          </div>
          <h1 className={styles.title}>Port Scanner with Nmap</h1>
          <p className={styles.description}>
            Scan and discover open TCP and UDP ports with accuracy and speed. 
            Choose between fast top-port scans or deep, full-range analysis, 
            and get results you can trust: validated, exportable, and ready for follow-up vulnerability assessments.
          </p>
          <div className={styles.badgeRow}>
            <span>Port Scanner with Nmap is available with any of our pricing plans.</span>
          </div>
          <button className="btn btn-outline" style={{marginTop: '20px'}}>
            Scan with a Free account
          </button>
        </div>

        {/* Right Side: Scan Form */}
        <div className={styles.formSide}>
          <div className={styles.formCard}>
            <div className={styles.tabs}>
              <button 
                className={`${styles.tab} ${scanType === 'light' ? styles.activeTab : ''}`}
                onClick={() => setScanType('light')}
              >
                Light scan
              </button>
              <button 
                className={`${styles.tab} ${scanType === 'deep' ? styles.activeTab : ''}`}
                onClick={() => setScanType('deep')}
              >
                Deep scan
              </button>
            </div>

            <form className={styles.form} onSubmit={handleStartScan}>
              <div className="form-group">
                <label className={styles.label}>Target</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="IP or Hostname"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                />
              </div>

              <div className={styles.optionSection}>
                <label className={styles.label}>Scan options</label>
                <div className={styles.toggleRow}>
                  <div className={styles.toggleItem}>
                    <input 
                      type="checkbox" 
                      id="detectService"
                      checked={options.detectService}
                      onChange={(e) => setOptions({...options, detectService: e.target.checked})}
                    />
                    <label htmlFor="detectService">Detect service version</label>
                  </div>
                  <div className={styles.toggleItem}>
                    <input 
                      type="checkbox" 
                      id="detectOS"
                      checked={options.detectOS}
                      onChange={(e) => setOptions({...options, detectOS: e.target.checked})}
                    />
                    <label htmlFor="detectOS">Detect operating system</label>
                  </div>
                </div>
              </div>

              <div className={styles.optionSection}>
                <label className={styles.label}>Protocol</label>
                <div className={styles.radioRow}>
                  <label className={styles.radioItem}>
                    <input 
                      type="radio" 
                      name="protocol" 
                      checked={options.protocol === 'TCP'}
                      onChange={() => setOptions({...options, protocol: 'TCP'})}
                    />
                    <span>TCP</span>
                  </label>
                  <label className={styles.radioItem}>
                    <input 
                      type="radio" 
                      name="protocol" 
                      checked={options.protocol === 'UDP'}
                      onChange={() => setOptions({...options, protocol: 'UDP'})}
                    />
                    <span>UDP</span>
                  </label>
                </div>
              </div>

              <div className={styles.optionSection}>
                <label className={styles.label}>Port selection</label>
                <div className={styles.radioRow}>
                  <label className={styles.radioItem}>
                    <input 
                      type="radio" 
                      name="portSelection" 
                      checked={options.portSelection === 'common'}
                      onChange={() => setOptions({...options, portSelection: 'common'})}
                    />
                    <span>Common ports</span>
                  </label>
                  <label className={styles.radioItem}>
                    <input 
                      type="radio" 
                      name="portSelection" 
                      checked={options.portSelection === 'list'}
                      onChange={() => setOptions({...options, portSelection: 'list'})}
                    />
                    <span>List of ports</span>
                  </label>
                </div>
                
                {options.portSelection === 'common' && (
                  <select 
                    className="form-input" 
                    style={{marginTop: '10px'}}
                    value={options.portRange}
                    onChange={(e) => setOptions({...options, portRange: e.target.value})}
                  >
                    <option value="top100">Top 100 ports</option>
                    <option value="top1000">Top 1000 ports</option>
                    <option value="full">Full range (1-65535)</option>
                  </select>
                )}
              </div>

              <div className={styles.tosCheck}>
                <input type="checkbox" id="tos" required />
                <label htmlFor="tos">I am authorized to scan this target and I agree with the Terms of Service.</label>
              </div>

              {error && <div className={styles.error}>{error}</div>}

              <button className={styles.scanBtn} type="submit" disabled={loading}>
                {loading ? 'Scanning...' : (
                  <>
                    <FiActivity size={18} />
                    Start scan
                  </>
                )}
              </button>
            </form>
          </div>
          
          <div className={styles.formFooter}>
            <p>
              Map a company's network perimeter, check firewall rules, and determine if its services 
              are reachable from the Internet in a single scan. Based on Nmap Online, the tool does 
              accurate port discovery and service detection.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
