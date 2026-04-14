import { useEffect, useState } from 'react';
import { Sidebar } from '../components/Sidebar';
import { Link, useParams } from 'react-router';
import { Mail, Phone, Calendar, Star, Plus, Clock, MessageSquare, FileText, Download, X, Send, Activity, ShieldAlert, Zap, TrendingUp, UserCheck } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getLeadById, addInteraction } from '../api/leads';
import { useAuth } from '../contexts/AuthContext';
import { formatRelativeTime, formatDate } from '../utils/dateHelpers';
import { hasPermission } from '../utils/permissions';
import { Role } from '../utils/roles';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { useModalEffect } from '../hooks/useModalEffect';

export default function CustomerDetail() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { modalRef } = useModalEffect({
    isOpen: isModalOpen,
    onClose: () => setIsModalOpen(false),
    disableClose: true // Form persistence safety
  });

  // Form states
  const [form, setForm] = useState({
    type: 'CALL',
    summary: '',
    outcome: 'Interested',
    followUpDate: ''
  });

  const { data: leadData, isLoading: loading } = useQuery({
    queryKey: ['lead', id],
    queryFn: () => getLeadById(parseInt(id!)),
    enabled: !!id
  });

  const interactionMutation = useMutation({
    mutationFn: addInteraction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead', id] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      setIsModalOpen(false);
      setForm({ type: 'CALL', summary: '', outcome: 'Interested', followUpDate: '' });
      toast.success('Sequence Synchronized', {
        description: 'New engagement protocol recorded successfully.'
      });
    }
  });

  const handleLogInteraction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    
    try {
      await interactionMutation.mutateAsync({
        leadId: parseInt(id),
        interaction: {
          ...form,
          date: new Date().toISOString()
        }
      });
    } catch (error: any) {
      console.error(error);
      const message = error.response?.data?.message || 'Failed to record interaction';
      toast.error(message);
    }
  };

  useEffect(() => {
    if (leadData?.company) {
      document.title = `${leadData.company.toUpperCase()} // PROFILE`;
    }
  }, [leadData]);

  if (loading) {
    return (
      <div className="crm-page-container">
        <Sidebar />
        <main className="crm-main-content flex items-center justify-center">
            <div className="relative">
              <div className="w-24 h-24 rounded-3xl border-4 border-primary/10 border-t-primary animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Activity size={24} className="text-primary animate-pulse" />
              </div>
            </div>
        </main>
      </div>
    );
  }

  if (!leadData) {
    return (
      <div className="crm-page-container">
        <Sidebar />
        <main className="crm-main-content flex items-center justify-center">
          <div className="text-center space-y-4">
            <ShieldAlert size={48} className="mx-auto text-status-danger/20" />
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground/40">Lead Not Found</p>
            <Link to="/leads" className="crm-btn-secondary !inline-flex">Return to Terminal</Link>
          </div>
        </main>
      </div>
    );
  }

  const getRiskStatus = (risk: string) => {
    switch (risk?.toLowerCase()) {
      case 'high': return { label: 'CRITICAL', color: 'text-status-danger', bg: 'bg-status-danger/10', border: 'border-status-danger/20' };
      case 'medium': return { label: 'ELEVATED', color: 'text-status-warning', bg: 'bg-status-warning/10', border: 'border-status-warning/20' };
      case 'low': return { label: 'MINIMAL', color: 'text-status-success', bg: 'bg-status-success/10', border: 'border-status-success/20' };
      default: return { label: 'STABLE', color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20' };
    }
  };

  const risk = getRiskStatus(leadData.risk || 'default');

  return (
    <div className="crm-page-container">
      <Sidebar />
      <>
        <main className="crm-main-content">
        {/* ── Background Effects ── */}
        <div className="ll-hero-grid opacity-[0.02] dark:opacity-[0.05]" />
        <div className="ll-orb w-[600px] h-[600px] -top-64 -right-32 bg-primary/5 blur-[120px]" />
        
        <div className="relative z-10 h-full overflow-y-auto custom-scrollbar p-10">
          <div className="max-w-7xl mx-auto">
            <div className="mb-12 animate-in slide-in-from-left duration-700">
              <div className="flex items-center gap-4 mb-3">
                <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-[9px] font-semibold uppercase tracking-widest border border-primary/20">
                    Lead ID: #{(id || '0').padStart(4, '0')}
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-pulse" />
              </div>
              <h1 className="text-5xl font-semibold uppercase tracking-tighter text-foreground" style={{ fontFamily: 'var(--ll-font-display)' }}>
                {leadData.company}
              </h1>
              <p className="text-xs font-semibold uppercase tracking-wider mt-3 text-muted-foreground/60 flex items-center gap-3">
                <Activity size={12} className="text-primary/60" />
                Active Unit Profile // Operational Analysis
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              {/* ── Profile Telemetry Card ── */}
              <div className="lg:col-span-1 space-y-8 animate-in slide-in-from-bottom duration-700">
                <div className="crm-card relative overflow-hidden bg-card/40 backdrop-blur-2xl border-white/5 shadow-2xl group">
                  <div className="flex items-center gap-6 mb-10">
                    <div className="w-20 h-20 rounded-[2rem] flex items-center justify-center font-semibold text-3xl bg-primary text-black shadow-xl shadow-primary/20 group-hover:scale-110 transition-transform duration-500">
                      {leadData?.company?.charAt(0) || '?'}
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold tracking-tight text-foreground">{leadData?.contact.toUpperCase()}</h2>
                      <p className="text-xs font-semibold uppercase tracking-wider mt-1 text-primary">{leadData.company}</p>
                    </div>
                  </div>

                  <div className="space-y-5 mb-10">
                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 transition-colors hover:bg-white/10">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                        <Mail size={18} />
                      </div>
                      <span className="text-sm font-bold tracking-tight text-foreground/80">{leadData.email}</span>
                    </div>
                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 transition-colors hover:bg-white/10">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                        <Phone size={18} />
                      </div>
                      <span className="text-sm font-bold tracking-tight text-foreground/80">{leadData.phone || 'COMMS OFFLINE'}</span>
                    </div>
                  </div>

                  <div className="pt-8 space-y-4 border-t border-white/5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/40">Engagement Index</span>
                      <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 text-status-warning" fill="currentColor" />
                        <span className="text-sm font-semibold text-foreground tabular-nums">{leadData.leadScore}<span className="text-muted-foreground/20 ml-1">/ 100</span></span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/40">Risk Factor</span>
                      <span className={`px-3 py-1.5 rounded-xl text-[8px] font-semibold uppercase tracking-widest border ${risk.bg} ${risk.color} ${risk.border}`}>
                        {risk.label} STATUS
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/40">Vector Value</span>
                      <span className="text-lg font-semibold text-primary tracking-tight tabular-nums">₹{leadData.value.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/40">Lifecycle Stage</span>
                      <span className="crm-badge scale-90 origin-right border-primary/20 text-primary bg-primary/5">{leadData.stage}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/40">Priority Class</span>
                      <span className={`crm-badge scale-90 origin-right ${leadData.priority === 'HIGH' ? 'badge-priority-high' : 'badge-priority-low'}`}>{leadData.priority}</span>
                    </div>
                  </div>
                  
                  {/* Decorative Gradient Overlay */}
                  <div className="absolute bottom-0 right-0 w-32 h-32 bg-primary/5 blur-[50px] -z-10" />
                </div>

                {/* ── Action Executement ── */}
                <div className="space-y-4">
                  {hasPermission(user?.role as Role, 'canOperationalControl') && (
                    <>
                      <button 
                        onClick={() => setIsModalOpen(true)}
                        className="w-full h-16 rounded-2xl bg-primary text-black font-semibold uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-primary/20" 
                      >
                        <Plus size={18} strokeWidth={3} />
                        Sync Interaction
                      </button>
                      <button className="w-full h-16 rounded-2xl bg-white/5 border border-white/10 text-primary font-semibold uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-3 transition-all hover:bg-white/10">
                        <Calendar size={18} />
                        Schedule Task
                      </button>
                    </>
                  )}
                  <Link
                    to={`/pdf-preview/${id}`}
                    className="w-full h-14 rounded-2xl flex items-center justify-center gap-3 text-[9px] font-semibold uppercase tracking-widest transition-all border border-border/40 text-muted-foreground/60 hover:text-foreground hover:bg-muted/10"
                  >
                    <Download size={16} />
                    Export Telemetry
                  </Link>
                </div>
              </div>

              {/* ── Interaction Feed ── */}
              <div className="lg:col-span-2 animate-in fade-in duration-1000">
                <div className="crm-card bg-card/20 backdrop-blur-3xl border-white/5">
                  <div className="flex items-center justify-between mb-12">
                     <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground flex items-center gap-3">
                        <TrendingUp size={16} className="text-primary" />
                        Engagement Chronology
                     </h2>
                     <div className="px-3 py-1.5 rounded-xl bg-primary/5 border border-primary/10 text-primary text-[8px] font-semibold uppercase tracking-widest">
                        Network Synchronized
                     </div>
                  </div>

                  <div className="space-y-12 relative">
                    {/* Continuous Line */}
                    {leadData.interactions && leadData.interactions.length > 1 && (
                      <div className="absolute left-7 top-10 bottom-10 w-px bg-gradient-to-b from-primary/40 via-primary/10 to-transparent" />
                    )}

                    {leadData.interactions && leadData.interactions.length > 0 ? (
                      leadData.interactions.map((interaction: any, index: number) => {
                        const Icon =
                          interaction.type.toLowerCase() === 'call' ? Phone :
                            interaction.type.toLowerCase() === 'email' ? Mail :
                              interaction.type.toLowerCase() === 'meeting' ? MessageSquare :
                                interaction.type.toLowerCase() === 'whatsapp' ? MessageSquare :
                                  FileText;

                        const iconColors: Record<string, { bg: string; color: string; shadow: string }> = {
                          call: { bg: 'bg-primary/10', color: 'text-primary', shadow: 'shadow-primary/20' },
                          email: { bg: 'bg-purple-500/10', color: 'text-purple-400', shadow: 'shadow-purple-500/20' },
                          meeting: { bg: 'bg-status-success/10', color: 'text-status-success', shadow: 'shadow-status-success/20' },
                          whatsapp: { bg: 'bg-green-500/10', color: 'text-green-400', shadow: 'shadow-green-500/20' },
                          default: { bg: 'bg-muted/10', color: 'text-muted-foreground', shadow: 'shadow-none' },
                        };
                        const colors = iconColors[interaction.type.toLowerCase()] || iconColors.default;

                        return (
                          <motion.div 
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            key={interaction.id} 
                            className="flex gap-10 group relative"
                          >
                            <div className="relative z-10 shrink-0">
                              <div className={`w-14 h-14 rounded-[1.25rem] flex items-center justify-center transition-all duration-500 group-hover:scale-110 border border-white/10 ${colors.bg} ${colors.shadow} shadow-lg`}>
                                <Icon className={`w-6 h-6 ${colors.color}`} />
                              </div>
                            </div>

                            <div className="flex-1 pb-4">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
                                <div className="space-y-1">
                                  <h3 className="font-semibold text-xl text-foreground tracking-tight uppercase">{interaction.type}</h3>
                                  <div className="flex items-center gap-3">
                                    <div className="w-5 h-5 rounded-lg bg-primary/10 flex items-center justify-center">
                                      <UserCheck size={10} className="text-primary" />
                                    </div>
                                    <p className="text-xs font-semibold uppercase tracking-wider text-primary/60">Verified by {interaction.performedBy}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground/30 bg-muted/5 px-3 py-1.5 rounded-xl border border-white/5 h-fit tabular-nums">
                                  <Clock size={12} className="opacity-40" />
                                  <span>{formatRelativeTime(interaction.date)}</span>
                                </div>
                              </div>
                              
                              {interaction.summary && (
                                <div className="p-6 rounded-3xl bg-muted/[0.03] border border-border/40 mb-5 relative overflow-hidden group-hover:bg-muted/[0.05] transition-all duration-500">
                                  <p className="text-[13px] text-foreground/70 leading-relaxed font-medium">{interaction.summary}</p>
                                  <div className="absolute bottom-0 right-0 w-24 h-24 bg-primary/5 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                              )}
                              
                              <div className="flex flex-wrap gap-4">
                                {interaction.outcome && (
                                  <span className="px-4 py-1.5 rounded-xl text-xs font-semibold uppercase tracking-wider bg-muted/10 border border-border/40 text-muted-foreground/60">
                                    RESOLUTION: <span className="text-foreground/80 ml-1">{interaction.outcome.toUpperCase()}</span>
                                  </span>
                                )}
                                {interaction.followUpDate && (
                                  <span className="px-4 py-1.5 rounded-xl text-xs font-semibold uppercase tracking-wider bg-status-warning/10 border border-status-warning/20 text-status-warning flex items-center gap-2.5">
                                    <Calendar size={12} />
                                    NEXT SYNC: {formatDate(interaction.followUpDate)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        );
                      })
                    ) : (
                      <div className="text-center py-24 rounded-[3rem] border-2 border-dashed border-border/20 bg-muted/[0.02]">
                        <Activity size={40} className="mx-auto text-muted-foreground/10 mb-6 animate-pulse" />
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/40">Chronological Vacuum</h3>
                        <p className="text-xs mt-3 opacity-30 font-semibold uppercase tracking-wider">Log an activity to get started</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ── Interaction Modal ── */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="ll-modal-overlay">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0"
              // Background click disabled via hook for interaction form
            />
            <motion.div
              ref={modalRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="interaction-modal-title"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="ll-modal-container modal-sm"
            >
              <div className="ll-modal-header">
                <div>
                  <h2 id="interaction-modal-title" className="text-3xl font-semibold tracking-tight text-foreground leading-tight uppercase" style={{ fontFamily: 'var(--ll-font-display)' }}>Log Engagement</h2>
                  <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-primary">Synchronizing with {leadData.company}</p>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="w-12 h-12 flex items-center justify-center rounded-2xl transition-all group text-muted-foreground/40 hover:text-foreground hover:bg-white/5 border border-white/5"
                >
                  <X size={20} className="group-hover:rotate-90 transition-transform" />
                </button>
              </div>

              <form onSubmit={handleLogInteraction} className="flex flex-col h-full min-h-0 overflow-hidden">
                <div className="ll-modal-body space-y-8">
                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label className="text-xs font-semibold uppercase tracking-wider px-1 text-muted-foreground/60">Vector Type</label>
                      <div className="relative">
                        <select 
                          value={form.type}
                          onChange={(e) => setForm({...form, type: e.target.value})}
                          className="crm-input !bg-white/5 !border-white/10 !h-14 !px-6 text-[10px] font-semibold uppercase tracking-widest appearance-none cursor-pointer"
                        >
                          <option value="CALL">VOICE COMMS</option>
                          <option value="EMAIL">DIGITAL MAIL</option>
                          <option value="MEETING">DIRECT MISSION</option>
                          <option value="WHATSAPP">SIGNAL LINK</option>
                          <option value="OTHER">OTHER ACTIVITIES</option>
                        </select>
                        <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none opacity-20">
                            <Plus size={14} className="rotate-45" />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <label className="text-xs font-semibold uppercase tracking-wider px-1 text-muted-foreground/60">Vector Outcome</label>
                      <div className="relative">
                        <select 
                          value={form.outcome}
                          onChange={(e) => setForm({...form, outcome: e.target.value})}
                          className="crm-input !bg-white/5 !border-white/10 !h-14 !px-6 text-[10px] font-semibold uppercase tracking-widest appearance-none cursor-pointer"
                        >
                          <option value="Interested">QUALIFIED</option>
                          <option value="Not Interested">TERMINATED</option>
                          <option value="Follow-up Required">PENDING SYNC</option>
                          <option value="No Response">NO RESPONSE</option>
                        </select>
                        <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none opacity-20">
                            <Plus size={14} className="rotate-45" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-xs font-semibold uppercase tracking-wider px-1 text-muted-foreground/60">Activity Notes</label>
                    <textarea 
                      required
                      placeholder="Log detailed interaction summary..."
                      value={form.summary}
                      onChange={(e) => setForm({...form, summary: e.target.value})}
                      className="crm-input !bg-white/5 !border-white/10 min-h-[140px] !px-6 !py-5 resize-none text-sm font-medium leading-relaxed"
                    ></textarea>
                  </div>

                  <div className="space-y-3">
                    <label className="text-xs font-semibold uppercase tracking-wider px-1 text-muted-foreground/60">Next Synchronization Window</label>
                    <input 
                      type="date"
                      value={form.followUpDate}
                      onChange={(e) => setForm({...form, followUpDate: e.target.value})}
                      className="crm-input !bg-white/5 !border-white/10 !h-14 !px-6 text-[10px] font-semibold uppercase tracking-widest"
                    />
                  </div>
                </div>

                <div className="ll-modal-footer">
                  <button 
                    type="submit"
                    disabled={interactionMutation.isPending}
                    className="crm-btn-primary w-full !py-4 !text-xs font-semibold tracking-wider flex items-center justify-center gap-3"
                  >
                    {interactionMutation.isPending ? (
                      <>
                        <Clock size={16} className="animate-spin" />
                        <span>Syncing registry...</span>
                      </>
                    ) : (
                      <>
                        <Zap size={14} fill="currentColor" />
                        Authorize Registry Link
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  </div>
);
}
