import React, { useMemo } from 'react';
import { Sidebar } from '../components/Sidebar';
import { 
  Users, BarChart3, TrendingUp, AlertTriangle, 
  Activity, Clock, UserCheck, ChevronRight,
  TrendingDown, List, Layers, PieChart,
  Target, Zap, AlertCircle, ArrowUp, ArrowDown,
  Calendar, CheckCircle2, UserPlus, Users2, Info
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
} as const;

const KPICard = ({ title, value, icon: Icon, color, subtitle, delay = 0 }: any) => {
  const colorMap: Record<string, { iconBg: string; iconColor: string }> = {
    teal: { iconBg: 'var(--crm-teal-glow)', iconColor: 'var(--crm-teal)' },
    green: { iconBg: 'rgba(34,197,94,0.12)', iconColor: '#4ADE80' },
    amber: { iconBg: 'var(--crm-amber-glow)', iconColor: 'var(--crm-amber)' },
    red: { iconBg: 'rgba(239,68,68,0.12)', iconColor: '#F87171' },
    blue: { iconBg: 'rgba(96,165,250,0.12)', iconColor: '#60A5FA' },
    rose: { iconBg: 'rgba(244,63,94,0.12)', iconColor: '#FB7185' },
    purple: { iconBg: 'rgba(192,132,252,0.12)', iconColor: '#C084FC' },
  };

  const colors = colorMap[color] || colorMap.teal;

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
        <div className="p-2 rounded-lg bg-muted/50 border border-border/40">
          <Icon className="w-4 h-4 opacity-40 shrink-0" />
        </div>
      </div>
      <div>
        <p className="crm-page-subtitle">{title}</p>
        <div className="flex items-baseline gap-2 mt-1">
          <h3 className="text-3xl font-bold font-mono-data tracking-tight text-foreground">
            {value}
          </h3>
        </div>
        {subtitle && (
          <p className="text-[10px] font-bold text-muted-foreground mt-2 flex items-center gap-1.5 opacity-60">
            <Clock size={10} className="text-primary/40" />
            {subtitle}
          </p>
        )}
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
    // Extract actual array from structured response
    const perfData = (performance as any)?.performance;
    if (!Array.isArray(perfData)) return [];
    
    // Sort logic (Trusting backend role filter)
    return [...perfData].sort((a, b) => {
      // Primary: Priority Rank (1 is highest)
      if (a.priorityRank && b.priorityRank) return a.priorityRank - b.priorityRank;
      if (a.priorityRank) return -1;
      if (b.priorityRank) return 1;
      // Fallback: Conversion Rate
      return b.conversionRate - a.conversionRate;
    });
  }, [performance]);

  const summaryLine = useMemo(() => {
    const priorityUsers = sortedPerformance.filter((p: any) => p.priorityRank && p.priorityRank <= 3);
    if (priorityUsers.length === 0) return null;
    const topUser = priorityUsers[0];
    const reason = topUser.priorityReasons?.[0] ? ` (${topUser.priorityReasons[0]})` : "";
    return `${priorityUsers.length} reps need attention — most critical: ${topUser.name}${reason}`;
  }, [sortedPerformance]);

  const aggregateStats = useMemo(() => {
    if (!sortedPerformance || sortedPerformance.length === 0) {
      return { 
        inactiveReps: (performance as any)?.metrics?.totalInactive || 0, 
        noLeadReps: (performance as any)?.metrics?.totalNoLeads || 0, 
        leadsPerRep: (performance as any)?.metrics?.leadsPerRep || 0, 
        atRisk: risk?.inactiveLeadsCount || 0, 
        hasData: false 
      };
    }
    
    const totalLeads = sortedPerformance.reduce((acc: number, curr: any) => acc + curr.totalLeads, 0);
    const totalReps = sortedPerformance.length;
    
    // Logic: lastActivity exists (not newly onboarded) AND matches Inactive state
    const inactiveReps = sortedPerformance.filter((p: any) => p.lastActivity && p.activityStatus.includes('No task completed')).length;
    const noLeadReps = sortedPerformance.filter((p: any) => p.totalLeads === 0).length;
    const leadsPerRep = totalReps > 0 ? (totalLeads / totalReps).toFixed(1) : 0;

    return {
      inactiveReps,
      noLeadReps,
      leadsPerRep,
      atRisk: risk?.inactiveLeadsCount || 0,
      hasData: true
    };
  }, [sortedPerformance, performance, risk]);

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

  const dist = pipeline?.distribution || (performance as any)?.distribution || {};
  const totalPipelineLeads = Object.values(dist).reduce((acc: number, curr: any) => acc + curr, 0);
  const maxStageCount = Math.max(...Object.values(dist).map((v: any) => v), 1);

  return (
    <div className="crm-page-container">
      <Sidebar />
      <main className="crm-main-content">
        <div className="ll-hero-grid opacity-[0.03] dark:opacity-[0.05]" />
        <div className="ll-orb w-[600px] h-[600px] -top-64 -right-64 bg-primary/20 blur-[120px]" />

        <div className="max-w-7xl mx-auto p-8 space-y-8 relative z-10">
          <header className="animate-in slide-in-from-left duration-700">
            <p className="crm-page-subtitle">Strategic Oversight</p>
            <h1 className="crm-page-title mt-1">Team Intelligence</h1>
            <p className="text-xs font-semibold uppercase tracking-wider opacity-40 mt-2">
              Decision engine and performance telemetry
            </p>
          </header>

          {/* KPI Header Row */}
          <div className="space-y-2">
            <p className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Team Health Overview</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <KPICard 
                title="Inactive Reps (7d)" 
                value={aggregateStats.inactiveReps} 
                icon={Users} 
                color="red" 
                subtitle="Requires reactivation" 
                delay={0.1}
              />
              <KPICard 
                title="Reps with No Leads" 
                value={aggregateStats.noLeadReps} 
                icon={TrendingUp} 
                color="amber" 
                subtitle="Needs lead assignment" 
                delay={0.2}
              />
              <KPICard 
                title="Leads per Rep" 
                value={aggregateStats.leadsPerRep} 
                icon={CheckCircle2} 
                color="blue" 
                subtitle="Workload distribution" 
                delay={0.3}
              />
              <KPICard 
                title="At-Risk Leads" 
                value={aggregateStats.atRisk} 
                icon={AlertTriangle} 
                color="rose" 
                subtitle="No activity (7+ days)" 
                delay={0.4}
              />
            </div>
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
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-bold text-foreground">Personnel Efficiency Matrix</h2>
                        <div className="group relative">
                          <Info className="w-4 h-4 text-muted-foreground/40 cursor-help hover:text-primary transition-colors" />
                          <div className="absolute left-0 bottom-full mb-2 w-64 p-3 bg-card border border-border/60 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                            <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-2">Ranking Variables</p>
                            <ul className="space-y-1.5">
                              <li className="text-[11px] text-foreground/80 flex items-center gap-2">
                                <div className="w-1 h-1 rounded-full bg-primary" /> No leads assigned
                              </li>
                              <li className="text-[11px] text-foreground/80 flex items-center gap-2">
                                <div className="w-1 h-1 rounded-full bg-primary" /> No recent activity
                              </li>
                              <li className="text-[11px] text-foreground/80 flex items-center gap-2">
                                <div className="w-1 h-1 rounded-full bg-primary" /> Low conversion performance
                              </li>
                              <li className="text-[11px] text-foreground/80 flex items-center gap-2">
                                <div className="w-1 h-1 rounded-full bg-primary" /> Overdue tasks pending
                              </li>
                            </ul>
                            <p className="text-[9px] font-bold text-muted-foreground mt-3 pt-2 border-t border-border/20">
                              Higher priority = needs immediate manager attention
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-30">Analytical Ledger</p>
                    {summaryLine && (
                      <p className="text-[10px] font-bold text-amber-500/80 uppercase tracking-tight mt-1 animate-in fade-in slide-in-from-right duration-700">
                        {summaryLine}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  {sortedPerformance.length > 0 ? (
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-muted/10 border-b border-border/40">
                          <th className="px-8 py-5 text-[9px] font-black uppercase tracking-widest text-muted-foreground">Representative</th>
                          <th className="px-8 py-5 text-[9px] font-black uppercase tracking-widest text-muted-foreground text-center">Conv %</th>
                          <th className="px-8 py-5 text-[9px] font-black uppercase tracking-widest text-muted-foreground text-center">Volume</th>
                          <th className="px-8 py-5 text-[9px] font-black uppercase tracking-widest text-muted-foreground text-center">Activity Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/20">
                        {sortedPerformance.map((agent: any) => {
                          const priority = agent.priorityRank <= 3;
                          const isCritical = agent.activityStatus.includes('7+ days');
                          const isWarning = agent.activityStatus.includes('3+ days');

                          return (
                            <tr key={agent.id} className="group hover:bg-primary/[0.02] transition-colors">
                              <td className="px-8 py-5">
                                <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold border border-primary/20 shadow-inner group-hover:rotate-6 transition-transform relative">
                                    {agent.name.charAt(0)}
                                    {priority && (
                                       <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 border-2 border-card flex items-center justify-center text-[8px] animate-pulse">🔥</div>
                                    )}
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <p className="font-bold text-foreground">{agent.name}</p>
                                      {priority && (
                                        <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[7px] font-black uppercase tracking-widest">
                                          Needs Attention #{agent.priorityRank}
                                        </span>
                                      )}
                                    </div>
                                    <div className="mt-1 space-y-0.5">
                                      {agent.priorityReasons?.map((reason: string, idx: number) => (
                                        <p key={idx} className="text-[10px] font-bold text-muted-foreground flex items-center gap-1 opacity-60">
                                          <div className={`w-1 h-1 rounded-full ${reason.includes('No workload') ? 'bg-muted-foreground/30' : 'bg-primary/40'}`} />
                                          {reason}
                                        </p>
                                      ))}
                                      {!agent.priorityReasons?.length && agent.insights?.filter((i: string) => i !== 'Never Active').map((insight: string, idx: number) => (
                                        <p key={idx} className="text-[10px] font-bold text-muted-foreground flex items-center gap-1 opacity-60">
                                          <AlertCircle size={8} className="text-primary/40" />
                                          {insight}
                                        </p>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-8 py-5 text-center">
                                <div className="inline-flex flex-col items-center">
                                  <span className="text-sm font-bold font-mono-data text-foreground">{agent.conversionRate}%</span>
                                  {agent.conversionDelta !== null && agent.conversionDelta !== 0 && (
                                    <span className={`text-[9px] font-bold flex items-center gap-0.5 ${
                                      agent.totalLeads < 3 ? 'text-muted-foreground/40' : (agent.conversionDelta > 0 ? 'text-emerald-400' : 'text-rose-400')
                                    }`}>
                                      {agent.conversionDelta > 0 ? <ArrowUp size={8} /> : <ArrowDown size={8} />}
                                      {Math.abs(agent.conversionDelta)}%
                                    </span>
                                  )}
                                  <span className={`text-[8px] font-black uppercase tracking-tighter mt-0.5 ${
                                    agent.totalLeads < 3 ? 'text-muted-foreground/30' : (agent.deltaFromTeam >= 0 ? 'text-emerald-500/50' : 'text-rose-500/50')
                                  }`}>
                                    {agent.deltaFromTeam >= 0 ? '+' : ''}{agent.deltaFromTeam}% vs team
                                  </span>
                                </div>
                              </td>
                              <td className="px-8 py-5 text-center text-sm font-bold font-mono-data text-foreground/60">{agent.totalLeads}</td>
                              <td className={`px-8 py-5 text-center text-[9px] font-black uppercase tracking-widest ${
                                isCritical ? 'text-rose-500' : 
                                isWarning ? 'text-amber-500' : 
                                (agent.activityStatus.includes('No tasks') || agent.activityStatus.includes('Awaiting')) ? 'text-muted-foreground/40' : 
                                'text-emerald-500'
                              }`}>
                                <div className="flex items-center justify-center gap-1.5">
                                  <span>{agent.activityStatus}</span>
                                  {agent.lastActivity && (
                                    <>
                                      <span className="opacity-20">•</span>
                                      <span className="opacity-40 font-mono-data tracking-normal text-[8px] lowercase">
                                        {formatDistanceToNow(new Date(agent.lastActivity), { addSuffix: true })}
                                      </span>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  ) : (
                    <div className="py-20 text-center opacity-30">
                      <Users className="w-12 h-12 mx-auto mb-4 opacity-20" />
                      <p className="text-xs font-semibold uppercase tracking-wider">No sales representatives available</p>
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
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-30 mt-1">Based on current active pipeline</p>
                    </div>
                    {pipeline?.biggestDropOff && (
                      <div className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 animate-in slide-in-from-right duration-500 ${
                        pipeline.biggestDropOff.percentage > 40 
                          ? 'bg-rose-500/5 border-rose-500/20 text-rose-500' 
                          : 'bg-muted/10 border-border/40 text-muted-foreground'
                      }`}>
                         <TrendingDown size={14} />
                         <span className="text-[10px] font-black uppercase tracking-widest">
                            Biggest Drop-Off: {pipeline.biggestDropOff.stage} ({pipeline.biggestDropOff.percentage}%)
                         </span>
                      </div>
                    )}
                 </div>
                 
                 <div className="space-y-6">
                    {totalPipelineLeads > 0 ? pipelineStages.map((stage) => {
                      const count = pipeline?.distribution[stage.key] || 0;
                      const percent = totalPipelineLeads > 0 ? Math.round((count / totalPipelineLeads) * 100) : 0;
                      return (
                        <div key={stage.key} className="space-y-2">
                          <div className="flex justify-between items-end w-full">
                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                              {stage.label}
                            </span>
                            <span className="text-[10px] font-bold text-foreground font-mono-data">
                              {count} ({percent}%)
                            </span>
                          </div>
                          <div className="h-2 w-full bg-muted/30 rounded-full overflow-hidden border border-border/40">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${(count / maxStageCount) * 100}%` }}
                              transition={{ duration: 1, ease: 'easeOut' as const, delay: 0.2 }}
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
              {/* Recent Activity Panel */}
              <div className="crm-card shadow-xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-500/10">
                    <Zap className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-foreground leading-none">Recent Activity</h2>
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-30 mt-1.5">Latest interactions across your team</p>
                  </div>
                </div>
                
                <div className="space-y-6 relative before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-px before:bg-border/40">
                  {activity && activity.length > 0 ? activity.map((act: any, i: number) => (
                    <div key={act.id} className="relative flex items-start gap-4 animate-in fade-in slide-in-from-right duration-500" style={{ animationDelay: `${i * 100}ms` }}>
                      <div className="w-10 h-10 rounded-xl bg-card border border-border/40 flex items-center justify-center relative z-10 shrink-0 shadow-sm">
                        <Activity className="w-4 h-4 text-primary/60" />
                      </div>
                      <div className="min-w-0 pt-0.5">
                        <p className="text-xs font-bold text-foreground leading-snug">
                          {act.performedBy?.name} <span className="text-muted-foreground/60 font-normal">logged</span> {act.type}
                        </p>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-primary mt-0.5">
                          with <span className="text-foreground/60">{act.lead?.company || 'Lead Signature'}</span>
                        </p>
                        <p className="text-[9px] font-bold text-muted-foreground/30 uppercase tracking-widest mt-1.5 flex items-center gap-2">
                           <Clock size={10} />
                           {formatDistanceToNow(new Date(act.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  )) : (
                    <div className="py-16 text-center opacity-40">
                      <p className="text-[10px] font-black uppercase tracking-widest">
                        Start tracking activity by completing tasks
                      </p>
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
                           <span className="font-mono-data text-sm mr-1">{risk?.inactiveLeadsCount || 0}</span> Cold Leads (&gt;7d)
                        </p>
                     </div>
                  </div>
                </div>
              </div>

              {/* Suggested Actions Module */}
              <div className="crm-card shadow-xl border-primary/10">
                 <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                      <Target className="w-5 h-5" />
                    </div>
                    <h2 className="text-lg font-bold text-foreground">Suggested Actions</h2>
                 </div>
                 <div className="space-y-4">
                    {risk?.suggestions?.length > 0 ? (
                      <ul className="space-y-3">
                        {risk.suggestions.map((suggestion: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-3 text-sm text-muted-foreground leading-relaxed animate-in slide-in-from-left duration-300" style={{ animationDelay: `${idx * 100}ms` }}>
                            <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary/30 shrink-0" />
                            <span className="flex-1">
                              {suggestion
                                .replace(' — consider assigning new leads', ' — assign leads')
                                .replace(' inactive for 7+ days — needs attention', ' inactive (7+ days)')
                                .replace('High drop-off at ', 'High drop-off: ')
                                .replace(' need attention', '')}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="py-6 text-center bg-muted/5 rounded-2xl border border-dashed border-border/40">
                         <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                           All systems operating normally
                         </p>
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
