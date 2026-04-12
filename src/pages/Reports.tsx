import { useState, useEffect } from 'react';
import { Sidebar } from '../components/Sidebar';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { TrendingUp, Users, Target, Activity, Calendar, ArrowUpRight, DollarSign } from 'lucide-react';
import api from '../utils/api';
import { ReportsSkeleton } from '@/components/ui/skeleton';

export default function Reports() {
  const [filter, setFilter] = useState<'today' | 'week' | 'month'>('month');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchReportsData = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/dashboard/reports?filter=${filter}`);
      setData(res.data);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportsData();
  }, [filter]);

  const tooltipStyle = {
    contentStyle: { background: '#1A2332', border: '1px solid rgba(148,163,184,0.1)', borderRadius: '12px', color: '#F1F5F9' },
    labelStyle: { color: '#64748B' },
  };

  const funnelData = data ? [
    { name: 'New', value: data.leadFlow.new, color: '#00D4AA' },
    { name: 'Contacted', value: data.leadFlow.contacted, color: '#FBBF24' },
    { name: 'Interested', value: data.leadFlow.interested, color: '#C084FC' },
    { name: 'Converted', value: data.leadFlow.converted, color: '#4ADE80' },
  ] : [];

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-background text-foreground" style={{ background: '#0B1120' }}>
      <Sidebar />

      <main className="flex-1 min-w-0 overflow-auto crm-page-container">
        <div className="max-w-7xl mx-auto space-y-8 p-8">
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div>
              <h1 className="text-3xl font-bold uppercase tracking-tight" style={{ color: '#F1F5F9', fontFamily: 'Outfit, sans-serif' }}>Execution Analytics</h1>
              <p className="crm-page-subtitle mt-1" style={{ color: '#64748B' }}>Deep dive into team productivity and revenue pipeline</p>
            </div>
            
            <div className="flex p-1 rounded-xl bg-[#1A2332] border border-white/5">
              {(['today', 'week', 'month'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${filter === f ? 'bg-[#00D4AA] text-[#0B1120]' : 'text-[#64748B] hover:text-[#F1F5F9]'}`}
                >
                  {f === 'week' ? 'Last 7 Days' : f === 'month' ? 'Last 30 Days' : 'Today'}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <ReportsSkeleton />
          ) : data && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
              
              {/* Revenue Highlights */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="crm-card relative overflow-hidden group" style={{ background: '#1A2332', border: '1px solid rgba(148,163,184,0.08)' }}>
                  <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
                     <DollarSign className="w-24 h-24 text-green-400" />
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#64748B] mb-2">Actual Revenue (Converted)</p>
                  <p className="text-4xl font-bold text-green-400 tracking-tight">₹{data.revenue.actualRevenue.toLocaleString('en-IN')}</p>
                  <div className="mt-6 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-green-400/60 bg-green-400/5 w-fit px-3 py-1 rounded-full border border-green-400/10">
                     <ArrowUpRight className="w-3 h-3" />
                     Billed Contracts
                  </div>
                </div>

                <div className="crm-card relative overflow-hidden group" style={{ background: '#1A2332', border: '1px solid rgba(148,163,184,0.08)' }}>
                  <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
                     <Target className="w-24 h-24 text-purple-400" />
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#64748B] mb-2">Estimated Pipeline (Interested Leads)</p>
                  <p className="text-4xl font-bold text-purple-400 tracking-tight">₹{data.revenue.pipelineValue.toLocaleString('en-IN')}</p>
                  <div className="mt-6 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-purple-400/60 bg-purple-400/5 w-fit px-3 py-1 rounded-full border border-purple-400/10">
                     <Activity className="w-3 h-3" />
                     Weighted Opportunities
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* Task Trends */}
                <div className="crm-card" style={{ background: '#1A2332', border: '1px solid rgba(148,163,184,0.08)' }}>
                  <h2 className="text-lg font-bold text-[#F1F5F9] mb-8 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-[#00D4AA]" />
                    Task Execution Trends
                  </h2>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={[
                        { name: 'Created', count: data.taskTrends.created, fill: '#60A5FA' },
                        { name: 'Completed', count: data.taskTrends.completed, fill: '#00D4AA' }
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis dataKey="name" stroke="#64748B" fontSize={10} fontWeight="bold" axisLine={false} tickLine={false} dy={10} />
                        <YAxis stroke="#64748B" fontSize={10} fontWeight="bold" axisLine={false} tickLine={false} />
                        <Tooltip {...tooltipStyle} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                        <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={60} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Lead Funnel */}
                <div className="crm-card" style={{ background: '#1A2332', border: '1px solid rgba(148,163,184,0.08)' }}>
                  <h2 className="text-lg font-bold text-[#F1F5F9] mb-8 flex items-center gap-2">
                    <Target className="w-5 h-5 text-amber-400" />
                    Lead Flow Distribution
                  </h2>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={funnelData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={8}
                          dataKey="value"
                        >
                          {funnelData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip {...tooltipStyle} />
                        <Legend verticalAlign="bottom" height={36} formatter={(value) => <span className="text-[10px] uppercase font-bold tracking-widest text-[#64748B]">{value}</span>} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Sales Performance Comparison Table */}
              <div className="crm-card !p-0 overflow-hidden" style={{ background: '#1A2332', border: '1px solid rgba(148,163,184,0.08)' }}>
                <div className="p-6 border-b border-white/5">
                   <h2 className="text-lg font-bold text-[#F1F5F9]">Team Productivity Comparison</h2>
                </div>
                <div className="overflow-x-auto">
                   <table className="w-full text-left border-collapse">
                      <thead>
                         <tr className="bg-[#0B1120]/50">
                            <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-[#64748B]">Sales Executive</th>
                            <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-[#64748B]">Interactions</th>
                            <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-[#64748B]">Tasks Finished</th>
                            <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-[#64748B]">Overdue</th>
                            <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-[#64748B]">Conv. Rate</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                         {data.salesComparison.map((row: any) => (
                            <tr key={row.name} className="hover:bg-white/[0.02] transition-colors">
                               <td className="p-6">
                                  <div className="flex items-center gap-3">
                                     <div className="w-8 h-8 rounded-lg bg-[#00D4AA]/10 flex items-center justify-center text-[#00D4AA] font-bold text-xs">
                                        {row.name.charAt(0)}
                                     </div>
                                     <span className="font-bold text-[#F1F5F9]">{row.name}</span>
                                  </div>
                               </td>
                               <td className="p-6 font-bold text-[#F1F5F9]">{row.interactions}</td>
                               <td className="p-6 font-bold text-green-400">{row.tasksCompleted}</td>
                               <td className="p-6 font-bold text-red-400">{row.overdue}</td>
                               <td className="p-6">
                                  <div className="flex items-center gap-2">
                                     <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden w-24">
                                        <div className="h-full bg-purple-500" style={{ width: `${row.conversionRate}%` }} />
                                     </div>
                                     <span className="text-[10px] font-bold text-purple-400">{Math.round(row.conversionRate)}%</span>
                                  </div>
                               </td>
                            </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
