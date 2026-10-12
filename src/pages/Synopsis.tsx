import { Activity, Building2, CalendarDays, ClipboardCheck, FileText, HeartPulse, Users, ArrowRight, AlertCircle } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useCompanies, useEmployees } from '@/hooks/useSupabaseData';

export function Synopsis() {
  const { setPage } = useApp();
  const companies = useCompanies();
  const employees = useEmployees();

  const actions = [
    { title: 'Companies', description: 'Manage employer accounts and contacts.', page: 'companies' as const, icon: Building2 },
    { title: 'Employees', description: 'Review workforce profiles and fitness status.', page: 'employees' as const, icon: Users },
    { title: 'Scheduling', description: 'View and manage medical appointments.', page: 'appointments' as const, icon: CalendarDays },
    { title: 'Sickness absence', description: 'Record referrals, time off and return-to-work support.', page: 'sickness' as const, icon: HeartPulse },
    { title: 'Medical assessments', description: 'Track occupational medical assessments.', page: 'medicals' as const, icon: ClipboardCheck },
    { title: 'Documents', description: 'Review health and compliance documentation.', page: 'documents' as const, icon: FileText },
  ];

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-700 via-brand-800 to-brand-950 p-6 lg:p-8 text-white">
        <div className="absolute top-0 right-0 h-56 w-56 rounded-full bg-teal-400/15 blur-3xl" />
        <div className="relative">
          <div className="mb-2 flex items-center gap-2 text-teal-200">
            <Activity size={17} />
            <span className="text-xs font-semibold uppercase tracking-wider">STelo Health overview</span>
          </div>
          <h2 className="text-2xl font-display font-bold">Programme synopsis</h2>
          <p className="mt-2 max-w-2xl text-sm text-white/75">A central overview for occupational health, workforce readiness and employer compliance. Choose a workspace below to continue.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="card p-5">
          <div className="mb-3 flex items-center gap-2 text-brand-600"><Building2 size={18} /><span className="text-sm font-medium text-ink-500">Companies in system</span></div>
          <p className="text-3xl font-display font-bold text-ink-900">{companies.loading ? '—' : companies.error ? '!' : companies.data.length}</p>
          {companies.error && <p className="mt-2 flex items-center gap-1 text-xs text-danger-600"><AlertCircle size={13} /> Could not load company count.</p>}
        </div>
        <div className="card p-5">
          <div className="mb-3 flex items-center gap-2 text-teal-600"><Users size={18} /><span className="text-sm font-medium text-ink-500">Employees in system</span></div>
          <p className="text-3xl font-display font-bold text-ink-900">{employees.loading ? '—' : employees.error ? '!' : employees.data.length}</p>
          {employees.error && <p className="mt-2 flex items-center gap-1 text-xs text-danger-600"><AlertCircle size={13} /> Could not load employee count.</p>}
        </div>
      </div>

      <div>
        <div className="mb-3">
          <h3 className="font-display text-lg font-bold text-ink-900">Workspaces</h3>
          <p className="text-sm text-ink-500">Open a section to review or manage its current workflow.</p>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {actions.map(({ title, description, page, icon: Icon }) => (
            <button key={page} type="button" onClick={() => setPage(page)} className="card group flex items-start gap-4 p-5 text-left transition hover:-translate-y-0.5 hover:shadow-md">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600"><Icon size={20} /></span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold text-ink-900">{title}</span>
                <span className="mt-1 block text-sm text-ink-500">{description}</span>
                <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-brand-600">Open workspace <ArrowRight size={13} className="transition group-hover:translate-x-1" /></span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
