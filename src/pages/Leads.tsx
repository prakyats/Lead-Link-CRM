import { useState, useEffect } from 'react';
import { Sidebar } from '../components/Sidebar';
import { Plus, Users, Search, Filter, MoreHorizontal, Mail, Phone, Building2, User, X, IndianRupee } from 'lucide-react';
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
        <div className="flex min-h-screen bg-background text-foreground">
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
                                <span>Add Lead</span>
                            </button>
                        )}
                    </div>

                    {/* Controls Section */}
                    <div className="crm-card border border-border !p-4 flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm">
                        <div className="relative w-full md:w-96 group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-[#00D4AA] transition-colors" />
                            <input
                                type="text"
                                placeholder="Search by company or contact..."
                                className="crm-input !pl-11 bg-muted/20 border-border focus:border-[#00D4AA]/50"
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
                                <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#00D4AA]/20 border-t-[#00D4AA]" />
                                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Synchronizing Pipeline...</p>
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
                                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold transition-transform group-hover:scale-110 bg-[#00D4AA]/10 text-[#00D4AA] border border-[#00D4AA]/20">
                                                        {lead.company.charAt(0)}
                                                    </div>
                                                    <span className="font-bold uppercase tracking-tight transition-colors">{lead.company}</span>
                                                </div>
                                            </td>
                                            <td className="crm-table-td">
                                                <div className="space-y-0.5">
                                                    <p className="font-bold tracking-tight">{lead.contact}</p>
                                                    <p className="text-[10px] font-medium flex items-center gap-1 text-muted-foreground">
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
                                                <div className="flex items-center gap-1.5 font-bold">
                                                    <span className="text-xs text-muted-foreground">₹</span>
                                                    {lead.value.toLocaleString('en-IN')}
                                                </div>
                                            </td>
                                            <td className="crm-table-td text-xs font-bold uppercase tracking-tight text-muted-foreground">
                                                {formatDate(lead.createdAt)}
                                            </td>
                                            <td className="crm-table-td text-right text-muted-foreground">
                                                <button className="p-2 rounded-lg transition-all hover:bg-[#00D4AA]/10 hover:text-[#00D4AA]">
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
                                    <h3 className="text-xl font-bold" style={{ color: '#F1F5F9' }}>No Leads Yet</h3>
                                    <p className="font-medium text-sm" style={{ color: '#64748B' }}>Add your first lead to start building your pipeline</p>
                                </div>
                                {canCreate && (
                                    <button
                                        onClick={() => setIsModalOpen(true)}
                                        className="crm-btn-primary !mx-auto mt-6"
                                    >
                                        <Plus className="w-5 h-5" />
                                        <span>Add Lead</span>
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
                    <div className="absolute inset-0 backdrop-blur-md bg-black/60" onClick={() => setIsModalOpen(false)} />
                    <div className="rounded-[2rem] w-full max-w-2xl relative overflow-hidden bg-card border border-border shadow-2xl animate-in zoom-in-95 duration-300">
                        <div className="p-10 flex justify-between items-start border-b border-border">
                            <div>
                                <h2 className="text-2xl font-bold tracking-tight text-foreground" style={{ fontFamily: 'Outfit, sans-serif' }}>Add New Lead</h2>
                                <p className="mt-1 font-medium text-sm tracking-tight text-muted-foreground">Fill in the details to add a new lead to your pipeline</p>
                            </div>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="p-2.5 rounded-xl transition-all group text-muted-foreground hover:text-foreground"
                            >
                                <X className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateSubmit} className="p-10 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="crm-label">Company Name *</label>
                                    <div className="relative group">
                                        <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors" style={{ color: '#64748B' }} />
                                        <input required type="text" className="crm-input !pl-11" placeholder="e.g. Tata Consultancy Services" value={formData.company} onChange={(e) => setFormData({ ...formData, company: e.target.value })} />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="crm-label">Contact Name *</label>
                                    <div className="relative group">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors" style={{ color: '#64748B' }} />
                                        <input required type="text" className="crm-input !pl-11" placeholder="Primary contact person" value={formData.contact} onChange={(e) => setFormData({ ...formData, contact: e.target.value })} />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="crm-label">Email Address *</label>
                                    <div className="relative group">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors" style={{ color: '#64748B' }} />
                                        <input required type="email" className="crm-input !pl-11" placeholder="contact@company.com" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="crm-label">Phone Number</label>
                                    <div className="relative group">
                                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors" style={{ color: '#64748B' }} />
                                        <input type="tel" className="crm-input !pl-11" placeholder="+91 98765 43210" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="crm-label">Projected Value (₹)</label>
                                    <div className="relative group">
                                        <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors" style={{ color: '#64748B' }} />
                                        <input required type="number" className="crm-input !pl-11" placeholder="Lead value in ₹" value={formData.value} onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })} />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="crm-label">Priority Tier</label>
                                    <select className="crm-input font-bold appearance-none cursor-pointer bg-background" value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}>
                                        <option value="LOW">LOW PRIORITY</option>
                                        <option value="MEDIUM">MEDIUM PRIORITY</option>
                                        <option value="HIGH">HIGH PRIORITY</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="crm-btn-secondary w-full !py-4">Cancel</button>
                                <button type="submit" className="crm-btn-primary w-full !py-4">Add Lead</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
