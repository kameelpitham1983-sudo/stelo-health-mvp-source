import type { HealthStatus, MedicalType } from '@/types';

export type MedicalAssessmentType = 'Pre-employment' | 'Periodic' | 'Transfer';

export type QuestionnaireStatus = 'not_sent' | 'sent' | 'completed';

export type FitnessOutcome = 'not_recorded' | 'fit' | 'fit_with_restrictions' | 'not_fit_pending_review';

export interface MedicalAssessmentAuditEntry {
  action: string;
  actorName: string;
  actorRole: string;
  at: string;
}

export interface MedicalAssessmentRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  companyId: string | null;
  companyName: string;
  caseId: string | null;
  caseReference: string;
  onboardingCaseId: string | null;
  workOrderApproved: boolean;
  medicalId: string;
  medicalRecordType: string;
  assessmentType: MedicalAssessmentType;
  worksiteRequirements: string;
  consentRecorded: boolean;
  questionnaireStatus: QuestionnaireStatus;
  historyReviewed: boolean;
  investigationsRequested: string;
  labResultReceived: boolean;
  providerId: string | null;
  providerName: string;
  appointmentDate: string;
  appointmentConfirmed: boolean;
  findings: string;
  restrictions: string;
  clinicianName: string;
  clinicianReviewed: boolean;
  additionalReviewRequired: boolean;
  additionalReviewNote: string;
  fitnessOutcome: FitnessOutcome;
  certificateIssued: boolean;
  completionNotified: boolean;
  auditTrail: MedicalAssessmentAuditEntry[];
  createdAt: string;
  mode: 'demo' | 'live';
}

export interface MedicalAssessmentStep {
  id: string;
  title: string;
  responsible: string;
  channel: 'In app' | 'Manual outside the app';
}

export const MEDICAL_ASSESSMENT_STEPS: MedicalAssessmentStep[] = [
  { id: 'work_order', title: 'Approved work order received from onboarding', responsible: 'Coordinator', channel: 'In app' },
  { id: 'details', title: 'Assessment type and worksite requirements', responsible: 'Coordinator', channel: 'In app' },
  { id: 'consent', title: 'Employee consent and questionnaire', responsible: 'Employee, coordinator', channel: 'In app' },
  { id: 'history', title: 'Medical history reviewed for clinician', responsible: 'Clinician', channel: 'In app' },
  { id: 'investigations', title: 'Investigations and laboratory requests', responsible: 'Coordinator', channel: 'Manual outside the app' },
  { id: 'appointment', title: 'Provider appointment confirmed', responsible: 'Coordinator', channel: 'Manual outside the app' },
  { id: 'clinician_review', title: 'Clinician review and findings', responsible: 'Authorised clinician', channel: 'In app' },
  { id: 'additional_review', title: 'Additional clinical review (if required)', responsible: 'Authorised clinician', channel: 'In app' },
  { id: 'outcome', title: 'Clinician-authorised fitness outcome', responsible: 'Authorised clinician', channel: 'In app' },
  { id: 'certificate', title: 'Certificate or outcome pack issued', responsible: 'Clinician', channel: 'In app' },
  { id: 'notified', title: 'Authorised parties notified', responsible: 'Coordinator', channel: 'Manual outside the app' },
];

export const MEDICAL_RECORD_TYPE_FOR: Record<MedicalAssessmentType, MedicalType> = {
  'Pre-employment': 'Pre-Employment',
  Periodic: 'Annual Occupational',
  Transfer: 'Transfer',
};

export const MEDICAL_RESULT_FOR_OUTCOME: Record<Exclude<FitnessOutcome, 'not_recorded'>, string> = {
  fit: 'Fit for duty',
  fit_with_restrictions: 'Fit with Restrictions',
  not_fit_pending_review: 'Pending further assessment',
};

export const HEALTH_STATUS_FOR_OUTCOME: Record<Exclude<FitnessOutcome, 'not_recorded'>, HealthStatus> = {
  fit: 'Fit',
  fit_with_restrictions: 'Fit with Restrictions',
  not_fit_pending_review: 'Pending Assessment',
};

export const MEDICAL_ASSESSMENT_GUIDANCE: Record<string, { requiredInfo: string; nextStep: string }> = {
  work_order: { requiredInfo: 'An approved onboarding work order linked to this assessment.', nextStep: 'Approve the work order in onboarding, then link it here.' },
  details: { requiredInfo: 'Assessment type and worksite or job requirements.', nextStep: 'Describe the worksite requirements, then move to consent.' },
  consent: { requiredInfo: 'Employee consent recorded and the medical questionnaire completed.', nextStep: 'Record consent and the questionnaire status. Consent is never assumed.' },
  history: { requiredInfo: 'Questionnaire responses reviewed for the clinician.', nextStep: 'Mark the medical history as reviewed for the clinician.' },
  investigations: { requiredInfo: 'Investigations and laboratory requests, or "None required". Laboratory results must be received before clinician review when labs are requested.', nextStep: 'Record the requests. Laboratory forms are prepared outside the app. Tick when the laboratory result is received.' },
  appointment: { requiredInfo: 'A provider from the Provider Network and a confirmed appointment date.', nextStep: 'Confirm the appointment and tell the employee. Availability is not checked by the app.' },
  clinician_review: { requiredInfo: 'Clinician name, findings and any restrictions.', nextStep: 'The authorised clinician records findings and marks the review complete.' },
  additional_review: { requiredInfo: 'Reason for additional clinical review.', nextStep: 'Record the additional review requirement and the clinician who will complete it.' },
  outcome: { requiredInfo: 'A clinician-authorised fitness outcome.', nextStep: 'Only an authorised clinician records the outcome, once every gate above is satisfied.' },
  certificate: { requiredInfo: 'Confirmation that the certificate or outcome pack was issued.', nextStep: 'Issue the certificate or outcome pack, then confirm it here.' },
  notified: { requiredInfo: 'Confirmation that authorised parties were notified.', nextStep: 'Notify the employer and employee, then confirm here. No automatic notifications are connected.' },
};

