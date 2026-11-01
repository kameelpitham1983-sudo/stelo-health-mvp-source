export type ScreeningType = 'HPV' | 'Colorectal';

export type ScreeningDecision = 'not_recorded' | 'accepted' | 'declined' | 'needs_information';

export type ScreeningFulfilment = 'not_chosen' | 'courier' | 'collection';

export interface ScreeningReview {
  reviewedBy: string;
  reviewedAt: string;
  outcomeNote: string;
  referralRequired: boolean | null;
  referralDetail: string;
  followUpAction: string;
  completed: boolean;
}

export interface ScreeningAuditEntry {
  action: string;
  actorName: string;
  actorRole: string;
  at: string;
}

export interface ScreeningRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  companyId: string | null;
  companyName: string;
  screeningType: ScreeningType;
  considerationNote: string;
  decision: ScreeningDecision;
  decisionNote: string;
  consentRecorded: boolean;
  consentNote: string;
  responsibleClinician: string;
  requestFormPrepared: boolean;
  mnemonicReference: string;
  fulfilment: ScreeningFulfilment;
  kitDispatchedOn: string;
  kitReceivedOn: string;
  sampleSubmittedOn: string;
  resultReceivedOn: string;
  resultStatusNote: string;
  review: ScreeningReview | null;
  closedReason: string;
  auditTrail: ScreeningAuditEntry[];
  createdAt: string;
  mode: 'demo' | 'live';
}


export interface ScreeningSourceRequirement {
  id: string;
  summary: string;
  status: 'unverified_proposal';
}

export const SCREENING_SOURCE_NOTICE =
  'Eligibility and timing criteria are not approved. Clinical content must be reviewed and approved by the clinical lead before it is shown as guidance. Nothing in this section determines whether a person should be screened.';

export const SCREENING_SOURCE_REQUIREMENTS: Record<ScreeningType, ScreeningSourceRequirement[]> = {
  HPV: [
    { id: 'hpv-eligibility', summary: 'Eligibility criteria (age and sex) have not been approved. Earlier suggestions are unverified and must not be applied automatically.', status: 'unverified_proposal' },
    { id: 'hpv-test', summary: 'Test method, sample type and collection instructions are pending clinical approval.', status: 'unverified_proposal' },
  ],
  Colorectal: [
    { id: 'crc-eligibility', summary: 'Eligibility criteria (age) have not been approved. Earlier suggestions are unverified and must not be applied automatically.', status: 'unverified_proposal' },
    { id: 'crc-test', summary: 'Test method, kit instructions and result thresholds are pending clinical approval.', status: 'unverified_proposal' },
  ],
};

export interface ScreeningStep {
  id: string;
  title: string;
  responsible: string;
  channel: 'In app' | 'Manual outside the app';
  nextAction: string;
  missingInfo: string;
}

