import { useEffect, useState } from 'react';
import { Sidebar } from '../components/Sidebar';
import { Calendar, Clock, User, CheckCircle2, Circle, AlertCircle, Filter, Plus } from 'lucide-react';
import { useTasks } from '../contexts/TasksContext';
import { useAuth } from '../contexts/AuthContext';
import { formatDate, isOverdue } from '../utils/dateHelpers';
import { hasPermission } from '../utils/permissions';
import { Role } from '../utils/roles';

export default function Tasks() {
  const { tasks, fetchTasks, toggleComplete } = useTasks();
  const { user } = useAuth();
  const [filter, setFilter] = useState<'all' | 'PENDING' | 'COMPLETED'>('all');

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleToggle = async (taskId: number) => {
    if (!hasPermission(user?.role as Role, 'canOperationalControl')) return;
    try {
      await toggleComplete(taskId);
    } catch (error) {
      console.error('Error toggling task:', error);
    }
  };

  const filteredTasks = tasks.filter((task) => {
    if (filter === 'PENDING') return task.status === 'PENDING';
    if (filter === 'COMPLETED') return task.status === 'COMPLETED';
    return true;
  });

  const pendingCount = tasks.filter((t) => t.status === 'PENDING').length;
  const completedCount = tasks.filter((t) => t.status === 'COMPLETED').length;

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <Sidebar />
      <main className="flex-1 crm-page-container">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex justify-between items-end">
            <div className="space-y-1">
              <h1 className="crm-page-title">Tasks & Follow-ups</h1>
              <p className="crm-page-subtitle">Coordinate your team activities and client engagements</p>
            </div>
            {hasPermission(user?.role as Role, 'canOperationalControl') && (
              <button className="crm-btn-primary">
                <Plus className="w-5 h-5" />
                <span>New Activity</span>
              </button>
            )}
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="crm-card border-l-4 border-l-blue-500">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total Assignments</p>
                  <p className="text-3xl font-bold text-gray-900">{tasks.length}</p>
                </div>
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </div>
            <div className="crm-card border-l-4 border-l-amber-500">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Pending Sync</p>
                  <p className="text-3xl font-bold text-gray-900">{pendingCount}</p>
                </div>
                <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                  <Clock className="w-5 h-5 text-amber-600" />
                </div>
              </div>
            </div>
            <div className="crm-card border-l-4 border-l-green-500">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Resolutions</p>
                  <p className="text-3xl font-bold text-gray-900">{completedCount}</p>
                </div>
                <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                </div>
              </div>
            </div>
          </div>

          <div className="crm-card !p-0 overflow-hidden">
            <div className="p-4 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
              <div className="flex p-1 bg-gray-100 rounded-xl">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${filter === 'all' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  All Registry
                </button>
                <button
                  onClick={() => setFilter('PENDING')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${filter === 'PENDING' ? 'bg-white text-amber-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Active Logs
                </button>
                <button
                  onClick={() => setFilter('COMPLETED')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${filter === 'COMPLETED' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Resolved
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-white rounded-lg transition-all text-gray-400 border border-transparent hover:border-gray-200">
                  <Filter className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-8">
              <div className="space-y-4">
                {filteredTasks.map((task) => {
                  const taskOverdue = task.status !== 'COMPLETED' && isOverdue(task.dueDate);
                  return (
                    <div
                      key={task.id}
                      className={`group border rounded-2xl p-6 transition-all duration-300 ${task.status === 'COMPLETED' ? 'bg-gray-50/50 grayscale opacity-80' :
                        taskOverdue ? 'bg-red-50/30 border-red-100' :
                          'bg-white border-gray-100 hover:shadow-md hover:border-blue-100'
                        }`}
                    >
                      <div className="flex items-start gap-6">
                        <button
                          onClick={() => handleToggle(task.id)}
                          disabled={!hasPermission(user?.role as Role, 'canOperationalControl')}
                          className={`mt-1 transition-transform active:scale-90 ${!hasPermission(user?.role as Role, 'canOperationalControl') ? 'cursor-not-allowed' : 'cursor-pointer hover:scale-110'}`}
                        >
                          {task.status === 'COMPLETED' ? (
                            <div className="w-7 h-7 bg-green-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-green-100">
                              <CheckCircle2 className="w-4 h-4" />
                            </div>
                          ) : (
                            <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-colors ${taskOverdue ? 'border-red-300 bg-red-50 text-red-500' : 'border-gray-200 text-transparent hover:border-blue-500'}`}>
                              <CheckCircle2 className="w-4 h-4" />
                            </div>
                          )}
                        </button>

                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className={`text-lg font-bold text-gray-900 tracking-tight transition-all ${task.status === 'COMPLETED' ? 'line-through text-gray-400' : ''}`}>
                                {task.title}
                              </h3>
                              <p className="text-sm text-gray-500 mt-1 leading-relaxed">{task.description}</p>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                              <span className={`crm-badge ${task.priority === 'HIGH' ? 'badge-priority-high' :
                                task.priority === 'MEDIUM' ? 'badge-priority-medium' :
                                  'badge-priority-low'
                                }`}>
                                {task.priority}
                              </span>
                              {taskOverdue && (
                                <span className="px-2.5 py-1 bg-red-600 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-red-100">
                                  Critical Delay
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-6 pt-4 border-t border-gray-50">
                            <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                              <Calendar className="w-3.5 h-3.5 text-blue-500" />
                              <span>{formatDate(task.dueDate)}</span>
                            </div>
                            <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                              <Clock className="w-3.5 h-3.5 text-blue-500" />
                              <span>{new Date(task.dueDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                              <User className="w-3.5 h-3.5 text-blue-500" />
                              <span>{task.assignedTo}</span>
                            </div>
                            <div className="ml-auto text-[10px] font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase tracking-widest">
                              Protocol: Follow-up
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {filteredTasks.length === 0 && (
                  <div className="py-24 text-center space-y-4">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto">
                      <CheckCircle2 className="w-10 h-10 text-gray-200" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-lg font-bold text-gray-900">Task Register Clear</h3>
                      <p className="text-sm text-gray-400 font-medium">All operational protocols are currently up to date</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
