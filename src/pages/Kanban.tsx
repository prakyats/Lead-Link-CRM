import { useEffect } from 'react';
import { Sidebar } from '../components/Sidebar';
import { Link } from 'react-router';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Clock, AlertCircle, MoreHorizontal, Building2, User2, DollarSign, Plus } from 'lucide-react';
import { useLeads } from '../contexts/LeadsContext';
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
}

function LeadCard({ lead }: LeadCardProps) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'lead',
    item: { id: lead.id, stage: lead.stage },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  return (
    <div
      ref={drag as any}
      className={`group rounded-2xl p-5 transition-all cursor-grab active:cursor-grabbing ${isDragging ? 'opacity-30 scale-95' : 'opacity-100'}`}
      style={{ background: 'var(--crm-slate)', border: '1px solid var(--crm-border)' }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(0,212,170,0.15)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.3)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(148,163,184,0.08)'; e.currentTarget.style.boxShadow = 'none'; }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs" style={{ background: 'rgba(0,212,170,0.15)', color: '#00D4AA', border: '1px solid rgba(0,212,170,0.2)' }}>
            {lead.company.charAt(0)}
          </div>
          <div>
            <h3 className="text-sm font-bold leading-tight uppercase tracking-tight transition-colors" style={{ color: 'var(--crm-white)' }}>{lead.company}</h3>
            <p className="text-[10px] font-bold uppercase tracking-widest mt-0.5" style={{ color: 'var(--crm-muted-dim)' }}>{lead.contact}</p>
          </div>
        </div>
        <button className="transition-colors" style={{ color: 'var(--crm-muted-dim)' }}>
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 font-bold text-sm" style={{ color: 'var(--crm-white)' }}>
            <span style={{ color: 'var(--crm-muted-dim)' }}>$</span>
            {lead.value.toLocaleString()}
          </div>
          <span className={`crm-badge ${lead.priority === 'HIGH' ? 'badge-priority-high' :
            lead.priority === 'MEDIUM' ? 'badge-priority-medium' :
              'badge-priority-low'
            }`}>
            {lead.priority}
          </span>
        </div>

        <div className="pt-3 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest" style={{ borderTop: '1px solid var(--crm-border)', color: 'var(--crm-muted-dim)' }}>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3 h-3" />
            <span>{formatRelativeTime(lead.lastInteraction || lead.createdAt)}</span>
          </div>
          <Link to="/leads" className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: '#00D4AA' }}>
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
}

function Column({ title, stage, leads, count, color, onDrop }: ColumnProps) {
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
          <h2 className="text-sm font-bold uppercase tracking-widest" style={{ color: 'var(--crm-white)' }}>{title}</h2>
          <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold" style={{ background: 'rgba(148,163,184,0.06)', color: '#94A3B8', border: '1px solid rgba(148,163,184,0.08)' }}>
            {count}
          </span>
        </div>
        <Plus className="w-4 h-4 cursor-pointer transition-colors" style={{ color: 'var(--crm-muted-dim)' }} />
      </div>

      <div
        ref={drop as any}
        className={`flex-1 p-2 rounded-2xl transition-all duration-300 space-y-3 min-h-[500px]`}
        style={isOver ? { background: 'rgba(0,212,170,0.05)', boxShadow: 'inset 0 0 0 2px rgba(0,212,170,0.15)' } : { background: 'rgba(148,163,184,0.03)' }}
      >
        {leads.map((lead) => (
          <LeadCard key={lead.id} lead={lead} />
        ))}
        {leads.length === 0 && (
          <div className="h-24 rounded-2xl flex items-center justify-center" style={{ border: '2px dashed rgba(148,163,184,0.1)' }}>
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--crm-muted-dim)' }}>No Leads</p>
          </div>
        )}
      </div>
    </div>
  );
}

function KanbanContent() {
  const { leads, fetchLeads, updateLeadStage } = useLeads();

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
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--crm-navy)' }}>
      <Sidebar />

      <main className="flex-1 flex flex-col h-full overflow-hidden" style={{ background: 'var(--crm-navy)' }}>
        <div className="p-8 pb-4 shrink-0">
          <div className="flex justify-between items-end mb-6">
            <div className="space-y-1">
              <h1 className="crm-page-title">Executive Pipeline</h1>
              <p className="crm-page-subtitle">Real-time status synchronization across all deal stages</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden" style={{ border: '2px solid var(--crm-navy)', background: 'var(--crm-slate-light)' }}>
                    <User2 className="w-5 h-5" style={{ color: 'var(--crm-muted-dim)' }} />
                  </div>
                ))}
              </div>
              <button className="crm-btn-secondary !text-xs !py-2">Manage Access</button>
            </div>
          </div>

          <div className="crm-card !p-3 !flex-row flex items-center gap-3 mb-2" style={{ background: 'rgba(0,212,170,0.05)' }}>
            <AlertCircle className="w-4 h-4" style={{ color: '#00D4AA' }} />
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--crm-muted)' }}>
              Operational Intelligence: <span style={{ color: 'var(--crm-white)' }}>Drag cards between tiers to automate stage progression protocols</span>
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
