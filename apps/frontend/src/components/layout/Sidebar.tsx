import { Navbar, NavDropdown, Button } from 'react-bootstrap';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@hooks/useAuth';
import { cn, getInitials } from '@utils';
import { UserRole } from '@types';
import { useState, useEffect } from 'react';
import {
  House,
  Box,
  Building,
  FileBarChart,
  Database,
  User,
  List,
  X,
  Leaf,
  LogOut,
  Settings as SettingsIcon,
} from 'lucide-react';

const NAV_ITEMS = [
  { path: '/dashboard', icon: House, label: 'Dashboard', roles: [UserRole.ADMIN, UserRole.USER, UserRole.OPERATOR, UserRole.VIEWER] },
  { path: '/products', icon: Box, label: 'Produtos', roles: [UserRole.ADMIN, UserRole.USER, UserRole.OPERATOR, UserRole.VIEWER] },
  { path: '/manufacturers', icon: Building, label: 'Fabricantes', roles: [UserRole.ADMIN, UserRole.USER, UserRole.OPERATOR, UserRole.VIEWER] },
  { path: '/reports', icon: FileBarChart, label: 'Relatórios', roles: [UserRole.ADMIN, UserRole.USER, UserRole.OPERATOR] },
  { path: '/inventory', icon: List, label: 'Movimentações', roles: [UserRole.ADMIN, UserRole.USER, UserRole.OPERATOR] },
  { path: '/backup', icon: Database, label: 'Backup', roles: [UserRole.ADMIN] },
  { path: '/profile', icon: User, label: 'Perfil', roles: [UserRole.ADMIN, UserRole.USER, UserRole.OPERATOR, UserRole.VIEWER] },
  { path: '/settings', icon: SettingsIcon, label: 'Configurações', roles: [UserRole.ADMIN, UserRole.USER, UserRole.OPERATOR, UserRole.VIEWER] },
];

export function Sidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (!isMobile) {
        setIsOpen(false);
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [isMobile]);

  const filteredItems = NAV_ITEMS.filter((item) => 
    user ? item.roles.includes(user.nivel) : false
  );

  const toggleSidebar = () => setIsOpen(!isOpen);
  const closeSidebar = () => setIsOpen(false);

  return (
    <>
      <Navbar
        id="navbar-mobile"
        className={cn('navbar-mobile', 'd-lg-none', 'fixed-top', 'bg-white', 'border-bottom', 'shadow-sm', 'z-1030')}
        expand="lg"
        role="navigation"
        aria-label="Navegação mobile"
      >
        <div className="container-fluid px-3">
          <NavLink to="/dashboard" className="navbar-mobile__brand d-flex align-items-center gap-2 text-decoration-none text-dark fw-bold fs-5">
            <Leaf className="text-primary" size={24} aria-hidden="true" />
            <span>Sistema de Estoque</span>
          </NavLink>
          <Button
            id="sidebar-toggler"
            className="navbar-mobile__toggler"
            variant="ghost"
            size="sm"
            onClick={toggleSidebar}
            aria-label={isOpen ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={isOpen}
            aria-controls="sidebar"
          >
            {isOpen ? <X size={24} /> : <List size={24} />}
          </Button>
        </div>
      </Navbar>

      <div
        id="sidebar-overlay"
        className={cn('sidebar-overlay', 'fixed', 'inset-0', 'bg-dark', 'bg-opacity-50', 'z-1035', 'd-lg-none', isOpen && 'sidebar-overlay--show')}
        onClick={closeSidebar}
        aria-hidden="true"
      />

      <aside
        id="sidebar"
        className={cn(
          'sidebar',
          'fixed',
          'top-0',
          'start-0',
          'h-100',
          'bg-white',
          'border-end',
          'shadow-sm',
          'z-1040',
          'transition-all',
          'duration-250',
          'd-flex',
          'flex-column',
          isMobile ? 'sidebar--mobile' : '',
          isOpen && isMobile && 'sidebar--open',
          !isMobile && 'sidebar--desktop'
        )}
        role="navigation"
        aria-label="Navegação principal"
        style={{ width: 'var(--sidebar-width)' }}
      >
        <div className="sidebar__logo d-flex align-items-center gap-2 px-3 py-3 border-bottom">
          <Leaf className="text-primary" size={28} aria-hidden="true" />
          <span className="sidebar__logo-text fw-bold fs-5 d-none d-md-block">Sistema de Estoque</span>
        </div>

        <nav className="sidebar__nav flex-1 overflow-auto px-2 py-3">
          <ul className="sidebar__list list-unstyled" role="list">
            {filteredItems.map((item) => (
              <li key={item.path} className="sidebar__item">
                <NavLink
                  to={item.path}
                  className={cn(
                    'sidebar__link',
                    'd-flex',
                    'align-items-center',
                    'gap-3',
                    'px-3',
                    'py-2.5',
                    'rounded-3',
                    'text-decoration-none',
                    'text-dark',
                    'fw-medium',
                    'transition-all',
                    'duration-150',
                    location.pathname === item.path || 
                    (item.path !== '/dashboard' && location.pathname.startsWith(item.path))
                      ? 'sidebar__link--active bg-primary-100 text-primary'
                      : 'hover:bg-light'
                  )}
                  aria-current={location.pathname === item.path ? 'page' : undefined}
                  onClick={closeSidebar}
                >
                  <item.icon className="sidebar__icon" size={20} aria-hidden="true" />
                  <span className="sidebar__label d-none d-md-inline">{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="sidebar__user-section p-3 border-top">
          {user && (
            <NavDropdown
              title={
                <>
                  <div className="d-flex align-items-center gap-2">
                    <div
                      className="avatar rounded-circle bg-primary d-flex align-items-center justify-content-center"
                      style={{ width: '32px', height: '32px', fontSize: '12px', fontWeight: 600, color: 'white' }}
                    >
                      {getInitials(user.nome)}
                    </div>
                    <div className="d-flex flex-column">
                      <span className="fw-medium text-truncate" style={{ maxWidth: '160px' }}>{user.nome}</span>
                      <small className="text-muted text-capitalize">{getUserRoleLabel(user.nivel)}</small>
                    </div>
                  </div>
                </>
              }
              id="user-dropdown"
              className="w-100"
              align="end"
            >
              <NavDropdown.Item as={NavLink} to="/profile" onClick={closeSidebar}>
                <User className="me-2" size={16} aria-hidden="true" />
                Meu Perfil
              </NavDropdown.Item>
              <NavDropdown.Item as={NavLink} to="/settings" onClick={closeSidebar}>
                <SettingsIcon className="me-2" size={16} aria-hidden="true" />
                Configurações
              </NavDropdown.Item>
              <NavDropdown.Divider />
              <NavDropdown.Item
                onClick={async () => {
                  await logout();
                  closeSidebar();
                }}
              >
                <LogOut className="me-2" size={16} aria-hidden="true" />
                Sair
              </NavDropdown.Item>
            </NavDropdown>
          )}
        </div>
      </aside>

      <a href="#main-content" className="skip-link">
        Pular para o conteúdo principal
      </a>
    </>
  );
}

function getUserRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    admin: 'Administrador',
    operator: 'Operador',
    viewer: 'Visualizador',
  };
  return labels[role] || role;
}

export default Sidebar;