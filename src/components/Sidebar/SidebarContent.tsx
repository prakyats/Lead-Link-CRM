import { Link, useLocation } from 'react-router';
import { 
  LayoutDashboard, Users, Columns3, CheckSquare, 
  BarChart3, Settings, LogOut, Users2, Layers
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { hasPermission } from '../../utils/permissions';
import { Role } from '../../utils/roles';
import { ThemeToggle } from '../ThemeToggle';

interface MenuItem {
  icon: typeof LayoutDashboard;
  label: string;
  path: string;
  permission: 'canViewReports' | 'canManageSettings' | 'canSeeAllLeads' | 'isAlwaysVisible' | 'canShowTeamOversight';
  desktopRecommended?: boolean;
}

const MENU_ITEMS: MenuItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard', permission: 'isAlwaysVisible' },
  { icon: Users, label: 'Leads', path: '/leads', permission: 'isAlwaysVisible' },
  { icon: Columns3, label: 'Kanban', path: '/kanban', permission: 'isAlwaysVisible', desktopRecommended: true },
  { icon: Users2, label: 'Team', path: '/team', permission: 'canShowTeamOversight' },
  { icon: CheckSquare, label: 'Tasks', path: '/tasks', permission: 'isAlwaysVisible' },
  { icon: BarChart3, label: 'Reports', path: '/reports', permission: 'canViewReports', desktopRecommended: true },
  { icon: Settings, label: 'Settings', path: '/settings', permission: 'canManageSettings' },
];

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
      case 'ADMIN': return 'Admin';
      case 'MANAGER': return 'Manager';
      case 'SALES': return 'Sales';
      default: return role;
    }
  };

  return (
    <div className="flex flex-col h-full bg-card border-r border-border">
      <div className="p-6">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Layers size={20} className="text-primary-foreground" />
          </div>
          <h1 className="text-xl font-bold text-foreground">LeadLink</h1>
        </Link>
      </div>

      <nav className="flex-1 px-4 space-y-1 overflow-y-auto custom-scrollbar">
        {visibleMenuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors
                ${isActive 
                  ? 'bg-primary/10 text-primary font-medium' 
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'}
              `}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border">
        {user && (
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium flex-shrink-0">
              {getInitials(user.name)}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground truncate">{getRoleLabel(user.role)}</p>
            </div>
          </div>
        )}
        <div className="flex gap-2">
          <ThemeToggle
            className="flex-1 h-9 rounded-md flex items-center justify-center border border-input bg-background hover:bg-muted hover:text-foreground transition-colors text-muted-foreground"
            aria-label="Toggle theme"
          />
          <button
            onClick={() => {
              onClose?.();
              logout();
            }}
            className="flex-1 flex items-center justify-center gap-2 h-9 border border-input bg-background hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/20 text-muted-foreground rounded-md transition-colors"
            title="Log out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
