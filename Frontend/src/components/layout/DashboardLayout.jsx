import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { TbLayoutSidebarLeftExpand } from 'react-icons/tb';
import api from '../../services/api';
import useSidebarCollapsed from '../../hooks/useSidebarCollapsed';
import Sidebar from './Sidebar';
import DashboardTopBar from './DashboardTopBar';
import shell from './DashboardShell.module.css';

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { collapsed: sidebarCollapsed, toggle: toggleSidebarCollapsed } = useSidebarCollapsed();
  const [badges, setBadges] = useState({ assets: 0, scans: 0, running: 0 });

  useEffect(() => {
    Promise.all([api.get('/targets'), api.get('/scans?limit=100')])
      .then(([tRes, sRes]) => {
        const targets = tRes.data.targets || [];
        const scans = sRes.data.scans || [];
        setBadges({
          assets: targets.length,
          scans: sRes.data.pagination?.total ?? scans.length,
          running: scans.filter((s) => s.status === 'running' || s.status === 'queued').length,
        });
      })
      .catch(() => undefined);
  }, []);

  const handleMobileMenu = () => {
    if (sidebarCollapsed) {
      toggleSidebarCollapsed();
    }
    setSidebarOpen(true);
  };

  return (
    <div className={shell.shell}>
      {sidebarOpen && (
        <button
          type="button"
          className={shell.overlay}
          aria-label="Close menu"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        badges={badges}
        collapsed={sidebarCollapsed}
        onCollapse={() => {
          toggleSidebarCollapsed();
          setSidebarOpen(false);
        }}
      />

      {sidebarCollapsed && (
        <button
          type="button"
          className={shell.expandTab}
          onClick={toggleSidebarCollapsed}
          aria-label="Show sidebar"
          title="Show sidebar"
        >
          <TbLayoutSidebarLeftExpand size={20} />
        </button>
      )}

      <div
        className={[
          shell.mainColumn,
          sidebarCollapsed ? shell.mainColumnExpanded : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <DashboardTopBar
          onMenuClick={handleMobileMenu}
          runningCount={badges.running}
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={toggleSidebarCollapsed}
        />

        <main className={shell.contentWrap}>
          <div className={shell.contentPanel}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
