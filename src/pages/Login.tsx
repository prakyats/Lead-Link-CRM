import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Mail, Lock, ArrowRight, AlertCircle, CheckCircle2, Loader2, Building2, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { validateLoginForm, validateEmail, validatePassword, validateRequired, normalizeEmail } from '../utils/validation';

const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.6,
            staggerChildren: 0.1,
        },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
};

export default function Login() {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [organizationSlug, setOrganizationSlug] = useState(() => localStorage.getItem('organizationSlug') || 'demo');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    const validateForm = () => {
        const errors = validateLoginForm({
            organizationSlug,
            email,
            password
        });
        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleBlur = (field: 'organization' | 'email' | 'password') => {
        if (field === 'organization') {
            const err = validateRequired(organizationSlug, 'Workspace ID');
            setFieldErrors(prev => ({ ...prev, organization: err || '' }));
        } else if (field === 'email') {
            const err = validateEmail(email);
            setFieldErrors(prev => ({ ...prev, email: err || '' }));
        } else if (field === 'password') {
            const err = validatePassword(password);
            setFieldErrors(prev => ({ ...prev, password: err || '' }));
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setFieldErrors({});

        if (!validateForm()) {
            toast.error('Please fix the errors in the form');
            return;
        }

        setLoading(true);

        try {
            localStorage.setItem('organizationSlug', organizationSlug);
            await login(organizationSlug, normalizeEmail(email), password);
            
            // Premium Success Sequence
            setIsSuccess(true);
            toast.success('Access Granted! Welcome back.', {
                description: 'Redirecting to your dashboard...'
            });
            
            setTimeout(() => {
                navigate('/dashboard');
            }, 1500);
        } catch (err: any) {
            const errorMsg = err.response?.data?.error || err.message || 'Verification failed';
            
            if (errorMsg === 'Workspace not found') {
                setFieldErrors({ organization: 'This workspace ID does not exist' });
                toast.error('Workspace Not Found', { description: 'Please check your Workspace ID (e.g., demo).' });
            } else if (errorMsg === 'Account not found') {
                setFieldErrors({ email: 'User account not found' });
                toast.error('Login Failed', { description: 'This email is not registered in our records for this workspace.' });
            } else if (errorMsg === 'Incorrect password') {
                setFieldErrors({ password: 'Password does not match our records' });
                toast.error('Authentication Error', { description: 'Incorrect password. Please try again.' });
            } else {
                toast.error('Security Check Failed', { description: errorMsg });
                setFieldErrors({ global: errorMsg });
            }
        } finally {
            setLoading(false);
        }
    };

    const inputClasses = (fieldName: string) => `
        w-full pl-10 pr-12 py-3.5 rounded-2xl focus:outline-none transition-all duration-500
        text-foreground placeholder:text-muted-foreground/50 font-medium
        ${fieldErrors[fieldName] 
            ? 'border-red-500/50 bg-red-500/5 ring-4 ring-red-500/10' 
            : 'border-border bg-muted/20 hover:bg-muted/30 focus:border-[#00D4AA] focus:ring-8 focus:ring-[#00D4AA]/5'
        }
        border backdrop-blur-sm
    `;

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-background">
            {/* Cinematic Background */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-[#00D4AA]/10 blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] rounded-full bg-amber-500/5 blur-[120px]" />
                <div 
                    className="absolute inset-0 opacity-[0.03]" 
                    style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #94A3B8 1px, transparent 0)', backgroundSize: '40px 40px' }} 
                />
            </div>

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="w-full max-w-md relative z-10"
            >
                <AnimatePresence mode="wait">
                    {!isSuccess ? (
                        <motion.div
                            key="login-form"
                            exit={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
                            transition={{ duration: 0.4 }}
                            className="p-10 rounded-[2.5rem] bg-card/40 border border-white/5 backdrop-blur-3xl shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] ring-1 ring-white/10 relative z-10 overflow-hidden"
                        >
                            <div className="text-center mb-8">
                                <motion.div variants={itemVariants} className="flex justify-center mb-6">
                                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center relative group overflow-hidden" 
                                         style={{ background: 'linear-gradient(135deg, #00D4AA, #00B894)' }}>
                                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                                        <span className="font-semibold text-xl text-[#020617] relative z-10">LL</span>
                                    </div>
                                </motion.div>
                                
                                <motion.h1 variants={itemVariants} className="text-3xl font-bold tracking-tight text-foreground mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
                                    LeadLink <span className="text-[#00D4AA]">CRM</span>
                                </motion.h1>
                                <motion.p variants={itemVariants} className="text-muted-foreground text-sm">
                                    Enter your credentials to access the console
                                </motion.p>
                            </div>

                            <form onSubmit={handleLogin} className="space-y-5">
                                <motion.div variants={itemVariants}>
                                    <label className="block text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2 ml-1">
                                        Workspace ID
                                    </label>
                                    <div className="relative">
                                        <Building2 className={`absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 transition-colors ${fieldErrors.organization ? 'text-red-400' : 'text-slate-500'}`} />
                                        <input
                                            value={organizationSlug}
                                            onChange={(e) => setOrganizationSlug(e.target.value)}
                                            onBlur={() => handleBlur('organization')}
                                            className={inputClasses('organization')}
                                            placeholder="demo"
                                            required
                                            autoFocus
                                            maxLength={50}
                                        />
                                    </div>
                                    <AnimatePresence>
                                        {fieldErrors.organization && (
                                            <motion.p 
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="text-red-400 text-xs mt-2 ml-1"
                                            >
                                                {fieldErrors.organization}
                                            </motion.p>
                                        )}
                                    </AnimatePresence>
                                </motion.div>

                                <motion.div variants={itemVariants}>
                                    <label className="block text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2 ml-1">
                                        Email Address
                                    </label>
                                    <div className="relative">
                                        <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 transition-colors ${fieldErrors.email ? 'text-red-400' : 'text-slate-500'}`} />
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            onBlur={() => handleBlur('email')}
                                            className={inputClasses('email')}
                                            placeholder="admin@leadlink.com"
                                            required
                                            maxLength={100}
                                        />
                                    </div>
                                    <AnimatePresence>
                                        {fieldErrors.email && (
                                            <motion.p 
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="text-red-400 text-xs mt-2 ml-1"
                                            >
                                                {fieldErrors.email}
                                            </motion.p>
                                        )}
                                    </AnimatePresence>
                                </motion.div>

                                <motion.div variants={itemVariants}>
                                    <label className="block text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2 ml-1">
                                        Secure Password
                                    </label>
                                    <div className="relative">
                                        <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 transition-colors ${fieldErrors.password ? 'text-red-400' : 'text-slate-500'}`} />
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            onBlur={() => handleBlur('password')}
                                            className={inputClasses('password')}
                                            placeholder="••••••••"
                                            required
                                            maxLength={100}
                                        />
                                        <button 
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-[#00D4AA] transition-colors"
                                        >
                                            {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                                        </button>
                                    </div>
                                    <AnimatePresence>
                                        {fieldErrors.password && (
                                            <motion.p 
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="text-red-400 text-xs mt-2 ml-1"
                                            >
                                                {fieldErrors.password}
                                            </motion.p>
                                        )}
                                    </AnimatePresence>
                                </motion.div>

                                <motion.div variants={itemVariants} className="pt-2">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full py-4 rounded-xl font-bold transition-all relative overflow-hidden group disabled:opacity-70"
                                        style={{ background: 'linear-gradient(135deg, #00D4AA, #00B894)', color: '#020617' }}
                                    >
                                        <div className="absolute inset-0 bg-white/20 translate-x-full group-hover:translate-x-0 transition-transform duration-500" />
                                        <span className="relative z-10 flex items-center justify-center gap-2">
                                            {loading ? (
                                                <>
                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                    Verifying...
                                                </>
                                            ) : (
                                                <>
                                                    Sign In to Console
                                                    <motion.span
                                                        animate={{ x: [0, 4, 0] }}
                                                        transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                                                    >
                                                        <ArrowRight className="w-5 h-5" />
                                                    </motion.span>
                                                </>
                                            )}
                                        </span>
                                    </button>
                                </motion.div>
                            </form>

                            <motion.div variants={itemVariants} className="mt-8 pt-6 border-t border-border/10 text-center">
                                <p className="text-[11px] font-medium text-muted-foreground/60 uppercase tracking-widest leading-relaxed">
                                    Secure Multi-Tenant Infrastructure <br />
                                    © 2026 LEADLINK CRM ENGINEERING
                                </p>
                            </motion.div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="success-state"
                            initial={{ opacity: 0, scale: 0.9, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            className="bg-card/40 backdrop-blur-3xl border border-[#00D4AA]/20 p-16 rounded-[2.5rem] text-center shadow-2xl ring-1 ring-[#00D4AA]/10"
                        >
                            <motion.div 
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", damping: 10, stiffness: 100, delay: 0.2 }}
                                className="w-20 h-20 bg-[#00D4AA] rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_40px_rgba(0,212,170,0.4)]"
                            >
                                <CheckCircle2 className="w-10 h-10 text-primary-foreground" />
                            </motion.div>
                            <h2 className="text-3xl font-semibold text-foreground mb-3 tracking-tight outline-none">Access Granted</h2>
                            <p className="text-muted-foreground font-medium">Redirecting to system core...</p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
}
