import { useEffect, useState } from 'react';
import { Sidebar } from '../components/Sidebar';
import { Link, useParams } from 'react-router';
import { Mail, Phone, Calendar, Star, Plus, Clock, MessageSquare, FileText, Download, X, Send } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getLeadById, addInteraction } from '../api/leads';
import { useAuth } from '../contexts/AuthContext';
import { formatRelativeTime, formatDate } from '../utils/dateHelpers';
import { hasPermission } from '../utils/permissions';
import { Role } from '../utils/roles';
import { toast } from 'sonner';

export default function CustomerDetail() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);

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
      document.title = `${leadData.company} - Profile`;
    }
  }, [leadData]);

  if (loading) {
    return (
      <div className="flex" style={{ background: '#0B1120' }}>
        <Sidebar />
        <main className="flex-1 flex items-center justify-center" style={{ background: '#0B1120' }}>
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 mx-auto" style={{ border: '4px solid rgba(0,212,170,0.2)', borderTop: '4px solid #00D4AA' }}></div>
            <p className="mt-4" style={{ color: '#94A3B8' }}>Loading customer details...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!leadData) {
    return (
      <div className="flex" style={{ background: '#0B1120' }}>
        <Sidebar />
        <main className="flex-1 flex items-center justify-center" style={{ background: '#0B1120' }}>
          <div className="text-center">
            <p className="text-lg" style={{ color: '#94A3B8' }}>Customer not found</p>
          </div>
        </main>
      </div>
    );
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return { bg: 'rgba(239,68,68,0.15)', color: '#F87171' };
      case 'medium': return { bg: 'rgba(245,158,11,0.15)', color: '#FBBF24' };
      case 'low': return { bg: 'rgba(74,222,128,0.15)', color: '#4ADE80' };
      default: return { bg: 'rgba(148,163,184,0.1)', color: '#94A3B8' };
    }
  };

  const riskStyle = getRiskColor(leadData.risk || 'default');

  return (
    <div className="flex flex-col md:flex-row h-screen overflow-hidden" style={{ background: '#0B1120' }}>
      <Sidebar />

      <main className="flex-1 min-w-0 overflow-auto" style={{ background: '#0B1120' }}>
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold uppercase tracking-tight" style={{ color: '#F1F5F9', fontFamily: 'Outfit, sans-serif' }}>{leadData?.company || 'Lead Detail'}</h1>
            <p className="mt-1" style={{ color: '#64748B' }}>Lead ID: #{id}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Customer Profile */}
            <div className="lg:col-span-1">
              <div className="rounded-2xl p-6 mb-6" style={{ background: '#1A2332', border: '1px solid rgba(148,163,184,0.08)' }}>
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-2xl" style={{ background: 'linear-gradient(135deg, #00D4AA, #00B894)', color: '#0B1120' }}>
                    {leadData?.company?.charAt(0) || '?'}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold" style={{ color: '#F1F5F9' }}>{leadData?.contact}</h2>
                    <p className="text-sm font-bold uppercase tracking-widest" style={{ color: '#00D4AA' }}>{leadData.company}</p>
                  </div>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5" style={{ color: '#64748B' }} />
                    <span className="text-sm" style={{ color: '#94A3B8' }}>{leadData.email}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5" style={{ color: '#64748B' }} />
                    <span className="text-sm" style={{ color: '#94A3B8' }}>{leadData.phone || 'N/A'}</span>
                  </div>
                </div>

                <div className="pt-4 space-y-3" style={{ borderTop: '1px solid rgba(148,163,184,0.08)' }}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#64748B' }}>Lead Score</span>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-current" style={{ color: '#FBBF24' }} />
                      <span className="font-bold" style={{ color: '#F1F5F9' }}>{leadData.leadScore}/100</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#64748B' }}>Risk Status</span>
                    <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest" style={{ background: riskStyle.bg, color: riskStyle.color }}>
                      {leadData.risk ? leadData.risk.toUpperCase() : 'LOW'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#64748B' }}>Deal Value</span>
                    <span className="font-bold" style={{ color: '#F1F5F9' }}>₹{leadData.value.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#64748B' }}>Stage</span>
                    <span className="crm-badge badge-stage-qualified">{leadData.stage}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#64748B' }}>Priority</span>
                    <span className={`crm-badge ${leadData.priority === 'HIGH' ? 'badge-priority-high' : 'badge-priority-low'}`}>{leadData.priority}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                {hasPermission(user?.role as Role, 'canOperationalControl') && (
                  <>
                    <button 
                      onClick={() => setIsModalOpen(true)}
                      className="w-full py-3.5 rounded-xl font-bold uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]" 
                      style={{ background: 'linear-gradient(135deg, #00D4AA, #00B894)', color: '#0B1120' }}
                    >
                      <Plus className="w-4 h-4" />
                      Log Interaction
                    </button>
                    <button className="w-full py-3.5 rounded-xl font-bold uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2 border border-[#4ADE80]/30 hover:bg-[#4ADE80]/5" style={{ color: '#4ADE80' }}>
                      <Calendar className="w-4 h-4" />
                      Manual Follow-up
                    </button>
                  </>
                )}
                <Link
                  to={`/pdf-preview/${id}`}
                  className="block w-full py-3.5 rounded-xl text-center font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all border border-border text-muted-foreground hover:text-foreground"
                >
                  <Download className="w-4 h-4" />
                  Export Data
                </Link>
              </div>
            </div>

            {/* Interaction Timeline */}
            <div className="lg:col-span-2">
              <div className="rounded-2xl p-6" style={{ background: '#1A2332', border: '1px solid rgba(148,163,184,0.08)' }}>
                <h2 className="text-xl font-bold mb-8 uppercase tracking-widest text-foreground">Interaction History</h2>

                <div className="space-y-8">
                  {leadData.interactions && leadData.interactions.length > 0 ? (
                    leadData.interactions.map((interaction: any, index: number) => {
                      const Icon =
                        interaction.type.toLowerCase() === 'call' ? Phone :
                          interaction.type.toLowerCase() === 'email' ? Mail :
                            interaction.type.toLowerCase() === 'meeting' ? MessageSquare :
                              interaction.type.toLowerCase() === 'whatsapp' ? MessageSquare :
                                FileText;

                      const iconColors: Record<string, { bg: string; color: string }> = {
                        call: { bg: 'rgba(0,212,170,0.15)', color: '#00D4AA' },
                        email: { bg: 'rgba(192,132,252,0.15)', color: '#C084FC' },
                        meeting: { bg: 'rgba(74,222,128,0.15)', color: '#4ADE80' },
                        whatsapp: { bg: 'rgba(34,197,94,0.15)', color: '#22C55E' },
                        default: { bg: 'rgba(148,163,184,0.1)', color: '#94A3B8' },
                      };
                      const colors = iconColors[interaction.type.toLowerCase()] || iconColors.default;

                      return (
                        <div key={interaction.id} className="flex gap-6 group">
                          <div className="flex flex-col items-center">
                            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110" style={{ background: colors.bg, border: `1px solid ${colors.bg}` }}>
                              <Icon className="w-5 h-5" style={{ color: colors.color }} />
                            </div>
                            {index < (leadData?.interactions?.length || 0) - 1 && (
                              <div className="w-px h-full mt-4" style={{ background: 'linear-gradient(to bottom, rgba(148,163,184,0.1), transparent)' }}></div>
                            )}
                          </div>

                          <div className="flex-1 pb-8">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h3 className="font-bold text-lg text-foreground tracking-tight">{interaction.type.toUpperCase()}</h3>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-[#00D4AA] mt-0.5">Logged by {interaction.performedBy}</p>
                              </div>
                              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                <Clock className="w-3 h-3" />
                                <span>{formatRelativeTime(interaction.date)}</span>
                              </div>
                            </div>
                            
                            {interaction.summary && (
                              <div className="p-4 rounded-xl bg-muted/10 border border-border mb-3">
                                <p className="text-sm text-foreground/80 leading-relaxed font-medium">{interaction.summary}</p>
                              </div>
                            )}
                            
                            <div className="flex flex-wrap gap-2">
                              {interaction.outcome && (
                                <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest bg-muted/20 border border-border text-foreground">
                                  Outcome: {interaction.outcome}
                                </span>
                              )}
                              {interaction.followUpDate && (
                                <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest bg-[#FBBF24]/10 border border-[#FBBF24]/20 text-[#FBBF24] flex items-center gap-1.5">
                                  <Calendar className="w-3.5 h-3.5" />
                                  Follow-up: {formatDate(interaction.followUpDate)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-16 rounded-2xl border-2 border-dashed border-border" style={{ color: '#64748B' }}>
                      <p className="text-sm font-bold uppercase tracking-widest">No Interaction History Found</p>
                      <p className="text-xs mt-2 opacity-50 font-medium">Log your first client engagement using the button on the left</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Interaction Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-x-0 inset-y-0 bg-[#0B1120]/80 backdrop-blur-sm"
            onClick={() => setIsModalOpen(false)}
          ></div>
          <div className="relative w-full max-w-lg bg-[#1A2332] rounded-3xl p-8 border border-white/5 shadow-2xl overflow-hidden scale-in-center">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold font-outfit text-white tracking-tight uppercase">Log Interaction</h2>
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mt-1">Record engagement with {leadData.company}</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl hover:bg-white/5 transition-colors text-muted-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleLogInteraction} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Type</label>
                  <select 
                    value={form.type}
                    onChange={(e) => setForm({...form, type: e.target.value})}
                    className="w-full h-12 rounded-xl bg-[#0B1120] border border-white/5 px-4 text-sm font-medium focus:border-[#00D4AA] focus:ring-1 focus:ring-[#00D4AA] outline-none transition-all"
                  >
                    <option value="CALL">Call</option>
                    <option value="EMAIL">Email</option>
                    <option value="MEETING">Meeting</option>
                    <option value="WHATSAPP">WhatsApp</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Outcome</label>
                  <select 
                    value={form.outcome}
                    onChange={(e) => setForm({...form, outcome: e.target.value})}
                    className="w-full h-12 rounded-xl bg-[#0B1120] border border-white/5 px-4 text-sm font-medium focus:border-[#00D4AA] focus:ring-1 focus:ring-[#00D4AA] outline-none transition-all"
                  >
                    <option value="Interested">Interested</option>
                    <option value="Not Interested">Not Interested</option>
                    <option value="Follow-up Required">Follow-up Required</option>
                    <option value="No Response">No Response</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Summary</label>
                <textarea 
                  required
                  placeholder="What was discussed?"
                  value={form.summary}
                  onChange={(e) => setForm({...form, summary: e.target.value})}
                  className="w-full h-32 rounded-xl bg-[#0B1120] border border-white/5 p-4 text-sm font-medium focus:border-[#00D4AA] focus:ring-1 focus:ring-[#00D4AA] outline-none transition-all resize-none"
                ></textarea>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Schedule Follow-up (Optional)</label>
                <input 
                  type="date"
                  value={form.followUpDate}
                  onChange={(e) => setForm({...form, followUpDate: e.target.value})}
                  className="w-full h-12 rounded-xl bg-[#0B1120] border border-white/5 px-4 text-sm font-medium focus:border-[#00D4AA] focus:ring-1 focus:ring-[#00D4AA] outline-none transition-all"
                />
              </div>

              <button 
                type="submit"
                disabled={interactionMutation.isPending}
                className="w-full h-14 rounded-2xl font-bold uppercase tracking-widest text-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #00D4AA, #00B894)', color: '#0B1120' }}
              >
                {interactionMutation.isPending ? (
                  <>
                    <Clock className="w-5 h-5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Save Interaction</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
