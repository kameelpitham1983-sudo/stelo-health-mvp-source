import { useState, useEffect, useCallback } from 'react';
import { User, Building2, Bell, Shield, Globe, Save, Check, Users, Crown, Stethoscope, Building2 as BuildingIcon, ClipboardList, FlaskConical, AlertCircle, Lock } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { supabase } from '@/lib/supabase';
import { roles } from '@/data/mockData';
import { can } from '@/lib/permissions';
import type { UserRole } from '@/types';

type Tab = 'profile' | 'company' | 'notifications' | 'security' | 'preferences' | 'users';

interface UserListEntry {
  id: string;
  email: string;
  role: string;
  displayName: string;
  isActive: boolean;
  companyId: string | null;
}

const roleIcons: Record<string, typeof Crown> = {
  master_admin: Crown,
  admin: Crown,
  coordinator: ClipboardList,
  provider: Stethoscope,
  employer: BuildingIcon,
  employee: User,
  lab: FlaskConical,
};

const roleLabels: Record<string, string> = {
  master_admin: 'Master Administrator',
  admin: 'Administrator',
  coordinator: 'Coordinator',
  provider: 'Provider',
  employer: 'Employer',
  employee: 'Employee',
  lab: 'Lab / Specialist',
  ai: 'AI Assistant',
};

