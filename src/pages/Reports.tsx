import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Sidebar } from '../components/Sidebar';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { TrendingUp, Users, Target, Activity, Calendar, ArrowUpRight, DollarSign, Zap, PieChart as PieIcon, BarChart3, ShieldAlert } from 'lucide-react';
import { getReportsData } from '../api/reports';
import { ReportsSkeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';

export default function Reports() {
  const [filter, setFilter] = useState<'today' | 'week' | 'month'>('month');

  const { data, isLoading } = useQuery({
    queryKey: ['reports', filter],
    queryFn: () => getReportsData(filter),
    staleTime: 30000,
  });

  const tooltipStyle = useMemo(() => ({
    contentStyle: { 
      background: 'rgba(15, 23, 42, 0.9)', 
      backdropFilter: 'blur(16px)',
      border: '1px solid rgba(255, 255, 255, 0.1)', 
      borderRadius: '16px', 
      color: '#F1F5F9',
      boxShadow: '0 10px 40px -10px rgba(0,0,0,0.5)',
      padding: '12px 16px'
    },
    itemStyle: { fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.1em' },
    labelStyle: { color: 'var(--primary)', fontWeight: '900', fontSize: '11px', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.15em' },
  }), []);

  const funnelData = useMemo(() => data ? [
    { name: 'NEW VECTOR', value: data.leadFlow.new, color: '#60A5FA' },
    { name: 'ACTIVE CONTACT', value: data.leadFlow.contacted, color: '#FBBF24' },
    { name: 'QUALIFIED', value: data.leadFlow.interested, color: '#C084FC' },
    { name: 'CONVERTED', value: data.leadFlow.converted, color: 'var(--primary)' },
  ] : [], [data]);

  return (
    <div className="crm-page-container">
      <Sidebar />

      <main className="crm-main-content">
        {/* ── Background Effects ── */}
        <div className="ll-hero-grid opacity-[0.02] dark:opacity-[0.05]" />
        <div className="ll-orb w-[600px] h-[600px] -top-64 -right-32 bg-primary/5 blur-[120px]" />
        <div className="ll-orb w-[500px] h-[500px] bottom-0 -left-64 bg-teal-500/5 blur-[100px]" />

        <div className="relative z-10 h-full overflow-y-auto custom-scrollbar p-10">
          <div className="max-w-7xl mx-auto space-y-10">
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-10">
              <div className="animate-in slide-in-from-left duration-700">
                <h1 className="crm-page-title">Executive Telemetry</h1>
                <p className="crm-page-subtitle mt-2">Deep-field analysis of operational productivity and conversion vectors</p>
              </div>
              
              <div className="flex p-1.5 rounded-2xl bg-muted/20 border border-border/40 backdrop-blur-md animate-in slide-in-from-right duration-700">
                {(['today', 'week', 'month'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-6 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all ${filter === f ? 'bg-card text-primary shadow-[0_4px_20px_-4px_rgba(0,0,0,0.15)] ring-1 ring-border/40' : 'text-muted-foreground/60 hover:text-foreground'}`}
                  >
                    {f === 'week' ? 'Last 7 Periods' : f === 'month' ? 'Current Cycle' : 'Real-time'}
                  </button>
                ))}
              </div>
            </div>

            {isLoading ? (
              <ReportsSkeleton />
            ) : data && (
              <div className="space-y-10">
                
                {/* ── Metric Highlights ── */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="crm-card relative overflow-hidden group border-primary/10"
                  >
                    <div className="absolute -top-10 -right-10 opacity-[0.03] group-hover:scale-110 transition-transform duration-700">
                       <DollarSign size={200} className="text-primary" />
                    </div>
                    <div className="relative z-10">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60 mb-3">Total Revenue</p>
                      <p className="text-5xl font-semibold tracking-tighter text-status-success">₹{data.revenue.actualRevenue.toLocaleString('en-IN')}</p>
                      <div className="mt-8 flex items-center gap-3">
                        <div className="px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider bg-status-success/10 text-status-success border border-status-success/20 flex items-center gap-2">
                           <Zap size={10} fill="currentColor" />
                           Billed Contracts
                        </div>
                        <p className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground/30">Closed Deals</p>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div 
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className="crm-card relative overflow-hidden group border-purple-500/10"
                  >
                    <div className="absolute -top-10 -right-10 opacity-[0.03] group-hover:scale-110 transition-transform duration-700">
                       <Target size={200} className="text-purple-400" />
                    </div>
                    <div className="relative z-10">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60 mb-3">Pipeline Value</p>
                      <p className="text-5xl font-semibold tracking-tighter text-purple-400">₹{data.revenue.pipelineValue.toLocaleString('en-IN')}</p>
                      <div className="mt-8 flex items-center gap-3">
                        <div className="px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider bg-purple-400/10 text-purple-400 border border-purple-400/20 flex items-center gap-2">
                           <Activity size={10} />
                           High Sensitivity
                        </div>
                        <p className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground/30">Open Opportunities</p>
                      </div>
                    </div>
                  </motion.div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                  
                  {/* ── Task Analytics ── */}
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="crm-card bg-card/40 backdrop-blur-xl"
                  >
                    <div className="flex items-center justify-between mb-10">
                      <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground flex items-center gap-3">
                        <BarChart3 size={16} className="text-primary" />
                        Task Execution Flow
                      </h2>
                      <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center">
                        <Activity size={12} className="text-primary animate-pulse" />
                      </div>
                    </div>
                    <div className="h-[340px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={[
                          { name: 'INITIATED', count: data.taskTrends.created, fill: '#60A5FA' },
                          { name: 'RESOLVED', count: data.taskTrends.completed, fill: 'var(--primary)' }
                        ]}>
                          <CartesianGrid strokeDasharray="10 10" stroke="rgba(255,255,255,0.02)" vertical={false} />
                          <XAxis 
                            dataKey="name" 
                            stroke="rgba(148,163,184,0.3)" 
                            fontSize={9} 
                            fontWeight="900" 
                            axisLine={false} 
                            tickLine={false} 
                            dy={15} 
                            letterSpacing="0.15em"
                          />
                          <YAxis 
                            stroke="rgba(148,163,184,0.3)" 
                            fontSize={9} 
                            fontWeight="900" 
                            axisLine={false} 
                            tickLine={false} 
                          />
                          <Tooltip 
                            {...tooltipStyle as any} 
                            cursor={{ fill: 'rgba(255,255,255,0.02)' }} 
                          />
                          <Bar 
                            dataKey="count" 
                            radius={[8, 8, 8, 8]} 
                            barSize={70} 
                            animationDuration={1500}
                          >
                             { [0, 1].map((entry, index) => (
                               <Cell key={`cell-${index}`} fill={index === 0 ? '#60A5FA' : 'var(--primary)'} fillOpacity={0.8} />
                             ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </motion.div>

                  {/* ── Lead Funnel ── */}
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="crm-card bg-card/40 backdrop-blur-xl"
                  >
                    <div className="flex items-center justify-between mb-10">
                      <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground flex items-center gap-3">
                        <PieIcon size={16} className="text-status-warning" />
                        Conversion Segment
                      </h2>
                      <div className="px-3 py-1 rounded-full bg-status-warning/5 border border-status-warning/10 text-[8px] font-semibold text-status-warning uppercase tracking-widest">
                        Network Map
                      </div>
                    </div>
                    <div className="h-[340px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={funnelData}
                            cx="50%"
                            cy="50%"
                            innerRadius={70}
                            outerRadius={110}
                            paddingAngle={10}
                            dataKey="value"
                            stroke="none"
                          >
                            {funnelData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.8} />
                            ))}
                          </Pie>
                          <Tooltip {...tooltipStyle as any} />
                          <Legend 
                            verticalAlign="bottom" 
                            height={40} 
                            iconType="circle"
                            formatter={(value) => <span className="text-xs uppercase font-semibold tracking-wider text-muted-foreground/60 ml-2">{value}</span>} 
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </motion.div>
                </div>

                {/* ── Team Performance Comparison ── */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="crm-card !p-0 overflow-hidden bg-card/20 backdrop-blur-3xl"
                >
                  <div className="p-8 border-b border-border/40 flex items-center justify-between">
                     <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground">Unit Productivity Matrix</h2>
                     <div className="flex items-center gap-2 text-[9px] font-semibold uppercase tracking-widest text-muted-foreground/40">
                        <Activity size={10} />
                        Live Synchronized
                     </div>
                  </div>
                  <div className="overflow-x-auto">
                     <table className="w-full text-left border-collapse">
                        <thead>
                           <tr className="bg-muted/10">
                              <th className="px-10 py-6 text-xs font-semibold uppercase tracking-wider text-muted-foreground/30">Executive ID</th>
                              <th className="px-10 py-6 text-xs font-semibold uppercase tracking-wider text-muted-foreground/30 text-center">Interactions</th>
                              <th className="px-10 py-6 text-xs font-semibold uppercase tracking-wider text-muted-foreground/30 text-center">Resolved Tasks</th>
                              <th className="px-10 py-6 text-xs font-semibold uppercase tracking-wider text-muted-foreground/30 text-center">Delta Delay</th>
                              <th className="px-10 py-6 text-xs font-semibold uppercase tracking-wider text-muted-foreground/30">Conversion Vector</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-border/20">
                           {data.salesComparison.map((row: any, index: number) => (
                              <tr key={row.id ?? `${row.name}-${index}`} className="group hover:bg-primary/[0.02] transition-colors">
                                 <td className="px-10 py-8">
                                    <div className="flex items-center gap-5">
                                       <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-semibold text-[10px] shadow-inner group-hover:scale-110 transition-transform">
                                          {row.name.charAt(0)}
                                       </div>
                                       <span className="text-sm font-semibold tracking-tight text-foreground/80">{row.name.toUpperCase()}</span>
                                    </div>
                                 </td>
                                 <td className="px-10 py-8 text-center text-sm font-semibold tabular-nums text-foreground/40">{row.interactions}</td>
                                 <td className="px-10 py-8 text-center">
                                    <span className="text-sm font-semibold text-status-success tabular-nums">{row.tasksCompleted}</span>
                                 </td>
                                 <td className="px-10 py-8 text-center text-sm font-semibold tabular-nums text-status-danger">{row.overdue}</td>
                                 <td className="px-10 py-8">
                                    <div className="flex items-center gap-5">
                                       <div className="flex-1 h-2 rounded-full bg-muted/10 overflow-hidden w-28 relative border border-border/10">
                                          <div 
                                            className="absolute inset-y-0 left-0 bg-primary/60 transition-all duration-1000" 
                                            style={{ width: `${row.conversionRate}%` }} 
                                          />
                                          <div className="absolute inset-x-0 bottom-0 top-1/2 bg-white/5" />
                                       </div>
                                       <span className="text-[10px] font-semibold text-primary w-10 tabular-nums">{Math.round(row.conversionRate)}%</span>
                                    </div>
                                 </td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>
                  {data.salesComparison.length === 0 && (
                     <div className="p-20 text-center space-y-5">
                        <ShieldAlert size={32} className="mx-auto text-muted-foreground/10" />
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/20">Telemetry data insufficient for matrix generation</p>
                     </div>
                  )}
                </motion.div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
