import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight, X, Clock, User2, AlertCircle, Box } from 'lucide-react';
import { formatRelativeTime } from '../../utils/dateHelpers';
import { useModalEffect } from '../../hooks/useModalEffect';

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

interface Column {
  title: string;
  stage: Lead['stage'];
  color: string;
}

interface MobileKanbanProps {
  leads: Lead[];
  columns: Column[];
  onUpdateStage: (args: { leadId: number; newStage: Lead['stage']; notes?: string; summary?: string }) => Promise<void>;
  canDrag: boolean;
  setSelectedLead: (lead: Lead | null) => void;
}

export function MobileKanban({ leads, columns, onUpdateStage, canDrag, setSelectedLead }: MobileKanbanProps) {
  const [expandedStage, setExpandedStage] = useState<Lead['stage'] | null>('NEW');

  const colorVariants: Record<string, string> = {
    teal: '#00D4AA',
    amber: '#FBBF24',
    purple: '#C084FC',
    green: '#4ADE80',
    blue: '#60A5FA',
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 pb-20 custom-scrollbar md:hidden">
      
      {/* Mobile Hint */}
      <div className="mb-6 px-4 py-3 bg-red-500/5 border border-red-500/10 rounded-xl flex items-center justify-center gap-2">
        <span className="text-red-400 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
          <AlertCircle className="w-3.5 h-3.5" />
          ⚠ Desktop Recommended for Full Pipeline Control
        </span>
      </div>

      <div className="space-y-4">
        {columns.map((column) => {
          const columnLeads = leads.filter(l => l.stage === column.stage);
          const isExpanded = expandedStage === column.stage;
          const dotColor = colorVariants[column.color] || colorVariants.teal;

          return (
            <div key={column.stage} className="rounded-2xl border border-border bg-muted/5 overflow-hidden">
              <button 
                onClick={() => setExpandedStage(isExpanded ? null : column.stage)}
                className="w-full flex items-center justify-between p-4 bg-card active:bg-muted/10 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: dotColor }} />
                  <h2 className="text-sm font-bold uppercase tracking-widest text-foreground">{column.title}</h2>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-muted/50 text-muted-foreground border border-border">
                    {columnLeads.length}
                  </span>
                </div>
                {isExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
              </button>

              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="p-3 space-y-3 bg-muted/10">
                      {columnLeads.length === 0 ? (
                        <div className="py-10 text-center border-2 border-dashed border-border/50 rounded-2xl bg-muted/5">
                          <div className="w-10 h-10 rounded-full bg-muted/10 flex items-center justify-center mx-auto mb-3">
                            <Box className="w-5 h-5 text-muted-foreground/40" />
                          </div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Clear Stage</p>
                          <p className="text-[9px] text-muted-foreground/60 mt-1 uppercase">No active opportunities found</p>
                        </div>
                      ) : (
                        columnLeads.map(lead => (
                          <div 
                            key={lead.id} 
                            onClick={() => {
                              if (canDrag) setSelectedLead(lead);
                            }}
                            className={`rounded-xl p-4 border border-border bg-card shadow-sm ${canDrag ? 'active:scale-[0.98] cursor-pointer' : ''} transition-transform`}
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs" style={{ background: 'rgba(0,212,170,0.15)', color: '#00D4AA', border: '1px solid rgba(0,212,170,0.2)' }}>
                                  {lead.company.charAt(0)}
                                </div>
                                <div className="text-left">
                                  <h3 className="text-sm font-bold leading-tight uppercase tracking-tight text-foreground line-clamp-1">{lead.company}</h3>
                                  <p className="text-[10px] font-bold uppercase tracking-widest mt-0.5 text-muted-foreground">{lead.contact}</p>
                                </div>
                              </div>
                              <span className={`crm-badge whitespace-nowrap shrink-0 ${lead.priority === 'HIGH' ? 'badge-priority-high' : lead.priority === 'MEDIUM' ? 'badge-priority-medium' : 'badge-priority-low'}`}>
                                {lead.priority}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-[11px] font-bold border-t border-border pt-3 mt-1">
                              <span className="text-foreground">₹{lead.value.toLocaleString('en-IN')}</span>
                              <div className="flex items-center gap-1.5 text-muted-foreground uppercase tracking-widest">
                                <Clock className="w-3 h-3" />
                                <span>{formatRelativeTime(lead.lastInteraction || lead.createdAt)}</span>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
