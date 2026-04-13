import React, { useMemo } from 'react';
import { Sidebar } from '../components/Sidebar';
import { 
  Users, BarChart3, TrendingUp, AlertTriangle, 
  Activity, Clock, UserCheck, ChevronRight,
  TrendingDown, List, Layers, PieChart,
  Target, Zap, AlertCircle, ArrowUp, ArrowDown,
  Calendar, CheckCircle2, UserPlus, Users2
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { 
  getTeamActivity, 
  getTeamPerformance, 
  getTeamPipeline, 
  getTeamRisk 
} from '../api/dashboard';
import { motion } from 'framer-motion';
import { GlobalLoader } from '../components/GlobalLoader';
import { formatDistanceToNow } from 'date-fns';

const fadeInUp = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: 'easeOut' }
};

const KPICard = ({ title, value, trend, isInverse, icon: Icon, color, subtitle, delay = 0 }: any) => {
  const colorMap: Record<string, { iconBg: string; iconColor: string }> = {
    teal: { iconBg: 'var(--crm-teal-glow)', iconColor: 'var(--crm-teal)' },
    green: { iconBg: 'rgba(34,197,94,0.12)', iconColor: '#4ADE80' },
    amber: { iconBg: 'var(--crm-amber-glow)', iconColor: 'var(--crm-amber)' },
    red: { iconBg: 'rgba(239,68,68,0.12)', iconColor: '#F87171' },
    blue: { iconBg: 'rgba(96,165,250,0.12)', iconColor: '#60A5FA' },
    purple: { iconBg: 'rgba(192,132,252,0.12)', iconColor: '#C084FC' },
  };

  const colors = colorMap[color] || colorMap.teal;
  const isPositive = trend > 0;
  const isGood = isInverse ? !isPositive : isPositive;

  return (
    <motion.div 
      variants={fadeInUp}
      initial="initial"
      animate="animate"
      transition={{ ...fadeInUp.transition, delay }}
      className="crm-card crm-card-hover group"
    >
      <div className="flex justify-between items-start mb-6">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 shadow-inner" style={{ background: colors.iconBg }}>
          <Icon className="w-6 h-6" style={{ color: colors.iconColor }} />
        </div>
        <div className="flex items-center gap-1.5">
          {trend !== 0 && (
            <div className={`flex items-center gap-0.5 px-2 py-1 rounded-lg text-[10px] font-bold border ${
              isGood
                ? 'bg-status-success/5 border-status-success/20 text-status-success' 
                : 'bg-status-danger/5 border-status-danger/20 text-status-danger'
            }`}>
              {trend > 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
              <span className="font-mono-data">{Math.abs(trend)}%</span>
            </div>
          )}
          <div className="p-2 rounded-lg bg-muted/50 border border-border/40">
            <Icon className="w-4 h-4 opacity-40 shrink-0" />
          </div>
        </div>
      </div>
      <div>
        <p className="crm-page-subtitle">{title}</p>
        <p className="text-3xl font-bold tracking-tight text-foreground font-mono-data">{value}</p>
        <p className="text-[10px] font-bold uppercase mt-2 opacity-40">{subtitle}</p>
      </div>
    </motion.div>
  );
};

export default function TeamInsights() {
  const { data: performance, isLoading: perfLoading } = useQuery({
    queryKey: ['team-insights', 'performance'],
    queryFn: getTeamPerformance
  });

  const { data: activity, isLoading: activityLoading } = useQuery({
    queryKey: ['team-insights', 'activity'],
    queryFn: getTeamActivity
  });

  const { data: pipeline, isLoading: pipeLoading } = useQuery({
    queryKey: ['team-insights', 'pipeline'],
    queryFn: getTeamPipeline
  });

  const { data: risk, isLoading: riskLoading } = useQuery({
    queryKey: ['team-insights', 'risk'],
    queryFn: getTeamRisk
  });

  const sortedPerformance = useMemo(() => {
    if (!Array.isArray(performance)) return [];
    return [...performance].sort((a, b) => b.conversionRate - a.conversionRate);
  }, [performance]);

  const aggregateStats = useMemo(() => {
    if (!sortedPerformance || sortedPerformance.length === 0) {
      return { totalLeads: 0, avgConversion: 0, taskCompletionRate: 0, atRisk: 0, hasData: false };
    }
    const totalLeads = sortedPerformance.reduce((acc: number, curr: any) => acc + curr.totalLeads, 0);
    const totalConverted = sortedPerformance.reduce((acc: number, curr: any) => acc + curr.convertedLeads, 0);
    const avgConversion = totalLeads > 0 ? ((totalConverted / totalLeads) * 100).toFixed(1) : 0;
    const totalTasksCompleted = sortedPerformance.reduce((acc: number, curr: any) => acc + curr.tasksCompleted, 0);
    const totalOverdue = sortedPerformance.reduce((acc: number, curr: any) => acc + curr.overdueTasks, 0);
    const totalTasks = totalTasksCompleted + totalOverdue;
    const taskCompletionRate = totalTasks > 0 ? (totalTasksCompleted / totalTasks) * 100 : 0;

    return {
      totalLeads,
      avgConversion,
      taskCompletionRate: parseFloat(taskCompletionRate.toFixed(1)),
      atRisk: risk?.inactiveLeadsCount || 0,
      hasData: true
    };
  }, [sortedPerformance, risk]);

  if (perfLoading || activityLoading || pipeLoading || riskLoading) {
    return (
      <div className="crm-page-container flex items-center justify-center">
        <GlobalLoader />
      </div>
    );
  }

  const pipelineStages = [
    { key: 'NEW', label: 'New Leads', color: 'bg-blue-400' },
    { key: 'CONTACTED', label: 'Contacted', color: 'bg-indigo-400' },
    { key: 'INTERESTED', label: 'Interested', color: 'bg-amber-400' },
    { key: 'CONVERTED', label: 'Converted', color: 'bg-emerald-400' },
    { key: 'LOST', label: 'Lost', color: 'bg-rose-400' }
  ];

  const totalPipelineLeads = Object.values(pipeline || {}).reduce((acc: number, curr: any) => acc + curr, 0);
  const maxStageCount = Math.max(...Object.values(pipeline || {}).map((v: any) => v), 1);

  return (
    <div className="crm-page-container">
      <Sidebar />
      <main className="crm-main-content">
        <div className="ll-hero-grid opacity-[0.03] dark:opacity-[0.05]" />
        <div className="ll-orb w-[600px] h-[600px] -top-64 -right-64 bg-primary/20 blur-[120px]" />

        <div className="max-w-7xl mx-auto p-8 space-y-8 relative z-10">
          <header className="animate-in slide-in-from-left duration-700">
            <p className="crm-page-subtitle">Strategic Oversight</p>
            <h1 className="crm-page-title mt-1">Team Insights</h1>
            <p className="text-xs font-semibold uppercase tracking-wider opacity-40 mt-2">
              Performance telemetry and pipeline velocity
            </p>
          </header>

          {/* KPI Header Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <KPICard 
              title="Total Leads" 
              value={aggregateStats.totalLeads} 
              trend={12} 
              icon={Users} 
              color="teal" 
              subtitle="Current team pipeline" 
              delay={0.1}
            />
            <KPICard 
              title="Conversion Rate" 
              value={`${aggregateStats.avgConversion}%`} 
              trend={5.4} 
              icon={TrendingUp} 
              color="green" 
              subtitle="Success velocity" 
              delay={0.2}
            />
            <KPICard 
              title="Team Efficiency" 
              value={`${aggregateStats.taskCompletionRate}%`} 
              trend={-2.1} 
              icon={CheckCircle2} 
              color="blue" 
              subtitle="Task completion rate" 
              delay={0.3}
            />
            <KPICard 
              title="At-Risk Leads" 
              value={aggregateStats.atRisk} 
              trend={8} 
              isInverse={true}
              icon={AlertTriangle} 
              color="red" 
              subtitle="Requires intervention" 
              delay={0.4}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {/* Personnel Efficiency Matrix */}
              <div className="crm-card !p-0 overflow-hidden shadow-2xl">
                <div className="p-8 border-b border-border/40 flex items-center justify-between bg-muted/5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-primary/10">
                      <Target className="w-5 h-5 text-primary" />
                    </div>
                    <h2 className="text-lg font-bold text-foreground">Personnel Efficiency Matrix</h2>
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-30">Performance Ledger</p>
                </div>
                
                <div className="overflow-x-auto">
                  {sortedPerformance.length > 0 ? (
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-muted/10 border-b border-border/40">
                          <th className="px-8 py-5 text-[9px] font-black uppercase tracking-widest text-muted-foreground">Representative</th>
                          <th className="px-8 py-5 text-[9px] font-black uppercase tracking-widest text-muted-foreground text-center">Conv %</th>
                          <th className="px-8 py-5 text-[9px] font-black uppercase tracking-widest text-muted-foreground text-center">Volume</th>
                          <th className="px-8 py-5 text-[9px] font-black uppercase tracking-widest text-muted-foreground text-center">Last Activity</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/20">
                        {sortedPerformance.map((agent: any, i: number) => {
                          const isTop = i === 0 && agent.conversionRate > 0;
                          const isLow = agent.conversionRate < 10;
                          return (
                            <tr key={agent.id} className="group hover:bg-primary/[0.02] transition-colors">
                              <td className="px-8 py-5">
                                <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold border border-primary/20 shadow-inner group-hover:rotate-6 transition-transform">
                                    {agent.name.charAt(0)}
                                  </div>
                                  <div>
                                    <p className="font-bold text-foreground">{agent.name}</p>
                                    <div className="flex gap-2 mt-1">
                                      {isTop && (
                                        <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[8px] font-black uppercase tracking-tighter">
                                          🥇 Top Performer
                                        </span>
                                      )}
                                      {isLow && (
                                        <span className="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-500 border border-rose-500/20 text-[8px] font-black uppercase tracking-tighter">
                                          ⚠️ Needs Attention
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-8 py-5 text-center">
                                <div className="inline-flex flex-col items-center">
                                  <span className="text-sm font-bold font-mono-data text-foreground">{agent.conversionRate}%</span>
                                  {agent.conversionDelta !== 0 && (
                                    <span className={`text-[9px] font-bold flex items-center gap-0.5 ${agent.conversionDelta > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                      {agent.conversionDelta > 0 ? <ArrowUp size={8} /> : <ArrowDown size={8} />}
                                      {Math.abs(agent.conversionDelta)}%
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-8 py-5 text-center text-sm font-bold font-mono-data text-foreground/60">{agent.totalLeads}</td>
                              <td className="px-8 py-5 text-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
                                {agent.lastActivity ? formatDistanceToNow(new Date(agent.lastActivity), { addSuffix: true }) : 'Never'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  ) : (
                    <div className="py-20 text-center opacity-30">
                      <Users className="w-12 h-12 mx-auto mb-4 opacity-20" />
                      <p className="text-xs font-semibold uppercase tracking-wider">No team activity yet</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Pipeline Distribution Chart */}
              <div className="crm-card shadow-xl">
                 <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-indigo-500/10">
                        <Layers className="w-5 h-5 text-indigo-400" />
                      </div>
                      <h2 className="text-lg font-bold text-foreground">Pipeline Velocity Chart</h2>
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-30">Functional Distribution</p>
                 </div>
                 
                 <div className="space-y-6">
                    {totalPipelineLeads > 0 ? pipelineStages.map((stage) => {
                      const count = pipeline[stage.key] || 0;
                      const percent = totalPipelineLeads > 0 ? Math.round((count / totalPipelineLeads) * 100) : 0;
                      return (
                        <div key={stage.key} className="space-y-2">
                          <div className="flex justify-between items-end">
                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                              {stage.label} — <span className="text-foreground tracking-normal font-mono-data font-bold">{count} ({percent}%)</span>
                            </span>
                          </div>
                          <div className="h-2 w-full bg-muted/30 rounded-full overflow-hidden border border-border/40">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${(count / maxStageCount) * 100}%` }}
                              transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
                              className={`h-full ${stage.color} shadow-sm relative`}
                            >
                               <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </motion.div>
                          </div>
                        </div>
                      );
                    }) : (
                      <div className="py-16 text-center border-2 border-dashed border-border/40 rounded-3xl opacity-30">
                        <Activity className="w-10 h-10 mx-auto mb-4" />
                        <p className="text-xs font-semibold uppercase tracking-wider">No team activity yet</p>
                      </div>
                    )}
                 </div>
              </div>
            </div>

            <div className="space-y-8">
              {/* Operational Stream */}
              <div className="crm-card shadow-xl">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-500/10">
                    <Zap className="w-5 h-5 text-emerald-400" />
                  </div>
                  <h2 className="text-lg font-bold text-foreground">Operational Stream</h2>
                </div>
                
                <div className="space-y-6 relative before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-px before:bg-border/40">
                  {activity && activity.length > 0 ? activity.map((act: any, i: number) => (
                    <div key={act.id} className="relative flex items-start gap-4 animate-in fade-in slide-in-from-right duration-500" style={{ animationDelay: `${i * 100}ms` }}>
                      <div className="w-10 h-10 rounded-xl bg-card border border-border/40 flex items-center justify-center relative z-10 shrink-0 shadow-sm">
                        <Activity className="w-4 h-4 text-primary/60" />
                      </div>
                      <div className="min-w-0 pt-0.5">
                        <p className="text-xs font-bold text-foreground leading-snug">
                          {act.performedBy?.name}
                        </p>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-primary mt-0.5">
                          {act.type} • <span className="text-foreground/40">{act.lead?.company || 'Lead Signature'}</span>
                        </p>
                        <p className="text-[9px] font-bold text-muted-foreground/30 uppercase tracking-widest mt-1.5 flex items-center gap-2">
                           <Clock size={10} />
                           {formatDistanceToNow(new Date(act.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  )) : (
                    <div className="py-20 text-center opacity-30">
                      <Activity className="w-10 h-10 mx-auto mb-4" />
                      <p className="text-xs font-semibold uppercase tracking-wider">No team activity yet</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Risk Panel */}
              <div className="crm-card bg-rose-500/5 border-rose-500/10 shadow-lg">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <h2 className="text-lg font-bold text-foreground">Risk Watch</h2>
                </div>
                
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-muted/10 border border-border/40 flex items-center gap-4">
                     <div className="w-10 h-10 rounded-xl bg-rose-500/20 flex items-center justify-center text-rose-400">
                        <Clock className="w-5 h-5" />
                     </div>
                     <div>
                        <p className="text-xs font-bold text-foreground">Overdue Cycle</p>
                        <p className="text-[9px] font-black uppercase tracking-widest text-rose-500 mt-1">
                          <span className="font-mono-data text-sm mr-1">{risk?.overdueTasksCount || 0}</span> Tasks Critical
                        </p>
                     </div>
                  </div>
                  <div className="p-4 rounded-2xl bg-muted/10 border border-border/40 flex items-center gap-4">
                     <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400">
                        <Zap className="w-5 h-5" />
                     </div>
                     <div>
                        <p className="text-xs font-bold text-foreground">Lead Stagnation</p>
                        <p className="text-[9px] font-black uppercase tracking-widest text-amber-500 mt-1">
                           <span className="font-mono-data text-sm mr-1">{risk?.inactiveLeadsCount || 0}</span> Cold Leads (>7d)
                        </p>
                     </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
