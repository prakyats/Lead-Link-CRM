import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UserPlus, Eye, EyeOff, ChevronDown, Loader2, Zap } from 'lucide-react';
import { useModalEffect } from '../hooks/useModalEffect';
import { validateUserForm } from '../utils/validation';
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from './ui/select';

interface ProvisioningModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => Promise<void>;
    isPending: boolean;
    availableManagers: { id: number; name: string }[];
    currentUserRole?: string;
}

const ProvisioningModalComponent: React.FC<ProvisioningModalProps> = ({ 
    isOpen, 
    onClose, 
    onSubmit, 
    isPending, 
    availableManagers, 
    currentUserRole 
}) => {
    const [formData, setFormData] = useState({ 
        name: '', 
        email: '', 
        password: '', 
        role: 'SALES', 
        managerId: '' 
    });
    const [showPassword, setShowPassword] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    const { modalRef } = useModalEffect({
        isOpen,
        onClose,
        disableClose: true 
    });

    const handleClose = useCallback(() => {
        onClose();
        setFormData({ name: '', email: '', password: '', role: 'SALES', managerId: '' });
        setFieldErrors({});
        setShowPassword(false);
    }, [onClose]);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    }, []);

    const handleSelectChange = useCallback((name: string, value: string) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const errors = validateUserForm({
            name: formData.name,
            email: formData.email,
            password: formData.password,
        });
        
        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            return;
        }

        await onSubmit(formData);
        handleClose();
    };

    console.count("ProvisioningModal Render");

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
                aria-labelledby="provisioning-title"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="ll-modal-container modal-md"
            >
                <div className="ll-modal-header">
                    <div className="flex items-center gap-5">
                        <div className="w-16 h-16 rounded-[1.5rem] bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                            <UserPlus size={32} />
                        </div>
                        <div>
                            <h3 id="provisioning-title" className="text-3xl font-semibold tracking-tight text-foreground uppercase" style={{ fontFamily: 'var(--ll-font-display)' }}>Add Entry</h3>
                            <p className="text-xs font-semibold text-primary uppercase tracking-wider mt-1">Assigning operations frontline protocol</p>
                        </div>
                    </div>
                    <button 
                        onClick={handleClose}
                        className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-muted-foreground hover:text-foreground transition-all group border border-white/5"
                    >
                        <X size={20} className="group-hover:rotate-90 transition-transform" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col h-full min-h-0 overflow-hidden">
                    <div className="ll-modal-body space-y-10">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <label className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider ml-2">Full Name</label>
                                <input 
                                    name="name"
                                    className={`crm-input !bg-white/5 !border-white/10 !h-14 !px-6 text-sm font-bold ${fieldErrors.name ? '!border-status-danger/40 ring-2 ring-status-danger/10' : ''}`}
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="E.G. SATOSHI NAKAMOTO"
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider ml-2">Email Signature</label>
                                <input 
                                    name="email"
                                    className={`crm-input !bg-white/5 !border-white/10 !h-14 !px-6 text-sm font-bold ${fieldErrors.email ? '!border-status-danger/40 ring-2 ring-status-danger/10' : ''}`}
                                    type="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="user@company.com"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <label className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider ml-2">Access Token</label>
                                <div className="relative">
                                    <input 
                                        name="password"
                                        className={`crm-input !bg-white/5 !border-white/10 !h-14 !px-6 text-sm font-bold ${fieldErrors.password ? '!border-status-danger/40 ring-2 ring-status-danger/10' : ''}`}
                                        type={showPassword ? "text" : "password"}
                                        value={formData.password}
                                        onChange={handleChange}
                                        placeholder="••••••••"
                                    />
                                    <button 
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-6 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-primary transition-colors"
                                    >
                                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                            </div>
                            
                            <div className="space-y-3">
                                <label className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider ml-2">Assigned Unit</label>
                                <Select 
                                    value={formData.role} 
                                    onValueChange={(val) => handleSelectChange('role', val)}
                                    disabled={currentUserRole === 'MANAGER'}
                                >
                                    <SelectTrigger className="!h-14 !px-6">
                                        <SelectValue placeholder="SELECT ROLE" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="SALES">SALES OPERATIONS</SelectItem>
                                        {currentUserRole === 'ADMIN' && <SelectItem value="MANAGER">COMMAND LEAD (MANAGER)</SelectItem>}
                                        {currentUserRole === 'ADMIN' && <SelectItem value="ADMIN">ROOT ACCESS (ADMIN)</SelectItem>}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {currentUserRole === 'ADMIN' && formData.role === 'SALES' && (
                            <div className="space-y-3 animate-in slide-in-from-top-4">
                                <label className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider ml-2">Reporting Command Center</label>
                                <Select 
                                    value={formData.managerId} 
                                    onValueChange={(val) => handleSelectChange('managerId', val)}
                                >
                                    <SelectTrigger className="!h-14 !px-6">
                                        <SelectValue placeholder="TEAM MEMBER" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none" className="opacity-40 italic">Team Member</SelectItem>
                                        {availableManagers.map(m => (
                                            <SelectItem key={m.id} value={m.id.toString()}>{m.name.toUpperCase()}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    </div>

                    <div className="ll-modal-footer flex items-center gap-6">
                        <button 
                            type="button"
                            onClick={handleClose}
                            className="crm-btn-secondary flex-1 !py-4 !text-xs font-semibold tracking-wider"
                        >
                            Abort
                        </button>
                        <button 
                            type="submit"
                            disabled={isPending}
                            className="crm-btn-primary flex-[2] !py-4 !text-xs font-semibold tracking-wider flex items-center justify-center gap-4"
                        >
                            {isPending ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <Zap size={16} fill="currentColor" />
                            )}
                            INITIALIZE
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

export const ProvisioningModal = React.memo(ProvisioningModalComponent, (prev, next) => {
    return prev.isOpen === next.isOpen && prev.isPending === next.isPending && prev.availableManagers === next.availableManagers;
});
