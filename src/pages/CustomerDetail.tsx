import { useEffect, useState } from 'react';
import { Sidebar } from '../components/Sidebar';
import { Link, useParams } from 'react-router';
import { Mail, Phone, Calendar, Star, Plus, Clock, MessageSquare, FileText, Download } from 'lucide-react';
import { useLeads } from '../contexts/LeadsContext';
import { useAuth } from '../contexts/AuthContext';
import { formatRelativeTime } from '../utils/dateHelpers';
import { hasPermission } from '../utils/permissions';
import { Role } from '../utils/roles';

export default function CustomerDetail() {
  const { id } = useParams();
  const { getLeadById } = useLeads();
  const { user } = useAuth();
  const [leadData, setLeadData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLead = async () => {
      if (id) {
        try {
          const data = await getLeadById(parseInt(id));
          setLeadData(data);
        } catch (error) {
          console.error('Error fetching lead:', error);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchLead();
  }, [id, getLeadById]);

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

  const riskStyle = getRiskColor(leadData.risk);

  return (
    <div className="flex flex-col md:flex-row h-screen overflow-hidden" style={{ background: '#0B1120' }}>
      <Sidebar />

      <main className="flex-1 min-w-0 overflow-auto" style={{ background: '#0B1120' }}>
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold" style={{ color: '#F1F5F9', fontFamily: 'Outfit, sans-serif' }}>{leadData.company}</h1>
            <p className="mt-1" style={{ color: '#64748B' }}>Lead ID: #{id}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Customer Profile */}
            <div className="lg:col-span-1">
              <div className="rounded-xl p-6 mb-6" style={{ background: '#1A2332', border: '1px solid rgba(148,163,184,0.08)' }}>
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #00D4AA, #00B894)' }}>
                    <span className="text-2xl font-bold" style={{ color: '#0B1120' }}>{leadData.company.charAt(0)}</span>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold" style={{ color: '#F1F5F9' }}>{leadData.contact}</h2>
                    <p className="text-sm" style={{ color: '#94A3B8' }}>{leadData.company}</p>
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
                    <span className="text-sm" style={{ color: '#64748B' }}>Lead Score</span>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-current" style={{ color: '#FBBF24' }} />
                        <span className="font-semibold" style={{ color: '#F1F5F9' }}>{leadData.leadScore}/100</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm" style={{ color: '#64748B' }}>Risk Status</span>
                    <span className="px-3 py-1 rounded-full text-xs font-medium" style={{ background: riskStyle.bg, color: riskStyle.color }}>
                      {leadData.risk ? leadData.risk.toUpperCase() : 'LOW'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm" style={{ color: '#64748B' }}>Deal Value</span>
                    <span className="font-semibold" style={{ color: '#F1F5F9' }}>₹{leadData.value.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm" style={{ color: '#64748B' }}>Stage</span>
                    <span className="text-sm font-medium capitalize" style={{ color: '#F1F5F9' }}>{leadData.stage}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm" style={{ color: '#64748B' }}>Priority</span>
                    <span className="text-sm" style={{ color: '#F1F5F9' }}>{leadData.priority}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                {hasPermission(user?.role as Role, 'canOperationalControl') && (
                  <>
                    <button className="w-full py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]" style={{ background: 'linear-gradient(135deg, #00D4AA, #00B894)', color: '#0B1120' }}>
                      <Plus className="w-5 h-5" />
                      Add Interaction
                    </button>
                    <button className="w-full py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]" style={{ background: 'rgba(74,222,128,0.15)', color: '#4ADE80', border: '1px solid rgba(74,222,128,0.2)' }}>
                      <Calendar className="w-5 h-5" />
                      Schedule Follow-up
                    </button>
                  </>
                )}
                <Link
                  to={`/pdf-preview/${id}`}
                  className="block w-full py-3 rounded-lg text-center font-medium flex items-center justify-center gap-2 transition-all"
                  style={{ border: '1px solid rgba(148,163,184,0.15)', color: '#94A3B8' }}
                >
                  <Download className="w-5 h-5" />
                  Download Summary
                </Link>
              </div>
            </div>

            {/* Interaction Timeline */}
            <div className="lg:col-span-2">
              <div className="rounded-xl p-6" style={{ background: '#1A2332', border: '1px solid rgba(148,163,184,0.08)' }}>
                <h2 className="text-xl font-bold mb-6" style={{ color: '#F1F5F9' }}>Interaction Timeline</h2>

                <div className="space-y-6">
                  {leadData.interactions && leadData.interactions.length > 0 ? (
                    leadData.interactions.map((interaction: any, index: number) => {
                      const Icon =
                        interaction.type === 'call' ? Phone :
                          interaction.type === 'email' ? Mail :
                            interaction.type === 'meeting' ? MessageSquare :
                              FileText;

                      const iconColors: Record<string, { bg: string; color: string }> = {
                        call: { bg: 'rgba(0,212,170,0.15)', color: '#00D4AA' },
                        email: { bg: 'rgba(192,132,252,0.15)', color: '#C084FC' },
                        meeting: { bg: 'rgba(74,222,128,0.15)', color: '#4ADE80' },
                        default: { bg: 'rgba(148,163,184,0.1)', color: '#94A3B8' },
                      };
                      const colors = iconColors[interaction.type] || iconColors.default;

                      return (
                        <div key={interaction.id} className="flex gap-4">
                          <div className="flex flex-col items-center">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: colors.bg }}>
                              <Icon className="w-5 h-5" style={{ color: colors.color }} />
                            </div>
                            {index < leadData.interactions.length - 1 && (
                              <div className="w-0.5 h-full mt-2" style={{ background: 'rgba(148,163,184,0.08)' }}></div>
                            )}
                          </div>

                          <div className="flex-1 pb-6">
                            <div className="flex items-start justify-between mb-2">
                              <h3 className="font-semibold" style={{ color: '#F1F5F9' }}>{interaction.type.charAt(0).toUpperCase() + interaction.type.slice(1)}</h3>
                              <div className="flex items-center gap-1 text-sm" style={{ color: '#64748B' }}>
                                <Clock className="w-4 h-4" />
                                <span>{formatRelativeTime(interaction.timestamp)}</span>
                              </div>
                            </div>
                            <p className="text-sm mb-2" style={{ color: '#94A3B8' }}>{interaction.notes}</p>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-12" style={{ color: '#64748B' }}>
                      <p>No interactions recorded yet</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
