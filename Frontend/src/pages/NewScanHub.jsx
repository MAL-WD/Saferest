import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiSearch } from 'react-icons/fi';
import { TOOL_CATEGORIES, QUICK_TOOLS } from '../config/dashboardNav';
import styles from './NewScanHub.module.css';

// Fallback descriptions for tools that might not have one in config
const TOOL_DESCRIPTIONS = {
  'Website Scanner': 'Discover XSS, SQLi, RCE and 70+ web application issues.',
  'Network Scanner': 'Deep packet analysis mapping anomalies to cyber threat frameworks.',
  'Port Scanner': 'Detect open ports and fingerprint services.',
  'Subdomain Finder': 'Discover subdomains of a target domain.',
  'Email Scanner': 'Check SPF, DKIM, DMARC configurations.',
  'Code Scanner': 'AI-powered source code review and static analysis.',
  'Attack Surface': 'Map your external exposure and digital footprint.',
  'Traffic Analysis': 'Analyze network traffic flows and identify anomalies.',
  'Malicious URL': 'Scan links for phishing, malware, and reputation issues.',
  'Firewall Advisor': 'Optimize WAF rules and network boundaries.',
  'Security Scores': 'Get a high-level grade of your security posture.',
};

export default function NewScanHub() {
  const [activeTab, setActiveTab] = useState('Quick start');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    document.title = 'New Scan - Saferest AI';
  }, []);

  // Extract all unique tools across categories for filtering
  const allTools = useMemo(() => {
    const tools = [];
    TOOL_CATEGORIES.forEach(cat => {
      cat.items.forEach(item => {
        if (!tools.find(t => t.name === item.name)) {
          // Merge descriptions from QUICK_TOOLS or fallback
          const quick = QUICK_TOOLS.find(q => q.name === item.name);
          tools.push({
            ...item,
            category: cat.label,
            accent: cat.accent,
            desc: quick?.desc || TOOL_DESCRIPTIONS[item.name] || 'Run security analysis.',
          });
        }
      });
    });
    return tools;
  }, []);

  const tabs = ['Quick start', ...TOOL_CATEGORIES.map(c => c.label)];

  const filteredTools = useMemo(() => {
    let filtered = allTools;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = allTools.filter(t => 
        t.name.toLowerCase().includes(q) || 
        t.desc.toLowerCase().includes(q)
      );
    } else if (activeTab !== 'Quick start') {
      filtered = allTools.filter(t => t.category === activeTab);
    } else {
      // For Quick start, just show QUICK_TOOLS or a subset
      const quickNames = QUICK_TOOLS.map(q => q.name);
      filtered = allTools.filter(t => quickNames.includes(t.name));
    }

    return filtered;
  }, [allTools, activeTab, searchQuery]);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>New scan</h1>
      </div>

      <div className={styles.tabs}>
        {tabs.map(tab => (
          <button
            key={tab}
            className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className={styles.searchContainer}>
        <div className={styles.searchInputWrapper}>
          <FiSearch size={18} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Quick find"
            className={styles.searchInput}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {searchQuery === '' && (
        <h2 className={styles.sectionTitle}>
          {activeTab === 'Quick start' ? 'Frequently used' : activeTab}
        </h2>
      )}

      {filteredTools.length > 0 ? (
        <div className={styles.grid}>
          {filteredTools.map((tool) => {
            const Icon = tool.customIcon;
            return (
              <Link to={tool.to} key={tool.name} className={styles.card}>
                <div 
                  className={styles.iconWrapper} 
                  style={{ background: `${tool.accent}15`, color: tool.accent }}
                >
                  {Icon && <Icon size={24} color={tool.accent} />}
                </div>
                <div className={styles.cardContent}>
                  <div className={styles.cardHeader}>
                    <h3 className={styles.cardTitle}>{tool.name}</h3>
                    {tool.isFree && <span className={styles.freeTag}>FREE</span>}
                  </div>
                  <p className={styles.cardDesc}>{tool.desc}</p>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <p>No tools found matching "{searchQuery}"</p>
        </div>
      )}
    </div>
  );
}
