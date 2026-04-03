import { useEffect, useState } from 'react';
import { Sidebar } from '../components/Sidebar';
import { Calendar, Clock, User, CheckCircle2, Circle, AlertCircle, Filter, Plus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTasks } from '../contexts/TasksContext';
import { useAuth } from '../contexts/AuthContext';
import { formatDate, isOverdue } from '../utils/dateHelpers';
import { hasPermission } from '../utils/permissions';
import { Role } from '../utils/roles';

export default function Tasks() {
  const { tasks, fetchTasks, toggleComplete, createTask } = useTasks();
  const { user } = useAuth();
  const [filter, setFilter] = useState<'all' | 'PENDING' | 'COMPLETED'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM' as const,
    dueDate: new Date().toISOString().slice(0, 16)
  });

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createTask(formData);
      setIsModalOpen(false);
      setFormData({
        title: '',
        description: '',
        priority: 'MEDIUM',
        dueDate: new Date().toISOString().slice(0, 16)
      });
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

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
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      <main className="flex-1 crm-page-container">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex justify-between items-end">
            <div className="space-y-1">
              <h1 className="crm-page-title">Tasks & Follow-ups</h1>
              <p className="crm-page-subtitle">Coordinate your team activities and client engagements</p>
            </div>
            {hasPermission(user?.role as Role, 'canOperationalControl') && (
              <button 
                onClick={() => setIsModalOpen(true)}
                className="crm-btn-primary"
              >
                <Plus className="w-5 h-5" />
                <span>New Activity</span>
              </button>
            )}
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="crm-card border-l-4 border-l-[#00D4AA] shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-1 text-muted-foreground">Total Assignments</p>
                  <p className="text-3xl font-bold">{tasks.length}</p>
                </div>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#00D4AA]/15">
                  <CheckCircle2 className="w-5 h-5 text-[#00D4AA]" />
                </div>
              </div>
            </div>
            <div className="crm-card border-l-4 border-l-[#FBBF24] shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-1 text-muted-foreground">Pending Sync</p>
                  <p className="text-3xl font-bold">{pendingCount}</p>
                </div>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#FBBF24]/15">
                  <Clock className="w-5 h-5 text-[#FBBF24]" />
                </div>
              </div>
            </div>
            <div className="crm-card border-l-4 border-l-[#4ADE80] shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-1 text-muted-foreground">Resolutions</p>
                  <p className="text-3xl font-bold">{completedCount}</p>
                </div>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#4ADE80]/15">
                  <CheckCircle2 className="w-5 h-5 text-[#4ADE80]" />
                </div>
              </div>
            </div>
          </div>

          <div className="crm-card !p-0 overflow-hidden">
            <div className="p-4 flex items-center justify-between border-b border-border bg-muted/10">
              <div className="flex p-1 rounded-xl bg-muted/20">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${filter === 'all' ? 'bg-card text-[#00D4AA] shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  All Registry
                </button>
                <button
                  onClick={() => setFilter('PENDING')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${filter === 'PENDING' ? 'bg-card text-[#FBBF24] shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  Active Logs
                </button>
                <button
                  onClick={() => setFilter('COMPLETED')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${filter === 'COMPLETED' ? 'bg-card text-[#4ADE80] shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  Resolved
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 rounded-lg transition-all text-muted-foreground hover:bg-muted hover:text-foreground">
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
                      className={`group rounded-2xl p-6 transition-all duration-300 border ${
                        task.status === 'COMPLETED' ? 'bg-muted/10 border-border opacity-60' :
                        taskOverdue ? 'bg-red-500/5 border-red-500/20' :
                        'bg-muted/5 border-border'
                      }`}
                    >
                      <div className="flex items-start gap-6">
                        <button
                          onClick={() => handleToggle(task.id)}
                          disabled={!hasPermission(user?.role as Role, 'canOperationalControl')}
                          className={`mt-1 transition-transform active:scale-90 ${!hasPermission(user?.role as Role, 'canOperationalControl') ? 'cursor-not-allowed' : 'cursor-pointer hover:scale-110'}`}
                        >
                          {task.status === 'COMPLETED' ? (
                            <div className="w-7 h-7 rounded-full flex items-center justify-center text-primary-foreground bg-[#4ADE80]">
                              <CheckCircle2 className="w-4 h-4" />
                            </div>
                          ) : (
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-colors ${taskOverdue ? 'border-red-500/40 bg-red-500/10 text-red-400' : 'border-border text-transparent hover:text-muted-foreground'}`}>
                              <CheckCircle2 className="w-4 h-4" />
                            </div>
                          )}
                        </button>

                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className={`text-lg font-bold tracking-tight transition-all ${task.status === 'COMPLETED' ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                                {task.title}
                              </h3>
                              <p className="text-sm mt-1 leading-relaxed text-muted-foreground">{task.description}</p>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                              <span className={`crm-badge ${task.priority === 'HIGH' ? 'badge-priority-high' :
                                task.priority === 'MEDIUM' ? 'badge-priority-medium' :
                                  'badge-priority-low'
                                }`}>
                                {task.priority}
                              </span>
                               {taskOverdue && (
                                <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest bg-red-500/20 text-red-400">
                                  Critical Delay
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-6 pt-4 border-t border-border">
                            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                              <Calendar className="w-3.5 h-3.5 text-[#00D4AA]" />
                              <span>{formatDate(task.dueDate)}</span>
                            </div>
                            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                              <Clock className="w-3.5 h-3.5 text-[#00D4AA]" />
                              <span>{new Date(task.dueDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                              <User className="w-3.5 h-3.5 text-[#00D4AA]" />
                              <span>{task.assignedTo}</span>
                            </div>
                            <div className="ml-auto text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest bg-[#00D4AA]/10 text-[#00D4AA]">
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
                    <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto bg-muted/10">
                      <CheckCircle2 className="w-10 h-10 text-muted-foreground" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-lg font-bold">Task Register Clear</h3>
                      <p className="text-sm font-medium text-muted-foreground">All operational protocols are currently up to date</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* New Activity Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 backdrop-blur-md bg-black/60"
              onClick={() => setIsModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="rounded-[2rem] w-full max-w-2xl relative overflow-hidden bg-card border border-border shadow-2xl"
            >
              <div className="p-8 flex justify-between items-start border-b border-border">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-foreground" style={{ fontFamily: 'Outfit, sans-serif' }}>New Activity</h2>
                  <p className="mt-1 font-medium text-sm tracking-tight text-muted-foreground">Schedule a follow-up or operational task.</p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2.5 rounded-xl transition-all group text-muted-foreground hover:text-foreground"
                >
                  <X className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                </button>
              </div>

              <form onSubmit={handleCreateSubmit} className="p-8 space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="crm-label">Task Title</label>
                    <input required type="text" className="crm-input" placeholder="e.g. Discuss proposal details" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <label className="crm-label">Description</label>
                    <textarea required className="crm-input min-h-[100px] resize-none" placeholder="Provide additional details..." value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="crm-label">Due Date & Time</label>
                      <input required type="datetime-local" className="crm-input" value={formData.dueDate} onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <label className="crm-label">Priority Tier</label>
                      <select className="crm-input font-bold appearance-none cursor-pointer bg-background" value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}>
                        <option value="LOW">LOW PRIORITY</option>
                        <option value="MEDIUM">MEDIUM PRIORITY</option>
                        <option value="HIGH">HIGH PRIORITY</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="crm-btn-secondary w-full !py-4">Cancel</button>
                  <button type="submit" className="crm-btn-primary w-full !py-4">Create Activity</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
