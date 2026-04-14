import { useState, useCallback } from 'react';
import { Sidebar } from '../components/Sidebar';
import { Calendar, Clock, User, CheckCircle2, AlertCircle, Plus, Zap, Target, Activity, ChevronDown, ChevronRight, Shield, Users, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { InteractiveCard } from '../components/ui/InteractiveCard';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTasks, createTask as createTaskApi, toggleCompleteTask, type TaskType, type AdminManagerSummary, type ManagerRepGroup, type RoleTaskResponse, type SalesTaskData } from '@/api/tasks';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '../contexts/AuthContext';
import { formatDate } from '../utils/dateHelpers';
import { toast } from 'sonner';
import { hasPermission } from '../utils/permissions';
import { Role } from '../utils/roles';
import { TaskSkeleton } from '@/components/ui/skeleton';
import { getUsers } from '@/api/users';
import { TaskModal } from '../components/TaskModal';

type ActiveFilter = 'ALL' | 'OVERDUE' | 'PENDING' | 'COMPLETED';

/**
 * Overdue logic (calendar-based, matches backend)
 * OVERDUE = dueDate < startOfToday AND status !== 'COMPLETED'
 */
const isTaskOverdue = (task: TaskType) => {
  if (!task?.dueDate || task.status === 'COMPLETED') return false;
  
  const due = new Date(task.dueDate);
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  
  // Day-level precision normalization to prevent timezone/offset drift
  due.setSeconds(0, 0);
  
  return due < startOfToday;
};

// ── Shared: Individual Task Row ───────────────────────────────────────────────

