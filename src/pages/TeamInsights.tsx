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
  getTeamPipeline,
  getTeamPerformance,
  getDashboardSummary
} from '../api/dashboard';
import { motion, AnimatePresence } from 'framer-motion';
import { InteractiveCard } from '../components/ui/InteractiveCard';
import { GlobalLoader } from '../components/GlobalLoader';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';

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
      className="crm-card ll-moving-edge !p-5 crm-card-hover group"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 shadow-inner" style={{ background: colors.iconBg }}>
          <Icon className="w-5 h-5" style={{ color: colors.iconColor }} />
        </div>
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 leading-none">{title}</p>
        <div className="flex items-baseline gap-2 mt-2">
          <h3 className="text-2xl font-bold font-mono-data tracking-tight text-foreground">
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

const EfficiencyMatrixRow = ({ rep, isFirst }: { rep: any; isFirst: boolean }) => {
  const getAvatarColor = (name: string) => {
    const colors = ['bg-emerald-500/20 text-emerald-400', 'bg-blue-500/20 text-blue-400', 'bg-indigo-500/20 text-indigo-400', 'bg-purple-500/20 text-purple-400'];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  return (
    <tr className="group hover:bg-primary/[0.02] transition-colors">
      <td className="px-8 py-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-bold shadow-inner ${getAvatarColor(String(rep.name || '?'))}`}>
              {(String(rep.name || '?').trim()[0] || '?').toUpperCase()}
            </div>
            {rep.priorityRank <= 3 && (
              <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 border-2 border-[#0B0F1A] flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              </div>
            )}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-foreground tracking-tight">{rep.name}</span>
              {rep.priorityRank <= 3 && (
                <span className="px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-500 text-[8px] font-black uppercase tracking-widest border border-amber-500/20">
                  Needs Attention #{rep.priorityRank}
                </span>
              )}
            </div>
            <div className="space-y-0.5">
              {rep.priorityReasons?.map((reason: string, idx: number) => (
                <p key={idx} className="text-[10px] font-medium text-muted-foreground/60 flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-primary/20" />
                  {reason}
                </p>
              ))}
            </div>
          </div>
        </div>
      </td>
      <td className="px-8 py-6 text-center">
        <div className="space-y-1">
          <p className="text-base font-bold font-mono-data text-foreground">{rep.conversionRate}%</p>
          <p className={`text-[9px] font-black uppercase tracking-widest ${rep.deltaFromTeam >= 0 ? 'text-emerald-500/80' : 'text-rose-500/80'}`}>
            {rep.deltaFromTeam >= 0 ? '+' : ''}{rep.deltaFromTeam}% vs Team
          </p>
        </div>
      </td>
      <td className="px-8 py-6 text-center">
        <p className="text-base font-bold font-mono-data text-foreground">{rep.totalLeads}</p>
      </td>
      <td className="px-8 py-6 text-right">
        <div className="flex flex-col items-end gap-1.5">
          <div className="flex items-center gap-2">
            <span className={`h-1.5 w-1.5 rounded-full ${rep.activityStatus === 'Active' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-muted-foreground/30'}`} />
            <span className={`text-[10px] font-black uppercase tracking-widest ${rep.activityStatus === 'Active' ? 'text-emerald-500' : 'text-muted-foreground/60'}`}>
              {rep.activityStatus}
            </span>
          </div>
          {rep.lastActivity && (
            <p className="text-[10px] font-bold text-muted-foreground/40 italic">
              · {formatDistanceToNow(new Date(rep.lastActivity), { addSuffix: true })}
            </p>
          )}
        </div>
      </td>
    </tr>
  );
};

const RepsMatrix = ({ reps, isFlat = false, isAdmin = false }: { reps: any[], isFlat?: boolean, isAdmin?: boolean }) => {
  if (!reps?.length) {
    return (
      <div className={`p-12 text-center bg-muted/5 rounded-b-2xl ${isFlat ? 'border border-dashed border-border/40 rounded-2xl' : 'border-t border-border/40'}`}>
        <Users className="w-10 h-10 mx-auto mb-4 opacity-10" />
        <p className="text-xs font-semibold uppercase tracking-wider opacity-40">No team data available</p>
      </div>
    );
  }

  // Admin view uses the simplified table
  if (isAdmin) {
    return (
      <div className="overflow-x-auto border-t border-border/40 bg-card/30">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-muted/5 border-b border-border/40">
                <th className="px-8 py-4 text-[9px] font-black uppercase tracking-widest text-muted-foreground">Team Member</th>
                <th className="px-8 py-4 text-[9px] font-black uppercase tracking-widest text-muted-foreground text-center">Pending</th>
                <th className="px-8 py-4 text-[9px] font-black uppercase tracking-widest text-muted-foreground text-center">Completed</th>
                <th className="px-8 py-4 text-[9px] font-black uppercase tracking-widest text-muted-foreground text-center">Overdue</th>
                <th className="px-8 py-4 text-[9px] font-black uppercase tracking-widest text-muted-foreground text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {reps.map((rep) => (
                <tr key={rep.repId || rep.id} className="group hover:bg-primary/[0.02] transition-colors">
                  <td className="px-8 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                        {(String(rep.repName || rep.name || '?').trim()[0] || '?').toUpperCase()}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-bold text-foreground truncate">{rep.repName || rep.name}</span>
                        {rep.repEmail ? (
                          <span className="text-[10px] font-semibold text-muted-foreground/55 truncate mt-0.5">{rep.repEmail}</span>
                        ) : null}
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-4 text-center font-mono-data text-sm">{rep.pending}</td>
                  <td className="px-8 py-4 text-center font-mono-data text-sm text-emerald-500/80">{rep.completed}</td>
                  <td className="px-8 py-4 text-center font-mono-data text-sm text-rose-500/80">{rep.overdue}</td>
                  <td className="px-8 py-4 text-center">
                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${
                      rep.isInactive ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-500'
                    }`}>
                      {rep.isInactive ? 'Inactive' : 'Active'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
      </div>
    );
  }

  // Manager High-Fidelity Matrix
  return (
    <div className="crm-card ll-moving-edge !p-0 border-border/40 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-500">
      <div className="p-8 border-b border-border/40 bg-muted/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
           <div className="w-12 h-12 rounded-2xl bg-teal-500/10 flex items-center justify-center text-teal-400">
             <Target className="w-6 h-6" />
           </div>
           <div>
             <h2 className="text-xl font-bold text-foreground tracking-tight flex items-center gap-3">
               Personnel Efficiency Matrix
               <Info className="w-4 h-4 text-muted-foreground/30 cursor-help hover:text-primary transition-colors" />
             </h2>
             <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.2em] mt-1">Analytical Ledger</p>
           </div>
        </div>

        {reps.filter(r => r.priorityRank <= 3).length > 0 && (
          <div className="px-4 py-2 rounded-xl bg-amber-500/5 border border-amber-500/20 flex items-center gap-3 animate-pulse">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <p className="text-[10px] font-black uppercase tracking-widest text-amber-500">
              {reps.filter(r => r.priorityRank <= 3).length} Reps Need Attention — 
              <span className="ml-1 opacity-70">Most Critical: {reps[0].name} ({reps[0].priorityReasons?.[0] || 'High Risk'})</span>
            </p>
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-muted/5 border-b border-border/40">
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Representative</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 text-center">Conv %</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 text-center">Volume</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 text-right">Activity Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/20">
            {reps.map((rep, idx) => (
              <EfficiencyMatrixRow key={rep.id} rep={rep} isFirst={idx === 0} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const ManagerCard = ({ manager, isExpanded, onToggle }: any) => {
  return (
    <InteractiveCard 
      isActive={isExpanded}
      isStatic={true}
      onClick={onToggle}
      className={`crm-card ll-moving-edge !p-0 overflow-hidden mb-4 border-border/40 transition-all ${isExpanded ? 'bg-primary/5' : ''}`}
    >
      <div className="p-6 flex flex-col lg:flex-row items-center justify-between group">
        <div className="flex items-center gap-5">
           <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 ${isExpanded ? 'bg-primary text-white rotate-0 shadow-[0_0_15px_rgba(var(--primary),0.3)]' : 'bg-primary/10 text-primary rotate-3 group-hover:rotate-0'}`}>
              <Users2 className="w-6 h-6" />
           </div>
           <div>
              <h3 className="text-lg font-bold text-foreground tracking-tight">{manager.managerName}</h3>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mt-1 flex items-center gap-2">
                <List className="w-3 h-3" />
                {manager.repsCount} Team Members
              </p>
           </div>
        </div>

        <div className="grid grid-cols-2 lg:flex items-center gap-12 mt-6 lg:mt-0">
           <div className="text-center">
              <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">Total Tasks</p>
              <p className="text-lg font-bold font-mono-data leading-none">{manager.totalTasks}</p>
           </div>
           <div className="text-center">
              <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">Overdue</p>
              <p className={`text-lg font-bold font-mono-data leading-none ${manager.overdueCount > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                {manager.overdueCount}
              </p>
           </div>
           <div className="hidden lg:block">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-transform duration-500 ${isExpanded ? 'rotate-90 bg-primary/10 text-primary' : 'bg-muted/10 text-muted-foreground opacity-40 group-hover:opacity-100'}`}>
                <ChevronRight className="w-5 h-5" />
              </div>
           </div>
        </div>
      </div>
      
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            <RepsMatrix reps={manager.reps} isAdmin={true} />
          </motion.div>
        )}
      </AnimatePresence>
    </InteractiveCard>
  );
};

