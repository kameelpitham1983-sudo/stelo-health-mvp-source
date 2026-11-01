import type { PermissionAction } from '@/lib/permissions';

export type OnboardingStatus = 'open' | 'closed' | 'case_opened';
export type ConsentStatus = 'pending' | 'accepted' | 'declined' | 'clarification';
export type WorkOrderStatus = 'not_created' | 'pending_approval' | 'approved' | 'rejected';
export type TwoFactorStatus = 'pending' | 'verified' | 'simulated';

export interface OnboardingData {
  identityReference: string;
  introShown: boolean;
  consentStatus: ConsentStatus;
  consentReference: string;
  consentReviewed: boolean;
  clarificationResolved: boolean;
  wantsToProceed: boolean | null;
  employeeNumber: string;
  mobile: string;
  currentLocation: string;
  worksite: string;
  availability: string;
  twoFactorStatus: TwoFactorStatus;
  workOrderNumber: string;
  workOrderStatus: WorkOrderStatus;
}

export type OnboardingPatch = Partial<OnboardingData> & { status?: OnboardingStatus; closedReason?: string };

export interface OnboardingAuditEntry {
  action: string;
  actorName: string;
  actorRole: string;
  at: string;
}

export interface OnboardingCase {
  id: string;
  companyId: string | null;
  companyName: string;
  status: OnboardingStatus;
  closedReason: string;
  data: OnboardingData;
  auditTrail: OnboardingAuditEntry[];
  createdAt: string;
  mode: 'demo' | 'live';
}

export const REGISTRATION_FIELDS = ['employeeNumber', 'mobile', 'currentLocation', 'worksite', 'availability'] as const;
export type RegistrationField = (typeof REGISTRATION_FIELDS)[number];

export const REGISTRATION_LABELS: Record<RegistrationField, string> = {
  employeeNumber: 'Employee number',
  mobile: 'Mobile number',
  currentLocation: 'Current location',
  worksite: 'Worksite',
  availability: 'Appointment availability',
};

export function createEmptyOnboardingData(): OnboardingData {
  return {
    identityReference: '',
    introShown: false,
    consentStatus: 'pending',
    consentReference: '',
    consentReviewed: false,
    clarificationResolved: false,
    wantsToProceed: null,
    employeeNumber: '',
    mobile: '',
    currentLocation: '',
    worksite: '',
    availability: '',
    twoFactorStatus: 'pending',
    workOrderNumber: '',
    workOrderStatus: 'not_created',
  };
}

export type StageChannel = 'In app' | 'Manual outside the app' | 'Integration not connected';

export interface OnboardingStageDefinition {
  id: number;
  title: string;
  responsible: string;
  purpose: string;
  requiredInfo: string;
  missingInfo: string;
  nextStep: string;
  channel: StageChannel;
  permission: PermissionAction;
  isApplicable: (c: OnboardingCase) => boolean;
  isDone: (c: OnboardingCase) => boolean;
}

const consentGiven = (c: OnboardingCase) => c.data.consentStatus === 'accepted' || c.data.consentStatus === 'clarification';
const registrationComplete = (c: OnboardingCase) => REGISTRATION_FIELDS.every((f) => c.data[f].trim() !== '');

