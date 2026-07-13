import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  TbMenu2,
  TbSearch,
  TbBell,
  TbLayoutDashboard,
  TbAlertTriangle,
  TbRadar,
  TbReportAnalytics,
  TbLayoutSidebarLeftCollapse,
  TbLayoutSidebarLeftExpand,
  TbSun,
  TbMoon,
} from 'react-icons/tb';
import { FiLogOut } from 'react-icons/fi';
import useAuthStore from '../../store/authStore';
import useTheme from '../../hooks/useTheme';
import api from '../../services/api';
import { TOP_PILLS } from '../../config/dashboardNav';
import shell from './DashboardShell.module.css';

const PILL_ICONS = {
  overview: TbLayoutDashboard,
  findings: TbAlertTriangle,
  scans: TbRadar,
  reports: TbReportAnalytics,
};

export default function DashboardTopBar({
  onMenuClick,
  runningCount = 0,
  sidebarCollapsed = false,
  onToggleSidebar,
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useTheme();

  const isPillActive = (to) => {
    if (to === '/dashboard') return location.pathname === '/dashboard';
    return location.pathname === to || location.pathname.startsWith(`${to}/`);
  };

  const handleLogout = async () => {
    await api.post('/auth/logout').catch(() => undefined);
    logout();
    navigate('/login');
  };

  return (
    <header className={shell.topbar}>
      <div className={shell.topbarInner}>
        <button
          type="button"
          onClick={onMenuClick}
          className={shell.menuBtn}
          aria-label="Open menu"
        >
          <TbMenu2 size={20} />
        </button>

        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            className={shell.sidebarToggleDesktop}
            aria-label={sidebarCollapsed ? 'Show sidebar' : 'Hide sidebar'}
            title={sidebarCollapsed ? 'Show sidebar' : 'Hide sidebar'}
          >
            {sidebarCollapsed ? (
              <TbLayoutSidebarLeftExpand size={20} />
            ) : (
              <TbLayoutSidebarLeftCollapse size={20} />
            )}
          </button>
        )}

        {/* <Link to="/dashboard" className={shell.topbarLogo}>
          <img src="/logo.png" alt="Saferest" className={shell.topbarLogoImg} />
          <span className={shell.sidebarBrandText}>
            Saferest<span>.ai</span>
          </span>
        </Link> */}

        <nav className={shell.pillNav} aria-label="Quick navigation">
          {TOP_PILLS.map((pill) => {
            const Icon = PILL_ICONS[pill.icon];
            const active = isPillActive(pill.to);
            const badge =
              pill.badgeKey === 'running' && runningCount > 0 ? runningCount : null;

            return (
              <Link
                key={pill.to}
                to={pill.to}
                className={[shell.pill, active ? shell.pillActive : ''].filter(Boolean).join(' ')}
              >
                {Icon && <Icon size={16} />}
                {pill.label}
                {badge != null && (
                  <span
                    className={[
                      shell.pillBadge,
                      active ? shell.pillBadgeActive : shell.pillBadgeIdle,
                    ].join(' ')}
                  >
                    {badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className={shell.topbarActions}>
          <button
            type="button"
            className={shell.themeToggle}
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
          >
            {theme === 'dark' ? <TbSun size={18} /> : <TbMoon size={18} />}
          </button>
          <button type="button" className={shell.iconBtnHiddenMobile} aria-label="Search">
            <TbSearch size={18} />
          </button>
          <div className={shell.iconBtnWrap}>
            <button type="button" className={shell.iconBtn} aria-label="Notifications">
              <TbBell size={18} />
            </button>
            <span className={shell.notifDot} />
          </div>
          <div className={shell.avatar} title={user?.name || 'User'}>
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className={shell.iconBtnHiddenMobile}
            aria-label="Logout"
          >
            <FiLogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  );
}
