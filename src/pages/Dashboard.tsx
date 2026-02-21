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

interface KPIData {
  totalLeads: { value: number; trend: number };
  activeCustomers: { value: number; trend: number };
  pendingFollowUps: { value: number; trend: number };
  atRiskCustomers: { value: number; trend: number };
}

interface RecentLead {
  id: number;
  company: string;
  stage: string;
  priority: string;
  value: number;
}

const Dashboard = () => {
  const { leads, loading: leadsLoading } = useLeads();
  const { tasks, loading: tasksLoading, getUpcomingTasks } = useTasks();
  const { user } = useAuth();
  const [kpis, setKpis] = useState<any>(null);
  const [recentLeads, setRecentLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('[Dashboard] useEffect triggered', { leadsCount: leads.length, tasksCount: tasks.length });
    const fetchDashboardData = async () => {
      try {
        console.log('[Dashboard] Fetching additional data...');
        const [kpiRes, recentRes] = await Promise.all([
          api.get('/dashboard/kpis'),
          api.get('/dashboard/recent-leads')
        ]);
        console.log('[Dashboard] Data fetched successfully');
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
        color: 'blue',
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

  if (loading) {
    return (
      <div className="flex">
        <Sidebar />
        <main className="flex-1 bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent shadow-lg shadow-blue-100"></div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <Sidebar />
      <main className="flex-1 crm-page-container">
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
              <div className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 text-blue-700 rounded-xl border border-blue-100 font-bold text-xs shadow-sm">
                <Shield className="w-4 h-4" />
                READ-ONLY MODE
              </div>
            )}
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {dashboardKPIs.map((card) => {
              const Icon = card.icon;
              const colorClasses: Record<string, string> = {
                blue: 'bg-blue-50 text-blue-600 shadow-blue-100',
                green: 'bg-green-50 text-green-600 shadow-green-100',
                amber: 'bg-amber-50 text-amber-600 shadow-amber-100',
                red: 'bg-red-50 text-red-600 shadow-red-100'
              };

              return (
                <div key={card.title} className="crm-card crm-card-hover group">
                  <div className="flex justify-between items-start mb-4">
                    <div className={`w-12 h-12 ${colorClasses[card.color]} rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="p-1.5 bg-gray-50 rounded-lg">
                      <TrendingUp className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{card.title}</p>
                    <p className="text-3xl font-bold text-gray-900 tracking-tight">{card.value}</p>
                    <p className="text-xs text-gray-400 mt-2 font-medium">{card.subtitle}</p>
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
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                      <Users2 className="w-5 h-5 text-blue-600" />
                    </div>
                    <h2 className="text-lg font-bold text-gray-900">Team Workload Distribution</h2>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {teamDistribution.map((item) => (
                      <div key={item.name} className="p-5 bg-gray-50/50 rounded-2xl border border-gray-100 flex justify-between items-center group hover:bg-white hover:shadow-md hover:border-blue-100 transition-all duration-300">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-blue-500" />
                          <span className="font-bold text-gray-700">{item.name}</span>
                        </div>
                        <span className="bg-white text-blue-600 border border-blue-50 px-3 py-1 rounded-full text-[10px] font-bold shadow-sm">{item.count} LEADS</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Activity */}
              <div className="crm-card !p-0 overflow-hidden">
                <div className="p-8 border-b border-gray-50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                      <BarChart3 className="w-5 h-5 text-indigo-600" />
                    </div>
                    <h2 className="text-lg font-bold text-gray-900">
                      {!hasPermission(user?.role as Role, 'canSeeAllLeads') ? 'My Recent Pipeline' : 'Latest Enterprise Activity'}
                    </h2>
                  </div>
                  <Link to="/kanban" className="crm-btn-secondary !text-xs !px-4 !py-2">
                    View Pipeline
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
                <div className="p-8">
                  <div className="space-y-4">
                    {recentLeads.length > 0 ? recentLeads.map((lead) => (
                      <Link key={lead.id} to={`/leads`} className="flex items-center justify-between p-5 border border-gray-50 rounded-2xl hover:border-blue-100 hover:bg-blue-50/20 hover:shadow-sm transition-all group">
                        <div className="flex items-center gap-5">
                          <div className="w-12 h-12 bg-white text-blue-600 rounded-2xl flex items-center justify-center font-bold text-lg border border-gray-100 shadow-sm group-hover:scale-105 transition-transform">
                            {lead.company.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors text-lg tracking-tight">{lead.company}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`crm-badge ${lead.stage === 'NEW' ? 'badge-stage-new' :
                                lead.stage === 'CONTACTED' ? 'badge-stage-contacted' :
                                  lead.stage === 'QUALIFIED' ? 'badge-stage-qualified' :
                                    lead.stage === 'PROPOSAL' ? 'badge-stage-proposal' :
                                      lead.stage === 'CONVERTED' ? 'badge-stage-converted' :
                                        'badge-stage-lost'
                                }`}>
                                {lead.stage}
                              </span>
                              <span className="text-[10px] font-bold text-gray-400">•</span>
                              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">
                                ${lead.value.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        <span className={`crm-badge ${lead.priority === 'HIGH' ? 'badge-priority-high' :
                          lead.priority === 'MEDIUM' ? 'badge-priority-medium' :
                            'badge-priority-low'
                          }`}>
                          {lead.priority}
                        </span>
                      </Link>
                    )) : (
                      <div className="py-12 text-center">
                        <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No recent activity found</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              {/* Quick Actions */}
              {(hasPermission(user?.role as Role, 'canCreateLeads') || hasPermission(user?.role as Role, 'canOperationalControl')) ? (
                <div className="crm-card bg-gray-900 text-white border-none shadow-xl shadow-gray-200">
                  <h2 className="text-lg font-bold mb-6">Quick Actions</h2>
                  <div className="space-y-3">
                    {hasPermission(user?.role as Role, 'canCreateLeads') && (
                      <Link to="/leads" className="crm-btn-primary w-full shadow-none border border-blue-500">
                        Add New Lead
                      </Link>
                    )}
                    <Link to="/tasks" className="w-full h-[46px] flex items-center justify-center border border-gray-700 text-gray-300 rounded-xl hover:bg-gray-800 transition-all font-bold text-sm">
                      Manage Daily Tasks
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl shadow-xl shadow-blue-100 p-8 text-white relative overflow-hidden">
                  <BarChart3 className="absolute -bottom-4 -right-4 w-32 h-32 opacity-10 rotate-12" />
                  <h2 className="text-lg font-bold mb-3 relative z-10 tracking-tight">Analytical View Agent</h2>
                  <p className="text-blue-100 text-sm leading-relaxed relative z-10 opacity-90 font-medium">
                    Restricted Operational access. System metrics are synchronized in real-time for compliance monitoring.
                  </p>
                </div>
              )}

              {/* Activity Feed */}
              <div className="crm-card">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                    <Clock className="w-5 h-5 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Upcoming Events</h3>
                </div>
                <div className="space-y-6">
                  {upcomingTasks.length > 0 ? upcomingTasks.slice(0, 4).map((task) => (
                    <div key={task.id} className="flex gap-4 group">
                      <div className="mt-1 w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)] shrink-0 transition-transform group-hover:scale-125" />
                      <div>
                        <p className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors leading-snug">{task.title}</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1.5 flex items-center gap-2">
                          <Clock className="w-3 h-3" />
                          {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  )) : (
                    <div className="py-8 text-center bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">No scheduled tasks</p>
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

export default Dashboard;
