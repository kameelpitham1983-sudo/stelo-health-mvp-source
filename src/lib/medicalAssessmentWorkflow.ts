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
  assessmentType: MedicalAssessmentType;
  worksiteRequirements: string;
  consentRecorded: boolean;
  questionnaireStatus: QuestionnaireStatus;
  historyReviewed: boolean;
  investigationsRequested: string;
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
  channel: 'In app' | 'Manual outside the app' | 'Integration not connected';
}

export const MEDICAL_ASSESSMENT_STEPS: MedicalAssessmentStep[] = [
  { id: 'work_order', title: 'Approved work order received from onboarding', responsible: 'Coordinator', channel: 'In app' },
  { id: 'details', title: 'Assessment type and worksite requirements', responsible: 'Coordinator', channel: 'In app' },
  { id: 'consent', title: 'Employee consent and questionnaire', responsible: 'Employee, coordinator', channel: 'In app' },
  { id: 'history', title: 'Medical history reviewed for clinician', responsible: 'Clinician', channel: 'In app' },
  { id: 'investigations', title: 'Investigations and laboratory requests', responsible: 'Coordinator', channel: 'Manual outside the app' },
  { id: 'appointment', title: 'Provider appointment confirmed', responsible: 'Coordinator', channel: 'Integration not connected' },
  { id: 'clinician_review', title: 'Clinician review and findings', responsible: 'Authorised clinician', channel: 'In app' },
  { id: 'additional_review', title: 'Additional clinical review (if required)', responsible: 'Authorised clinician', channel: 'In app' },
  { id: 'outcome', title: 'Clinician-authorised fitness outcome', responsible: 'Authorised clinician', channel: 'In app' },
  { id: 'certificate', title: 'Certificate or outcome pack issued', responsible: 'Clinician', channel: 'In app' },
  { id: 'notified', title: 'Authorised parties notified', responsible: 'Coordinator', channel: 'Integration not connected' },
];

export const OUTCOME_LABELS: Record<FitnessOutcome, string> = {
  not_recorded: 'Not recorded',
  fit: 'Fit',
  fit_with_restrictions: 'Fit with restrictions',
  not_fit_pending_review: 'Not fit, pending review',
};

export const MEDICAL_ASSESSMENT_NOTICE =
  'Clinical decisions, restrictions and fitness outcomes are recorded by an authorised clinician. The app does not determine fitness and does not approve clinical content.';

export function getOutcomeGateBlocker(r: MedicalAssessmentRecord, workOrderApproved: boolean): string | null {
  if (!workOrderApproved) return 'The onboarding work order has not been approved.';
  if (!r.consentRecorded) return 'Employee consent has not been recorded.';
  if (r.questionnaireStatus !== 'completed') return 'The medical questionnaire has not been completed.';
  if (!r.clinicianReviewed) return 'A clinician has not reviewed the findings.';
  if (r.additionalReviewRequired && r.additionalReviewNote.trim() === '') return 'Additional review is required but has not been recorded.';
  return null;
}

export function getMedicalAssessmentStepId(r: MedicalAssessmentRecord): string | null {
  if (r.certificateIssued && r.completionNotified) return null;
  if (r.certificateIssued) return 'notified';
  if (r.fitnessOutcome !== 'not_recorded') return 'certificate';
  if (r.additionalReviewRequired && r.additionalReviewNote.trim() === '') return 'additional_review';
  if (!r.clinicianReviewed) return 'clinician_review';
  if (!r.appointmentConfirmed) return 'appointment';
  if (r.investigationsRequested.trim() === '') return 'investigations';
  if (!r.historyReviewed) return 'history';
  if (r.questionnaireStatus !== 'completed' || !r.consentRecorded) return 'consent';
  if (r.worksiteRequirements.trim() === '') return 'details';
  return 'outcome';
}

export function getMedicalAssessmentStatusLabel(r: MedicalAssessmentRecord): string {
  switch (getMedicalAssessmentStepId(r)) {
    case null: return 'Completed';
    case 'work_order': return 'Awaiting approved work order';
    case 'details': return 'Awaiting assessment details';
    case 'consent': return 'Awaiting consent and questionnaire';
    case 'history': return 'Awaiting history review';
    case 'investigations': return 'Awaiting investigation requests';
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
  base: Pick<MedicalAssessmentRecord, 'employeeId' | 'employeeName' | 'companyId' | 'companyName' | 'assessmentType' | 'mode'> &
    Partial<Pick<MedicalAssessmentRecord, 'caseId' | 'caseReference' | 'onboardingCaseId'>>,
): MedicalAssessmentRecord {
  return {
    ...base,
    id: crypto.randomUUID(),
    caseId: base.caseId ?? null,
    caseReference: base.caseReference ?? '',
    onboardingCaseId: base.onboardingCaseId ?? null,
    worksiteRequirements: '',
    consentRecorded: false,
    questionnaireStatus: 'not_sent',
    historyReviewed: false,
    investigationsRequested: '',
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
