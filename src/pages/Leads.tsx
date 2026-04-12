import { useState, useEffect } from 'react';
import { Sidebar } from '../components/Sidebar';
import { Plus, Users, Search, Filter, MoreHorizontal, Mail, Phone, Building2, User, X, IndianRupee, UserCheck, Calendar, Activity } from 'lucide-react';
import { useQuery, useMutation, useQueryClient, QueryErrorResetBoundary } from '@tanstack/react-query';
import { getLeads, createLead as createLeadApi, assignLead as assignLeadApi, LeadType as Lead } from '../api/leads';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { hasPermission } from '../utils/permissions';
import { Role } from '../utils/roles';
import { formatDate } from '../utils/dateHelpers';
import { motion, AnimatePresence } from 'framer-motion';
import { TableSkeleton } from '@/components/ui/skeleton';
import { validateLeadForm, validateCompany, validateName, validateEmail, validatePhone, type ValidationErrors } from '../utils/validation';

function LeadsInnerContent() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<ValidationErrors>({});
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

    const [showFilters, setShowFilters] = useState(false);
    const [filterSettings, setFilterSettings] = useState({
        stage: 'ALL',
        priority: 'ALL',
        minValue: '',
        maxValue: ''
    });

    const { data: leads = [], isLoading: loading } = useQuery({
        queryKey: ['leads', filterSettings],
        queryFn: getLeads,
        enabled: !!user?.id,
    });

    const canAssign = hasPermission(user?.role as Role, 'canAssignLeads');

    useEffect(() => {
        if (canAssign) {
            import('../utils/api').then(({ default: api }) => {
                api.get('/users/sales').then(res => setSalesUsers(res.data)).catch(() => {});
            });
        }
    }, [canAssign]);

    const canCreate = hasPermission(user?.role as Role, 'canCreateLeads');

    const createMutation = useMutation({
        mutationFn: createLeadApi,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['leads'] });
            toast.success('Lead established in pipeline');
        },
        onError: () => toast.error('Failed to establish lead')
    });

    const assignMutation = useMutation({
        mutationFn: assignLeadApi,
        onSuccess: () => {
             queryClient.invalidateQueries({ queryKey: ['leads'] });
             toast.success('Lead assignment successful');
        },
        onError: () => toast.error('Assignment failure')
    });

    const handleCreateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const errors = validateLeadForm(formData);
        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            return;
        }
        try {
            await createMutation.mutateAsync(formData);
            setIsModalOpen(false);
            setFieldErrors({});
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

    const handleLeadFieldBlur = (field: keyof typeof formData) => {
        if (field === 'company') {
            const err = validateCompany(formData.company);
            setFieldErrors((prev: ValidationErrors) => ({ ...prev, company: err || '' }));
        } else if (field === 'contact') {
            const err = validateName(formData.contact, 'Contact name');
            setFieldErrors((prev: ValidationErrors) => ({ ...prev, contact: err || '' }));
        } else if (field === 'email') {
            const err = validateEmail(formData.email);
            setFieldErrors((prev: ValidationErrors) => ({ ...prev, email: err || '' }));
        } else if (field === 'phone') {
            const err = validatePhone(String(formData.phone || ''));
            setFieldErrors((prev: ValidationErrors) => ({ ...prev, phone: err || '' }));
        }
    };

    const filteredLeads = leads.filter(lead => {
        const matchesSearch = 
            (lead.company || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (lead.contact || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (lead.email || '').toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStage = filterSettings.stage === 'ALL' || lead.stage === filterSettings.stage;
        const matchesPriority = filterSettings.priority === 'ALL' || lead.priority === filterSettings.priority;
        
        const value = lead.value || 0;
        const matchesMinVal = filterSettings.minValue === '' || value >= parseFloat(filterSettings.minValue);
        const matchesMaxVal = filterSettings.maxValue === '' || value <= parseFloat(filterSettings.maxValue);

        return matchesSearch && matchesStage && matchesPriority && matchesMinVal && matchesMaxVal;
    });

    return (
        <main className="crm-main-content">
            {/* ── Background Effects ── */}
            <div className="ll-hero-grid opacity-[0.03] dark:opacity-[0.05]" />
            <div className="ll-orb w-[500px] h-[500px] -top-32 -left-32 bg-primary/10 blur-[100px]" />
            <div className="ll-orb w-[400px] h-[400px] bottom-0 -right-32 bg-teal-500/5 blur-[120px]" />

            <div className="max-w-7xl mx-auto p-8 space-y-8 relative z-10">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                    <div className="animate-in slide-in-from-left duration-700">
                        <h1 className="text-3xl font-bold tracking-tight text-foreground">Leads Registry</h1>
                        <p className="text-sm font-medium text-muted-foreground mt-2">Manage and track your active prospects and client pipeline</p>
                    </div>
                    {canCreate && (
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="crm-btn-primary animate-in slide-in-from-right duration-700"
                        >
                            <Plus size={20} />
                            <span>Add Lead</span>
                        </button>
                    )}
                </div>

                {/* Controls Section */}
                <div className="crm-card !p-4 flex flex-col md:flex-row gap-4 items-center justify-between border-border/40">
                    <div className="relative w-full md:w-[400px] group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            placeholder="Search leads by name, email..."
                            className="crm-input !pl-11 border-transparent hover:border-border/40 group-focus-within:border-primary/30"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <button 
                            onClick={() => setShowFilters(!showFilters)}
                            className={`crm-btn-secondary !px-5 !py-3 flex items-center justify-center gap-2 ${showFilters ? 'bg-primary/10 text-primary border-primary/20 shadow-lg shadow-primary/5' : ''}`}
                        >
                            <Filter className={`w-4 h-4 ${showFilters ? 'scale-110' : ''}`} />
                            <span className="text-sm font-semibold">Filters</span>
                        </button>
                    </div>
                </div>

                {/* Advanced Operations Panel */}
                <AnimatePresence>
                    {showFilters && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="crm-card !p-8 grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 border-primary/10 bg-primary/[0.02]">
                                <div className="space-y-3">
                                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">Stage</label>
                                    <select 
                                        value={filterSettings.stage}
                                        onChange={(e) => setFilterSettings({ ...filterSettings, stage: e.target.value })}
                                        className="crm-input text-[11px] font-bold tracking-widest bg-muted/20"
                                    >
                                        <option value="ALL">All Stages</option>
                                        <option value="NEW">New</option>
                                        <option value="CONTACTED">Contacted</option>
                                        <option value="INTERESTED">Interested</option>
                                        <option value="CONVERTED">Converted</option>
                                        <option value="LOST">Lost</option>
                                    </select>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">Priority Level</label>
                                    <select 
                                        value={filterSettings.priority}
                                        onChange={(e) => setFilterSettings({ ...filterSettings, priority: e.target.value })}
                                        className="crm-input text-[11px] font-bold tracking-widest bg-muted/20"
                                    >
                                        <option value="ALL">All Priorities</option>
                                        <option value="HIGH">High Priority</option>
                                        <option value="MEDIUM">Medium Priority</option>
                                        <option value="LOW">Low Priority</option>
                                    </select>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">Value Range (₹)</label>
                                    <div className="flex items-center gap-3">
                                        <input 
                                            type="number" 
                                            placeholder="Min"
                                            value={filterSettings.minValue}
                                            onChange={(e) => setFilterSettings({ ...filterSettings, minValue: e.target.value })}
                                            className="crm-input text-[11px] font-bold tracking-widest bg-muted/20"
                                        />
                                        <input 
                                            type="number" 
                                            placeholder="Max"
                                            value={filterSettings.maxValue}
                                            onChange={(e) => setFilterSettings({ ...filterSettings, maxValue: e.target.value })}
                                            className="crm-input text-[11px] font-bold tracking-widest bg-muted/20"
                                        />
                                    </div>
                                </div>
                                <div className="flex items-end">
                                    <button 
                                        onClick={() => setFilterSettings({ stage: 'ALL', priority: 'ALL', minValue: '', maxValue: '' })}
                                        className="crm-btn-secondary w-full !py-3.5 !text-xs font-semibold tracking-wider border-dashed"
                                    >
                                        Reset Filters
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Ledger Visualization */}
                <div className="min-h-[500px] animate-in fade-in duration-1000">
                    {loading ? (
                        <TableSkeleton />
                    ) : filteredLeads.length > 0 ? (
                        <>
                            {/* Pro Desktop Grid View */}
                            <div className="hidden md:block crm-table-container">
                                <table className="crm-table">
                                    <thead className="bg-muted/30 border-b border-border/50">
                                        <tr>
                                            <th className="px-6 py-4 text-xs font-semibold text-muted-foreground text-left uppercase tracking-wider">Organization</th>
                                            <th className="px-6 py-4 text-xs font-semibold text-muted-foreground text-left uppercase tracking-wider">Contact Person</th>
                                            <th className="px-6 py-4 text-xs font-semibold text-muted-foreground text-left uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-4 text-xs font-semibold text-muted-foreground text-left uppercase tracking-wider">Priority</th>
                                            <th className="px-6 py-4 text-xs font-semibold text-muted-foreground text-left uppercase tracking-wider">Value</th>
                                            {canAssign && <th className="px-6 py-4 text-xs font-semibold text-muted-foreground text-left uppercase tracking-wider">Assigned</th>}
                                            <th className="px-6 py-4 text-xs font-semibold text-muted-foreground text-left uppercase tracking-wider">Added On</th>
                                            <th className="px-6 py-4 text-xs font-semibold text-muted-foreground text-right uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredLeads.map((lead, i) => (
                                            <tr key={lead.id} className={`crm-table-tr group animate-in slide-in-from-bottom duration-500 delay-${Math.min(i * 50, 400)}`}>
                                                <td className="px-6 py-4 border-b border-border/40 whitespace-nowrap">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-11 h-11 rounded-xl flex items-center justify-center font-semibold text-base transition-all group-hover:scale-110 bg-primary/10 text-primary border border-primary/20 shadow-inner group-hover:rotate-6">
                                                            {lead.company.charAt(0)}
                                                        </div>
                                                        <span className="font-semibold text-foreground">{lead.company}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 border-b border-border/40 whitespace-nowrap">
                                                    <div className="space-y-1">
                                                        <p className="font-medium text-foreground">{lead.contact}</p>
                                                        <p className="text-xs text-muted-foreground flex items-center gap-1.5 uppercase tracking-widest">
                                                            <Mail size={12} className="opacity-60" />
                                                            {lead.email}
                                                        </p>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 border-b border-border/40 whitespace-nowrap">
                                                    <span className={`crm-badge ${lead.stage === 'NEW' ? 'badge-stage-new' :
                                                            lead.stage === 'CONTACTED' ? 'badge-stage-contacted' :
                                                                lead.stage === 'INTERESTED' ? 'badge-stage-qualified' :
                                                                    lead.stage === 'CONVERTED' ? 'badge-stage-converted' :
                                                                        'badge-stage-lost'
                                                        }`}>
                                                        {lead.stage}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 border-b border-border/40 whitespace-nowrap">
                                                    <span className={`crm-badge ${lead.priority === 'HIGH' ? 'badge-priority-high' :
                                                        lead.priority === 'MEDIUM' ? 'badge-priority-medium' :
                                                            'badge-priority-low'
                                                        }`}>
                                                        {lead.priority}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 border-b border-border/40 whitespace-nowrap">
                                                    <div className="flex items-center gap-1 font-medium text-sm text-foreground">
                                                        <span className="text-muted-foreground mr-0.5">₹</span>
                                                        {lead.value.toLocaleString('en-IN')}
                                                    </div>
                                                </td>
                                                {canAssign && (
                                                    <td className="px-6 py-4 border-b border-border/40 whitespace-nowrap">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-5 h-5 rounded-full bg-purple-500/20 border border-purple-500/20 flex items-center justify-center text-[10px] font-bold text-purple-600 dark:text-purple-400">
                                                                {(lead.assignedTo || '?').charAt(0)}
                                                            </div>
                                                            <span className="text-xs font-medium text-muted-foreground">
                                                                {lead.assignedTo || 'UNASSIGNED'}
                                                            </span>
                                                        </div>
                                                    </td>
                                                )}
                                                <td className="px-6 py-4 border-b border-border/40 whitespace-nowrap">
                                                    <div className="flex flex-col gap-0.5">
                                                        <span className="text-sm font-medium text-muted-foreground">{formatDate(lead.createdAt)}</span>
                                                        
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 border-b border-border/40 whitespace-nowrap text-right">
                                                    <div className="flex items-center gap-1.5 justify-end">
                                                        {canAssign && (
                                                            <button
                                                                onClick={() => { setAssignModal({ open: true, leadId: lead.id }); setSelectedAssignee(''); }}
                                                                className="w-9 h-9 flex items-center justify-center rounded-xl transition-all text-muted-foreground hover:bg-purple-500/10 hover:text-purple-400 border border-transparent hover:border-purple-500/20"
                                                                title="Assign Lead"
                                                            >
                                                                <UserCheck size={16} />
                                                            </button>
                                                        )}
                                                        <button className="w-9 h-9 flex items-center justify-center rounded-xl transition-all text-muted-foreground hover:bg-primary/10 hover:text-primary border border-transparent hover:border-primary/20">
                                                            <MoreHorizontal size={18} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile View */}
                            <div className="md:hidden space-y-4">
                                {filteredLeads.map((lead) => (
                                    <div key={lead.id} className="crm-card border-border/40 shadow-xl active:scale-[0.98] transition-all bg-muted/5">
                                        <div className="flex items-center justify-between mb-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-full flex items-center justify-center font-semibold text-xl bg-primary/10 text-primary">
                                                    {lead.company.charAt(0)}
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-lg text-foreground">{lead.company}</h3>
                                                    <p className="text-sm font-medium text-muted-foreground mt-1">{lead.contact}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {canAssign && (
                                                    <button 
                                                        onClick={() => { setAssignModal({ open: true, leadId: lead.id }); setSelectedAssignee(''); }}
                                                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20"
                                                    >
                                                        <UserCheck size={16} />
                                                    </button>
                                                )}
                                                <button className="w-10 h-10 flex items-center justify-center rounded-xl bg-muted/20 text-muted-foreground border border-border/40">
                                                    <MoreHorizontal size={16} />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 mb-6">
                                            <div className="p-4 rounded-2xl bg-muted/10 border border-border/40">
                                                <p className="text-xs font-semibold text-muted-foreground mb-1.5">Vector Status</p>
                                                <div className="scale-75 origin-left">
                                                    <span className={`crm-badge ${lead.stage === 'NEW' ? 'badge-stage-new' :
                                                        lead.stage === 'CONTACTED' ? 'badge-stage-contacted' :
                                                            lead.stage === 'CONVERTED' ? 'badge-stage-converted' :
                                                                'badge-stage-lost'}`}>
                                                        {lead.stage}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="p-4 rounded-2xl bg-muted/10 border border-border/40 text-right">
                                                <p className="text-xs font-semibold text-muted-foreground mb-1.5">Urgency TIER</p>
                                                <div className="scale-75 origin-right">
                                                    <span className={`crm-badge ${lead.priority === 'HIGH' ? 'badge-priority-high' :
                                                        lead.priority === 'MEDIUM' ? 'badge-priority-medium' :
                                                            'badge-priority-low'}`}>
                                                        {lead.priority}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-end justify-between pt-6 border-t border-border/20">
                                            <div className="space-y-2">
                                                <p className="text-sm text-muted-foreground flex items-center gap-2">
                                                    <Mail size={12} className="text-primary opacity-60" />
                                                    {lead.email}
                                                </p>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-4 h-4 rounded-full bg-purple-500/20 flex items-center justify-center text-[7px] font-semibold text-purple-400">
                                                        {(lead.assignedTo || '?').charAt(0)}
                                                    </div>
                                                    <p className="text-sm text-muted-foreground">
                                                        Agent: <span className="text-foreground">{lead.assignedTo || 'UNASSIGNED'}</span>
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-lg font-semibold text-foreground">₹{lead.value.toLocaleString('en-IN')}</p>
                                                <p className="text-xs text-muted-foreground mt-1">{formatDate(lead.createdAt)}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center p-24 glass-morphic border-dashed border-border/40 text-center animate-in zoom-in duration-700">
                            <div className="w-24 h-24 rounded-3xl flex items-center justify-center bg-primary/5 ring-[12px] ring-primary/5 mb-8">
                                <Users size={40} className="text-primary/40" />
                            </div>
                            <div className="space-y-3">
                                <h3 className="text-2xl font-bold text-foreground" style={{ fontFamily: 'var(--ll-font-display)' }}>No Leads Found</h3>
                                <p className="font-bold text-sm text-muted-foreground leading-relaxed max-w-sm">Get started by adding a new lead to your pipeline.</p>
                            </div>
                            {canCreate && (
                                <button
                                    onClick={() => setIsModalOpen(true)}
                                    className="crm-btn-primary !px-10 !py-4 mt-8"
                                >
                                    <Plus size={20} />
                                    <span>Add Add Lead</span>
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Creation Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            exit={{ opacity: 0 }} 
                            className="absolute inset-0 backdrop-blur-xl bg-background/60" 
                            onClick={() => setIsModalOpen(false)} 
                        />
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="rounded-[2.5rem] w-full max-w-2xl relative overflow-hidden bg-background/80 border border-white/10 shadow-[0_32px_128px_-16px_rgba(0,0,0,0.5)] dark:shadow-[0_32px_128px_-16px_rgba(0,0,0,0.8)] backdrop-blur-2xl"
                        >
                            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
                            
                            <div className="p-10 flex justify-between items-start border-b border-border/40">
                                <div>
                                    <h2 className="text-2xl font-semibold uppercase tracking-tight text-foreground" style={{ fontFamily: 'var(--ll-font-display)' }}>Add Lead</h2>
                                    <p className="mt-2 font-bold text-sm text-muted-foreground flex items-center gap-2">
                                        <Activity size={14} className="text-primary animate-pulse" />
                                        Enter details for the new prospect
                                    </p>
                                </div>
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="w-11 h-11 flex items-center justify-center rounded-2xl transition-all group hover:bg-muted"
                                >
                                    <X className="w-6 h-6 group-hover:rotate-90 transition-transform opacity-40 group-hover:opacity-100" />
                                </button>
                            </div>

                            <form onSubmit={handleCreateSubmit} className="p-10 space-y-10 max-h-[70vh] overflow-y-auto custom-scrollbar">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                    <div className="space-y-3">
                                        <label className="crm-label font-semibold text-xs tracking-wider ml-1">COMPANY NAME</label>
                                        <div className="relative group">
                                            <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-all text-muted-foreground/40 group-focus-within:text-primary group-focus-within:scale-110" />
                                            <input
                                                required
                                                type="text"
                                                className={`crm-input !pl-12 !py-4 font-bold border-border/40 focus:border-primary/40 focus:bg-primary/[0.02] ${fieldErrors.company ? 'border-red-500/50' : ''}`}
                                                placeholder="e.g. LeadLink Enterprise"
                                                value={formData.company}
                                                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                                                onBlur={() => handleLeadFieldBlur('company')}
                                            />
                                        </div>
                                        {fieldErrors.company && <p className="text-red-400 text-[10px] font-bold uppercase tracking-widest ml-1">{fieldErrors.company}</p>}
                                    </div>
                                    <div className="space-y-3">
                                        <label className="crm-label font-semibold text-xs tracking-wider ml-1">CONTACT PERSON</label>
                                        <div className="relative group">
                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-all text-muted-foreground/40 group-focus-within:text-primary group-focus-within:scale-110" />
                                            <input
                                                required
                                                type="text"
                                                className={`crm-input !pl-12 !py-4 font-bold border-border/40 focus:border-primary/40 focus:bg-primary/[0.02] ${fieldErrors.contact ? 'border-red-500/50' : ''}`}
                                                placeholder="Lead representative"
                                                value={formData.contact}
                                                onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                                                onBlur={() => handleLeadFieldBlur('contact')}
                                            />
                                        </div>
                                        {fieldErrors.contact && <p className="text-red-400 text-[10px] font-bold uppercase tracking-widest ml-1">{fieldErrors.contact}</p>}
                                    </div>
                                    <div className="space-y-3">
                                        <label className="crm-label font-semibold text-xs tracking-wider ml-1">EMAIL ADDRESS</label>
                                        <div className="relative group">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-all text-muted-foreground/40 group-focus-within:text-primary group-focus-within:scale-110" />
                                            <input
                                                required
                                                type="email"
                                                className={`crm-input !pl-12 !py-4 font-bold border-border/40 focus:border-primary/40 focus:bg-primary/[0.02] ${fieldErrors.email ? 'border-red-500/50' : ''}`}
                                                placeholder="contact@entity.com"
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                onBlur={() => handleLeadFieldBlur('email')}
                                            />
                                        </div>
                                        {fieldErrors.email && <p className="text-red-400 text-[10px] font-bold uppercase tracking-widest ml-1">{fieldErrors.email}</p>}
                                    </div>
                                    <div className="space-y-3">
                                        <label className="crm-label font-semibold text-xs tracking-wider ml-1">PHONE NUMBER</label>
                                        <div className="relative group">
                                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-all text-muted-foreground/40 group-focus-within:text-primary group-focus-within:scale-110" />
                                            <input
                                                type="tel"
                                                className={`crm-input !pl-12 !py-4 font-bold border-border/40 focus:border-primary/40 focus:bg-primary/[0.02] ${fieldErrors.phone ? 'border-red-500/50' : ''}`}
                                                placeholder="Voice frequency"
                                                value={formData.phone}
                                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                onBlur={() => handleLeadFieldBlur('phone')}
                                            />
                                        </div>
                                        {fieldErrors.phone && <p className="text-red-400 text-[10px] font-bold uppercase tracking-widest ml-1">{fieldErrors.phone}</p>}
                                    </div>
                                    <div className="space-y-3">
                                        <label className="crm-label font-semibold text-xs tracking-wider ml-1">ESTIMATED VALUE (₹)</label>
                                        <div className="relative group">
                                            <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-all text-muted-foreground/40 group-focus-within:text-primary group-focus-within:scale-110" />
                                            <input required type="number" className="crm-input !pl-12 !py-4 font-bold border-border/40 bg-muted/20" placeholder="Revenue forecast" value={formData.value} onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })} />
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="crm-label font-semibold text-xs tracking-wider ml-1">PRIORITY</label>
                                        <select className="crm-input !py-4 font-semibold tracking-widest bg-muted/20 border-border/40 cursor-pointer" value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}>
                                            <option value="LOW">Low Priority</option>
                                            <option value="MEDIUM">Medium Priority</option>
                                            <option value="HIGH">High Priority</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="flex gap-6 pt-6">
                                    <button type="button" disabled={createMutation.isPending} onClick={() => { setIsModalOpen(false); setFieldErrors({}); }} className="crm-btn-secondary w-full !py-4 !text-xs font-semibold tracking-wider">CANCEL</button>
                                    <button type="submit" disabled={createMutation.isPending} className="crm-btn-primary w-full !py-4 !text-xs font-semibold tracking-wider">
                                        {createMutation.isPending ? 'SAVING...' : 'CREATE LEAD'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Assignment Modal */}
            <AnimatePresence>
                {assignModal.open && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            exit={{ opacity: 0 }} 
                            className="absolute inset-0 backdrop-blur-xl bg-background/60" 
                            onClick={() => setAssignModal({ open: false, leadId: null })} 
                        />
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="rounded-[2.5rem] w-full max-w-md relative overflow-hidden bg-background/80 border border-white/10 shadow-2xl backdrop-blur-2xl"
                        >
                            <div className="p-8 flex justify-between items-start border-b border-border/40">
                                <div>
                                    <h2 className="text-xl font-semibold uppercase tracking-tight text-foreground" style={{ fontFamily: 'var(--ll-font-display)' }}>Assign Lead</h2>
                                    <p className="mt-2 text-xs font-bold text-muted-foreground">Choose a team member to handle this lead</p>
                                </div>
                                <button
                                    onClick={() => setAssignModal({ open: false, leadId: null })}
                                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-muted/40"
                                >
                                    <X size={20} className="opacity-40" />
                                </button>
                            </div>
                            <div className="p-8 space-y-8">
                                <div className="space-y-3">
                                    <label className="crm-label font-semibold text-xs tracking-wider ml-1">SELECT USER</label>
                                    <div className="relative">
                                        <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/40" />
                                        <select
                                            value={selectedAssignee}
                                            onChange={(e) => setSelectedAssignee(e.target.value)}
                                            className="crm-input !pl-12 !py-4 font-semibold tracking-widest bg-muted/20 appearance-none cursor-pointer"
                                        >
                                            <option value="">Select team member...</option>
                                            {salesUsers.map(u => (
                                                <option key={u.id} value={u.id}>{u.name.toUpperCase()} ({u.role})</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                 <div className="flex gap-4">
                                    <button
                                        type="button"
                                        disabled={assignMutation.isPending}
                                        onClick={() => setAssignModal({ open: false, leadId: null })}
                                        className="crm-btn-secondary w-full !py-4 !text-xs font-semibold tracking-wider"
                                    >
                                        ABORT
                                    </button>
                                    <button
                                        type="button"
                                        disabled={!selectedAssignee || assignMutation.isPending}
                                        onClick={async () => {
                                            if (assignModal.leadId && selectedAssignee) {
                                                try {
                                                    await assignMutation.mutateAsync({ id: assignModal.leadId, assignedToId: parseInt(selectedAssignee) });
                                                    setAssignModal({ open: false, leadId: null });
                                                } catch (err) {
                                                    console.error('Failed to assign lead:', err);
                                                }
                                            }
                                        }}
                                        className="crm-btn-primary w-full !py-4 !text-xs font-semibold tracking-wider"
                                    >
                                        {assignMutation.isPending ? 'ASSIGNING...' : 'ASSIGN'}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </main>
    );
}

export default function Leads() {
    return (
        <div className="crm-page-container">
            <Sidebar />
            <QueryErrorResetBoundary>
                {({ reset }) => (
                    <ErrorBoundary onReset={reset} message="Failed to load personnel pipeline">
                        <LeadsInnerContent />
                    </ErrorBoundary>
                )}
            </QueryErrorResetBoundary>
        </div>
    );
}
