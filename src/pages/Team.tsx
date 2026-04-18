import { useState, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Sidebar } from '../components/Sidebar';
import { 
    Users, UserPlus, Mail, ShieldCheck, Target, 
    BarChart3, Search, Eye, EyeOff, Loader2, X, Plus,
    ChevronDown, Calendar, Shield, Activity, Zap, CheckCircle2, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import { validateUserForm } from '../utils/validation';
import { useSearchParams } from 'react-router';

interface SystemUser {
    id: number;
    name: string;
    email: string;
    role: string;
    createdAt: string;
    manager?: { name: string };
}

export default function Team() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [searchParams] = useSearchParams();
    
    // UI State
    const [users, setUsers] = useState<SystemUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState<'all' | 'sales' | 'nonSales'>('all');
    const [showCreateModal, setShowCreateModal] = useState(false);
    
    // Form State
    const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'SALES', managerId: '' });
    const [formLoading, setFormLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [availableManagers, setAvailableManagers] = useState<{id: number, name: string}[]>([]);

    const fetchUsers = useCallback(async () => {
        try {
            setLoading(true);
            const response = await api.get('/users');
            setUsers(response.data);
            
            if (user?.role === 'ADMIN') {
                const managersResponse = await api.get('/users/sales');
                setAvailableManagers(managersResponse.data.filter((u: any) => u.role === 'MANAGER'));
            }
        } catch (error: any) {
            toast.error('Registry Sync Failed', {
                description: 'Unable to synchronize with the personnel database.'
            });
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [user?.role]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    useEffect(() => {
        if (searchParams.get('add') === 'true') {
            setShowCreateModal(true);
        }
    }, [searchParams]);

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const errors = validateUserForm({
            name: formData.name,
            email: formData.email,
            password: formData.password,
        });
        
        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            return;
        }

        setFormLoading(true);
        try {
            await api.post('/users', {
                ...formData,
                managerId: formData.managerId ? parseInt(formData.managerId) : undefined
            });
            
            toast.success('Personnel Provisioned', {
                description: `${formData.name} has been authorized for operations.`
            });
            
            
            setShowCreateModal(false);
            setFormData({ name: '', email: '', password: '', role: 'SALES', managerId: '' });
            fetchUsers();
            
            // Invalidate dashboard summary to hide the "Build Your Team" overlay
            queryClient.invalidateQueries({ queryKey: ['dashboard', 'summary'] });
        } catch (error: any) {
            const msg = error.response?.data?.error || 'Provisioning failed';
            toast.error('Authorization Restricted', { description: msg });
        } finally {
            setFormLoading(false);
        }
    };

    const filteredUsers = users
        .filter(u => {
            const q = searchQuery.toLowerCase();
            return (
                u.name.toLowerCase().includes(q) ||
                u.email.toLowerCase().includes(q)
            );
        })
        .filter(u => {
            if (activeFilter === 'sales') return u.role?.toUpperCase() === 'SALES';
            if (activeFilter === 'nonSales') return u.role?.toUpperCase() !== 'SALES';
            return true;
        });

    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    };

    const roleStyles: Record<string, { bg: string; color: string; icon: any; border: string }> = {
        ADMIN: { bg: 'bg-status-success/10', color: 'text-status-success', icon: ShieldCheck, border: 'border-status-success/20' },
        MANAGER: { bg: 'bg-purple-500/10', color: 'text-purple-400', icon: Target, border: 'border-purple-500/20' },
        SALES: { bg: 'bg-primary/10', color: 'text-primary', icon: BarChart3, border: 'border-primary/20' },
    };

    return (
        <div className="crm-page-container">
            <Sidebar />
            
            <main className="crm-main-content">
                {/* ── Background Effects ── */}
                <div className="ll-hero-grid opacity-[0.02] dark:opacity-[0.05]" />
                <div className="ll-orb w-[600px] h-[600px] -top-64 -right-32 bg-primary/5 blur-[120px]" />
                <div className="ll-orb w-[400px] h-[400px] bottom-0 left-0 bg-purple-500/5 blur-[100px]" />

                <div className="relative z-10 h-full overflow-y-auto custom-scrollbar p-10">
                    <div className="max-w-7xl mx-auto space-y-10">
                        
                        <header className="flex flex-col xl:flex-row xl:items-end justify-between gap-10">
                            <div className="animate-in slide-in-from-left duration-700">
                                <div className="flex items-center gap-3 text-primary mb-3 font-semibold text-xs uppercase tracking-wider">
                                    <Activity size={14} className="animate-pulse" />
                                    Operational Command Hub
                                </div>
                                <h1 className="crm-page-title">Team <span className="text-primary">Registry</span></h1>
                                <p className="crm-page-subtitle max-w-xl mt-3">
                                    {user?.role === 'ADMIN' 
                                        ? 'Manage users, roles, and system access levels.' 
                                        : 'Monitor team performance and activity.'}
                                </p>
                            </div>
                            
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-5 animate-in slide-in-from-right duration-700">
                                <div className="relative group">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
                                    <input 
                                        type="text" 
                                        placeholder="SEARCH PERSONNEL..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="crm-input !pl-12 !h-14 !bg-card/20 !border-white/5 w-full sm:w-80 text-[10px] font-semibold tracking-widest"
                                    />
                                </div>
                                
                                <button 
                                    onClick={() => setShowCreateModal(true)}
                                    className="h-14 px-8 bg-primary text-black rounded-2xl text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-primary/20"
                                >
                                    <UserPlus size={16} strokeWidth={3} />
                                    {user?.role === 'MANAGER' ? 'Add Sales User' : 'Add User'}
                                </button>
                            </div>
                        </header>

                        {/* ── Metric Telemetry ── */}
                        {user?.role === 'ADMIN' && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                {[
                                    { id: 'all' as const, label: 'Active Personnel', value: users.length, icon: Users, color: 'var(--primary)', shadow: 'shadow-primary/10' },
                                    { id: 'sales' as const, label: 'Operations Unit', value: users.filter(u => u.role === 'SALES').length, icon: Target, color: '#60A5FA', shadow: 'shadow-blue-500/10' },
                                    { id: 'nonSales' as const, label: 'Command Base', value: users.filter(u => u.role !== 'SALES').length, icon: Shield, color: '#C084FC', shadow: 'shadow-purple-500/10' },
                                ].map((stat, i) => {
                                    const isActive = activeFilter === stat.id;
                                    return (
                                        <motion.button
                                            type="button"
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.1 }}
                                            key={stat.id}
                                            onClick={() => setActiveFilter(stat.id)}
                                            className={`crm-card text-left group hover:bg-card/60 transition-all duration-500 border-white/5 bg-card/40 backdrop-blur-xl flex items-center gap-6 ${stat.shadow} ${
                                                isActive ? 'ring-2 ring-primary/30 border-primary/30' : ''
                                            }`}
                                        >
                                            <div className="w-16 h-16 rounded-[1.25rem] flex items-center justify-center transition-transform group-hover:scale-110 shadow-inner" style={{ background: `${stat.color}10`, border: `1px solid ${stat.color}20` }}>
                                                <stat.icon size={28} style={{ color: stat.color }} strokeWidth={1.5} />
                                            </div>
                                            <div>
                                                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/40 mb-1">{stat.label}</p>
                                                <p className="text-4xl font-semibold text-foreground tracking-tighter tabular-nums">{stat.value.toString().padStart(2, '0')}</p>
                                                <p className={`text-[9px] font-bold uppercase tracking-widest mt-2 ${isActive ? 'text-primary/80' : 'text-muted-foreground/30'}`}>
                                                    {isActive ? 'Filter Active' : 'Click to Filter'}
                                                </p>
                                            </div>
                                        </motion.button>
                                    );
                                })}
                            </div>
                        )}

                        {/* ── Personnel Directory ── */}
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="crm-card !p-0 overflow-hidden bg-card/20 backdrop-blur-3xl border-white/5"
                        >
                            <div className="p-8 border-b border-border/40 flex items-center justify-between">
                                <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground">Team Directory</h2>
                                <div className="hidden sm:flex items-center gap-3">
                                    <div className="px-3 py-1.5 rounded-xl bg-primary/5 border border-primary/10 text-primary text-[8px] font-semibold uppercase tracking-widest">
                                        Live Registry
                                    </div>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-muted/10">
                                            <th className="px-10 py-6 text-xs font-semibold uppercase tracking-wider text-muted-foreground/30">Name</th>
                                            <th className="px-10 py-6 text-xs font-semibold uppercase tracking-wider text-muted-foreground/30">Classification</th>
                                            <th className="px-10 py-6 text-xs font-semibold uppercase tracking-wider text-muted-foreground/30">Status</th>
                                            <th className="px-10 py-6 text-xs font-semibold uppercase tracking-wider text-muted-foreground/30">Initialization</th>
                                            {user?.role === 'ADMIN' && <th className="px-10 py-6 text-xs font-semibold uppercase tracking-wider text-muted-foreground/30">Reporting Unit</th>}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/20">
                                        {loading ? (
                                            [1,2,3,4,5].map(i => (
                                                <tr key={i} className="animate-pulse">
                                                    <td colSpan={5} className="px-10 py-8 bg-muted/5 h-24"></td>
                                                </tr>
                                            ))
                                        ) : filteredUsers.map((u, idx) => {
                                            const role = u.role.toUpperCase();
                                            const config = roleStyles[role] || roleStyles.SALES;
                                            const Icon = config.icon;
                                            
                                            return (
                                                <motion.tr 
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: 0.4 + idx * 0.05 }}
                                                    key={u.id}
                                                    className="group hover:bg-primary/[0.02] transition-colors"
                                                >
                                                    <td className="px-10 py-8">
                                                        <div className="flex items-center gap-5">
                                                            <div className="w-12 h-12 rounded-2xl bg-card border border-border/40 flex items-center justify-center text-xs font-semibold tracking-wider text-primary group-hover:border-primary/40 transition-all shadow-sm">
                                                                {getInitials(u.name)}
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-semibold text-foreground tracking-tight group-hover:text-primary transition-colors uppercase">{u.name}</p>
                                                                <p className="text-[9px] font-bold text-muted-foreground/40 flex items-center gap-2 mt-1 lowercase">
                                                                    <Mail size={10} className="text-primary/40" />
                                                                    {u.email}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-10 py-8">
                                                        <div className={`inline-flex items-center gap-3 px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider ${config.bg} ${config.color} border ${config.border}`}>
                                                            <Icon size={14} />
                                                            {role}
                                                        </div>
                                                    </td>
                                                    <td className="px-10 py-8">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-2 h-2 rounded-full bg-status-success shadow-[0_0_12px_rgba(34,197,94,0.4)] animate-pulse" />
                                                            <span className="text-[10px] font-semibold text-foreground/40 uppercase tracking-widest">Active User</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-10 py-8">
                                                        <div className="flex flex-col">
                                                            <span className="text-xs font-semibold text-foreground/60 tabular-nums">
                                                                {new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }).toUpperCase()}
                                                            </span>
                                                            <span className="text-[9px] font-semibold text-muted-foreground/20 uppercase tracking-widest mt-1">Cycle Logged</span>
                                                        </div>
                                                    </td>
                                                    {user?.role === 'ADMIN' && (
                                                        <td className="px-10 py-8">
                                                            {u.manager ? (
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-primary/30" />
                                                                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">{u.manager.name}</span>
                                                                </div>
                                                            ) : (
                                                                <span className="text-xs font-semibold text-muted-foreground/20 uppercase tracking-widest italic tracking-wider">Team Member</span>
                                                            )}
                                                        </td>
                                                    )}
                                                </motion.tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                                
                                {!loading && filteredUsers.length === 0 && (
                                    <div className="py-32 text-center space-y-6">
                                        <Users size={64} className="mx-auto text-muted-foreground/10" />
                                        <p className="text-xs font-semibold text-muted-foreground/30 uppercase tracking-wider">No personnel signatures identified in directory</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                </div>
                
                {/* ── Provisioning Modal ── */}
                <AnimatePresence>
                    {showCreateModal && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 overflow-hidden">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 backdrop-blur-xl bg-black/40 dark:bg-black/80"
                                onClick={() => setShowCreateModal(false)}
                            />
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.95, y: 40 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 40 }}
                                className="w-full max-w-2xl bg-card/90 backdrop-blur-2xl border border-white/10 rounded-[3rem] overflow-hidden shadow-[0_32px_120px_-20px_rgba(0,0,0,0.5)]"
                            >
                                <div className="p-12">
                                    <div className="flex items-center justify-between mb-12">
                                        <div className="flex items-center gap-5">
                                            <div className="w-16 h-16 rounded-[1.5rem] bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                                                <UserPlus size={32} />
                                            </div>
                                            <div>
                                                <h3 className="text-3xl font-semibold tracking-tight text-foreground uppercase" style={{ fontFamily: 'var(--ll-font-display)' }}>Add Entry</h3>
                                                <p className="text-xs font-semibold text-primary uppercase tracking-wider mt-1">Assigning operations frontline protocol</p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => setShowCreateModal(false)}
                                            className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-muted-foreground hover:text-foreground transition-all group border border-white/5"
                                        >
                                            <X size={20} className="group-hover:rotate-90 transition-transform" />
                                        </button>
                                    </div>

                                    <form onSubmit={handleCreateUser} className="space-y-10">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                            <div className="space-y-3">
                                                <label className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider ml-2">Full Name</label>
                                                <input 
                                                    className={`crm-input !bg-white/5 !border-white/10 !h-14 !px-6 text-sm font-bold ${fieldErrors.name ? '!border-status-danger/40 ring-2 ring-status-danger/10' : ''}`}
                                                    value={formData.name}
                                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                                    placeholder="E.G. SATOSHI NAKAMOTO"
                                                />
                                            </div>
                                            <div className="space-y-3">
                                                <label className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider ml-2">Email Signature</label>
                                                <input 
                                                    className={`crm-input !bg-white/5 !border-white/10 !h-14 !px-6 text-sm font-bold ${fieldErrors.email ? '!border-status-danger/40 ring-2 ring-status-danger/10' : ''}`}
                                                    type="email"
                                                    value={formData.email}
                                                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                                                    placeholder="user@company.com"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                            <div className="space-y-3">
                                                <label className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider ml-2">Access Token</label>
                                                <div className="relative">
                                                    <input 
                                                        className={`crm-input !bg-white/5 !border-white/10 !h-14 !px-6 text-sm font-bold ${fieldErrors.password ? '!border-status-danger/40 ring-2 ring-status-danger/10' : ''}`}
                                                        type={showPassword ? "text" : "password"}
                                                        value={formData.password}
                                                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                                                        placeholder="••••••••"
                                                    />
                                                    <button 
                                                        type="button"
                                                        onClick={() => setShowPassword(!showPassword)}
                                                        className="absolute right-6 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-primary transition-colors"
                                                    >
                                                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                                    </button>
                                                </div>
                                            </div>
                                            
                                            <div className="space-y-3">
                                                <label className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider ml-2">Assigned Unit</label>
                                                <div className="relative">
                                                    <select 
                                                        className="crm-input !bg-white/5 !border-white/10 !h-14 !px-6 text-xs font-semibold uppercase tracking-wider appearance-none disabled:opacity-50"
                                                        value={formData.role}
                                                        disabled={user?.role === 'MANAGER'}
                                                        onChange={(e) => setFormData({...formData, role: e.target.value})}
                                                    >
                                                        <option value="SALES">SALES OPERATIONS</option>
                                                        {user?.role === 'ADMIN' && <option value="MANAGER">COMMAND LEAD (MANAGER)</option>}
                                                        {user?.role === 'ADMIN' && <option value="ADMIN">ROOT ACCESS (ADMIN)</option>}
                                                    </select>
                                                    <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/30 pointer-events-none" />
                                                </div>
                                            </div>
                                        </div>

                                        {user?.role === 'ADMIN' && formData.role === 'SALES' && (
                                            <div className="space-y-3 animate-in slide-in-from-top-4">
                                                <label className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider ml-2">Reporting Command Center</label>
                                                <div className="relative">
                                                    <select 
                                                        className="crm-input !bg-white/5 !border-white/10 !h-14 !px-6 text-xs font-semibold uppercase tracking-wider appearance-none"
                                                        value={formData.managerId}
                                                        onChange={(e) => setFormData({...formData, managerId: e.target.value})}
                                                    >
                                                        <option value="">Team Member</option>
                                                        {availableManagers.map(m => (
                                                            <option key={m.id} value={m.id}>{m.name.toUpperCase()}</option>
                                                        ))}
                                                    </select>
                                                    <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/30 pointer-events-none" />
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex items-center gap-6 pt-6">
                                            <button 
                                                type="button"
                                                onClick={() => setShowCreateModal(false)}
                                                className="flex-1 h-16 rounded-2xl text-xs font-semibold uppercase tracking-wider border border-white/5 text-muted-foreground/40 hover:bg-muted/5 transition-all"
                                            >
                                                Abort
                                            </button>
                                            <button 
                                                type="submit"
                                                disabled={formLoading}
                                                className="flex-[2] h-16 bg-primary text-black rounded-2xl text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-4 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 shadow-2xl shadow-primary/30"
                                            >
                                                {formLoading ? (
                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                ) : (
                                                    <Zap size={16} fill="currentColor" />
                                                )}
                                                INITIALIZE PERSONNEL
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
}
