import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [organizationSlug, setOrganizationSlug] = useState(() => localStorage.getItem('organizationSlug') || 'demo');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      localStorage.setItem('organizationSlug', organizationSlug);
      await login(organizationSlug, email, password);
      // Redirect to dashboard after successful login
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--crm-navy)' }}>
      {/* Background orbs */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,212,170,0.15), transparent 70%)', top: '-15%', right: '-10%', filter: 'blur(80px)' }} />
        <div style={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(245,158,11,0.1), transparent 70%)', bottom: '-15%', left: '-5%', filter: 'blur(80px)' }} />
      </div>

      <div className="rounded-2xl p-8 w-full max-w-md relative" style={{ background: 'var(--crm-slate)', border: '1px solid var(--crm-border)', boxShadow: '0 24px 48px rgba(0,0,0,0.18)' }}>
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #00D4AA, #6EE7B7)' }}>
              <span className="font-extrabold text-lg" style={{ color: '#0B1120' }}>LL</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-2" style={{ color: '#00D4AA', fontFamily: 'Outfit, sans-serif' }}>Lead Link CRM</h1>
          <p style={{ color: 'var(--crm-muted)' }}>Sign in to your account</p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg p-4 flex items-start gap-3" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#F87171' }} />
            <p className="text-sm" style={{ color: '#F87171' }}>{error}</p>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="organization" className="block text-sm font-medium mb-2" style={{ color: '#94A3B8' }}>
              Company / Workspace
            </label>
            <input
              id="organization"
              value={organizationSlug}
              onChange={(e) => setOrganizationSlug(e.target.value)}
              className="w-full px-4 py-3 rounded-lg focus:outline-none transition-all"
              style={{ background: 'var(--crm-navy-deep)', border: '1px solid var(--crm-border)', color: 'var(--crm-white)' }}
              placeholder="demo"
              required
            />
            <p className="mt-2 text-xs" style={{ color: 'var(--crm-muted-dim)' }}>
              Use <b>demo</b> or <b>acme</b> (seeded tenants).
            </p>
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2" style={{ color: '#94A3B8' }}>
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: '#64748B' }} />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-lg focus:outline-none transition-all"
                style={{ background: '#0B1120', border: '1px solid rgba(148,163,184,0.08)', color: '#F1F5F9' }}
                onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(0,212,170,0.4)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0,212,170,0.1)'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(148,163,184,0.08)'; e.currentTarget.style.boxShadow = 'none'; }}
                placeholder="admin@crm.com"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-2" style={{ color: '#94A3B8' }}>
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: '#64748B' }} />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-lg focus:outline-none transition-all"
                style={{ background: '#0B1120', border: '1px solid rgba(148,163,184,0.08)', color: '#F1F5F9' }}
                onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(0,212,170,0.4)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0,212,170,0.1)'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(148,163,184,0.08)'; e.currentTarget.style.boxShadow = 'none'; }}
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
            style={{ background: 'linear-gradient(135deg, #00D4AA, #00B894)', color: '#0B1120', boxShadow: '0 4px 24px rgba(0,212,170,0.25)' }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
            {!loading && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
          </button>
        </form>

        <p className="text-center text-sm mt-6" style={{ color: '#64748B' }}>
          6th Sem Mini Project Demo © 2026
        </p>
      </div>
    </div>
  );
}
