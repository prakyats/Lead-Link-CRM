import { Menu, Layers } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { motion } from 'framer-motion';

interface TopNavbarProps {
  onOpenMenu: () => void;
}

export function TopNavbar({ onOpenMenu }: TopNavbarProps) {
  const { user } = useAuth();
  
  const getInitials = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return '?';
    const parts = trimmed.split(/\s+/);
    if (parts.length > 1 && parts[1][0]) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return trimmed.charAt(0).toUpperCase();
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
    <nav className="lg:hidden flex items-center justify-between px-5 h-16 sticky top-0 z-50 border-b border-white/10 backdrop-blur-md bg-[#0B1120]/80">
      <div className="flex items-center gap-3">
        <motion.button 
          whileTap={{ scale: 0.92 }}
          onClick={onOpenMenu}
          className="w-11 h-11 flex items-center justify-center rounded-xl text-muted-foreground hover:bg-white/5 transition-colors focus:outline-none"
          aria-label="Toggle mobile menu"
        >
          <Menu className="w-6 h-6" />
        </motion.button>
        
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-gradient-to-br from-[#00D4AA] to-[#6EE7B7]">
            <Layers className="w-4 h-4 text-[#0B1120]" />
          </div>
          <h1 className="text-lg font-bold tracking-tight text-white font-outfit">LeadLink</h1>
        </div>
      </div>

      {user && (
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end mr-1 hidden sm:flex">
             <span className="text-[10px] font-bold text-[#00D4AA] uppercase tracking-widest">{getRoleLabel(user.role)}</span>
          </div>
          <motion.div 
            whileTap={{ scale: 0.95 }}
            className="w-9 h-9 rounded-xl flex items-center justify-center bg-[#00D4AA]/10 border border-[#00D4AA]/20"
          >
            <span className="font-bold text-[10px] text-[#00D4AA] uppercase">
              {getInitials(user.name)}
            </span>
          </motion.div>
        </div>
      )}
    </nav>
  );
}