function TaskRow({ task, onToggle, canControl }: { task: TaskType; onToggle: (id: number) => void; canControl: boolean }) {
  const taskOverdue = isTaskOverdue(task);
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className={`group relative rounded-2xl p-4 px-6 transition-all duration-300 border overflow-hidden shadow-sm hover:shadow-md ${
        task.status === 'COMPLETED' ? 'bg-muted/5 border-border/20 opacity-60' :
        taskOverdue ? 'bg-status-danger/[0.04] border-status-danger/20 hover:border-status-danger/40' :
        'bg-card border-border/60 hover:border-primary/40'
      }`}
    >
      {/* Left border accent */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${
        task.status === 'COMPLETED' ? 'bg-muted-foreground/20' :
        taskOverdue ? 'bg-status-danger' :
        task.priority === 'HIGH' ? 'bg-status-danger/40' : 
        task.priority === 'MEDIUM' ? 'bg-status-warning/40' : 
        'bg-primary/30'
      }`} />

      <div className="flex items-center gap-5 relative z-10">
        <button
          onClick={() => onToggle(task.id)}
          disabled={!canControl}
          className={`shrink-0 transition-all active:scale-90 ${!canControl ? 'cursor-not-allowed' : 'cursor-pointer'}`}
        >
          {task.status === 'COMPLETED' ? (
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-primary-foreground bg-status-success shadow-[0_4px_16px_-4px_rgba(34,197,94,0.4)]">
              <CheckCircle2 size={16} />
            </div>
          ) : (
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center border-2 transition-all ${
              taskOverdue ? 'border-status-danger/40 bg-status-danger/10 text-status-danger' : 
              'border-border/60 text-transparent hover:border-primary/40 hover:text-primary/40'
            }`}>
              <CheckCircle2 size={16} />
            </div>
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="space-y-0.5">
                <h3 className={`text-[15px] font-bold tracking-tight transition-colors ${
                  task.status === 'COMPLETED' ? 'text-muted-foreground/40 line-through' : 'text-foreground group-hover:text-primary'
                }`}>
                  {task.title}
                </h3>
                {task.taskType === 'DELEGATED' && (
                  <p className="text-[9px] font-black uppercase tracking-[0.1em] opacity-40 flex items-center gap-1.5 mt-0.5">
                    <User size={8} /> Assignee: {task.createdBy}
                  </p>
                )}
              </div>
              {task.description && (
                <p className={`text-sm mt-1.5 font-medium leading-relaxed max-w-2xl ${
                  task.status === 'COMPLETED' ? 'text-muted-foreground/20' : 'text-muted-foreground/50'
                }`}>
                  {task.description}
                </p>
              )}
            </div>
            
            <div className="flex items-center gap-2 shrink-0">
              <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                task.priority === 'HIGH' ? 'bg-status-danger/10 border-status-danger/20 text-status-danger' :
                task.priority === 'MEDIUM' ? 'bg-status-warning/10 border-status-warning/20 text-status-warning' :
                'bg-muted/10 border-border/40 text-muted-foreground/60'
              }`}>
                {task.priority}
              </span>
              {taskOverdue && (
                <span className="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest bg-status-danger text-white shadow-[0_4px_12px_-2px_rgba(239,68,68,0.4)] animate-pulse">
                  OVERDUE
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-3 mt-3 border-t border-border/10">
            {task.dueDate && (
              <>
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest opacity-30">
                  <Calendar size={12} className="text-primary/60" />
                  <span className="tabular-nums">{formatDate(task.dueDate)}</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest opacity-30">
                  <Clock size={12} className="text-primary/60" />
                  <span className="tabular-nums">{new Date(task.dueDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </>
            )}
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest opacity-30">
              <User size={12} className="text-primary/60" />
              <span className="truncate max-w-[120px]">{task.assignedTo}</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ── Admin View ────────────────────────────────────────────────────────────────

function AdminView({ data, filter }: { data: AdminManagerSummary[]; filter: ActiveFilter }) {
  const filtered = data.filter(m => {
    if (filter === 'OVERDUE') return (m.overdueCount || 0) > 0;
    if (filter === 'PENDING') return (m.pendingCount || 0) > 0;
    if (filter === 'COMPLETED') return (m.completedCount || 0) > 0;
    return true;
  });

  if (filtered.length === 0) {
    return (
      <div className="py-24 text-center space-y-4">
        <div className="w-20 h-20 rounded-[2rem] bg-muted/5 border border-border/20 flex items-center justify-center mx-auto">
          <Target size={28} className="text-muted-foreground/20" />
        </div>
        <p className="text-sm font-semibold uppercase tracking-widest text-muted-foreground/30">
          {filter === 'OVERDUE' ? 'No overdue tasks' : 'No matching task data'}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {filtered.map(m => (
        <motion.div
          key={m.managerId}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ y: -4 }}
          className="crm-card !p-6 space-y-6 hover:border-primary/30 transition-all duration-300 group hover:shadow-xl"
        >
          {/* Header */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
              <Shield size={20} className="text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">Division Manager</p>
              <h3 className="font-bold text-[16px] tracking-tight truncate text-foreground/90">{m.managerName}</h3>
            </div>
          </div>

          {/* Count Grid (Standardized 2x2) */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-primary/[0.03] border border-primary/10 text-center space-y-1 group/metric transition-all hover:bg-primary/5">
              <p className="text-xl font-extrabold tracking-tighter tabular-nums text-primary">{m.totalTasks}</p>
              <p className="text-[9px] font-black uppercase tracking-[0.1em] text-primary/40">Total</p>
            </div>
            <div className={`p-4 rounded-2xl text-center space-y-1 group/metric transition-all ${
              m.overdueCount > 0 
                ? 'bg-status-danger/10 border border-status-danger/20 hover:bg-status-danger/[0.15]' 
                : 'bg-muted/[0.03] border border-border/40 opacity-40'
            }`}>
              <p className={`text-xl font-extrabold tracking-tighter tabular-nums ${m.overdueCount > 0 ? 'text-status-danger' : 'text-muted-foreground/60'}`}>{m.overdueCount}</p>
              <p className={`text-[9px] font-black uppercase tracking-[0.1em] ${m.overdueCount > 0 ? 'text-status-danger/60' : 'text-muted-foreground/30'}`}>Overdue</p>
            </div>
            <div className={`p-4 rounded-2xl text-center space-y-1 group/metric transition-all ${
              m.pendingCount > 0 
                ? 'bg-status-warning/10 border border-status-warning/20 hover:bg-status-warning/[0.15]' 
                : 'bg-muted/[0.03] border border-border/40 opacity-40'
            }`}>
              <p className={`text-xl font-extrabold tracking-tighter tabular-nums ${m.pendingCount > 0 ? 'text-status-warning' : 'text-muted-foreground/60'}`}>{m.pendingCount}</p>
              <p className={`text-[9px] font-black uppercase tracking-[0.1em] ${m.pendingCount > 0 ? 'text-status-warning/60' : 'text-muted-foreground/30'}`}>Pending</p>
            </div>
            <div className={`p-4 rounded-2xl text-center space-y-1 group/metric transition-all ${
              m.completedCount > 0 
                ? 'bg-status-success/10 border border-status-success/20 hover:bg-status-success/[0.15]' 
                : 'bg-muted/[0.03] border border-border/40 opacity-40'
            }`}>
              <p className={`text-xl font-extrabold tracking-tighter tabular-nums ${m.completedCount > 0 ? 'text-status-success' : 'text-muted-foreground/60'}`}>{m.completedCount}</p>
              <p className={`text-[9px] font-black uppercase tracking-[0.1em] ${m.completedCount > 0 ? 'text-status-success/60' : 'text-muted-foreground/30'}`}>Completed</p>
            </div>
          </div>

          {/* Subtle Completion Bar */}
          {m.totalTasks > 0 && (
            <div className="space-y-2">
              <div className="h-1.5 rounded-full bg-muted/10 overflow-hidden relative">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.round((m.completedCount / m.totalTasks) * 100)}%` }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className="h-full bg-status-success/40 rounded-full"
                />
              </div>
              <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/20 text-center">
                System Efficiency: {Math.round((m.completedCount / m.totalTasks) * 100)}%
              </p>
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
}

