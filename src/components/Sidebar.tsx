import { Link, useLocation } from 'react-router';
import { LayoutDashboard, Users, Columns3, CheckSquare, BarChart3, Settings, LogOut, Shield, ChevronRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { hasPermission } from '../utils/permissions';
import { Role } from '../utils/roles';

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
    <div className="w-64 bg-white border-r border-gray-100 h-screen flex flex-col sticky top-0">
      <div className="p-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">Lead Link</h1>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Enterprise</span>
            </div>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        <div className="px-4 mb-4">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Main Menu</p>
        </div>
        <ul className="space-y-1">
          {visibleMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group ${isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-100'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-blue-600'
                    }`}
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

      <div className="p-4 border-t border-gray-50">
        {user && (
          <div className="bg-gray-50/50 rounded-2xl p-4 border border-gray-100 ring-1 ring-black/5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-white shadow-sm border border-gray-100 rounded-xl flex items-center justify-center">
                <span className="text-blue-600 font-bold text-xs uppercase tracking-tight">
                  {getInitials(user.name)}
                </span>
              </div>
              <div className="min-w-0">
                <p className="font-bold text-gray-900 text-sm truncate leading-tight">{user.name}</p>
                <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mt-0.5">
                  {getRoleLabel(user.role)}
                </p>
              </div>
            </div>
            <button
              onClick={logout}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl transition-all border border-transparent hover:border-red-100 active:scale-95"
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
