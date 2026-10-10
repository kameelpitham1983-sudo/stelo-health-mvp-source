import { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  Mail,
  ArrowRight,
  Building2,
  Stethoscope,
  User as UserIcon,
  HeartPulse,
  CheckCircle2,
  Globe,
} from 'lucide-react';
import { Logo } from '@/components/Logo';
import { roles } from '@/data/mockData';
import { useApp } from '@/context/AppContext';
import type { UserRole } from '@/types';

const roleIcons: Record<UserRole, typeof Building2> = {
  admin: ShieldCheck,
  employer: Building2,
  provider: Stethoscope,
  employee: UserIcon,
};

export function Login() {
  const { login } = useApp();
  const [selectedRole, setSelectedRole] = useState<UserRole>('admin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      login(selectedRole);
      setLoading(false);
    }, 700);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel — brand / hero */}
      <div className="hidden lg:flex lg:w-[48%] xl:w-[52%] bg-gradient-to-br from-brand-900 via-brand-800 to-brand-950 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-20" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-brand-400/20 rounded-full blur-3xl" />

        <div className="relative flex flex-col justify-between p-12 xl:p-16 text-white w-full">
          <Logo size="lg" variant="dark" />

          <div className="max-w-md">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full mb-6">
              <HeartPulse size={14} className="text-teal-300" />
              <span className="text-xs font-semibold tracking-wide">AI-ENABLED HEALTH PLATFORM</span>
            </div>
            <h1 className="text-3xl xl:text-4xl font-display font-extrabold leading-tight mb-4">
              Occupational & travel health, managed with intelligence.
            </h1>
            <p className="text-white/70 text-base leading-relaxed mb-8">
              Stelo Health unifies workforce medical records, travel risk assessments, and clinical appointments into one secure platform — powered by AI insights.
            </p>

            <div className="space-y-3">
              {[
                'Compliant occupational health screening at scale',
                'Pre-travel risk intelligence with vaccine tracking',
                'AI-assisted clinical decision support',
              ].map((feature) => (
                <div key={feature} className="flex items-center gap-3">
                  <CheckCircle2 size={18} className="text-teal-300 shrink-0" />
                  <span className="text-sm text-white/80">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-6 text-white/50 text-xs">
            <div className="flex items-center gap-2">
              <Globe size={14} />
              <span>SOC 2 Type II</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock size={14} />
              <span>End-to-end encrypted</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck size={14} />
              <span>GDPR & HIPAA aligned</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel — login form */}
      <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 lg:px-16 xl:px-20 py-8">
        <div className="w-full max-w-md mx-auto">
          <div className="lg:hidden mb-8">
            <Logo size="md" />
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-display font-bold text-ink-900 mb-1.5">Welcome back</h2>
            <p className="text-ink-500 text-sm">Select your role and sign in to the Stelo Health platform.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-ink-700 mb-2.5">Select your role</label>
              <div className="grid grid-cols-2 gap-2.5">
                {roles.map((role) => {
                  const Icon = roleIcons[role.id];
                  const active = selectedRole === role.id;
                  return (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => setSelectedRole(role.id)}
                      className={`flex flex-col items-start gap-2 p-3.5 rounded-xl border-2 transition-all duration-200 text-left ${
                        active
                          ? 'border-brand-500 bg-brand-50 ring-4 ring-brand-500/10'
                          : 'border-ink-200 bg-white hover:border-ink-300'
                      }`}
                    >
                      <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${active ? 'bg-brand-600 text-white' : 'bg-ink-100 text-ink-500'}`}>
                        <Icon size={18} />
                      </div>
                      <span className={`text-xs font-semibold leading-tight ${active ? 'text-brand-700' : 'text-ink-700'}`}>
                        {role.label}
                      </span>
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-ink-400 mt-2.5">{roles.find((r) => r.id === selectedRole)?.description}</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-ink-700 mb-1.5">Email address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="input pl-10"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-ink-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input pl-10"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-ink-600 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500" defaultChecked />
                <span>Remember me</span>
              </label>
              <button type="button" className="text-brand-600 font-medium hover:text-brand-700">Forgot password?</button>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base">
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : (
                <>
                  Sign In to Stelo Health
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 p-3.5 bg-ink-50 rounded-lg border border-ink-100">
            <p className="text-xs text-ink-500 text-center">
              <strong className="text-ink-700">Demo mode:</strong> choose a role and click sign in — no real credentials needed.
            </p>
          </div>

          <p className="text-center text-xs text-ink-400 mt-6">
            © 2025 Stelo Health. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
