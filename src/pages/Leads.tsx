import { useState, useEffect } from 'react';
import { Sidebar } from '../components/Sidebar';
import { Plus, Users, Search, Filter, MoreHorizontal, Mail, Phone, Building2, User, X, DollarSign } from 'lucide-react';
import { useLeads, Lead } from '../contexts/LeadsContext';
import { useAuth } from '../contexts/AuthContext';
import { hasPermission } from '../utils/permissions';
import { Role } from '../utils/roles';
import { formatDate } from '../utils/dateHelpers';

export default function Leads() {
    const { leads, loading, fetchLeads, createLead } = useLeads();
    const { user } = useAuth();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState({
        company: '',
        contact: '',
        email: '',
        phone: '',
        value: 0,
        priority: 'MEDIUM' as const,
        stage: 'NEW' as const
    });

    useEffect(() => {
        fetchLeads();
    }, [fetchLeads]);

    const canCreate = hasPermission(user?.role as Role, 'canCreateLeads');

    const handleCreateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await createLead(formData);
            setIsModalOpen(false);
            setFormData({
                company: '',
                contact: '',
                email: '',
                phone: '',
                value: 0,
                priority: 'MEDIUM',
                stage: 'NEW'
            });
        } catch (error) {
            console.error('Failed to create lead:', error);
        }
    };

    const filteredLeads = leads.filter(lead =>
        lead.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.contact.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex min-h-screen" style={{ background: '#0B1120' }}>
            <Sidebar />
            <main className="flex-1 crm-page-container">
                <div className="max-w-7xl mx-auto space-y-8">
                    <div className="flex justify-between items-end">
                        <div className="space-y-1">
                            <h1 className="crm-page-title">Lead Management</h1>
                            <p className="crm-page-subtitle">Track and nurture your enterprise sales pipeline</p>
                        </div>
                        {canCreate && (
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="crm-btn-primary"
                            >
                                <Plus className="w-5 h-5" />
                                <span>Capture Lead</span>
                            </button>
                        )}
                    </div>

                    {/* Controls Section */}
                    <div className="crm-card !p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#64748B' }} />
                            <input
                                type="text"
                                placeholder="Search by company or contact..."
                                className="crm-input !pl-11"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <button className="crm-btn-secondary w-full md:w-auto !py-2">
                                <Filter className="w-4 h-4" />
                                <span>Advanced Filters</span>
                            </button>
                        </div>
                    </div>

                    {/* Main Content Card (Table) */}
                    <div className="crm-table-container">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center p-24 space-y-4">
                                <div className="animate-spin rounded-full h-12 w-12" style={{ border: '4px solid rgba(0,212,170,0.2)', borderTop: '4px solid #00D4AA' }}></div>
                                <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#64748B' }}>Synchronizing Pipeline...</p>
                            </div>
                        ) : filteredLeads.length > 0 ? (
                            <table className="crm-table">
                                <thead className="crm-table-thead">
                                    <tr>
                                        <th className="crm-table-th">Organization</th>
                                        <th className="crm-table-th">Primary Contact</th>
                                        <th className="crm-table-th">Pipeline Stage</th>
                                        <th className="crm-table-th">Urgency</th>
                                        <th className="crm-table-th">Projected Value</th>
                                        <th className="crm-table-th">Discovery Date</th>
                                        <th className="crm-table-th"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredLeads.map((lead) => (
                                        <tr key={lead.id} className="crm-table-tr group">
                                            <td className="crm-table-td">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold transition-transform group-hover:scale-110" style={{ background: 'rgba(0,212,170,0.15)', color: '#00D4AA', border: '1px solid rgba(0,212,170,0.2)' }}>
                                                        {lead.company.charAt(0)}
                                                    </div>
                                                    <span className="font-bold uppercase tracking-tight transition-colors" style={{ color: '#F1F5F9' }}>{lead.company}</span>
                                                </div>
                                            </td>
                                            <td className="crm-table-td">
                                                <div className="space-y-0.5">
                                                    <p className="font-bold tracking-tight" style={{ color: '#F1F5F9' }}>{lead.contact}</p>
                                                    <p className="text-[10px] font-medium flex items-center gap-1" style={{ color: '#64748B' }}>
                                                        <Mail className="w-3 h-3" />
                                                        {lead.email}
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="crm-table-td">
                                                <span className={`crm-badge ${lead.stage === 'NEW' ? 'badge-stage-new' :
                                                    lead.stage === 'CONTACTED' ? 'badge-stage-contacted' :
                                                        lead.stage === 'QUALIFIED' ? 'badge-stage-qualified' :
                                                            lead.stage === 'PROPOSAL' ? 'badge-stage-proposal' :
                                                                lead.stage === 'CONVERTED' ? 'badge-stage-converted' :
                                                                    'badge-stage-lost'
                                                    }`}>
                                                    {lead.stage}
                                                </span>
                                            </td>
                                            <td className="crm-table-td">
                                                <span className={`crm-badge ${lead.priority === 'HIGH' ? 'badge-priority-high' :
                                                    lead.priority === 'MEDIUM' ? 'badge-priority-medium' :
                                                        'badge-priority-low'
                                                    }`}>
                                                    {lead.priority}
                                                </span>
                                            </td>
                                            <td className="crm-table-td">
                                                <div className="flex items-center gap-1.5 font-bold" style={{ color: '#F1F5F9' }}>
                                                    <span className="text-xs" style={{ color: '#64748B' }}>$</span>
                                                    {lead.value.toLocaleString()}
                                                </div>
                                            </td>
                                            <td className="crm-table-td text-xs font-bold uppercase tracking-tight" style={{ color: '#64748B' }}>
                                                {formatDate(lead.createdAt)}
                                            </td>
                                            <td className="crm-table-td text-right">
                                                <button className="p-2 rounded-lg transition-all" style={{ color: '#64748B' }}
                                                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(0,212,170,0.1)'; e.currentTarget.style.color = '#00D4AA'; }}
                                                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#64748B'; }}>
                                                    <MoreHorizontal className="w-5 h-5" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="p-24 text-center space-y-4">
                                <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto" style={{ background: 'rgba(148,163,184,0.06)', boxShadow: '0 0 0 8px rgba(148,163,184,0.03)' }}>
                                    <Users className="w-10 h-10" style={{ color: '#64748B' }} />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-xl font-bold" style={{ color: '#F1F5F9' }}>Clean Pipeline</h3>
                                    <p className="font-medium text-sm" style={{ color: '#64748B' }}>Target leads and start building your sales momentum</p>
                                </div>
                                {canCreate && (
                                    <button
                                        onClick={() => setIsModalOpen(true)}
                                        className="crm-btn-primary !mx-auto mt-6"
                                    >
                                        <Plus className="w-5 h-5" />
                                        <span>Initial Capture</span>
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Creation Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-hidden">
                    <div className="absolute inset-0 backdrop-blur-md transition-opacity" style={{ background: 'rgba(6,11,21,0.8)' }} onClick={() => setIsModalOpen(false)} />
                    <div className="rounded-[2rem] w-full max-w-2xl relative overflow-hidden transition-all scale-100 animate-in fade-in zoom-in duration-300" style={{ background: '#1A2332', border: '1px solid rgba(148,163,184,0.08)', boxShadow: '0 24px 48px rgba(0,0,0,0.5)' }}>
                        <div className="p-10 flex justify-between items-start" style={{ borderBottom: '1px solid rgba(148,163,184,0.08)' }}>
                            <div>
                                <h2 className="text-2xl font-bold tracking-tight" style={{ color: '#F1F5F9', fontFamily: 'Outfit, sans-serif' }}>Capture Opportunity</h2>
                                <p className="mt-1 font-medium text-sm tracking-tight" style={{ color: '#64748B' }}>Standardize new organization entry into the ecosystem</p>
                            </div>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="p-2.5 rounded-xl transition-all group" style={{ color: '#64748B' }}
                            >
                                <X className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateSubmit} className="p-10 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="crm-label">Legal Organization *</label>
                                    <div className="relative group">
                                        <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors" style={{ color: '#64748B' }} />
                                        <input required type="text" className="crm-input !pl-11" placeholder="e.g. Global Tech Solutions" value={formData.company} onChange={(e) => setFormData({ ...formData, company: e.target.value })} />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="crm-label">Point of Contact *</label>
                                    <div className="relative group">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors" style={{ color: '#64748B' }} />
                                        <input required type="text" className="crm-input !pl-11" placeholder="Lead stakeholder name" value={formData.contact} onChange={(e) => setFormData({ ...formData, contact: e.target.value })} />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="crm-label">Corporate Email *</label>
                                    <div className="relative group">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors" style={{ color: '#64748B' }} />
                                        <input required type="email" className="crm-input !pl-11" placeholder="name@organization.com" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="crm-label">Direct Communication</label>
                                    <div className="relative group">
                                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors" style={{ color: '#64748B' }} />
                                        <input type="tel" className="crm-input !pl-11" placeholder="+1 (000) 000-0000" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="crm-label">Projected Valuation ($)</label>
                                    <div className="relative group">
                                        <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors" style={{ color: '#64748B' }} />
                                        <input required type="number" className="crm-input !pl-11" placeholder="Lead value" value={formData.value} onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })} />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="crm-label">Priority Tier</label>
                                    <select className="crm-input font-bold appearance-none cursor-pointer" style={{ color: '#F1F5F9' }} value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}>
                                        <option value="LOW">LOW PRIORITY</option>
                                        <option value="MEDIUM">MEDIUM PRIORITY</option>
                                        <option value="HIGH">HIGH PRIORITY</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="crm-btn-secondary w-full !py-4">Cancel</button>
                                <button type="submit" className="crm-btn-primary w-full !py-4">Initialize Lead</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
