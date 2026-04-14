import { useState, useEffect, useCallback, useMemo } from 'react';
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
import { ProvisioningModal } from '../components/ProvisioningModal';

interface SystemUser {
    id: number;
    name: string;
    email: string;
    role: string;
    createdAt?: string;
    manager?: { name: string };
}

import { getUsers, getSalesUsers } from '@/api/users';

export default function Team() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [searchParams] = useSearchParams();
    
    // UI State
    const [users, setUsers] = useState<SystemUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [formLoading, setFormLoading] = useState(false);
    const [activeFilter, setActiveFilter] = useState<'ALL' | 'SALES' | 'MANAGER'>('ALL');
    
    const isManager = user?.role === 'MANAGER';

    const salesCount = useMemo(() => {
        return users.filter(u => u.role === 'SALES').length;
    }, [users]);

    const [availableManagers, setAvailableManagers] = useState<{id: number, name: string}[]>([]);

    const handleOpenModal = useCallback(() => setShowCreateModal(true), []);
    const handleCloseModal = useCallback(() => setShowCreateModal(false), []);

    const fetchUsers = useCallback(async () => {
        try {
            setLoading(true);
            const normalizedUsers = await getUsers();
            setUsers(normalizedUsers);
            
            if (user?.role === 'ADMIN') {
                const normalizedSalesUsers = await getSalesUsers();
                setAvailableManagers(normalizedSalesUsers.filter((u: any) => u.role === 'MANAGER'));
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

    const handleSubmit = useCallback(async (data: any) => {
        setFormLoading(true);
        try {
            await api.post('/users', {
                ...data,
                managerId: data.managerId ? parseInt(data.managerId) : undefined
            });
            
            toast.success('Personnel Provisioned', {
                description: `${data.name} has been authorized for operations.`
            });
            
            fetchUsers();
            queryClient.invalidateQueries({ queryKey: ['dashboard', 'summary'] });
        } catch (error: any) {
            const msg = error.response?.data?.error || 'Provisioning failed';
            toast.error('Authorization Restricted', { description: msg });
            throw error;
        } finally {
            setFormLoading(false);
        }
    }, [fetchUsers, queryClient]);

    const filteredUsers = useMemo(() => {
        let result = users;

        if (isManager) {
            // Managers only see Sales Representatives
            result = result.filter(u => u.role === 'SALES');
        } else {
            // Admins can toggle between segments
            if (activeFilter === 'SALES') {
                result = result.filter(u => u.role === 'SALES');
            } else if (activeFilter === 'MANAGER') {
                result = result.filter(u => u.role === 'MANAGER');
            }
        }

        return result.filter(u => 
            u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
            u.email.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [users, activeFilter, searchQuery, isManager]);

    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    };

    const roleStyles: Record<string, { bg: string; color: string; icon: any; border: string }> = {
        ADMIN: { bg: 'bg-status-success/10', color: 'text-status-success', icon: ShieldCheck, border: 'border-status-success/20' },
        MANAGER: { bg: 'bg-purple-500/10', color: 'text-purple-400', icon: Shield, border: 'border-purple-500/20' },
        SALES: { bg: 'bg-primary/10', color: 'text-primary', icon: Target, border: 'border-primary/20' },
    };


    return (
        <div className="crm-page-container">
            <Sidebar />
            <>
                <main className="crm-main-content">
                {/* ── Background Effects ── */}
                <div className="ll-hero-grid opacity-[0.02] dark:opacity-[0.05]" />
                <div className="ll-orb w-[600px] h-[600px] -top-64 -right-32 bg-primary/5 blur-[120px]" />
                <div className="ll-orb w-[400px] h-[400px] bottom-0 left-0 bg-purple-500/5 blur-[100px]" />

                <div className="relative z-10 h-full overflow-y-auto custom-scrollbar p-10">
                    <div className="max-w-7xl mx-auto space-y-10">
                        
                        <header className="flex flex-col xl:flex-row xl:items-end justify-between gap-10">
                            <div className="animate-in slide-in-from-left duration-700">
                                <div className="flex items-center gap-3 text-status-success mb-3 font-semibold text-xs uppercase tracking-wider">
                                    <ShieldCheck size={14} className="animate-pulse" />
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
                                    onClick={handleOpenModal}
                                    className="h-14 px-8 bg-primary text-black rounded-2xl text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-primary/20"
                                >
                                    <UserPlus size={16} strokeWidth={3} />
                                    {isManager ? 'Add Sales Rep' : 'Add User'}
                                </button>
                            </div>
                        </header>

                        {user?.role === 'ADMIN' && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                {[
                                    { id: 'ALL', label: 'All Team Members', value: users.length, icon: Users, color: 'var(--primary)', shadow: 'shadow-primary/10' },
                                    { id: 'SALES', label: 'Sales Team', value: users.filter(u => u.role === 'SALES').length, icon: Target, color: '#60A5FA', shadow: 'shadow-blue-500/10' },
                                    { id: 'MANAGER', label: 'Managers', value: users.filter(u => u.role !== 'SALES').length, icon: Shield, color: '#C084FC', shadow: 'shadow-purple-500/10' },
                                ].map((stat, i) => {
                                    const isActive = activeFilter === stat.id;
                                    
                                    return (
                                        <motion.div 
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.1 }}
                                            key={i} 
                                            onClick={() => setActiveFilter(stat.id as any)}
                                            className={`crm-card relative group cursor-pointer overflow-hidden transition-all duration-300 ease-out border-white/5 backdrop-blur-xl flex items-center gap-6 ${stat.shadow} ${
                                                isActive 
                                                    ? 'ring-2 ring-primary/80 bg-primary/10 scale-[1.02] shadow-[0_0_30px_rgba(34,197,94,0.2)]' 
                                                    : 'bg-card/40 opacity-70 hover:opacity-100 hover:bg-card/60 hover:scale-[1.02]'
                                            } active:scale-95`}
                                        >
                                            {/* Top Accent Bar */}
                                            <div className={`absolute top-0 left-0 h-[3px] w-full transition-all duration-500 ${
                                                isActive ? 'bg-primary opacity-100' : 'bg-transparent opacity-0'
                                            }`} />

                                            {/* Active Glow Pulse */}
                                            {isActive && (
                                                <div className="absolute inset-0 bg-primary/5 animate-[pulse_3s_ease-in-out_infinite]" />
                                            )}

                                            <div className={`w-16 h-16 rounded-[1.25rem] relative z-10 flex items-center justify-center transition-all duration-500 shadow-inner ${
                                                isActive ? 'scale-110' : 'group-hover:scale-110'
                                            }`} style={{ background: `${stat.color}15`, border: `1px solid ${isActive ? stat.color : stat.color + '20'}` }}>
                                                <stat.icon size={28} style={{ color: isActive ? '#fff' : stat.color }} strokeWidth={isActive ? 2.5 : 1.5} className="transition-all" />
                                            </div>
                                            <div className="relative z-10">
                                                <p className={`text-[10px] font-bold uppercase tracking-[0.2em] mb-1.5 transition-colors ${
                                                    isActive ? 'text-primary' : 'text-muted-foreground/40'
                                                }`}>
                                                    {stat.label}
                                                </p>
                                                <p className={`text-4xl font-bold tracking-tighter tabular-nums transition-colors ${
                                                    isActive ? 'text-white' : 'text-foreground/80'
                                                }`}>
                                                    {stat.value.toString().padStart(2, '0')}
                                                </p>
                                            </div>
                                        </motion.div>
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
                                <div className="space-y-1">
                                    <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground">Team Directory</h2>
                                    {isManager ? (
                                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                                            Managing <span className="text-primary">{salesCount}</span> Sales Representatives
                                        </p>
                                    ) : (
                                        activeFilter !== 'ALL' && (
                                            <p className="text-[10px] text-primary font-bold uppercase tracking-widest animate-in fade-in slide-in-from-left-2 transition-all">
                                                Showing {activeFilter === 'SALES' ? 'Sales Team' : 'Managers'}
                                            </p>
                                        )
                                    )}
                                </div>
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
                                                                {u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }).toUpperCase() : 'SYSTEM SYNC'}
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
                                        <p className="text-xs font-semibold text-muted-foreground/30 uppercase tracking-wider">
                                            {activeFilter !== 'ALL' 
                                                ? `No ${activeFilter === 'SALES' ? 'sales team members' : 'managers'} identified in this category`
                                                : 'No personnel signatures identified in directory'}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                </div>
            </main>

            <ProvisioningModal
                isOpen={showCreateModal}
                onClose={handleCloseModal}
                onSubmit={handleSubmit}
                isPending={formLoading}
                availableManagers={availableManagers}
                currentUserRole={user?.role}
            />
            </>
        </div>
    );
}
