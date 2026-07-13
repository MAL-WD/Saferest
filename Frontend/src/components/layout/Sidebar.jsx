import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  TbLayoutDashboard,
  TbTarget,
  TbRadar,
  TbAlertTriangle,
  TbSettingsAutomation,
  TbReportAnalytics,
  TbSettings,
  TbChevronDown,
  TbBolt,
  TbShield,
  TbLayoutSidebarLeftCollapse,
} from 'react-icons/tb';
import { FiShield } from 'react-icons/fi';
import { MAIN_NAV, TOOL_CATEGORIES } from '../../config/dashboardNav';
import shell from './DashboardShell.module.css';

const ICONS = {
  dashboard: TbLayoutDashboard,
  assets: TbTarget,
  scans: TbRadar,
  findings: TbAlertTriangle,
  automation: TbSettingsAutomation,
  reports: TbReportAnalytics,
  settings: TbSettings,
};

export default function Sidebar({
  open,
  onClose,
  badges = {},
  collapsed = false,
  onCollapse,
}) {
  const location = useLocation();
  const [openCategories, setOpenCategories] = useState(() =>
    Object.fromEntries(TOOL_CATEGORIES.map((c) => [c.id, true]))
  );

  const isActive = (path) => {
    if (path === '/dashboard') return location.pathname === '/dashboard';
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const toggleCategory = (id) => {
    setOpenCategories((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <aside
      className={[
        shell.sidebar,
        open ? shell.sidebarOpen : '',
        collapsed ? shell.sidebarDesktopHidden : '',
      ]
        .filter(Boolean)
        .join(' ')}
      aria-label="Main navigation"
      aria-hidden={collapsed && !open}
    >
      <div className={shell.sidebarInner}>
        <div className={shell.sidebarHeader}>
          <Link to="/dashboard" className={shell.sidebarBrand} onClick={onClose}>
            <img src="/logo.png" alt="" className={shell.sidebarLogo} />
            <span className={shell.sidebarBrandText}>
              Saferest<span>.ai</span>
            </span>
          </Link>
          {onCollapse && (
            <button
              type="button"
              className={shell.collapseBtn}
              onClick={onCollapse}
              aria-label="Hide sidebar"
              title="Hide sidebar"
            >
              <TbLayoutSidebarLeftCollapse size={18} />
            </button>
          )}
        </div>

        <Link to="/scans/new" onClick={onClose} className={shell.newScanBtn}>
          <TbBolt size={18} />
          New Scan
        </Link>

        <p className={shell.navLabel}>NAVIGATION</p>
        <nav className={shell.nav}>
          {MAIN_NAV.map((item) => {
            const Icon = ICONS[item.icon] || TbShield;
            const active = isActive(item.to);
            const badge = item.badgeKey ? badges[item.badgeKey] : null;

            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={[shell.navLink, active ? shell.navLinkActive : ''].filter(Boolean).join(' ')}
              >
                <Icon size={18} className={shell.navIcon} />
                <span style={{ flex: 1 }}>{item.label}</span>
                {badge != null && badge > 0 && (
                  <span className={shell.navBadge}>{badge}</span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className={shell.toolsSection}>
          <p className={shell.navLabel}>TOOLS</p>
          {TOOL_CATEGORIES.map((category) => {
            const isOpen = openCategories[category.id];
            return (
              <div key={category.id} className={shell.toolCategory}>
                <button
                  type="button"
                  className={shell.categoryHeader}
                  onClick={() => toggleCategory(category.id)}
                  style={{ '--cat-accent': category.accent }}
                >
                  <span className={shell.categoryDot} style={{ background: category.accent }} />
                  <span className={shell.categoryLabel}>{category.label}</span>
                  <span className={shell.categoryCount}>{category.items.length}</span>
                  <TbChevronDown
                    size={14}
                    className={[shell.toolsChevron, isOpen ? shell.toolsChevronOpen : ''].join(' ')}
                  />
                </button>
                {isOpen && (
                  <div
                    className={shell.categoryList}
                    style={{ borderLeftColor: `${category.accent}44` }}
                  >
                    {category.items.map((tool) => {
                      const CustomIcon = tool.customIcon;
                      const toolActive = location.pathname === tool.to;
                      return (
                        <Link
                          key={tool.to + tool.name}
                          to={tool.to}
                          onClick={onClose}
                          className={[
                            shell.toolLink,
                            toolActive ? shell.toolLinkActive : '',
                          ]
                            .filter(Boolean)
                            .join(' ')}
                          style={{ '--cat-accent': category.accent }}
                        >
                          {CustomIcon ? (
                            <CustomIcon size={16} />
                          ) : (
                            <FiShield size={14} />
                          )}
                          <span style={{ flex: 1 }} className="truncate">
                            {tool.name}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
