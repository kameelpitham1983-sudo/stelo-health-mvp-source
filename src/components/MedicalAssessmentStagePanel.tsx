import { useState } from 'react';
import { CheckCircle2, Lock } from 'lucide-react';
import { useProviders } from '@/hooks/useSupabaseData';
import type { MedicalAssessmentPatch } from '@/hooks/useMedicalAssessments';
import {
  MEDICAL_ASSESSMENT_GUIDANCE,
  MEDICAL_ASSESSMENT_STEPS,
  OUTCOME_LABELS,
  getMedicalAssessmentStepId,
  getOutcomeGateBlocker,
  labsRequested,
  type FitnessOutcome,
  type MedicalAssessmentRecord,
  type QuestionnaireStatus,
} from '@/lib/medicalAssessmentWorkflow';

interface Props {
  record: MedicalAssessmentRecord;
  canManage: boolean;
  canClinical: boolean;
  onUpdate: (patch: MedicalAssessmentPatch, action: string) => Promise<void>;
}

const CLINICAL_STAGES = ['history', 'clinician_review', 'additional_review', 'outcome'];

const QUESTIONNAIRE_OPTIONS: { value: QuestionnaireStatus; label: string }[] = [
  { value: 'not_sent', label: 'Not sent' },
  { value: 'sent', label: 'Sent to employee' },
  { value: 'completed', label: 'Completed' },
];

const OUTCOME_OPTIONS = (Object.keys(OUTCOME_LABELS) as FitnessOutcome[]).filter((o) => o !== 'not_recorded');

