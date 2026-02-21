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
      className={`group bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-100 transition-all cursor-grab active:cursor-grabbing ${isDragging ? 'opacity-30 scale-95' : 'opacity-100'
        }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center font-bold text-xs border border-blue-100">
            {lead.company.charAt(0)}
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900 leading-tight group-hover:text-blue-600 transition-colors uppercase tracking-tight">{lead.company}</h3>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{lead.contact}</p>
          </div>
        </div>
        <button className="text-gray-300 hover:text-gray-500 transition-colors">
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 font-bold text-gray-900 text-sm">
            <span className="text-gray-400">$</span>
            {lead.value.toLocaleString()}
          </div>
          <span className={`crm-badge ${lead.priority === 'HIGH' ? 'badge-priority-high' :
            lead.priority === 'MEDIUM' ? 'badge-priority-medium' :
              'badge-priority-low'
            }`}>
            {lead.priority}
          </span>
        </div>

        <div className="pt-3 border-t border-gray-50 flex items-center justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3 h-3" />
            <span>{formatRelativeTime(lead.lastInteraction || lead.createdAt)}</span>
          </div>
          <Link to="/leads" className="text-blue-600 hover:text-blue-700 opacity-0 group-hover:opacity-100 transition-opacity">
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
    blue: 'bg-blue-600 shadow-blue-100',
    amber: 'bg-amber-500 shadow-amber-100',
    purple: 'bg-purple-600 shadow-purple-100',
    green: 'bg-green-600 shadow-green-100',
    indigo: 'bg-indigo-600 shadow-indigo-100'
  };

  return (
    <div className="flex-shrink-0 w-[320px] flex flex-col h-full">
      <div className="flex items-center justify-between px-2 mb-4">
        <div className="flex items-center gap-2.5">
          <div className={`w-2.5 h-2.5 rounded-full ${colorVariants[color].split(' ')[0]}`} />
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-widest">{title}</h2>
          <span className="bg-white border border-gray-100 shadow-sm text-gray-500 px-2 py-0.5 rounded-lg text-[10px] font-bold">
            {count}
          </span>
        </div>
        <Plus className="w-4 h-4 text-gray-300 hover:text-gray-500 cursor-pointer transition-colors" />
      </div>

      <div
        ref={drop as any}
        className={`flex-1 p-2 rounded-2xl transition-all duration-300 space-y-3 min-h-[500px] ${isOver ? 'bg-blue-50/50 ring-2 ring-inset ring-blue-100' : 'bg-gray-100/40'
          }`}
      >
        {leads.map((lead) => (
          <LeadCard key={lead.id} lead={lead} />
        ))}
        {leads.length === 0 && (
          <div className="h-24 border-2 border-dashed border-gray-200 rounded-2xl flex items-center justify-center">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">No Leads</p>
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
    { title: 'New Capture', stage: 'NEW' as const, color: 'blue' },
    { title: 'Qualifying', stage: 'QUALIFIED' as const, color: 'indigo' },
    { title: 'Engagement', stage: 'CONTACTED' as const, color: 'amber' },
    { title: 'Proposal', stage: 'PROPOSAL' as const, color: 'purple' },
    { title: 'Contracted', stage: 'CONVERTED' as const, color: 'green' },
  ];

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />

      <main className="flex-1 bg-gray-50 flex flex-col h-full overflow-hidden">
        <div className="p-8 pb-4 shrink-0">
          <div className="flex justify-between items-end mb-6">
            <div className="space-y-1">
              <h1 className="crm-page-title">Executive Pipeline</h1>
              <p className="crm-page-subtitle">Real-time status synchronization across all deal stages</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center overflow-hidden">
                    <User2 className="w-5 h-5 text-gray-400" />
                  </div>
                ))}
              </div>
              <button className="crm-btn-secondary !text-xs !py-2">Manage Access</button>
            </div>
          </div>

          <div className="crm-card !p-3 !flex-row bg-white/50 backdrop-blur-sm flex items-center gap-3 mb-2">
            <AlertCircle className="w-4 h-4 text-blue-500" />
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
              Operational Intelligence: <span className="text-gray-900">Drag cards between tiers to automate stage progression protocols</span>
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