export const SCREENING_STEPS: ScreeningStep[] = [
  {
    id: 'consider',
    title: 'Identified for clinician consideration',
    responsible: 'Clinician',
    channel: 'In app',
    nextAction: 'Review the source requirements and discuss the option with the employee.',
    missingInfo: 'Add a note explaining why screening is being considered.',
  },
  {
    id: 'decision',
    title: 'Employee decision',
    responsible: 'Employee, recorded by clinician',
    channel: 'In app',
    nextAction: 'Record whether the employee accepts, declines or needs more information.',
    missingInfo: 'The decision must come from the employee. Do not record one on their behalf.',
  },
  {
    id: 'consent',
    title: 'Consent recorded',
    responsible: 'Clinician',
    channel: 'In app',
    nextAction: 'Record consent and the responsible clinician. Consent is never assumed.',
    missingInfo: 'Consent has not been recorded.',
  },
  {
    id: 'form',
    title: 'Laboratory request form prepared',
    responsible: 'Clinician or coordinator',
    channel: 'Manual outside the app',
    nextAction: 'Prepare the Lancet request form outside the app and record it as prepared.',
    missingInfo: 'The company mnemonic/reference has not been provided. Enter it from the Lancet account. It is not invented by the app.',
  },
  {
    id: 'fulfilment',
    title: 'Kit fulfilment',
    responsible: 'Coordinator',
    channel: 'Manual outside the app',
    nextAction: 'Choose courier or collection, then record dispatch.',
    missingInfo: 'Choose whether the kit is couriered or collected.',
  },
  {
    id: 'sample',
    title: 'Sample collection and submission',
    responsible: 'Employee and coordinator',
    channel: 'Manual outside the app',
    nextAction: 'Record when the kit was received back and submitted to the laboratory.',
    missingInfo: 'Sample collection and laboratory submission happen outside the app. Record them once they have taken place.',
  },
  {
    id: 'result',
    title: 'Laboratory result received',
    responsible: 'Coordinator',
    channel: 'Manual outside the app',
    nextAction: 'Record receipt of the result and route it to the responsible clinician.',
    missingInfo: 'No result has been recorded yet.',
  },
  {
    id: 'review',
    title: 'Clinician review',
    responsible: 'Responsible clinician',
    channel: 'In app',
    nextAction: 'Record the review outcome. The clinician makes all clinical interpretation.',
    missingInfo: 'The result must be reviewed by the responsible clinician.',
  },
  {
    id: 'follow_up',
    title: 'Referral and follow-up',
    responsible: 'Responsible clinician',
    channel: 'In app',
    nextAction: 'Record whether a referral or follow-up is required, then mark the screening complete.',
    missingInfo: 'Record whether a referral or follow-up is required.',
  },
];

export function getScreeningStepId(r: ScreeningRecord): string | null {
  if (r.decision === 'declined') return null;
  if (r.decision === 'not_recorded' || r.decision === 'needs_information') return 'decision';
  if (!r.consentRecorded) return 'consent';
  if (!r.requestFormPrepared) return 'form';
  if (r.fulfilment === 'not_chosen' || r.kitDispatchedOn === '') return 'fulfilment';
  if (r.kitReceivedOn === '' || r.sampleSubmittedOn === '') return 'sample';
  if (r.resultReceivedOn === '') return 'result';
  if (!r.review) return 'review';
  if (!r.review.completed) return 'follow_up';
  return null;
}

export function getScreeningStatusLabel(r: ScreeningRecord): string {
  if (r.decision === 'declined') return 'Declined by employee';
  if (r.review?.completed) return 'Completed';
  switch (getScreeningStepId(r)) {
    case 'consider': return 'Awaiting consideration';
    case 'decision': return r.decision === 'needs_information' ? 'Employee needs more information' : 'Awaiting employee decision';
    case 'consent': return 'Awaiting consent';
    case 'form': return 'Awaiting request form';
    case 'fulfilment': return 'Awaiting kit dispatch';
    case 'sample': return r.kitReceivedOn === '' ? 'Kit dispatched' : 'Sample pending';
    case 'result': return 'Awaiting laboratory result';
    case 'review': return 'Awaiting clinician review';
    case 'follow_up': return 'Referral or follow-up pending';
    default: return 'Completed';
  }
}


export function createEmptyScreeningRecord(
  base: Pick<ScreeningRecord, 'employeeId' | 'employeeName' | 'companyId' | 'companyName' | 'screeningType' | 'mode'>,
): ScreeningRecord {
  return {
    ...base,
    id: crypto.randomUUID(),
    considerationNote: '',
    decision: 'not_recorded',
    decisionNote: '',
    consentRecorded: false,
    consentNote: '',
    responsibleClinician: '',
    requestFormPrepared: false,
    mnemonicReference: '',
    fulfilment: 'not_chosen',
    kitDispatchedOn: '',
    kitReceivedOn: '',
    sampleSubmittedOn: '',
    resultReceivedOn: '',
    resultStatusNote: '',
    review: null,
    closedReason: '',
    auditTrail: [],
    createdAt: new Date().toISOString(),
  };
}