export function MedicalAssessmentStagePanel({ record, canManage, canClinical, onUpdate }: Props) {
  const { data: providers } = useProviders();
  const stepId = getMedicalAssessmentStepId(record);
  const guidance = stepId ? MEDICAL_ASSESSMENT_GUIDANCE[stepId] : null;
  const step = MEDICAL_ASSESSMENT_STEPS.find((s) => s.id === stepId) ?? null;
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const value = (key: string, fallback: string) => draft[key] ?? fallback;

  const run = async (patch: MedicalAssessmentPatch, action: string) => {
    setSaving(true);
    setError(null);
    try {
      await onUpdate(patch, action);
      setDraft({});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The change could not be saved.');
    } finally {
      setSaving(false);
    }
  };

  const outcomeBlocker = getOutcomeGateBlocker(record);
  const clinicalDisabled = !canClinical || saving;
  const manageDisabled = !canManage || saving;
  const isClinicalStage = stepId !== null && CLINICAL_STAGES.includes(stepId);

  const renderForm = () => {
    switch (stepId) {
      case 'work_order':
        return <p className="text-sm text-ink-600">This assessment was created without an approved onboarding work order. Link an approved work order from onboarding to continue.</p>;
      case 'details':
        return (
          <div className="space-y-2">
            <textarea className="input w-full min-h-[96px]" disabled={manageDisabled} placeholder="Worksite and job requirements" value={value('details', record.worksiteRequirements)} onChange={(e) => setDraft({ ...draft, details: e.target.value })} />
            <button className="btn-primary" disabled={manageDisabled || value('details', record.worksiteRequirements).trim() === ''} onClick={() => run({ worksiteRequirements: value('details', record.worksiteRequirements) }, 'Worksite requirements recorded')}>Save requirements</button>
          </div>
        );
      case 'consent':
        return (
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm text-ink-800"><input type="checkbox" disabled={manageDisabled} checked={record.consentRecorded} onChange={(e) => run({ consentRecorded: e.target.checked }, e.target.checked ? 'Employee consent recorded' : 'Employee consent withdrawn')} /> Employee consent recorded</label>
            <select className="input w-full" disabled={manageDisabled} value={record.questionnaireStatus} onChange={(e) => run({ questionnaireStatus: e.target.value as QuestionnaireStatus }, 'Questionnaire status updated')}>
              {QUESTIONNAIRE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        );
      case 'history':
        return <label className="flex items-center gap-2 text-sm text-ink-800"><input type="checkbox" disabled={clinicalDisabled} checked={record.historyReviewed} onChange={(e) => run({ historyReviewed: e.target.checked }, 'Medical history marked as reviewed')} /> Medical history reviewed</label>;
      case 'investigations':
        return (
          <div className="space-y-3">
            <textarea className="input w-full min-h-[96px]" disabled={manageDisabled} placeholder="Investigations requested, or 'None required'" value={value('investigations', record.investigationsRequested)} onChange={(e) => setDraft({ ...draft, investigations: e.target.value })} />
            <button className="btn-primary" disabled={manageDisabled || value('investigations', record.investigationsRequested).trim() === ''} onClick={() => run({ investigationsRequested: value('investigations', record.investigationsRequested) }, 'Investigations recorded')}>Save investigations</button>
            {labsRequested(record) && (
              <label className="flex items-center gap-2 text-sm text-ink-800"><input type="checkbox" disabled={manageDisabled} checked={record.labResultReceived} onChange={(e) => run({ labResultReceived: e.target.checked }, e.target.checked ? 'Laboratory result received' : 'Laboratory result marked as outstanding')} /> Laboratory result received</label>
            )}
          </div>
        );
      case 'appointment':
        return (
          <div className="space-y-3">
            <select className="input w-full" disabled={manageDisabled} value={record.providerName} onChange={(e) => {
              const p = providers.find((x) => x.name === e.target.value);
              run({ providerId: p?.id ?? null, providerName: e.target.value }, 'Provider selected');
            }}>
              <option value="">Select a provider</option>
              {providers.map((p) => <option key={p.id} value={p.name}>{p.name}</option>)}
            </select>
            <p className="text-xs text-ink-500">Labworks is a laboratory service, not a clinician, and is not part of the Provider Network. Provider availability is not checked by the app.</p>
            <input type="date" className="input w-full" disabled={manageDisabled} value={record.appointmentDate} onChange={(e) => run({ appointmentDate: e.target.value }, 'Appointment date recorded')} />
            <label className="flex items-center gap-2 text-sm text-ink-800"><input type="checkbox" disabled={manageDisabled || record.providerName === '' || record.appointmentDate === ''} checked={record.appointmentConfirmed} onChange={(e) => run({ appointmentConfirmed: e.target.checked }, e.target.checked ? 'Appointment confirmed with provider' : 'Appointment confirmation removed')} /> Appointment confirmed with the provider</label>
          </div>
        );
      case 'clinician_review':
        return (
          <div className="space-y-2">
            <input className="input w-full" disabled={clinicalDisabled} placeholder="Reviewing clinician name" value={value('clinician', record.clinicianName)} onChange={(e) => setDraft({ ...draft, clinician: e.target.value })} />
            <textarea className="input w-full min-h-[96px]" disabled={clinicalDisabled} placeholder="Findings (entered by the clinician)" value={value('findings', record.findings)} onChange={(e) => setDraft({ ...draft, findings: e.target.value })} />
            <textarea className="input w-full min-h-[72px]" disabled={clinicalDisabled} placeholder="Restrictions, if any" value={value('restrictions', record.restrictions)} onChange={(e) => setDraft({ ...draft, restrictions: e.target.value })} />
            <button className="btn-secondary" disabled={clinicalDisabled || value('clinician', record.clinicianName).trim() === ''} onClick={() => run({ clinicianName: value('clinician', record.clinicianName), findings: value('findings', record.findings), restrictions: value('restrictions', record.restrictions) }, 'Clinician findings saved')}>Save findings</button>
            <label className="flex items-center gap-2 text-sm text-ink-800"><input type="checkbox" disabled={clinicalDisabled || record.clinicianName === ''} checked={record.clinicianReviewed} onChange={(e) => run({ clinicianReviewed: e.target.checked }, e.target.checked ? 'Clinician review completed' : 'Clinician review reopened')} /> Clinician review completed</label>
          </div>
        );
      case 'additional_review':
        return (
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm text-ink-800"><input type="checkbox" disabled={clinicalDisabled} checked={record.additionalReviewRequired} onChange={(e) => run({ additionalReviewRequired: e.target.checked }, 'Additional review requirement set')} /> Additional clinical review required</label>
            <textarea className="input w-full min-h-[72px]" disabled={clinicalDisabled} placeholder="Reason and clinician completing the review" value={value('additional', record.additionalReviewNote)} onChange={(e) => setDraft({ ...draft, additional: e.target.value })} />
            <button className="btn-secondary" disabled={clinicalDisabled || value('additional', record.additionalReviewNote).trim() === ''} onClick={() => run({ additionalReviewNote: value('additional', record.additionalReviewNote) }, 'Additional review recorded')}>Save review note</button>
          </div>
        );
      case 'outcome':
        return (
          <div className="space-y-2">
            {outcomeBlocker && <p className="flex items-start gap-2 text-sm text-warning-600 bg-warning-50 rounded-lg p-3"><Lock size={16} className="mt-0.5 shrink-0" /> {outcomeBlocker} The outcome cannot be recorded yet.</p>}
            <select className="input w-full" disabled={clinicalDisabled || outcomeBlocker !== null} value={record.fitnessOutcome} onChange={(e) => run({ fitnessOutcome: e.target.value as FitnessOutcome }, `Clinician outcome recorded: ${OUTCOME_LABELS[e.target.value as FitnessOutcome]}`)}>
              <option value="not_recorded">Select outcome</option>
              {OUTCOME_OPTIONS.map((o) => <option key={o} value={o}>{OUTCOME_LABELS[o]}</option>)}
            </select>
            <p className="text-xs text-ink-500">Only an authorised clinician records this outcome. The app does not determine fitness.</p>
          </div>
        );
      case 'certificate':
        return (
          <div className="space-y-2">
            <p className="text-xs text-ink-500">Confirms that the certificate or outcome pack was issued. The app does not generate certificates from this step.</p>
            <label className="flex items-center gap-2 text-sm text-ink-800"><input type="checkbox" disabled={manageDisabled} checked={record.certificateIssued} onChange={(e) => run({ certificateIssued: e.target.checked }, 'Certificate or outcome pack confirmed')} /> Certificate or outcome pack issued</label>
          </div>
        );
      case 'notified':
        return (
          <div className="space-y-2">
            <p className="text-xs text-ink-500">No email or messaging is connected. Record here once you have notified the employer and employee yourself.</p>
            <label className="flex items-center gap-2 text-sm text-ink-800"><input type="checkbox" disabled={manageDisabled} checked={record.completionNotified} onChange={(e) => run({ completionNotified: e.target.checked }, 'Authorised parties notified')} /> Authorised parties notified</label>
          </div>
        );
      default:
        return null;
    }
  };

  if (!stepId) {
    return (
      <div className="card p-4 flex items-center gap-2 text-sm text-success-600"><CheckCircle2 size={18} /> This assessment is complete and the outcome has been recorded.</div>
    );
  }

  return (
    <div className="card p-4 space-y-3">
      <div>
        <p className="text-xs uppercase tracking-wide text-ink-500">Current stage</p>
        <h2 className="font-display font-bold text-ink-900">{step?.title}</h2>
        <p className="text-sm text-ink-600">Responsible: {step?.responsible}</p>
      </div>
      {guidance && (
        <div className="grid gap-2 sm:grid-cols-2 text-sm">
          <p className="bg-ink-50 rounded-lg p-3"><span className="font-medium text-ink-800">Required:</span> <span className="text-ink-600">{guidance.requiredInfo}</span></p>
          <p className="bg-ink-50 rounded-lg p-3"><span className="font-medium text-ink-800">Next step:</span> <span className="text-ink-600">{guidance.nextStep}</span></p>
        </div>
      )}
      {error && <p className="text-sm text-red-700">{error}</p>}
      {!canManage && !canClinical && <p className="text-xs text-ink-500">View only for your role.</p>}
      {isClinicalStage && !canClinical && <p className="text-xs text-ink-500">Clinical sections are recorded by an authorised provider clinician. Your role can view and coordinate this stage only.</p>}
      {renderForm()}
    </div>
  );
}
