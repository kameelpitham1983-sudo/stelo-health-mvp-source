import { CalendarDays, ClipboardList, FileText, Award } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { StatCard } from '@/components/StatCard';
import { Badge } from '@/components/Badge';
import { useEmployees, useMedicals, useAppointments, useDocuments, useDigitalCertificates } from '@/hooks/useSupabaseData';
import { canViewEmployeeRecord } from '@/lib/permissions';
import { DashboardHeader, Panel, EmptyRow, todayIso } from '@/pages/dashboards/shared';

const OPEN_QUESTIONNAIRE_STATUSES = ['Scheduled', 'In Progress', 'Overdue'];

export function EmployeeDashboard() {
  const { user, setPage } = useApp();
  const { data: employees } = useEmployees();
  const { data: medicals } = useMedicals();
  const { data: appointments } = useAppointments();
  const { data: documents } = useDocuments();
  const { data: certificates } = useDigitalCertificates();
  const today = todayIso();

  const profile = employees.find((e) => canViewEmployeeRecord(user, e.id, e.companyId));
  const questionnaires = medicals.filter((m) => OPEN_QUESTIONNAIRE_STATUSES.includes(m.status));
  const upcoming = appointments
    .filter((a) => a.date >= today && a.status !== 'Cancelled')
    .sort((a, b) => a.date.localeCompare(b.date));
  const pendingDocs = documents.filter((d) => d.status === 'Pending Review' || d.status === 'Draft');
  const activeCerts = certificates.filter((c) => c.status === 'Active');

  return (
    <div className="space-y-6">
      <DashboardHeader title={`Welcome, ${user?.name ?? ''}`} subtitle="Your health profile, appointments, questionnaires and documents." />

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Upcoming appointments" value={upcoming.length} icon={<CalendarDays size={20} />} />
        <StatCard label="Questionnaires to complete" value={questionnaires.length} icon={<ClipboardList size={20} />} iconBg="bg-warning-50 text-warning-600" />
        <StatCard label="Documents awaiting review" value={pendingDocs.length} icon={<FileText size={20} />} iconBg="bg-accent-50 text-accent-600" />
        <StatCard label="Active certificates" value={activeCerts.length} icon={<Award size={20} />} iconBg="bg-success-50 text-success-600" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Panel title="My profile">
          {!profile ? (
            <EmptyRow text="Your account is not linked to an employee record yet. Ask your administrator to link it." />
          ) : (
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div><dt className="text-xs text-ink-400">Name</dt><dd className="font-semibold text-ink-900">{profile.name}</dd></div>
              <div><dt className="text-xs text-ink-400">Job title</dt><dd className="font-semibold text-ink-900">{profile.jobTitle || '—'}</dd></div>
              <div><dt className="text-xs text-ink-400">Company</dt><dd className="font-semibold text-ink-900">{profile.companyName || '—'}</dd></div>
              <div><dt className="text-xs text-ink-400">Fitness status</dt><dd className="font-semibold text-ink-900">{profile.healthStatus}</dd></div>
              <div><dt className="text-xs text-ink-400">Last assessment</dt><dd className="font-semibold text-ink-900">{profile.lastMedicalDate || '—'}</dd></div>
              <div><dt className="text-xs text-ink-400">Next due</dt><dd className="font-semibold text-ink-900">{profile.nextMedicalDue || '—'}</dd></div>
            </dl>
          )}
        </Panel>

        <Panel
          title="Outstanding actions"
          action={<button onClick={() => setPage('medicals')} className="text-xs font-semibold text-brand-600 hover:text-brand-700">Open medicals</button>}
        >
          {questionnaires.length === 0 && pendingDocs.length === 0 ? <EmptyRow text="You have no outstanding actions." /> : (
            <ul className="divide-y divide-ink-100">
              {questionnaires.map((m) => (
                <li key={m.id} className="py-3 flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-ink-900 truncate">{m.type} questionnaire</p>
                  <Badge color="warning">{m.status}</Badge>
                </li>
              ))}
              {pendingDocs.map((d) => (
                <li key={d.id} className="py-3 flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-ink-900 truncate">{d.name}</p>
                  <Badge color="ink">{d.status}</Badge>
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
              {upcoming.slice(0, 5).map((a) => (
                <li key={a.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink-900 truncate">{a.type}</p>
                    <p className="text-xs text-ink-400 truncate">{a.date} {a.time} · {a.location || a.mode}</p>
                  </div>
                  <Badge color="brand">{a.status}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel
          title="My documents"
          action={<button onClick={() => setPage('documents')} className="text-xs font-semibold text-brand-600 hover:text-brand-700">Open documents</button>}
        >
          {documents.length === 0 ? <EmptyRow text="No documents are shared with you yet." /> : (
            <ul className="divide-y divide-ink-100">
              {documents.slice(0, 5).map((d) => (
                <li key={d.id} className="py-3 flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-ink-900 truncate">{d.name}</p>
                  <span className="text-xs text-ink-400 whitespace-nowrap">{d.uploadedDate || '—'}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}