export const OUTCOME_LABELS: Record<FitnessOutcome, string> = {
  not_recorded: 'Not recorded',
  fit: 'Fit',
  fit_with_restrictions: 'Fit with restrictions',
  not_fit_pending_review: 'Not fit, pending review',
};

export const MEDICAL_ASSESSMENT_NOTICE =
  'Clinical decisions, restrictions and fitness outcomes are recorded by an authorised clinician. The app does not determine fitness and does not approve clinical content.';

export function labsRequested(r: Pick<MedicalAssessmentRecord, 'investigationsRequested'>): boolean {
  const requested = r.investigationsRequested.trim();
  return requested !== '' && requested.toLowerCase() !== 'none required';
}

export function getOutcomeGateBlocker(r: MedicalAssessmentRecord): string | null {
  if (!r.workOrderApproved) return 'The onboarding work order has not been approved.';
  if (r.worksiteRequirements.trim() === '') return 'The worksite requirements have not been recorded.';
  if (!r.consentRecorded) return 'Employee consent has not been recorded.';
  if (r.questionnaireStatus !== 'completed') return 'The medical questionnaire has not been completed.';
  if (!r.historyReviewed) return 'The medical history has not been reviewed for the clinician.';
  if (r.investigationsRequested.trim() === '') return 'Investigations have not been recorded (enter "None required" if none).';
  if (!r.appointmentConfirmed) return 'The provider appointment has not been confirmed.';
  if (labsRequested(r) && !r.labResultReceived) return 'The requested laboratory result has not been received.';
  if (!r.clinicianReviewed || r.clinicianName.trim() === '') return 'A named clinician has not completed the review of the findings.';
  if (r.additionalReviewRequired && r.additionalReviewNote.trim() === '') return 'Additional review is required but has not been recorded.';
  return null;
}

export function getMedicalAssessmentStepId(r: MedicalAssessmentRecord): string | null {
  if (!r.workOrderApproved) return 'work_order';
  if (r.worksiteRequirements.trim() === '') return 'details';
  if (!r.consentRecorded || r.questionnaireStatus !== 'completed') return 'consent';
  if (!r.historyReviewed) return 'history';
  if (r.investigationsRequested.trim() === '') return 'investigations';
  if (labsRequested(r) && !r.labResultReceived) return 'investigations';
  if (!r.appointmentConfirmed) return 'appointment';
  if (!r.clinicianReviewed) return 'clinician_review';
  if (r.additionalReviewRequired && r.additionalReviewNote.trim() === '') return 'additional_review';
  if (r.fitnessOutcome === 'not_recorded') return 'outcome';
  if (!r.certificateIssued) return 'certificate';
  if (!r.completionNotified) return 'notified';
  return null;
}

export function getMedicalAssessmentStatusLabel(r: MedicalAssessmentRecord): string {
  switch (getMedicalAssessmentStepId(r)) {
    case null: return 'Completed';
    case 'work_order': return 'Awaiting approved work order';
    case 'details': return 'Awaiting assessment details';
    case 'consent': return 'Awaiting consent and questionnaire';
    case 'history': return 'Awaiting history review';
    case 'investigations': return labsRequested(r) && !r.labResultReceived ? 'Awaiting laboratory result' : 'Awaiting investigation requests';
    case 'appointment': return 'Awaiting appointment confirmation';
    case 'clinician_review': return 'Awaiting clinician review';
    case 'additional_review': return 'Additional clinical review required';
    case 'outcome': return 'Awaiting clinician-authorised outcome';
    case 'certificate': return 'Awaiting certificate issue';
    case 'notified': return 'Awaiting completion notification';
    default: return 'Awaiting next step';
  }
}

export function createEmptyMedicalAssessment(
  base: Pick<MedicalAssessmentRecord, 'employeeId' | 'employeeName' | 'companyId' | 'companyName' | 'assessmentType' | 'mode' | 'medicalId' | 'medicalRecordType'> &
    Partial<Pick<MedicalAssessmentRecord, 'caseId' | 'caseReference' | 'onboardingCaseId' | 'workOrderApproved'>>,
): MedicalAssessmentRecord {
  return {
    ...base,
    id: crypto.randomUUID(),
    caseId: base.caseId ?? null,
    caseReference: base.caseReference ?? '',
    onboardingCaseId: base.onboardingCaseId ?? null,
    workOrderApproved: base.workOrderApproved ?? false,
    providerId: null,
    worksiteRequirements: '',
    consentRecorded: false,
    questionnaireStatus: 'not_sent',
    historyReviewed: false,
    investigationsRequested: '',
    labResultReceived: false,
    providerName: '',
    appointmentDate: '',
    appointmentConfirmed: false,
    findings: '',
    restrictions: '',
    clinicianName: '',
    clinicianReviewed: false,
    additionalReviewRequired: false,
    additionalReviewNote: '',
    fitnessOutcome: 'not_recorded',
    certificateIssued: false,
    completionNotified: false,
    auditTrail: [],
    createdAt: new Date().toISOString(),
  };
}
