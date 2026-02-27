import { Link, useLocation } from 'react-router';
import { LayoutDashboard, Users, Columns3, CheckSquare, BarChart3, Settings, LogOut, ChevronRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { hasPermission } from '../utils/permissions';
import { Role } from '../utils/roles';
import { ThemeToggle } from './ThemeToggle';

interface MenuItem {
  icon: typeof LayoutDashboard;
  label: string;
  path: string;
  permission: 'canViewReports' | 'canManageSettings' | 'canSeeAllLeads' | 'isAlwaysVisible';
}

const MENU_ITEMS: MenuItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard', permission: 'isAlwaysVisible' },
  { icon: Users, label: 'Leads', path: '/leads', permission: 'isAlwaysVisible' },
  { icon: Columns3, label: 'Kanban Pipeline', path: '/kanban', permission: 'isAlwaysVisible' },
  { icon: CheckSquare, label: 'Tasks', path: '/tasks', permission: 'isAlwaysVisible' },
  { icon: BarChart3, label: 'Reports', path: '/reports', permission: 'canViewReports' },
  { icon: Settings, label: 'Settings', path: '/settings', permission: 'canManageSettings' },
];

export function Sidebar() {
  const location = useLocation();
  const { user, logout } = useAuth();

  const getInitials = (name: string) => {
    const parts = name.split(' ');
    return parts.length > 1 ? `${parts[0][0]}${parts[1][0]}` : name.substring(0, 2);
  };

  const visibleMenuItems = MENU_ITEMS.filter(item => {
    if (item.permission === 'isAlwaysVisible') return true;
    return hasPermission(user?.role as Role, item.permission);
  });

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'System Admin';
      case 'MANAGER': return 'Team Manager';
      case 'SALES': return 'Sales Executive';
      default: return role;
    }
  };

  return (
    <div
      className="w-64 h-screen flex flex-col sticky top-0"
      style={{ background: 'var(--crm-navy-deep)', borderRight: '1px solid var(--crm-border)' }}
    >
      <div className="p-8">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #00D4AA, #6EE7B7)' }}>
              <span className="font-extrabold text-sm" style={{ color: '#0B1120' }}>LL</span>
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight" style={{ color: 'var(--crm-white)', fontFamily: 'Outfit, sans-serif' }}>Lead Link</h1>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#00D4AA' }}></span>
                <span className="text-[10px] font-bold uppercase tracking-widest leading-none" style={{ color: 'var(--crm-muted-dim)' }}>Enterprise</span>
              </div>
            </div>
          </div>

          <ThemeToggle
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
            style={{
              background: 'rgba(148, 163, 184, 0.06)',
              border: '1px solid var(--crm-border)',
              color: 'var(--crm-white)',
            }}
            aria-label="Toggle theme"
          />
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        <div className="px-4 mb-4">
          <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--crm-muted-dim)' }}>Main Menu</p>
        </div>
        <ul className="space-y-1">
          {visibleMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className="flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group"
                  style={isActive ? {
                    background: 'linear-gradient(135deg, #00D4AA, #00B894)',
                    color: '#0B1120',
                    boxShadow: '0 4px 24px rgba(0, 212, 170, 0.25)',
                  } : {
                    color: 'var(--crm-muted)',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'rgba(148, 163, 184, 0.06)';
                      e.currentTarget.style.color = '#00D4AA';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = '#94A3B8';
                    }
                  }}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-5 h-5 transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                    <span className="font-bold text-sm tracking-tight">{item.label}</span>
                  </div>
                  {isActive && <ChevronRight className="w-4 h-4 opacity-50" />}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4" style={{ borderTop: '1px solid var(--crm-border)' }}>
        {user && (
          <div className="rounded-2xl p-4" style={{ background: 'var(--crm-glass)', border: '1px solid var(--crm-border)' }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(0, 212, 170, 0.15)', border: '1px solid rgba(0, 212, 170, 0.2)' }}>
                <span className="font-bold text-xs uppercase tracking-tight" style={{ color: '#00D4AA' }}>
                  {getInitials(user.name)}
                </span>
              </div>
              <div className="min-w-0">
                <p className="font-bold text-sm truncate leading-tight" style={{ color: 'var(--crm-white)' }}>{user.name}</p>
                <p className="text-[10px] font-bold uppercase tracking-widest mt-0.5" style={{ color: '#00D4AA' }}>
                  {getRoleLabel(user.role)}
                </p>
              </div>
            </div>

            <button
              onClick={logout}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all active:scale-95"
              style={{ color: '#F87171', border: '1px solid transparent' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.2)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; }}
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
