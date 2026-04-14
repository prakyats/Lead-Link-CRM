import { useState, useEffect, useMemo } from 'react';
import { Sidebar } from '../components/Sidebar';
import { Link } from 'react-router';
import { Users, UserCheck, Clock, AlertTriangle, ArrowRight, Shield, ShieldCheck, BarChart3, Users2, TrendingUp, CheckCircle2, Calendar, Target, Activity, UserPlus, Plus, ArrowUp, ArrowDown } from 'lucide-react';

import { useQueryClient, useMutation, useQuery, QueryErrorResetBoundary } from '@tanstack/react-query';
import { getDashboardKpis, getRecentLeads, getDashboardSummary } from '../api/dashboard';
import { getTaskSummary, markTaskComplete } from '../api/tasks';
import { getLeads, LeadType } from '../api/leads';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { useAuth } from '../contexts/AuthContext';
import { hasPermission } from '../utils/permissions';
import { Role } from '../utils/roles';
import { DashboardSkeleton } from '@/components/ui/skeleton';

const COLOR_MAP: Record<string, { iconBg: string; iconColor: string }> = {
  teal: { iconBg: 'var(--crm-teal-glow)', iconColor: 'var(--crm-teal)' },
  green: { iconBg: 'rgba(34,197,94,0.12)', iconColor: '#4ADE80' },
  amber: { iconBg: 'var(--crm-amber-glow)', iconColor: 'var(--crm-amber)' },
  red: { iconBg: 'rgba(239,68,68,0.12)', iconColor: '#F87171' },
  blue: { iconBg: 'rgba(96,165,250,0.12)', iconColor: '#60A5FA' },
  purple: { iconBg: 'rgba(192,132,252,0.12)', iconColor: '#C084FC' },
};