export default function TeamInsights() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const [expandedManagerId, setExpandedManagerId] = React.useState<string | null>(null);

  const { data: dashboard, isLoading: dashboardLoading } = useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: getDashboardSummary
  });

  const { data: pipeline, isLoading: pipeLoading } = useQuery({
    queryKey: ['team-insights', 'pipeline'],
    queryFn: getTeamPipeline
  });

  const { data: performance, isLoading: perfLoading } = useQuery({
    queryKey: ['team-insights', 'performance'],
    queryFn: getTeamPerformance,
    enabled: !isAdmin // Only need this detailed data for Manager view
  });

  const teamPerformance = useMemo(() => {
    if (isAdmin) return dashboard?.teamPerformance || [];
    return performance?.performance || [];
  }, [dashboard, performance, isAdmin]);

  const aggregateStats = useMemo(() => {
    const metrics = dashboard?.keyMetrics || {};
    const performanceMetrics = performance?.metrics || {};

    if (isAdmin) {
      return {
        card1: { title: "Managers with Inactive Teams", value: metrics.managersWithInactiveTeams || 0, icon: Users, color: "red", subtitle: "High priority oversight" },
        card2: { title: "Managers with Unassigned Teams", value: metrics.managersWithNoLeads || 0, icon: TrendingUp, color: "amber", subtitle: "Pipeline bottleneck" },
        card3: { title: "Cumulative Lead Volume", value: teamPerformance.reduce((acc: number, curr: any) => acc + (curr.totalLeads || 0), 0), icon: CheckCircle2, color: "blue", subtitle: "Organization footprint" },
        card4: { title: "Total Overdue Escalations", value: teamPerformance.reduce((acc: number, curr: any) => acc + (curr.overdueCount || 0), 0), icon: AlertTriangle, color: "rose", subtitle: "Critical risk items" }
      };
    } else {
      return {
        card1: { title: "Inactive Reps (7D)", value: performanceMetrics.totalInactive || 0, icon: Users, color: "rose", subtitle: "Requires reactivation" },
        card2: { title: "Reps with No Leads", value: performanceMetrics.totalNoLeads || 0, icon: TrendingUp, color: "amber", subtitle: "Needs lead assignment" },
        card3: { title: "Leads per Rep", value: performanceMetrics.leadsPerRep || 0, icon: CheckCircle2, color: "blue", subtitle: "Workload distribution" },
        card4: { title: "At-Risk Leads", value: dashboard?.atRiskCustomers?.value || 0, icon: AlertCircle, color: "rose", subtitle: "No activity (7+ days)" }
      };
    }
  }, [dashboard, performance, teamPerformance, isAdmin]);

  const toggleManager = (id: string) => {
    setExpandedManagerId(prev => prev === id ? null : id);
  };

  const commandMatrixSection = (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1 mb-2">
        <h2 className="text-sm font-black uppercase tracking-widest opacity-40">
          {isAdmin ? 'Command Hierarchy' : 'Personnel Efficiency Matrix'}
        </h2>
        <p className="text-[10px] font-bold text-primary/60">
          {isAdmin ? 'Select a manager to audit team metrics' : 'Live performance tracking for your sales force'}
        </p>
      </div>
      {isAdmin ? (
        teamPerformance.length > 0 ? (
          teamPerformance.map((manager: any) => (
            <ManagerCard
              key={String(manager.managerId)}
              manager={manager}
              isExpanded={expandedManagerId === String(manager.managerId)}
              onToggle={() => toggleManager(String(manager.managerId))}
            />
          ))
        ) : (
          <div className="crm-card ll-moving-edge !p-20 text-center opacity-30 border-dashed">
            <span className="text-xs font-semibold uppercase tracking-wider">No team data available for oversight</span>
          </div>
        )
      ) : (
        <RepsMatrix reps={teamPerformance} isFlat={true} isAdmin={false} />
      )}
    </div>
  );

  if (dashboardLoading || pipeLoading || (!isAdmin && perfLoading)) {
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

  const dist = pipeline?.distribution || {};
  const totalPipelineLeads = Object.values(dist).reduce((acc: number, curr: any) => acc + (curr as number), 0);
  const maxStageCount = Math.max(...Object.values(dist).map((v: any) => v as number), 1);

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
              <KPICard {...aggregateStats.card1} delay={0.1} />
              <KPICard {...aggregateStats.card2} delay={0.2} />
              <KPICard {...aggregateStats.card3} delay={0.3} />
              <KPICard {...aggregateStats.card4} delay={0.4} />
            </div>
          </div>

          <div className="space-y-8">
            {isAdmin ? commandMatrixSection : null}

            {/* Diagnostic Row - Chart and Risks (managers: shown above matrix) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Pipeline Distribution Chart */}
              <div className="lg:col-span-2 crm-card ll-moving-edge shadow-xl">
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
                            Biggest Drop-Off: {pipeline?.biggestDropOff?.stage} ({pipeline?.biggestDropOff?.percentage}%)
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

              {/* Strategic Diagnosis Column */}
              <div className="space-y-8">
                {/* Risk Panel */}
                <div className="crm-card ll-moving-edge bg-rose-500/5 border-rose-500/10 shadow-lg">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500">
                      <AlertCircle className="w-5 h-5" />
                    </div>
                    <h2 className="text-lg font-bold text-foreground">Risk Watch</h2>
                  </div>
                  
                  <div className="space-y-4">
                    {isAdmin ? (
                      <div className="p-4 rounded-2xl bg-muted/10 border border-border/40 flex items-center gap-4">
                         <div className="w-10 h-10 rounded-xl bg-rose-500/20 flex items-center justify-center text-rose-400">
                            <Clock className="w-5 h-5" />
                         </div>
                         <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-foreground">Managerial Alert Matrix</p>
                            <div className="mt-2 space-y-2">
                               {dashboard?.riskItems?.length > 0 ? dashboard.riskItems.map((risk: any, idx: number) => (
                                 <div key={idx} className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest">
                                    <span className="text-muted-foreground truncate mr-2">{risk.managerName}</span>
                                    <span className="text-rose-500 whitespace-nowrap">{risk.overdueTasks} Overdue</span>
                                 </div>
                               )) : <p className="text-[9px] font-black uppercase tracking-widest text-emerald-500">All Teams on Track</p>}
                            </div>
                         </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                         {dashboard?.alerts?.length > 0 ? dashboard.alerts.map((alert: any, idx: number) => (
                           <div key={idx} className="p-4 rounded-xl border border-rose-500/10 bg-rose-500/5 flex items-center gap-3">
                              <span className="h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0" />
                              <p className="text-xs font-bold text-foreground">{alert.message}</p>
                           </div>
                         )) : (
                           <div className="p-4 rounded-xl border border-dashed border-border/40 text-center">
                              <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">No critical alerts</p>
                           </div>
                         )}
                      </div>
                    )}
                    
                    <div className="p-4 rounded-2xl bg-muted/10 border border-border/40 flex items-center gap-4">
                       <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400">
                          <Zap className="w-5 h-5" />
                       </div>
                       <div>
                          <p className="text-xs font-bold text-foreground">Stagnation Scan</p>
                          <p className="text-[9px] font-black uppercase tracking-widest text-amber-500 mt-1">
                             <span className="font-mono-data text-sm mr-1">
                               {isAdmin ? (dashboard?.keyMetrics?.managersWithInactiveTeams || 0) : (teamPerformance.filter((r: any) => r.isInactive).length)}
                             </span> 
                             {isAdmin ? 'Flagged Teams' : 'Inactive Representatives'}
                          </p>
                       </div>
                    </div>
                  </div>
                </div>

                {/* Suggested Actions Module */}
                <div className="crm-card ll-moving-edge shadow-xl border-primary/10">
                   <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                        <Target className="w-5 h-5" />
                      </div>
                      <h2 className="text-lg font-bold text-foreground">Suggested Actions</h2>
                   </div>
                   <div className="space-y-4">
                      {(isAdmin ? dashboard?.actions : dashboard?.suggestions)?.length > 0 ? (
                        <ul className="space-y-3">
                          {(isAdmin ? dashboard.actions : dashboard.suggestions).map((item: any, idx: number) => (
                            <li key={idx} className="flex items-start gap-3 text-sm text-muted-foreground leading-relaxed animate-in slide-in-from-left duration-300" style={{ animationDelay: `${idx * 100}ms` }}>
                              <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary/30 shrink-0" />
                              <span className="flex-1">
                                {isAdmin ? (
                                  <>
                                    <span className="font-bold text-foreground mr-1">{item.managerName}</span>
                                    → {item.issue}
                                  </>
                                ) : (
                                  <div className="flex items-center gap-2">
                                    <Zap className="w-3.5 h-3.5 text-amber-500/80 shrink-0" />
                                    <span className="text-muted-foreground/80">{item}</span>
                                  </div>
                                )}
                              </span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="py-6 text-center bg-muted/5 rounded-2xl border border-dashed border-border/40">
                           <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                             All teams operating normally
                           </p>
                        </div>
                      )}
                   </div>
                </div>
              </div>
            </div>

            {!isAdmin ? commandMatrixSection : null}
          </div>
        </div>
      </main>
    </div>
  );
}
