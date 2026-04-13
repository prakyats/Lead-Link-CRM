import { useEffect, useState } from 'react';
import { Sidebar } from '../components/Sidebar';
import { Calendar, Clock, User, CheckCircle2, Circle, AlertCircle, Filter, Plus, X, Zap, Target, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTasks, createTask as createTaskApi, toggleCompleteTask } from '@/api/tasks';
import { useAuth } from '../contexts/AuthContext';
import { formatDate, isOverdue } from '../utils/dateHelpers';
import { toast } from 'sonner';
import { hasPermission } from '../utils/permissions';
import { Role } from '../utils/roles';
import { TaskSkeleton } from '@/components/ui/skeleton';
import { validateTaskForm, validateTaskTitle, validateDescription, type ValidationErrors } from '../utils/validation';
import { getUsers } from '@/api/users';
import { TaskModal } from '../components/TaskModal';

export default function Tasks() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: tasks = [], isLoading: loading, isError } = useQuery({
    queryKey: ['tasks', user?.id],
    queryFn: getTasks,
    enabled: !!user?.id,
  });

  const { data: teamMembers = [] } = useQuery({
    queryKey: ['teamMembers'],
    queryFn: getUsers,
    enabled: !!user && (user.role === 'MANAGER' || user.role === 'ADMIN'),
  });

  const createMutation = useMutation({
    mutationFn: createTaskApi,
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', user?.id] });
      toast.success(res.message || 'Task Created Successfully');
    },
    onError: (err: any) => {
      // Safely extract message even if response is malformed or missing
      const msg = err.response?.data?.message || err.message || 'Unable to complete the operational request.';
      toast.error('Mission Protocol Error', {
          description: msg
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

  const [filter, setFilter] = useState<'all' | 'PENDING' | 'COMPLETED' | 'DELEGATED'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleToggle = (taskId: number) => {
    if (!hasPermission(user?.role as Role, 'canOperationalControl')) return;
    toggleMutation.mutate(taskId);
  };

  const filteredTasks = tasks
    .filter((task) => {
      if (filter === 'PENDING') return task.status === 'PENDING' && (task.taskType === 'SELF' || user?.role === 'SALES');
      if (filter === 'COMPLETED') return task.status === 'COMPLETED';
      if (filter === 'DELEGATED') return task.taskType === 'DELEGATED';
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
            <div className="flex gap-2 p-1.5 bg-muted/10 rounded-2xl border border-border/40 overflow-x-auto no-scrollbar">
              <button onClick={() => setFilter('all')} className={`px-5 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${filter === 'all' ? 'bg-primary text-black shadow-lg shadow-primary/20' : 'text-muted-foreground hover:bg-white/5'}`}>All Tasks</button>
              <button onClick={() => setFilter('PENDING')} className={`px-5 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${filter === 'PENDING' ? 'bg-status-warning/20 text-status-warning border border-status-warning/20' : 'text-muted-foreground hover:bg-white/5'}`}>Active Registry</button>
              <button onClick={() => setFilter('COMPLETED')} className={`px-5 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${filter === 'COMPLETED' ? 'bg-status-success/20 text-status-success border border-status-success/20' : 'text-muted-foreground hover:bg-white/5'}`}>Finalized</button>
              {(user?.role === 'MANAGER' || user?.role === 'ADMIN') && (
                <button onClick={() => setFilter('DELEGATED')} className={`px-5 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${filter === 'DELEGATED' ? 'bg-primary/20 text-primary border border-primary/20' : 'text-muted-foreground hover:bg-white/5'}`}>Delegated Vectors</button>
              )}
            </div>
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
            <div className="crm-card !p-5 group transition-all hover:border-primary/30">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5 text-muted-foreground/60">Total Vectors</p>
                  <p className="text-2xl font-bold tracking-tight">{tasks.length}</p>
                </div>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-primary/10 border border-primary/20 shadow-inner group-hover:bg-primary/20 transition-colors">
                  <Activity size={18} className="text-primary" />
                </div>
              </div>
            </div>
            <div className="crm-card !p-5 group transition-all hover:border-status-warning/30">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5 text-muted-foreground/60">Pending Sync</p>
                  <p className="text-2xl font-bold tracking-tight text-status-warning">{pendingCount}</p>
                </div>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-status-warning/10 border border-status-warning/20 shadow-inner group-hover:bg-status-warning/20 transition-colors">
                  <Clock size={18} className="text-status-warning" />
                </div>
              </div>
            </div>
            <div className="crm-card !p-5 group transition-all hover:border-status-success/30">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5 text-muted-foreground/60">Completed Tasks</p>
                  <p className="text-2xl font-bold tracking-tight text-status-success">{completedCount}</p>
                </div>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-status-success/10 border border-status-success/20 shadow-inner group-hover:bg-status-success/20 transition-colors">
                  <CheckCircle2 size={18} className="text-status-success" />
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
                  Finalized Registry
                </button>
              </div>
              <div className="flex items-center gap-3">
                <button className="w-10 h-10 flex items-center justify-center rounded-xl transition-all text-muted-foreground/40 hover:bg-muted/50 hover:text-foreground border border-transparent hover:border-border/40">
                  <Filter size={16} />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-3">
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
                      className={`group relative rounded-2xl p-4 px-6 transition-all duration-500 border overflow-hidden ${
                        task.status === 'COMPLETED' ? 'bg-muted/5 border-border/20 opacity-60' :
                        taskOverdue ? 'bg-status-danger/[0.06] border-status-danger/30 shadow-[0_4px_24px_-12px_rgba(239,68,68,0.2)]' :
                        'bg-card border-border/60 hover:border-primary/40 hover:bg-card/80 hover:shadow-[0_8px_30px_-12px_rgba(0,0,0,0.3)] shadow-sm'
                      }`}
                    >
                      {/* Left-edge status indicator strip */}
                      <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                        task.status === 'COMPLETED' ? 'bg-muted-foreground/20' :
                        taskOverdue ? 'bg-status-danger' :
                        task.priority === 'HIGH' ? 'bg-amber-500' :
                        'bg-primary/40'
                      }`} />
                      <div className="flex items-center gap-6 relative z-10">
                        <button
                          onClick={() => handleToggle(task.id)}
                          disabled={!hasPermission(user?.role as Role, 'canOperationalControl')}
                          className={`transition-all active:scale-90 shrink-0 ${!hasPermission(user?.role as Role, 'canOperationalControl') ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                          {task.status === 'COMPLETED' ? (
                            <div className="w-7 h-7 rounded-xl flex items-center justify-center text-primary-foreground bg-status-success shadow-[0_4px_16px_-4px_rgba(34,197,94,0.4)]">
                              <CheckCircle2 size={14} />
                            </div>
                          ) : (
                            <div className={`w-7 h-7 rounded-xl flex items-center justify-center border-2 transition-all ${taskOverdue ? 'border-status-danger/40 bg-status-danger/10 text-status-danger shadow-[0_0_12px_rgba(239,68,68,0.2)]' : 'border-border/60 text-transparent hover:border-primary/40 hover:text-primary/40'}`}>
                              <CheckCircle2 size={14} />
                            </div>
                          )}
                        </button>

                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
                            <div className="min-w-0 flex-1">
                                 <div className="space-y-1">
                                  <h3 className={`text-sm font-bold tracking-tight transition-colors ${task.status === 'COMPLETED' ? 'text-muted-foreground/40 line-through' : 'text-foreground'}`}>
                                    {task.title}
                                  </h3>
                                  {task.taskType === 'DELEGATED' && (
                                    <p className="text-[9px] font-black uppercase tracking-widest text-primary/60 flex items-center gap-1.5">
                                      <User size={8} />
                                      Assigned by {task.createdBy}
                                    </p>
                                  )}
                                </div>
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

      <TaskModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        user={user}
        teamMembers={teamMembers}
        createMutation={createMutation}
        onSuccess={() => {}}
      />
    </div>
  );
}