export function Settings() {
  const { user } = useApp();
  const [tab, setTab] = useState<Tab>('profile');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState(user?.name || '');

  const canManageUsers = can(user, 'user.manage') || user?.role === 'master_admin';

  useEffect(() => {
    setDisplayName(user?.name || '');
  }, [user]);

  const handleProfileSave = async () => {
    if (!user) return;
    setSaving(true);
    setSaveError(null);
    try {
      const { error: err } = await supabase
        .from('profiles')
        .update({ display_name: displayName, avatar_initials: displayName.slice(0, 2).toUpperCase() })
        .eq('id', user.id);
      if (err) throw new Error(err.message);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Could not save profile changes.');
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  const roleInfo = roles.find((r) => r.id === user.role);

  const tabs: { id: Tab; label: string; icon: typeof User }[] = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'company', label: 'Company', icon: Building2 },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'preferences', label: 'Preferences', icon: Globe },
    ...(canManageUsers ? [{ id: 'users' as Tab, label: 'User Management', icon: Users }] : []),
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-display font-bold text-ink-900">Settings</h2>
        <p className="text-sm text-ink-500">Manage your account and platform preferences</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
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
                  </div>
                </div>
                {saveError && <div className="p-3 bg-danger-50 text-danger-700 text-sm rounded-lg flex items-center gap-2"><AlertCircle size={16} /> {saveError}</div>}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-ink-700 mb-1.5">Full name</label>
                    <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="input" />
                    <p className="text-xs text-ink-400 mt-1">Your name is visible to other users on the platform.</p>
                  </div>
                  <div><label className="block text-sm font-semibold text-ink-700 mb-1.5">Email</label><input type="email" defaultValue={user.email} disabled className="input bg-ink-50 text-ink-500" /></div>
                  <div><label className="block text-sm font-semibold text-ink-700 mb-1.5">Job title</label><input type="text" defaultValue={user.jobTitle || ''} disabled className="input bg-ink-50 text-ink-500" /></div>
                  <div><label className="block text-sm font-semibold text-ink-700 mb-1.5">Role</label><input type="text" defaultValue={roleInfo?.label} disabled className="input bg-ink-50 text-ink-500" /></div>
                </div>
                <p className="text-xs text-ink-400 flex items-center gap-1.5"><Lock size={11} /> Email, job title and role are managed by your administrator and cannot be changed here.</p>
              </div>
            )}

            {tab === 'company' && (
              <div className="space-y-5">
                <h3 className="font-display font-bold text-ink-900">Company details</h3>
                <p className="text-sm text-ink-500">{user.company ? `Connected to ${user.company}` : 'You are a STelo Health platform administrator — no single company is assigned.'}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><label className="block text-sm font-semibold text-ink-700 mb-1.5">Company name</label><input type="text" defaultValue={user.company || 'STelo Health'} disabled className="input bg-ink-50 text-ink-500" /></div>
                </div>
                <p className="text-xs text-ink-400">Company assignment is controlled by your administrator. Contact them if this information is incorrect.</p>
              </div>
            )}

            {tab === 'notifications' && (
              <div className="space-y-5">
                <h3 className="font-display font-bold text-ink-900">Notification preferences</h3>
                <p className="text-sm text-ink-500">Notification delivery configuration will be available in a future update.</p>
                <div className="space-y-3">
                  {[
                    { label: 'Appointment reminders', desc: 'Get notified about upcoming appointments' },
                    { label: 'Medical assessment alerts', desc: 'Alerts for overdue or pending medicals' },
                    { label: 'Travel health warnings', desc: 'Risk alerts for upcoming travel deployments' },
                    { label: 'Document review requests', desc: 'Notifications when documents need your review' },
                    { label: 'Compliance reports', desc: 'Monthly compliance digest' },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between py-3 border-b border-ink-100 last:border-0">
                      <div>
                        <p className="text-sm font-semibold text-ink-900">{item.label}</p>
                        <p className="text-xs text-ink-400">{item.desc}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-not-allowed opacity-60">
                        <input type="checkbox" className="sr-only" disabled />
                        <div className="w-10 h-5 bg-ink-200 rounded-full" style={{ height: '22px', width: '40px' }}>
                          <span className="block w-4 h-4 bg-white rounded-full mt-0.5 ml-0.5" />
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
                <div className="space-y-4">
                  <div><label className="block text-sm font-semibold text-ink-700 mb-1.5">Current password</label><input type="password" placeholder="••••••••" className="input" /></div>
                  <div><label className="block text-sm font-semibold text-ink-700 mb-1.5">New password</label><input type="password" placeholder="••••••••" className="input" /></div>
                  <div><label className="block text-sm font-semibold text-ink-700 mb-1.5">Confirm new password</label><input type="password" placeholder="••••••••" className="input" /></div>
                </div>
                <button
                  className="btn-secondary"
                  onClick={async () => {
                    if (!user.email) return;
                    const { error } = await supabase.auth.resetPasswordForEmail(user.email);
                    if (error) { setSaveError(error.message); return; }
                    setSaved(true);
                    setTimeout(() => setSaved(false), 3000);
                  }}
                >
                  Send password reset email
                </button>
                {saveError && <p className="text-sm text-danger-700">{saveError}</p>}
                {saved && <p className="text-sm text-success-700">Password reset email sent.</p>}
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
                <p className="text-xs text-ink-400">Display preferences are stored locally in your browser.</p>
              </div>
            )}

            {tab === 'users' && canManageUsers && <UserManagementTab currentUserRole={user.role} currentUserId={user.id} />}

            {tab === 'profile' && (
              <div className="mt-6 pt-4 border-t border-ink-100 flex justify-end">
                <button onClick={handleProfileSave} disabled={saving} className={saved ? 'btn-primary bg-success-600 hover:bg-success-700' : 'btn-primary'}>
                  {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : saved ? <><Check size={16} /> Saved</> : <><Save size={16} /> Save changes</>}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function UserManagementTab({ currentUserRole, currentUserId }: { currentUserRole: UserRole; currentUserId: string }) {
  const [users, setUsers] = useState<UserListEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from('profiles')
      .select('id, role, display_name, is_active, company_id')
      .order('display_name', { ascending: true });
    if (err) {
      setError(err.message);
    } else {
      setUsers((data || []).map((row: Record<string, unknown>) => ({
        id: row.id as string,
        email: '',
        role: row.role as string,
        displayName: row.display_name as string,
        isActive: row.is_active as boolean,
        companyId: row.company_id as string | null,
      })));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleRoleChange = async (userId: string, newRole: string) => {
    setActionError(null);
    setActionSuccess(null);
    const { error: err } = await supabase.rpc('set_user_role', { target_user_id: userId, new_role: newRole });
    if (err) {
      setActionError(err.message);
      return;
    }
    setActionSuccess(`Role updated to ${roleLabels[newRole] || newRole}.`);
    setTimeout(() => setActionSuccess(null), 3000);
    await loadUsers();
  };

  const handleToggleActive = async (userId: string, currentlyActive: boolean) => {
    setActionError(null);
    setActionSuccess(null);
    const { error: err } = await supabase.rpc('deactivate_user', { target_user_id: userId, deactivate: currentlyActive });
    if (err) {
      setActionError(err.message);
      return;
    }
    setActionSuccess(currentlyActive ? 'User deactivated.' : 'User reactivated.');
    setTimeout(() => setActionSuccess(null), 3000);
    await loadUsers();
  };

  if (loading) {
    return <div className="flex items-center justify-center py-12"><span className="w-6 h-6 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin" /></div>;
  }

  if (error) {
    return <div className="p-3 bg-danger-50 text-danger-700 text-sm rounded-lg flex items-center gap-2"><AlertCircle size={16} /> {error}</div>;
  }

  const availableRoles = ['admin', 'coordinator', 'provider', 'employer', 'employee', 'lab'];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="font-display font-bold text-ink-900">User Management</h3>
        <p className="text-xs text-ink-400">{users.length} registered users</p>
      </div>

      {actionError && <div className="p-3 bg-danger-50 text-danger-700 text-sm rounded-lg flex items-center gap-2"><AlertCircle size={16} /> {actionError}</div>}
      {actionSuccess && <div className="p-3 bg-success-50 text-success-700 text-sm rounded-lg flex items-center gap-2"><Check size={16} /> {actionSuccess}</div>}

      <div className="space-y-2">
        {users.map((u) => {
          const RoleIcon = roleIcons[u.role] || User;
          const isSelf = u.id === currentUserId;
          const isMasterAdmin = u.role === 'master_admin';
          const canModify = !isSelf && !isMasterAdmin && currentUserRole === 'master_admin';
          return (
            <div key={u.id} className={`flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-lg border ${u.isActive ? 'border-ink-100' : 'border-ink-100 bg-ink-50/50'}`}>
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white shrink-0 ${u.isActive ? 'bg-gradient-to-br from-brand-400 to-brand-600' : 'bg-ink-300'}`}>
                  <RoleIcon size={18} />
                </div>
                <div className="min-w-0">
                  <p className={`text-sm font-semibold truncate ${u.isActive ? 'text-ink-900' : 'text-ink-500'}`}>{u.displayName || 'Unnamed user'}</p>
                  <p className="text-xs text-ink-400">{roleLabels[u.role] || u.role}{!u.isActive && ' · Deactivated'}</p>
                </div>
              </div>
              {canModify && (
                <div className="flex items-center gap-2">
                  <select
                    className="input text-sm py-1.5"
                    value={u.role}
                    onChange={(e) => handleRoleChange(u.id, e.target.value)}
                  >
                    {availableRoles.map((r) => <option key={r} value={r}>{roleLabels[r]}</option>)}
                  </select>
                  <button
                    onClick={() => handleToggleActive(u.id, u.isActive)}
                    className={`btn-secondary text-sm py-1.5 ${u.isActive ? 'text-danger-600 hover:border-danger-300' : ''}`}
                  >
                    {u.isActive ? 'Deactivate' : 'Reactivate'}
                  </button>
                </div>
              )}
              {isSelf && <span className="text-xs text-ink-400 italic">This is your account</span>}
              {isMasterAdmin && <span className="text-xs text-ink-400 italic">Master Administrator — protected</span>}
              {currentUserRole !== 'master_admin' && !isSelf && !isMasterAdmin && (
                <span className="text-xs text-ink-400 italic">Only the Master Administrator can modify users</span>
              )}
            </div>
          );
        })}
      </div>

      {currentUserRole === 'master_admin' && (
        <div className="p-3 bg-brand-50 text-brand-700 text-xs rounded-lg">
          To invite new users, use the invitation link from the sidebar or have the person sign up — then assign their role here. The invite-user edge function requires deployment to the project before email invitations can be sent.
        </div>
      )}
    </div>
  );
}
