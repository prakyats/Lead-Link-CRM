import { useEffect, useState } from 'react';
import { Sidebar } from '../components/Sidebar';
import { Calendar, Clock, User, CheckCircle2, Circle, AlertCircle, Filter, Plus, X, Zap, Target, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTasks, createTask as createTaskApi, toggleCompleteTask } from '../api/tasks';
import { useAuth } from '../contexts/AuthContext';
import { formatDate, isOverdue } from '../utils/dateHelpers';
import { toast } from 'sonner';
import { hasPermission } from '../utils/permissions';
import { Role } from '../utils/roles';
import { TaskSkeleton } from '@/components/ui/skeleton';
import { validateTaskForm, validateTaskTitle, validateDescription, type ValidationErrors } from '../utils/validation';

export default function Tasks() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: tasks = [], isLoading: loading, isError } = useQuery({
    queryKey: ['tasks', user?.id],
    queryFn: getTasks,
    enabled: !!user?.id,
  });

  const createMutation = useMutation({
    mutationFn: createTaskApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', user?.id] });
      toast.success('Task Created Successfully', {
        description: 'New activity has been logged to the registry.'
      });
    },
    onError: () => {
      toast.error('Error Saving', {
          description: 'Unable to create the requested activity.'
      });
    }
  });

  const toggleMutation = useMutation({
    mutationFn: toggleCompleteTask,
    onMutate: async (taskId) => {
      await queryClient.cancelQueries({ queryKey: ['tasks', user?.id] });
      const previousTasks = queryClient.getQueryData(['tasks', user?.id]);
      queryClient.setQueryData(['tasks', user?.id], (old: any) =>
        old?.map((t: any) =>
          t.id === taskId ? { ...t, status: t.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED' } : t
        )
      );
      return { previousTasks };
    },
    onError: (err, variables, context: any) => {
      queryClient.setQueryData(['tasks', user?.id], context.previousTasks);
      toast.error('State Synchronization Error');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', user?.id] });
    }
  });

  const [filter, setFilter] = useState<'all' | 'PENDING' | 'COMPLETED'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<ValidationErrors>({});
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM' as const,
    dueDate: new Date().toISOString().slice(0, 16)
  });

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateTaskForm(formData);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    try {
      await createMutation.mutateAsync(formData);
      setIsModalOpen(false);
      setFieldErrors({});
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

  const handleTaskFieldBlur = (field: 'title' | 'description' | 'dueDate') => {
    if (field === 'title') {
      const err = validateTaskTitle(formData.title);
      setFieldErrors((prev: ValidationErrors) => ({ ...prev, title: err || '' }));
    } else if (field === 'description') {
      const err = validateDescription(formData.description);
      setFieldErrors((prev: ValidationErrors) => ({ ...prev, description: err || '' }));
    } else if (field === 'dueDate') {
      setFieldErrors((prev: ValidationErrors) => ({ ...prev, dueDate: formData.dueDate ? '' : 'Due date and time are required' }));
    }
  };

  const handleToggle = (taskId: number) => {
    if (!hasPermission(user?.role as Role, 'canOperationalControl')) return;
    toggleMutation.mutate(taskId);
  };

  const filteredTasks = tasks
    .filter((task) => {
      if (filter === 'PENDING') return task.status === 'PENDING';
      if (filter === 'COMPLETED') return task.status === 'COMPLETED';
      return true;
    })
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  const pendingCount = tasks.filter((t: any) => t.status === 'PENDING').length;
  const completedCount = tasks.filter((t: any) => t.status === 'COMPLETED').length;

  if (isError) {
    return (
      <div className="crm-page-container">
        <Sidebar />
        <main className="crm-main-content flex items-center justify-center p-12">
          <div className="text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-status-danger/10 flex items-center justify-center mx-auto">
              <AlertCircle size={32} className="text-status-danger" />
            </div>
            <h2 className="text-2xl font-semibold uppercase tracking-tight">Telemetry Interrupted</h2>
            <button onClick={() => window.location.reload()} className="crm-btn-primary !px-8">Re-Initialize Registry</button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="crm-page-container">
      <Sidebar />
      <main className="crm-main-content">
        {/* ── Background Effects ── */}
        <div className="ll-hero-grid opacity-[0.02] dark:opacity-[0.04]" />
        <div className="ll-orb w-[600px] h-[600px] -top-64 -right-32 bg-primary/5 blur-[120px]" />
        
        <div className="relative z-10 p-10 space-y-10 custom-scrollbar overflow-y-auto h-full">
          <div className="flex justify-between items-end">
            <div className="animate-in slide-in-from-left duration-700">
              <h1 className="crm-page-title">Operational Registry</h1>
              <p className="crm-page-subtitle mt-2">Track your pending tasks and follow-ups</p>
            </div>
            {hasPermission(user?.role as Role, 'canOperationalControl') && (
              <button 
                onClick={() => setIsModalOpen(true)}
                className="crm-btn-primary animate-in slide-in-from-right duration-700"
              >
                <Plus size={18} />
                <span className="text-xs font-semibold uppercase tracking-wider">New Task</span>
              </button>
            )}
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="crm-card group transition-all hover:border-primary/30">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider mb-3 text-muted-foreground/60">Total Vectors</p>
                  <p className="text-4xl font-semibold tracking-tight">{tasks.length}</p>
                </div>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-primary/10 border border-primary/20 shadow-inner group-hover:bg-primary/20 transition-colors">
                  <Activity size={20} className="text-primary" />
                </div>
              </div>
            </div>
            <div className="crm-card group transition-all hover:border-status-warning/30">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider mb-3 text-muted-foreground/60">Pending Sync</p>
                  <p className="text-4xl font-semibold tracking-tight text-status-warning">{pendingCount}</p>
                </div>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-status-warning/10 border border-status-warning/20 shadow-inner group-hover:bg-status-warning/20 transition-colors">
                  <Clock size={20} className="text-status-warning" />
                </div>
              </div>
            </div>
            <div className="crm-card group transition-all hover:border-status-success/30">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider mb-3 text-muted-foreground/60">Completed Tasks</p>
                  <p className="text-4xl font-semibold tracking-tight text-status-success">{completedCount}</p>
                </div>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-status-success/10 border border-status-success/20 shadow-inner group-hover:bg-status-success/20 transition-colors">
                  <CheckCircle2 size={20} className="text-status-success" />
                </div>
              </div>
            </div>
          </div>

          <div className="crm-card !p-0 overflow-hidden bg-card/60 backdrop-blur-md">
            <div className="px-8 py-5 flex items-center justify-between border-b border-border/40 bg-muted/5">
              <div className="flex p-1.5 rounded-2xl bg-muted/20 border border-border/40">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-6 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all ${filter === 'all' ? 'bg-card text-primary shadow-[0_4px_20px_-4px_rgba(0,0,0,0.15)] ring-1 ring-border/40' : 'text-muted-foreground/60 hover:text-foreground'}`}
                >
                  Universal Registry
                </button>
                <button
                  onClick={() => setFilter('PENDING')}
                  className={`px-6 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all ${filter === 'PENDING' ? 'bg-card text-status-warning shadow-[0_4px_20px_-4px_rgba(0,0,0,0.15)] ring-1 ring-border/40' : 'text-muted-foreground/60 hover:text-foreground'}`}
                >
                  Active Protocols
                </button>
                <button
                  onClick={() => setFilter('COMPLETED')}
                  className={`px-6 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all ${filter === 'COMPLETED' ? 'bg-card text-status-success shadow-[0_4px_20px_-4px_rgba(0,0,0,0.15)] ring-1 ring-border/40' : 'text-muted-foreground/60 hover:text-foreground'}`}
                >
                  Cancelled Tasks
                </button>
              </div>
              <div className="flex items-center gap-3">
                <button className="w-10 h-10 flex items-center justify-center rounded-xl transition-all text-muted-foreground/40 hover:bg-muted/50 hover:text-foreground border border-transparent hover:border-border/40">
                  <Filter size={16} />
                </button>
              </div>
            </div>

            <div className="p-8">
              <div className="space-y-4">
                {loading ? (
                   <TaskSkeleton />
                ) : filteredTasks.map((task) => {
                  const taskOverdue = task.status !== 'COMPLETED' && isOverdue(task.dueDate);
                  return (
                    <motion.div
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      key={task.id}
                      className={`group relative rounded-[2rem] p-8 transition-all duration-500 border overflow-hidden ${
                        task.status === 'COMPLETED' ? 'bg-muted/5 border-border/20 opacity-40' :
                        taskOverdue ? 'bg-status-danger/[0.04] border-status-danger/20 shadow-[0_0_40px_-10px_rgba(239,68,68,0.1)]' :
                        'bg-muted/[0.03] border-border/40 hover:bg-muted/[0.05] hover:border-primary/20 hover:shadow-[0_8px_40px_-12px_rgba(0,212,170,0.12)]'
                      }`}
                    >
                      <div className="flex items-start gap-8 relative z-10">
                        <button
                          onClick={() => handleToggle(task.id)}
                          disabled={!hasPermission(user?.role as Role, 'canOperationalControl')}
                          className={`mt-1.5 transition-all active:scale-90 shrink-0 ${!hasPermission(user?.role as Role, 'canOperationalControl') ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                          {task.status === 'COMPLETED' ? (
                            <div className="w-9 h-9 rounded-2xl flex items-center justify-center text-primary-foreground bg-status-success shadow-[0_4px_16px_-4px_rgba(34,197,94,0.4)]">
                              <CheckCircle2 size={18} />
                            </div>
                          ) : (
                            <div className={`w-9 h-9 rounded-2xl flex items-center justify-center border-2 transition-all ${taskOverdue ? 'border-status-danger/40 bg-status-danger/10 text-status-danger shadow-[0_0_12px_rgba(239,68,68,0.2)]' : 'border-border/60 text-transparent hover:border-primary/40 hover:text-primary/40'}`}>
                              <CheckCircle2 size={18} />
                            </div>
                          )}
                        </button>

                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
                            <div className="min-w-0 flex-1">
                              <h3 className={`text-xl font-semibold tracking-tight transition-all sm:truncate ${task.status === 'COMPLETED' ? 'line-through text-muted-foreground/40' : 'text-foreground group-hover:text-primary'}`}>
                                {task.title}
                              </h3>
                              <p className={`text-sm mt-1.5 font-medium leading-relaxed max-w-2xl ${task.status === 'COMPLETED' ? 'text-muted-foreground/20' : 'text-muted-foreground/60'}`}>
                                {task.description}
                              </p>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                              <span className={`crm-badge scale-90 ${task.priority === 'HIGH' ? 'badge-priority-high' :
                                task.priority === 'MEDIUM' ? 'badge-priority-medium' :
                                  'badge-priority-low'
                                }`}>
                                {task.priority}
                              </span>
                               {taskOverdue && (
                                <span className="px-3 py-1.5 rounded-xl text-xs font-semibold uppercase tracking-wider bg-status-danger/10 text-status-danger border border-status-danger/20 animate-pulse">
                                  Time Critical
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-x-8 gap-y-4 pt-6 mt-2 border-t border-border/20">
                            <div className="flex items-center gap-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground/40 grayscale group-hover:grayscale-0 transition-all">
                              <Calendar size={14} className="text-primary/60" />
                              <span className="tabular-nums">{formatDate(task.dueDate)}</span>
                            </div>
                            <div className="flex items-center gap-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground/40 grayscale group-hover:grayscale-0 transition-all">
                              <Clock size={14} className="text-primary/60" />
                              <span className="tabular-nums">{new Date(task.dueDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <div className="flex items-center gap-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground/40 grayscale group-hover:grayscale-0 transition-all">
                              <User size={14} className="text-primary/60" />
                              <span className="truncate max-w-[120px]">{task.assignedTo}</span>
                            </div>
                            <div className="sm:ml-auto flex items-center gap-2 px-3 py-1.5 rounded-xl text-[8px] font-semibold uppercase tracking-wider bg-primary/[0.04] text-primary border border-primary/10">
                              <Zap size={10} className="animate-pulse" />
                              Active Protocol
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Interactive Glow */}
                      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-[40px] opacity-0 group-hover:opacity-100 transition-opacity" />
                    </motion.div>
                  );
                })}

                {!loading && filteredTasks.length === 0 && (
                  <div className="py-32 text-center space-y-6">
                    <div className="w-24 h-24 rounded-[2rem] bg-muted/5 border border-border/20 flex items-center justify-center mx-auto shadow-inner">
                      <Target size={32} className="text-muted-foreground/20" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-semibold uppercase tracking-tight text-foreground/40">Clean Slate Protocol</h3>
                      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground/20">All operational vectors have been finalized</p>
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
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 overflow-hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 backdrop-blur-xl bg-black/40 dark:bg-black/80"
              onClick={() => setIsModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 40 }}
              className="rounded-[3rem] w-full max-w-2xl relative overflow-hidden bg-card/90 backdrop-blur-2xl border border-white/10 shadow-[0_32px_120px_-20px_rgba(0,0,0,0.5)]"
            >
              {/* Modal Background Ornament */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[100px] pointer-events-none" />
              
              <div className="px-10 py-10 flex justify-between items-start border-b border-white/5 relative z-10">
                <div>
                  <h2 className="text-3xl font-semibold tracking-tight text-foreground leading-tight uppercase" style={{ fontFamily: 'var(--ll-font-display)' }}>Create Task</h2>
                  <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-primary">Schedule Operational Mission</p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="w-12 h-12 flex items-center justify-center rounded-2xl transition-all group text-muted-foreground/40 hover:text-foreground hover:bg-white/5 border border-white/5"
                >
                  <X size={20} className="group-hover:rotate-90 transition-transform" />
                </button>
              </div>

              <form onSubmit={handleCreateSubmit} className="p-10 space-y-8 relative z-10">
                <div className="space-y-6">
                  <div className="space-y-3">
                    <label className="text-xs font-semibold uppercase tracking-wider px-1 text-muted-foreground/60">Task Title</label>
                    <input
                      required
                      type="text"
                      className={`crm-input !bg-white/5 !border-white/10 !h-14 !px-6 text-sm font-bold ${fieldErrors.title ? '!border-status-danger/50 ring-4 ring-status-danger/10' : 'focus:!border-primary/50 focus:ring-primary/10'}`}
                      placeholder="e.g. VECTOR SYNCHRONIZATION"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value.toUpperCase() })}
                      onBlur={() => handleTaskFieldBlur('title')}
                      maxLength={100}
                    />
                    {fieldErrors.title && <p className="text-status-danger text-[10px] font-semibold uppercase tracking-widest mt-2">{fieldErrors.title}</p>}
                  </div>
                  
                  <div className="space-y-3">
                    <label className="text-xs font-semibold uppercase tracking-wider px-1 text-muted-foreground/60">Operational Brief</label>
                    <textarea
                      className={`crm-input !bg-white/5 !border-white/10 min-h-[140px] !px-6 !py-5 resize-none text-sm font-medium leading-relaxed ${fieldErrors.description ? '!border-status-danger/50 ring-4 ring-status-danger/10' : 'focus:!border-primary/50 focus:ring-primary/10'}`}
                      placeholder="Detailed task parameters..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      onBlur={() => handleTaskFieldBlur('description')}
                      maxLength={500}
                    />
                    <div className="flex justify-between items-center px-1">
                      {fieldErrors.description
                        ? <p className="text-status-danger text-[10px] font-semibold uppercase tracking-widest">{fieldErrors.description}</p>
                        : <span />}
                      <span className={`text-[9px] font-semibold uppercase tracking-widest ${formData.description.length > 480 ? 'text-status-warning' : 'text-muted-foreground/30'}`}>
                        {formData.description.length} / 500
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label className="text-xs font-semibold uppercase tracking-wider px-1 text-muted-foreground/60">Execution Window</label>
                      <input
                        required
                        type="datetime-local"
                        className={`crm-input !bg-white/5 !border-white/10 !h-14 !px-6 text-[10px] font-semibold uppercase tracking-widest ${fieldErrors.dueDate ? '!border-status-danger/50 ring-4 ring-status-danger/10' : 'focus:!border-primary/50 focus:ring-primary/10'}`}
                        value={formData.dueDate}
                        onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                        onBlur={() => handleTaskFieldBlur('dueDate')}
                      />
                      {fieldErrors.dueDate && <p className="text-status-danger text-[10px] font-semibold uppercase tracking-widest mt-2">{fieldErrors.dueDate}</p>}
                    </div>
                    <div className="space-y-3">
                      <label className="text-xs font-semibold uppercase tracking-wider px-1 text-muted-foreground/60">Priority</label>
                      <div className="relative">
                        <select className="crm-input !bg-white/5 !border-white/10 !h-14 !px-6 text-[10px] font-semibold uppercase tracking-widest appearance-none cursor-pointer" value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}>
                          <option value="LOW">STANDARD PRIORITY</option>
                          <option value="MEDIUM">STANDARD PRIORITY</option>
                          <option value="HIGH">HIGH PRIORITY</option>
                        </select>
                        <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none opacity-20">
                          <Plus size={14} className="rotate-45" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-6 pt-6">
                  <button type="button" disabled={createMutation.isPending} onClick={() => { setIsModalOpen(false); setFieldErrors({}); }} className="w-full h-16 rounded-[1.5rem] bg-white/5 border border-white/10 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:bg-white/10 transition-all disabled:opacity-50">Abort Mission</button>
                  <button type="submit" disabled={createMutation.isPending} className="w-full h-16 rounded-[1.5rem] bg-primary text-black text-xs font-semibold uppercase tracking-wider hover:opacity-90 shadow-xl shadow-primary/20 transition-all disabled:opacity-50 flex items-center justify-center gap-3">
                    {createMutation.isPending ? 'SAVING...' : (
                      <>
                        <Zap size={14} fill="currentColor" />
                        Initiate Sequence
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