export const ONBOARDING_STAGES: OnboardingStageDefinition[] = [
  {
    id: 1,
    title: 'Identity verification',
    responsible: 'Client HR',
    purpose: 'Confirm the employee using the client User ID or passport reference. Only the reference is recorded, not the document itself.',
    requiredInfo: 'Client User ID or passport reference.',
    missingInfo: 'Enter the reference from the client HR system before recording.',
    nextStep: 'Show the introduction and consent information to the employee.',
    channel: 'In app',
    permission: 'onboarding.client_hr',
    isApplicable: () => true,
    isDone: (c) => c.data.identityReference.trim() !== '',
  },
  {
    id: 2,
    title: 'Introduction and consent information',
    responsible: 'Client HR',
    purpose: 'The STelo Health introduction and consent video is shown to the employee at the client premises. The video is not hosted in this app.',
    requiredInfo: 'Confirmation that the introduction was shown.',
    missingInfo: 'Show the introduction video first, then confirm here.',
    nextStep: 'Record whether the employee accepts, declines or needs clarification.',
    channel: 'Manual outside the app',
    permission: 'onboarding.client_hr',
    isApplicable: () => true,
    isDone: (c) => c.data.introShown,
  },
  {
    id: 3,
    title: 'Consent decision',
    responsible: 'Employee, recorded by Client HR',
    purpose: 'Record whether the employee accepted, declined or requires clarification of the consent form.',
    requiredInfo: 'Accepted, declined or clarification required.',
    missingInfo: 'The decision must come from the employee. Do not record a decision on their behalf.',
    nextStep: 'Declined closes the case. Accepted or clarification moves to submitting the consent form.',
    channel: 'In app',
    permission: 'onboarding.client_hr',
    isApplicable: () => true,
    isDone: (c) => c.data.consentStatus !== 'pending',
  },
  {
    id: 4,
    title: 'Submit signed or modified consent',
    responsible: 'Client HR',
    purpose: 'Record the reference of the signed or amended consent form sent to STelo Health.',
    requiredInfo: 'Document reference for the signed or amended consent form.',
    missingInfo: 'The consent form must be sent by email outside the app. Enter its reference once sent.',
    nextStep: 'STelo Health reviews the consent form.',
    channel: 'Manual outside the app',
    permission: 'onboarding.client_hr',
    isApplicable: consentGiven,
    isDone: (c) => c.data.consentReference.trim() !== '',
  },
  {
    id: 5,
    title: 'STelo Health consent review',
    responsible: 'Admin or Coordinator',
    purpose: 'STelo Health checks the signed or amended consent form.',
    requiredInfo: 'Review confirmation.',
    missingInfo: 'The consent form must be submitted first.',
    nextStep: 'If clarification is required, arrange a video call. Otherwise continue to the employee decision.',
    channel: 'In app',
    permission: 'onboarding.manage',
    isApplicable: consentGiven,
    isDone: (c) => c.data.consentReviewed,
  },
  {
    id: 6,
    title: 'Clarification video call',
    responsible: 'STelo Health',
    purpose: 'Where the consent form was amended, STelo Health speaks with the employee by video call.',
    requiredInfo: 'Confirmation that the call was held.',
    missingInfo: 'The video call happens outside the app. Record it only after it has taken place.',
    nextStep: 'Continue to the employee decision.',
    channel: 'Manual outside the app',
    permission: 'onboarding.manage',
    isApplicable: (c) => c.data.consentStatus === 'clarification',
    isDone: (c) => c.data.clarificationResolved,
  },
  {
    id: 7,
    title: 'Employee decision to proceed',
    responsible: 'Employee',
    purpose: 'The employee decides whether to proceed with the medical.',
    requiredInfo: 'Proceed or do not proceed.',
    missingInfo: 'The decision must come from the employee.',
    nextStep: 'Proceed to registration. Not proceeding closes the case.',
    channel: 'In app',
    permission: 'onboarding.register',
    isApplicable: () => true,
    isDone: (c) => c.data.wantsToProceed !== null,
  },
  {
    id: 8,
    title: 'Employee registration',
    responsible: 'Employee',
    purpose: 'Capture the registration details needed to arrange the medical. Names and surnames are not collected at registration.',
    requiredInfo: 'Employee number, mobile number, current location, worksite and appointment availability.',
    missingInfo: 'All five fields are required before the work order can be created.',
    nextStep: 'Two-factor verification.',
    channel: 'In app',
    permission: 'onboarding.register',
    isApplicable: () => true,
    isDone: registrationComplete,
  },
  {
    id: 9,
    title: 'Two-factor verification',
    responsible: 'STelo Health',
    purpose: 'Confirm the employee through two-factor verification.',
    requiredInfo: 'Verification result.',
    missingInfo: 'No SMS or verification service is connected. Confirm only after verification has been completed by other means.',
    nextStep: 'Generate the work order.',
    channel: 'Integration not connected',
    permission: 'onboarding.manage',
    isApplicable: () => true,
    isDone: (c) => c.data.twoFactorStatus !== 'pending',
  },
  {
    id: 10,
    title: 'Generate work order',
    responsible: 'STelo Health (automatic)',
    purpose: 'Create the work order that client HR will approve.',
    requiredInfo: 'Registration and verification complete.',
    missingInfo: 'Complete the earlier stages first.',
    nextStep: 'Send the work order for client HR approval.',
    channel: 'In app',
    permission: 'onboarding.manage',
    isApplicable: () => true,
    isDone: (c) => c.data.workOrderNumber !== '',
  },
  {
    id: 11,
    title: 'Send work order for approval',
    responsible: 'STelo Health',
    purpose: 'Mark the work order as sent to client HR for approval.',
    requiredInfo: 'A generated work order.',
    missingInfo: 'Generate the work order first.',
    nextStep: 'Client HR approves or rejects the work order.',
    channel: 'Integration not connected',
    permission: 'onboarding.manage',
    isApplicable: (c) => c.data.workOrderNumber !== '',
    isDone: (c) => c.data.workOrderStatus !== 'not_created',
  },
  {
    id: 12,
    title: 'Client HR approval',
    responsible: 'Client HR (employer user)',
    purpose: 'Client HR approves or rejects the work order. A rejection closes the case and records the reason.',
    requiredInfo: 'Approve, or reject with a reason.',
    missingInfo: 'A rejection needs a reason.',
    nextStep: 'Approval opens the employee case. Rejection closes it.',
    channel: 'In app',
    permission: 'onboarding.client_hr',
    isApplicable: (c) => c.data.workOrderStatus !== 'not_created',
    isDone: (c) => c.data.workOrderStatus === 'approved' || c.data.workOrderStatus === 'rejected',
  },
  {
    id: 13,
    title: 'Open employee case',
    responsible: 'Admin or Coordinator',
    purpose: 'Open the employee case after approval so that the medical can be arranged.',
    requiredInfo: 'Approved work order.',
    missingInfo: 'The case can only be opened after client HR approval.',
    nextStep: 'Arrange the medical in Medicals, Appointments and Guarantees of Payment.',
    channel: 'In app',
    permission: 'onboarding.manage',
    isApplicable: (c) => c.data.workOrderStatus === 'approved',
    isDone: (c) => c.status === 'case_opened',
  },
];

export function getActiveStageId(c: OnboardingCase): number | null {
  if (c.status !== 'open') return null;
  const active = ONBOARDING_STAGES.find((s) => s.isApplicable(c) && !s.isDone(c));
  return active ? active.id : null;
}
