import { useEffect, useState } from 'react';
import { Sidebar } from '../components/Sidebar';
import { Link, useParams } from 'react-router';
import { Mail, Phone, Calendar, Star, Plus, Clock, MessageSquare, FileText, Download } from 'lucide-react';
import { useLeads } from '../contexts/LeadsContext';
import { useAuth } from '../contexts/AuthContext';
import { formatRelativeTime } from '../utils/dateHelpers';
import { hasPermission } from '../utils/permissions';
import { Role } from '../utils/roles';

export default function CustomerDetail() {
  const { id } = useParams();
  const { getLeadById } = useLeads();
  const { user } = useAuth();
  const [leadData, setLeadData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLead = async () => {
      if (id) {
        try {
          const data = await getLeadById(parseInt(id));
          setLeadData(data);
        } catch (error) {
          console.error('Error fetching lead:', error);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchLead();
  }, [id, getLeadById]);

  if (loading) {
    return (
      <div className="flex">
        <Sidebar />
        <main className="flex-1 bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading customer details...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!leadData) {
    return (
      <div className="flex">
        <Sidebar />
        <main className="flex-1 bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <p className="text-lg text-gray-600">Customer not found</p>
          </div>
        </main>
      </div>
    );
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'bg-red-100 text-red-700';
      case 'medium': return 'bg-orange-100 text-orange-700';
      case 'low': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="flex">
      <Sidebar />

      <main className="flex-1 bg-gray-50 overflow-auto">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">{leadData.company}</h1>
            <p className="text-gray-600 mt-1">Lead ID: #{id}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Customer Profile */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-2xl font-bold">{leadData.company.charAt(0)}</span>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{leadData.contact}</h2>
                    <p className="text-sm text-gray-500">{leadData.company}</p>
                  </div>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="flex items-center gap-3 text-gray-700">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <span className="text-sm">{leadData.email}</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-700">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <span className="text-sm">{leadData.phone || 'N/A'}</span>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Lead Score</span>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        <span className="font-semibold text-gray-900">{leadData.leadScore}/100</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Risk Status</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRiskColor(leadData.risk)}`}>
                      {leadData.risk ? leadData.risk.toUpperCase() : 'LOW'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Deal Value</span>
                    <span className="font-semibold text-gray-900">${leadData.value.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Stage</span>
                    <span className="text-sm font-medium text-gray-900 capitalize">{leadData.stage}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Priority</span>
                    <span className="text-sm text-gray-900">{leadData.priority}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                {/* ROLES: Using permission mapping for visibility */}
                {hasPermission(user?.role as Role, 'canOperationalControl') && (
                  <>
                    <button className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 font-medium">
                      <Plus className="w-5 h-5" />
                      Add Interaction
                    </button>
                    <button className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 font-medium">
                      <Calendar className="w-5 h-5" />
                      Schedule Follow-up
                    </button>
                  </>
                )}
                <Link
                  to={`/pdf-preview/${id}`}
                  className="block w-full border-2 border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-50 transition-colors text-center font-medium flex items-center justify-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  Download Summary
                </Link>
              </div>
            </div>

            {/* Interaction Timeline */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Interaction Timeline</h2>

                <div className="space-y-6">
                  {leadData.interactions && leadData.interactions.length > 0 ? (
                    leadData.interactions.map((interaction: any, index: number) => {
                      const Icon =
                        interaction.type === 'call' ? Phone :
                          interaction.type === 'email' ? Mail :
                            interaction.type === 'meeting' ? MessageSquare :
                              FileText;

                      return (
                        <div key={interaction.id} className="flex gap-4">
                          <div className="flex flex-col items-center">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${interaction.type === 'call' ? 'bg-blue-100' :
                              interaction.type === 'email' ? 'bg-purple-100' :
                                interaction.type === 'meeting' ? 'bg-green-100' :
                                  'bg-gray-100'
                              }`}>
                              <Icon className={`w-5 h-5 ${interaction.type === 'call' ? 'text-blue-600' :
                                interaction.type === 'email' ? 'text-purple-600' :
                                  interaction.type === 'meeting' ? 'text-green-600' :
                                    'text-gray-600'
                                }`} />
                            </div>
                            {index < leadData.interactions.length - 1 && (
                              <div className="w-0.5 h-full bg-gray-200 mt-2"></div>
                            )}
                          </div>

                          <div className="flex-1 pb-6">
                            <div className="flex items-start justify-between mb-2">
                              <h3 className="font-semibold text-gray-900">{interaction.type.charAt(0).toUpperCase() + interaction.type.slice(1)}</h3>
                              <div className="flex items-center gap-1 text-gray-500 text-sm">
                                <Clock className="w-4 h-4" />
                                <span>{formatRelativeTime(interaction.timestamp)}</span>
                              </div>
                            </div>
                            <p className="text-gray-600 text-sm mb-2">{interaction.notes}</p>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <p>No interactions recorded yet</p>
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
