import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User as UserIcon, X, Zap, Plus, AlertCircle, ShieldCheck } from 'lucide-react';
import { validateTaskForm, validateTaskTitle, validateDescription, type ValidationErrors } from '../utils/validation';
import { useModalEffect } from '../hooks/useModalEffect';
import type { User } from '../contexts/AuthContext';
import { TaskType } from '../api/tasks';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  teamMembers: User[];
  onSuccess: (data: TaskType) => void;
  createMutation: any; // Mutation types are complex, keeping any for now but checking types
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

  const { modalRef } = useModalEffect({
    isOpen,
    onClose: handleClose,
    disableClose: true // Form persistence safety
  });

  const salesReps = teamMembers.filter((u) => u.role === 'SALES');
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


  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="ll-modal-overlay">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0"
            // Background click disabled via hook for complex task form
          />
          
          <motion.div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="task-modal-title"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="ll-modal-container modal-md"
          >
            <AnimatePresence mode="wait">
              {!showConfirm ? (
                <motion.div
                  key="form"
                  initial={{ x: 0, opacity: 1 }}
                  exit={{ x: -20, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col h-full overflow-hidden"
                >
                  <div className="ll-modal-header relative">
                    {/* Modal Background Ornament */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-[60px] pointer-events-none" />
                    
                    <div>
                      <h2 id="task-modal-title" className="text-3xl font-semibold tracking-tight text-foreground leading-tight uppercase" style={{ fontFamily: 'var(--ll-font-display)' }}>Create Task</h2>
                      <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-primary">Schedule Operational Mission</p>
                    </div>
                    <button
                      onClick={handleClose}
                      className="w-12 h-12 flex items-center justify-center rounded-2xl transition-all group text-muted-foreground/40 hover:text-foreground hover:bg-white/5 border border-white/5"
                    >
                      <X size={20} className="group-hover:rotate-90 transition-transform" />
                    </button>
                  </div>

                  <form onSubmit={handleInitiate} className="flex flex-col h-full min-h-0 overflow-hidden">
                    <div className="ll-modal-body space-y-4">
                      {(user?.role === 'MANAGER' || user?.role === 'ADMIN') && (
                        <div className="space-y-4 p-4 rounded-3xl bg-white/[0.02] border border-white/5">
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-1">
                             <label className="text-[10px] font-black uppercase tracking-widest text-primary/80">Assignment Protocol</label>
                             <div className="flex bg-white/5 rounded-full p-1 border border-white/10 overflow-x-auto max-w-full">
                                {[
                                  { id: 'SELF', label: 'Myself' },
                                  { id: 'REP', label: 'Rep' },
                                  { id: 'TEAM', label: 'Team', disabled: isTeamDisabled }
                                ].map((opt) => (
                                  <button 
                                    key={opt.id}
                                    type="button"
                                    disabled={opt.disabled}
                                    onClick={() => { 
                                      setAssignmentMode(opt.id as any); 
                                      if (opt.id === 'SELF') setFormData({ ...formData, assignedToId: user.id });
                                    }}
                                    className={`px-4 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-wider transition-all disabled:opacity-20 whitespace-nowrap ${assignmentMode === opt.id ? 'bg-primary text-black' : 'text-muted-foreground hover:text-foreground'}`}
                                  >
                                    {opt.label}
                                  </button>
                                ))}
                             </div>
                          </div>

                          {assignmentMode === 'REP' && (
                            <div className="animate-in fade-in slide-in-from-top-2 duration-300 space-y-2">
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
                                  <ShieldCheck size={16} className="text-primary mt-0.5 shrink-0" />
                                  <div className="space-y-1">
                                     <p className="text-[10px] font-bold text-primary uppercase tracking-tight">{salesReps.length} Representatives Targeted</p>
                                     <p className="text-[9px] font-medium text-muted-foreground/60 leading-normal lowercase">Individual packets will be distributed to each verified representative.</p>
                                  </div>
                               </div>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="space-y-4">
                        <div className="space-y-2">
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
                        
                        <div className="space-y-2">
                          <label className="text-xs font-semibold uppercase tracking-wider px-1 text-muted-foreground/60">Operational Brief</label>
                          <textarea
                            className={`crm-input !bg-white/5 !border-white/10 min-h-[120px] !px-6 !py-5 resize-none text-sm font-medium leading-relaxed ${fieldErrors.description ? '!border-status-danger/50 ring-4 ring-status-danger/10' : 'focus:!border-primary/50 focus:ring-primary/10'}`}
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

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
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
                          <div className="space-y-2">
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
                    </div>

                    <div className="ll-modal-footer flex gap-6">
                      <button type="button" disabled={createMutation.isPending} onClick={handleClose} className="crm-btn-secondary w-full !py-4 !text-xs font-semibold tracking-wider">Abort Mission</button>
                      <button type="submit" disabled={createMutation.isPending} className="crm-btn-primary w-full !py-4 !text-xs font-semibold tracking-wider flex items-center justify-center gap-3">
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
                  className="flex flex-col h-full min-h-0 overflow-hidden"
                >
                  <div className="ll-modal-body flex flex-col items-center justify-center p-20 text-center space-y-10 min-h-0">
                    <div className="w-24 h-24 rounded-[2.5rem] bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto shadow-[0_0_40px_rgba(var(--primary),0.1)] shrink-0">
                       <ShieldCheck size={40} className="text-primary" />
                    </div>
                    
                    <div className="space-y-4">
                       <h2 className="text-3xl font-bold uppercase tracking-tight leading-tight">Authorize Bulk Deployment?</h2>
                       <p className="text-sm text-muted-foreground/60 max-w-sm mx-auto font-medium">
                          This will create <span className="text-primary font-bold">{salesReps.length} separate tasks</span> (one per rep). Continue?
                       </p>
                    </div>
                  </div>

                  <div className="ll-modal-footer flex flex-col gap-4">
                     <button 
                      onClick={submitTask}
                      className="crm-btn-primary w-full !py-4 !text-xs font-semibold tracking-wider"
                     >
                        Confirm Assignment
                     </button>
                     <button 
                      onClick={() => setShowConfirm(false)}
                      className="crm-btn-secondary w-full !py-3 !text-xs font-semibold tracking-wider border-none bg-transparent"
                     >
                        Back to Parameters
                     </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
