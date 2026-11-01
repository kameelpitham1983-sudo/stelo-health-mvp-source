import { Building2, Users, FolderOpen, Timer, ShieldAlert, FileWarning, Award, Workflow, CalendarCheck } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { StatCard } from '@/components/StatCard';
import { Badge } from '@/components/Badge';
import {
  useCompanies,
  useEmployees,
  useCases,
  useAppointments,
  useDocuments,
  useDigitalCertificates,
  useProviders,
  useProfiles,
  useWorkflowInstances,
} from '@/hooks/useSupabaseData';
import { DashboardHeader, Panel, EmptyRow, todayIso, CLOSED_CASE_STATUSES } from '@/pages/dashboards/shared';

const ROLE_LABELS: Record<string, string> = {
  master_admin: 'Master admin',
  admin: 'Admin',
  coordinator: 'Coordinator',
  provider: 'Provider',
  employer: 'Employer',
  employee: 'Employee',
  lab: 'Lab specialist',
  ai: 'AI',
};

function daysBetween(from: string, to: string): number {
  return Math.round((new Date(to).getTime() - new Date(from).getTime()) / 86_400_000);
}

export function AdminDashboard() {
  const { setPage } = useApp();
  const { data: companies, loading: companiesLoading } = useCompanies();
  const { data: employees } = useEmployees();
  const { data: cases } = useCases();
  const { data: appointments } = useAppointments();
  const { data: documents } = useDocuments();
  const { data: certificates } = useDigitalCertificates();
  const { data: providers } = useProviders();
  const { data: profiles, loading: profilesLoading, error: profilesError } = useProfiles();
  const { data: workflows } = useWorkflowInstances();
  const today = todayIso();
  const monthAgo = new Date(Date.now() - 30 * 86_400_000).toISOString().slice(0, 10);

  const openCases = cases.filter((c) => !CLOSED_CASE_STATUSES.includes(c.status));
  const overdueCases = openCases.filter((c) => !!c.nextActionDueDate && c.nextActionDueDate < today);
  const recentlyClosed = cases.filter((c) => c.closureDate && c.closureDate >= monthAgo && c.closureDate <= today);
  const closedWithDates = cases.filter((c) => c.closureDate && c.dateOpened);
  const avgDaysToClose = closedWithDates.length
    ? Math.round(closedWithDates.reduce((sum, c) => sum + daysBetween(c.dateOpened, c.closureDate as string), 0) / closedWithDates.length)
    : null;
  const activeWorkflows = workflows.filter((w) => w.status === 'In Progress').length;
  const onHoldWorkflows = workflows.filter((w) => w.status === 'On Hold').length;
  const exceptionWorkflows = workflows.filter((w) => w.stepInstances.some((s) => s.exceptionFlagged)).length;

  const recentAppts = appointments.filter((a) => a.date >= monthAgo && a.date <= today);
  const noShows = recentAppts.filter((a) => a.status === 'No-show').length;
  const noShowRate = recentAppts.length ? Math.round((noShows / recentAppts.length) * 1000) / 10 : 0;

  const roleCounts = profiles.reduce<Record<string, number>>((acc, p) => {
    acc[p.role] = (acc[p.role] ?? 0) + 1;
    return acc;
  }, {});
  const unlinkedEmployeeAccounts = profiles.filter((p) => p.role === 'employee' && !p.linkedEmployeeId).length;

  const overdueMedicalEmployees = employees.filter((e) => !!e.nextMedicalDue && e.nextMedicalDue < today).length;
  const pendingAssessmentEmployees = employees.filter((e) => e.healthStatus === 'Pending Assessment').length;
  const expiredDocuments = documents.filter((d) => !!d.expiryDate && d.expiryDate < today && d.status !== 'Rejected').length;
  const problemCertificates = certificates.filter((c) => c.status === 'Expired' || c.status === 'Suspended').length;
  const unverifiedProviders = providers.filter((p) => p.status === 'Unverified' || p.status === 'Pending Verification');

  return (
    <div className="space-y-6">
      <DashboardHeader title="Admin Oversight" subtitle="System health, user access, provider network, operational performance and compliance." />

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-ink-500 uppercase tracking-wide">System overview</h3>
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard label="Active companies" value={companies.filter((c) => c.status === 'Active').length} icon={<Building2 size={20} />} subtitle={companiesLoading ? 'Loading...' : `${companies.length} contracted`} />
          <StatCard label="Employees" value={employees.length} icon={<Users size={20} />} iconBg="bg-teal-50 text-teal-600" />
          <StatCard label="Open cases" value={openCases.length} icon={<FolderOpen size={20} />} iconBg="bg-accent-50 text-accent-600" subtitle={`${overdueCases.length} overdue`} />
          <StatCard label="Platform users" value={profiles.length} icon={<Users size={20} />} iconBg="bg-ink-100 text-ink-600" />
        </div>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Panel title="Users by role">
          {profilesError ? (
            <EmptyRow text={`User list could not be loaded: ${profilesError}`} />
          ) : profilesLoading ? (
            <EmptyRow text="Loading users..." />
          ) : profiles.length === 0 ? (
            <EmptyRow text="No user accounts found." />
          ) : (
            <ul className="divide-y divide-ink-100">
              {Object.entries(roleCounts).map(([role, count]) => (
                <li key={role} className="py-2.5 flex items-center justify-between text-sm">
                  <span className="text-ink-700">{ROLE_LABELS[role] ?? role}</span>
                  <span className="font-semibold text-ink-900">{count}</span>
                </li>
              ))}
            </ul>
          )}
          {unlinkedEmployeeAccounts > 0 && (
            <p className="mt-3 text-xs text-warning-700 bg-warning-50 rounded-lg px-3 py-2">
              {unlinkedEmployeeAccounts} employee account(s) are not linked to an employee record, so they will see no personal data.
            </p>
          )}
        </Panel>

        <Panel
          title="Provider network: verification queue"
          action={<button onClick={() => setPage('providers')} className="text-xs font-semibold text-brand-600 hover:text-brand-700">Open providers</button>}
        >
          {unverifiedProviders.length === 0 ? <EmptyRow text="All providers are verified or onboarded." /> : (
            <ul className="divide-y divide-ink-100">
              {unverifiedProviders.slice(0, 6).map((p) => (
                <li key={p.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink-900 truncate">{p.name}</p>
                    <p className="text-xs text-ink-400 truncate">{p.physicalAddress || 'Address not set'}</p>
                  </div>
                  <Badge color={p.status === 'Unverified' ? 'danger' : 'warning'}>{p.status}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-ink-500 uppercase tracking-wide">Operational performance (last 30 days)</h3>
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard label="Cases closed" value={recentlyClosed.length} icon={<FolderOpen size={20} />} iconBg="bg-success-50 text-success-600" />
          <StatCard label="Avg days to close" value={avgDaysToClose ?? '—'} icon={<Timer size={20} />} iconBg="bg-brand-50 text-brand-600" subtitle="All closed cases" />
          <StatCard label="Active workflows" value={activeWorkflows} icon={<Workflow size={20} />} iconBg="bg-teal-50 text-teal-600" subtitle={`${onHoldWorkflows} on hold, ${exceptionWorkflows} with exceptions`} />
          <StatCard label="Appointment no-show rate" value={`${noShowRate}%`} icon={<CalendarCheck size={20} />} iconBg="bg-warning-50 text-warning-600" subtitle={`${recentAppts.length} appointments`} />
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-ink-500 uppercase tracking-wide">Compliance oversight</h3>
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard label="Medicals overdue" value={overdueMedicalEmployees} icon={<ShieldAlert size={20} />} iconBg="bg-danger-50 text-danger-600" subtitle="Past next medical due date" />
          <StatCard label="Pending assessments" value={pendingAssessmentEmployees} icon={<Users size={20} />} iconBg="bg-warning-50 text-warning-600" />
          <StatCard label="Expired documents" value={expiredDocuments} icon={<FileWarning size={20} />} iconBg="bg-danger-50 text-danger-600" />
          <StatCard label="Certificates expired or suspended" value={problemCertificates} icon={<Award size={20} />} iconBg="bg-warning-50 text-warning-600" />
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          <button onClick={() => setPage('medicals')} className="btn-secondary">Review medicals</button>
          <button onClick={() => setPage('documents')} className="btn-secondary">Review documents</button>
          <button onClick={() => setPage('certificates')} className="btn-secondary">Review certificates</button>
          <button onClick={() => setPage('providers')} className="btn-secondary">Review providers</button>
        </div>
      </section>

    </div>
  );
}
