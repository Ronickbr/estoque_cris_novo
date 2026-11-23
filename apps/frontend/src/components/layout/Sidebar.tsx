import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@hooks/useAuth';
import { cn, getInitials } from '@utils';
import { UserRole } from '@types';
import { useState, useEffect, useId } from 'react';
import './Sidebar.css';
import {
  House,
  Box,
  Building,
  FileBarChart,
  Database,
  User,
  List,
  X,
  LogOut,
  Settings as SettingsIcon,
  PanelLeftClose,
  PanelLeftOpen,
  Layers,
  Sparkles,
} from 'lucide-react';

interface NavSection {
  title: string;
  items: {
    path: string;
    icon: typeof House;
    label: string;
    roles: UserRole[];
    badge?: string;
  }[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Principal',
    items: [
      {
        path: '/dashboard',
        icon: House,
        label: 'Dashboard',
        roles: [UserRole.ADMIN, UserRole.USER, UserRole.OPERATOR, UserRole.VIEWER],
      },
    ],
  },
  {
    title: 'Gestão',
    items: [
      {
        path: '/products',
        icon: Box,
        label: 'Produtos',
        roles: [UserRole.ADMIN, UserRole.USER, UserRole.OPERATOR, UserRole.VIEWER],
      },
      {
        path: '/manufacturers',
        icon: Building,
        label: 'Fabricantes',
        roles: [UserRole.ADMIN, UserRole.USER, UserRole.OPERATOR, UserRole.VIEWER],
      },
      {
        path: '/inventory',
        icon: List,
        label: 'Movimentações',
        roles: [UserRole.ADMIN, UserRole.USER, UserRole.OPERATOR],
      },
      {
        path: '/reports',
        icon: FileBarChart,
        label: 'Relatórios',
        roles: [UserRole.ADMIN, UserRole.USER, UserRole.OPERATOR],
      },
    ],
  },
  {
    title: 'Sistema',
    items: [
      {
        path: '/backup',
        icon: Database,
        label: 'Backup',
        roles: [UserRole.ADMIN],
      },
      {
        path: '/profile',
        icon: User,
        label: 'Perfil',
        roles: [UserRole.ADMIN, UserRole.USER, UserRole.OPERATOR, UserRole.VIEWER],
      },
      {
        path: '/settings',
        icon: SettingsIcon,
        label: 'Configurações',
        roles: [UserRole.ADMIN, UserRole.USER, UserRole.OPERATOR, UserRole.VIEWER],
      },
    ],
  },
];

