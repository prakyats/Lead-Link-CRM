import { useEffect } from 'react';
import { Sidebar } from '../components/Sidebar';
import { Link } from 'react-router';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Clock, AlertCircle, MoreHorizontal, Building2, User2, Plus } from 'lucide-react';
import { useLeads } from '../contexts/LeadsContext';
import { useAuth } from '../contexts/AuthContext';
import { formatRelativeTime, formatDate } from '../utils/dateHelpers';

interface Lead {
  id: number;
  company: string;
  contact: string;
  value: number;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  lastInteraction: string;
  stage: 'NEW' | 'CONTACTED' | 'PROPOSAL' | 'CONVERTED' | 'LOST' | 'QUALIFIED';
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

function KanbanContent() {
  const { leads, fetchLeads, updateLeadStage } = useLeads();
  const { user } = useAuth();
  const canDrag = user?.role !== 'ADMIN';

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const handleDrop = async (leadId: number, newStage: Lead['stage']) => {
    try {
      await updateLeadStage(leadId, newStage);
    } catch (error) {
      console.error('Error updating lead stage:', error);
    }
  };

  const columns = [
    { title: 'New Capture', stage: 'NEW' as const, color: 'teal' },
    { title: 'Qualifying', stage: 'QUALIFIED' as const, color: 'blue' },
    { title: 'Engagement', stage: 'CONTACTED' as const, color: 'amber' },
    { title: 'Proposal', stage: 'PROPOSAL' as const, color: 'purple' },
    { title: 'Contracted', stage: 'CONVERTED' as const, color: 'green' },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />

      <main className="flex-1 flex flex-col h-full overflow-hidden bg-background">
        <div className="p-8 pb-4 shrink-0">
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
      </main>
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
