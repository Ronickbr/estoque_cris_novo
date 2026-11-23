import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { cn } from '@utils';

export function Layout() {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('cris_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('cris_sidebar_collapsed', String(next));
      } catch {
        // storage disabled or unavailable
      }
      return next;
    });
  };

  useEffect(() => {
    const currentWidth = isCollapsed ? '76px' : '260px';
    document.documentElement.style.setProperty('--sidebar-current-width', currentWidth);
  }, [isCollapsed]);

  return (
    <div className="app-layout d-flex min-vh-100">
      <Sidebar isCollapsed={isCollapsed} onToggleCollapse={toggleCollapse} />
      <main
        id="main-content"
        className={cn('layout-main-content flex-1 min-vh-100 bg-light')}
        style={{
          paddingTop: '0',
        }}
      >
        <div className="p-3 p-md-4 pt-5 pt-lg-4">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default Layout;
