import { useState, useEffect, useMemo } from 'react';
import { Sidebar } from '../components/Sidebar';
import { Link } from 'react-router';
import { Users, UserCheck, Clock, AlertTriangle, ArrowRight, Shield, BarChart3, Users2, TrendingUp } from 'lucide-react';
import api from '../utils/api';
import { useTasks } from '../contexts/TasksContext';
import { useAuth } from '../contexts/AuthContext';
import { useLeads } from '../contexts/LeadsContext';
import { hasPermission } from '../utils/permissions';
import { Role } from '../utils/roles';
import { DashboardSkeleton } from '../components/ui/Skeleton';

const Dashboard = () => {
  const { leads, loading: leadsLoading } = useLeads();
  const { tasks, loading: tasksLoading, getUpcomingTasks } = useTasks();
  const { user } = useAuth();
  const [kpis, setKpis] = useState<any>(null);
  const [recentLeads, setRecentLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [kpiRes, recentRes] = await Promise.all([
          api.get('/dashboard/kpis'),
          api.get('/dashboard/recent-leads')
        ]);
        setKpis(kpiRes.data);
        setRecentLeads(recentRes.data);
      } catch (error) {
        console.error('[Dashboard] Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const dashboardKPIs = useMemo(() => {
    if (!kpis) return [];
    const isPersonalScoped = !hasPermission(user?.role as Role, 'canSeeAllLeads');
    return [
      {
        title: isPersonalScoped ? 'My Leads' : 'Total Leads',
        value: kpis.totalLeads.value,
        icon: Users,
        color: 'teal',
        subtitle: 'Potential opportunities'
      },
      {
        title: isPersonalScoped ? 'My Active' : 'Active Customers',
        value: kpis.activeCustomers.value,
        icon: UserCheck,
        color: 'green',
        subtitle: 'Converted contracts'
      },
      {
        title: isPersonalScoped ? 'My Pending' : 'Pending Follow-ups',
        value: kpis.pendingFollowUps.value,
        icon: Clock,
        color: 'amber',
        subtitle: 'Needs attention'
      },
      {
        title: isPersonalScoped ? 'My At-Risk' : 'At-Risk Customers',
        value: kpis.atRiskCustomers.value,
        icon: AlertTriangle,
        color: 'red',
        subtitle: 'High churn probability'
      },
    ];
  }, [kpis, user]);

  const upcomingTasks = useMemo(() => getUpcomingTasks(7), [getUpcomingTasks]);

  const teamDistribution = useMemo(() => {
    if (!hasPermission(user?.role as Role, 'canShowTeamOversight')) return null;
    const distribution: Record<string, number> = {};
    leads.forEach(l => {
      const owner = l.assignedTo || 'Unassigned';
      distribution[owner] = (distribution[owner] || 0) + 1;
    });
    return Object.entries(distribution).map(([name, count]) => ({ name, count }));
  }, [leads, user]);

  const colorMap: Record<string, { iconBg: string; iconColor: string }> = {
    teal: { iconBg: 'rgba(0,212,170,0.15)', iconColor: '#00D4AA' },
    green: { iconBg: 'rgba(34,197,94,0.15)', iconColor: '#4ADE80' },
    amber: { iconBg: 'rgba(245,158,11,0.15)', iconColor: '#FBBF24' },
    red: { iconBg: 'rgba(239,68,68,0.15)', iconColor: '#F87171' },
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-background text-foreground">
      <Sidebar />
      <main className="flex-1 min-w-0 crm-page-container">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex justify-between items-end">
            <div>
              <h1 className="crm-page-title">Dashboard Overview</h1>
              <p className="crm-page-subtitle">
                {user?.role === 'ADMIN' ? 'System-wide analytics and oversight control centre' :
                  user?.role === 'MANAGER' ? 'Team performance and workload distribution' :
                    'Your personal sales pipeline and daily activities'}
              </p>
            </div>
            {user?.role === 'ADMIN' && (
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs bg-[#00D4AA]/10 text-[#00D4AA] border border-[#00D4AA]/20">
                <Shield className="w-4 h-4" />
                READ-ONLY MODE
              </div>
            )}
          </div>

          {loading ? (
            <DashboardSkeleton />
          ) : (
            <>
              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {dashboardKPIs.map((card) => {
                  const Icon = card.icon;
                  const colors = colorMap[card.color] || colorMap.teal;
                  return (
                    <div key={card.title} className="crm-card crm-card-hover group">
                      <div className="flex justify-between items-start mb-4">
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110" style={{ background: colors.iconBg }}>
                          <Icon className="w-6 h-6" style={{ color: colors.iconColor }} />
                        </div>
                        <div className="p-1.5 rounded-lg" style={{ background: 'rgba(148,163,184,0.06)' }}>
                          <TrendingUp className="w-4 h-4" style={{ color: 'var(--crm-muted-dim)' }} />
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest mb-1 text-muted-foreground">{card.title}</p>
                        <p className="text-3xl font-bold tracking-tight">{card.value}</p>
                        <p className="text-xs mt-2 font-medium text-muted-foreground">{card.subtitle}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                  {/* Manager Specific: Team Workload */}
                  {hasPermission(user?.role as Role, 'canShowTeamOversight') && teamDistribution && (
                    <div className="crm-card">
                      <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#00D4AA]/10">
                          <Users2 className="w-5 h-5 text-[#00D4AA]" />
                        </div>
                        <h2 className="text-lg font-bold">Team Workload Distribution</h2>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {teamDistribution.map((item) => (
                          <div key={item.name} className="p-5 rounded-2xl flex justify-between items-center group transition-all duration-300 bg-muted/20 border border-border hover:border-[#00D4AA]/30 hover:bg-[#00D4AA]/[0.02]">
                            <div className="flex items-center gap-3">
                              <div className="w-2 h-2 rounded-full bg-[#00D4AA]" />
                              <span className="font-bold">{item.name}</span>
                            </div>
                            <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-[#00D4AA]/10 text-[#00D4AA]">{item.count} LEADS</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recent Activity */}
                  <div className="crm-card !p-0 overflow-hidden">
                    <div className="p-6 sm:p-8 flex items-center justify-between gap-4" style={{ borderBottom: '1px solid var(--crm-border)' }}>
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-purple-500/10 shrink-0">
                          <BarChart3 className="w-5 h-5 text-purple-400" />
                        </div>
                        <h2 className="text-base sm:text-lg font-bold truncate">
                          {!hasPermission(user?.role as Role, 'canSeeAllLeads') ? 'My Recent Pipeline' : 'Latest Enterprise Activity'}
                        </h2>
                      </div>
                      <Link to="/kanban" className="crm-btn-secondary !text-[10px] sm:!text-xs !px-3 sm:!px-4 !py-2 shrink-0">
                        <span className="hidden xs:inline">View Pipeline</span>
                        <span className="xs:hidden">View</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                    <div className="p-8">
                      <div className="space-y-4">
                        {recentLeads.length > 0 ? recentLeads.map((lead) => (
                          <Link key={lead.id} to={`/leads`} className="flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-2xl transition-all group gap-4" style={{ border: '1px solid rgba(148,163,184,0.08)' }}
                            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(0,212,170,0.15)'; e.currentTarget.style.background = 'rgba(0,212,170,0.03)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(148,163,184,0.08)'; e.currentTarget.style.background = 'transparent'; }}>
                            <div className="flex items-center gap-5 min-w-0">
                              <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg transition-transform group-hover:scale-105 bg-[#00D4AA]/10 text-[#00D4AA] border border-[#00D4AA]/20 shrink-0">
                                {lead.company.charAt(0)}
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-lg tracking-tight transition-colors truncate">{lead.company}</p>
                                <div className="flex flex-wrap items-center gap-2 mt-1">
                                  <span className={`crm-badge shrink-0 ${lead.stage === 'NEW' ? 'badge-stage-new' :
                                    lead.stage === 'CONTACTED' ? 'badge-stage-contacted' :
                                      lead.stage === 'QUALIFIED' ? 'badge-stage-qualified' :
                                        lead.stage === 'PROPOSAL' ? 'badge-stage-proposal' :
                                          lead.stage === 'CONVERTED' ? 'badge-stage-converted' :
                                            'badge-stage-lost'
                                    }`}>
                                    {lead.stage}
                                  </span>
                                  <span className="text-[10px] font-bold text-muted-foreground/30">•</span>
                                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none whitespace-nowrap">
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
                            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--crm-muted-dim)' }}>No recent activity found</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-8">
                  {/* Quick Actions */}
                  {(hasPermission(user?.role as Role, 'canCreateLeads') || hasPermission(user?.role as Role, 'canOperationalControl')) ? (
                    <div className="crm-card shadow-sm">
                      <h2 className="text-lg font-bold mb-6">Quick Actions</h2>
                      <div className="space-y-3">
                        {hasPermission(user?.role as Role, 'canCreateLeads') && (
                          <Link to="/leads" className="crm-btn-primary w-full shadow-none" style={{ border: '1px solid rgba(0,212,170,0.3)' }}>
                            Add New Lead
                          </Link>
                        )}
                        <Link
                          to="/tasks"
                          className="w-full h-[46px] flex items-center justify-center rounded-xl transition-all font-bold text-sm border border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                        >
                          Manage Daily Tasks
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <div className="crm-card relative overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(0,212,170,0.15), rgba(168,85,247,0.15))' }}>
                      <BarChart3 className="absolute -bottom-4 -right-4 w-32 h-32 opacity-10 rotate-12" />
                      <h2 className="text-lg font-bold mb-3 relative z-10 tracking-tight" style={{ color: 'var(--crm-white)' }}>Read-Only View</h2>
                      <p className="text-sm leading-relaxed relative z-10 opacity-90 font-medium" style={{ color: 'var(--crm-muted)' }}>
                        You have view-only access. Contact your manager to make changes.
                      </p>
                    </div>
                  )}

                  {/* Activity Feed */}
                  <div className="crm-card">
                    <div className="flex items-center gap-3 mb-8">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#00D4AA]/10">
                        <Clock className="w-5 h-5 text-[#00D4AA]" />
                      </div>
                      <h3 className="text-lg font-bold">Upcoming Events</h3>
                    </div>
                    <div className="space-y-6">
                      {upcomingTasks.length > 0 ? upcomingTasks.slice(0, 4).map((task) => (
                        <div key={task.id} className="flex gap-4 group">
                          <div className="mt-1 w-2.5 h-2.5 rounded-full shrink-0 transition-transform group-hover:scale-125 bg-[#00D4AA]" />
                          <div>
                            <p className="text-sm font-bold leading-snug transition-colors">{task.title}</p>
                            <p className="text-[10px] font-bold uppercase tracking-widest mt-1.5 flex items-center gap-2" style={{ color: 'var(--crm-muted-dim)' }}>
                              <Clock className="w-3 h-3" />
                              {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      )) : (
                        <div className="py-8 text-center rounded-2xl" style={{ background: 'rgba(148,163,184,0.04)', border: '2px dashed rgba(148,163,184,0.1)' }}>
                          <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--crm-muted-dim)' }}>No scheduled tasks</p>
                        </div>
                      )}
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
