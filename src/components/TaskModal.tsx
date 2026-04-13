import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, Plus, User, AlertCircle, ShieldCheck } from 'lucide-react';
import { validateTaskForm, validateTaskTitle, validateDescription, type ValidationErrors } from '../utils/validation';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  teamMembers: any[];
  onSuccess: (data: any) => void;
  createMutation: any;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  user,
  teamMembers,
  onSuccess,
  createMutation
}) => {
  const [fieldErrors, setFieldErrors] = useState<ValidationErrors>({});
  const [assignmentMode, setAssignmentMode] = useState<'SELF' | 'REP' | 'TEAM'>('SELF');
  const [showConfirm, setShowConfirm] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM' as const,
    dueDate: new Date().toISOString().slice(0, 16),
    assignedToId: user?.id
  });

  const salesReps = teamMembers.filter((u: any) => u.role === 'SALES');
  const isTeamDisabled = salesReps.length === 0;

  const handleTaskFieldBlur = (field: 'title' | 'description' | 'dueDate') => {
    if (field === 'title') {
      const err = validateTaskTitle(formData.title);
      setFieldErrors((prev) => ({ ...prev, title: err || '' }));
    } else if (field === 'description') {
      const err = validateDescription(formData.description);
      setFieldErrors((prev) => ({ ...prev, description: err || '' }));
    } else if (field === 'dueDate') {
      setFieldErrors((prev) => ({ ...prev, dueDate: formData.dueDate ? '' : 'Due date and time are required' }));
    }
  };

  const handleInitiate = (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateTaskForm(formData);
    
    // Custom check for REP mode
    if (assignmentMode === 'REP' && !formData.assignedToId) {
        errors.assignedToId = 'Please select a representative';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    if (assignmentMode === 'TEAM') {
      setShowConfirm(true);
    } else {
      submitTask();
    }
  };

  const submitTask = async () => {
    const payload = {
        ...formData,
        assignmentType: assignmentMode === 'SELF' ? 'SELF' : (assignmentMode === 'TEAM' ? 'TEAM' : 'USER'),
        assignedToId: assignmentMode === 'TEAM' ? null : (assignmentMode === 'SELF' ? user.id : formData.assignedToId)
    };

    try {
      await createMutation.mutateAsync(payload);
      handleClose();
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  const handleClose = () => {
    onClose();
    setFieldErrors({});
    setShowConfirm(false);
    setAssignmentMode('SELF');
    setFormData({
      title: '',
      description: '',
      priority: 'MEDIUM',
      dueDate: new Date().toISOString().slice(0, 16),
      assignedToId: user?.id
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 overflow-hidden">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 backdrop-blur-xl bg-black/40 dark:bg-black/80"
        onClick={handleClose}
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 40 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 40 }}
        className="rounded-[3rem] w-full max-w-2xl relative overflow-hidden bg-card/90 backdrop-blur-2xl border border-white/10 shadow-[0_32px_120px_-20px_rgba(0,0,0,0.5)]"
      >
        <AnimatePresence mode="wait">
          {!showConfirm ? (
            <motion.div
              key="form"
              initial={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {/* Modal Background Ornament */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[100px] pointer-events-none" />
              
              <div className="px-10 py-10 flex justify-between items-start border-b border-white/5 relative z-10">
                <div>
                  <h2 className="text-3xl font-semibold tracking-tight text-foreground leading-tight uppercase" style={{ fontFamily: 'var(--ll-font-display)' }}>Create Task</h2>
                  <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-primary">Schedule Operational Mission</p>
                </div>
                <button
                  onClick={handleClose}
                  className="w-12 h-12 flex items-center justify-center rounded-2xl transition-all group text-muted-foreground/40 hover:text-foreground hover:bg-white/5 border border-white/5"
                >
                  <X size={20} className="group-hover:rotate-90 transition-transform" />
                </button>
              </div>

              <form onSubmit={handleInitiate} className="p-10 space-y-8 relative z-10">
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

                  {(user?.role === 'MANAGER' || user?.role === 'ADMIN') && (
                    <div className="space-y-6 p-6 rounded-3xl bg-white/[0.02] border border-white/5">
                      <div className="flex items-center justify-between px-1">
                         <label className="text-[10px] font-black uppercase tracking-widest text-primary/80">Assignment Protocol</label>
                         <div className="flex bg-white/5 rounded-full p-1 border border-white/10">
                            {[
                              { id: 'SELF', label: 'Myself' },
                              { id: 'REP', label: 'Specific Rep' },
                              { id: 'TEAM', label: 'Entire Team', disabled: isTeamDisabled }
                            ].map((opt) => (
                              <button 
                                key={opt.id}
                                type="button"
                                disabled={opt.disabled}
                                onClick={() => { 
                                  setAssignmentMode(opt.id as any); 
                                  if (opt.id === 'SELF') setFormData({ ...formData, assignedToId: user.id });
                                }}
                                className={`px-4 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-wider transition-all disabled:opacity-20 ${assignmentMode === opt.id ? 'bg-primary text-black' : 'text-muted-foreground hover:text-foreground'}`}
                              >
                                {opt.label}
                              </button>
                            ))}
                         </div>
                      </div>

                      {assignmentMode === 'REP' && (
                        <div className="animate-in fade-in slide-in-from-top-2 duration-300 space-y-3">
                          <select 
                            required
                            className={`crm-input !bg-white/5 !border-white/10 !h-12 !px-5 text-[10px] font-bold uppercase tracking-widest appearance-none cursor-pointer ${fieldErrors.assignedToId ? '!border-status-danger/50' : ''}`}
                            value={formData.assignedToId || ''}
                            onChange={(e) => {
                                setFormData({ ...formData, assignedToId: parseInt(e.target.value) });
                                setFieldErrors(prev => ({ ...prev, assignedToId: '' }));
                            }}
                          >
                            <option value="">Select Sales Representative</option>
                            {salesReps.map((rep: any) => (
                              <option key={rep.id} value={rep.id}>{rep.name}</option>
                            ))}
                          </select>
                          {fieldErrors.assignedToId && <p className="text-status-danger text-[9px] font-bold uppercase tracking-tighter px-1">{fieldErrors.assignedToId}</p>}
                        </div>
                      )}

                      {assignmentMode === 'TEAM' && (
                        <div className="animate-in fade-in slide-in-from-top-2 duration-300 p-4 rounded-2xl bg-primary/5 border border-primary/10">
                           <div className="flex gap-3">
                              <ShieldCheck size={16} className="text-primary mt-0.5" />
                              <div className="space-y-1">
                                 <p className="text-[10px] font-bold text-primary uppercase tracking-tight">{salesReps.length} Representatives Targeted</p>
                                 <p className="text-[9px] font-medium text-muted-foreground/60 leading-normal lowercase">This protocol will distribute individual operational packets to each verified representative in your local registry.</p>
                                 {salesReps.length > 10 && (
                                   <div className="mt-2 flex items-center gap-2 text-[9px] font-black text-status-warning uppercase italic tracking-tighter">
                                     <AlertCircle size={12} />
                                     Large Team Assignment: Confirm Carefully
                                   </div>
                                 )}
                              </div>
                           </div>
                        </div>
                      )}

                      {isTeamDisabled && assignmentMode !== 'TEAM' && (
                        <p className="text-[9px] font-bold text-status-danger/40 px-1 uppercase tracking-tighter italic">No sales representatives available for delegation</p>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex gap-6 pt-6">
                  <button type="button" disabled={createMutation.isPending} onClick={handleClose} className="w-full h-16 rounded-[1.5rem] bg-white/5 border border-white/10 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:bg-white/10 transition-all disabled:opacity-50">Abort Mission</button>
                  <button type="submit" disabled={createMutation.isPending} className="w-full h-16 rounded-[1.5rem] bg-primary text-black text-xs font-semibold uppercase tracking-wider hover:opacity-90 shadow-xl shadow-primary/20 transition-all disabled:opacity-50 flex items-center justify-center gap-3">
                    {createMutation.isPending ? 'PROCESS...' : (
                      <>
                        <Zap size={14} fill="currentColor" />
                        Initiate Protocol
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="confirm"
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 20, opacity: 0 }}
              className="p-20 text-center space-y-10"
            >
              <div className="w-24 h-24 rounded-[2.5rem] bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto shadow-[0_0_40px_rgba(var(--primary),0.1)]">
                 <ShieldCheck size={40} className="text-primary" />
              </div>
              
              <div className="space-y-4">
                 <h2 className="text-3xl font-bold uppercase tracking-tight leading-tight">Authorize Bulk Deployment?</h2>
                 <p className="text-sm text-muted-foreground/60 max-w-sm mx-auto font-medium">
                    This will create <span className="text-primary font-bold">{salesReps.length} separate tasks</span> (one per rep). Continue?
                 </p>
                 {salesReps.length > 10 && (
                   <p className="text-[10px] font-black text-status-warning uppercase italic tracking-widest mt-6 bg-status-warning/5 py-2 px-4 rounded-full border border-status-warning/10 inline-block">Large Scale Assignment Detected</p>
                 )}
              </div>

              <div className="flex flex-col gap-4 max-w-xs mx-auto pt-6">
                 <button 
                  onClick={submitTask}
                  className="w-full h-16 rounded-2xl bg-primary text-black text-xs font-bold uppercase tracking-widest hover:scale-[1.02] transition-all shadow-xl shadow-primary/20"
                 >
                    Confirm Assignment
                 </button>
                 <button 
                  onClick={() => setShowConfirm(false)}
                  className="w-full h-14 rounded-2xl text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-all"
                 >
                    Back to Parameters
                 </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