interface SidebarProps {
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function Sidebar({ isCollapsed = false, onToggleCollapse }: SidebarProps) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const tooltipPrefixId = useId();

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 992;
      setIsMobile(mobile);
      if (!mobile) {
        setIsMobileOpen(false);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const closeMobile = () => setIsMobileOpen(false);
  const toggleMobile = () => setIsMobileOpen(!isMobileOpen);

  let globalSiblingCounter = 0;

  return (
    <>
      {/* Mobile Top Header */}
      <header
        className="navbar-mobile d-lg-none fixed-top d-flex align-items-center justify-content-between px-3 z-1030 shadow-sm"
        role="banner"
      >
        <NavLink to="/dashboard" className="navbar-mobile__brand d-flex align-items-center gap-2 text-decoration-none">
          <div className="sidebar__logo-badge" style={{ width: '32px', height: '32px', minWidth: '32px' }}>
            <Layers size={18} />
          </div>
          <span className="fw-bold fs-6 text-white">CrisEstoque</span>
        </NavLink>
        <button
          type="button"
          className="btn btn-sm text-white p-2 border-0 bg-transparent"
          onClick={toggleMobile}
          aria-label={isMobileOpen ? 'Fechar menu lateral' : 'Abrir menu lateral'}
          aria-expanded={isMobileOpen}
          aria-controls="app-sidebar"
        >
          {isMobileOpen ? <X size={24} /> : <List size={24} />}
        </button>
      </header>

      {/* Mobile Backdrop Overlay */}
      <div
        className={cn('sidebar-overlay d-lg-none', isMobileOpen && 'sidebar-overlay--show')}
        onClick={closeMobile}
        aria-hidden="true"
      />

      {/* Lateral Sidebar Navigation */}
      <aside
        id="app-sidebar"
        className={cn(
          'sidebar',
          isCollapsed && !isMobile && 'sidebar--collapsed',
          isMobile && isMobileOpen && 'sidebar--mobile-open'
        )}
        role="navigation"
        aria-label="Menu principal"
      >
        {/* Brand Header */}
        <div className="sidebar__header">
          <NavLink to="/dashboard" className="sidebar__brand" onClick={closeMobile}>
            <div className="sidebar__logo-badge" aria-hidden="true">
              <Layers size={20} />
            </div>
            <div className="sidebar__brand-text">
              <span className="sidebar__brand-title d-flex align-items-center gap-1.5">
                CrisEstoque
                <Sparkles size={13} className="text-primary" />
              </span>
              <span className="sidebar__brand-subtitle">Gestão Inteligente</span>
            </div>
          </NavLink>

          {/* Desktop Collapse Toggle Button */}
          {onToggleCollapse && !isMobile && (
            <button
              type="button"
              className="sidebar__toggle-btn d-none d-lg-flex"
              onClick={onToggleCollapse}
              aria-label={isCollapsed ? 'Expandir barra lateral' : 'Recolher barra lateral'}
              title={isCollapsed ? 'Expandir barra lateral' : 'Recolher barra lateral'}
            >
              {isCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
            </button>
          )}

          {/* Mobile Close Button */}
          {isMobile && (
            <button
              type="button"
              className="sidebar__toggle-btn d-lg-none text-white"
              onClick={closeMobile}
              aria-label="Fechar menu lateral"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Navigation Sections */}
        <nav className="sidebar__nav" role="navigation" aria-label="Navegação do sistema">
          {NAV_SECTIONS.map((section, sIndex) => {
            const visibleItems = section.items.filter((item) =>
              user ? item.roles.includes(user.nivel) : false
            );

            if (visibleItems.length === 0) return null;

            return (
              <div key={section.title} className="sidebar__section">
                {!isCollapsed && (
                  <div className="sidebar__section-title">{section.title}</div>
                )}
                {isCollapsed && sIndex > 0 && <div className="sidebar__section-divider" />}

                <ul className="list-unstyled mb-0" role="list">
                  {visibleItems.map((item) => {
                    globalSiblingCounter += 1;
                    const siblingIdx = globalSiblingCounter;
                    const isActive =
                      location.pathname === item.path ||
                      (item.path !== '/dashboard' && location.pathname.startsWith(item.path));

                    const linkContent = (
                      <NavLink
                        to={item.path}
                        className={cn('sidebar__link', isActive && 'sidebar__link--active')}
                        onClick={closeMobile}
                        aria-current={isActive ? 'page' : undefined}
                      >
                        <item.icon className="sidebar__icon" aria-hidden="true" />
                        <span className="sidebar__label">{item.label}</span>
                        {isActive && !isCollapsed && <span className="sidebar__active-pip" aria-hidden="true" />}
                      </NavLink>
                    );

                    return (
                      <li
                        key={item.path}
                        className="sidebar__item"
                        style={{ '--sibling-index': siblingIdx } as React.CSSProperties}
                      >
                        {isCollapsed && !isMobile ? (
                          <OverlayTrigger
                            placement="right"
                            delay={{ show: 150, hide: 100 }}
                            overlay={
                              <Tooltip id={`${tooltipPrefixId}-${item.path.replace('/', '')}`}>
                                {item.label}
                              </Tooltip>
                            }
                          >
                            <div>{linkContent}</div>
                          </OverlayTrigger>
                        ) : (
                          linkContent
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </nav>

        {/* User Profile Footer */}
        <div className="sidebar__footer">
          {user && (
            <div className="sidebar__user-card">
              {isCollapsed && !isMobile ? (
                <OverlayTrigger
                  placement="right"
                  delay={{ show: 150, hide: 100 }}
                  overlay={
                    <Tooltip id={`${tooltipPrefixId}-user-card`}>
                      {user.nome} ({getUserRoleLabel(user.nivel)})
                    </Tooltip>
                  }
                >
                  <div className="sidebar__avatar-wrap">
                    <div className="sidebar__avatar">{getInitials(user.nome)}</div>
                    <span className="sidebar__status-dot" aria-label="Online" />
                  </div>
                </OverlayTrigger>
              ) : (
                <div className="sidebar__avatar-wrap">
                  <div className="sidebar__avatar">{getInitials(user.nome)}</div>
                  <span className="sidebar__status-dot" aria-label="Online" />
                </div>
              )}

              <div className="sidebar__user-info">
                <span className="sidebar__user-name" title={user.nome}>
                  {user.nome}
                </span>
                <span className="sidebar__user-role">{getUserRoleLabel(user.nivel)}</span>
              </div>

              <div className="sidebar__user-actions">
                <NavLink
                  to="/settings"
                  className="sidebar__action-btn"
                  title="Configurações"
                  aria-label="Configurações"
                  onClick={closeMobile}
                >
                  <SettingsIcon size={15} />
                </NavLink>

                <button
                  type="button"
                  className="sidebar__action-btn sidebar__action-btn--logout"
                  title="Encerrar sessão"
                  aria-label="Encerrar sessão"
                  onClick={async () => {
                    await logout();
                    closeMobile();
                  }}
                >
                  <LogOut size={15} />
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Accessible skip link */}
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
    user: 'Usuário',
  };
  return labels[role] || role;
}

export default Sidebar;
