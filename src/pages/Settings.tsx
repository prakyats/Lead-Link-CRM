import { Sidebar } from '../components/Sidebar';
import { Shield, Users, Info, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Settings() {
    const { user } = useAuth();

    const riskThresholds = [
        { level: 'High Risk', criteria: 'Last interaction >= 7 days', color: '#F87171', bg: 'rgba(239,68,68,0.1)' },
        { level: 'Medium Risk', criteria: 'Last interaction 3-6 days', color: '#FBBF24', bg: 'rgba(245,158,11,0.1)' },
        { level: 'Low Risk', criteria: 'Last interaction < 3 days', color: '#4ADE80', bg: 'rgba(74,222,128,0.1)' },
    ];

    const systemUsers = [
        { name: 'System Admin', email: 'admin@crm.com', role: 'admin' },
        { name: 'Sales Manager', email: 'manager@crm.com', role: 'manager' },
        { name: 'Sales Executive', email: 'sales@crm.com', role: 'sales' },
    ];

    return (
        <div className="flex" style={{ background: 'var(--crm-navy)' }}>
            <Sidebar />
            <main className="flex-1 overflow-auto" style={{ background: 'var(--crm-navy)' }}>
                <div className="p-8 max-w-4xl mx-auto">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold" style={{ color: '#F1F5F9', fontFamily: 'Outfit, sans-serif' }}>System Settings</h1>
                        <p className="mt-1" style={{ color: '#64748B' }}>System-wide configurations and information (Admin Only)</p>
                    </div>

                    <div className="space-y-6">
                        {/* Risk Calculation Rules */}
                        <section className="rounded-xl overflow-hidden" style={{ background: '#1A2332', border: '1px solid rgba(148,163,184,0.08)' }}>
                            <div className="p-6 flex items-center gap-3" style={{ borderBottom: '1px solid rgba(148,163,184,0.08)' }}>
                                <Shield className="w-5 h-5" style={{ color: '#00D4AA' }} />
                                <h2 className="text-xl font-bold" style={{ color: '#F1F5F9' }}>Risk Threshold Rules</h2>
                            </div>
                            <div className="p-6">
                                <p className="text-sm mb-4" style={{ color: '#94A3B8' }}>
                                    Customer risk status is automatically calculated based on the number of days since the last recorded interaction.
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {riskThresholds.map((rule) => (
                                        <div key={rule.level} className="p-4 rounded-lg" style={{ background: rule.bg }}>
                                            <p className="font-bold mb-1" style={{ color: rule.color }}>{rule.level}</p>
                                            <p className="text-sm" style={{ color: '#94A3B8' }}>{rule.criteria}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>

                        {/* User Directory */}
                        <section className="rounded-xl overflow-hidden" style={{ background: '#1A2332', border: '1px solid rgba(148,163,184,0.08)' }}>
                            <div className="p-6 flex items-center gap-3" style={{ borderBottom: '1px solid rgba(148,163,184,0.08)' }}>
                                <Users className="w-5 h-5" style={{ color: '#00D4AA' }} />
                                <h2 className="text-xl font-bold" style={{ color: '#F1F5F9' }}>System User Directory</h2>
                            </div>
                            <div className="p-6">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="text-sm" style={{ borderBottom: '1px solid rgba(148,163,184,0.08)', color: '#64748B' }}>
                                                <th className="pb-3 font-medium">Name</th>
                                                <th className="pb-3 font-medium">Email</th>
                                                <th className="pb-3 font-medium">Role</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {systemUsers.map((u) => (
                                                <tr key={u.email} className="text-sm" style={{ borderBottom: '1px solid rgba(148,163,184,0.04)' }}>
                                                    <td className="py-3 font-medium" style={{ color: '#F1F5F9' }}>{u.name}</td>
                                                    <td className="py-3" style={{ color: '#94A3B8' }}>{u.email}</td>
                                                    <td className="py-3">
                                                        <span className="capitalize px-2 py-1 rounded text-xs" style={{ background: 'rgba(148,163,184,0.1)', color: '#94A3B8' }}>
                                                            {u.role}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </section>

                        {/* Profile Info */}
                        <section className="rounded-xl overflow-hidden" style={{ background: '#1A2332', border: '1px solid rgba(148,163,184,0.08)' }}>
                            <div className="p-6 flex items-center gap-3" style={{ borderBottom: '1px solid rgba(148,163,184,0.08)' }}>
                                <User className="w-5 h-5" style={{ color: '#00D4AA' }} />
                                <h2 className="text-xl font-bold" style={{ color: '#F1F5F9' }}>Your Admin Profile</h2>
                            </div>
                            <div className="p-6 flex items-center gap-6">
                                <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold" style={{ background: 'rgba(0,212,170,0.15)', color: '#00D4AA' }}>
                                    {user?.name?.substring(0, 2).toUpperCase()}
                                </div>
                                <div>
                                    <p className="text-lg font-bold" style={{ color: '#F1F5F9' }}>{user?.name}</p>
                                    <p className="text-sm" style={{ color: '#94A3B8' }}>{user?.email}</p>
                                    <p className="inline-block mt-2 px-3 py-1 text-xs font-bold rounded-full uppercase" style={{ background: 'linear-gradient(135deg, #00D4AA, #00B894)', color: '#0B1120' }}>
                                        {user?.role}
                                    </p>
                                </div>
                            </div>
                        </section>

                        <div className="p-4 rounded-lg flex gap-3 text-sm" style={{ background: 'rgba(0,212,170,0.06)', border: '1px solid rgba(0,212,170,0.15)', color: '#00D4AA' }}>
                            <Info className="w-5 h-5 shrink-0" />
                            <p>This page is informational for academic purposes. Dynamic configuration of roles and pipeline stages is not enabled in this version.</p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