// ── Manager View ──────────────────────────────────────────────────────────────

function ManagerView({
  data, filter, onToggle, canControl
}: {
  data: ManagerRepGroup[];
  filter: ActiveFilter;
  onToggle: (id: number) => void;
  canControl: boolean;
}) {
  const [expandedRepId, setExpandedRepId] = useState<number | null>(null);

  const filteredReps = data.filter(rep => {
    if (filter === 'OVERDUE') return (rep.overdueCount || 0) > 0;
    if (filter === 'PENDING') return (rep.pendingCount || 0) > 0;
    if (filter === 'COMPLETED') return (rep.completedCount || 0) > 0;
    return true;
  });

  const handleToggle = (repId: number) => {
    setExpandedRepId(prev => prev === repId ? null : repId);
  };

  if (filteredReps.length === 0) {
    return (
      <div className="py-24 text-center space-y-4">
        <div className="w-20 h-20 rounded-[2rem] bg-muted/5 border border-border/20 flex items-center justify-center mx-auto">
          <Users size={28} className="text-muted-foreground/20" />
        </div>
        <p className="text-sm font-semibold uppercase tracking-widest text-muted-foreground/30">
          {filter === 'OVERDUE' ? 'No overdue tasks' : 'No reps match this filter'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {filteredReps.map(rep => {
        const isExpanded = expandedRepId === rep.repId;

        // Filter inner tasks based on active filter
        const visibleTasks = rep.tasks.filter(t => {
          if (filter === 'OVERDUE') return isTaskOverdue(t);
          if (filter === 'PENDING') return t.status !== 'COMPLETED';
          if (filter === 'COMPLETED') return t.status === 'COMPLETED';
          return true;
        });

        return (
          <div key={rep.repId} className={`crm-card !p-0 overflow-hidden transition-all duration-300 border ${
            isExpanded ? 'border-primary/30 ring-1 ring-primary/5 bg-primary/[0.01]' : 'hover:border-primary/20'
          }`}>
            {/* Rep Header — clickable */}
            <button
              onClick={() => handleToggle(rep.repId)}
              className="w-full flex items-center gap-5 p-6 text-left"
            >
              <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0 transition-colors ${
                isExpanded ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-muted/10 border-border/20 text-muted-foreground/60'
              }`}>
                <User size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-[15px] tracking-tight">{rep.repName}</p>
                <div className="flex items-center gap-5 mt-1">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-primary/60">{rep.totalTasks} Tasks</span>
                  {rep.overdueCount > 0 && (
                    <span className="text-[10px] font-black uppercase tracking-widest text-status-danger flex items-center gap-1.5">
                      <div className="w-1 h-1 rounded-full bg-status-danger animate-pulse" />
                      {rep.overdueCount} Overdue
                    </span>
                  )}
                  <span className={`text-[10px] font-black uppercase tracking-widest ${rep.pendingCount > 0 ? 'text-status-warning' : 'text-muted-foreground/20'}`}>
                    {rep.pendingCount} Pending
                  </span>
                  <span className={`text-[10px] font-black uppercase tracking-widest ${rep.completedCount > 0 ? 'text-status-success' : 'text-muted-foreground/20'}`}>
                    {rep.completedCount} Completed
                  </span>
                </div>
              </div>
              {/* Progress micro bar */}
              {rep.totalTasks > 0 && (
                <div className="hidden sm:flex items-center gap-3 shrink-0 mr-4">
                  <div className="w-24 h-2 rounded-full bg-muted/10 overflow-hidden">
                    <div
                      className="h-full bg-status-success/60 rounded-full"
                      style={{ width: `${Math.round((rep.completedCount / rep.totalTasks) * 100)}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-black text-muted-foreground/20 tabular-nums w-8">
                    {Math.round((rep.completedCount / rep.totalTasks) * 100)}%
                  </span>
                </div>
              )}
              <div className={`shrink-0 transition-transform duration-300 text-muted-foreground/30 ${isExpanded ? 'rotate-180' : 'rotate-0'}`}>
                <ChevronDown size={20} />
              </div>
            </button>

            {/* Expanded Task List */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  key="tasks"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                  className="overflow-hidden bg-muted/[0.01]"
                >
                  <div className="border-t border-border/40 p-6 space-y-3">
                    {visibleTasks.length > 0 ? (
                      visibleTasks.map(task => (
                        <TaskRow key={task.id} task={task} onToggle={onToggle} canControl={canControl} />
                      ))
                    ) : (
                      <div className="py-10 text-center space-y-2">
                        <CheckCircle2 size={24} className="mx-auto text-status-success/20" />
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/30">
                          {filter === 'OVERDUE' ? 'No overdue tasks' : 'Optimization Complete: No pending syncs'}
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

// ── Sales View ────────────────────────────────────────────────────────────────

function SalesView({ tasks, filter, onToggle, canControl }: {
  tasks: TaskType[];
  filter: ActiveFilter;
  onToggle: (id: number) => void;
  canControl: boolean;
}) {
  const filtered = tasks.filter(t => {
    if (filter === 'OVERDUE') return isTaskOverdue(t);
    if (filter === 'PENDING') return t.status !== 'COMPLETED';
    if (filter === 'COMPLETED') return t.status === 'COMPLETED';
    return true;
  });

  if (filtered.length === 0) {
    return (
      <div className="py-24 text-center space-y-4">
        <div className="w-20 h-20 rounded-[2rem] bg-muted/5 border border-border/20 flex items-center justify-center mx-auto">
          <Target size={28} className="text-muted-foreground/20" />
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-semibold uppercase tracking-tight text-foreground/40">
            {filter === 'OVERDUE' ? 'No overdue tasks' : 'Clean Slate Protocol'}
          </h3>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground/20">
            {filter === 'OVERDUE' ? '' : 'All operational vectors finalized'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {filtered.length <= 1 && filtered.length > 0 && (
        <div className="px-6 py-2">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/20">Operational queue nearing completion</p>
        </div>
      )}
      {filtered.map(task => (
        <TaskRow key={task.id} task={task} onToggle={onToggle} canControl={canControl} />
      ))}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function Tasks() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const handleOpenModal = useCallback(() => setIsModalOpen(true), []);
  const handleCloseModal = useCallback(() => setIsModalOpen(false), []);

  const { data: taskResponse, isLoading, isError } = useQuery<RoleTaskResponse>({
    queryKey: ['tasks', user?.id],
    queryFn: getTasks,
    enabled: !!user?.id,
  });

  // ── Centralized Normalization Consumption ──────────────────────────────────
  const role = taskResponse?.role;
  const payload = taskResponse?.payload;

  const { data: teamMembers = [] } = useQuery({
    queryKey: ['teamMembers'],
    queryFn: getUsers,
    enabled: !!user && (user.role === 'MANAGER' || user.role === 'ADMIN'),
  });

  const createMutation = useMutation<any, any, Partial<TaskType>>({
    mutationFn: (task) => createTaskApi(task),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', user?.id] });
      toast.success(res.message || 'Task Created Successfully');
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || 'Unable to complete the operational request.';
      toast.error('Mission Protocol Error', { description: msg });
    }
  });

  const toggleMutation = useMutation<any, any, number>({
    mutationFn: (taskId) => toggleCompleteTask(taskId),
    onMutate: async (taskId) => {
      await queryClient.cancelQueries({ queryKey: ['tasks', user?.id] });
      const previousData = queryClient.getQueryData(['tasks', user?.id]);
      // Optimistic update
      queryClient.setQueryData(['tasks', user?.id], (old: any) => {
        // Handle both possible shapes during transition
        const r = old?.role ?? old?.data?.role;
        const p = old?.payload ?? old?.data?.payload;
        if (!old || r !== 'SALES') return old;

        const tasksKey = old.payload ? 'payload' : 'data';
        return {
          ...old,
          [tasksKey]: {
            ...p,
            tasks: (p as SalesTaskData).tasks.map((t: any) => 
              t.id === taskId ? { ...t, status: t.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED' } : t
            )
          }
        };
      });
      return { previousData };
    },
    onError: (_err, _vars, context: any) => {
      queryClient.setQueryData(['tasks', user?.id], context.previousData);
      toast.error('State Synchronization Error');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', user?.id] });
    }
  });

  const handleToggle = (taskId: number) => {
    if (!hasPermission(user?.role as Role, 'canOperationalControl')) return;
    toggleMutation.mutate(taskId);
  };

  const canControl = hasPermission(user?.role as Role, 'canOperationalControl');

  // ── Derive KPI counts based on role (LOCKED DEFINITIONS) ──
  const kpiCounts = (() => {
    const empty = { total: 0, overdue: 0, pending: 0, completed: 0 };
    if (!payload) return empty;
    
    if (role === 'ADMIN' && Array.isArray(payload)) {
      return {
        total: (payload as AdminManagerSummary[]).reduce((s: number, m) => s + (m.totalTasks || 0), 0),
        overdue: (payload as AdminManagerSummary[]).reduce((s: number, m) => s + (m.overdueCount || 0), 0),
        pending: (payload as AdminManagerSummary[]).reduce((s: number, m) => s + (m.pendingCount || 0), 0),
        completed: (payload as AdminManagerSummary[]).reduce((s: number, m) => s + (m.completedCount || 0), 0),
      };
    }
    
    if (role === 'MANAGER' && Array.isArray(payload)) {
      return {
        total: (payload as ManagerRepGroup[]).reduce((s: number, r) => s + (r.totalTasks || 0), 0),
        overdue: (payload as ManagerRepGroup[]).reduce((s: number, r) => s + (r.overdueCount || 0), 0),
        pending: (payload as ManagerRepGroup[]).reduce((s: number, r) => s + (r.pendingCount || 0), 0),
        completed: (payload as ManagerRepGroup[]).reduce((s: number, r) => s + (r.completedCount || 0), 0),
      };
    }
    
    if (role === 'SALES' && (payload as SalesTaskData).tasks) {
      const tasks = (payload as SalesTaskData).tasks;
      return {
        total: tasks.length || 0,
        overdue: tasks.filter(isTaskOverdue).length || 0,
        pending: tasks.filter(t => t.status !== 'COMPLETED').length || 0,
        completed: tasks.filter(t => t.status === 'COMPLETED').length || 0,
      };
    }

    return empty;
  })();

  const toggleFilter = (f: ActiveFilter) => setActiveFilter(prev => prev === f ? 'ALL' : f);

  if (isLoading || !payload) {
    return (
      <div className="crm-page-container">
        <Sidebar />
        <main className="crm-main-content p-8 space-y-8">
          <div className="space-y-4">
            <Skeleton className="h-10 w-48 bg-muted/20" />
            <Skeleton className="h-4 w-64 bg-muted/10" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton className="h-40 rounded-3xl bg-muted/10" />
            <Skeleton className="h-40 rounded-3xl bg-muted/10" />
            <Skeleton className="h-40 rounded-3xl bg-muted/10" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-24 rounded-2xl bg-muted/10" />
            <Skeleton className="h-24 rounded-2xl bg-muted/10" />
            <Skeleton className="h-24 rounded-2xl bg-muted/10" />
          </div>
        </main>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="crm-page-container">
        <Sidebar />
        <main className="crm-main-content flex items-center justify-center p-12">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-status-danger/10 flex items-center justify-center mx-auto">
              <AlertCircle size={32} className="text-status-danger" />
            </div>
            <h2 className="text-2xl font-semibold uppercase tracking-tight">Telemetry Interrupted</h2>
            <p className="text-sm text-muted-foreground/60">Failed to load task data. Please refresh.</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="crm-page-container">
      <Sidebar />
      <main className="crm-main-content">
        <div className="ll-hero-grid opacity-[0.02] dark:opacity-[0.04]" />
        <div className="ll-orb w-[600px] h-[600px] -top-64 -right-32 bg-primary/5 blur-[120px]" />

        <div className="relative z-10 p-10 space-y-8 custom-scrollbar overflow-y-auto h-full">
          {/* Header */}
          <div className="flex justify-between items-end">
            <div className="animate-in slide-in-from-left duration-700">
              <h1 className="crm-page-title">Operational Registry</h1>
              <p className="crm-page-subtitle mt-2">
                {role === 'ADMIN' ? 'Manager-level task overview' :
                 role === 'MANAGER' ? 'Rep execution status — grouped by assignee' :
                 'Your personal task execution queue'}
              </p>
            </div>
            {hasPermission(user?.role as Role, 'canOperationalControl') && (
              <button
                onClick={handleOpenModal}
                className="crm-btn-primary animate-in slide-in-from-right duration-700"
              >
                <Plus size={18} />
                <span className="text-xs font-semibold uppercase tracking-wider">New Task</span>
              </button>
            )}
          </div>

          {/* KPI Filter Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {/* Total */}
            <InteractiveCard
              isActive={activeFilter === 'ALL'}
              onClick={() => toggleFilter('ALL')}
              className="crm-card !p-5 text-left group overflow-hidden"
            >
              <div className="flex justify-between items-start relative z-10">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.15em] mb-4 text-muted-foreground/40 group-hover:text-primary/60 transition-colors">All Tasks</p>
                  <p className="text-3xl font-bold tracking-tighter tabular-nums">{kpiCounts.total}</p>
                </div>
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border transition-all duration-500 ${
                  activeFilter === 'ALL' 
                    ? 'bg-primary text-primary-foreground shadow-[0_0_20px_rgba(var(--primary),0.3)] ring-2 ring-primary/30 scale-110 border-transparent' 
                    : 'bg-muted/5 border-border/10 text-muted-foreground/40 group-hover:bg-primary/10 group-hover:text-primary group-hover:border-primary/20'
                }`}>
                  <Activity size={17} />
                </div>
              </div>
            </InteractiveCard>

            {/* Overdue */}
            <InteractiveCard
              isActive={activeFilter === 'OVERDUE'}
              onClick={() => toggleFilter('OVERDUE')}
              className="crm-card !p-5 text-left group overflow-hidden"
            >
              <div className="flex justify-between items-start relative z-10">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.15em] mb-4 text-muted-foreground/40 group-hover:text-status-danger/60 transition-colors">Overdue</p>
                  <p className="text-3xl font-bold tracking-tighter tabular-nums text-status-danger">{kpiCounts.overdue}</p>
                </div>
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border transition-all duration-500 ${
                  activeFilter === 'OVERDUE' 
                    ? 'bg-status-danger text-white shadow-[0_0_20px_rgba(239,68,68,0.3)] ring-2 ring-status-danger/30 scale-110 border-transparent' 
                    : 'bg-muted/5 border-border/10 text-muted-foreground/40 group-hover:bg-status-danger/10 group-hover:text-status-danger group-hover:border-status-danger/20'
                }`}>
                  <AlertCircle size={17} />
                </div>
              </div>
            </InteractiveCard>

            {/* Pending */}
            <InteractiveCard
              isActive={activeFilter === 'PENDING'}
              onClick={() => toggleFilter('PENDING')}
              className="crm-card !p-5 text-left group overflow-hidden"
            >
              <div className="flex justify-between items-start relative z-10">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.15em] mb-4 text-muted-foreground/40 group-hover:text-status-warning/60 transition-colors">Pending</p>
                  <p className="text-3xl font-bold tracking-tighter tabular-nums text-status-warning">{kpiCounts.pending}</p>
                </div>
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border transition-all duration-500 ${
                  activeFilter === 'PENDING' 
                    ? 'bg-status-warning text-white shadow-[0_0_20px_rgba(245,158,11,0.3)] ring-2 ring-status-warning/30 scale-110 border-transparent' 
                    : 'bg-muted/5 border-border/10 text-muted-foreground/40 group-hover:bg-status-warning/10 group-hover:text-status-warning group-hover:border-status-warning/20'
                }`}>
                  <TrendingUp size={17} />
                </div>
              </div>
            </InteractiveCard>

            {/* Completed */}
            <InteractiveCard
              isActive={activeFilter === 'COMPLETED'}
              onClick={() => toggleFilter('COMPLETED')}
              className="crm-card !p-5 text-left group overflow-hidden"
            >
              <div className="flex justify-between items-start relative z-10">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.15em] mb-4 text-muted-foreground/40 group-hover:text-status-success/60 transition-colors">Completed</p>
                  <p className="text-3xl font-bold tracking-tighter tabular-nums text-status-success">{kpiCounts.completed}</p>
                </div>
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border transition-all duration-500 ${
                  activeFilter === 'COMPLETED' 
                    ? 'bg-status-success text-white shadow-[0_0_20px_rgba(34,197,94,0.3)] ring-2 ring-status-success/30 scale-110 border-transparent' 
                    : 'bg-muted/5 border-border/10 text-muted-foreground/40 group-hover:bg-status-success/10 group-hover:text-status-success group-hover:border-status-success/20'
                }`}>
                  <CheckCircle2 size={17} />
                </div>
              </div>
            </InteractiveCard>
          </div>

          {/* Main Content Panel */}
          <div className="crm-card !p-0 overflow-hidden bg-card/60 backdrop-blur-md">
            <div className="px-6 py-4 flex items-center justify-between border-b border-border/40 bg-muted/5">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isLoading ? 'bg-muted-foreground/30' : 'bg-status-success animate-pulse'}`} />
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">
                  {isLoading ? 'Synchronizing...' :
                   activeFilter !== 'ALL' ? `FILTER: ${activeFilter}` :
                   role === 'ADMIN' ? 'Operational Oversight' :
                   role === 'MANAGER' ? 'Team Execution Map' :
                   'Task Execution Queue'}
                </p>
              </div>
              {activeFilter !== 'ALL' && (
                <button
                  onClick={() => setActiveFilter('ALL')}
                  className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 hover:text-foreground transition-colors flex items-center gap-1.5"
                >
                  Clear Filter ×
                </button>
              )}
            </div>

            <div className="p-5">
              <AnimatePresence mode="wait">
                {role === 'ADMIN' && (
                  <motion.div key="admin" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <AdminView data={payload as AdminManagerSummary[]} filter={activeFilter} />
                  </motion.div>
                )}
                {role === 'MANAGER' && (
                  <motion.div key="manager" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <ManagerView
                      data={payload as ManagerRepGroup[]}
                      filter={activeFilter}
                      onToggle={handleToggle}
                      canControl={canControl}
                    />
                  </motion.div>
                )}
                {role === 'SALES' && (
                  <motion.div key="sales" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <SalesView
                      tasks={(payload as SalesTaskData).tasks}
                      filter={activeFilter}
                      onToggle={handleToggle}
                      canControl={canControl}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </main>

      {user && (
        <TaskModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          user={user}
          teamMembers={teamMembers as any}
          createMutation={createMutation}
          onSuccess={() => {}}
        />
      )}
    </div>
  );
}
