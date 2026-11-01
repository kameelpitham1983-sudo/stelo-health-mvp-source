import { FlaskConical, Hourglass, FileCheck2, Repeat } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { StatCard } from '@/components/StatCard';
import { Badge } from '@/components/Badge';
import { useCases, useDocuments } from '@/hooks/useSupabaseData';
import { DashboardHeader, Panel, EmptyRow, todayIso, CLOSED_CASE_STATUSES } from '@/pages/dashboards/shared';

export function LabDashboard() {
  const { setPage } = useApp();
  const { data: cases } = useCases();
  const { data: documents } = useDocuments();
  const today = todayIso();

  const labCases = cases.filter((c) => c.caseType === 'lab_request');
  const outstanding = labCases.filter((c) => !CLOSED_CASE_STATUSES.includes(c.status));
  const awaitingResults = labCases.filter((c) => c.status === 'awaiting_outcome');
  const followUps = outstanding
    .filter((c) => c.nextActionDueDate)
    .sort((a, b) => (a.nextActionDueDate ?? '').localeCompare(b.nextActionDueDate ?? ''));
  const overdueFollowUps = followUps.filter((c) => (c.nextActionDueDate ?? '') < today);
  const results = documents.filter((d) => d.type === 'Drug Screen Result');

  return (
    <div className="space-y-6">
      <DashboardHeader title="Laboratory Dashboard" subtitle="Authorised laboratory requests, outstanding tests and submitted results." />

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Outstanding requests" value={outstanding.length} icon={<FlaskConical size={20} />} />
        <StatCard label="Awaiting results" value={awaitingResults.length} icon={<Hourglass size={20} />} iconBg="bg-warning-50 text-warning-600" />
        <StatCard label="Results submitted" value={results.length} icon={<FileCheck2 size={20} />} iconBg="bg-success-50 text-success-600" />
        <StatCard label="Follow-ups overdue" value={overdueFollowUps.length} icon={<Repeat size={20} />} iconBg="bg-danger-50 text-danger-600" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Panel
          title="Outstanding tests"
          action={<button onClick={() => setPage('cases')} className="text-xs font-semibold text-brand-600 hover:text-brand-700">Open cases</button>}
        >
          {outstanding.length === 0 ? <EmptyRow text="No outstanding laboratory requests." /> : (
            <ul className="divide-y divide-ink-100">
              {outstanding.slice(0, 8).map((c) => (
                <li key={c.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink-900 truncate">{c.title}</p>
                    <p className="text-xs text-ink-400 truncate">{c.employeeName ?? '—'} · {c.laboratoryName ?? 'Laboratory not set'}</p>
                  </div>
                  <Badge color={c.status === 'awaiting_outcome' ? 'warning' : 'brand'}>{c.status.replace(/_/g, ' ')}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Follow-ups">
          {followUps.length === 0 ? <EmptyRow text="No follow-ups scheduled." /> : (
            <ul className="divide-y divide-ink-100">
              {followUps.slice(0, 8).map((c) => (
                <li key={c.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink-900 truncate">{c.nextAction || 'Follow-up'}</p>
                    <p className="text-xs text-ink-400 truncate">{c.employeeName ?? '—'} · Due {c.nextActionDueDate}</p>
                  </div>
                  {(c.nextActionDueDate ?? '') < today ? <Badge color="danger">Overdue</Badge> : <Badge color="ink">Scheduled</Badge>}
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel
          title="Submitted results"
          action={<button onClick={() => setPage('documents')} className="text-xs font-semibold text-brand-600 hover:text-brand-700">Open documents</button>}
        >
          {results.length === 0 ? <EmptyRow text="No laboratory results have been submitted yet." /> : (
            <ul className="divide-y divide-ink-100">
              {results.slice(0, 8).map((d) => (
                <li key={d.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink-900 truncate">{d.name}</p>
                    <p className="text-xs text-ink-400 truncate">{d.employeeName ?? d.companyName} · {d.uploadedDate}</p>
                  </div>
                  <Badge color={d.status === 'Verified' ? 'success' : d.status === 'Rejected' ? 'danger' : 'warning'}>{d.status}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Providers">
          <p className="text-sm text-ink-500 mb-4">Laboratory and specialist providers you coordinate with are listed in the providers directory.</p>
          <button onClick={() => setPage('providers')} className="btn-secondary w-full justify-center">Open providers</button>
        </Panel>
      </div>
    </div>
  );
}
