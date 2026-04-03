import { Menu } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface TopNavbarProps {
  onOpenMenu: () => void;
}

export function TopNavbar({ onOpenMenu }: TopNavbarProps) {
  const { user } = useAuth();
  
  const getInitials = (name: string) => {
    const parts = name.split(' ');
    return parts.length > 1 ? `${parts[0][0]}${parts[1][0]}` : name.substring(0, 2);
  };
  
  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'Admin';
      case 'MANAGER': return 'Manager';
      case 'SALES': return 'Sales';
      default: return role;
    }
  };

  return (
    <div className="md:hidden flex items-center justify-between px-6 py-4 sticky top-0 z-30 shadow-sm" style={{ background: 'var(--crm-navy-deep)', borderBottom: '1px solid var(--crm-border)' }}>
      <div className="flex items-center gap-4">
        <button 
          onClick={onOpenMenu}
          className="p-2 -ml-2 rounded-xl text-muted-foreground hover:bg-muted/50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00D4AA]"
          aria-label="Toggle mobile menu"
        >
          <Menu className="w-6 h-6" />
        </button>
        
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #00D4AA, #6EE7B7)' }}>
            <span className="font-extrabold text-xs" style={{ color: '#0B1120' }}>LL</span>
          </div>
          <h1 className="text-lg font-bold tracking-tight" style={{ color: 'var(--crm-white)', fontFamily: 'Outfit, sans-serif' }}>LeadLink</h1>
        </div>
      </div>

      {user && (
        <div className="flex items-center gap-2">
          <span className="hidden sm:inline-block px-2 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest bg-[#00D4AA]/10 text-[#00D4AA] border border-[#00D4AA]/20">
            {getRoleLabel(user.role)}
          </span>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(0, 212, 170, 0.15)', border: '1px solid rgba(0, 212, 170, 0.2)' }}>
            <span className="font-bold text-[10px] uppercase tracking-tight" style={{ color: '#00D4AA' }}>
              {getInitials(user.name)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
