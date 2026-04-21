import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, UserCheck } from 'lucide-react';
import { useModalEffect } from '../hooks/useModalEffect';
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from './ui/select';

interface AssignLeadModalProps {
    isOpen: boolean;
    onClose: () => void;
    leadId: number | null;
    salesUsers: { id: number; name: string; role: string }[];
    onAssign: (assigneeId: string) => Promise<void>;
    isPending: boolean;
}

const AssignLeadModalComponent: React.FC<AssignLeadModalProps> = ({ isOpen, onClose, leadId, salesUsers, onAssign, isPending }) => {
    const [selectedAssignee, setSelectedAssignee] = useState('');

    const { modalRef } = useModalEffect({ 
        isOpen, 
        onClose 
    });

    const handleClose = useCallback(() => {
        onClose();
        setSelectedAssignee('');
    }, [onClose]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedAssignee) return;
        await onAssign(selectedAssignee);
        handleClose();
    };

    console.count("AssignLeadModal Render");

    return (
        <div className="ll-modal-overlay" style={{ display: isOpen ? 'flex' : 'none' }}>
            <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }} 
                className="absolute inset-0" 
                onClick={handleClose} 
            />
            <motion.div 
                ref={modalRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="assign-lead-title"
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="ll-modal-container modal-sm min-h-0"
            >
                <div className="ll-modal-header !pb-4">
                    <div>
                        <h2 id="assign-lead-title" className="text-xl font-semibold uppercase tracking-tight text-foreground" style={{ fontFamily: 'var(--ll-font-display)' }}>Assign Lead</h2>
                        <p className="mt-2 text-xs font-bold text-muted-foreground">Choose a team member to handle this lead</p>
                    </div>
                    <button
                        onClick={handleClose}
                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-muted/40 transition-colors hover:bg-muted/60"
                    >
                        <X size={20} className="opacity-40" />
                    </button>
                </div>
                
                <form onSubmit={handleSubmit} className="flex flex-col h-full min-h-0 overflow-hidden">
                    <div className="ll-modal-body space-y-8">
                        <div className="space-y-3">
                            <label className="crm-label font-semibold text-xs tracking-wider ml-1">SELECT USER</label>
                            <div className="relative">
                                <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/40" />
                                <Select 
                                    value={selectedAssignee} 
                                    onValueChange={(val) => setSelectedAssignee(val)}
                                >
                                    <SelectTrigger className="!pl-12 !py-4 font-semibold tracking-widest bg-muted/20">
                                        <SelectValue placeholder="SELECT TEAM MEMBER..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {salesUsers.map(u => (
                                            <SelectItem key={u.id} value={String(u.id)}>{u.name.toUpperCase()} ({u.role})</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                    
                    <div className="ll-modal-footer flex gap-4">
                        <button type="button" onClick={handleClose} className="crm-btn-secondary flex-1 !py-3 !text-xs">CANCEL</button>
                        <button 
                            type="submit" 
                            disabled={isPending || !selectedAssignee} 
                            className="crm-btn-primary flex-1 !py-3 !text-xs flex items-center justify-center gap-2"
                        >
                            <UserCheck size={14} />
                            {isPending ? 'ASSIGNING...' : 'CONFIRM'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

export const AssignLeadModal = React.memo(AssignLeadModalComponent, (prev, next) => {
    return prev.isOpen === next.isOpen && prev.isPending === next.isPending && prev.salesUsers === next.salesUsers;
});
