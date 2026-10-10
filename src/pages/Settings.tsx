import { useState } from 'react';
import { User, Building2, Bell, Shield, Globe, Stethoscope, Save, Check } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { roles } from '@/data/mockData';

type Tab = 'profile' | 'company' | 'notifications' | 'security' | 'preferences';

export function Settings() {
  const { user } = useApp();
  const [tab, setTab] = useState<Tab>('profile');
  const [saved, setSaved] = useState(false);
  if (!user) return null;

  const roleInfo = roles.find((r) => r.id === user.role);

  const tabs: { id: Tab; label: string; icon: typeof User }[] = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'company', label: 'Company', icon: Building2 },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'preferences', label: 'Preferences', icon: Globe },
  ];

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-display font-bold text-ink-900">Settings</h2>
        <p className="text-sm text-ink-500">Manage your account and platform preferences</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Tab nav */}
        <div className="lg:w-56 shrink-0">
          <div className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible">
            {tabs.map((t) => {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                    active ? 'bg-brand-50 text-brand-700' : 'text-ink-600 hover:bg-ink-50'
                  }`}
                >
                  <Icon size={16} className={active ? 'text-brand-600' : 'text-ink-400'} />
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab content */}
        <div className="flex-1">
          <div className="card p-5 lg:p-6">
            {tab === 'profile' && (
              <div className="space-y-5">
                <h3 className="font-display font-bold text-ink-900">Profile information</h3>
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white text-xl font-bold">
                    {user.avatarInitials}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-ink-900">{user.name}</p>
                    <p className="text-xs text-ink-400">{roleInfo?.label}</p>
                    <button className="text-xs text-brand-600 font-medium hover:text-brand-700 mt-1">Change avatar</button>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><label className="block text-sm font-semibold text-ink-700 mb-1.5">Full name</label><input type="text" defaultValue={user.name} className="input" /></div>
                  <div><label className="block text-sm font-semibold text-ink-700 mb-1.5">Email</label><input type="email" defaultValue={user.email} className="input" /></div>
                  <div><label className="block text-sm font-semibold text-ink-700 mb-1.5">Job title</label><input type="text" defaultValue={user.jobTitle} className="input" /></div>
                  <div><label className="block text-sm font-semibold text-ink-700 mb-1.5">Role</label><input type="text" defaultValue={roleInfo?.label} disabled className="input bg-ink-50 text-ink-500" /></div>
                </div>
              </div>
            )}

            {tab === 'company' && (
              <div className="space-y-5">
                <h3 className="font-display font-bold text-ink-900">Company details</h3>
                <p className="text-sm text-ink-500">{user.company ? `Connected to ${user.company}` : 'You are a Stelo Health platform administrator — no single company is assigned.'}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><label className="block text-sm font-semibold text-ink-700 mb-1.5">Company name</label><input type="text" defaultValue={user.company || 'Stelo Health'} className="input" /></div>
                  <div><label className="block text-sm font-semibold text-ink-700 mb-1.5">Industry</label><input type="text" defaultValue="Logistics & Supply Chain" className="input" /></div>
                  <div><label className="block text-sm font-semibold text-ink-700 mb-1.5">Primary location</label><input type="text" defaultValue="Rotterdam, NL" className="input" /></div>
                  <div><label className="block text-sm font-semibold text-ink-700 mb-1.5">Employee count</label><input type="text" defaultValue="2,840" className="input" /></div>
                </div>
              </div>
            )}

            {tab === 'notifications' && (
              <div className="space-y-5">
                <h3 className="font-display font-bold text-ink-900">Notification preferences</h3>
                <div className="space-y-3">
                  {[
                    { label: 'Appointment reminders', desc: 'Get notified about upcoming appointments' },
                    { label: 'Medical assessment alerts', desc: 'Alerts for overdue or pending medicals' },
                    { label: 'Travel health warnings', desc: 'Risk alerts for upcoming travel deployments' },
                    { label: 'Document review requests', desc: 'Notifications when documents need your review' },
                    { label: 'Stelo AI insights', desc: 'Weekly AI-generated health insights summary' },
                    { label: 'Compliance reports', desc: 'Monthly compliance digest' },
                  ].map((item, i) => (
                    <div key={item.label} className="flex items-center justify-between py-3 border-b border-ink-100 last:border-0">
                      <div>
                        <p className="text-sm font-semibold text-ink-900">{item.label}</p>
                        <p className="text-xs text-ink-400">{item.desc}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" defaultChecked={i < 4} className="sr-only peer" />
                        <div className="w-10 h-5.5 bg-ink-200 rounded-full peer-checked:bg-brand-600 transition-colors">
                          <span className="absolute top-0.5 left-0.5 w-4.5 h-4.5 bg-white rounded-full transition-transform peer-checked:translate-x-4.5 shadow-sm" style={{ width: '18px', height: '18px', transform: 'none' }} />
                        </div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === 'security' && (
              <div className="space-y-5">
                <h3 className="font-display font-bold text-ink-900">Security settings</h3>
                <div className="p-4 bg-success-50 rounded-lg flex items-center gap-3">
                  <Shield size={18} className="text-success-600" />
                  <div>
                    <p className="text-sm font-semibold text-success-700">Two-factor authentication enabled</p>
                    <p className="text-xs text-success-600">Your account is protected with an additional verification layer.</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div><label className="block text-sm font-semibold text-ink-700 mb-1.5">Current password</label><input type="password" placeholder="••••••••" className="input" /></div>
                  <div><label className="block text-sm font-semibold text-ink-700 mb-1.5">New password</label><input type="password" placeholder="••••••••" className="input" /></div>
                  <div><label className="block text-sm font-semibold text-ink-700 mb-1.5">Confirm new password</label><input type="password" placeholder="••••••••" className="input" /></div>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-ink-700 mb-2">Recent sessions</h4>
                  <div className="space-y-2">
                    {['Chrome — Rotterdam, NL (current)', 'Safari — London, UK · 2 days ago', 'Edge — Dubai, AE · 5 days ago'].map((session) => (
                      <div key={session} className="flex items-center gap-3 p-3 bg-ink-50 rounded-lg text-sm text-ink-600">
                        <Globe size={14} className="text-ink-400" />
                        {session}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {tab === 'preferences' && (
              <div className="space-y-5">
                <h3 className="font-display font-bold text-ink-900">Platform preferences</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-ink-700 mb-1.5">Language</label>
                    <select className="input cursor-pointer"><option>English (UK)</option><option>English (US)</option><option>Nederlands</option><option>Français</option><option>Deutsch</option></select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-ink-700 mb-1.5">Time zone</label>
                    <select className="input cursor-pointer"><option>Europe/Amsterdam (CET)</option><option>Europe/London (GMT)</option><option>Asia/Dubai (GST)</option><option>Africa/Nairobi (EAT)</option></select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-ink-700 mb-1.5">Date format</label>
                    <select className="input cursor-pointer"><option>DD/MM/YYYY</option><option>MM/DD/YYYY</option><option>YYYY-MM-DD</option></select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-ink-700 mb-1.5">Default view</label>
                    <select className="input cursor-pointer"><option>Dashboard</option><option>Appointments</option><option>Medicals</option></select>
                  </div>
                </div>
                <div className="pt-3 border-t border-ink-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-ink-900">Dark mode</p>
                      <p className="text-xs text-ink-400">Use a dark colour scheme (coming soon)</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" />
                      <div className="w-10 h-5 bg-ink-200 rounded-full peer-checked:bg-brand-600 transition-colors" style={{ height: '22px', width: '40px' }}>
                        <span className="block w-4 h-4 bg-white rounded-full transition-transform shadow-sm mt-0.5 ml-0.5" />
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-6 pt-4 border-t border-ink-100 flex justify-end">
              <button onClick={handleSave} className={saved ? 'btn-primary bg-success-600 hover:bg-success-700' : 'btn-primary'}>
                {saved ? <><Check size={16} /> Saved</> : <><Save size={16} /> Save changes</>}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
