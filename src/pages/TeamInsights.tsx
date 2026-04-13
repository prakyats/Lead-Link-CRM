import React, { useMemo } from 'react';
import { Sidebar } from '../components/Sidebar';
import { 
  Users, BarChart3, TrendingUp, AlertTriangle, 
  Activity, Clock, UserCheck, ChevronRight,
  TrendingDown, List, Layers, PieChart,
  Target, Zap, AlertCircle
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

const MetricCard = ({ title, value, subtitle, icon: Icon, color, trend }: any) => {
  const colorMap: Record<string, string> = {
    teal: 'text-[var(--crm-teal)]',
    green: 'text-emerald-400',
    amber: 'text-amber-400',
    red: 'text-rose-400',
    blue: 'text-blue-400',
    purple: 'text-purple-400'
  };

  const bgMap: Record<string, string> = {
    teal: 'bg-[var(--crm-teal-glow)]',
    green: 'bg-emerald-500/10',
    amber: 'bg-amber-500/10',
    red: 'bg-rose-500/10',
    blue: 'bg-blue-500/10',
    purple: 'bg-purple-500/10'
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="crm-card group hover:bg-card/60 transition-all duration-500 border-white/5 bg-card/40 backdrop-blur-xl relative overflow-hidden"
    >
      <div className="flex items-center gap-6 relative z-10">
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${bgMap[color] || 'bg-primary/10'}`}>
          <Icon className={`w-7 h-7 ${colorMap[color] || 'text-primary'}`} strokeWidth={1.5} />
        </div>
        <div className="flex-1">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 mb-1">{title}</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-semibold tracking-tighter tabular-nums">{value}</h3>
            {trend !== undefined && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-lg flex items-center gap-0.5 ${trend >= 0 ? 'text-emerald-400 bg-emerald-400/10' : 'text-rose-400 bg-rose-400/10'}`}>
                {trend >= 0 ? '+' : ''}{trend}%
              </span>
            )}
          </div>
          <p className="text-[10px] font-bold text-muted-foreground/20 uppercase tracking-widest mt-1">{subtitle}</p>
        </div>
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
    if (!performance || !Array.isArray(performance)) return [];
    return [...performance].sort((a, b) => {
      if (b.conversionRate !== a.conversionRate) {
        return b.conversionRate - a.conversionRate;
      }
      return b.totalLeads - a.totalLeads;
    });
  }, [performance]);

  const aggregateStats = useMemo(() => {
    if (!sortedPerformance || sortedPerformance.length === 0) {
      return { totalLeads: 0, avgConversion: 0, taskCompletionRate: 0, atRisk: 0, hasData: false };
    }
    const totalLeads = sortedPerformance.reduce((acc: number, curr: any) => acc + curr.totalLeads, 0);
    const totalConverted = sortedPerformance.reduce((acc: number, curr: any) => acc + curr.convertedLeads, 0);
    const avgConversion = totalLeads > 0 ? ((totalConverted / totalLeads) * 100).toFixed(1) : 0;
    const totalTasksCompleted = sortedPerformance.reduce((acc: number, curr: any) => acc + curr.tasksCompleted, 0);
    const totalTasksPending = sortedPerformance.reduce((acc: number, curr: any) => acc + curr.tasksPending, 0);
    const totalTasks = totalTasksCompleted + totalTasksPending;
    const taskCompletionRate = totalTasks > 0 ? ((totalTasksCompleted / totalTasks) * 100).toFixed(1) : 0;

    return {
      totalLeads,
      avgConversion,
      taskCompletionRate,
      atRisk: risk?.inactiveLeadsCount || 0,
      hasData: totalLeads > 0 || totalTasks > 0
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

  const maxStageCount = Math.max(...Object.values(pipeline || {}).map((v: any) => v), 1);
  const isPipelineEmpty = Object.values(pipeline || {}).every(v => v === 0);

  return (
    <div className="crm-page-container">
      <Sidebar />
      <main className="crm-main-content">
        <div className="ll-hero-grid opacity-[0.02] dark:opacity-[0.05]" />
        <div className="ll-orb w-[600px] h-[600px] -top-64 -right-32 bg-primary/5 blur-[120px]" />

        <div className="relative z-10 h-full overflow-y-auto custom-scrollbar p-10">
          <div className="max-w-7xl mx-auto space-y-10">
            {/* Header */}
            <header className="animate-in fade-in slide-in-from-top duration-700">
              <div className="flex items-center gap-3 text-primary mb-3 font-semibold text-xs uppercase tracking-wider">
                <BarChart3 size={14} className="animate-pulse" />
                Strategic Oversight Unit
              </div>
              <h1 className="crm-page-title">Team <span className="text-primary">Insights</span></h1>
              <p className="crm-page-subtitle max-w-2xl mt-3">
                High-altitude performance monitoring and pipeline velocity tracking for your assigned agents.
              </p>
            </header>

            {!sortedPerformance || sortedPerformance.length === 0 ? (
              <div className="py-32 text-center space-y-8 animate-in zoom-in duration-500 glass-morphic border-dashed border-white/5 rounded-[3rem]">
                <div className="w-24 h-24 rounded-[2rem] bg-white/5 flex items-center justify-center mx-auto text-muted-foreground/20 italic font-black text-4xl">
                  0
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold uppercase tracking-tight">No Team Metrics Identified</h2>
                  <p className="text-muted-foreground/60 max-w-sm mx-auto text-xs font-semibold leading-relaxed">
                    Once you assign leads to your frontline personnel, granular performance telemetry will initialize here.
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* KPI Header Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <MetricCard 
                    title="Total Leads (Team)" 
                    value={aggregateStats?.totalLeads || 0} 
                    subtitle="Aggregated Pipeline" 
                    icon={Users} 
                    color="teal" 
                  />
                  <MetricCard 
                    title="Conversion Velocity" 
                    value={`${aggregateStats?.avgConversion}%`} 
                    subtitle="Success Rate" 
                    icon={TrendingUp} 
                    color="green" 
                  />
                  <MetricCard 
                    title="Deployment Health" 
                    value={`${aggregateStats?.taskCompletionRate}%`} 
                    subtitle="Task Completion" 
                    icon={UserCheck} 
                    color="blue" 
                  />
                  <MetricCard 
                    title="At-Risk Signals" 
                    value={aggregateStats?.atRisk} 
                    subtitle="Requires Nurture" 
                    icon={AlertTriangle} 
                    color="red" 
                  />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                  {/* Team Performance Table */}
                  <div className="lg:col-span-2 space-y-6">
                    <div className="crm-card bg-card/20 backdrop-blur-3xl border-white/5 !p-0 overflow-hidden relative">
                      <div className="p-8 border-b border-border/40 flex items-center justify-between">
                        <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-foreground flex items-center gap-3">
                          <Target size={16} className="text-primary" />
                          Personnel Efficiency Matrix
                        </h2>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left">
                          <thead>
                            <tr className="bg-muted/10">
                              <th className="px-8 py-5 text-[9px] font-black uppercase tracking-widest text-muted-foreground/30">Representative</th>
                              <th className="px-8 py-5 text-[9px] font-black uppercase tracking-widest text-muted-foreground/30 text-center">Volume</th>
                              <th className="px-8 py-5 text-[9px] font-black uppercase tracking-widest text-muted-foreground/30 text-center">Conv %</th>
                              <th className="px-8 py-5 text-[9px] font-black uppercase tracking-widest text-muted-foreground/30 text-center">Tasks</th>
                              <th className="px-8 py-5 text-[9px] font-black uppercase tracking-widest text-muted-foreground/30 text-center">Overdue</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/20">
                            {sortedPerformance.map((agent: any, i: number) => {
                              const isTopPerformer = i === 0 && agent.conversionRate > 0;
                              const needsAttention = agent.conversionRate < 10 && agent.totalLeads > 5 || agent.overdueTasks > 5;
                              
                              return (
                                <motion.tr 
                                  key={agent.id}
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: i * 0.05 }}
                                  className="group hover:bg-primary/[0.02]"
                                >
                                  <td className="px-8 py-5">
                                    <div className="flex items-center gap-3">
                                      <div className="relative">
                                        <div className="w-9 h-9 rounded-xl bg-card border border-border/40 flex items-center justify-center text-[10px] font-black text-primary group-hover:border-primary/40 transition-all uppercase overflow-hidden">
                                          {agent.name.split(' ').map((n: string) => n[0]).join('')}
                                        </div>
                                        {isTopPerformer && (
                                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 rounded-full flex items-center justify-center text-[8px] shadow-lg shadow-amber-400/20 border border-black/20" title="Top Performer">
                                            🥇
                                          </div>
                                        )}
                                      </div>
                                      <div>
                                        <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors block">{agent.name}</span>
                                        {needsAttention && (
                                          <span className="text-[8px] font-black uppercase tracking-widest text-rose-400 flex items-center gap-1 mt-0.5">
                                            <AlertCircle size={8} /> Needs Attention
                                          </span>
                                        )}
                                        {isTopPerformer && (
                                          <span className="text-[8px] font-black uppercase tracking-widest text-amber-400/60 block mt-0.5">Top Performer</span>
                                        )}
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-8 py-5 text-center text-xs font-bold tabular-nums">{agent.totalLeads}</td>
                                  <td className="px-8 py-5 text-center">
                                    <span className={`text-xs font-bold tabular-nums ${agent.conversionRate > 15 ? 'text-emerald-400' : agent.conversionRate < 5 ? 'text-rose-400' : 'text-foreground/60'}`}>
                                      {agent.conversionRate}%
                                    </span>
                                  </td>
                                  <td className="px-8 py-5 text-center text-xs font-bold tabular-nums text-foreground/60">{agent.tasksCompleted}</td>
                                  <td className="px-8 py-5 text-center">
                                    <span className={`text-xs font-bold tabular-nums ${agent.overdueTasks > 0 ? 'text-rose-400' : 'text-foreground/20'}`}>
                                      {agent.overdueTasks}
                                    </span>
                                  </td>
                                </motion.tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Pipeline Distribution */}
                    <div className="crm-card bg-card/20 backdrop-blur-3xl border-white/5">
                      <div className="flex items-center justify-between mb-8">
                        <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-foreground flex items-center gap-3">
                          <Layers size={16} className="text-primary" />
                          Pipeline Distribution Model
                        </h2>
                        {isPipelineEmpty && (
                          <span className="text-[10px] font-bold text-muted-foreground/20 uppercase tracking-widest italic">No leads in funnel</span>
                        )}
                      </div>
                      <div className="space-y-6">
                        {pipelineStages.map((stage) => (
                          <div key={stage.key} className="space-y-2">
                            <div className="flex justify-between items-end">
                              <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground/60">{stage.label}</span>
                              <span className="text-xs font-bold tabular-nums">{(pipeline && pipeline[stage.key]) || 0}</span>
                            </div>
                            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: isPipelineEmpty ? 0 : `${(((pipeline && pipeline[stage.key]) || 0) / maxStageCount) * 100}%` }}
                                transition={{ duration: 1, ease: 'easeOut' }}
                                className={`h-full ${stage.color} shadow-[0_0_12px_rgba(255,255,255,0.1)]`}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Sidebar Content (Risk & Activity) */}
                  <div className="space-y-8">
                    {/* Risk & Alert Panel */}
                    <div className="crm-card bg-rose-500/5 border-rose-500/10 backdrop-blur-3xl">
                      <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-rose-400 flex items-center gap-3 mb-6">
                        <AlertCircle size={16} />
                        Risk Signals
                      </h2>
                      <div className="space-y-4">
                        <div className={`flex items-center gap-4 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 transition-opacity ${risk?.overdueTasksCount === 0 ? 'opacity-30' : 'opacity-100'}`}>
                          <div className="w-10 h-10 rounded-xl bg-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
                            <Clock size={20} />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-rose-200">Overdue Task Warning</p>
                            <p className="text-[10px] font-semibold text-rose-400/60 uppercase tracking-widest mt-0.5">{risk?.overdueTasksCount || 0} overdue follow-ups</p>
                          </div>
                        </div>
                        <div className={`flex items-center gap-4 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 transition-opacity ${risk?.inactiveLeadsCount === 0 ? 'opacity-30' : 'opacity-100'}`}>
                          <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                            <Zap size={20} />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-amber-200">Idle Lead Alert</p>
                            <p className="text-[10px] font-semibold text-amber-400/60 uppercase tracking-widest mt-0.5">{risk?.inactiveLeadsCount || 0} cold leads (>7d)</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Team Activity Feed */}
                    <div className="crm-card bg-card/20 backdrop-blur-3xl border-white/5">
                      <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-foreground flex items-center gap-3 mb-8">
                        <Activity size={16} className="text-primary" />
                        Operational Stream
                      </h2>
                      {(!activity || activity.length === 0) ? (
                        <div className="py-20 text-center opacity-20">
                          <Activity size={32} className="mx-auto mb-4" />
                          <p className="text-[9px] font-bold uppercase tracking-[0.2em]">No Interaction Logs</p>
                        </div>
                      ) : (
                        <div className="space-y-8 relative before:absolute before:left-[17px] before:top-2 before:bottom-2 before:w-px before:bg-white/5">
                          {activity.map((act: any, i: number) => (
                            <div key={act.id} className="relative flex items-start gap-4">
                              <div className="w-9 h-9 rounded-xl border border-white/5 bg-muted flex items-center justify-center relative z-10 shrink-0 shadow-sm">
                                <Activity size={14} className="text-primary/60" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-xs text-foreground/80 leading-snug">
                                  <span className="font-bold text-primary">{act.performedBy?.name || 'Unknown Agent'}</span>
                                  {' recorded a '}
                                  <span className="font-bold text-foreground uppercase text-[10px] tracking-wider">{act.type}</span>
                                </p>
                                <p className="text-[10px] font-bold text-muted-foreground/30 uppercase tracking-widest mt-1 flex items-center gap-2">
                                  {act.lead?.company || 'Lead Signature'} • {new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
