import { useMemo, useState } from 'react';
import { Sidebar } from '../components/Sidebar';
import { Link, useNavigate } from 'react-router';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Clock, AlertCircle, MoreHorizontal, Building2, User2, Plus, Share2, Target, Zap, X, Search, Download } from 'lucide-react';
import { useQuery, useMutation, useQueryClient, QueryErrorResetBoundary } from '@tanstack/react-query';
import { exportLeadsExcel, getLeads, updateLeadStage as updateLeadStageApi } from '../api/leads';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { useAuth } from '../contexts/AuthContext';
import { formatRelativeTime, formatDate } from '../utils/dateHelpers';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { MobileKanban } from '../components/Kanban/MobileKanban';
import { KanbanSkeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

interface Lead {
  id: number;
  company: string;
  contact: string;
  value: number;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  lastInteraction: string;
  stage: 'NEW' | 'CONTACTED' | 'INTERESTED' | 'CONVERTED' | 'LOST';
  createdAt: string;
}

interface LeadCardProps {
  lead: Lead;
  canDrag: boolean;
}

function LeadCard({ lead, canDrag }: LeadCardProps) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'lead',
    item: { id: lead.id, stage: lead.stage },
    canDrag: canDrag,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }), [canDrag, lead.id, lead.stage]);

  return (
    <div
      ref={drag as any}
      className={`group relative rounded-2xl p-5 transition-all border border-border/40 bg-card/40 backdrop-blur-sm ${
        canDrag 
          ? 'cursor-grab active:cursor-grabbing hover:border-primary/30 hover:shadow-[0_8px_32px_-8px_rgba(0,212,170,0.15)] opacity-100' 
          : 'cursor-not-allowed opacity-60'
      } ${isDragging ? 'opacity-30 rotate-3 scale-95' : ''}`}
    >
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center font-semibold text-sm bg-primary/10 text-primary border border-primary/20 shadow-inner">
            {(lead?.company?.trim?.()?.[0] ?? '?').toUpperCase()}
          </div>
          <div>
            <h3 className="text-sm font-semibold leading-tight text-foreground text-foreground transition-colors group-hover:text-primary">{lead.company}</h3>
            <p className="text-xs text-muted-foreground mt-1 text-muted-foreground/60">{lead.contact}</p>
          </div>
        </div>
        {/* <button className="w-8 h-8 flex items-center justify-center rounded-lg transition-all text-muted-foreground/40 hover:text-foreground hover:bg-muted/50">
          <MoreHorizontal size={16} />
        </button> */}
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-medium text-sm text-foreground">
            <span className="text-muted-foreground mr-1">₹</span>
            {lead.value.toLocaleString('en-IN')}
          </div>
          <span className={`crm-badge scale-[0.85] origin-right ${lead.priority === 'HIGH' ? 'badge-priority-high' :
            lead.priority === 'MEDIUM' ? 'badge-priority-medium' :
              'badge-priority-low'
            }`}>
            {lead.priority}
          </span>
        </div>

        <div className="pt-4 flex items-center justify-between text-xs text-muted-foreground border-t border-border/20 text-muted-foreground/40">
          <div className="flex items-center gap-2">
            <Clock size={12} className="opacity-40" />
            <span>{formatRelativeTime(lead.lastInteraction || lead.createdAt)}</span>
          </div>
          <Link to={`/leads/${lead.id}`} className="opacity-0 group-hover:opacity-100 transition-all text-primary hover:tracking-widest">
            VIEW LEAD →
          </Link>
        </div>
      </div>
      
      {/* Dynamic Highlight Bar */}
      <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-1/2 rounded-full transition-all duration-500 group-hover:h-2/3 ${
        lead.priority === 'HIGH' ? 'bg-red-500/40' : 
        lead.priority === 'MEDIUM' ? 'bg-amber-500/40' : 
        'bg-primary/40'
      }`} />
    </div>
  );
}

interface ColumnProps {
  title: string;
  stage: Lead['stage'];
  leads: Lead[];
  count: number;
  color: string;
  onDrop: (leadId: number, newStage: Lead['stage']) => void;
  canDrag: boolean;
}

function Column({ title, stage, leads, count, color, onDrop, canDrag }: ColumnProps) {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'lead',
    drop: (item: { id: number; stage: string }) => {
      if (item.stage !== stage) {
        onDrop(item.id, stage);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }), [stage, onDrop]);

  const colorVariants: Record<string, string> = {
    teal: 'var(--primary)',
    amber: '#FBBF24',
    purple: '#C084FC',
    green: '#4ADE80',
    blue: '#60A5FA',
    red: '#F87171',
  };

  const accentColor = colorVariants[color] || colorVariants.teal;

  return (
    <div className="flex-shrink-0 w-[340px] flex flex-col h-full group/column">
      <div className="flex items-center justify-between px-3 mb-6">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: accentColor }} />
            <div className="absolute inset-0 rounded-full blur-[4px] animate-pulse" style={{ background: accentColor, opacity: 0.5 }} />
          </div>
          <h2 className="text-sm font-semibold text-foreground text-foreground/80">{title}</h2>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted/50 text-muted-foreground border border-border/40 tabular-nums">
            {count}
          </span>
        </div>
        <button className="w-8 h-8 flex items-center justify-center rounded-xl transition-all text-muted-foreground/30 hover:text-foreground hover:bg-muted/50">
          <Plus size={16} />
        </button>
      </div>

      <div
        ref={drop as any}
        className={`flex-1 p-3 rounded-[2rem] transition-all duration-500 space-y-4 min-h-[500px] border-2 border-transparent ${
          isOver ? 'bg-primary/[0.03] border-primary/20 shadow-[inset_0_0_80px_rgba(0,212,170,0.05)]' : 'bg-muted/[0.02]'
        }`}
      >
        <AnimatePresence mode="popLayout">
          {leads.map((lead) => (
            <motion.div
              key={lead.id}
              layout
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            >
              <LeadCard lead={lead} canDrag={canDrag} />
            </motion.div>
          ))}
        </AnimatePresence>
        
        {leads.length === 0 && (
          <div className="h-32 rounded-3xl flex flex-col items-center justify-center border-2 border-dashed border-border/20 bg-muted/[0.01]">
            <Target size={24} className="text-muted-foreground/10 mb-2" />
            <p className="text-xs text-muted-foreground text-muted-foreground/20">No Leads</p>
          </div>
        )}
      </div>
    </div>
  );
}

function KanbanInnerContent() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [stageDialogOpen, setStageDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [stageDraft, setStageDraft] = useState<{
    leadId: number;
    company: string;
    fromStage: Lead['stage'];
    toStage: Lead['stage'];
  } | null>(null);
  const [stageNotes, setStageNotes] = useState('');
  
  const { data: leads = [], isLoading: loading } = useQuery({
    queryKey: ['leads'],
    queryFn: getLeads,
    enabled: !!user?.id
  });

  const filteredLeads = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return leads as any[];
    return (leads as any[]).filter((l) => {
      const hay = `${l.company || ''} ${l.contact || ''}`.toLowerCase();
      return hay.includes(q);
    });
  }, [leads, searchQuery]);

  const canDrag = user?.role === 'SALES';
  const isMobile = useMediaQuery('(max-width: 767px)');

  const stageMutation = useMutation({
    mutationFn: updateLeadStageApi,
    onMutate: async ({ id: leadId, stage: newStage }) => {
      await queryClient.cancelQueries({ queryKey: ['leads'] });
      const previousLeads = queryClient.getQueryData(['leads']);
      queryClient.setQueryData(['leads'], (old: any) => 
        old?.map((l: any) => l.id === leadId ? { ...l, stage: newStage } : l)
      );
      return { previousLeads };
    },
    onError: (err, variables, context: any) => {
      queryClient.setQueryData(['leads'], context.previousLeads);
      toast.error('Update Failed', {
          description: 'Unable to update pipeline stage.'
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    }
  });

  const [selectedMobileLead, setSelectedMobileLead] = useState<Lead | null>(null);
  const leadById = useMemo(() => {
    const map = new Map<number, any>();
    for (const l of leads as any[]) map.set(l.id, l);
    return map;
  }, [leads]);

  const openStageDraft = (leadId: number, newStage: Lead['stage']) => {
    const lead = leadById.get(leadId);
    const fromStage = (lead?.stage || 'NEW') as Lead['stage'];
    const company = lead?.company || `Lead #${leadId}`;
    const toStage = newStage;

    setStageDraft({ leadId, company, fromStage, toStage });
    setStageNotes(`Moved from ${fromStage} to ${toStage}.`);
    setStageDialogOpen(true);
  };

  const closeStageDraft = () => {
    setStageDialogOpen(false);
    setStageDraft(null);
    setStageNotes('');
  };

  const saveStageDraft = async () => {
    if (!stageDraft) return;
    if (user?.role !== 'SALES') return;

    const { leadId, fromStage, toStage } = stageDraft;
    const summary = `Pipeline stage updated: ${fromStage} → ${toStage}`;

    try {
      await stageMutation.mutateAsync({ id: leadId, stage: toStage, notes: stageNotes, summary });
      closeStageDraft();
      toast.success(`Stage: ${toStage}`, {
        description: 'Stage updated and logged. View lead?',
        action: {
          label: 'VIEW',
          onClick: () => navigate(`/leads/${leadId}`)
        },
        duration: 5000,
      });
    } catch (error) {
      console.error('Error updating lead stage:', error);
    }
  };

  const handleExport = async () => {
    try {
      const q = searchQuery.trim() || undefined;
      const { blob, filename } = await exportLeadsExcel({ q });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || 'leads_export.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Export downloaded', { description: 'Excel file generated from your current leads list.' });
    } catch (e) {
      console.error('Export failed', e);
      toast.error('Export failed', { description: 'Unable to download Excel export.' });
    }
  };

  const handleDrop = async (leadId: number, newStage: Lead['stage']) => {
    if (user?.role !== 'SALES') return;
    openStageDraft(leadId, newStage);
  };

  const columns = [
    { title: 'New', stage: 'NEW' as const, color: 'blue' },
    { title: 'Contacted', stage: 'CONTACTED' as const, color: 'amber' },
    { title: 'Interested', stage: 'INTERESTED' as const, color: 'purple' },
    { title: 'Converted', stage: 'CONVERTED' as const, color: 'green' },
    { title: 'Lost', stage: 'LOST' as const, color: 'red' },
  ];

  const colorVariants: Record<string, string> = {
    teal: '#00D4AA',
    amber: '#FBBF24',
    purple: '#C084FC',
    green: '#4ADE80',
    blue: '#60A5FA',
    red: '#F87171',
  };

  return (
    <>
    <main className="crm-main-content select-none">
        {/* ── Background Effects ── */}
        <div className="ll-hero-grid opacity-[0.02] dark:opacity-[0.04]" />
        <div className="ll-orb w-[600px] h-[600px] -top-64 -right-32 bg-primary/5 blur-[120px]" />
        <div className="ll-orb w-[500px] h-[500px] bottom-0 -left-64 bg-teal-500/5 blur-[100px]" />
        
        {/* Desktop Header */}
        <div className="hidden md:block p-10 pb-6 shrink-0 relative z-10">
          <div className="flex justify-between items-end mb-8">
            <div className="animate-in slide-in-from-left duration-700">
              <h1 className="text-3xl font-bold tracking-tight text-foreground">Kanban Board</h1>
              <p className="text-sm font-medium text-muted-foreground mt-2">Drag and drop leads to update their pipeline stage</p>
            </div>
            <div className="flex items-center gap-6 animate-in slide-in-from-right duration-700">
              <div className="relative w-[360px]">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search leads (company / contact)…"
                  className="crm-input pl-11"
                />
              </div>
              <button className="crm-btn-secondary !px-5 !py-3 flex items-center gap-3" onClick={handleExport}>
                <Download size={14} />
                <span className="text-sm font-semibold">Export Excel</span>
              </button>
              {!canDrag && (
                <div className="px-4 py-2 rounded-xl font-bold text-[10px] uppercase tracking-widest bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  View Only Access
                </div>
              )}
              <div className="flex -space-x-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="w-10 h-10 rounded-2xl flex items-center justify-center overflow-hidden border-2 border-background bg-muted/40 shadow-xl">
                    <User2 className="w-6 h-6 text-muted-foreground/40" />
                  </div>
                ))}
              </div>
              <button className="crm-btn-secondary !px-6 !py-3 flex items-center gap-3">
                <Share2 size={14} />
                <span className="text-sm font-semibold">Team Members</span>
              </button>
            </div>
          </div>

          <div className={`flex items-center gap-4 border rounded-2xl p-4 transition-all ${
            canDrag ? 'bg-primary/[0.03] border-primary/10 hover:bg-primary/[0.05] hover:border-primary/20' : 'bg-status-warning/5 border-status-warning/10'
          }`}>
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
              <Zap size={14} className={`text-primary ${canDrag ? 'animate-pulse' : ''}`} />
            </div>
            <p className="text-xs font-semibold text-muted-foreground">
              {canDrag ? (
                <>TIP: <span className="text-foreground/80">DRAG LEADS TO UPDATE THEIR PIPELINE STAGE</span></>
              ) : (
                <>READ-ONLY: <span className="text-foreground/80">ONLY SALES REPRESENTATIVES CAN MOVE LEADS</span></>
              )}
            </p>
          </div>
        </div>

        {/* Mobile Header */}
        <div className="md:hidden p-8 pb-4 shrink-0 relative z-10">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
               <h1 className="text-2xl font-bold tracking-tight text-foreground" style={{ fontFamily: 'var(--ll-font-display)' }}>Pipeline</h1>
               <p className="text-sm font-semibold text-primary">Kanban Board</p>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-status-warning/10 border border-status-warning/20 text-status-warning text-xs font-medium uppercase tracking-wider">
              ACTIVE
            </div>
          </div>

          <div className="mt-4 flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search leads…"
                className="crm-input pl-11"
              />
            </div>
            <button className="crm-btn-secondary !px-4 !py-3 flex items-center gap-2" onClick={handleExport}>
              <Download size={14} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="px-10 flex-1 relative z-10">
            <KanbanSkeleton />
          </div>
        ) : isMobile ? (
          <div className="flex-1 relative z-10">
            <MobileKanban
              leads={filteredLeads}
              columns={columns}
              onUpdateStage={async () => { /* handled via modal + draft */ }}
              canDrag={canDrag}
              setSelectedLead={setSelectedMobileLead}
            />
          </div>
        ) : (
          <div className="flex-1 overflow-x-auto overflow-y-hidden px-10 pb-10 flex gap-8 custom-scrollbar relative z-10">
            {columns.map((column) => (
              <Column
                key={column.stage}
                title={column.title}
                stage={column.stage}
                leads={filteredLeads.filter((lead: any) => lead.stage === column.stage)}
                count={filteredLeads.filter((lead: any) => lead.stage === column.stage).length}
                color={column.color}
                onDrop={handleDrop}
                canDrag={canDrag}
              />
            ))}
          </div>
        )}

        <Dialog open={stageDialogOpen} onOpenChange={(open) => { if (!open) closeStageDraft(); }}>
          <DialogContent className="sm:max-w-xl rounded-2xl">
            <DialogHeader>
              <DialogTitle>Review stage change</DialogTitle>
              <DialogDescription>
                Edit the note below before saving. This will be logged in the background.
              </DialogDescription>
            </DialogHeader>

            {stageDraft && (
              <div className="space-y-4">
                <div className="rounded-xl border border-border bg-muted/20 p-4">
                  <div className="text-sm font-semibold text-foreground">{stageDraft.company}</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {stageDraft.fromStage} → <span className="font-semibold text-foreground">{stageDraft.toStage}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Note (editable)
                  </div>
                  <Textarea
                    value={stageNotes}
                    onChange={(e) => setStageNotes(e.target.value)}
                    placeholder="Add context for this stage change (what changed, next step, blockers, etc.)"
                    className="min-h-28"
                  />
                </div>
              </div>
            )}

            <DialogFooter>
              <button className="crm-btn-secondary" onClick={closeStageDraft} disabled={stageMutation.isPending}>
                Cancel
              </button>
              <button className="crm-btn-primary" onClick={saveStageDraft} disabled={stageMutation.isPending || !stageDraft}>
                {stageMutation.isPending ? 'Saving…' : 'Save & Log'}
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>

      {/* Relocated Mobile Modal */}
      <AnimatePresence>
        {selectedMobileLead && (
          <div className="ll-modal-overlay">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0"
              onClick={() => setSelectedMobileLead(null)}
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="status-modal-title"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="ll-modal-container modal-sm h-auto max-h-[80vh]"
            >
              <div className="ll-modal-header !pb-4">
                <div>
                  <h3 id="status-modal-title" className="text-lg font-bold text-foreground font-outfit uppercase tracking-tight">{selectedMobileLead.company}</h3>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-primary mt-1">Update Pipeline Stage</p>
                </div>
                <button onClick={() => setSelectedMobileLead(null)} className="w-10 h-10 flex items-center justify-center bg-muted/20 hover:bg-muted/40 rounded-xl text-foreground transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="ll-modal-body !pt-2 pb-8">
                <div className="space-y-3">
                  {columns.map(col => {
                    const isActive = selectedMobileLead.stage === col.stage;
                    const cColor = colorVariants[col.color] || colorVariants.teal;
                    return (
                      <button
                        key={col.stage}
                        onClick={async () => {
                          setSelectedMobileLead(null);
                          openStageDraft(selectedMobileLead.id, col.stage);
                        }}
                        disabled={isActive}
                        className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all active:scale-[0.98] min-h-[56px] ${
                          isActive 
                            ? 'bg-primary/5 border-primary/20 opacity-50 cursor-not-allowed' 
                            : 'bg-card border-border hover:border-primary/40'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ background: cColor }} />
                          <span className={`font-bold text-sm tracking-widest uppercase ${isActive ? 'text-primary' : 'text-foreground'}`}>{col.title}</span>
                        </div>
                        {isActive && (
                          <div className="px-2 py-0.5 rounded-lg bg-primary/10 border border-primary/20">
                            <span className="text-[8px] font-bold text-primary uppercase tracking-widest">Active</span>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      </>
  );
}

function KanbanContent() {
  return (
    <div className="crm-page-container">
      <Sidebar />
      <QueryErrorResetBoundary>
        {({ reset }) => (
          <ErrorBoundary onReset={reset} message="Failed to load Kanban board">
            <KanbanInnerContent />
          </ErrorBoundary>
        )}
      </QueryErrorResetBoundary>
    </div>
  );
}

export default function Kanban() {
  return (
    <DndProvider backend={HTML5Backend}>
      <KanbanContent />
    </DndProvider>
  );
}
