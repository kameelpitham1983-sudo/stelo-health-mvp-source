import { useState } from 'react';
import { Lock, AlertTriangle } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { can } from '@/lib/permissions';
import {
  REGISTRATION_FIELDS,
  REGISTRATION_LABELS,
  type OnboardingCase,
  type OnboardingPatch,
  type OnboardingStageDefinition,
} from '@/lib/onboardingStages';

interface OnboardingStagePanelProps {
  caseItem: OnboardingCase;
  stage: OnboardingStageDefinition;
  onUpdate: (patch: OnboardingPatch, action: string, stage: OnboardingStageDefinition) => Promise<void>;
}

const inputClass = 'input w-full';
const primaryButton = 'btn-primary disabled:opacity-50 disabled:cursor-not-allowed';
const secondaryButton = 'btn-secondary disabled:opacity-50 disabled:cursor-not-allowed';

export function OnboardingStagePanel({ caseItem, stage, onUpdate }: OnboardingStagePanelProps) {
  const { user } = useApp();
  const [text, setText] = useState('');
  const [fields, setFields] = useState<Record<string, string>>(() =>
    Object.fromEntries(REGISTRATION_FIELDS.map((f) => [f, caseItem.data[f]])),
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allowed = can(user, stage.permission);

  const run = async (patch: OnboardingPatch, action: string) => {
    setBusy(true);
    setError(null);
    try {
      await onUpdate(patch, action, stage);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The action could not be completed.');
    } finally {
      setBusy(false);
    }
  };

  const notAllowed = !allowed && (
    <p className="flex items-center gap-2 text-sm text-ink-600 bg-ink-50 rounded-lg p-3">
      <Lock size={16} /> Your role cannot complete this step. The responsible party is {stage.responsible}.
    </p>
  );

  const body = (() => {
    switch (stage.id) {
      case 1:
        return (
          <div className="space-y-3">
            <label className="block text-sm font-medium text-ink-700">Client User ID or passport reference</label>
            <input className={inputClass} value={text} onChange={(e) => setText(e.target.value)} placeholder="Reference from the client HR system" />
            <button className={primaryButton} disabled={!allowed || busy || text.trim() === ''} onClick={() => run({ identityReference: text.trim() }, 'Identity reference recorded')}>Record identity reference</button>
          </div>
        );
      case 2:
        return (
          <button className={primaryButton} disabled={!allowed || busy} onClick={() => run({ introShown: true }, 'Introduction and consent information shown')}>Confirm introduction shown</button>
        );
      case 3:
        return (
          <div className="flex flex-wrap gap-2">
            <button className={primaryButton} disabled={!allowed || busy} onClick={() => run({ consentStatus: 'accepted' }, 'Consent accepted')}>Employee accepted</button>
            <button className={secondaryButton} disabled={!allowed || busy} onClick={() => run({ consentStatus: 'clarification' }, 'Consent needs clarification')}>Needs clarification</button>
            <button className={secondaryButton} disabled={!allowed || busy} onClick={() => run({ consentStatus: 'declined', status: 'closed', closedReason: 'Employee declined consent' }, 'Consent declined, case closed')}>Employee declined</button>
          </div>
        );
      case 4:
        return (
          <div className="space-y-3">
            <label className="block text-sm font-medium text-ink-700">Signed or modified consent reference</label>
            <input className={inputClass} value={text} onChange={(e) => setText(e.target.value)} placeholder="Document reference" />
            <button className={primaryButton} disabled={!allowed || busy || text.trim() === ''} onClick={() => run({ consentReference: text.trim() }, 'Signed or modified consent submitted')}>Record consent submission</button>
          </div>
        );
      case 5:
        return (
          <button className={primaryButton} disabled={!allowed || busy} onClick={() => run({ consentReviewed: true }, 'Consent reviewed by STelo Health')}>Mark consent reviewed</button>
        );
      case 6:
        return (
          <div className="space-y-3">
            <p className="text-sm text-ink-600">The video call takes place outside the app. Record it only once it has happened.</p>
            <button className={primaryButton} disabled={!allowed || busy} onClick={() => run({ clarificationResolved: true }, 'Clarification video call recorded')}>Record video call completed</button>
          </div>
        );
      case 7:
        return (
          <div className="flex flex-wrap gap-2">
            <button className={primaryButton} disabled={!allowed || busy} onClick={() => run({ wantsToProceed: true }, 'Employee chose to proceed')}>Employee chose to proceed</button>
            <button className={secondaryButton} disabled={!allowed || busy} onClick={() => run({ wantsToProceed: false, status: 'closed', closedReason: 'Employee chose not to proceed' }, 'Employee chose not to proceed, case closed')}>Employee chose not to proceed</button>
          </div>
        );
      case 8: {
        const complete = REGISTRATION_FIELDS.every((f) => (fields[f] ?? '').trim() !== '');
        return (
          <div className="space-y-3">
            <p className="text-sm text-ink-600">Do not enter names or surnames here.</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {REGISTRATION_FIELDS.map((f) => (
                <div key={f}>
                  <label className="block text-sm font-medium text-ink-700 mb-1">{REGISTRATION_LABELS[f]}</label>
                  <input className={inputClass} value={fields[f] ?? ''} onChange={(e) => setFields({ ...fields, [f]: e.target.value })} />
                </div>
              ))}
            </div>
            <button className={primaryButton} disabled={!allowed || busy || !complete} onClick={() => run(Object.fromEntries(REGISTRATION_FIELDS.map((f) => [f, (fields[f] ?? '').trim()])) as OnboardingPatch, 'Registration details recorded')}>Save registration</button>
          </div>
        );
      }
      case 9:
        return (
          <div className="space-y-3">
            <p className="flex items-start gap-2 text-sm text-ink-600 bg-amber-50 rounded-lg p-3"><AlertTriangle size={16} className="mt-0.5 shrink-0" /> No SMS or verification service is connected. Confirm only after verification has been completed by other means.</p>
            <button className={primaryButton} disabled={!allowed || busy} onClick={() => run({ twoFactorStatus: caseItem.mode === 'demo' ? 'simulated' : 'verified' }, caseItem.mode === 'demo' ? 'Two-factor verification simulated (Demo Mode)' : 'Two-factor verification recorded')}>
              {caseItem.mode === 'demo' ? 'Simulate verification (Demo Mode)' : 'Record verification completed'}
            </button>
          </div>
        );
      case 10:
        return (
          <button className={primaryButton} disabled={!allowed || busy} onClick={() => run({ workOrderNumber: `WO-${Date.now().toString(36).toUpperCase()}`, workOrderStatus: 'not_created' }, 'Work order generated')}>Generate work order</button>
        );
      case 11:
        return (
          <div className="space-y-3">
            <p className="text-sm text-ink-600">Sending the approval link by email is not connected. Mark as sent once the client has been notified outside the app.</p>
            <button className={primaryButton} disabled={!allowed || busy} onClick={() => run({ workOrderStatus: 'pending_approval' }, 'Work order sent for client HR approval')}>Mark sent for approval</button>
          </div>
        );
      case 12:
        return (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <button className={primaryButton} disabled={!allowed || busy || caseItem.data.workOrderStatus !== 'pending_approval'} onClick={() => run({ workOrderStatus: 'approved' }, 'Work order approved by client HR')}>Approve work order</button>
            </div>
            <label className="block text-sm font-medium text-ink-700">Reason for rejection</label>
            <input className={inputClass} value={text} onChange={(e) => setText(e.target.value)} placeholder="Required to reject" />
            <button className={secondaryButton} disabled={!allowed || busy || caseItem.data.workOrderStatus !== 'pending_approval' || text.trim() === ''} onClick={() => run({ workOrderStatus: 'rejected', status: 'closed', closedReason: `Work order rejected: ${text.trim()}` }, 'Work order rejected, case closed')}>Reject and close case</button>
          </div>
        );
      case 13:
        return (
          <div className="space-y-3">
            <p className="text-sm text-ink-600">Once opened, arrange the medical in Medicals, Appointments and Guarantees of Payment. These follow the existing workflow.</p>
            <button className={primaryButton} disabled={!allowed || busy} onClick={() => run({ status: 'case_opened' }, 'Employee case opened')}>Open employee case</button>
          </div>
        );
      default:
        return null;
    }
  })();

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-display font-bold text-ink-900">Stage {stage.id}: {stage.title}</h3>
        <p className="text-sm text-ink-600 mt-1">{stage.purpose}</p>
      </div>
      <dl className="grid gap-3 sm:grid-cols-2 text-sm">
        <div><dt className="font-medium text-ink-700">Responsible</dt><dd className="text-ink-600">{stage.responsible}</dd></div>
        <div><dt className="font-medium text-ink-700">Channel</dt><dd className="text-ink-600">{stage.channel}</dd></div>
        <div className="sm:col-span-2"><dt className="font-medium text-ink-700">Information required</dt><dd className="text-ink-600">{stage.requiredInfo}</dd></div>
        <div className="sm:col-span-2"><dt className="font-medium text-ink-700">If information is missing</dt><dd className="text-ink-600">{stage.missingInfo}</dd></div>
      </dl>
      {notAllowed}
      {body}
      {error && <p className="text-sm text-red-700 bg-red-50 rounded-lg p-3">{error}</p>}
      <p className="text-sm text-ink-500"><span className="font-medium text-ink-700">Next step:</span> {stage.nextStep}</p>
    </div>
  );
}
