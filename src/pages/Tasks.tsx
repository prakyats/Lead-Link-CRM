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
    <div className="flex min-h-screen" style={{ background: 'var(--crm-navy)' }}>
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
            <div className="crm-card" style={{ borderLeft: '4px solid #00D4AA' }}>
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: '#64748B' }}>Total Assignments</p>
                  <p className="text-3xl font-bold" style={{ color: '#F1F5F9' }}>{tasks.length}</p>
                </div>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(0,212,170,0.15)' }}>
                  <CheckCircle2 className="w-5 h-5" style={{ color: '#00D4AA' }} />
                </div>
              </div>
            </div>
            <div className="crm-card" style={{ borderLeft: '4px solid #FBBF24' }}>
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: '#64748B' }}>Pending Sync</p>
                  <p className="text-3xl font-bold" style={{ color: '#F1F5F9' }}>{pendingCount}</p>
                </div>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(245,158,11,0.15)' }}>
                  <Clock className="w-5 h-5" style={{ color: '#FBBF24' }} />
                </div>
              </div>
            </div>
            <div className="crm-card" style={{ borderLeft: '4px solid #4ADE80' }}>
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: '#64748B' }}>Resolutions</p>
                  <p className="text-3xl font-bold" style={{ color: '#F1F5F9' }}>{completedCount}</p>
                </div>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(74,222,128,0.15)' }}>
                  <CheckCircle2 className="w-5 h-5" style={{ color: '#4ADE80' }} />
                </div>
              </div>
            </div>
          </div>

          <div className="crm-card !p-0 overflow-hidden">
            <div className="p-4 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(148,163,184,0.08)', background: 'rgba(148,163,184,0.03)' }}>
              <div className="flex p-1 rounded-xl" style={{ background: '#0B1120' }}>
                <button
                  onClick={() => setFilter('all')}
                  className="px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all"
                  style={filter === 'all' ? { background: '#1A2332', color: '#00D4AA', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' } : { color: '#64748B' }}
                >
                  All Registry
                </button>
                <button
                  onClick={() => setFilter('PENDING')}
                  className="px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all"
                  style={filter === 'PENDING' ? { background: '#1A2332', color: '#FBBF24', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' } : { color: '#64748B' }}
                >
                  Active Logs
                </button>
                <button
                  onClick={() => setFilter('COMPLETED')}
                  className="px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all"
                  style={filter === 'COMPLETED' ? { background: '#1A2332', color: '#4ADE80', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' } : { color: '#64748B' }}
                >
                  Resolved
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 rounded-lg transition-all" style={{ color: '#64748B', border: '1px solid transparent' }}>
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
                      className="group rounded-2xl p-6 transition-all duration-300"
                      style={task.status === 'COMPLETED' ? { background: 'rgba(148,163,184,0.03)', border: '1px solid rgba(148,163,184,0.06)', opacity: 0.6 } :
                        taskOverdue ? { background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)' } :
                          { background: 'rgba(148,163,184,0.03)', border: '1px solid rgba(148,163,184,0.08)' }}
                    >
                      <div className="flex items-start gap-6">
                        <button
                          onClick={() => handleToggle(task.id)}
                          disabled={!hasPermission(user?.role as Role, 'canOperationalControl')}
                          className={`mt-1 transition-transform active:scale-90 ${!hasPermission(user?.role as Role, 'canOperationalControl') ? 'cursor-not-allowed' : 'cursor-pointer hover:scale-110'}`}
                        >
                          {task.status === 'COMPLETED' ? (
                            <div className="w-7 h-7 rounded-full flex items-center justify-center text-white" style={{ background: '#4ADE80', boxShadow: '0 0 12px rgba(74,222,128,0.3)' }}>
                              <CheckCircle2 className="w-4 h-4" />
                            </div>
                          ) : (
                            <div className="w-7 h-7 rounded-full flex items-center justify-center transition-colors" style={taskOverdue ? { border: '2px solid rgba(239,68,68,0.4)', background: 'rgba(239,68,68,0.1)', color: '#F87171' } : { border: '2px solid rgba(148,163,184,0.2)', color: 'transparent' }}>
                              <CheckCircle2 className="w-4 h-4" />
                            </div>
                          )}
                        </button>

                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className={`text-lg font-bold tracking-tight transition-all ${task.status === 'COMPLETED' ? 'line-through' : ''}`} style={{ color: task.status === 'COMPLETED' ? '#64748B' : '#F1F5F9' }}>
                                {task.title}
                              </h3>
                              <p className="text-sm mt-1 leading-relaxed" style={{ color: '#94A3B8' }}>{task.description}</p>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                              <span className={`crm-badge ${task.priority === 'HIGH' ? 'badge-priority-high' :
                                task.priority === 'MEDIUM' ? 'badge-priority-medium' :
                                  'badge-priority-low'
                                }`}>
                                {task.priority}
                              </span>
                              {taskOverdue && (
                                <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest" style={{ background: 'rgba(239,68,68,0.2)', color: '#F87171' }}>
                                  Critical Delay
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-6 pt-4" style={{ borderTop: '1px solid rgba(148,163,184,0.06)' }}>
                            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest" style={{ color: '#64748B' }}>
                              <Calendar className="w-3.5 h-3.5" style={{ color: '#00D4AA' }} />
                              <span>{formatDate(task.dueDate)}</span>
                            </div>
                            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest" style={{ color: '#64748B' }}>
                              <Clock className="w-3.5 h-3.5" style={{ color: '#00D4AA' }} />
                              <span>{new Date(task.dueDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest" style={{ color: '#64748B' }}>
                              <User className="w-3.5 h-3.5" style={{ color: '#00D4AA' }} />
                              <span>{task.assignedTo}</span>
                            </div>
                            <div className="ml-auto text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest" style={{ color: '#00D4AA', background: 'rgba(0,212,170,0.1)' }}>
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
                    <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto" style={{ background: 'rgba(148,163,184,0.06)' }}>
                      <CheckCircle2 className="w-10 h-10" style={{ color: '#64748B' }} />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-lg font-bold" style={{ color: '#F1F5F9' }}>Task Register Clear</h3>
                      <p className="text-sm font-medium" style={{ color: '#64748B' }}>All operational protocols are currently up to date</p>
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
