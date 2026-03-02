import { Sidebar } from '../components/Sidebar';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Users, Target, Clock } from 'lucide-react';

const leadDistributionData = [
  { name: 'New', value: 35, color: '#00D4AA' },
  { name: " " + 'Contacted', value: 28, color: '#FBBF24' },
  { name: 'Proposal', value: 22, color: '#C084FC' },
  { name: 'Converted', value: 15, color: '#4ADE80' },
];

const weeklyActivityData = [
  { day: 'Mon', calls: 12, emails: 24, meetings: 5 },
  { day: 'Tue', calls: 15, emails: 28, meetings: 7 },
  { day: 'Wed', calls: 10, emails: 20, meetings: 4 },
  { day: 'Thu', calls: 18, emails: 32, meetings: 8 },
  { day: 'Fri', calls: 14, emails: 26, meetings: 6 },
  { day: 'Sat', calls: 5, emails: 10, meetings: 2 },
  { day: 'Sun', calls: 3, emails: 8, meetings: 1 },
];

const followUpCompletionData = [
  { month: 'Jan', completed: 85, pending: 15 },
  { month: 'Feb', completed: 78, pending: 22 },
  { month: 'Mar', completed: 92, pending: 8 },
  { month: 'Apr', completed: 88, pending: 12 },
  { month: 'May', completed: 95, pending: 5 },
  { month: 'Jun', completed: 90, pending: 10 },
];

const revenueData = [
  { month: 'Jan', revenue: 45000 },
  { month: 'Feb', revenue: 52000 },
  { month: 'Mar', revenue: 48000 },
  { month: 'Apr', revenue: 61000 },
  { month: 'May', revenue: 58000 },
  { month: 'Jun', revenue: 67000 },
];

const tooltipStyle = {
  contentStyle: { background: 'var(--crm-slate)', border: '1px solid var(--crm-border)', borderRadius: '12px', color: 'var(--crm-white)' },
  labelStyle: { color: 'var(--crm-muted)' },
};

export default function Reports() {
  return (
    <div className="flex" style={{ background: 'var(--crm-navy)' }}>
      <Sidebar />

      <main className="flex-1 overflow-auto" style={{ background: 'var(--crm-navy)' }}>
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold" style={{ color: 'var(--crm-white)', fontFamily: 'Outfit, sans-serif' }}>Reports & Analytics</h1>
            <p className="mt-1" style={{ color: 'var(--crm-muted-dim)' }}>View performance metrics and insights</p>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[
              { icon: Users, label: 'Total Leads', value: '1,247', trend: '+12.5%', iconBg: 'rgba(0,212,170,0.15)', iconColor: '#00D4AA', trendColor: '#4ADE80' },
              { icon: Target, label: 'Conversion Rate', value: '18.5%', trend: '+8.2%', iconBg: 'rgba(74,222,128,0.15)', iconColor: '#4ADE80', trendColor: '#4ADE80' },
              { icon: TrendingUp, label: 'Revenue', value: '₹33.1L', trend: '+15.3%', iconBg: 'rgba(192,132,252,0.15)', iconColor: '#C084FC', trendColor: '#4ADE80' },
              { icon: Clock, label: 'Avg. Response Time', value: '2.4h', trend: '+2.1%', iconBg: 'rgba(245,158,11,0.15)', iconColor: '#FBBF24', trendColor: '#F87171' },
            ].map(({ icon: Icon, label, value, trend, iconBg, iconColor, trendColor }) => (
              <div key={label} className="rounded-xl p-6" style={{ background: 'var(--crm-slate)', border: '1px solid var(--crm-border)' }}>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-lg" style={{ background: iconBg }}>
                    <Icon className="w-6 h-6" style={{ color: iconColor }} />
                  </div>
                  <span className="text-sm font-medium" style={{ color: trendColor }}>{trend}</span>
                </div>
                <p className="text-sm mb-1" style={{ color: 'var(--crm-muted)' }}>{label}</p>
                <p className="text-2xl font-bold" style={{ color: 'var(--crm-white)' }}>{value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 p-3">
            {/* Lead Distribution */}
            <div className="rounded-xl p-3" style={{ background: 'var(--crm-slate)', border: '1px solid var(--crm-border)' }}>
              <h2 className="text-xl font-bold mb-6" style={{ color: 'var(--crm-white)' }}>Lead Distribution by Stage</h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={leadDistributionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {leadDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip {...tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-4 mt-6">
                {leadDistributionData.map((item) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: item.color }}></div>
                    <span className="text-sm" style={{ color: 'var(--crm-muted)' }}>{item.name}: {item.value}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Revenue Trend */}
            <div className="rounded-xl p-6" style={{ background: 'var(--crm-slate)', border: '1px solid var(--crm-border)' }}>
              <h2 className="text-xl font-bold mb-6" style={{ color: 'var(--crm-white)' }}>Revenue Trend</h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--crm-border)" />
                  <XAxis dataKey="month" stroke="var(--crm-muted-dim)" />
                  <YAxis stroke="var(--crm-muted-dim)" />
                  <Tooltip formatter={(value) => `₹${Number(value).toLocaleString('en-IN')}`} {...tooltipStyle} />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke="#00D4AA" strokeWidth={2} name="Revenue" dot={{ fill: '#00D4AA' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Weekly Activity */}
            <div className="rounded-xl p-6" style={{ background: 'var(--crm-slate)', border: '1px solid var(--crm-border)' }}>
              <h2 className="text-xl font-bold mb-6" style={{ color: 'var(--crm-white)' }}>Weekly Activity</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={weeklyActivityData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--crm-border)" />
                  <XAxis dataKey="day" stroke="var(--crm-muted-dim)" />
                  <YAxis stroke="var(--crm-muted-dim)" />
                  <Tooltip {...tooltipStyle} />
                  <Legend />
                  <Bar dataKey="calls" fill="#00D4AA" name="Calls" />
                  <Bar dataKey="emails" fill="#C084FC" name="Emails" />
                  <Bar dataKey="meetings" fill="#FBBF24" name="Meetings" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Follow-up Completion */}
            <div className="rounded-xl p-6" style={{ background: 'var(--crm-slate)', border: '1px solid var(--crm-border)' }}>
              <h2 className="text-xl font-bold mb-6" style={{ color: 'var(--crm-white)' }}>Follow-up Completion Rate</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={followUpCompletionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--crm-border)" />
                  <XAxis dataKey="month" stroke="var(--crm-muted-dim)" />
                  <YAxis stroke="var(--crm-muted-dim)" />
                  <Tooltip {...tooltipStyle} />
                  <Legend />
                  <Bar dataKey="completed" stackId="a" fill="#00D4AA" name="Completed %" />
                  <Bar dataKey="pending" stackId="a" fill="#F87171" name="Pending %" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
