import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FiShield,
  FiTarget,
  FiActivity,
  FiAlertTriangle,
  FiArrowRight,
  FiArrowUpRight,
  FiPlusCircle,
} from 'react-icons/fi';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import useAuthStore from '../store/authStore';
import api from '../services/api';
import DonutGauge from '../components/dashboard/DonutGauge';
import { QUICK_TOOLS } from '../config/dashboardNav';
import {
  aggregateScansByMonth,
  countByStatus,
  scannedTargetCount,
  percentChange,
  scansInLastDays,
} from '../utils/dashboardStats';
import styles from './Dashboard.module.css';

const SEVERITY_COLORS = {
  CRITICAL: '#EF4444',
  critical: '#EF4444',
  HIGH: '#FBBF24',
  high: '#FBBF24',
  MEDIUM: '#EAB308',
  medium: '#EAB308',
  LOW: '#22D3EE',
  low: '#22D3EE',
};

const STATUS_BADGE = {
  queued: { label: 'Queued', color: '#06B6D4' },
  running: { label: 'Running', color: '#ACEC00' },
  completed: { label: 'Completed', color: '#10B981' },
  failed: { label: 'Failed', color: '#EF4444' },
};

function ActivityHeatmap({ scans }) {
  // Compute real activity for a 7x12 grid (7 days a week, last 12 weeks)
  const grid = Array.from({ length: 7 }, () => Array(12).fill(0));
  
  if (scans && scans.length > 0) {
    const now = new Date();
    // Start of current week (Sunday)
    const currentWeekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
    currentWeekStart.setHours(0, 0, 0, 0);

    scans.forEach((scan) => {
      const scanDate = new Date(scan.createdAt);
      const dayOfWeek = scanDate.getDay(); // 0 (Sun) to 6 (Sat)
      
      // Calculate how many weeks ago this scan was
      const scanWeekStart = new Date(scanDate.getFullYear(), scanDate.getMonth(), scanDate.getDate() - dayOfWeek);
      scanWeekStart.setHours(0, 0, 0, 0);
      
      const weeksAgo = Math.floor((currentWeekStart - scanWeekStart) / (7 * 24 * 60 * 60 * 1000));
      
      // We have 12 columns (index 0 is oldest, index 11 is this week)
      const colIndex = 11 - weeksAgo;
      if (colIndex >= 0 && colIndex < 12) {
        grid[dayOfWeek][colIndex] += 1;
      }
    });
  }

  // Find max value for scaling
  let maxCount = 1;
  grid.forEach(row => row.forEach(val => { if (val > maxCount) maxCount = val; }));

  return (
    <div className={styles.heatmap}>
      <div className={styles.heatmapLegend}>
        <span>Low</span>
        <div className={styles.heatmapLegendBar} />
        <span>High</span>
      </div>
      <div className={styles.heatmapGrid}>
        {grid.flatMap((row, ri) =>
          row.map((v, ci) => {
            // Scale 0 to 10
            const scaledValue = (v / maxCount) * 10;
            return (
              <div
                key={`${ri}-${ci}`}
                className={styles.heatmapCell}
                title={`${v} scans`}
                style={{
                  opacity: v === 0 ? 0.25 : 0.4 + (scaledValue * 0.06),
                  background:
                    v === 0 ? 'rgba(255,255,255,0.08)' :
                    scaledValue > 6 ? '#ACEC00' : 
                    scaledValue > 3 ? '#013ff6' : '#013ff6',
                }}
              />
            );
          })
        )}
      </div>
      <p className={styles.heatmapNote}>Scan activity over the last 12 weeks</p>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuthStore();
  const [scans, setScans] = useState([]);
  const [targets, setTargets] = useState([]);
  const [findings, setFindings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chartMode, setChartMode] = useState('monthly');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    document.title = 'Dashboard - Saferest AI';
    Promise.all([
      api.get('/scans?limit=100'),
      api.get('/targets'),
      api.get('/scans/global-findings'),
    ])
      .then(([sRes, tRes, fRes]) => {
        setScans(sRes.data.scans || []);
        setTargets(tRes.data.targets || []);
        setFindings(fRes.data.findings || []);
      })
      .finally(() => setLoading(false));
  }, []);

  const statusCounts = useMemo(() => countByStatus(scans), [scans]);
  const assetGauge = useMemo(
    () => scannedTargetCount(scans, Math.max(targets.length, 1)),
    [scans, targets]
  );

  const totalFindings = scans.reduce((sum, s) => sum + (s.summary?.total || 0), 0);

  const recentScans = useMemo(() => {
    let list = [...scans];
    if (filter !== 'all') list = list.filter((s) => s.status === filter);
    return list.slice(0, 5);
  }, [scans, filter]);

  const chartData = useMemo(() => {
    const monthly = aggregateScansByMonth(scans, 7);
    if (chartMode === 'monthly') return monthly;
    const weekly = scansInLastDays(scans, 49);
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days.map((label, i) => ({
      label,
      count: weekly.filter((s) => new Date(s.createdAt).getDay() === i).length,
    }));
  }, [scans, chartMode]);

  const thisWeek = scansInLastDays(scans, 7).length;
  const lastWeek = scansInLastDays(scans, 14).length - thisWeek;
  const scanTrend = percentChange(thisWeek, lastWeek);

  const STAT_CARDS = [
    {
      label: 'Total Scans',
      value: scans.length,
      icon: FiShield,
      trend: `${scanTrend >= 0 ? '+' : ''}${scanTrend}% from last week`,
      positive: scanTrend >= 0,
    },
    {
      label: 'Assets',
      value: targets.length,
      icon: FiTarget,
      trend: `${assetGauge.scanned} scanned`,
      positive: true,
    },
    {
      label: 'Findings',
      value: totalFindings,
      icon: FiActivity,
      trend: `${findings.length} aggregated`,
      positive: false,
    },
  ];

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className={styles.page}>
      {/* Welcome */}
      <div className={styles.welcomeRow}>
        <div>
          <p className={styles.welcomeSub}>{greeting()},</p>
          <h1 className={styles.greeting}>
            {user?.name || 'User'}
            {user?.planTier === 'pro' && (
              <span className={styles.premiumBadge}>Premium</span>
            )}
          </h1>
        </div>
      </div>

      {/* Stat cards + CTA */}
      {loading ? (
        <div className={styles.statGrid}>
          {[...Array(4)].map((_, i) => (
            <div key={i} className={`${styles.statCard} ${styles.skeleton}`} />
          ))}
        </div>
      ) : (
        <div className={styles.statGrid}>
          {STAT_CARDS.map(({ label, value, icon: Icon, trend, positive }) => (
            <div key={label} className={styles.statCard}>
              <div className={styles.statTop}>
                <div className={styles.statIconWrap}>
                  <Icon size={20} />
                </div>
                <button type="button" className={styles.statArrow} aria-label="Details">
                  <FiArrowUpRight size={16} />
                </button>
              </div>
              <p className={styles.statValue}>{value}</p>
              <p className={styles.statLabel}>{label}</p>
              <p
                className={styles.statTrend}
                style={{ color: positive ? '#22d3ee' : 'rgba(255,255,255,0.4)' }}
              >
                {trend}
              </p>
            </div>
          ))}
          <Link to="/scans/new" className={styles.ctaCard}>
            <div className={styles.ctaIcon}>
              <FiPlusCircle size={28} />
            </div>
            <p className={styles.ctaTitle}>Start a new scan</p>
            <p className={styles.ctaSub}>Launch website, port, or code analysis</p>
            <span className={styles.ctaBtn}>
              New Scan <FiArrowRight size={14} />
            </span>
          </Link>
        </div>
      )}

      {/* Scan activity */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Scan activity</h2>
        <div className={styles.gaugeGrid}>
          <DonutGauge
            value={assetGauge.scanned}
            max={Math.max(assetGauge.total, 1)}
            label="Scanned assets"
            accent="#013ff6"
          />
          <DonutGauge
            value={statusCounts.running || 0}
            max={Math.max(scans.length, 1)}
            label="Running scans"
            accent="#ACEC00"
          />
          <DonutGauge
            value={statusCounts.queued || 0}
            max={Math.max(scans.length, 1)}
            label="Waiting scans"
            accent="#013ff6"
          />
          <DonutGauge
            value={targets.length}
            max={Math.max(targets.length + 2, 5)}
            label="Added assets"
            accent="#22d3ee"
          />
        </div>
      </section>

      {/* Filters */}
      <div className={styles.filterBar}>
        <div className={styles.filterPills}>
          {['all', 'running', 'completed', 'queued'].map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={filter === f ? styles.filterActive : styles.filterPill}
            >
              {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <Link to="/scans" className={styles.filterAction}>
          View all scans
        </Link>
      </div>

      {/* Charts row */}
      <div className={styles.chartsRow}>
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h3>Scan volume</h3>
            <div className={styles.chartToggle}>
              <button
                type="button"
                className={chartMode === 'monthly' ? styles.toggleActive : ''}
                onClick={() => setChartMode('monthly')}
              >
                Monthly
              </button>
              <button
                type="button"
                className={chartMode === 'weekly' ? styles.toggleActive : ''}
                onClick={() => setChartMode('weekly')}
              >
                Weekly
              </button>
            </div>
          </div>
          <div className={styles.chartBody}>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} barSize={chartMode === 'monthly' ? 28 : 36}>
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
                />
                <YAxis hide />
                <Tooltip
                  cursor={{ fill: 'rgba(1,63,246,0.1)' }}
                  contentStyle={{
                    background: '#0d2d4d',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 12,
                  }}
                  labelStyle={{ color: '#fff' }}
                />
                <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        entry.count === Math.max(...chartData.map((d) => d.count), 0) &&
                        entry.count > 0
                          ? '#013ff6'
                          : 'rgba(1,63,246,0.45)'
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={styles.chartCard}>
          <h3 className={styles.chartHeaderSimple}>Activity heatmap</h3>
          <ActivityHeatmap scans={scans} />
        </div>

        <div className={styles.chartCard}>
          <h3 className={styles.chartHeaderSimple}>Recent findings</h3>
          <div className={styles.findingsList}>
            {loading ? (
              <p className={styles.findingsEmpty}>Loading…</p>
            ) : findings.length === 0 ? (
              <p className={styles.findingsEmpty}>No findings yet.</p>
            ) : (
              findings.slice(0, 6).map((f, i) => (
                <Link
                  key={f._id || `${f.title}-${i}`}
                  to="/findings"
                  className={styles.findingItem}
                >
                  <div
                    className={styles.findingDot}
                    style={{
                      background: SEVERITY_COLORS[f.severity] || '#8B95A6',
                    }}
                  />
                  <div className={styles.findingBody}>
                    <p className={styles.findingTitle}>{f.title || f.name || 'Finding'}</p>
                    <p className={styles.findingMeta}>
                      {f.severity} · {f.targetUrl || f.target?.sanitizedUrl || f.target?.url || f.target?.label || 'Unknown'}
                    </p>
                  </div>
                  <FiAlertTriangle
                    size={14}
                    style={{ color: SEVERITY_COLORS[f.severity], flexShrink: 0 }}
                  />
                </Link>
              ))
            )}
          </div>
          <Link to="/findings" className={styles.findingsLink}>
            View all findings <FiArrowRight size={14} />
          </Link>
        </div>
      </div>

      {/* Quick tools */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Security tools</h2>
        <div className={styles.toolsGrid}>
          {QUICK_TOOLS.map((tool) => {
            const ToolIcon = tool.icon;
            return (
              <Link key={tool.to} to={tool.to} className={styles.toolCard}>
                <div className={styles.toolIcon} style={{ background: `${tool.color}22`, color: tool.color }}>
                  {ToolIcon ? <ToolIcon size={18} /> : <FiShield size={18} />}
                </div>
                <div>
                  <p className={styles.toolName}>{tool.name}</p>
                  <p className={styles.toolDesc}>{tool.desc}</p>
                </div>
                <FiArrowUpRight size={16} className={styles.toolArrow} />
              </Link>
            );
          })}
        </div>
      </section>

      {/* Recent scans */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Latest scans</h2>
          <Link to="/scans" className={styles.viewAll}>
            View all <FiArrowRight size={14} />
          </Link>
        </div>
        {loading ? (
          <div className={`${styles.tableCard} ${styles.skeleton}`} style={{ height: 200 }} />
        ) : recentScans.length === 0 ? (
          <div className={styles.emptyState}>
            <FiShield size={40} className="text-white/20" />
            <h3>No scans yet</h3>
            <p>Run your first scan to see results here.</p>
            <Link to="/scans/new" className={styles.emptyBtn}>
              Start a Scan
            </Link>
          </div>
        ) : (
          <div className={styles.tableCard}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Target</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Findings</th>
                  <th>Date</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {recentScans.map((scan) => {
                  const sb = STATUS_BADGE[scan.status] || STATUS_BADGE.queued;
                  return (
                    <tr key={scan._id}>
                      <td className={styles.targetCell}>
                        <span className={styles.targetDot} />
                        {scan.target?.sanitizedUrl || scan.target?.url || '—'}
                      </td>
                      <td>
                        <span className={styles.typeBadge}>{scan.type}</span>
                      </td>
                      <td>
                        <span className={styles.statusDot} style={{ '--dot-color': sb.color }}>
                          {sb.label}
                        </span>
                      </td>
                      <td className={styles.findingsCell}>
                        {scan.summary?.critical > 0 && (
                          <span style={{ color: SEVERITY_COLORS.CRITICAL }}>
                            {scan.summary.critical} Critical
                          </span>
                        )}
                        {scan.summary?.high > 0 && (
                          <span style={{ color: SEVERITY_COLORS.HIGH }}>
                            {scan.summary.high} High
                          </span>
                        )}
                        {!scan.summary?.critical && !scan.summary?.high && (
                          <span className="text-white/40">{scan.summary?.total || 0} Total</span>
                        )}
                      </td>
                      <td className={styles.dateCell}>
                        {new Date(scan.createdAt).toLocaleDateString()}
                      </td>
                      <td>
                        <Link
                          to={
                            scan.status === 'running'
                              ? `/scans/${scan._id}/live`
                              : `/scans/${scan._id}`
                          }
                          className={styles.rowLink}
                        >
                          View <FiArrowRight size={13} />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
