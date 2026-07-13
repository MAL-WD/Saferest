// src/components/scanner/FindingCard.jsx
import { useState } from 'react';
import { FiChevronDown, FiChevronUp, FiShield, FiAlertTriangle, FiInfo, FiCode, FiExternalLink } from 'react-icons/fi';
import SeverityBadge from '../ui/SeverityBadge';
import styles from './FindingCard.module.css';

export default function FindingCard({ finding, diffStatus }) {
  const diff = diffStatus || finding.diffStatus;
  const [expanded, setExpanded] = useState(false);

  const getIcon = () => {
    switch (finding.severity) {
      case 'CRITICAL':
      case 'HIGH': return <FiAlertTriangle size={18} className={styles.iconHigh} />;
      case 'MEDIUM':
      case 'LOW': return <FiShield size={18} className={styles.iconMed} />;
      default: return <FiInfo size={18} className={styles.iconInfo} />;
    }
  };

  return (
    <div className={`${styles.card} ${expanded ? styles.expanded : ''}`}>
      <div className={styles.header} onClick={() => setExpanded(!expanded)}>
        <div className={styles.titleRow}>
          {getIcon()}
          <h4>{finding.title || 'Unknown Finding'}</h4>
          {diff === 'new' && <span className={styles.diffNew}>NEW</span>}
          {diff === 'resolved' && <span className={styles.diffResolved}>RESOLVED</span>}
          <SeverityBadge severity={finding.severity} />
        </div>
        <div className={styles.headerRight}>
          <span className={styles.scannerBadge}>{finding.scanner}</span>
          {expanded ? <FiChevronUp size={20} /> : <FiChevronDown size={20} />}
        </div>
      </div>
      
      {expanded && (
        <div className={styles.body}>
          <div className={styles.section}>
            <h5>Description</h5>
            <p>{finding.description || 'No description provided.'}</p>
          </div>
          
          <div className={styles.grid2}>
            {finding.owaspCategory && (
              <div className={styles.section}>
                <h5>OWASP Category</h5>
                <p className={styles.mono}>{finding.owaspCategory}</p>
              </div>
            )}
            
            {finding.evidence && (
              <div className={styles.section}>
                <h5>Evidence</h5>
                <pre className={styles.evidenceBlock}>
                  <code>{finding.evidence}</code>
                </pre>
              </div>
            )}
          </div>

          {finding.remediation && (
            <div className={styles.section}>
              <h5><FiCode size={16} /> Remediation Steps</h5>
              <p>{finding.remediation}</p>
            </div>
          )}

          {finding.references && finding.references.length > 0 && (
            <div className={styles.section}>
              <h5>References</h5>
              <ul className={styles.refList}>
                {finding.references.map((ref, idx) => (
                  <li key={idx}>
                    <a href={ref} target="_blank" rel="noopener noreferrer">
                      {ref} <FiExternalLink size={12} />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
