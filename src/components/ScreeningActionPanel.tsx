import { useState } from 'react';
import { Lock, AlertTriangle } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { can, type PermissionAction } from '@/lib/permissions';
import { SCREENING_STEPS, getScreeningStepId, type ScreeningRecord } from '@/lib/screeningWorkflow';
import type { ScreeningPatch } from '@/hooks/useScreeningRecords';

interface ScreeningActionPanelProps {
  record: ScreeningRecord;
  onUpdate: (patch: ScreeningPatch, action: string, permission: PermissionAction) => Promise<void>;
}

const inputClass = 'input w-full';
const primaryButton = 'btn-primary disabled:opacity-50 disabled:cursor-not-allowed';
const secondaryButton = 'btn-secondary disabled:opacity-50 disabled:cursor-not-allowed';

export function ScreeningActionPanel({ record, onUpdate }: ScreeningActionPanelProps) {
  const { user } = useApp();
  const stepId = getScreeningStepId(record);
  const step = SCREENING_STEPS.find((s) => s.id === stepId) ?? null;
  const [note, setNote] = useState('');
  const [date, setDate] = useState('');
  const [date2, setDate2] = useState('');
  const [mnemonic, setMnemonic] = useState(record.mnemonicReference);
  const [clinician, setClinician] = useState(record.responsibleClinician);
  const [referral, setReferral] = useState<boolean | null>(null);
  const [referralDetail, setReferralDetail] = useState('');
  const [followUp, setFollowUp] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!step) {
    return (
      <p className="text-sm text-ink-600">
        {record.decision === 'declined'
          ? 'The employee declined. No further screening steps are required.'
          : 'This screening is complete. No further steps are required.'}
      </p>
    );
  }

  const run = async (patch: ScreeningPatch, action: string, permission: PermissionAction) => {
    setBusy(true);
    setError(null);
    try {
      await onUpdate(patch, action, permission);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The action could not be completed.');
    } finally {
      setBusy(false);
    }
  };

  const manage = can(user, 'screening.manage');
  const review = can(user, 'screening.review');
  const permission: PermissionAction = step.id === 'review' || step.id === 'follow_up' ? 'screening.review' : 'screening.manage';
  const allowed = permission === 'screening.review' ? review : manage;

  const body = (() => {
    switch (step.id) {
      case 'consider':
        return (
          <div className="space-y-3">
            <label className="block text-sm font-medium text-ink-700">Why is screening being considered?</label>
            <textarea className={inputClass} rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
            <button className={primaryButton} disabled={!allowed || busy || note.trim() === ''} onClick={() => run({ considerationNote: note.trim() }, 'Consideration recorded', permission)}>Record consideration</button>
          </div>
        );
      case 'decision':
        return (
          <div className="space-y-3">
            <label className="block text-sm font-medium text-ink-700">Note on the employee's decision</label>
            <textarea className={inputClass} rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
            <div className="flex flex-wrap gap-2">
              <button className={primaryButton} disabled={!allowed || busy} onClick={() => run({ decision: 'accepted', decisionNote: note.trim() }, 'Employee accepted screening', permission)}>Employee accepts</button>
              <button className={secondaryButton} disabled={!allowed || busy} onClick={() => run({ decision: 'needs_information', decisionNote: note.trim() }, 'Employee needs more information', permission)}>Needs more information</button>
              <button className={secondaryButton} disabled={!allowed || busy} onClick={() => run({ decision: 'declined', decisionNote: note.trim(), closedReason: 'Employee declined screening' }, 'Employee declined, screening closed', permission)}>Employee declines</button>
            </div>
          </div>
        );
      case 'consent':
        return (
          <div className="space-y-3">
            <p className="text-sm text-ink-600">Only record consent once the employee has given it. Consent is never assumed.</p>
            <label className="block text-sm font-medium text-ink-700">Consent note (for example, where and how it was given)</label>
            <textarea className={inputClass} rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
            <label className="block text-sm font-medium text-ink-700">Responsible clinician</label>
            <input className={inputClass} value={clinician} onChange={(e) => setClinician(e.target.value)} placeholder="Name of the responsible clinician" />
            <button className={primaryButton} disabled={!allowed || busy || note.trim() === '' || clinician.trim() === ''} onClick={() => run({ consentRecorded: true, consentNote: note.trim(), responsibleClinician: clinician.trim() }, 'Consent recorded', permission)}>Record consent</button>
          </div>
        );
      case 'form':
        return (
          <div className="space-y-3">
            <p className="flex items-start gap-2 text-sm text-ink-600 bg-amber-50 rounded-lg p-3"><AlertTriangle size={16} className="mt-0.5 shrink-0" /> The Lancet request form is prepared outside this app. No Lancet connection exists.</p>
            <label className="block text-sm font-medium text-ink-700">Company mnemonic/reference (from your Lancet account)</label>
            <input className={inputClass} value={mnemonic} onChange={(e) => setMnemonic(e.target.value)} placeholder="Enter exactly as shown in your Lancet account" />
            <button className={primaryButton} disabled={!allowed || busy || mnemonic.trim() === ''} onClick={() => run({ requestFormPrepared: true, mnemonicReference: mnemonic.trim() }, 'Laboratory request form prepared', permission)}>Mark request form prepared</button>
          </div>
        );
      case 'fulfilment':
        return (
          <div className="space-y-3">
            <label className="block text-sm font-medium text-ink-700">How will the kit reach the employee?</label>
            <div className="flex flex-wrap gap-2">
              <button className={secondaryButton} disabled={!allowed || busy} onClick={() => setNote('courier')}>Courier</button>
              <button className={secondaryButton} disabled={!allowed || busy} onClick={() => setNote('collection')}>Collection</button>
            </div>
            <label className="block text-sm font-medium text-ink-700">Date dispatched</label>
            <input type="date" className={inputClass} value={date} onChange={(e) => setDate(e.target.value)} />
            <p className="text-xs text-ink-500">Courier dispatch is manual. No courier integration is connected.</p>
            <button className={primaryButton} disabled={!allowed || busy || (note !== 'courier' && note !== 'collection') || date === ''} onClick={() => run({ fulfilment: note as 'courier' | 'collection', kitDispatchedOn: date }, `Kit dispatched by ${note}`, permission)}>Record kit dispatched</button>
          </div>
        );
      case 'sample':
        return (
          <div className="space-y-3">
            <label className="block text-sm font-medium text-ink-700">Date kit received back</label>
            <input type="date" className={inputClass} value={date} onChange={(e) => setDate(e.target.value)} />
            <label className="block text-sm font-medium text-ink-700">Date sample submitted to laboratory</label>
            <input type="date" className={inputClass} value={date2} onChange={(e) => setDate2(e.target.value)} />
            <button className={primaryButton} disabled={!allowed || busy || date === '' || date2 === ''} onClick={() => run({ kitReceivedOn: date, sampleSubmittedOn: date2 }, 'Sample received and submitted to laboratory', permission)}>Record sample submission</button>
          </div>
        );
      case 'result':
        return (
          <div className="space-y-3">
            <label className="block text-sm font-medium text-ink-700">Date result received</label>
            <input type="date" className={inputClass} value={date} onChange={(e) => setDate(e.target.value)} />
            <label className="block text-sm font-medium text-ink-700">Note on the result (record receipt only, not interpretation)</label>
            <textarea className={inputClass} rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
            <button className={primaryButton} disabled={!allowed || busy || date === ''} onClick={() => run({ resultReceivedOn: date, resultStatusNote: note.trim() }, 'Laboratory result received and routed to clinician', permission)}>Record result received</button>
          </div>
        );
      case 'review':
        return (
          <div className="space-y-3">
            <label className="block text-sm font-medium text-ink-700">Clinician review outcome</label>
            <textarea className={inputClass} rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="The clinician records their own interpretation here" />
            <div className="flex flex-wrap gap-2">
              <button className={referral === true ? primaryButton : secondaryButton} disabled={!allowed || busy} onClick={() => setReferral(true)}>Referral required</button>
              <button className={referral === false ? primaryButton : secondaryButton} disabled={!allowed || busy} onClick={() => setReferral(false)}>No referral required</button>
            </div>
            {referral === true && (
              <>
                <label className="block text-sm font-medium text-ink-700">Referral details</label>
                <input className={inputClass} value={referralDetail} onChange={(e) => setReferralDetail(e.target.value)} />
                <label className="block text-sm font-medium text-ink-700">Follow-up action</label>
                <input className={inputClass} value={followUp} onChange={(e) => setFollowUp(e.target.value)} />
              </>
            )}
            <button className={primaryButton} disabled={!allowed || busy || note.trim() === '' || referral === null || (referral && (referralDetail.trim() === '' || followUp.trim() === ''))} onClick={() => run({
              review: {
                reviewedBy: user?.name ?? 'Unknown',
                reviewedAt: new Date().toISOString().slice(0, 10),
                outcomeNote: note.trim(),
                referralRequired: referral,
                referralDetail: referral ? referralDetail.trim() : '',
                followUpAction: referral ? followUp.trim() : '',
                completed: referral === false,
              },
            }, 'Clinician review recorded', 'screening.review')}>Record clinician review</button>
          </div>
        );
      case 'follow_up':
        return (
          <div className="space-y-3">
            <p className="text-sm text-ink-600">Follow-up needed: {record.review?.followUpAction}</p>
            <button className={primaryButton} disabled={!allowed || busy} onClick={() => run({
              review: record.review ? { ...record.review, completed: true } : null,
            }, 'Referral and follow-up marked complete', 'screening.review')}>Mark referral and follow-up complete</button>
          </div>
        );
      default:
        return null;
    }
  })();

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-display font-bold text-ink-900">{step.title}</h3>
        <p className="text-sm text-ink-600 mt-1">Responsible: {step.responsible} · Channel: {step.channel}</p>
      </div>
      {!allowed && (
        <p className="flex items-center gap-2 text-sm text-ink-600 bg-ink-50 rounded-lg p-3"><Lock size={16} /> Your role cannot complete this step.</p>
      )}
      {body}
      {error && <p className="text-sm text-red-700 bg-red-50 rounded-lg p-3">{error}</p>}
      <p className="text-sm text-ink-500"><span className="font-medium text-ink-700">If information is missing:</span> {step.missingInfo}</p>
    </div>
  );
}
