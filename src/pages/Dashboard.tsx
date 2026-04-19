import { useState, useEffect, useMemo } from 'react';
import { Sidebar } from '../components/Sidebar';
import { Link } from 'react-router';
import { Users, UserCheck, Clock, AlertTriangle, ArrowRight, Shield, BarChart3, Users2, TrendingUp, CheckCircle2, Calendar, Target, Activity, UserPlus, Plus, ArrowUp, ArrowDown } from 'lucide-react';

import { useQueryClient, useMutation, useQuery, QueryErrorResetBoundary } from '@tanstack/react-query';
import { getDashboardKpis, getRecentLeads, getDashboardSummary, getTeamPipeline } from '../api/dashboard';
import { getTaskSummary, markTaskComplete } from '../api/tasks';
import { getLeads, LeadType } from '../api/leads';
import { getUsers } from '../api/users';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { useAuth } from '../contexts/AuthContext';
import { hasPermission } from '../utils/permissions';
import { Role } from '../utils/roles';
import { DashboardSkeleton } from '@/components/ui/skeleton';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

const DashboardContent = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [activeTaskTab, setActiveTaskTab] = useState<'today' | 'overdue' | 'upcoming'>('today');
  const [adminRevenuePeriod, setAdminRevenuePeriod] = useState<'week' | 'month'>('week');
  
  const isManagerOrAdmin = user?.role === 'MANAGER' || user?.role === 'ADMIN';
  const isAdmin = user?.role === 'ADMIN';

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

  const { data: teamPipeline } = useQuery({
    queryKey: ['dashboard', 'teamPipeline'],
    queryFn: getTeamPipeline,
    enabled: !!user
  });

  const { data: orgUsers = [] } = useQuery({
    queryKey: ['dashboard', 'orgUsers'],
    queryFn: getUsers,
    enabled: !!user && isAdmin
  });

  const { data: orgLeads = [] } = useQuery({
    queryKey: ['dashboard', 'orgLeads'],
    queryFn: getLeads,
    enabled: !!user && isAdmin
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

  const pipelineBars = useMemo(() => {
    const dist = teamPipeline?.distribution;
    if (!dist) return [];
    const order: Array<{ key: string; label: string; color: string }> = [
      { key: 'NEW', label: 'New', color: '#60A5FA' },
      { key: 'CONTACTED', label: 'Contacted', color: '#FBBF24' },
      { key: 'INTERESTED', label: 'Interested', color: '#C084FC' },
      { key: 'CONVERTED', label: 'Converted', color: 'var(--primary)' },
      { key: 'LOST', label: 'Lost', color: '#F87171' },
    ];
    return order.map(o => ({
      stage: o.label,
      value: dist[o.key] || 0,
      color: o.color
    }));
  }, [teamPipeline]);

  const conversionSnapshot = useMemo(() => {
    if (!pipelineBars.length) return null;
    const total = pipelineBars.reduce((acc, d) => acc + d.value, 0);
    const converted = pipelineBars.find(d => d.stage === 'Converted')?.value || 0;
    const lost = pipelineBars.find(d => d.stage === 'Lost')?.value || 0;
    const active = Math.max(total - converted - lost, 0);
    const rate = total > 0 ? (converted / total) * 100 : 0;
    return { total, converted, active, lost, rate };
  }, [pipelineBars]);

  const adminMetrics = useMemo(() => {
    if (!isAdmin) return null;
    const managers = (orgUsers as any[]).filter(u => u.role === 'MANAGER').length;
    const sales = (orgUsers as any[]).filter(u => u.role === 'SALES').length;
    const total = (orgLeads as any[]).length;
    const converted = (orgLeads as any[]).filter(l => l.stage === 'CONVERTED').length;
    const conversionRate = total > 0 ? (converted / total) * 100 : 0;
    const pipelineValue = (orgLeads as any[])
      .filter(l => l.stage !== 'CONVERTED' && l.stage !== 'LOST')
      .reduce((acc, l) => acc + (Number(l.value) || 0), 0);

    return { managers, sales, conversionRate, pipelineValue };
  }, [isAdmin, orgLeads, orgUsers]);

  /** Admin summary uses managerName / pendingCount; manager view uses name / pending — normalize for the ledger UI */
  const teamPerformanceRows = useMemo(() => {
    const list = managerSummary?.teamPerformance;
    if (!list || !Array.isArray(list)) return [];
    if (!isAdmin) return list;
    return list.map((m: any) => {
      const reps = Array.isArray(m.reps) ? m.reps : [];
      const completedTeam = reps.reduce((acc: number, r: any) => acc + (Number(r.completed) || 0), 0);
      return {
        id: m.managerId,
        name: m.managerName || 'Unknown',
        pending: m.pendingCount ?? 0,
        completed: completedTeam,
        overdue: m.overdueCount ?? 0,
        repsCount: m.repsCount ?? 0,
        interactionsWeek: 0,
      };
    });
  }, [managerSummary, isAdmin]);

  /** Admin: converted revenue by week or month */
  const adminRevenueTrend = useMemo(() => {
    if (!isAdmin) return [];
    const leads = orgLeads as any[];
    const converted = leads.filter((l) => l.stage === 'CONVERTED');
    const now = new Date();
    const buckets: { label: string; revenue: number; deals: number }[] = [];

    if (adminRevenuePeriod === 'week') {
      for (let i = 7; i >= 0; i--) {
        const end = new Date(now);
        end.setHours(23, 59, 59, 999);
        end.setDate(end.getDate() - i * 7);
        const start = new Date(end);
        start.setDate(start.getDate() - 6);
        start.setHours(0, 0, 0, 0);
        let revenue = 0;
        let deals = 0;
        for (const l of converted) {
          const raw = l.convertedAt || l.createdAt;
          if (!raw) continue;
          const d = new Date(raw);
          if (d >= start && d <= end) {
            revenue += Number(l.value) || 0;
            deals += 1;
          }
        }
        buckets.push({
          label: `${start.getMonth() + 1}/${start.getDate()}`,
          revenue: Math.round(revenue),
          deals,
        });
      }
    } else {
      for (let i = 5; i >= 0; i--) {
        const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999);
        let revenue = 0;
        let deals = 0;
        for (const l of converted) {
          const raw = l.convertedAt || l.createdAt;
          if (!raw) continue;
          const d = new Date(raw);
          if (d >= monthStart && d <= monthEnd) {
            revenue += Number(l.value) || 0;
            deals += 1;
          }
        }
        buckets.push({
          label: monthStart.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
          revenue: Math.round(revenue),
          deals,
        });
      }
    }
    return buckets;
  }, [isAdmin, orgLeads, adminRevenuePeriod]);

  /** Admin: per-manager snapshot for bar chart */
  const adminManagerReportBars = useMemo(() => {
    if (!isAdmin || !managerSummary?.teamPerformance) return [];
    return (managerSummary.teamPerformance as any[]).map((m: any) => ({
      name: String(m.managerName || 'Team').length > 14 ? `${String(m.managerName).slice(0, 12)}…` : String(m.managerName || 'Team'),
      conversions: Number(m.conversions) || 0,
      leads: Number(m.totalLeads) || 0,
      overdue: Number(m.overdueCount) || 0,
    }));
  }, [isAdmin, managerSummary]);

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

  const colorMap: Record<string, { iconBg: string; iconColor: string }> = {
    teal: { iconBg: 'var(--crm-teal-glow)', iconColor: 'var(--crm-teal)' },
    green: { iconBg: 'rgba(34,197,94,0.12)', iconColor: '#4ADE80' },
    amber: { iconBg: 'var(--crm-amber-glow)', iconColor: 'var(--crm-amber)' },
    red: { iconBg: 'rgba(239,68,68,0.12)', iconColor: '#F87171' },
    blue: { iconBg: 'rgba(96,165,250,0.12)', iconColor: '#60A5FA' },
    purple: { iconBg: 'rgba(192,132,252,0.12)', iconColor: '#C084FC' },
  };

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
              <div className="px-4 py-2 rounded-xl font-bold text-[10px] uppercase tracking-widest bg-primary/10 text-primary border border-primary/20 flex items-center gap-2">
                <Shield className="w-4 h-4" />
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
            {isAdmin && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="crm-card ll-moving-edge !p-0 overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-border/40 flex items-center justify-between shrink-0">
                      <h3 className="font-bold text-foreground flex items-center gap-2 text-sm">
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                        System Alerts
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-red-500/10 text-red-500 border border-red-500/20">
                        {managerSummary.alerts.length}
                      </span>
                    </div>
                    <div className="p-6 space-y-3 flex-1 max-h-[220px] overflow-y-auto custom-scrollbar">
                      {managerSummary.alerts.length > 0 ? managerSummary.alerts.map((alert: any, idx: number) => (
                        <div key={idx} className={`p-3 rounded-xl border flex gap-2 text-left ${alert.priority === 'HIGH' ? 'bg-red-500/5 border-red-500/20' : 'bg-amber-500/5 border-amber-500/20'}`}>
                          <div className={`mt-1 h-1 w-1 rounded-full shrink-0 ${alert.priority === 'HIGH' ? 'bg-red-500' : 'bg-amber-500'}`} />
                          <p className="text-[11px] font-bold leading-snug">{alert.message}</p>
                        </div>
                      )) : (
                        <div className="py-8 text-center opacity-30">
                          <CheckCircle2 className="w-6 h-6 mx-auto mb-2 opacity-20" />
                          <p className="text-[10px] font-semibold uppercase tracking-wider">No Active Alerts</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <Link to="/team-insights" className="crm-card ll-moving-edge flex flex-col justify-center p-6 group bg-[var(--crm-teal-glow)] border-[var(--crm-teal)]/20 hover:border-[var(--crm-teal)]/40 transition-all min-h-[140px]">
                    <p className="font-bold text-[var(--crm-teal)]">Team Insights</p>
                    <p className="text-[10px] font-semibold uppercase tracking-wider opacity-50 mt-1">Monitor team velocity and risk</p>
                    <ArrowRight className="w-5 h-5 text-[var(--crm-teal)] mt-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <Link to="/reports" className="crm-card ll-moving-edge flex flex-col justify-center p-6 group bg-primary/5 border-border/40 hover:border-primary/30 transition-all min-h-[140px]">
                    <p className="font-bold text-primary">Detailed Reports</p>
                    <p className="text-[10px] font-semibold uppercase tracking-wider opacity-40 mt-1">View comprehensive analytics</p>
                    <ArrowRight className="w-5 h-5 text-primary mt-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                  <div className="crm-card ll-moving-edge !p-0 overflow-hidden">
                    <div className="p-6 border-b border-border/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <p className="crm-page-subtitle">Revenue trend</p>
                        <p className="text-lg font-bold text-foreground mt-1" style={{ fontFamily: 'var(--ll-font-display)' }}>
                          Converted deal value
                        </p>
                      </div>
                      <div className="flex gap-1 p-1 rounded-xl bg-muted/30 border border-border/40 shrink-0">
                        <button
                          type="button"
                          onClick={() => setAdminRevenuePeriod('week')}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider ${adminRevenuePeriod === 'week' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}
                        >
                          Week
                        </button>
                        <button
                          type="button"
                          onClick={() => setAdminRevenuePeriod('month')}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider ${adminRevenuePeriod === 'month' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}
                        >
                          Month
                        </button>
                      </div>
                    </div>
                    <div className="p-6 h-[280px]">
                      {adminRevenueTrend.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={adminRevenueTrend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.12} />
                            <XAxis dataKey="label" tick={{ fontSize: 9, fontWeight: 700 }} />
                            <YAxis tick={{ fontSize: 9, fontWeight: 700 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                            <Tooltip
                              contentStyle={{
                                background: 'rgba(15, 23, 42, 0.92)',
                                border: '1px solid rgba(255, 255, 255, 0.12)',
                                borderRadius: '14px',
                                color: '#F1F5F9',
                                padding: '10px 12px'
                              }}
                              formatter={(value: number) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Revenue']}
                            />
                            <Line type="monotone" dataKey="revenue" stroke="var(--primary)" strokeWidth={2} dot={{ r: 3 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full flex items-center justify-center text-xs text-muted-foreground opacity-50">No converted revenue in this range</div>
                      )}
                    </div>
                  </div>
                  <div className="crm-card ll-moving-edge !p-0 overflow-hidden">
                    <div className="p-6 border-b border-border/40">
                      <p className="crm-page-subtitle">Team performance</p>
                      <p className="text-lg font-bold text-foreground mt-1" style={{ fontFamily: 'var(--ll-font-display)' }}>
                        Conversions by reporting manager
                      </p>
                    </div>
                    <div className="p-6 h-[280px]">
                      {adminManagerReportBars.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={adminManagerReportBars} layout="vertical" margin={{ top: 4, right: 16, left: 4, bottom: 4 }}>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.12} horizontal={false} />
                            <XAxis type="number" tick={{ fontSize: 10, fontWeight: 700 }} allowDecimals={false} />
                            <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 9, fontWeight: 700 }} />
                            <Tooltip
                              contentStyle={{
                                background: 'rgba(15, 23, 42, 0.92)',
                                border: '1px solid rgba(255, 255, 255, 0.12)',
                                borderRadius: '14px',
                                color: '#F1F5F9',
                                padding: '10px 12px'
                              }}
                            />
                            <Bar dataKey="conversions" name="Won deals" fill="var(--primary)" radius={[0, 6, 6, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full flex items-center justify-center text-xs text-muted-foreground opacity-50">No manager teams to chart</div>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Manager: KPI ribbon (horizontal). Admin: horizontal KPI row above Team Performance. */}
            {!isAdmin && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {([
                { title: 'Activity', value: managerSummary.taskHealth.total, icon: Activity, color: 'blue', label: 'Tasks Created' },
                { title: 'Completed', value: managerSummary.taskHealth.completed, icon: CheckCircle2, color: 'green', label: 'Tasks Completed' },
                { title: 'Pending', value: managerSummary.taskHealth.pending, icon: Clock, color: 'amber', label: 'Pending Tasks' },
                { title: 'Overdue', value: managerSummary.taskHealth.overdue, icon: AlertTriangle, color: 'red', label: 'Overdue Tasks' },
              ]).map((item: any, i: number) => {
                const colors = colorMap[item.color] || colorMap.teal;
                return (
                  <div key={item.title} className={`crm-card ll-moving-edge group animate-in slide-in-from-bottom duration-700 delay-${(i + 1) * 100}`}>
                    <div className="flex justify-between items-center mb-4">
                       <div className="w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform" style={{ background: colors.iconBg }}>
                         <item.icon className="w-5 h-5" style={{ color: colors.iconColor }} />
                       </div>
                       {item.title === 'Overdue' && typeof item.value === 'number' && item.value > 0 && (
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
            )}

            <div className={`grid gap-8 ${isAdmin ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-3'}`}>
              {/* Team Performance Ledger */}
              <div className={`space-y-8 ${isAdmin ? '' : 'lg:col-span-2'}`}>
                {isAdmin && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {([
                      { title: 'Managers', value: adminMetrics?.managers ?? 0, icon: Shield, color: 'purple', label: 'Total Managers' },
                      { title: 'Sales Reps', value: adminMetrics?.sales ?? 0, icon: Users2, color: 'blue', label: 'Total Sales Reps' },
                      { title: 'Conversion', value: `${(adminMetrics?.conversionRate ?? 0).toFixed(1)}%`, icon: TrendingUp, color: 'green', label: 'Org-wide Conversion Rate' },
                      { title: 'Pipeline Value', value: `₹${Math.round(adminMetrics?.pipelineValue ?? 0).toLocaleString('en-IN')}`, icon: Target, color: 'teal', label: 'Total Pipeline Value' },
                    ]).map((item: any, i: number) => {
                      const colors = colorMap[item.color] || colorMap.teal;
                      return (
                        <div key={item.title} className={`crm-card ll-moving-edge group animate-in slide-in-from-bottom duration-700 delay-${(i + 1) * 100}`}>
                          <div className="flex justify-between items-center mb-4">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform" style={{ background: colors.iconBg }}>
                              <item.icon className="w-5 h-5" style={{ color: colors.iconColor }} />
                            </div>
                          </div>
                          <p className="crm-page-subtitle">{item.title}</p>
                          <p className="text-3xl font-bold tracking-tight mt-1 text-foreground">{item.value}</p>
                          <p className="text-xs font-semibold uppercase tracking-wider mt-2 opacity-40">{item.label}</p>
                        </div>
                      );
                    })}
                  </div>
                )}
                <div className="space-y-8 w-full min-w-0">
                <div className="crm-card ll-moving-edge !p-0 overflow-hidden">
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
                    {teamPerformanceRows.map((item: any) => (
                      <div key={String(item.id)} className="p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-muted/10 border border-border/40 hover:bg-muted/20 hover:border-primary/20 transition-all group">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold border border-primary/20 shadow-inner group-hover:rotate-12 transition-transform">
                            {(item?.name?.trim?.()?.[0] ?? '?').toUpperCase()}
                          </div>
                          <div>
                             <p className="font-bold text-foreground">{item?.name || 'Unknown'}</p>
                             <p className="text-xs font-semibold uppercase tracking-wider opacity-40">
                               {isAdmin ? `${item.repsCount ?? 0} team members` : `${item.interactionsWeek} Tasks this week`}
                             </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-8 pr-4">
                          <div className="text-center">
                             <p className="text-[10px] font-bold opacity-30 uppercase mb-1">Queue</p>
                             <p className="font-bold text-foreground">{item.pending}</p>
                          </div>
                          <div className="text-center">
                             <p className="text-[10px] font-bold opacity-30 uppercase mb-1">Closed</p>
                             <p className="font-bold text-primary">{item.completed}</p>
                          </div>
                          <div className="text-center min-w-[70px]">
                             <p className="text-[10px] font-bold text-red-500/40 uppercase mb-1">Critical</p>
                             <p className={`font-bold ${item.overdue > 0 ? 'text-red-500' : 'opacity-20'}`}>
                               {item.overdue}
                             </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                   {[
                     { label: 'Efficiency', value: `${Math.round(managerSummary.keyMetrics.taskCompletionRate)}%`, icon: CheckCircle2, color: 'var(--crm-teal)' },
                     { label: 'Conversion', value: `${Math.round(managerSummary.keyMetrics.conversionRate)}%`, icon: TrendingUp, color: '#C084FC' },
                   ].map((metric: any) => (
                      <div key={metric.label} className="crm-card ll-moving-edge flex items-center gap-4 active:scale-95 cursor-pointer">
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

                {/* Manager: conversion snapshot only (pipeline bar chart removed) */}
                {!isAdmin && pipelineBars.length > 0 && conversionSnapshot && (
                  <div className="crm-card ll-moving-edge !p-0 overflow-hidden">
                      <div className="p-7 border-b border-border/40 flex items-center justify-between">
                        <div>
                          <p className="crm-page-subtitle">Conversion Rate</p>
                          <p className="text-lg font-bold text-foreground mt-1" style={{ fontFamily: 'var(--ll-font-display)' }}>
                            Overall Snapshot
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-primary tabular-nums">
                            {conversionSnapshot.rate.toFixed(1)}%
                          </div>
                          <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                            Converted / Total
                          </div>
                        </div>
                      </div>
                      <div className="p-7 grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
                        <div className="h-[220px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={[
                                  { name: 'Converted', value: conversionSnapshot.converted, color: 'var(--primary)' },
                                  { name: 'Active', value: conversionSnapshot.active, color: '#60A5FA' },
                                  { name: 'Lost', value: conversionSnapshot.lost, color: '#F87171' },
                                ]}
                                dataKey="value"
                                nameKey="name"
                                innerRadius={58}
                                outerRadius={86}
                                paddingAngle={3}
                              >
                                {[
                                  { color: 'var(--primary)' },
                                  { color: '#60A5FA' },
                                  { color: '#F87171' },
                                ].map((c, i) => (
                                  <Cell key={i} fill={c.color} />
                                ))}
                              </Pie>
                              <Tooltip
                                contentStyle={{
                                  background: 'rgba(15, 23, 42, 0.92)',
                                  border: '1px solid rgba(255, 255, 255, 0.12)',
                                  borderRadius: '14px',
                                  color: '#F1F5F9',
                                  padding: '10px 12px'
                                }}
                                labelStyle={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.12em' }}
                                itemStyle={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.12em' }}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>

                        <div className="space-y-4">
                          {[
                            { label: 'Converted', value: conversionSnapshot.converted, color: 'var(--primary)' },
                            { label: 'Active', value: conversionSnapshot.active, color: '#60A5FA' },
                            { label: 'Lost', value: conversionSnapshot.lost, color: '#F87171' },
                            { label: 'Total', value: conversionSnapshot.total, color: 'rgba(148,163,184,0.7)' },
                          ].map((m) => (
                            <div key={m.label} className="flex items-center justify-between rounded-2xl border border-border/40 bg-muted/10 px-4 py-3">
                              <div className="flex items-center gap-3">
                                <div className="w-2.5 h-2.5 rounded-full" style={{ background: m.color as any }} />
                                <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70">{m.label}</div>
                              </div>
                              <div className="text-sm font-bold tabular-nums text-foreground">{m.value}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                )}
              </div>

              {/* Operations Side Console — managers only (admin uses horizontal row below) */}
              {!isAdmin && (
              <div className="space-y-8">
                 <div className="crm-card ll-moving-edge !p-0 overflow-hidden">
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

                 <Link to="/team-insights" className="crm-card ll-moving-edge flex items-center justify-between group bg-[var(--crm-teal-glow)] border-[var(--crm-teal)]/20 hover:border-[var(--crm-teal)]/40 transition-all">
                    <div>
                       <p className="font-bold text-[var(--crm-teal)]">Team Insights</p>
                       <p className="text-xs font-semibold uppercase tracking-wider opacity-40">Monitor team velocity & risk</p>
                    </div>
                    <ArrowRight className="w-6 h-6 text-[var(--crm-teal)] group-hover:translate-x-1 transition-transform" />
                 </Link>

                 <Link to="/reports" className="crm-card ll-moving-edge flex items-center justify-between group bg-primary/5 border-border/40 hover:border-primary/30 transition-all">
                    <div>
                       <p className="font-bold text-primary">Detailed Reports</p>
                       <p className="text-xs font-semibold uppercase tracking-wider opacity-40">View comprehensive analytics</p>
                    </div>
                    <ArrowRight className="w-6 h-6 text-primary group-hover:translate-x-1 transition-transform" />
                 </Link>
              </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in duration-700">
            {/* Sales KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {salesKPIs.map((card, i) => {
                const Icon = card.icon;
                const colors = colorMap[card.color] || colorMap.teal;
                return (
                  <div key={card.title} className={`crm-card ll-moving-edge crm-card-hover group animate-in slide-in-from-bottom duration-700 delay-${(i + 1) * 100}`}>
                    <div className="flex justify-between items-start mb-6">
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 shadow-inner" style={{ background: colors.iconBg }}>
                        <Icon className="w-6 h-6" style={{ color: colors.iconColor }} />
                      </div>
                      <div className="flex items-center gap-1.5">
                        {card.trend !== 0 && (
                          <div className={`flex items-center gap-0.5 px-2 py-1 rounded-lg text-[10px] font-bold border ${
                            ((card.isInverse ? card.trend < 0 : card.trend > 0))
                              ? 'bg-status-success/5 border-status-success/20 text-status-success' 
                              : 'bg-status-danger/5 border-status-danger/20 text-status-danger'
                          }`}>
                            {card.trend > 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                            {Math.abs(card.trend)}%
                          </div>
                        )}
                        <div className="p-2 rounded-lg bg-muted/50 border border-border/40">
                          <Icon className="w-4 h-4 opacity-40 shrink-0" />
                        </div>
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

            {/* Extra Graphs — sales rep */}
            {pipelineBars.length > 0 && conversionSnapshot && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="crm-card ll-moving-edge !p-0 overflow-hidden">
                  <div className="p-7 border-b border-border/40 flex items-center justify-between">
                    <div>
                      <p className="crm-page-subtitle">Pipeline Distribution</p>
                      <p className="text-lg font-bold text-foreground mt-1" style={{ fontFamily: 'var(--ll-font-display)' }}>
                        My Stage Volume
                      </p>
                    </div>
                  </div>
                  <div className="p-7 h-[260px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={pipelineBars} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.12} />
                        <XAxis dataKey="stage" tick={{ fontSize: 10, fontWeight: 800 }} />
                        <YAxis tick={{ fontSize: 10, fontWeight: 800 }} />
                        <Tooltip
                          contentStyle={{
                            background: 'rgba(15, 23, 42, 0.92)',
                            border: '1px solid rgba(255, 255, 255, 0.12)',
                            borderRadius: '14px',
                            color: '#F1F5F9',
                            padding: '10px 12px'
                          }}
                          labelStyle={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.12em' }}
                          itemStyle={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.12em' }}
                        />
                        <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                          {pipelineBars.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="crm-card ll-moving-edge !p-0 overflow-hidden">
                  <div className="p-7 border-b border-border/40 flex items-center justify-between">
                    <div>
                      <p className="crm-page-subtitle">Conversion Rate</p>
                      <p className="text-lg font-bold text-foreground mt-1" style={{ fontFamily: 'var(--ll-font-display)' }}>
                        Snapshot
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary tabular-nums">
                        {conversionSnapshot.rate.toFixed(1)}%
                      </div>
                      <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                        Converted / Total
                      </div>
                    </div>
                  </div>
                  <div className="p-7 grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
                    <div className="h-[220px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'Converted', value: conversionSnapshot.converted, color: 'var(--primary)' },
                              { name: 'Active', value: conversionSnapshot.active, color: '#60A5FA' },
                              { name: 'Lost', value: conversionSnapshot.lost, color: '#F87171' },
                            ]}
                            dataKey="value"
                            nameKey="name"
                            innerRadius={58}
                            outerRadius={86}
                            paddingAngle={3}
                          >
                            {[
                              { color: 'var(--primary)' },
                              { color: '#60A5FA' },
                              { color: '#F87171' },
                            ].map((c, i) => (
                              <Cell key={i} fill={c.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              background: 'rgba(15, 23, 42, 0.92)',
                              border: '1px solid rgba(255, 255, 255, 0.12)',
                              borderRadius: '14px',
                              color: '#F1F5F9',
                              padding: '10px 12px'
                            }}
                            labelStyle={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.12em' }}
                            itemStyle={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.12em' }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="space-y-3">
                      {[
                        { label: 'Converted', value: conversionSnapshot.converted, color: 'var(--primary)' },
                        { label: 'Active', value: conversionSnapshot.active, color: '#60A5FA' },
                        { label: 'Lost', value: conversionSnapshot.lost, color: '#F87171' },
                      ].map((m) => (
                        <div key={m.label} className="flex items-center justify-between rounded-2xl border border-border/40 bg-muted/10 px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ background: m.color as any }} />
                            <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70">{m.label}</div>
                          </div>
                          <div className="text-sm font-bold tabular-nums text-foreground">{m.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Recent leads first (wider column); task queue + quick actions on the right */}
              <div className="lg:col-span-2 space-y-8">
                <div className="crm-card ll-moving-edge !p-0 overflow-hidden">
                  <div className="p-8 border-b border-border/40 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-purple-500/10 border border-purple-500/10">
                        <BarChart3 className="w-5 h-5 text-purple-400" />
                      </div>
                      <h2 className="text-lg font-bold text-foreground truncate" style={{ fontFamily: 'var(--ll-font-display)' }}>Recent Leads</h2>
                    </div>
                    <Link to="/kanban" className="px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider border border-border/40 hover:bg-muted hover:border-primary/20 transition-all flex items-center gap-2 shrink-0">
                      Full Pipeline <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                  <div className="p-8">
                    <div className="space-y-4">
                      {recentLeads.length > 0 ? recentLeads.map((lead: LeadType) => (
                        <Link key={lead.id} to={`/leads/${lead.id}`} className="flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-2xl transition-all group gap-4 bg-muted/10 border border-border/40 hover:bg-primary/5 hover:border-primary/20">
                          <div className="flex items-center gap-5 min-w-0">
                            <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg transition-transform group-hover:scale-105 bg-primary/10 text-primary border border-primary/20 shadow-inner shrink-0 leading-none">
                              {(lead?.company?.trim?.()?.[0] ?? '?').toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-lg tracking-tight truncate text-foreground leading-none">{lead.company || '—'}</p>
                              <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-2">
                                <span className={`crm-badge text-[8px] shrink-0 ${lead.stage === 'NEW' ? 'badge-stage-new' :
                                  lead.stage === 'CONTACTED' ? 'badge-stage-contacted' :
                                    lead.stage === 'INTERESTED' ? 'badge-stage-qualified' :
                                        lead.stage === 'CONVERTED' ? 'badge-stage-converted' :
                                          'badge-stage-lost'
                                  }`}>
                                  {lead.stage}
                                </span>
                                <span className="text-[10px] font-bold opacity-30 tracking-wider">
                                  ₹{(Number(lead.value) || 0).toLocaleString('en-IN')}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 self-start sm:self-center">
                            <span className={`crm-badge text-[8px] shrink-0 ${lead.priority === 'HIGH' ? 'badge-priority-high' :
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

              <div className="space-y-8">
                {hasPermission(user?.role as Role, 'canCreateLeads') && (
                  <div className="crm-card ll-moving-edge">
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

                <div className="crm-card ll-moving-edge !p-0 overflow-hidden">
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
