import { useState, useEffect } from 'react';
import { Sidebar } from '../components/Sidebar';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { TrendingUp, Users, Target, Activity, Calendar, ArrowUpRight, DollarSign, Zap, PieChart as PieIcon, BarChart3, ShieldAlert, Download } from 'lucide-react';
import { ReportsSkeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
// html2canvas-pro is a maintained fork that understands modern CSS color
// functions (oklab/oklch/color-mix) emitted by Tailwind v4. The original
// `html2canvas` package throws `unsupported color function "oklab"` on this
// theme, so we use the pro fork specifically for PDF export.
import html2canvas from 'html2canvas-pro';
import jsPDF from 'jspdf';
import { useAuth } from '../contexts/AuthContext';
import { getReportsData } from '../api/reports';

export default function Reports() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<'today' | 'week' | 'month'>('month');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const fetchReportsData = async () => {
    try {
      setLoading(true);
      const payload = await getReportsData(filter);
      setData(payload);
    } catch (error) {
      console.error('Error fetching reports:', error);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportsData();
  }, [filter]);

  const handleDownloadPdf = async () => {
    if (user?.role !== 'ADMIN') return;

    try {
      setExporting(true);

      const graphNodes = Array.from(
        document.querySelectorAll('[data-pdf="true"]')
      ) as HTMLElement[];
      if (graphNodes.length === 0) return;

      const pdf = new jsPDF({ orientation: 'p', unit: 'pt', format: 'a4' });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const margin = 28;

      for (let i = 0; i < graphNodes.length; i++) {
        const el = graphNodes[i];

        // html2canvas-pro natively supports oklab/oklch/color-mix, so we
        // don't need to override the live DOM. The onclone hook below only
        // touches the *cloned* document used for capture, keeping the live
        // UI completely untouched.
        const canvas = await html2canvas(el, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#0B1120',
          logging: false,
          onclone: (clonedDoc) => {
            const style = clonedDoc.createElement('style');
            style.setAttribute('data-pdf-safe', 'true');
            style.textContent = `
              [data-pdf="true"] *,
              [data-pdf="true"] *::before,
              [data-pdf="true"] *::after {
                backdrop-filter: none !important;
                -webkit-backdrop-filter: none !important;
                filter: none !important;
                animation: none !important;
                transition: none !important;
              }
            `;
            clonedDoc.head.appendChild(style);
          },
        });

        const imgData = canvas.toDataURL('image/png');

        const maxW = pageW - margin * 2;
        const maxH = pageH - margin * 2;
        const ratio = canvas.width / canvas.height;

        let drawW = maxW;
        let drawH = drawW / ratio;
        if (drawH > maxH) {
          drawH = maxH;
          drawW = drawH * ratio;
        }

        const x = (pageW - drawW) / 2;
        const y = (pageH - drawH) / 2;

        if (i > 0) pdf.addPage();
        pdf.addImage(imgData, 'PNG', x, y, drawW, drawH, undefined, 'FAST');
      }

      const date = new Date().toISOString().slice(0, 10);
      pdf.save(`reports_graphs_${filter}_${date}.pdf`);
    } catch (e) {
      console.error('PDF export failed', e);
    } finally {
      setExporting(false);
    }
  };

  const tooltipStyle = {
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
  };

  const funnelData = data ? [
    { name: 'NEW VECTOR', value: data?.leadFlow?.new ?? 0, color: '#60A5FA' },
    { name: 'ACTIVE CONTACT', value: data?.leadFlow?.contacted ?? 0, color: '#FBBF24' },
    { name: 'QUALIFIED', value: data?.leadFlow?.interested ?? 0, color: '#C084FC' },
    { name: 'CONVERTED', value: data?.leadFlow?.converted ?? 0, color: 'var(--primary)' },
  ] : [];

  const revenueTrend = Array.isArray((data as any)?.revenueTrend) ? (data as any).revenueTrend : null;

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
              
              <div className="flex items-center gap-4 animate-in slide-in-from-right duration-700">
                {user?.role === 'ADMIN' && (
                  <button
                    onClick={handleDownloadPdf}
                    disabled={exporting || loading}
                    className="crm-btn-secondary !px-6 !py-3 flex items-center gap-3"
                  >
                    <Download size={16} />
                    <span className="text-xs font-semibold uppercase tracking-wider">
                      {exporting ? 'Exporting…' : 'Download PDF'}
                    </span>
                  </button>
                )}

                <div className="flex p-1.5 rounded-2xl bg-muted/20 border border-border/40 backdrop-blur-md">
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
            </div>

            {loading ? (
              <ReportsSkeleton />
            ) : data ? (
              <div className="space-y-10">

                {/* ── Revenue Trend (Admin-only; shown when backend provides data) ── */}
                {user?.role === 'ADMIN' && revenueTrend && revenueTrend.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="crm-card bg-card/40 backdrop-blur-xl"
                    data-pdf="true"
                  >
                    <div className="flex items-center justify-between mb-10">
                      <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground flex items-center gap-3">
                        <TrendingUp size={16} className="text-status-success" />
                        Revenue Trend (Weekly)
                      </h2>
                      <div className="px-3 py-1 rounded-full bg-status-success/5 border border-status-success/10 text-[8px] font-semibold text-status-success uppercase tracking-widest">
                        Admin Only
                      </div>
                    </div>
                    <div className="h-[340px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={revenueTrend}>
                          <CartesianGrid strokeDasharray="10 10" stroke="rgba(255,255,255,0.02)" vertical={false} />
                          <XAxis
                            dataKey="week"
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
                          <Tooltip {...tooltipStyle as any} cursor={{ stroke: 'rgba(255,255,255,0.06)' }} />
                          <Line
                            type="monotone"
                            dataKey="revenue"
                            stroke="var(--primary)"
                            strokeWidth={3}
                            dot={false}
                            activeDot={{ r: 5 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </motion.div>
                )}
                
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
                      <p className="text-5xl font-semibold tracking-tighter text-status-success">₹{(data?.revenue?.actualRevenue ?? 0).toLocaleString('en-IN')}</p>
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
                      <p className="text-5xl font-semibold tracking-tighter text-purple-400">₹{(data?.revenue?.pipelineValue ?? 0).toLocaleString('en-IN')}</p>
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
                    data-pdf="true"
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
                          { name: 'INITIATED', count: data?.taskTrends?.created ?? 0, fill: '#60A5FA' },
                          { name: 'RESOLVED', count: data?.taskTrends?.completed ?? 0, fill: 'var(--primary)' }
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
                    data-pdf="true"
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

              </div>
            ) : (
              <div className="crm-card bg-card/40 backdrop-blur-xl border border-white/10 p-10 text-center">
                <p className="text-sm font-bold text-foreground">No report data available</p>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60 mt-2">
                  Try changing the filter or check your connectivity.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
