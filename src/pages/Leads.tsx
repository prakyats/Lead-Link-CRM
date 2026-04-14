import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Sidebar } from '../components/Sidebar';
import { Plus, Users, Search, Filter, MoreHorizontal, Mail, Phone, Building2, User, X, IndianRupee, UserCheck, Calendar, Activity, ChevronRight, Globe, Shield, Target } from 'lucide-react';
import { useQuery, useMutation, useQueryClient, QueryErrorResetBoundary } from '@tanstack/react-query';
import { getLeads, createLead as createLeadApi, assignLead as assignLeadApi, LeadType as Lead } from '../api/leads';
import { getSalesUsers } from '../api/users';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { hasPermission } from '../utils/permissions';
import { Role } from '../utils/roles';
import { formatDate } from '../utils/dateHelpers';
import { motion, AnimatePresence } from 'framer-motion';
import { TableSkeleton } from '@/components/ui/skeleton';
import { validateLeadForm, validateCompany, validateName, validateEmail, validatePhone, type ValidationErrors } from '../utils/validation';
import { CreateLeadModal } from '../components/CreateLeadModal';
import { AssignLeadModal } from '../components/AssignLeadModal';


function LeadsInnerContent() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedAssignee, setSelectedAssignee] = useState('');

    const [showFilters, setShowFilters] = useState(false);
    const [filterSettings, setFilterSettings] = useState({
        stage: 'ALL',
        priority: 'ALL',
        manager: 'ALL',
        minValue: '',
        maxValue: ''
    });

    const [salesUsers, setSalesUsers] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [assignModal, setAssignModal] = useState<{ open: boolean; leadId: number | null }>({
        open: false,
        leadId: null
    });
    const [expandedLeadId, setExpandedLeadId] = useState<number | null>(null);

    // ── Modal Handlers ──
    const handleOpenCreateModal = useCallback(() => setIsModalOpen(true), []);
    const handleCloseCreateModal = useCallback(() => setIsModalOpen(false), []);
    
    const handleOpenAssignModal = useCallback((leadId: number) => {
        setAssignModal({ open: true, leadId });
    }, []);
    
    const handleCloseAssignModal = useCallback(() => {
        setAssignModal({ open: false, leadId: null });
    }, []);

    const { data: leads = [], isLoading: loading } = useQuery({
        queryKey: ['leads', filterSettings],
        queryFn: getLeads,
        enabled: !!user?.id,
    });

    const canAssign = hasPermission(user?.role as Role, 'canAssignLeads');

    useEffect(() => {
        if (canAssign) {
            getSalesUsers().then(res => setSalesUsers(res)).catch(() => {});
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

    const handleCreateLead = useCallback(async (data: any) => {
        await createMutation.mutateAsync(data);
    }, [createMutation]);

    const handleAssignLead = useCallback(async (assigneeId: string) => {
        if (!assignModal.leadId) return;
        await assignMutation.mutateAsync({
            id: assignModal.leadId,
            assignedToId: parseInt(assigneeId)
        });
    }, [assignMutation, assignModal.leadId]);

    const filteredLeads = leads.filter(lead => {
        const matchesSearch = 
            (lead.company || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (lead.contact || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (lead.email || '').toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStage = filterSettings.stage === 'ALL' || lead.stage === filterSettings.stage;
        const matchesPriority = filterSettings.priority === 'ALL' || lead.priority === filterSettings.priority;
        const matchesStaff = user?.role === 'MANAGER' 
            ? (filterSettings.manager === 'ALL' || lead.assignedTo === filterSettings.manager)
            : (filterSettings.manager === 'ALL' || lead.managerName === filterSettings.manager);
        
        const value = lead.value || 0;
        const matchesMinVal = filterSettings.minValue === '' || value >= parseFloat(filterSettings.minValue);
        const matchesMaxVal = filterSettings.maxValue === '' || value <= parseFloat(filterSettings.maxValue);

        return matchesSearch && matchesStage && matchesPriority && matchesStaff && matchesMinVal && matchesMaxVal;
    });

    const uniqueManagers = useMemo(() => {
        return Array.from(
            new Set(leads.map(l => l.managerName).filter((name): name is string => !!name))
        ).sort();
    }, [leads]);

    const uniqueAgents = useMemo(() => {
        return Array.from(
            new Set(leads.map(l => l.assignedTo).filter((name): name is string => !!name))
        ).sort();
    }, [leads]);

    return (
        <>
            <main className="crm-main-content">
            {/* ── Background Effects ── */}
            <div className="ll-hero-grid opacity-[0.03] dark:opacity-[0.05]" />
            <div className="ll-orb w-[500px] h-[500px] -top-32 -left-32 bg-primary/10 blur-[100px]" />
            <div className="ll-orb w-[400px] h-[400px] bottom-0 -right-32 bg-teal-500/5 blur-[120px]" />

            <div className="w-full mx-auto px-6 py-8 space-y-8 relative z-10">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
                    <div className="animate-in slide-in-from-left duration-700">
                        <h1 className="text-3xl font-bold tracking-tight text-foreground">Leads Registry</h1>
                        <p className="text-sm font-medium text-muted-foreground mt-2">Manage and track your active prospects and client pipeline</p>
                    </div>
                    {canCreate && (
                        <button
                            onClick={handleOpenCreateModal}
                            className="crm-btn-primary animate-in slide-in-from-right duration-700"
                        >
                            <Plus size={20} />
                            <span>Add Lead</span>
                        </button>
                    )}
                </div>

                {/* Controls Section */}
                <div className="crm-card !p-4 flex flex-col lg:flex-row gap-4 items-center justify-between border-border/40">
                    <div className="relative w-full lg:w-[400px] group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            placeholder="Search leads by name, email..."
                            className="crm-input !pl-11 border-transparent hover:border-border/40 group-focus-within:border-primary/30"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-3 w-full lg:w-auto">
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
                            <div className="crm-card !p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-8 mb-8 border-primary/10 bg-primary/[0.02]">
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
                                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">
                                        {user?.role === 'MANAGER' ? 'Representative' : 'Manager Oversight'}
                                    </label>
                                    <select 
                                        value={filterSettings.manager}
                                        onChange={(e) => setFilterSettings({ ...filterSettings, manager: e.target.value })}
                                        className="crm-input text-[11px] font-bold tracking-widest bg-muted/20"
                                    >
                                        <option value="ALL">{user?.role === 'MANAGER' ? 'All Reps' : 'All Managers'}</option>
                                        {(user?.role === 'MANAGER' ? uniqueAgents : uniqueManagers).map((name: string) => (
                                            <option key={name} value={name}>{name}</option>
                                        ))}
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
                                        onClick={() => setFilterSettings({ stage: 'ALL', priority: 'ALL', manager: 'ALL', minValue: '', maxValue: '' })}
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
                            <div className="hidden lg:block crm-table-container">
                                <div className="w-full min-w-full">
                                    {/* Modern Ledger Header */}
                                    <div className="flex items-center w-full bg-muted/30 border-b border-border/50 sticky top-0 z-20 backdrop-blur-md">
                                        <div className="w-[48px] px-4 py-3.5"></div>
                                        <div className="flex-1 px-4 py-3.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 text-left">Organization</div>
                                        <div className="w-[140px] px-4 py-3.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 text-left">Status</div>
                                        <div className="w-[130px] px-4 py-3.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 text-left">Priority</div>
                                        <div className="w-[160px] px-4 py-3.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 text-right">Value</div>
                                        {canAssign && <div className="w-[150px] px-4 py-3.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 text-left">Agent</div>}
                                        {user?.role === 'ADMIN' && <div className="w-[150px] px-4 py-3.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 text-left">Manager</div>}
                                        {canAssign && <div className="w-[80px] px-4 py-3.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 text-right">Action</div>}
                                    </div>

                                    {/* Data Rows */}
                                    <div>
                                        {filteredLeads.map((lead, i) => {
                                            const isExpanded = expandedLeadId === lead.id;
                                            
                                            const toggleExpand = (e: React.MouseEvent | React.KeyboardEvent) => {
                                                if ((e.target as HTMLElement).closest('button')) return;
                                                setExpandedLeadId(isExpanded ? null : lead.id);
                                            };

                                            return (
                                                <div key={lead.id} className="w-full group/row-container">
                                                    <div 
                                                        tabIndex={0}
                                                        onClick={toggleExpand}
                                                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleExpand(e); }}
                                                        className={`flex items-center w-full crm-table-tr select-none group/row outline-none cursor-pointer border-l-2 transition-all ${
                                                            isExpanded ? 'border-primary bg-primary/5' : 'border-transparent'
                                                        }`}
                                                    >
                                                        {/* Icon + Logo + Organization */}
                                                        <div className="w-[48px] px-4 py-3 flex items-center justify-center">
                                                            <motion.div
                                                                animate={{ rotate: isExpanded ? 90 : 0 }}
                                                                transition={{ duration: 0.2 }}
                                                                className="text-muted-foreground/40 group-hover/row:text-primary transition-colors"
                                                            >
                                                                <ChevronRight size={16} />
                                                            </motion.div>
                                                        </div>

                                                        <div className="flex-1 px-4 py-3 flex items-center gap-3 overflow-hidden">
                                                            <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-[10px] bg-primary/10 text-primary border border-primary/20 shrink-0">
                                                                {lead.company.charAt(0)}
                                                            </div>
                                                            <span className="font-bold text-sm text-foreground truncate block">
                                                                {lead.company}
                                                            </span>
                                                        </div>


                                                        {/* Status */}
                                                        <div className="w-[140px] px-4 py-3 whitespace-nowrap">
                                                            <span className={`crm-badge scale-90 origin-left ${lead.stage === 'NEW' ? 'badge-stage-new' :
                                                                    lead.stage === 'CONTACTED' ? 'badge-stage-contacted' :
                                                                        lead.stage === 'INTERESTED' ? 'badge-stage-qualified' :
                                                                            lead.stage === 'CONVERTED' ? 'badge-stage-converted' :
                                                                                'badge-stage-lost'
                                                                }`}>
                                                                {lead.stage}
                                                            </span>
                                                        </div>

                                                        {/* Priority */}
                                                        <div className="w-[130px] px-4 py-3 whitespace-nowrap">
                                                            <span className={`crm-badge scale-90 origin-left ${lead.priority === 'HIGH' ? 'badge-priority-high' :
                                                                lead.priority === 'MEDIUM' ? 'badge-priority-medium' :
                                                                    'badge-priority-low'
                                                                }`}>
                                                                {lead.priority}
                                                            </span>
                                                        </div>

                                                        {/* Value */}
                                                        <div className="w-[160px] px-4 py-3 text-right whitespace-nowrap font-mono-data">
                                                            <div className="flex items-center justify-end gap-1 font-bold text-sm text-foreground">
                                                                <span className="text-muted-foreground/60 mr-0.5 font-sans">₹</span>
                                                                {lead.value.toLocaleString('en-IN')}
                                                            </div>
                                                        </div>

                                                        {/* Agent */}
                                                        {canAssign && (
                                                            <div className="w-[150px] px-4 py-3 whitespace-nowrap">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-5 h-5 rounded-full bg-purple-500/20 border border-purple-500/20 flex items-center justify-center text-[9px] font-black text-purple-400 shrink-0">
                                                                        {(lead.assignedTo || '?').charAt(0)}
                                                                    </div>
                                                                    <span className="text-[11px] font-bold text-muted-foreground truncate">
                                                                        {lead.assignedTo || 'NONE'}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Manager */}
                                                        {user?.role === 'ADMIN' && (
                                                            <div className="w-[150px] px-4 py-3 whitespace-nowrap">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-5 h-5 rounded-full bg-blue-500/20 border border-blue-500/20 flex items-center justify-center text-[9px] font-black text-blue-400 shrink-0">
                                                                        <Shield size={10} />
                                                                    </div>
                                                                    <span className="text-[11px] font-bold text-foreground truncate">
                                                                        {lead.managerName || '—'}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Action */}
                                                        {canAssign && (
                                                            <div className="w-[80px] px-4 py-3 text-right whitespace-nowrap">
                                                                <button
                                                                    onClick={(e) => { 
                                                                        e.stopPropagation();
                                                                        handleOpenAssignModal(lead.id); 
                                                                    }}
                                                                    className="w-8 h-8 flex items-center justify-center rounded-lg transition-all text-muted-foreground hover:bg-purple-500/10 hover:text-purple-400 border border-transparent hover:border-purple-500/20 ml-auto"
                                                                    title="Assign Lead"
                                                                >
                                                                    <UserCheck size={14} />
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Expansion Row - Rebuilt for Flex */}
                                                    <AnimatePresence initial={false}>
                                                        {isExpanded && (
                                                            <motion.div
                                                                initial={{ height: 0, opacity: 0 }}
                                                                animate={{ height: "auto", opacity: 1 }}
                                                                exit={{ height: 0, opacity: 0 }}
                                                                transition={{ duration: 0.3, ease: "easeInOut" }}
                                                                className="overflow-hidden w-full border-b border-border/40 bg-muted/5"
                                                            >
                                                                <div className="p-8 pb-10 ml-12 grid grid-cols-1 md:grid-cols-2 gap-10 border-l border-primary/20">
                                                                    <div className="space-y-8">
                                                                        <div className="group/detail">
                                                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 flex items-center gap-2.5 mb-3 group-hover/detail:text-primary transition-colors">
                                                                                <Mail size={12} className="text-primary/60" />
                                                                                Communication Channel
                                                                            </p>
                                                                            <p className="text-sm font-bold text-foreground bg-card/40 px-4 py-3 rounded-xl border border-white/5 inline-block shadow-sm">
                                                                                {lead.email}
                                                                            </p>
                                                                        </div>
                                                                        <div className="flex flex-wrap gap-x-12 gap-y-6">
                                                                            <div>
                                                                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 flex items-center gap-2.5 mb-2.5">
                                                                                    <Calendar size={12} className="text-muted-foreground/40" />
                                                                                    Registry Date
                                                                                </p>
                                                                                <p className="text-sm font-bold text-muted-foreground">{formatDate(lead.createdAt)}</p>
                                                                            </div>
                                                                            <div>
                                                                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 flex items-center gap-2.5 mb-2.5">
                                                                                    <Target size={12} className="text-primary/60" />
                                                                                    Point of Contact
                                                                                </p>
                                                                                <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">{lead.contact}</p>
                                                                            </div>
                                                                            {user?.role === 'ADMIN' && lead.managerName && (
                                                                                <div>
                                                                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 flex items-center gap-2.5 mb-2.5">
                                                                                        <Shield size={12} className="text-purple-400/60" />
                                                                                        Managerial Oversight
                                                                                    </p>
                                                                                    <p className="text-sm font-bold text-purple-400 uppercase tracking-widest leading-none">{lead.managerName}</p>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                    
                                                                    <div className="hidden lg:flex flex-col justify-center border-l border-white/5 pl-10">
                                                                        <div className="flex items-center gap-3 text-muted-foreground/40 mb-3">
                                                                            <Globe size={16} />
                                                                            <span className="text-[10px] font-black uppercase tracking-[0.3em]">Operational Context</span>
                                                                        </div>
                                                                        <p className="text-xs text-muted-foreground leading-relaxed max-w-sm">
                                                                            This prospect is currently undergoing active lifecycle evaluation. Pipeline integrity is maintained via real-time risk diagnostic engines.
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* Mobile View */}
                            <div className="lg:hidden space-y-4">
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
                                                        onClick={() => handleOpenAssignModal(lead.id)}
                                                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20"
                                                    >
                                                        <UserCheck size={16} />
                                                    </button>
                                                )}
                                                {/* <button className="w-10 h-10 flex items-center justify-center rounded-xl bg-muted/20 text-muted-foreground border border-border/40">
                                                    <MoreHorizontal size={16} />
                                                </button> */}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3 mb-6">
                                            <div className="px-4 py-3 rounded-2xl bg-muted/10 border border-border/40 flex flex-col items-start justify-center">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 mb-2">Vector Status</p>
                                                <span className={`crm-badge text-[10px] leading-none py-1.5 ${lead.stage === 'NEW' ? 'badge-stage-new' :
                                                    lead.stage === 'CONTACTED' ? 'badge-stage-contacted' :
                                                        lead.stage === 'CONVERTED' ? 'badge-stage-converted' :
                                                            'badge-stage-lost'}`}>
                                                    {lead.stage}
                                                </span>
                                            </div>
                                            <div className="px-4 py-3 rounded-2xl bg-muted/10 border border-border/40 flex flex-col items-end justify-center">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 mb-2">Urgency Tier</p>
                                                <span className={`crm-badge text-[10px] leading-none py-1.5 ${lead.priority === 'HIGH' ? 'badge-priority-high' :
                                                    lead.priority === 'MEDIUM' ? 'badge-priority-medium' :
                                                        'badge-priority-low'}`}>
                                                    {lead.priority}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-end justify-between pt-6 border-t border-border/20">
                                            <div className="space-y-3">
                                                <p className="text-sm font-bold text-foreground flex items-center gap-2">
                                                    <Mail size={14} className="text-primary/60" />
                                                    {lead.email}
                                                </p>
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="w-6 h-6 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-[10px] font-black text-purple-400">
                                                            {(lead.assignedTo || '?').charAt(0)}
                                                        </div>
                                                        <p className="text-xs font-bold text-muted-foreground">
                                                            Agent: <span className="text-foreground">{lead.assignedTo || 'UNASSIGNED'}</span>
                                                        </p>
                                                    </div>
                                                    {user?.role === 'ADMIN' && lead.managerName && (
                                                        <div className="flex items-center gap-2.5">
                                                            <div className="w-5 h-5 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                                                                <Shield size={10} />
                                                            </div>
                                                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-extrabold flex items-center gap-1.5">
                                                                Manager: <span className="text-foreground">{lead.managerName}</span>
                                                            </p>
                                                        </div>
                                                    )}
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
                                    onClick={handleOpenCreateModal}
                                    className="crm-btn-primary !px-10 !py-4 mt-8"
                                >
                                    <Plus size={20} />
                                    <span>Add Lead</span>
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </main>

             <CreateLeadModal
                isOpen={isModalOpen}
                onClose={handleCloseCreateModal}
                onSubmit={handleCreateLead}
                isPending={createMutation.isPending}
             />

             <AssignLeadModal
                isOpen={assignModal.open}
                onClose={handleCloseAssignModal}
                leadId={assignModal.leadId}
                salesUsers={salesUsers}
                onAssign={handleAssignLead}
                isPending={assignMutation.isPending}
             />
        </>
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
