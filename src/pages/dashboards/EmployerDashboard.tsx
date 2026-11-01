import { Users, HeartPulse, CalendarClock, FileWarning, FileBarChart } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { StatCard } from '@/components/StatCard';
import { Badge } from '@/components/Badge';
import { useEmployees, useMedicals, useCases } from '@/hooks/useSupabaseData';
import { can, canViewCompany, canViewEmployeeRecord } from '@/lib/permissions';
import { DashboardHeader, Panel, EmptyRow, todayIso } from '@/pages/dashboards/shared';

const CLOSED_CASE_STATUSES = ['completed', 'cancelled'];

export function EmployerDashboard() {
  const { user, setPage } = useApp();
  const { data: allEmployees } = useEmployees();
  const { data: medicals } = useMedicals();
  const { data: cases } = useCases();
  const today = todayIso();

  const employees = allEmployees.filter((e) => canViewEmployeeRecord(user, e.id, e.companyId));
  const employeeIds = new Set(employees.map((e) => e.id));
  const companyMedicals = medicals.filter((m) => employeeIds.has(m.employeeId));
  const outstandingCases = cases.filter((c) => canViewCompany(user, c.companyId) && !CLOSED_CASE_STATUSES.includes(c.status));
  const overdueDue = employees.filter((e) => e.nextMedicalDue && e.nextMedicalDue < today);
  const pending = employees.filter((e) => e.healthStatus === 'Pending Assessment');
  const restricted = employees.filter((e) => e.healthStatus === 'Fit with Restrictions');
  const fit = employees.filter((e) => e.healthStatus === 'Fit');

  return (
    <div className="space-y-6">
      <DashboardHeader title={`${user?.company ?? 'Your company'} Overview`} subtitle="Employee medical status, outstanding requirements and permitted reports." />

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Employees" value={employees.length} icon={<Users size={20} />} subtitle={`${fit.length} fit to work`} />
        <StatCard label="Fit with restrictions" value={restricted.length} icon={<HeartPulse size={20} />} iconBg="bg-warning-50 text-warning-600" />
        <StatCard label="Medicals overdue or due" value={overdueDue.length} icon={<CalendarClock size={20} />} iconBg="bg-danger-50 text-danger-600" />
        <StatCard label="Outstanding requirements" value={outstandingCases.length + pending.length} icon={<FileWarning size={20} />} iconBg="bg-accent-50 text-accent-600" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Panel title="Medical status by employee">
          {employees.length === 0 ? <EmptyRow text="No employees are linked to your company yet." /> : (
            <ul className="divide-y divide-ink-100">
              {employees.slice(0, 10).map((e) => (
                <li key={e.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink-900 truncate">{e.name}</p>
                    <p className="text-xs text-ink-400 truncate">{e.jobTitle} · Next due {e.nextMedicalDue || '—'}</p>
                  </div>
                  <Badge color={e.healthStatus === 'Fit' ? 'success' : e.healthStatus === 'Unfit' ? 'danger' : 'warning'}>{e.healthStatus}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel
          title="Outstanding requirements"
          action={can(user, 'report.view') ? <button onClick={() => setPage('reports')} className="text-xs font-semibold text-brand-600 hover:text-brand-700">Reports</button> : undefined}
        >
          {outstandingCases.length === 0 && pending.length === 0 ? <EmptyRow text="No outstanding requirements." /> : (
            <ul className="divide-y divide-ink-100">
              {outstandingCases.slice(0, 6).map((c) => (
                <li key={c.id} className="py-3">
                  <p className="text-sm font-semibold text-ink-900 truncate">{c.title}</p>
                  <p className="text-xs text-ink-400 truncate">{c.employeeName ?? 'Company-wide'} · Next: {c.nextAction || 'To be confirmed'}</p>
                </li>
              ))}
              {pending.slice(0, 6).map((e) => (
                <li key={e.id} className="py-3 flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-ink-900 truncate">{e.name}</p>
                  <Badge color="warning">Assessment pending</Badge>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Recent medical activity">
          {companyMedicals.length === 0 ? <EmptyRow text="No medical records for your company yet." /> : (
            <ul className="divide-y divide-ink-100">
              {companyMedicals.slice(0, 6).map((m) => (
                <li key={m.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink-900 truncate">{m.employeeName}</p>
                    <p className="text-xs text-ink-400 truncate">{m.type} · {m.date || 'Date pending'}</p>
                  </div>
                  <Badge color={m.status === 'Completed' ? 'success' : m.status === 'Overdue' ? 'danger' : 'brand'}>{m.status}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Reports you can access">
          <p className="text-sm text-ink-500 mb-4">Company-level medical status reports are available to your HR team. Individual clinical notes are never shown here.</p>
          <button onClick={() => setPage('reports')} className="btn-secondary w-full justify-center">
            <FileBarChart size={16} /> Open reports
          </button>
        </Panel>
      </div>
    </div>
  );
}