const DashboardContent = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [activeTaskTab, setActiveTaskTab] = useState<'today' | 'overdue' | 'upcoming'>('today');
  
  const isManagerOrAdmin = user?.role === 'MANAGER' || user?.role === 'ADMIN';

  const { data: managerSummary, isLoading: managerLoading } = useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: getDashboardSummary,
    enabled: !!user && isManagerOrAdmin
  });

  const { data: recentLeads = [], isLoading: recentLoading } = useQuery({
    queryKey: ['dashboard', 'recentLeads'],
    queryFn: getRecentLeads,
    enabled: !!user
  });

  const { data: kpis, isLoading: kpiLoading } = useQuery({
    queryKey: ['dashboard', 'kpis'],
    queryFn: getDashboardKpis,
    enabled: !!user && !isManagerOrAdmin
  });

  const { data: taskSummary = { today: [], overdue: [], upcoming: [] }, isLoading: taskLoading } = useQuery({
    queryKey: ['dashboard', 'taskSummary'],
    queryFn: getTaskSummary,
    enabled: !!user && !isManagerOrAdmin
  });

  const loading = (isManagerOrAdmin ? managerLoading : (kpiLoading || taskLoading)) || recentLoading;

  const salesKPIs = useMemo(() => {
    if (!kpis) return [];
    return [
      {
        title: 'My Leads',
        value: kpis.totalLeads.value,
        trend: kpis.totalLeads.trend,
        isInverse: false,
        icon: Users,
        color: 'teal',
        subtitle: 'Potential opportunities'
      },
      {
        title: 'My Active',
        value: kpis.activeCustomers.value,
        trend: kpis.activeCustomers.trend,
        isInverse: false,
        icon: UserCheck,
        color: 'green',
        subtitle: 'Converted contracts'
      },
      {
        title: 'Task Completion',
        value: kpis.taskCompletion.value,
        trend: kpis.taskCompletion.trend,
        isInverse: false,
        icon: Clock,
        color: 'amber',
        subtitle: 'Needs attention'
      },
      {
        title: 'My At-Risk',
        value: kpis.atRiskCustomers.value,
        trend: kpis.atRiskCustomers.trend,
        isInverse: true,
        icon: AlertTriangle,
        color: 'red',
        subtitle: 'High churn probability'
      },
    ];
  }, [kpis]);

  const managerKPIRibbon = useMemo(() => {
    if (!managerSummary) return [];
    return [
      { title: 'Activity', value: managerSummary.taskHealth.total, icon: Activity, color: 'blue', label: 'Tasks Created' },
      { title: 'Completed', value: managerSummary.taskHealth.completed, icon: CheckCircle2, color: 'green', label: 'Tasks Completed' },
      { title: 'Pending', value: managerSummary.taskHealth.pending, icon: Clock, color: 'amber', label: 'Pending Tasks' },
      { title: 'Overdue', value: managerSummary.taskHealth.overdue, icon: AlertTriangle, color: 'red', label: 'Overdue Tasks' },
    ];
  }, [managerSummary]);

  const keyMetricCards = useMemo(() => {
    if (!managerSummary) return [];
    return [
      { label: 'Efficiency', value: `${Math.round(managerSummary.keyMetrics.taskCompletionRate)}%`, icon: CheckCircle2, color: 'var(--crm-teal)' },
      { label: 'Pipeline', value: managerSummary.keyMetrics.activeLeads, icon: Target, color: '#60A5FA' },
      { label: 'Conversion', value: `${Math.round(managerSummary.keyMetrics.conversionRate)}%`, icon: TrendingUp, color: '#C084FC' },
    ];
  }, [managerSummary]);

  const completeTaskMutation = useMutation({
    mutationFn: markTaskComplete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['tasks', user?.id] });
    }
  });

  const handleCompleteTask = async (id: number) => {
    try {
      await completeTaskMutation.mutateAsync(id);
    } catch (error) {
      console.error('Error completing task:', error);
    }
  };

  return (
    <main className="crm-main-content">
      {/* ── Background Effects (Aligned with Landing Page) ── */}
      <div className="ll-hero-grid opacity-[0.03] dark:opacity-[0.05]" />
      <div className="ll-orb w-[600px] h-[600px] -top-64 -right-64 bg-primary/20 blur-[120px]" />
      <div className="ll-orb w-[400px] h-[400px] -bottom-32 -left-32 bg-purple-500/10 blur-[100px]" />

      <div className="max-w-7xl mx-auto p-8 space-y-8 relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="animate-in slide-in-from-left duration-700">
            <h1 className="crm-page-title">
               {isManagerOrAdmin ? 'Dashboard Summary' : 'Sales Dashboard'}
            </h1>
            <p className="crm-page-subtitle mt-2">
              {user?.role === 'ADMIN' ? 'Company-wide operations & analytics' :
                user?.role === 'MANAGER' ? 'Team performance & sales monitoring' :
                  'Daily activity & pipeline management'}
            </p>
          </div>
          <div className="flex items-center gap-3 animate-in slide-in-from-right duration-700">
            {user?.role === 'ADMIN' && (
              <div className="px-4 py-2 rounded-xl font-bold text-[10px] uppercase tracking-widest bg-status-success/10 text-status-success border border-status-success/20 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                Admin View
              </div>
            )}
            <p className="text-xs font-semibold uppercase tracking-wider opacity-40">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </p>
          </div>
        </div>

        {loading ? (
          <DashboardSkeleton />
        ) : user?.role === 'MANAGER' && managerSummary && !managerSummary.hasTeam ? (
          <div className="flex flex-col items-center justify-center p-20 glass-morphic border border-dashed border-border rounded-[2.5rem] text-center animate-in zoom-in duration-500">
             <div className="w-24 h-24 rounded-3xl bg-primary/10 flex items-center justify-center mb-8">
                <UserPlus className="w-12 h-12 text-primary" />
             </div>
             <h2 className="text-3xl font-bold text-foreground mb-4">Build Your Sales Team</h2>
             <p className="text-muted-foreground max-w-md mb-10 leading-relaxed font-medium">
               To unlock full team oversight and real-time performance analytics, begin by provisioning your first sales frontline.
             </p>
             <Link 
                to="/team?add=true"
                className="crm-btn-primary !px-10 !py-4"
             >
                <Plus className="w-6 h-6" />
                <span>Add Sales Personnel</span>
             </Link>
          </div>
        ) : isManagerOrAdmin && managerSummary ? (
          <div className="space-y-8 animate-in fade-in duration-700">
            {/* KPI Ribbon */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {managerKPIRibbon.map((item, i) => {
                const colors = COLOR_MAP[item.color] || COLOR_MAP.teal;
                return (
                  <div key={item.title} className={`crm-card group animate-in slide-in-from-bottom duration-700 delay-${(i + 1) * 100}`}>
                    <div className="flex justify-between items-center mb-4">
                       <div className="w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform" style={{ background: colors.iconBg }}>
                         <item.icon className="w-5 h-5" style={{ color: colors.iconColor }} />
                       </div>
                       {item.title === 'Overdue' && item.value > 0 && (
                          <span className="flex h-3 w-3 rounded-full bg-red-500 shadow-lg shadow-red-500/40 relative">
                            <span className="absolute inset-0 rounded-full animate-ping bg-red-500 opacity-75"></span>
                          </span>
                       )}
                    </div>
                    <p className="crm-page-subtitle">{item.title}</p>
                    <p className={`text-3xl font-bold tracking-tight mt-1 ${item.title === 'Overdue' && item.value > 0 ? 'text-red-400' : 'text-foreground'}`}>{item.value}</p>
                    <p className="text-xs font-semibold uppercase tracking-wider mt-2 opacity-40">{item.label}</p>
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Team Performance Ledger */}
              <div className="lg:col-span-2 space-y-8">
                <div className="crm-card !p-0 overflow-hidden">
                  <div className="p-8 border-b border-border/40 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-primary/10">
                        <Users2 className="w-5 h-5 text-primary" />
                      </div>
                      <h2 className="text-lg font-bold text-foreground" style={{ fontFamily: 'var(--ll-font-display)' }}>Team Performance</h2>
                    </div>
                    <p className="text-xs font-semibold uppercase tracking-wider opacity-40">Live Status</p>
                  </div>
                  <div className="p-8 space-y-4">
                    {managerSummary.teamPerformance.map((item: any) => {
                      const isManagerItem = !!item.managerName;
                      const displayName = isManagerItem ? item.managerName : item.name;
                      const displayId = isManagerItem ? item.managerId : item.id;
                      const secondaryLabel = isManagerItem ? `${item.repsCount} Team Members` : `${item.interactionsWeek} Tasks this week`;

                      return (
                        <div key={displayId} className="p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-muted/10 border border-border/40 hover:bg-muted/20 hover:border-primary/20 transition-all group">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold border border-primary/20 shadow-inner group-hover:rotate-12 transition-transform">
                              {displayName.charAt(0)}
                            </div>
                            <div>
                               <p className="font-bold text-foreground">{displayName}</p>
                               <p className="text-xs font-semibold uppercase tracking-wider opacity-40">{secondaryLabel}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-8 pr-4">
                            <div className="text-center">
                               <p className="text-[10px] font-bold opacity-30 uppercase mb-1">Queue</p>
                               <p className="font-bold text-foreground">{item.pending || item.pendingCount || 0}</p>
                            </div>
                            <div className="text-center">
                               <p className="text-[10px] font-bold opacity-30 uppercase mb-1">Closed</p>
                               <p className="font-bold text-primary">{item.completed || (item.totalTasks - item.pendingCount) || 0}</p>
                            </div>
                            <div className="text-center min-w-[70px]">
                               <p className="text-[10px] font-bold text-red-500/40 uppercase mb-1">Critical</p>
                               <p className={`font-bold ${(item.overdue || item.overdueCount) > 0 ? 'text-red-500' : 'opacity-20'}`}>
                                 {item.overdue || item.overdueCount || 0}
                               </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                   {keyMetricCards.map(metric => (
                      <div key={metric.label} className="crm-card flex items-center gap-4 active:scale-95 cursor-pointer">
                         <div className="p-3 rounded-xl bg-muted/50 border border-border/40">
                            <metric.icon className="w-5 h-5" style={{ color: metric.color }} />
                         </div>
                         <div>
                            <p className="text-xs font-semibold uppercase tracking-wider opacity-40">{metric.label}</p>
                            <p className="text-xl font-bold text-foreground">{metric.value}</p>
                         </div>
                      </div>
                   ))}
                </div>
              </div>

              {/* Operations Side Console */}
              <div className="space-y-8">
                 <div className="crm-card !p-0 overflow-hidden">
                    <div className="p-8 border-b border-border/40 flex items-center justify-between">
                       <h3 className="font-bold text-foreground flex items-center gap-2">
                         <AlertTriangle className="w-5 h-5 text-amber-500" />
                         System Alerts
                       </h3>
                       <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-red-500/10 text-red-500 border border-red-500/20">
                         {managerSummary.alerts.length} ALERTS
                       </span>
                    </div>
                    <div className="p-8 space-y-4">
                       {managerSummary.alerts.length > 0 ? managerSummary.alerts.map((alert: any, idx: number) => (
                         <div key={idx} className={`p-4 rounded-xl border flex gap-3 transition-colors ${alert.priority === 'HIGH' ? 'bg-red-500/5 border-red-500/20 hover:bg-red-500/10' : 'bg-amber-500/5 border-amber-500/20 hover:bg-amber-500/10'}`}>
                            <div className={`mt-1.5 h-1.5 w-1.5 rounded-full shrink-0 ${alert.priority === 'HIGH' ? 'bg-red-500' : 'bg-amber-500'}`} />
                            <p className="text-xs font-bold leading-relaxed">{alert.message}</p>
                         </div>
                       )) : (
                         <div className="py-12 text-center opacity-30">
                            <CheckCircle2 className="w-8 h-8 mx-auto mb-4 opacity-20" />
                            <p className="text-xs font-semibold uppercase tracking-wider">No Active Alerts</p>
                         </div>
                       )}
                    </div>
                 </div>

                 <Link to="/team-insights" className="crm-card flex items-center justify-between group bg-[var(--crm-teal-glow)] border-[var(--crm-teal)]/20 hover:border-[var(--crm-teal)]/40 transition-all">
                    <div>
                       <p className="font-bold text-[var(--crm-teal)]">Team Insights</p>
                       <p className="text-xs font-semibold uppercase tracking-wider opacity-40">Monitor team velocity & risk</p>
                    </div>
                    <ArrowRight className="w-6 h-6 text-[var(--crm-teal)] group-hover:translate-x-1 transition-transform" />
                 </Link>

                 <Link to="/reports" className="crm-card flex items-center justify-between group bg-primary/5 border-border/40 hover:border-primary/30 transition-all">
                    <div>
                       <p className="font-bold text-primary">Detailed Reports</p>
                       <p className="text-xs font-semibold uppercase tracking-wider opacity-40">View comprehensive analytics</p>
                    </div>
                    <ArrowRight className="w-6 h-6 text-primary group-hover:translate-x-1 transition-transform" />
                 </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in duration-700">
            {/* Sales KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {salesKPIs.map((card, i) => {
                const Icon = card.icon;
                const colors = COLOR_MAP[card.color] || COLOR_MAP.teal;
                return (
                  <div key={card.title} className={`crm-card crm-card-hover group animate-in slide-in-from-bottom duration-700 delay-${(i + 1) * 100}`}>
                    <div className="flex justify-between items-start mb-6">
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 shadow-inner" style={{ background: colors.iconBg }}>
                        <Icon className="w-6 h-6" style={{ color: colors.iconColor }} />
                      </div>
                      <div className="flex items-center gap-1.5">
                        {/* Metrics removed for cleaner UI */}
                      </div>
                    </div>
                    <div>
                      <p className="crm-page-subtitle">{card.title}</p>
                      <p className="text-3xl font-bold tracking-tight text-foreground">{card.value}</p>
                      <p className="text-[10px] font-bold uppercase mt-2 opacity-40">{card.subtitle}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Recent Active Pipeline */}
              <div className="lg:col-span-2 space-y-8">
                <div className="crm-card !p-0 overflow-hidden">
                  <div className="p-8 border-b border-border/40 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-purple-500/10 border border-purple-500/10">
                        <BarChart3 className="w-5 h-5 text-purple-400" />
                      </div>
                      <h2 className="text-lg font-bold text-foreground truncate" style={{ fontFamily: 'var(--ll-font-display)' }}>Recent Leads</h2>
                    </div>
                    <Link to="/kanban" className="px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider border border-border/40 hover:bg-muted hover:border-primary/20 transition-all flex items-center gap-2">
                      Full Pipeline <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                  <div className="p-8">
                    <div className="space-y-4">
                      {recentLeads.length > 0 ? recentLeads.map((lead: LeadType) => (
                        <Link key={lead.id} to={`/leads/${lead.id}`} className="flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-2xl transition-all group gap-4 bg-muted/10 border border-border/40 hover:bg-primary/5 hover:border-primary/20">
                          <div className="flex items-center gap-5 min-w-0">
                            <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg transition-transform group-hover:scale-105 bg-primary/10 text-primary border border-primary/20 shadow-inner shrink-0 leading-none">
                              {lead.company.charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-lg tracking-tight truncate text-foreground leading-none">{lead.company}</p>
                              <div className="flex items-center gap-3 mt-2">
                                <span className={`crm-badge shrink-0 ${lead.stage === 'NEW' ? 'badge-stage-new' :
                                  lead.stage === 'CONTACTED' ? 'badge-stage-contacted' :
                                    lead.stage === 'INTERESTED' ? 'badge-stage-qualified' :
                                        lead.stage === 'CONVERTED' ? 'badge-stage-converted' :
                                          'badge-stage-lost'
                                  }`}>
                                  {lead.stage}
                                </span>
                                <span className="text-[10px] font-bold opacity-30 tracking-wider">
                                  ₹{lead.value.toLocaleString('en-IN')}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 self-start sm:self-center">
                            <span className={`crm-badge shrink-0 ${lead.priority === 'HIGH' ? 'badge-priority-high' :
                              lead.priority === 'MEDIUM' ? 'badge-priority-medium' :
                                'badge-priority-low'
                              }`}>
                              {lead.priority}
                            </span>
                          </div>
                        </Link>
                      )) : (
                        <div className="py-16 text-center opacity-30 grayscale">
                          <Activity className="w-12 h-12 mx-auto mb-4 opacity-20" />
                          <p className="text-xs font-semibold uppercase tracking-wider">No Recent Leads</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Console */}
              <div className="space-y-8">
                {hasPermission(user?.role as Role, 'canCreateLeads') && (
                  <div className="crm-card">
                    <h2 className="text-lg font-bold mb-6 text-foreground" style={{ fontFamily: 'var(--ll-font-display)' }}>Quick Actions</h2>
                    <div className="space-y-3">
                      <Link to="/leads?open=add" className="crm-btn-primary w-full">
                        Add New Lead
                      </Link>
                      <Link
                        to="/tasks"
                        className="w-full h-11 flex items-center justify-center rounded-xl transition-all font-bold uppercase tracking-wider text-[10px] border border-border/40 text-muted-foreground hover:bg-muted hover:text-foreground"
                      >
                        View All Tasks
                      </Link>
                    </div>
                  </div>
                )}

                {/* Tactical Tasks Console */}
                <div className="crm-card !p-0 overflow-hidden">
                  <div className="p-8 pb-4">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-primary/10 border border-primary/10">
                        <CheckCircle2 className="w-5 h-5 text-primary" />
                      </div>
                      <h3 className="text-lg font-bold text-foreground" style={{ fontFamily: 'var(--ll-font-display)' }}>Task Queue</h3>
                    </div>
                    
                    <div className="flex gap-1 p-1 rounded-xl bg-muted/30 border border-border/40">
                      {[
                        { id: 'today', count: taskSummary.today.length, label: 'Today' },
                        { id: 'overdue', count: taskSummary.overdue.length, label: 'Critical' },
                        { id: 'upcoming', count: taskSummary.upcoming.length, label: 'Next' },
                      ].map((tab) => (
                        <button 
                          key={tab.id}
                          onClick={() => setActiveTaskTab(tab.id as any)}
                          className={`flex-1 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${activeTaskTab === tab.id ? (tab.id === 'overdue' ? 'bg-red-500 text-white' : 'bg-primary text-primary-foreground') : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}
                        >
                          {tab.label} ({tab.count})
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-8 pt-2 max-h-[460px] overflow-auto custom-scrollbar">
                    <div className="space-y-3">
                      {taskSummary[activeTaskTab].length > 0 ? (
                        taskSummary[activeTaskTab].map((task: any) => (
                          <div key={task.id} className="p-5 rounded-2xl bg-muted/20 border border-border/40 group hover:border-primary/20 transition-all duration-300">
                            <div className="flex justify-between items-start gap-4">
                              <div className="min-w-0">
                                <p className="text-sm font-bold text-foreground leading-tight">{task.title}</p>
                                {task.leadName && (
                                  <Link to={`/leads/${task.leadId}`} className="text-xs font-semibold uppercase tracking-wider text-primary mt-2 block hover:underline">
                                    {task.leadName}
                                  </Link>
                                )}
                                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mt-2 flex items-center gap-2">
                                  <Calendar className="w-3.5 h-3.5 opacity-40" />
                                  {new Date(task.dueDate).toLocaleDateString()}
                                </p>
                              </div>
                              <button 
                                onClick={() => handleCompleteTask(task.id)}
                                className="w-9 h-9 rounded-xl flex items-center justify-center transition-all bg-primary/10 text-primary border border-primary/10 hover:bg-primary hover:text-primary-foreground hover:shadow-lg hover:shadow-primary/20"
                                title="Complete Task"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="py-16 text-center rounded-[2rem] border border-dashed border-border/40 opacity-20">
                          <CheckCircle2 className="w-8 h-8 mx-auto mb-4" />
                          <p className="text-xs font-semibold uppercase tracking-wider">No pending tasks</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
};

export default function Dashboard() {
  return (
    <div className="crm-page-container">
      <Sidebar />
      <QueryErrorResetBoundary>
        {({ reset }) => (
          <ErrorBoundary onReset={reset} message="Failed to load dashboard metrics">
            <DashboardContent />
          </ErrorBoundary>
        )}
      </QueryErrorResetBoundary>
    </div>
  );
}
