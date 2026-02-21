import { Sidebar } from '../components/Sidebar';
import { Shield, Users, Info, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Settings() {
    const { user } = useAuth();

    const riskThresholds = [
        { level: 'High Risk', criteria: 'Last interaction >= 7 days', color: 'text-red-600', bg: 'bg-red-50' },
        { level: 'Medium Risk', criteria: 'Last interaction 3-6 days', color: 'text-orange-600', bg: 'bg-orange-50' },
        { level: 'Low Risk', criteria: 'Last interaction < 3 days', color: 'text-green-600', bg: 'bg-green-50' },
    ];

    const systemUsers = [
        { name: 'System Admin', email: 'admin@crm.com', role: 'admin' },
        { name: 'Sales Manager', email: 'manager@crm.com', role: 'manager' },
        { name: 'Sales Executive', email: 'sales@crm.com', role: 'sales' },
    ];

    return (
        <div className="flex">
            <Sidebar />
            <main className="flex-1 bg-gray-50 overflow-auto">
                <div className="p-8 max-w-4xl mx-auto">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
                        <p className="text-gray-600 mt-1">System-wide configurations and information (Admin Only)</p>
                    </div>

                    <div className="space-y-6">
                        {/* Risk Calculation Rules */}
                        <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="p-6 border-b border-gray-200 flex items-center gap-3">
                                <Shield className="w-5 h-5 text-blue-600" />
                                <h2 className="text-xl font-bold text-gray-900">Risk Threshold Rules</h2>
                            </div>
                            <div className="p-6">
                                <p className="text-sm text-gray-500 mb-4">
                                    Customer risk status is automatically calculated based on the number of days since the last recorded interaction.
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {riskThresholds.map((rule) => (
                                        <div key={rule.level} className={`${rule.bg} p-4 rounded-lg`}>
                                            <p className={`font-bold ${rule.color} mb-1`}>{rule.level}</p>
                                            <p className="text-sm text-gray-700">{rule.criteria}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>

                        {/* User Directory */}
                        <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="p-6 border-b border-gray-200 flex items-center gap-3">
                                <Users className="w-5 h-5 text-blue-600" />
                                <h2 className="text-xl font-bold text-gray-900">System User Directory</h2>
                            </div>
                            <div className="p-6">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="border-b border-gray-100 text-sm text-gray-500">
                                                <th className="pb-3 font-medium">Name</th>
                                                <th className="pb-3 font-medium">Email</th>
                                                <th className="pb-3 font-medium">Role</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {systemUsers.map((u) => (
                                                <tr key={u.email} className="text-sm">
                                                    <td className="py-3 font-medium text-gray-900">{u.name}</td>
                                                    <td className="py-3 text-gray-600">{u.email}</td>
                                                    <td className="py-3">
                                                        <span className="capitalize px-2 py-1 bg-gray-100 rounded text-gray-600 text-xs">
                                                            {u.role}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </section>

                        {/* Profile Info */}
                        <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="p-6 border-b border-gray-200 flex items-center gap-3">
                                <User className="w-5 h-5 text-blue-600" />
                                <h2 className="text-xl font-bold text-gray-900">Your Admin Profile</h2>
                            </div>
                            <div className="p-6 flex items-center gap-6">
                                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-2xl font-bold">
                                    {user?.name?.substring(0, 2).toUpperCase()}
                                </div>
                                <div>
                                    <p className="text-lg font-bold text-gray-900">{user?.name}</p>
                                    <p className="text-gray-500 text-sm">{user?.email}</p>
                                    <p className="inline-block mt-2 px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-full uppercase">
                                        {user?.role}
                                    </p>
                                </div>
                            </div>
                        </section>

                        <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg flex gap-3 text-blue-700 text-sm">
                            <Info className="w-5 h-5 shrink-0" />
                            <p>This page is informational for academic purposes. Dynamic configuration of roles and pipeline stages is not enabled in this version.</p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
