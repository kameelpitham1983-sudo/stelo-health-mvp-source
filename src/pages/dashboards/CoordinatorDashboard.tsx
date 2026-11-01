import { CalendarDays, FolderOpen, Workflow, Network, ClipboardList, AlertTriangle } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import type { PageId } from '@/context/AppContext';
import { StatCard } from '@/components/StatCard';
import { Badge } from '@/components/Badge';
import { useAppointments, useCases, useWorkflowInstances, useProviders, useDocuments } from '@/hooks/useSupabaseData';
import { DashboardHeader, Panel, EmptyRow, todayIso, CLOSED_CASE_STATUSES } from '@/pages/dashboards/shared';

const WEEK_MS = 7 * 86_400_000;

export function CoordinatorDashboard() {
  const { setPage } = useApp();
  const { data: appointments } = useAppointments();
  const { data: cases } = useCases();
  const { data: workflows } = useWorkflowInstances();
  const { data: providers } = useProviders();
  const { data: documents } = useDocuments();
  const today = todayIso();
  const weekAhead = new Date(Date.now() + WEEK_MS).toISOString().slice(0, 10);

  const upcomingAppts = appointments
    .filter((a) => a.date >= today && a.date <= weekAhead && a.status !== 'Cancelled')
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  const pendingConfirmations = upcomingAppts.filter((a) => a.status === 'Pending').length;

  const outstanding = cases
    .filter((c) => !CLOSED_CASE_STATUSES.includes(c.status))
    .sort((a, b) => (a.nextActionDueDate ?? '9999').localeCompare(b.nextActionDueDate ?? '9999'));
  const overdueCases = outstanding.filter((c) => !!c.nextActionDueDate && c.nextActionDueDate < today);
  const urgentCases = outstanding.filter((c) => c.priority === 'urgent' || c.priority === 'high').length;

  const activeWorkflows = workflows.filter((w) => w.status === 'In Progress' || w.status === 'On Hold');
  const exceptionWorkflows = workflows.filter((w) => w.stepInstances.some((s) => s.exceptionFlagged));

  const providerQueue = providers.filter((p) => p.status === 'Onboarding' || p.status === 'Pending Verification' || p.status === 'Unverified');
  const pendingDocuments = documents.filter((d) => d.status === 'Pending Review');

  const pendingTasks: { id: string; label: string; detail: string; overdue: boolean; page: PageId }[] = [
    ...overdueCases.map((c) => ({ id: `case-${c.id}`, label: c.nextAction || 'Follow up on case', detail: `${c.employeeName ?? '—'} · Due ${c.nextActionDueDate}`, overdue: true, page: 'cases' as const })),
    ...pendingDocuments.map((d) => ({ id: `doc-${d.id}`, label: `Review ${d.name}`, detail: `${d.employeeName ?? d.companyName} · Uploaded ${d.uploadedDate}`, overdue: false, page: 'documents' as const })),
  ];

  return (
    <div className="space-y-6">
      <DashboardHeader title="Coordinator Operations" subtitle="Appointments, outstanding cases, workflows, provider coordination and pending tasks." />

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Appointments this week" value={upcomingAppts.length} icon={<CalendarDays size={20} />} subtitle={`${pendingConfirmations} awaiting confirmation`} />
        <StatCard label="Outstanding cases" value={outstanding.length} icon={<FolderOpen size={20} />} iconBg="bg-accent-50 text-accent-600" subtitle={`${urgentCases} high or urgent`} />
        <StatCard label="Active workflows" value={activeWorkflows.length} icon={<Workflow size={20} />} iconBg="bg-teal-50 text-teal-600" subtitle={`${exceptionWorkflows.length} with exceptions`} />
        <StatCard label="Pending tasks" value={pendingTasks.length} icon={<ClipboardList size={20} />} iconBg="bg-warning-50 text-warning-600" subtitle={`${overdueCases.length} overdue`} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Panel
          title="Upcoming appointments"
          action={<button onClick={() => setPage('appointments')} className="text-xs font-semibold text-brand-600 hover:text-brand-700">Open appointments</button>}
        >
          {upcomingAppts.length === 0 ? <EmptyRow text="No appointments in the next 7 days." /> : (
            <ul className="divide-y divide-ink-100">
              {upcomingAppts.slice(0, 8).map((a) => (
                <li key={a.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink-900 truncate">{a.employeeName}</p>
                    <p className="text-xs text-ink-400 truncate">{a.type} · {a.date} {a.time} · {a.providerName || 'Provider not set'}</p>
                  </div>
                  <Badge color={a.status === 'Confirmed' ? 'success' : 'warning'} dot>{a.status}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel
          title="Outstanding cases"
          action={<button onClick={() => setPage('cases')} className="text-xs font-semibold text-brand-600 hover:text-brand-700">Open cases</button>}
        >
          {outstanding.length === 0 ? <EmptyRow text="No outstanding cases." /> : (
            <ul className="divide-y divide-ink-100">
              {outstanding.slice(0, 8).map((c) => (
                <li key={c.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink-900 truncate">{c.title}</p>
                    <p className="text-xs text-ink-400 truncate">{c.employeeName ?? '—'} · Next: {c.nextAction || 'not set'}{c.nextActionDueDate ? ` · ${c.nextActionDueDate}` : ''}</p>
                  </div>
                  <Badge color={c.nextActionDueDate && c.nextActionDueDate < today ? 'danger' : 'brand'}>{c.status.replace(/_/g, ' ')}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel
          title="Medical workflows"
          action={<button onClick={() => setPage('workflows')} className="text-xs font-semibold text-brand-600 hover:text-brand-700">Open workflows</button>}
        >
          {activeWorkflows.length === 0 ? <EmptyRow text="No workflows in progress or on hold." /> : (
            <ul className="divide-y divide-ink-100">
              {activeWorkflows.slice(0, 8).map((w) => (
                <li key={w.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink-900 truncate">{w.workflowName}</p>
                    <p className="text-xs text-ink-400 truncate">{w.employeeName} · {w.companyName}</p>
                  </div>
                  <Badge color={w.status === 'On Hold' ? 'warning' : 'brand'}>{w.status}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel
          title="Provider coordination"
          action={<button onClick={() => setPage('providers')} className="text-xs font-semibold text-brand-600 hover:text-brand-700">Open providers</button>}
        >
          {providerQueue.length === 0 ? <EmptyRow text="No providers waiting on onboarding or verification." /> : (
            <ul className="divide-y divide-ink-100">
              {providerQueue.slice(0, 8).map((p) => (
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

      <Panel title="Pending operational tasks">
        {pendingTasks.length === 0 ? <EmptyRow text="No pending tasks. Everything is up to date." /> : (
          <ul className="divide-y divide-ink-100">
            {pendingTasks.slice(0, 12).map((t) => (
              <li key={t.id} className="py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {t.overdue && <AlertTriangle size={16} className="text-danger-600 shrink-0" />}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink-900 truncate">{t.label}</p>
                    <p className="text-xs text-ink-400 truncate">{t.detail}</p>
                  </div>
                </div>
                <button onClick={() => setPage(t.page)} className="text-xs font-semibold text-brand-600 hover:text-brand-700 shrink-0">Open</button>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
