import { useState, useEffect, useCallback } from 'react';
import { Sidebar } from '../components/Sidebar';
import { 
    Shield, Users, Info, User, UserPlus, AlertCircle, 
    CheckCircle2, ChevronDown, Mail, Lock, X, Plus, 
    ShieldCheck, Target, BarChart3, Search, Eye, EyeOff, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import { validateUserForm, validateName, validateEmail, validatePassword } from '../utils/validation';

interface SystemUser {
    id: number;
    name: string;
    email: string;
    role: string;
    createdAt: string;
    manager?: { name: string };
}


const TableSkeleton = () => (
    <div className="space-y-4 animate-pulse">
        {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-4 py-4 px-6 rounded-xl bg-slate-800/20 border border-slate-800/10">
                <div className="w-10 h-10 rounded-full bg-slate-800/40" />
                <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-800/40 rounded w-1/4" />
                    <div className="h-3 bg-slate-800/40 rounded w-1/3" />
                </div>
                <div className="w-20 h-6 bg-slate-800/40 rounded-full" />
                <div className="w-24 h-4 bg-slate-800/40 rounded" />
            </div>
        ))}
    </div>
);

export default function Settings() {
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

    // User list state
    const [users, setUsers] = useState<SystemUser[]>([]);
    const [usersLoading, setUsersLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Create user form state
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'SALES', managerId: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [formLoading, setFormLoading] = useState(false);
    const [availableManagers, setAvailableManagers] = useState<{id: number, name: string}[]>([]);


    const riskThresholds = [
        { level: 'High Risk', criteria: 'Last interaction >= 7 days', color: '#F87171', bg: 'rgba(239,68,68,0.1)', icon: AlertCircle },
        { level: 'Medium Risk', criteria: 'Last interaction 3-6 days', color: '#FBBF24', bg: 'rgba(245,158,11,0.1)', icon: Info },
        { level: 'Low Risk', criteria: 'Last interaction < 3 days', color: '#4ADE80', bg: 'rgba(74,222,128,0.1)', icon: CheckCircle2 },
    ];

    const fetchUsers = useCallback(async () => {
        try {
            setUsersLoading(true);
            const response = await api.get('/users');
            setUsers(response.data);
            
            // If admin, fetch potential managers for assignment
            if (user?.role === 'ADMIN') {
                const managersResponse = await api.get('/users/sales'); // This returns MANAGER + SALES
                setAvailableManagers(managersResponse.data.filter((u: any) => u.role === 'MANAGER'));
            }
        } catch (error: any) {
            toast.error('Failed to sync user directory');
            console.error('Failed to fetch users:', error);
        } finally {
            setUsersLoading(false);
        }
    }, [user?.role]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);


    const validateForm = () => {
        const errors = validateUserForm({
            name: formData.name,
            email: formData.email,
            password: formData.password,
        });
        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleFieldBlur = (field: 'name' | 'email' | 'password') => {
        if (field === 'name') {
            const err = validateName(formData.name, 'Full name');
            setFieldErrors(prev => ({ ...prev, name: err || '' }));
        } else if (field === 'email') {
            const err = validateEmail(formData.email);
            setFieldErrors(prev => ({ ...prev, email: err || '' }));
        } else if (field === 'password') {
            const err = validatePassword(formData.password);
            setFieldErrors(prev => ({ ...prev, password: err || '' }));
        }
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;

        setFormLoading(true);
        try {
            await api.post('/users', {
                ...formData,
                managerId: formData.managerId ? parseInt(formData.managerId) : undefined
            });
            toast.success('User Provisioned Successfully', {
                description: `${formData.name} has been added to the system.`
            });
            setFormData({ name: '', email: '', password: '', role: 'SALES', managerId: '' });
            setShowCreateForm(false);
            fetchUsers();
        } catch (error: any) {

            const errorMsg = error.response?.data?.error || 'System failed to create user';
            toast.error('Provisions Failed', { description: errorMsg });
            if (errorMsg.toLowerCase().includes('email')) {
                setFieldErrors({ email: 'Email already in use' });
            }
        } finally {
            setFormLoading(false);
        }
    };

    const filteredUsers = users.filter(u => 
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        u.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const roleColors: Record<string, { bg: string; color: string; icon: any }> = {
        ADMIN: { bg: 'rgba(0,212,170,0.15)', color: '#00D4AA', icon: ShieldCheck },
        MANAGER: { bg: 'rgba(139,92,246,0.15)', color: '#A78BFA', icon: Target },
        SALES: { bg: 'rgba(245,158,11,0.15)', color: '#FBBF24', icon: BarChart3 },
    };

    const inputClasses = (fieldName: string) => `
        w-full px-4 py-2.5 rounded-xl text-sm transition-all duration-300 outline-none
        ${fieldErrors[fieldName] 
            ? 'border-red-500/40 bg-red-500/5 ring-4 ring-red-500/10' 
            : 'border-border bg-muted/10 hover:bg-muted/20 focus:border-[#00D4AA] focus:ring-4 focus:ring-[#00D4AA]/10 focus:bg-background'
        }
        border text-foreground placeholder:text-muted-foreground/50
    `;

    return (
        <div className="flex flex-col md:flex-row h-screen overflow-hidden bg-background text-foreground">
            <Sidebar />
            <main className="flex-1 min-w-0 overflow-y-auto custom-scrollbar">
                <div className="p-8 max-w-5xl mx-auto">
                    <header className="mb-10">
                        <div className="flex items-center gap-2 text-[#00D4AA] mb-2 font-mono text-xs tracking-widest uppercase">
                            <Shield className="w-4 h-4" />
                            System Administration
                        </div>
                        <h1 className="text-4xl font-bold tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>Settings</h1>
                        <p className="mt-2 text-muted-foreground">Manage your organization's infrastructure and team directory</p>
                    </header>

                    <div className="space-y-8">
                        {/* User Management Section */}
                        <section className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                            <div className="p-6 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-[#00D4AA]/10 flex items-center justify-center text-[#00D4AA]">
                                        <Users className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold">Team Directory</h2>
                                        <p className="text-xs text-muted-foreground">{users.length} Active System Nodes</p>
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full md:w-auto">
                                    <div className="relative group w-full sm:w-auto">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-[#00D4AA] transition-colors" />
                                        <input 
                                            type="text" 
                                            placeholder="Search directory..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="pl-9 pr-4 py-2 bg-muted/50 border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-[#00D4AA]/50 w-full sm:w-48 md:w-64 transition-all"
                                        />
                                    </div>
                                    <button 
                                        onClick={() => setShowCreateForm(true)}
                                        className="px-4 py-2 bg-[#00D4AA] text-primary-foreground rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-[#00D4AA]/90 transition-all"
                                    >
                                        <Plus className="w-4 h-4" />
                                        <span>{user?.role === 'MANAGER' ? 'Add Sales Exec' : 'Provision User'}</span>
                                    </button>
                                </div>
                            </div>

                            <AnimatePresence>
                                {showCreateForm && (
                                    <motion.div 
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="border-b border-border bg-muted/20"
                                    >
                                        <div className="p-6">
                                            <div className="flex items-center justify-between mb-6">
                                                <h3 className="font-bold text-[#00D4AA] flex items-center gap-2">
                                                    <Plus className="w-4 h-4" />
                                                    {user?.role === 'MANAGER' ? 'Expand Your Force' : 'Initialize New Node'}
                                                </h3>

                                                <button onClick={() => setShowCreateForm(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                                                    <X className="w-5 h-5" />
                                                </button>
                                            </div>

                                            <form onSubmit={handleCreateUser} className="space-y-6">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div className="space-y-2">
                                                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Full Identity</label>
                                                        <input 
                                                            className={inputClasses('name')}
                                                            value={formData.name}
                                                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                                                            onBlur={() => handleFieldBlur('name')}
                                                            placeholder="e.g. Satoshi Nakamoto"
                                                            maxLength={50}
                                                        />
                                                        {fieldErrors.name && <p className="text-red-400 text-xs ml-1 mt-1">{fieldErrors.name}</p>}
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Encrypted Email</label>
                                                        <input 
                                                            className={inputClasses('email')}
                                                            type="email"
                                                            value={formData.email}
                                                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                                                            onBlur={() => handleFieldBlur('email')}
                                                            placeholder="identity@leadlink.com"
                                                            maxLength={100}
                                                        />
                                                        {fieldErrors.email && <p className="text-red-400 text-xs ml-1 mt-1">{fieldErrors.email}</p>}
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Access Token (Password)</label>
                                                        <div className="relative">
                                                            <input 
                                                                className={inputClasses('password')}
                                                                type={showPassword ? "text" : "password"}
                                                                value={formData.password}
                                                                onChange={(e) => setFormData({...formData, password: e.target.value})}
                                                                onBlur={() => handleFieldBlur('password')}
                                                                placeholder="••••••••"
                                                                maxLength={100}
                                                            />
                                                            <button 
                                                                type="button"
                                                                onClick={() => setShowPassword(!showPassword)}
                                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-[#00D4AA] transition-colors"
                                                            >
                                                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                            </button>
                                                        </div>
                                                        {fieldErrors.password && <p className="text-red-400 text-xs ml-1">{fieldErrors.password}</p>}
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Access Clearance (Role)</label>
                                                        <div className="relative">
                                                            <select 
                                                                className={inputClasses('role')}
                                                                style={{ appearance: 'none' }}
                                                                value={formData.role}
                                                                disabled={user?.role === 'MANAGER'}
                                                                onChange={(e) => setFormData({...formData, role: e.target.value})}
                                                            >
                                                                <option value="SALES">SALES - Frontline Operations</option>
                                                                {user?.role === 'ADMIN' && <option value="MANAGER">MANAGER - Oversight Control</option>}
                                                                {user?.role === 'ADMIN' && <option value="ADMIN">ADMIN - Full Core Access</option>}
                                                            </select>
                                                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                                                        </div>
                                                    </div>

                                                    {user?.role === 'ADMIN' && formData.role === 'SALES' && (
                                                        <div className="space-y-2">
                                                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Team Leader (Manager)</label>
                                                            <div className="relative">
                                                                <select 
                                                                    className={inputClasses('role')}
                                                                    style={{ appearance: 'none' }}
                                                                    value={formData.managerId}
                                                                    onChange={(e) => setFormData({...formData, managerId: e.target.value})}
                                                                >
                                                                    <option value="">Unassigned (Solitary Node)</option>
                                                                    {availableManagers.map(m => (
                                                                        <option key={m.id} value={m.id}>{m.name}</option>
                                                                    ))}
                                                                </select>
                                                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex justify-end gap-3 pt-4 border-t border-border">
                                                    <button 
                                                        type="button" 
                                                        onClick={() => setShowCreateForm(false)}
                                                        className="px-6 py-2.5 rounded-xl text-sm text-muted-foreground hover:bg-muted transition-colors font-bold"
                                                    >
                                                        Discard
                                                    </button>
                                                    <button 
                                                        type="submit" 
                                                        disabled={formLoading}
                                                        className="px-8 py-2.5 rounded-xl text-sm font-bold bg-[#00D4AA] text-primary-foreground disabled:opacity-50 flex items-center gap-2"
                                                    >
                                                        {formLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                                                        Generate Node
                                                    </button>
                                                </div>
                                            </form>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="p-6">
                                {usersLoading ? (
                                    <TableSkeleton />
                                ) : (
                                    <div className="space-y-2">
                                        <AnimatePresence initial={false}>
                                            {filteredUsers.map((u, idx) => {
                                                const rc = roleColors[u.role] || roleColors.SALES;
                                                const RoleIcon = rc.icon;
                                                return (
                                                    <motion.div 
                                                        layout
                                                        key={u.id}
                                                        initial={{ opacity: 0, scale: 0.98 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-6 py-4 rounded-2xl bg-muted/10 border border-border hover:border-[#00D4AA]/30 hover:bg-[#00D4AA]/[0.02] transition-all group"
                                                    >
                                                        <div className="flex items-center justify-between w-full md:w-auto md:flex-1">
                                                            <div className="flex items-center gap-4 min-w-0">
                                                                <div 
                                                                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-bold text-foreground relative flex-shrink-0"
                                                                    style={{ background: 'var(--crm-teal-glow)', border: '1px solid var(--crm-border)' }}
                                                                >
                                                                    {getInitials(u.name)}
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <h4 className="font-bold text-foreground truncate text-sm">{u.name}</h4>
                                                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                                        <Mail className="w-3 h-3 flex-shrink-0" />
                                                                        <span className="truncate">{u.email}</span>
                                                                        {u.manager && (
                                                                            <>
                                                                                <span className="mx-1 opacity-50">•</span>
                                                                                <span className="text-[#00D4AA]/70 font-bold truncate">REPORTING TO: {u.manager.name}</span>
                                                                            </>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Mobile Dot */}
                                                            <div className="md:hidden inline-block w-2 h-2 rounded-full bg-[#00D4AA]" />
                                                        </div>
                                                        
                                                        <div className="flex items-center justify-between md:justify-end gap-4 sm:gap-6 w-full md:w-auto pt-2 md:pt-0 border-t border-border md:border-0">
                                                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest shrink-0"
                                                                style={{ background: rc.bg, color: rc.color }}>
                                                                <RoleIcon className="w-3.5 h-3.5" />
                                                                {u.role}
                                                            </div>

                                                            <div className="flex items-center gap-4 shrink-0">
                                                                <span className="text-xs font-mono text-muted-foreground">
                                                                    {new Date(u.createdAt).toLocaleDateString('en-US', { 
                                                                        month: 'short', day: 'numeric', year: 'numeric' 
                                                                    }).toUpperCase()}
                                                                </span>
                                                                {/* Desktop Dot */}
                                                                <div className="hidden md:inline-block w-2 h-2 rounded-full bg-[#00D4AA]" />
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                );
                                            })}
                                        </AnimatePresence>
                                        {filteredUsers.length === 0 && (
                                            <div className="text-center py-20 bg-muted/10 border border-dashed border-border rounded-3xl">
                                                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                                                <p className="text-muted-foreground text-sm font-medium">No system nodes found matching your criteria</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </section>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {riskThresholds.map((rule) => (
                                <div key={rule.level} className="flex-1 p-4 rounded-2xl border border-border" style={{ background: rule.bg }}>
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-background shadow-sm">
                                            <rule.icon className="w-4 h-4" style={{ color: rule.color }} />
                                        </div>
                                        <h3 className="font-bold text-foreground mb-0">{rule.level}</h3>
                                    </div>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#00D4AA] opacity-70 mb-1">Trigger Criteria</p>
                                    <p className="text-xs font-medium text-foreground opacity-90">{rule.criteria}</p>
                                </div>
                            ))}
                        </div>
                        
                        <div className="bg-card border border-border rounded-2xl p-6 flex flex-col items-center text-center group transition-all hover:border-[#00D4AA]/30">
                            <div className="w-12 h-12 rounded-xl bg-[#00D4AA] flex items-center justify-center text-primary-foreground font-black group-hover:scale-110 transition-transform">
                                LL
                            </div>
                            <div className="mt-4">
                                <h4 className="text-sm font-bold text-foreground tracking-wide uppercase">Active Administrator</h4>
                                <p className="text-xs text-muted-foreground mt-1">{user?.email}</p>
                            </div>
                            <div className="mt-6 pt-6 border-t border-border w-full">
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Authority Level</p>
                                <p className="text-xs font-bold text-foreground mt-1 uppercase tracking-widest">{user?.role}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
