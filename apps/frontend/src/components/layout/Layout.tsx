import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { cn } from '@utils';

export function Layout() {
  return (
    <div className="app-layout d-flex min-vh-100">
      <Sidebar />
      <main
        id="main-content"
        className={cn(
          'flex-1',
          'min-vh-100',
          'bg-light',
          'transition-all',
          'duration-250',
          'ms-auto'
        )}
        style={{ width: 'calc(100% - var(--sidebar-width))' }}
      >
        <div className="p-3 p-md-4">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default Layout;