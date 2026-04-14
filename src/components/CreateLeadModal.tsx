import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Building2, User, Mail, Phone, IndianRupee, Activity, Zap } from 'lucide-react';
import { useModalEffect } from '../hooks/useModalEffect';
import { validateLeadForm, validateCompany, validateName, validateEmail, validatePhone, type ValidationErrors } from '../utils/validation';

interface CreateLeadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => Promise<void>;
    isPending: boolean;
}

const CreateLeadModalComponent: React.FC<CreateLeadModalProps> = ({ isOpen, onClose, onSubmit, isPending }) => {
    const [fieldErrors, setFieldErrors] = useState<ValidationErrors>({});
    const [formData, setFormData] = useState({
        company: '',
        contact: '',
        email: '',
        phone: '',
        value: 0,
        priority: 'MEDIUM' as const,
        stage: 'NEW' as const
    });

    const { modalRef } = useModalEffect({ 
        isOpen, 
        onClose,
        disableClose: true 
    });

    const handleClose = useCallback(() => {
        onClose();
        setFieldErrors({});
        setFormData({
            company: '',
            contact: '',
            email: '',
            phone: '',
            value: 0,
            priority: 'MEDIUM',
            stage: 'NEW'
        });
    }, [onClose]);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'value' ? parseFloat(value) || 0 : value
        }));
    }, []);

    const handleBlur = (field: string) => {
        if (field === 'company') {
            const err = validateCompany(formData.company);
            setFieldErrors(prev => ({ ...prev, company: err || '' }));
        } else if (field === 'contact') {
            const err = validateName(formData.contact, 'Contact name');
            setFieldErrors(prev => ({ ...prev, contact: err || '' }));
        } else if (field === 'email') {
            const err = validateEmail(formData.email);
            setFieldErrors(prev => ({ ...prev, email: err || '' }));
        } else if (field === 'phone') {
            const err = validatePhone(String(formData.phone || ''));
            setFieldErrors(prev => ({ ...prev, phone: err || '' }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const errors = validateLeadForm(formData);
        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            return;
        }
        await onSubmit(formData);
        handleClose();
    };

    console.count("CreateLeadModal Render");

    return (
        <div className="ll-modal-overlay" style={{ display: isOpen ? 'flex' : 'none' }}>
            <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }} 
                className="absolute inset-0" 
            />
            <motion.div 
                ref={modalRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="create-lead-title"
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="ll-modal-container modal-md"
            >
                <div className="ll-modal-header">
                    <div>
                        <h2 id="create-lead-title" className="text-2xl font-semibold uppercase tracking-tight text-foreground" style={{ fontFamily: 'var(--ll-font-display)' }}>Add Lead</h2>
                        <p className="mt-2 font-bold text-sm text-muted-foreground flex items-center gap-2">
                            <Activity size={14} className="text-primary animate-pulse" />
                            Enter details for the new prospect
                        </p>
                    </div>
                    <button
                        onClick={handleClose}
                        className="w-11 h-11 flex items-center justify-center rounded-2xl transition-all group hover:bg-muted"
                    >
                        <X className="w-6 h-6 group-hover:rotate-90 transition-transform opacity-40 group-hover:opacity-100" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col h-full min-h-0 overflow-hidden">
                    <div className="ll-modal-body space-y-10">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div className="space-y-3">
                                <label className="crm-label font-semibold text-xs tracking-wider ml-1">COMPANY NAME</label>
                                <div className="relative group">
                                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-all text-muted-foreground/40 group-focus-within:text-primary group-focus-within:scale-110" />
                                    <input
                                        required
                                        name="company"
                                        type="text"
                                        className={`crm-input !pl-12 !py-4 font-bold border-border/40 focus:border-primary/40 focus:bg-primary/[0.02] ${fieldErrors.company ? 'border-red-500/50' : ''}`}
                                        placeholder="e.g. LeadLink Enterprise"
                                        value={formData.company}
                                        onChange={handleChange}
                                        onBlur={() => handleBlur('company')}
                                    />
                                </div>
                                {fieldErrors.company && <p className="text-red-400 text-[10px] font-bold uppercase tracking-widest ml-1">{fieldErrors.company}</p>}
                            </div>
                            <div className="space-y-3">
                                <label className="crm-label font-semibold text-xs tracking-wider ml-1">CONTACT PERSON</label>
                                <div className="relative group">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-all text-muted-foreground/40 group-focus-within:text-primary group-focus-within:scale-110" />
                                    <input
                                        required
                                        name="contact"
                                        type="text"
                                        className={`crm-input !pl-12 !py-4 font-bold border-border/40 focus:border-primary/40 focus:bg-primary/[0.02] ${fieldErrors.contact ? 'border-red-500/50' : ''}`}
                                        placeholder="Lead representative"
                                        value={formData.contact}
                                        onChange={handleChange}
                                        onBlur={() => handleBlur('contact')}
                                    />
                                </div>
                                {fieldErrors.contact && <p className="text-red-400 text-[10px] font-bold uppercase tracking-widest ml-1">{fieldErrors.contact}</p>}
                            </div>
                            <div className="space-y-3">
                                <label className="crm-label font-semibold text-xs tracking-wider ml-1">EMAIL ADDRESS</label>
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-all text-muted-foreground/40 group-focus-within:text-primary group-focus-within:scale-110" />
                                    <input
                                        required
                                        name="email"
                                        type="email"
                                        className={`crm-input !pl-12 !py-4 font-bold border-border/40 focus:border-primary/40 focus:bg-primary/[0.02] ${fieldErrors.email ? 'border-red-500/50' : ''}`}
                                        placeholder="contact@entity.com"
                                        value={formData.email}
                                        onChange={handleChange}
                                        onBlur={() => handleBlur('email')}
                                    />
                                </div>
                                {fieldErrors.email && <p className="text-red-400 text-[10px] font-bold uppercase tracking-widest ml-1">{fieldErrors.email}</p>}
                            </div>
                            <div className="space-y-3">
                                <label className="crm-label font-semibold text-xs tracking-wider ml-1">PHONE NUMBER</label>
                                <div className="relative group">
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-all text-muted-foreground/40 group-focus-within:text-primary group-focus-within:scale-110" />
                                    <input
                                        name="phone"
                                        type="tel"
                                        className={`crm-input !pl-12 !py-4 font-bold border-border/40 focus:border-primary/40 focus:bg-primary/[0.02] ${fieldErrors.phone ? 'border-red-500/50' : ''}`}
                                        placeholder="Voice frequency"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        onBlur={() => handleBlur('phone')}
                                    />
                                </div>
                                {fieldErrors.phone && <p className="text-red-400 text-[10px] font-bold uppercase tracking-widest ml-1">{fieldErrors.phone}</p>}
                            </div>
                            <div className="space-y-3">
                                <label className="crm-label font-semibold text-xs tracking-wider ml-1">ESTIMATED VALUE (₹)</label>
                                <div className="relative group">
                                    <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-all text-muted-foreground/40 group-focus-within:text-primary group-focus-within:scale-110" />
                                    <input required name="value" type="number" className="crm-input !pl-12 !py-4 font-bold border-border/40 bg-muted/20" placeholder="Revenue forecast" value={formData.value} onChange={handleChange} />
                                </div>
                            </div>
                            <div className="space-y-3">
                                <label className="crm-label font-semibold text-xs tracking-wider ml-1">PRIORITY</label>
                                <select name="priority" className="crm-input !py-4 font-semibold tracking-widest bg-muted/20 border-border/40 cursor-pointer" value={formData.priority} onChange={handleChange}>
                                    <option value="LOW">Low Priority</option>
                                    <option value="MEDIUM">Medium Priority</option>
                                    <option value="HIGH">High Priority</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="ll-modal-footer flex gap-6">
                        <button type="button" disabled={isPending} onClick={handleClose} className="crm-btn-secondary w-full !py-4 !text-xs font-semibold tracking-wider">CANCEL</button>
                        <button type="submit" disabled={isPending} className="crm-btn-primary w-full !py-4 !text-xs font-semibold tracking-wider">
                            {isPending ? 'SAVING...' : 'CREATE LEAD'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

export const CreateLeadModal = React.memo(CreateLeadModalComponent, (prev, next) => {
    return prev.isOpen === next.isOpen && prev.isPending === next.isPending;
});
