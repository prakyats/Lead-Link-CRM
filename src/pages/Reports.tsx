import { Sidebar } from '../components/Sidebar';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Users, Target, Clock } from 'lucide-react';

const leadDistributionData = [
  { name: 'New', value: 35, color: '#3B82F6' },
  { name: " "+'Contacted', value: 28, color: '#EAB308' },
  { name: 'Proposal', value: 22, color: '#A855F7' },
  { name: 'Converted', value: 15, color: '#22C55E' },
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

export default function Reports() {
  return (
    <div className="flex">
      <Sidebar />
      
      <main className="flex-1 bg-gray-50 overflow-auto">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
            <p className="text-gray-600 mt-1">View performance metrics and insights</p>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <span className="text-sm text-green-600 font-medium">+12.5%</span>
              </div>
              <p className="text-gray-600 text-sm mb-1">Total Leads</p>
              <p className="text-2xl font-bold text-gray-900">1,247</p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-green-50 rounded-lg">
                  <Target className="w-6 h-6 text-green-600" />
                </div>
                <span className="text-sm text-green-600 font-medium">+8.2%</span>
              </div>
              <p className="text-gray-600 text-sm mb-1">Conversion Rate</p>
              <p className="text-2xl font-bold text-gray-900">18.5%</p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-purple-50 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
                <span className="text-sm text-green-600 font-medium">+15.3%</span>
              </div>
              <p className="text-gray-600 text-sm mb-1">Revenue</p>
              <p className="text-2xl font-bold text-gray-900">$331K</p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-orange-50 rounded-lg">
                  <Clock className="w-6 h-6 text-orange-600" />
                </div>
                <span className="text-sm text-red-600 font-medium">+2.1%</span>
              </div>
              <p className="text-gray-600 text-sm mb-1">Avg. Response Time</p>
              <p className="text-2xl font-bold text-gray-900">2.4h</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 p-3">
            {/* Lead Distribution */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Lead Distribution by Stage</h2>
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
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-4 mt-6">
                {leadDistributionData.map((item) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: item.color }}></div>
                    <span className="text-sm text-gray-700">{item.name}: {item.value}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Revenue Trend */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Revenue Trend</h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={2} name="Revenue" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Weekly Activity */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Weekly Activity</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={weeklyActivityData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="calls" fill="#3B82F6" name="Calls" />
                  <Bar dataKey="emails" fill="#A855F7" name="Emails" />
                  <Bar dataKey="meetings" fill="#22C55E" name="Meetings" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Follow-up Completion */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Follow-up Completion Rate</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={followUpCompletionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="completed" stackId="a" fill="#22C55E" name="Completed %" />
                  <Bar dataKey="pending" stackId="a" fill="#EF4444" name="Pending %" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
