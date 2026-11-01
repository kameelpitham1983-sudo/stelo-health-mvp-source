import { Stethoscope, ClipboardCheck, ShieldAlert, Award } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { StatCard } from '@/components/StatCard';
import { Badge } from '@/components/Badge';
import { useMedicals, useAppointments, useCases, useEmployees, useDigitalCertificates } from '@/hooks/useSupabaseData';
import { DashboardHeader, Panel, EmptyRow, todayIso } from '@/pages/dashboards/shared';

export function ProviderDashboard() {
  const { setPage } = useApp();
  const { data: medicals } = useMedicals();
  const { data: appointments } = useAppointments();
  const { data: cases } = useCases();
  const { data: employees } = useEmployees();
  const { data: certificates } = useDigitalCertificates();
  const today = todayIso();

  const openAssessments = medicals.filter((m) => m.status === 'Scheduled' || m.status === 'In Progress' || m.status === 'Overdue');
  const reviewQueue = cases.filter((c) => c.status === 'awaiting_clinical_review');
  const upcoming = appointments
    .filter((a) => a.date >= today && a.status !== 'Cancelled')
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 6);
  const restricted = employees.filter((e) => e.healthStatus === 'Fit with Restrictions');
  const activeCertificates = certificates.filter((c) => c.status === 'Active').length;

  return (
    <div className="space-y-6">
      <DashboardHeader title="Clinical Dashboard" subtitle="Assessments, clinical reviews, restrictions and certificates." />

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Open assessments" value={openAssessments.length} icon={<Stethoscope size={20} />} />
        <StatCard label="Awaiting clinical review" value={reviewQueue.length} icon={<ClipboardCheck size={20} />} iconBg="bg-warning-50 text-warning-600" />
        <StatCard label="Restrictions in force" value={restricted.length} icon={<ShieldAlert size={20} />} iconBg="bg-danger-50 text-danger-600" />
        <StatCard label="Active certificates" value={activeCertificates} icon={<Award size={20} />} iconBg="bg-success-50 text-success-600" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Panel
          title="Clinical review queue"
          action={<button onClick={() => setPage('cases')} className="text-xs font-semibold text-brand-600 hover:text-brand-700">Open cases</button>}
        >
          {reviewQueue.length === 0 ? <EmptyRow text="No cases are waiting for clinical review." /> : (
            <ul className="divide-y divide-ink-100">
              {reviewQueue.slice(0, 8).map((c) => (
                <li key={c.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink-900 truncate">{c.title}</p>
                    <p className="text-xs text-ink-400 truncate">{c.employeeName ?? '—'} · {c.companyName}</p>
                  </div>
                  <Badge color="warning">{c.priority}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel
          title="Upcoming appointments"
          action={<button onClick={() => setPage('appointments')} className="text-xs font-semibold text-brand-600 hover:text-brand-700">View all</button>}
        >
          {upcoming.length === 0 ? <EmptyRow text="No upcoming appointments." /> : (
            <ul className="divide-y divide-ink-100">
              {upcoming.map((a) => (
                <li key={a.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink-900 truncate">{a.employeeName}</p>
                    <p className="text-xs text-ink-400 truncate">{a.type} · {a.date} {a.time}</p>
                  </div>
                  <Badge color="brand">{a.status}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Restrictions in force">
          {restricted.length === 0 ? <EmptyRow text="No employees currently have fitness restrictions." /> : (
            <ul className="divide-y divide-ink-100">
              {restricted.map((e) => (
                <li key={e.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink-900 truncate">{e.name}</p>
                    <p className="text-xs text-ink-400 truncate">{e.companyName} · {e.jobTitle}</p>
                  </div>
                  <span className="text-xs text-ink-500 whitespace-nowrap">Next due {e.nextMedicalDue || '—'}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel
          title="Assessments in progress"
          action={<button onClick={() => setPage('medicals')} className="text-xs font-semibold text-brand-600 hover:text-brand-700">Open medicals</button>}
        >
          {openAssessments.length === 0 ? <EmptyRow text="No open assessments." /> : (
            <ul className="divide-y divide-ink-100">
              {openAssessments.slice(0, 8).map((m) => (
                <li key={m.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink-900 truncate">{m.employeeName}</p>
                    <p className="text-xs text-ink-400 truncate">{m.type} · {m.date || 'Date pending'}</p>
                  </div>
                  <Badge color={m.status === 'Overdue' ? 'danger' : 'brand'}>{m.status}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}
