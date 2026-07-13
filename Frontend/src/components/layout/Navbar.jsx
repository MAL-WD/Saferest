import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FiShield, FiLogOut, FiMenu, FiX, FiChevronDown } from 'react-icons/fi';
import { useState } from 'react';
import useAuthStore from '../../store/authStore';
import api from '../../services/api';
import { PortScannerIcon, SubdomainFinderIcon, NetworkScannerIcon, EmailScannerIcon, WebsiteScannerIcon, CodeScannerIcon, MaliciousUrlIcon } from '../ui/Icons';
import styles from './Navbar.module.css';

const TOOLS = [
  { group: 'Most used', items: [
      { name: 'Website Scanner', to: '/scans/new',   isFree: false },
      { name: 'Port Scanner',    to: '/port-scanner',isFree: true },
      { name: 'Subdomain Finder', to: '/subdomain-finder', isFree: true },
      { name: 'Global Findings', to: '/findings',    isFree: false }
  ]},
  { group: 'Vulnerability scanners', items: [
      { name: 'Email Scanner',   to: '/email-scan',  isFree: true },
      { name: 'Code Scanner',    to: '/code-scan',   isFree: false },
      { name: 'Network Scanner',    to: '/pcap-scan',   isFree: false },
      { name: 'Malicious URL Detection', to: '/malicious-url', isFree: true },
  ]}
];

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeMega, setActiveMega] = useState(null);
  const [activeGroup, setActiveGroup] = useState('Most used');

  const handleLogout = async () => {
    await api.post('/auth/logout').catch(() => undefined);
    logout();
    navigate('/login');
  };

  return (
    <nav className={styles.nav} onMouseLeave={() => setActiveMega(null)}>
      <div className={`container ${styles.inner}`}>
        {/* Logo */}
        <Link to="/dashboard" className={styles.logo}>
          <img src="/logo.png" alt="Saferest Logo" style={{ height: '42px', width: 'auto', marginRight: '10px' }} />
          <span className={styles.logoText}>Saferest<span>.ai</span></span>
        </Link>

        {/* Desktop links */}
        <div className={styles.links}>
          <Link to="/dashboard" className={`${styles.link} ${location.pathname === '/dashboard' ? styles.active : ''}`}>
            Dashboard
          </Link>
          <Link to="/targets" className={`${styles.link} ${location.pathname.startsWith('/targets') ? styles.active : ''}`}>
            Targets
          </Link>

          {/* Mega Menu Trigger */}
          <div 
            className={`${styles.link} ${activeMega === 'tools' ? styles.active : ''}`}
            onMouseEnter={() => setActiveMega('tools')}
          >
            Tools <FiChevronDown size={14} className={styles.chevron} />
          </div>

          <Link to="/scans" className={`${styles.link} ${location.pathname.startsWith('/scans') && !location.pathname.includes('/new') ? styles.active : ''}`}>
            Scans
          </Link>
          <Link to="/settings" className={`${styles.link} ${location.pathname.startsWith('/settings') ? styles.active : ''}`}>
            Settings
          </Link>
        </div>

        {/* User pill */}
        <div className={styles.right}>
          <div className={styles.userPill}>
            <div className={styles.avatar}>
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <span className={styles.userName}>{user?.name?.split(' ')[0]}</span>
          </div>
          <button className={`btn btn-ghost ${styles.logoutBtn}`} onClick={handleLogout}>
            <FiLogOut size={16} />
          </button>
          <button className={styles.mobileMenu} onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <FiX size={20} /> : <FiMenu size={20} />}
          </button>
        </div>
      </div>

      {/* Mega Menu Dropdown */}
      {activeMega === 'tools' && (
        <div className={styles.megaMenuWrapper}>
          <div className={`container ${styles.megaMenu}`}>
            <div className={styles.megaSidebar}>
              {TOOLS.map(t => (
                <div 
                  key={t.group} 
                  className={`${styles.megaSidebarItem} ${activeGroup === t.group ? styles.megaSidebarActive : ''}`}
                  onMouseEnter={() => setActiveGroup(t.group)}
                >
                  {t.group}
                </div>
              ))}
              <div className={styles.exploreAll}>Explore all 10+ tools &rarr;</div>
            </div>
            <div className={styles.megaContent}>
              <div className={styles.toolGrid}>
                {TOOLS.find(t => t.group === activeGroup)?.items.map(item => (
                  <Link key={item.name} to={item.to} className={styles.toolItem} onClick={() => setActiveMega(null)}>
                    <div className={styles.toolIcon}>
                      {item.name === 'Port Scanner' ? (
                        <PortScannerIcon size={22} />
                      ) : item.name === 'Subdomain Finder' ? (
                        <SubdomainFinderIcon size={22} />
                      ) : item.name === 'Network Scanner' ? (
                        <NetworkScannerIcon size={22} />
                      ) : item.name === 'Email Scanner' ? (
                        <EmailScannerIcon size={22} />
                      ) : item.name === 'Website Scanner' ? (
                        <WebsiteScannerIcon size={22} />
                      ) : item.name === 'Code Scanner' ? (
                        <CodeScannerIcon size={22} />
                      ) : item.name === 'Malicious URL Detection' ? (
                        <MaliciousUrlIcon size={22} />
                      ) : (
                        <FiShield size={18} />
                      )}
                    </div>
                    <div className={styles.toolDetails}>
                      <div className={styles.toolName}>
                        {item.name} 
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
            <div className={styles.megaFeatures}>
              <div className={styles.featureTitle}>Features</div>
              <div className={styles.featureLink}>Scanning & monitoring &rarr;</div>
              <div className={styles.featureLink}>AI & accuracy <span className={styles.featureDot}></span> &rarr;</div>
              <div className={styles.featureLink}>Automation & integration &rarr;</div>
              <div className={styles.featureLink}>Workflow & collaboration &rarr;</div>
              <div className={styles.featureLink}>Reporting <span className={styles.featureDot}></span> &rarr;</div>
              <div className={styles.exploreAll} style={{marginTop: 'auto'}}>Explore all features &rarr;</div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile menu */}
      {menuOpen && (
        <div className={styles.mobileLinks}>
          <Link to="/dashboard" className={styles.mobileLink} onClick={() => setMenuOpen(false)}>Dashboard</Link>
          <Link to="/targets" className={styles.mobileLink} onClick={() => setMenuOpen(false)}>Targets</Link>
          <Link to="/scans" className={styles.mobileLink} onClick={() => setMenuOpen(false)}>Scans</Link>
          <Link to="/port-scanner" className={styles.mobileLink} onClick={() => setMenuOpen(false)}>Port Scanner</Link>
          <Link to="/subdomain-finder" className={styles.mobileLink} onClick={() => setMenuOpen(false)}>Subdomain Finder</Link>
          <Link to="/malicious-url" className={styles.mobileLink} onClick={() => setMenuOpen(false)}>Malicious URL Detection</Link>
          <Link to="/pcap-scan" className={styles.mobileLink} onClick={() => setMenuOpen(false)}>Network Scanner</Link>
          <button className={`${styles.mobileLink} ${styles.mobileLogout}`} onClick={handleLogout}>
            <FiLogOut size={16} /> Logout
          </button>
        </div>
      )}
    </nav>
  );
}
