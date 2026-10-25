import { useState } from 'react';
import { ShieldCheck, Lock, Mail, ArrowRight, HeartPulse, CheckCircle2, Globe, AlertCircle, UserPlus, Crown, Stethoscope, Building2, User } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { useApp } from '@/context/AppContext';
import { supabase, supabaseConfigured } from '@/lib/supabase';
import type { UserRole } from '@/types';

const roleOptions: { value: UserRole; label: string; icon: typeof Crown; description: string }[] = [
  { value: 'admin', label: 'Admin', icon: Crown, description: 'Full platform access' },
  { value: 'provider', label: 'Provider', icon: Stethoscope, description: 'Clinical access' },
  { value: 'employer', label: 'Employer', icon: Building2, description: 'Company-scoped access' },
  { value: 'employee', label: 'Employee', icon: User, description: 'Personal records only' },
];

export function Login() {
  const { login } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [signUpRole, setSignUpRole] = useState<UserRole>('employee');
  const [demoRole, setDemoRole] = useState<UserRole>('admin');

  const inferDemoRole = (address: string): UserRole => {
    if (address.includes('admin')) return 'admin';
    if (address.includes('employer') || address.includes('hr') || address.includes('whitfield')) return 'employer';
    if (address.includes('provider') || address.includes('doctor') || address.includes('chen') || address.includes('holt') || address.includes('bello')) return 'provider';
    return demoRole;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      if (supabaseConfigured) {
        const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
        if (authError) throw authError;
        if (!data.user) throw new Error('No user returned');
      } else {
        await new Promise((resolve) => setTimeout(resolve, 700));
        login(inferDemoRole(email));
      }
    } catch (cause) {
      setError(cause instanceof Error && cause.message === 'Invalid login credentials' ? 'Invalid email or password' : 'Could not sign in. Please try again.');
    } finally { setLoading(false); }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { role: signUpRole, display_name: email.split('@')[0] } },
      });
      if (authError) throw authError;
      if (data.user) { setError('Account created. You can now sign in with your email and password.'); setIsSignUp(false); }
    } catch (cause) {
      setError(cause instanceof Error && cause.message === 'User already registered' ? 'An account with this email already exists.' : 'Could not create account. Please try again.');
    } finally { setLoading(false); }
  };

  return <div className="min-h-screen flex">
    <div className="hidden lg:flex lg:w-[48%] xl:w-[52%] bg-gradient-to-br from-brand-900 via-brand-800 to-brand-950 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-20" /><div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl" /><div className="absolute bottom-0 left-0 w-80 h-80 bg-brand-400/20 rounded-full blur-3xl" />
      <div className="relative flex flex-col justify-between p-12 xl:p-16 text-white w-full"><Logo size="lg" variant="dark" /><div className="max-w-md"><div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full mb-6"><HeartPulse size={14} className="text-teal-300" /><span className="text-xs font-semibold tracking-wide">AI-ENABLED HEALTH PLATFORM</span></div><h1 className="text-3xl xl:text-4xl font-display font-extrabold leading-tight mb-4">Occupational & travel health, managed with intelligence.</h1><p className="text-white/70 text-base leading-relaxed mb-8">Stelo Health unifies workforce medical records, travel risk assessments, and clinical appointments into one secure platform — powered by AI insights.</p><div className="space-y-3">{['Compliant occupational health screening at scale','Pre-travel risk intelligence with vaccine tracking','AI-assisted clinical decision support'].map((feature) => <div key={feature} className="flex items-center gap-3"><CheckCircle2 size={18} className="text-teal-300 shrink-0" /><span className="text-sm text-white/80">{feature}</span></div>)}</div></div><div className="flex items-center gap-6 text-white/50 text-xs"><div className="flex items-center gap-2"><Globe size={14} /><span>SOC 2 Type II</span></div><div className="flex items-center gap-2"><Lock size={14} /><span>End-to-end encrypted</span></div><div className="flex items-center gap-2"><ShieldCheck size={14} /><span>GDPR & HIPAA aligned</span></div></div></div>
    </div>
    <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 lg:px-16 xl:px-20 py-8"><div className="w-full max-w-md mx-auto"><div className="lg:hidden mb-8"><Logo size="md" /></div><div className="mb-8"><h2 className="text-2xl font-display font-bold text-ink-900 mb-1.5">{isSignUp ? 'Create your account' : 'Welcome back'}</h2><p className="text-ink-500 text-sm">{supabaseConfigured ? (isSignUp ? 'Sign up to access the Stelo Health platform.' : 'Sign in to the Stelo Health platform.') : 'Enter any email and password, then click sign in — demo mode uses mock data.'}</p></div>
      {error && <div className="mb-5 flex items-start gap-2.5 p-3.5 bg-danger-50 border border-danger-200 rounded-lg"><AlertCircle size={16} className="text-danger-600 shrink-0 mt-0.5" /><p className="text-sm text-danger-700">{error}</p></div>}
      <form onSubmit={isSignUp ? handleSignUp : handleLogin} className="space-y-5"><div><label className="block text-sm font-semibold text-ink-700 mb-1.5">Email address</label><div className="relative"><Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" /><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" className="input pl-10" required /></div></div><div><label className="block text-sm font-semibold text-ink-700 mb-1.5">Password</label><div className="relative"><Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" /><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="input pl-10" required minLength={6} /></div></div>{!isSignUp && supabaseConfigured && <div className="flex items-center justify-between text-sm"><label className="flex items-center gap-2 text-ink-600 cursor-pointer"><input type="checkbox" className="w-4 h-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500" defaultChecked /><span>Remember me</span></label><button type="button" className="text-brand-600 font-medium hover:text-brand-700">Forgot password?</button></div>}<button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base">{loading ? <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{isSignUp ? 'Creating account...' : 'Signing in...'}</span> : isSignUp ? <><UserPlus size={18} />Create Account</> : <>Sign In to Stelo Health<ArrowRight size={18} /></>}</button></form>
      {supabaseConfigured && isSignUp && (
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-ink-700 mb-1">Account Type</label>
          <div className="grid grid-cols-2 gap-2">
            {roleOptions.map((opt) => {
              const Icon = opt.icon;
              const active = signUpRole === opt.value;
              return (
                <button key={opt.value} type="button" onClick={() => setSignUpRole(opt.value)} className={`flex items-center gap-2 p-3 rounded-lg border text-left transition-all ${active ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-ink-200 bg-white text-ink-600 hover:border-ink-300'}`}>
                  <Icon size={18} className={active ? 'text-brand-600' : 'text-ink-400'} />
                  <div>
                    <p className="text-sm font-semibold">{opt.label}</p>
                    <p className="text-xs text-ink-400">{opt.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
          {signUpRole !== 'employee' && (
            <p className="text-xs text-ink-400">The first account created with a non-employee role gets that role. After an admin exists, all new sign-ups default to Employee.</p>
          )}
        </div>
      )}
      {supabaseConfigured && <div className="mt-6 text-center"><button type="button" onClick={() => { setIsSignUp(!isSignUp); setError(''); }} className="text-sm text-brand-600 font-medium hover:text-brand-700">{isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}</button></div>}
      {!supabaseConfigured && <div className="mt-6 p-3.5 bg-ink-50 rounded-lg border border-ink-100"><p className="text-xs text-ink-500 text-center"><strong className="text-ink-700">Demo mode:</strong> enter any email and password, then click sign in.</p>
        <div className="mt-3">
          <label className="block text-sm font-semibold text-ink-700 mb-1.5">Sign in as</label>
          <div className="grid grid-cols-2 gap-2">
            {roleOptions.map((opt) => {
              const Icon = opt.icon;
              const active = demoRole === opt.value;
              return (
                <button key={opt.value} type="button" onClick={() => setDemoRole(opt.value)} className={`flex items-center gap-2 p-2.5 rounded-lg border text-left transition-all ${active ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-ink-200 bg-white text-ink-600 hover:border-ink-300'}`}>
                  <Icon size={16} className={active ? 'text-brand-600' : 'text-ink-400'} />
                  <div>
                    <p className="text-sm font-semibold">{opt.label}</p>
                    <p className="text-xs text-ink-400">{opt.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>}<p className="text-center text-xs text-ink-400 mt-6">© 2025 Stelo Health. All rights reserved.</p></div></div>
  </div>;
}
