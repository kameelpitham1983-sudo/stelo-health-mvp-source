import { CheckCircle2, Circle, Lock, ShieldAlert } from 'lucide-react';
import { ScreeningActionPanel } from '@/components/ScreeningActionPanel';
import {
  SCREENING_SOURCE_NOTICE,
  SCREENING_SOURCE_REQUIREMENTS,
  SCREENING_STEPS,
  getScreeningStatusLabel,
  getScreeningStepId,
  type ScreeningRecord,
} from '@/lib/screeningWorkflow';
import type { ScreeningPatch } from '@/hooks/useScreeningRecords';
import type { PermissionAction } from '@/lib/permissions';

interface ScreeningDetailProps {
  record: ScreeningRecord;
  onUpdate: (patch: ScreeningPatch, action: string, permission: PermissionAction) => Promise<void>;
}

const stepDone = (r: ScreeningRecord, id: string): boolean => {
  const activeId = getScreeningStepId(r);
  const order = SCREENING_STEPS.map((s) => s.id);
  if (r.decision === 'declined') return id === 'consider';
  if (activeId === null) return true;
  return order.indexOf(id) < order.indexOf(activeId);
};

export function ScreeningDetail({ record, onUpdate }: ScreeningDetailProps) {
  const activeId = getScreeningStepId(record);
  const requirements = SCREENING_SOURCE_REQUIREMENTS[record.screeningType];

  return (
    <div className="space-y-6">
      <div className="card p-4 space-y-1">
        <h2 className="font-display font-bold text-ink-900">{record.employeeName}</h2>
        <p className="text-sm text-ink-600">{record.screeningType} screening · {record.companyName}</p>
        <p className="text-sm font-medium text-ink-800">Status: {getScreeningStatusLabel(record)}</p>
        {record.mode === 'demo' && <p className="text-xs text-ink-500">Demo example. Changes stay in this session only.</p>}
      </div>

      <div className="card p-4 space-y-3 border border-amber-200 bg-amber-50/40">
        <h3 className="font-display font-bold text-ink-900 flex items-center gap-2"><ShieldAlert size={18} className="text-amber-700" /> Source requirements (unverified)</h3>
        <p className="text-sm text-ink-700">{SCREENING_SOURCE_NOTICE}</p>
        <ul className="space-y-1 text-sm text-ink-600 list-disc pl-5">
          {requirements.map((req) => <li key={req.id}>{req.summary}</li>)}
        </ul>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <ol className="card p-4 space-y-2 h-fit">
          {SCREENING_STEPS.map((step) => {
            const done = stepDone(record, step.id);
            const current = step.id === activeId;
            const skipped = record.decision === 'declined' && step.id !== 'consider';
            return (
              <li key={step.id} className={`flex items-start gap-2 text-sm rounded-lg p-2 ${current ? 'bg-brand-50 text-ink-900' : 'text-ink-600'}`}>
                {done ? <CheckCircle2 size={16} className="text-green-600 mt-0.5 shrink-0" /> : skipped ? <Lock size={14} className="text-ink-400 mt-0.5 shrink-0" /> : <Circle size={16} className="text-ink-300 mt-0.5 shrink-0" />}
                <span>
                  <span className="block">{step.title}</span>
                  <span className="block text-xs text-ink-500">
                    {step.channel === 'Manual outside the app' ? 'Manual outside the app' : 'In app'}
                    {' · '}
                    {skipped ? 'Not required' : done ? 'Done' : current ? 'Current step' : 'Waiting'}
                  </span>
                </span>
              </li>
            );
          })}
        </ol>

        <div className="card p-4 sm:p-6">
          <ScreeningActionPanel key={`${record.id}-${activeId ?? 'done'}`} record={record} onUpdate={onUpdate} />
        </div>
      </div>

      <div className="card p-4">
        <h3 className="font-display font-bold text-ink-900 mb-3">Audit trail</h3>
        {record.auditTrail.length === 0 ? (
          <p className="text-sm text-ink-500">No actions recorded yet.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {[...record.auditTrail].reverse().map((entry, i) => (
              <li key={`${entry.at}-${i}`} className="text-ink-600">
                <span className="font-medium text-ink-800">{entry.action}</span> by {entry.actorName} ({entry.actorRole}) at {new Date(entry.at).toLocaleString()}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
