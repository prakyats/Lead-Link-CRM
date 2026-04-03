import { useState, useEffect } from 'react';
import { Sidebar } from '../components/Sidebar';
import { Plus, Users, Search, Filter, MoreHorizontal, Mail, Phone, Building2, User, X, IndianRupee, UserCheck } from 'lucide-react';
import { useLeads, Lead } from '../contexts/LeadsContext';
import { useAuth } from '../contexts/AuthContext';
import { hasPermission } from '../utils/permissions';
import { Role } from '../utils/roles';
import { formatDate } from '../utils/dateHelpers';
import { motion, AnimatePresence } from 'framer-motion';

export default function Leads() {
    const { leads, loading, fetchLeads, createLead, assignLead } = useLeads();
    const { user } = useAuth();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [assignModal, setAssignModal] = useState<{ open: boolean; leadId: number | null }>({ open: false, leadId: null });
    const [salesUsers, setSalesUsers] = useState<{ id: number; name: string; role: string }[]>([]);
    const [selectedAssignee, setSelectedAssignee] = useState('');
    const [formData, setFormData] = useState({
        company: '',
        contact: '',
        email: '',
        phone: '',
        value: 0,
        priority: 'MEDIUM' as const,
        stage: 'NEW' as const
    });

    // Filter state
    const [showFilters, setShowFilters] = useState(false);
    const [filterSettings, setFilterSettings] = useState({
        stage: 'ALL',
        priority: 'ALL',
        minValue: '',
        maxValue: ''
    });

    const canAssign = hasPermission(user?.role as Role, 'canAssignLeads');

    useEffect(() => {
        fetchLeads();
    }, [fetchLeads]);

    // Fetch sales users for the assign dropdown (Managers only)
    useEffect(() => {
        if (canAssign) {
            import('../utils/api').then(({ default: api }) => {
                api.get('/users/sales').then(res => setSalesUsers(res.data)).catch(() => {});
            });
        }
    }, [canAssign]);

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

    const filteredLeads = leads.filter(lead => {
        const matchesSearch = 
            lead.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
            lead.contact.toLowerCase().includes(searchTerm.toLowerCase()) ||
            lead.email.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStage = filterSettings.stage === 'ALL' || lead.stage === filterSettings.stage;
        const matchesPriority = filterSettings.priority === 'ALL' || lead.priority === filterSettings.priority;
        
        const value = lead.value || 0;
        const matchesMinVal = filterSettings.minValue === '' || value >= parseFloat(filterSettings.minValue);
        const matchesMaxVal = filterSettings.maxValue === '' || value <= parseFloat(filterSettings.maxValue);

        return matchesSearch && matchesStage && matchesPriority && matchesMinVal && matchesMaxVal;
    });

    return (
        <div className="flex flex-col md:flex-row min-h-screen bg-background text-foreground">
            <Sidebar />
            <main className="flex-1 min-w-0 crm-page-container">
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
                                className="crm-input !pl-11 border-border focus:border-[#00D4AA]/50 group-focus-within:ring-4 group-focus-within:ring-[#00D4AA]/5 shadow-none"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <button 
                                onClick={() => setShowFilters(!showFilters)}
                                className={`crm-btn-secondary w-full md:w-auto !py-2.5 flex items-center justify-center gap-2 transition-all duration-300 ${showFilters ? 'bg-muted/80 text-[#00D4AA] border-[#00D4AA]/30' : ''}`}
                            >
                                <Filter className={`w-4 h-4 ${showFilters ? 'animate-pulse' : ''}`} />
                                <span>Advanced Filters</span>
                            </button>
                        </div>
                    </div>

                    {/* Advanced Filters Panel */}
                    <AnimatePresence>
                        {showFilters && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="crm-card border-border bg-muted/5 p-6 grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 relative group">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Pipeline Stage</label>
                                        <select 
                                            value={filterSettings.stage}
                                            onChange={(e) => setFilterSettings({ ...filterSettings, stage: e.target.value })}
                                            className="crm-input text-xs font-bold bg-card border-border"
                                        >
                                            <option value="ALL">ALL STAGES</option>
                                            <option value="NEW">NEW LEAD</option>
                                            <option value="CONTACTED">CONTACTED</option>
                                            <option value="QUALIFIED">QUALIFIED</option>
                                            <option value="PROPOSAL">PROPOSAL</option>
                                            <option value="CONVERTED">CONVERTED</option>
                                            <option value="LOST">LOST LEAD</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Priority Tier</label>
                                        <select 
                                            value={filterSettings.priority}
                                            onChange={(e) => setFilterSettings({ ...filterSettings, priority: e.target.value })}
                                            className="crm-input text-xs font-bold bg-card border-border"
                                        >
                                            <option value="ALL">ALL PRIORITIES</option>
                                            <option value="HIGH">HIGH PRIORITY</option>
                                            <option value="MEDIUM">MEDIUM PRIORITY</option>
                                            <option value="LOW">LOW PRIORITY</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Projected Value (Min/Max)</label>
                                        <div className="flex items-center gap-2">
                                            <input 
                                                type="number" 
                                                placeholder="Min ₹"
                                                value={filterSettings.minValue}
                                                onChange={(e) => setFilterSettings({ ...filterSettings, minValue: e.target.value })}
                                                className="crm-input text-xs font-bold bg-card border-border"
                                            />
                                            <input 
                                                type="number" 
                                                placeholder="Max ₹"
                                                value={filterSettings.maxValue}
                                                onChange={(e) => setFilterSettings({ ...filterSettings, maxValue: e.target.value })}
                                                className="crm-input text-xs font-bold bg-card border-border"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex items-end">
                                        <button 
                                            onClick={() => setFilterSettings({ stage: 'ALL', priority: 'ALL', minValue: '', maxValue: '' })}
                                            className="w-full py-3.5 rounded-xl text-[10px] font-bold uppercase tracking-widest border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-all duration-300"
                                        >
                                            Reset Controls
                                        </button>
                                    </div>
                                    {/* Glass reflection effect */}
                                    <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#00D4AA]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

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
                                        {canAssign && <th className="crm-table-th">Assigned To</th>}
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
                                            {canAssign && (
                                                <td className="crm-table-td">
                                                    <span className="text-xs font-bold text-muted-foreground">{lead.assignedTo || 'Unassigned'}</span>
                                                </td>
                                            )}
                                            <td className="crm-table-td text-right">
                                                <div className="flex items-center gap-1 justify-end">
                                                    {canAssign && (
                                                        <button
                                                            onClick={() => { setAssignModal({ open: true, leadId: lead.id }); setSelectedAssignee(''); }}
                                                            className="p-2 rounded-lg transition-all text-muted-foreground hover:bg-purple-500/10 hover:text-purple-400"
                                                            title="Assign Lead"
                                                        >
                                                            <UserCheck className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                    <button className="p-2 rounded-lg transition-all text-muted-foreground hover:bg-[#00D4AA]/10 hover:text-[#00D4AA]">
                                                        <MoreHorizontal className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="p-24 text-center space-y-4">
                                <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto bg-muted/10 ring-8 ring-muted/5">
                                    <Users className="w-10 h-10 text-muted-foreground" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-xl font-bold text-foreground">No Leads Yet</h3>
                                    <p className="font-medium text-sm text-muted-foreground">Add your first lead to start building your pipeline</p>
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
                                        <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors text-muted-foreground group-focus-within:text-[#00D4AA]" />
                                        <input required type="text" className="crm-input !pl-11" placeholder="e.g. Tata Consultancy Services" value={formData.company} onChange={(e) => setFormData({ ...formData, company: e.target.value })} />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="crm-label">Contact Name *</label>
                                    <div className="relative group">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors text-muted-foreground group-focus-within:text-[#00D4AA]" />
                                        <input required type="text" className="crm-input !pl-11" placeholder="Primary contact person" value={formData.contact} onChange={(e) => setFormData({ ...formData, contact: e.target.value })} />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="crm-label">Email Address *</label>
                                    <div className="relative group">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors text-muted-foreground group-focus-within:text-[#00D4AA]" />
                                        <input required type="email" className="crm-input !pl-11" placeholder="contact@company.com" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="crm-label">Phone Number</label>
                                    <div className="relative group">
                                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors text-muted-foreground group-focus-within:text-[#00D4AA]" />
                                        <input type="tel" className="crm-input !pl-11" placeholder="+91 98765 43210" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="crm-label">Projected Value (₹)</label>
                                    <div className="relative group">
                                        <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors text-muted-foreground group-focus-within:text-[#00D4AA]" />
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
            {/* Assign Lead Modal (Manager only) */}
            {assignModal.open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-hidden">
                    <div className="absolute inset-0 backdrop-blur-md bg-black/60" onClick={() => setAssignModal({ open: false, leadId: null })} />
                    <div className="rounded-[2rem] w-full max-w-md relative overflow-hidden bg-card border border-border shadow-2xl animate-in zoom-in-95 duration-300">
                        <div className="p-8 flex justify-between items-start border-b border-border">
                            <div>
                                <h2 className="text-xl font-bold tracking-tight text-foreground" style={{ fontFamily: 'Outfit, sans-serif' }}>Assign Lead</h2>
                                <p className="mt-1 font-medium text-sm tracking-tight text-muted-foreground">Select a team member to assign this lead to</p>
                            </div>
                            <button
                                onClick={() => setAssignModal({ open: false, leadId: null })}
                                className="p-2.5 rounded-xl transition-all group text-muted-foreground hover:text-foreground"
                            >
                                <X className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                            </button>
                        </div>
                        <div className="p-8 space-y-6">
                            <div className="space-y-2">
                                <label className="crm-label">Assign To</label>
                                <select
                                    value={selectedAssignee}
                                    onChange={(e) => setSelectedAssignee(e.target.value)}
                                    className="crm-input font-bold appearance-none cursor-pointer bg-background"
                                >
                                    <option value="">Select a team member...</option>
                                    {salesUsers.map(u => (
                                        <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex gap-4 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setAssignModal({ open: false, leadId: null })}
                                    className="crm-btn-secondary w-full !py-3"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    disabled={!selectedAssignee}
                                    onClick={async () => {
                                        if (assignModal.leadId && selectedAssignee) {
                                            try {
                                                await assignLead(assignModal.leadId, parseInt(selectedAssignee));
                                                setAssignModal({ open: false, leadId: null });
                                            } catch (err) {
                                                console.error('Failed to assign lead:', err);
                                            }
                                        }
                                    }}
                                    className="crm-btn-primary w-full !py-3 disabled:opacity-50"
                                >
                                    Assign Lead
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
