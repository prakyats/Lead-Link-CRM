import { useState, useEffect, useMemo } from 'react';
import { Sidebar } from '../components/Sidebar';
import { Link } from 'react-router';
import { Users, UserCheck, Clock, AlertTriangle, ArrowRight, Shield, BarChart3, Users2, TrendingUp, CheckCircle2, Calendar, Target, Activity } from 'lucide-react';
import api from '../utils/api';
import { useTasks } from '../contexts/TasksContext';
import { useAuth } from '../contexts/AuthContext';
import { useLeads } from '../contexts/LeadsContext';
import { hasPermission } from '../utils/permissions';
import { Role } from '../utils/roles';
import { DashboardSkeleton } from '@/components/ui/skeleton';

const Dashboard = () => {
  const { leads, loading: leadsLoading } = useLeads();
  const { tasks, loading: tasksLoading, markAsComplete, getTaskSummary } = useTasks();
  const { user } = useAuth();
  
  // Sales specific data
  const [kpis, setKpis] = useState<any>(null);
  const [recentLeads, setRecentLeads] = useState<any[]>([]);
  const [taskSummary, setTaskSummary] = useState<any>({ today: [], overdue: [], upcoming: [] });
  const [activeTaskTab, setActiveTaskTab] = useState<'today' | 'overdue' | 'upcoming'>('today');
  
  // Manager specific data
  const [managerSummary, setManagerSummary] = useState<any>(null);
  
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const isManagerView = user?.role === 'MANAGER' || user?.role === 'ADMIN';
      
      if (isManagerView) {
        const [summaryRes, recentRes] = await Promise.all([
          api.get('/dashboard/summary'),
          api.get('/dashboard/recent-leads')
        ]);
        setManagerSummary(summaryRes.data);
        setRecentLeads(recentRes.data);
      } else {
        const [kpiRes, recentRes, summaryData] = await Promise.all([
          api.get('/dashboard/kpis'),
          api.get('/dashboard/recent-leads'),
          getTaskSummary()
        ]);
        setKpis(kpiRes.data);
        setRecentLeads(recentRes.data);
        setTaskSummary(summaryData);
      }
    } catch (error) {
      console.error('[Dashboard] Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchDashboardData();
  }, [user]);

  const salesKPIs = useMemo(() => {
    if (!kpis) return [];
    return [
      {
        title: 'My Leads',
        value: kpis.totalLeads.value,
        icon: Users,
        color: 'teal',
        subtitle: 'Potential opportunities'
      },
      {
        title: 'My Active',
        value: kpis.activeCustomers.value,
        icon: UserCheck,
        color: 'green',
        subtitle: 'Converted contracts'
      },
      {
        title: 'My Pending',
        value: kpis.pendingFollowUps.value,
        icon: Clock,
        color: 'amber',
        subtitle: 'Needs attention'
      },
      {
        title: 'My At-Risk',
        value: kpis.atRiskCustomers.value,
        icon: AlertTriangle,
        color: 'red',
        subtitle: 'High churn probability'
      },
    ];
  }, [kpis]);

  const colorMap: Record<string, { iconBg: string; iconColor: string }> = {
    teal: { iconBg: 'rgba(0,212,170,0.15)', iconColor: '#00D4AA' },
    green: { iconBg: 'rgba(34,197,94,0.15)', iconColor: '#4ADE80' },
    amber: { iconBg: 'rgba(245,158,11,0.15)', iconColor: '#FBBF24' },
    red: { iconBg: 'rgba(239,68,68,0.15)', iconColor: '#F87171' },
    blue: { iconBg: 'rgba(96,165,250,0.15)', iconColor: '#60A5FA' },
    purple: { iconBg: 'rgba(192,132,252,0.15)', iconColor: '#C084FC' },
  };

  const handleCompleteTask = async (id: number) => {
    try {
      await markAsComplete(id);
      fetchDashboardData();
    } catch (error) {
      console.error('Error completing task:', error);
    }
  };

  const isManagerOrAdmin = user?.role === 'MANAGER' || user?.role === 'ADMIN';

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-background text-foreground" style={{ background: '#0B1120' }}>
      <Sidebar />
      <main className="flex-1 min-w-0 crm-page-container">
        <div className="max-w-7xl mx-auto space-y-8 p-8">
          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-3xl font-bold uppercase tracking-tight" style={{ color: '#F1F5F9', fontFamily: 'Outfit, sans-serif' }}>
                 {isManagerOrAdmin ? 'Dashboard Summary' : 'Sales Dashboard'}
              </h1>
              <p className="crm-page-subtitle mt-1" style={{ color: '#64748B' }}>
                {user?.role === 'ADMIN' ? 'Full enterprise visibility and control' :
                  user?.role === 'MANAGER' ? 'Team performance and execution oversight' :
                    'Your daily activity and pipeline status'}
              </p>
            </div>
            {user?.role === 'ADMIN' && (
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs bg-[#00D4AA]/10 text-[#00D4AA] border border-[#00D4AA]/20">
                <Shield className="w-4 h-4" />
                ADMIN OVERSIGHT
              </div>
            )}
          </div>

          {loading ? (
            <DashboardSkeleton />
          ) : isManagerOrAdmin && managerSummary ? (
            <div className="space-y-8 animate-in fade-in duration-500">
              
              {/* Section 1: Task Health Overview */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                  { title: 'Today\'s Activity', value: managerSummary.taskHealth.total, icon: Activity, color: 'blue', label: 'Tasks Created' },
                  { title: 'Completed', value: managerSummary.taskHealth.completed, icon: CheckCircle2, color: 'green', label: 'Today\'s Completion' },
                  { title: 'Pending', value: managerSummary.taskHealth.pending, icon: Clock, color: 'amber', label: 'Awaiting Action' },
                  { title: 'Overdue', value: managerSummary.taskHealth.overdue, icon: AlertTriangle, color: 'red', label: '⚠️ HIGH PRIORITY' },
                ].map((item) => {
                  const colors = colorMap[item.color] || colorMap.teal;
                  return (
                    <div key={item.title} className="crm-card" style={{ background: '#1A2332', border: '1px solid rgba(148,163,184,0.08)' }}>
                      <div className="flex justify-between items-center mb-4">
                         <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: colors.iconBg }}>
                           <item.icon className="w-5 h-5" style={{ color: colors.iconColor }} />
                         </div>
                         {item.title === 'Overdue' && item.value > 0 && (
                            <span className="animate-pulse flex h-2 w-2 rounded-full bg-red-500"></span>
                         )}
                      </div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-[#64748B]">{item.title}</p>
                      <p className={`text-3xl font-bold tracking-tight mt-1 ${item.title === 'Overdue' && item.value > 0 ? 'text-red-400' : 'text-[#F1F5F9]'}`}>{item.value}</p>
                      <p className="text-[10px] font-bold uppercase tracking-widest mt-2 opacity-40">{item.label}</p>
                    </div>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                  
                  {/* Section 2: Team Performance */}
                  <div className="crm-card" style={{ background: '#1A2332', border: '1px solid rgba(148,163,184,0.08)' }}>
                    <div className="flex items-center gap-3 mb-8">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#00D4AA]/10">
                        <Users2 className="w-5 h-5 text-[#00D4AA]" />
                      </div>
                      <h2 className="text-lg font-bold text-[#F1F5F9]">Team Execution Status</h2>
                    </div>
                    <div className="space-y-4">
                      {managerSummary.teamPerformance.map((item: any) => (
                        <div key={item.id} className="p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0B1120]/50 border border-white/5 hover:border-[#00D4AA]/20 transition-all">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-400 font-bold border border-purple-500/20">
                              {item.name.charAt(0)}
                            </div>
                            <div>
                               <p className="font-bold text-[#F1F5F9]">{item.name}</p>
                               <p className="text-[10px] font-bold uppercase tracking-widest text-[#64748B]">{item.interactionsWeek} Interactions this week</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-6">
                            <div className="text-center">
                               <p className="text-[10px] font-bold text-[#64748B] uppercase mb-1">Pending</p>
                               <p className="font-bold text-[#F1F5F9]">{item.pending}</p>
                            </div>
                            <div className="text-center">
                               <p className="text-[10px] font-bold text-[#64748B] uppercase mb-1">Completed</p>
                               <p className="font-bold text-green-400">{item.completed}</p>
                            </div>
                            <div className="text-center min-w-[60px]">
                               <p className="text-[10px] font-bold text-red-400/60 uppercase mb-1">Overdue</p>
                               <p className={`font-bold ${item.overdue > 0 ? 'text-red-400' : 'text-[#64748B]'}`}>{item.overdue}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Section 3: Key Metrics Snapshot */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                     {[
                       { label: 'Completion Rate', value: `${Math.round(managerSummary.keyMetrics.taskCompletionRate)}%`, icon: CheckCircle2, color: '#00D4AA' },
                       { label: 'Active Pipeline', value: managerSummary.keyMetrics.activeLeads, icon: Target, color: '#60A5FA' },
                       { label: 'Conversion', value: `${Math.round(managerSummary.keyMetrics.conversionRate)}%`, icon: TrendingUp, color: '#C084FC' },
                     ].map(metric => (
                        <div key={metric.label} className="crm-card flex items-center gap-4" style={{ background: '#1A2332', border: '1px solid rgba(148,163,184,0.08)' }}>
                           <div className="p-2.5 rounded-lg bg-white/5">
                              <metric.icon className="w-4 h-4" style={{ color: metric.color }} />
                           </div>
                           <div>
                              <p className="text-[10px] font-bold uppercase tracking-widest text-[#64748B]">{metric.label}</p>
                              <p className="text-xl font-bold text-[#F1F5F9]">{metric.value}</p>
                           </div>
                        </div>
                     ))}
                  </div>
                </div>

                {/* Section 4: Alerts Section */}
                <div className="space-y-8">
                   <div className="crm-card !p-0 overflow-hidden" style={{ background: '#1A2332', border: '1px solid rgba(148,163,184,0.08)' }}>
                      <div className="p-6 border-b border-white/5 flex items-center justify-between">
                         <h3 className="font-bold text-[#F1F5F9] flex items-center gap-2">
                           <AlertTriangle className="w-4 h-4 text-amber-400" />
                           High Attention
                         </h3>
                         <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-red-500/10 text-red-500 border border-red-500/20">
                           {managerSummary.alerts.length} ALERTS
                         </span>
                      </div>
                      <div className="p-6 space-y-4">
                         {managerSummary.alerts.length > 0 ? managerSummary.alerts.map((alert: any, idx: number) => (
                           <div key={idx} className={`p-4 rounded-xl border flex gap-3 ${alert.priority === 'HIGH' ? 'bg-red-500/5 border-red-500/20 text-red-200' : 'bg-amber-500/5 border-amber-500/20 text-amber-200'}`}>
                              <div className={`mt-1 h-1.5 w-1.5 rounded-full shrink-0 ${alert.priority === 'HIGH' ? 'bg-red-500' : 'bg-amber-500'}`} />
                              <p className="text-xs font-bold leading-relaxed">{alert.message}</p>
                           </div>
                         )) : (
                           <div className="py-12 text-center opacity-40">
                              <p className="text-[10px] font-bold uppercase">All clear</p>
                           </div>
                         )}
                      </div>
                   </div>

                   <Link to="/reports" className="crm-card flex items-center justify-between group hover:border-[#00D4AA]/40 transition-all bg-[#00D4AA]/5 border-[#00D4AA]/10">
                      <div>
                         <p className="font-bold text-[#00D4AA]">Open Full Reports</p>
                         <p className="text-[10px] font-bold uppercase text-[#00D4AA]/60">Deep execution analysis</p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-[#00D4AA] group-hover:translate-x-1 transition-transform" />
                   </Link>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Sales Dashboard Content */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {salesKPIs.map((card) => {
                  const Icon = card.icon;
                  const colors = colorMap[card.color] || colorMap.teal;
                  return (
                    <div key={card.title} className="crm-card crm-card-hover group" style={{ background: '#1A2332', border: '1px solid rgba(148,163,184,0.08)' }}>
                      <div className="flex justify-between items-start mb-4">
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110" style={{ background: colors.iconBg }}>
                          <Icon className="w-6 h-6" style={{ color: colors.iconColor }} />
                        </div>
                        <div className="p-1.5 rounded-lg" style={{ background: 'rgba(148,163,184,0.06)' }}>
                          <TrendingUp className="w-4 h-4" style={{ color: '#64748B' }} />
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest mb-1 text-muted-foreground">{card.title}</p>
                        <p className="text-3xl font-bold tracking-tight text-[#F1F5F9]">{card.value}</p>
                        <p className="text-xs mt-2 font-medium text-[#64748B]">{card.subtitle}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                  {/* Recent Activity */}
                  <div className="crm-card !p-0 overflow-hidden" style={{ background: '#1A2332', border: '1px solid rgba(148,163,184,0.08)' }}>
                    <div className="p-6 sm:p-8 flex items-center justify-between gap-4" style={{ borderBottom: '1px solid rgba(148,163,184,0.08)' }}>
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-purple-500/10 shrink-0">
                          <BarChart3 className="w-5 h-5 text-purple-400" />
                        </div>
                        <h2 className="text-base sm:text-lg font-bold truncate text-[#F1F5F9]">My Recent Pipeline</h2>
                      </div>
                      <Link to="/kanban" className="crm-btn-secondary !text-[10px] sm:!text-xs !px-3 sm:!px-4 !py-2 shrink-0 border border-white/10 text-[#94A3B8] hover:text-[#F1F5F9]">
                        View Pipeline <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                    <div className="p-8">
                      <div className="space-y-4">
                        {recentLeads.length > 0 ? recentLeads.map((lead) => (
                          <Link key={lead.id} to={`/leads/${lead.id}`} className="flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-2xl transition-all group gap-4 border border-white/5 hover:border-[#00D4AA]/20 hover:bg-[#00D4AA]/5">
                            <div className="flex items-center gap-5 min-w-0">
                              <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg transition-transform group-hover:scale-105 bg-[#00D4AA]/10 text-[#00D4AA] border border-[#00D4AA]/20 shrink-0">
                                {lead.company.charAt(0)}
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-lg tracking-tight transition-colors truncate text-[#F1F5F9]">{lead.company}</p>
                                <div className="flex flex-wrap items-center gap-2 mt-1">
                                  <span className={`crm-badge shrink-0 ${lead.stage === 'NEW' ? 'badge-stage-new' :
                                    lead.stage === 'CONTACTED' ? 'badge-stage-contacted' :
                                      lead.stage === 'INTERESTED' ? 'badge-stage-qualified' :
                                          lead.stage === 'CONVERTED' ? 'badge-stage-converted' :
                                            'badge-stage-lost'
                                    }`}>
                                    {lead.stage}
                                  </span>
                                  <span className="text-[10px] font-bold text-muted-foreground/30">•</span>
                                  <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-widest leading-none whitespace-nowrap">
                                    ₹{lead.value.toLocaleString('en-IN')}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <span className={`crm-badge self-start sm:self-center shrink-0 ${lead.priority === 'HIGH' ? 'badge-priority-high' :
                              lead.priority === 'MEDIUM' ? 'badge-priority-medium' :
                                'badge-priority-low'
                              }`}>
                              {lead.priority}
                            </span>
                          </Link>
                        )) : (
                          <div className="py-12 text-center">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-[#64748B]">No recent activity found</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-8">
                  {/* Quick Actions */}
                  {hasPermission(user?.role as Role, 'canCreateLeads') && (
                    <div className="crm-card" style={{ background: '#1A2332', border: '1px solid rgba(148,163,184,0.08)' }}>
                      <h2 className="text-lg font-bold mb-6 text-[#F1F5F9]">Quick Actions</h2>
                      <div className="space-y-3">
                        <Link to="/leads" className="w-full h-12 rounded-xl font-bold uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]" style={{ background: 'linear-gradient(135deg, #00D4AA, #00B894)', color: '#0B1120' }}>
                          Add New Lead
                        </Link>
                        <Link
                          to="/tasks"
                          className="w-full h-12 flex items-center justify-center rounded-xl transition-all font-bold uppercase tracking-widest text-[10px] border border-white/10 text-[#94A3B8] hover:bg-white/5 hover:text-[#F1F5F9]"
                        >
                          Advanced Task Manager
                        </Link>
                      </div>
                    </div>
                  )}

                  {/* My Tasks Section */}
                  <div className="crm-card !p-0 overflow-hidden" style={{ background: '#1A2332', border: '1px solid rgba(148,163,184,0.08)' }}>
                    <div className="p-6 pb-4">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#00D4AA]/10">
                          <CheckCircle2 className="w-5 h-5 text-[#00D4AA]" />
                        </div>
                        <h3 className="text-lg font-bold text-[#F1F5F9]">My Tasks</h3>
                      </div>
                      
                      <div className="flex gap-1 p-1 rounded-xl bg-[#0B1120]/50 border border-white/5">
                        <button 
                          onClick={() => setActiveTaskTab('today')}
                          className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${activeTaskTab === 'today' ? 'bg-[#00D4AA] text-[#0B1120]' : 'text-[#64748B] hover:text-[#F1F5F9]'}`}
                        >
                          Today ({taskSummary.today.length})
                        </button>
                        <button 
                          onClick={() => setActiveTaskTab('overdue')}
                          className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${activeTaskTab === 'overdue' ? 'bg-red-500 text-white' : 'text-[#64748B] hover:text-[#F1F5F9]'}`}
                        >
                          Overdue ({taskSummary.overdue.length})
                        </button>
                        <button 
                          onClick={() => setActiveTaskTab('upcoming')}
                          className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${activeTaskTab === 'upcoming' ? 'bg-purple-500 text-white' : 'text-[#64748B] hover:text-[#F1F5F9]'}`}
                        >
                          Next ({taskSummary.upcoming.length})
                        </button>
                      </div>
                    </div>

                    <div className="p-6 pt-2 max-h-[400px] overflow-auto">
                      <div className="space-y-3">
                        {taskSummary[activeTaskTab].length > 0 ? (
                          taskSummary[activeTaskTab].map((task: any) => (
                            <div key={task.id} className="p-4 rounded-2xl bg-[#0B1120]/30 border border-white/5 group hover:border-white/10 transition-all">
                              <div className="flex justify-between items-start gap-3">
                                <div className="min-w-0">
                                  <p className="text-sm font-bold text-[#F1F5F9] leading-snug">{task.title}</p>
                                  {task.leadName && (
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#00D4AA] mt-1">{task.leadName}</p>
                                  )}
                                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#64748B] mt-1 flex items-center gap-1.5">
                                    <Calendar className="w-3 h-3" />
                                    {new Date(task.dueDate).toLocaleDateString()}
                                  </p>
                                </div>
                                <button 
                                  onClick={() => handleCompleteTask(task.id)}
                                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-all bg-[#00D4AA]/10 text-[#00D4AA] hover:bg-[#00D4AA] hover:text-[#0B1120]"
                                  title="Mark as Complete"
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="py-12 text-center rounded-2xl border border-dashed border-white/5 opacity-50">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-[#64748B]">Clear for {activeTaskTab}!</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default Dashboard;
