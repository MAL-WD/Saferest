import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { TbReportAnalytics, TbArrowRight } from 'react-icons/tb';
import api from '../services/api';
import styles from './Reports.module.css';

const STATUS_STYLES = {
  generated: styles.statusOk,
  pending: styles.statusPending,
  failed: styles.statusFail,
};

export default function Reports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = 'Reports - Saferest AI';
    api
      .get('/reports?limit=50')
      .then((r) => setReports(r.data.reports || []))
      .catch(() => setReports([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Reports</h1>
        <p className={styles.subtitle}>AI remediation reports across all your scans.</p>
      </header>

      {loading ? (
        <div className={styles.skeleton} />
      ) : reports.length === 0 ? (
        <div className={styles.empty}>
          <TbReportAnalytics size={40} className={styles.emptyIcon} />
          <p>No reports yet. Complete a scan to generate an AI report.</p>
          <Link to="/scans/new" className={styles.cta}>
            Start a scan
          </Link>
        </div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Target</th>
                <th>Scan type</th>
                <th>Risk score</th>
                <th>Status</th>
                <th>Updated</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => {
                const scan = report.scan;
                const target =
                  scan?.target?.sanitizedUrl || scan?.target?.url || 'Unknown target';
                return (
                  <tr key={report._id}>
                    <td className={styles.target}>{target}</td>
                    <td className={styles.muted}>{scan?.type || '—'}</td>
                    <td className={styles.score}>
                      {report.status === 'generated' ? report.overallRiskScore : '—'}
                    </td>
                    <td>
                      <span
                        className={`${styles.status} ${STATUS_STYLES[report.status] || styles.statusPending}`}
                      >
                        {report.status}
                      </span>
                    </td>
                    <td className={styles.muted}>
                      {new Date(report.updatedAt).toLocaleDateString()}
                    </td>
                    <td>
                      {scan?._id && (
                        <Link to={`/scans/${scan._id}`} className={styles.link}>
                          View <TbArrowRight size={14} />
                        </Link>
                      )}
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
