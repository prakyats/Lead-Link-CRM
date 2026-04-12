import { useEffect } from 'react';
import { Sidebar } from '../components/Sidebar';
import { Link, useNavigate } from 'react-router';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Clock, AlertCircle, MoreHorizontal, Building2, User2, Plus } from 'lucide-react';
import { useQuery, useMutation, useQueryClient, QueryErrorResetBoundary } from '@tanstack/react-query';
import { getLeads, updateLeadStage as updateLeadStageApi } from '../api/leads';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { useAuth } from '../contexts/AuthContext';
import { formatRelativeTime, formatDate } from '../utils/dateHelpers';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { MobileKanban } from '../components/Kanban/MobileKanban';
import { KanbanSkeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

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
  }), [canDrag]);

  return (
    <div
      ref={drag as any}
      className={`group rounded-2xl p-5 transition-all cursor-grab active:cursor-grabbing bg-card border border-border hover:border-[#00D4AA]/30 hover:shadow-xl ${isDragging ? 'opacity-30 scale-95' : 'opacity-100'}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs" style={{ background: 'rgba(0,212,170,0.15)', color: '#00D4AA', border: '1px solid rgba(0,212,170,0.2)' }}>
            {lead.company.charAt(0)}
          </div>
          <div>
            <h3 className="text-sm font-bold leading-tight uppercase tracking-tight transition-colors text-foreground">{lead.company}</h3>
            <p className="text-[10px] font-bold uppercase tracking-widest mt-0.5 text-muted-foreground">{lead.contact}</p>
          </div>
        </div>
        <button className="transition-colors text-muted-foreground hover:text-foreground">
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 font-bold text-sm text-foreground">
            <span className="text-muted-foreground">₹</span>
            {lead.value.toLocaleString('en-IN')}
          </div>
          <span className={`crm-badge ${lead.priority === 'HIGH' ? 'badge-priority-high' :
            lead.priority === 'MEDIUM' ? 'badge-priority-medium' :
              'badge-priority-low'
            }`}>
            {lead.priority}
          </span>
        </div>

        <div className="pt-3 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest border-t border-border text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3 h-3" />
            <span>{formatRelativeTime(lead.lastInteraction || lead.createdAt)}</span>
          </div>
          <Link to="/leads" className="opacity-0 group-hover:opacity-100 transition-opacity text-[#00D4AA]">
            Details →
          </Link>
        </div>
      </div>
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
  }));

  const colorVariants: Record<string, string> = {
    teal: '#00D4AA',
    amber: '#FBBF24',
    purple: '#C084FC',
    green: '#4ADE80',
    blue: '#60A5FA',
    red: '#F87171',
  };

  const dotColor = colorVariants[color] || colorVariants.teal;

  return (
    <div className="flex-shrink-0 w-[320px] flex flex-col h-full">
      <div className="flex items-center justify-between px-2 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: dotColor }} />
          <h2 className="text-sm font-bold uppercase tracking-widest text-foreground">{title}</h2>
          <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-muted/50 text-muted-foreground border border-border">
            {count}
          </span>
        </div>
        <Plus className="w-4 h-4 cursor-pointer transition-colors text-muted-foreground hover:text-foreground" />
      </div>

      <div
        ref={drop as any}
        className={`flex-1 p-2 rounded-2xl transition-all duration-300 space-y-3 min-h-[500px] ${isOver ? 'bg-[#00D4AA]/5 shadow-[inset_0_0_0_2px_rgba(0,212,170,0.15)]' : 'bg-muted/10'}`}
      >
        {leads.map((lead) => (
          <LeadCard key={lead.id} lead={lead} canDrag={canDrag} />
        ))}
        {leads.length === 0 && (
          <div className="h-24 rounded-2xl flex items-center justify-center border-2 border-dashed border-border">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">No Leads</p>
          </div>
        )}
      </div>
    </div>
  );
}

function KanbanInnerContent() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const { data: leads = [], isLoading: loading } = useQuery({
    queryKey: ['leads'],
    queryFn: getLeads,
    enabled: !!user?.id
  });

  const canDrag = user?.role !== 'ADMIN';
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
      toast.error('Failed to update pipeline stage');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    }
  });

  const navigate = useNavigate();

  const handleDrop = async (leadId: number, newStage: Lead['stage']) => {
    try {
      await stageMutation.mutateAsync({ id: leadId, stage: newStage });
      // Nudge after update
      toast.success(`Stage updated to ${newStage}`, {
        description: 'Would you like to log the interaction details now?',
        action: {
          label: 'Log Activity',
          onClick: () => navigate(`/leads/${leadId}`)
        },
        duration: 5000,
      });
    } catch (error) {
      console.error('Error updating lead stage:', error);
    }
  };

  const columns = [
    { title: 'New Leads', stage: 'NEW' as const, color: 'blue' },
    { title: 'Contacted', stage: 'CONTACTED' as const, color: 'amber' },
    { title: 'Interested', stage: 'INTERESTED' as const, color: 'purple' },
    { title: 'Converted', stage: 'CONVERTED' as const, color: 'green' },
    { title: 'Lost', stage: 'LOST' as const, color: 'red' },
  ];

  return (
    <main className="flex-1 min-w-0 flex flex-col h-full overflow-hidden bg-background">
        
        {/* Desktop Header */}
        <div className="hidden md:block p-8 pb-4 shrink-0">
          <div className="flex justify-between items-end mb-6">
            <div className="space-y-1">
              <h1 className="crm-page-title">Pipeline Board</h1>
              <p className="crm-page-subtitle">Drag and drop leads across stages to update their status</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden border-2 border-background bg-muted">
                    <User2 className="w-5 h-5 text-muted-foreground" />
                  </div>
                ))}
              </div>
              <button className="crm-btn-secondary !text-xs !py-2">View Team</button>
            </div>
          </div>

          <div className="crm-card !p-3 !flex-row flex items-center gap-3 mb-2 bg-[#00D4AA]/5">
            <AlertCircle className="w-4 h-4 text-[#00D4AA]" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Tip: <span className="text-foreground">Drag and drop cards to move leads between stages</span>
            </p>
          </div>
        </div>

        {/* Mobile Header */}
        <div className="md:hidden p-6 pb-2 shrink-0">
          <div className="flex justify-between items-start">
            <div className="space-y-0.5">
               <h1 className="text-2xl font-bold tracking-tight text-white font-outfit uppercase">Pipeline Board</h1>
               <p className="text-[10px] font-bold uppercase tracking-widest text-[#00D4AA]">Manage Enterprise Leads</p>
            </div>
            <div className="px-2.5 py-1 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-bold uppercase tracking-widest leading-none">
              ⚠ Desktop
            </div>
          </div>
        </div>

        {loading ? (
          <div className="px-8 flex-1">
            <KanbanSkeleton />
          </div>
        ) : isMobile ? (
          <MobileKanban leads={leads} columns={columns} onUpdateStage={async (id, stage) => { await stageMutation.mutateAsync({ id, stage }); }} canDrag={canDrag} />
        ) : (
          <div className="flex-1 overflow-x-auto overflow-y-hidden px-8 pb-8 flex gap-6 custom-scrollbar">
            {columns.map((column) => (
              <Column
                key={column.stage}
                title={column.title}
                stage={column.stage}
                leads={leads.filter((lead: any) => lead.stage === column.stage)}
                count={leads.filter((lead: any) => lead.stage === column.stage).length}
                color={column.color}
                onDrop={handleDrop}
                canDrag={canDrag}
              />
            ))}
          </div>
        )}
      </main>
  );
}

function KanbanContent() {
  return (
    <div className="flex flex-col md:flex-row h-screen overflow-hidden bg-background">
      <Sidebar />
      <QueryErrorResetBoundary>
        {({ reset }) => (
          <ErrorBoundary onReset={reset} message="Failed to load pipeline board">
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
