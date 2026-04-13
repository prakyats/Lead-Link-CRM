import { Link, useLocation } from 'react-router';
import { 
  LayoutDashboard, Users, Columns3, CheckSquare, 
  BarChart3, Settings, LogOut, Users2, Layers,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { hasPermission } from '../../utils/permissions';
import { Role } from '../../utils/roles';
import { ThemeToggle } from '../ThemeToggle';

interface MenuItem {
  icon: typeof LayoutDashboard;
  label: string;
  path: string;
  permission: keyof Permissions | 'isAlwaysVisible';
  desktopRecommended?: boolean;
}

const MENU_ITEMS: MenuItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard', permission: 'isAlwaysVisible' },
  { icon: Users, label: 'Leads', path: '/leads', permission: 'isAlwaysVisible' },
  { icon: BarChart3, label: 'Team Insights', path: '/team-insights', permission: 'canViewTeamInsights' },
  { icon: Columns3, label: 'Kanban Pipeline', path: '/kanban', permission: 'canManagePipeline', desktopRecommended: true },
  { icon: CheckSquare, label: 'Tasks', path: '/tasks', permission: 'isAlwaysVisible' },
  { icon: BarChart3, label: 'Reports', path: '/reports', permission: 'canViewReports', desktopRecommended: true },
  { icon: Users2, label: 'Team', path: '/team', permission: 'canShowTeamOversight' },
  { icon: Settings, label: 'Settings', path: '/settings', permission: 'canManageSettings' },
];

import { Permissions } from '../../utils/permissions';

interface SidebarContentProps {
  onClose?: () => void;
}

export function SidebarContent({ onClose }: SidebarContentProps) {
  const location = useLocation();
  const { user, logout } = useAuth();

  const getInitials = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return '?';
    const parts = trimmed.split(/\s+/);
    if (parts.length > 1 && parts[1][0]) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return trimmed.charAt(0).toUpperCase();
  };

  const visibleMenuItems = MENU_ITEMS.filter(item => {
    if (item.permission === 'isAlwaysVisible') return true;
    return hasPermission(user?.role as Role, item.permission);
  });

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'ADMIN';
      case 'MANAGER': return 'TEAM MANAGER';
      case 'SALES': return 'SALES AGENT';
      default: return role.toUpperCase();
    }
  };

  return (
    <div className="flex flex-col h-full bg-card border-r border-border text-foreground p-5 md:p-6 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute -top-24 -left-24 w-64 h-64 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Header Section */}
      <div className="flex items-center justify-between mb-8 relative z-10">
        <Link to="/" className="flex items-center gap-3">
          <div className="crm-sidebar-logo-square !w-10 !h-10 text-lg">
            <span className="mb-0.5">LL</span>
          </div>
          <div className="flex flex-col">
            <h1 className="text-lg font-extrabold tracking-tight leading-none">Lead Link</h1>
            <div className="flex items-center gap-1 mt-1">
              <div className="w-1 h-1 rounded-full bg-primary" />
              <span className="text-[9px] font-black tracking-[0.2em] text-muted-foreground uppercase">Enterprise</span>
            </div>
          </div>
        </Link>
        <ThemeToggle className="w-9 h-9 rounded-full bg-muted border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-all hover:bg-accent" />
      </div>

      {/* Menu Section */}
      <div className="flex-1 relative z-10 overflow-y-auto custom-scrollbar pr-1">
        <h3 className="crm-sidebar-label">Main Menu</h3>
        
        <nav className="space-y-1.5">
          {visibleMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={`
                  group flex items-center justify-between px-4 py-3.5 rounded-xl transition-all duration-300
                  ${isActive ? 'crm-sidebar-active' : 'crm-sidebar-inactive'}
                `}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4.5 h-4.5 ${isActive ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-foreground'}`} />
                  <span className="text-[13px] font-bold tracking-tight">{item.label}</span>
                </div>
                {isActive && <ChevronRight className="w-3.5 h-3.5 opacity-60" />}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User Card Section */}
      <div className="mt-6 relative z-10">
        {user && (
          <div className="crm-sidebar-user-card !p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="crm-sidebar-avatar !w-10 !h-10 !text-base">
                {getInitials(user.name)}
              </div>
              <div className="min-w-0">
                <p className="text-[13px] font-bold truncate leading-tight mb-0.5">{user.name}</p>
                <p className="text-[9px] font-black tracking-[0.1em] text-primary uppercase opacity-80">
                  {getRoleLabel(user.role)}
                </p>
              </div>
            </div>
            
            <button
              onClick={() => {
                onClose?.();
                logout();
              }}
              className="crm-sidebar-signout w-full !mt-3 !pt-3"
            >
              <LogOut size={14} />
              <span>Sign Out</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}



