import { 
    Shield, Info, AlertCircle, CheckCircle2, Activity, Zap, Cpu, Lock
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Sidebar } from '../components/Sidebar';
import { motion } from 'framer-motion';

export default function Settings() {
    const { user } = useAuth();

    const riskThresholds = [
        { 
            level: 'High Risk', 
            criteria: 'Last interaction >= 7 days', 
            token: 'danger',
            icon: AlertCircle,
            description: 'Critical follow-up required. Lead is likely cooling and requires immediate re-engagement.'
        },
        { 
            level: 'Medium Risk', 
            criteria: 'Last interaction 3-6 days', 
            token: 'warning',
            icon: Info,
            description: 'Standard follow-up window. Maintain active engagement to prevent cooling.'
        },
        { 
            level: 'Low Risk', 
            criteria: 'Last interaction < 3 days', 
            token: 'success',
            icon: CheckCircle2,
            description: 'Lead is active and responsive. Maintain current momentum.'
        },
    ];

    return (
        <div className="crm-page-container">
            <Sidebar />
            
            <main className="crm-main-content">
                {/* ── Background Effects ── */}
                <div className="ll-hero-grid opacity-[0.02] dark:opacity-[0.05]" />
                <div className="ll-orb w-[600px] h-[600px] -top-64 -right-32 bg-primary/5 blur-[120px]" />
                <div className="ll-orb w-[400px] h-[400px] bottom-0 left-0 bg-purple-500/5 blur-[100px]" />

                <div className="relative z-10 h-full overflow-y-auto custom-scrollbar p-10">
                    <div className="max-w-5xl mx-auto space-y-12">
                        
                        <header className="animate-in slide-in-from-top duration-700">
                            <div className="flex items-center gap-3 text-primary mb-4 font-semibold text-xs uppercase tracking-wider">
                                <Shield size={14} />
                                Environmental Calibration
                            </div>
                            <h1 className="crm-page-title">System <span className="text-primary">Configs</span></h1>
                            <p className="crm-page-subtitle max-w-xl mt-3">
                                Operational benchmarks and authorization parameters governing the organization's frontline infrastructure.
                            </p>
                        </header>

                        <div className="space-y-16">
                            {/* ── Operational Rules Section ── */}
                            <section className="animate-in fade-in duration-1000">
                                <div className="flex items-center gap-4 mb-10">
                                    <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-inner">
                                        <Activity size={24} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-semibold tracking-tight text-foreground uppercase" style={{ fontFamily: 'var(--ll-font-display)' }}>Activity Goals</h2>
                                        <p className="text-xs font-semibold text-muted-foreground/40 uppercase tracking-wider mt-1">Configure your target goals.</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                    {riskThresholds.map((rule, idx) => (
                                        <motion.div 
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.1 }}
                                            key={rule.level} 
                                            className={`crm-card group !bg-card/20 backdrop-blur-2xl border-white/5 hover:border-white/10 transition-all duration-500`}
                                        >
                                            <div className="flex items-center gap-5 mb-8">
                                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-status-${rule.token}/10 border border-status-${rule.token}/20 text-status-${rule.token} shadow-inner group-hover:scale-110 transition-transform`}>
                                                    <rule.icon size={24} strokeWidth={2} />
                                                </div>
                                                <h3 className="text-xs font-semibold tracking-[0.2em] text-foreground uppercase">{rule.level}</h3>
                                            </div>
                                            
                                            <div className="space-y-6">
                                                <div>
                                                    <p className="text-xs font-semibold uppercase tracking-wider text-primary/40 mb-2 flex items-center gap-2">
                                                        <Zap size={10} className="fill-current" />
                                                        Trigger Protocol
                                                    </p>
                                                    <p className="text-sm font-semibold text-foreground tabular-nums tracking-tight uppercase">{rule.criteria}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/20 mb-2">Priority</p>
                                                    <p className="text-[11px] font-bold text-muted-foreground leading-relaxed italic">"{rule.description}"</p>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </section>

                            {/* ── Authorization Summary ── */}
                            <section className="pt-16 border-t border-border/40 animate-in slide-in-from-bottom duration-1000">
                                <div className="crm-card !bg-primary/[0.03] !border-primary/10 transition-all duration-700 hover:!bg-primary/[0.05] p-12 flex flex-col md:flex-row items-center gap-10">
                                    <div className="relative group">
                                        <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <div className="relative w-28 h-28 rounded-[2rem] bg-primary flex items-center justify-center text-black text-4xl font-semibold shadow-[0_20px_50px_-10px_rgba(0,212,170,0.4)] transition-transform group-hover:scale-105">
                                            {(user?.name?.split(' ')?.map(n => n?.[0]).join('').toUpperCase().substring(0, 2)) || 'LL'}
                                        </div>
                                    </div>
                                    
                                    <div className="text-center md:text-left flex-1 space-y-6">
                                        <div className="space-y-1">
                                            <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider mb-3 border border-primary/20">
                                                <Lock size={12} fill="currentColor" />
                                                Authorized Instance
                                            </div>
                                            <h3 className="text-4xl font-semibold tracking-tighter text-foreground uppercase tabular-nums" style={{ fontFamily: 'var(--ll-font-display)' }}>{user?.name}</h3>
                                            <p className="text-sm font-semibold text-muted-foreground/40 tabular-nums lowercase flex items-center justify-center md:justify-start gap-2">
                                                <Cpu size={14} className="text-primary/20" />
                                                {user?.email}
                                            </p>
                                        </div>
                                        
                                        <div className="flex flex-wrap gap-10 items-center justify-center md:justify-start pt-4">
                                            <div className="space-y-1.5">
                                                <span className="text-xs font-semibold uppercase tracking-wider text-primary/40 block">System Role</span>
                                                <span className="text-sm font-semibold text-foreground uppercase tracking-widest bg-white/5 py-1 px-3 rounded-lg border border-white/5">{user?.role}</span>
                                            </div>
                                            <div className="w-px h-10 bg-border/40 hidden sm:block" />
                                            <div className="space-y-1.5">
                                                <span className="text-xs font-semibold uppercase tracking-wider text-primary/40 block">Account Status</span>
                                                <span className="flex items-center gap-2">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-status-success shadow-[0_0_10px_var(--status-success)]" />
                                                    <span className="text-sm font-semibold text-foreground uppercase tracking-widest">Active user</span>
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        </div>
                        
                        <footer className="mt-24 pt-10 border-t border-border/20 pb-12 flex flex-col md:flex-row md:items-center justify-between gap-6 opacity-40">
                            <div className="flex items-center gap-4">
                                <div className="w-2 h-2 rounded-full bg-primary" />
                                <p className="text-xs font-semibold uppercase tracking-wider text-foreground">LeadLink CRM v1.0.0</p>
                            </div>
                            <div className="flex items-center gap-8">
                                {['Security Ledger', 'Protocol Export', 'Neural Sync'].map(link => (
                                    <span key={link} className="text-xs font-semibold uppercase tracking-wider text-foreground hover:text-primary transition-colors cursor-pointer">
                                        {link}
                                    </span>
                                ))}
                            </div>
                        </footer>
                    </div>
                </div>
            </main>
        </div>
    );
}
