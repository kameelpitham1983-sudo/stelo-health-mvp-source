import {
  createEmptyMedicalAssessment,
  type MedicalAssessmentRecord,
  type MedicalAssessmentType,
} from '@/lib/medicalAssessmentWorkflow';

const DEMO_NOTE = '[Demo] Simulated record. Not a clinical record.';
const DEMO_WORK_ORDER = 'demo-work-order-approved';
const DEMO_PROVIDER = { id: 'pr-1', name: '[Demo] Johannesburg Occupational Health Clinic' };
const DEMO_CLINICIAN = 'Dr. James Holt';
const SEEDED_AT = '2026-10-27T09:00:00.000Z';

interface DemoLink {
  employeeId: string;
  employeeName: string;
  companyId: string;
  companyName: string;
  assessmentType: MedicalAssessmentType;
  medicalId: string;
  medicalRecordType: string;
  workOrderApproved: boolean;
}

function seed(link: DemoLink, state: Partial<MedicalAssessmentRecord>): MedicalAssessmentRecord {
  const base = createEmptyMedicalAssessment({
    ...link,
    onboardingCaseId: link.workOrderApproved ? DEMO_WORK_ORDER : null,
    caseId: null,
    caseReference: '',
    mode: 'demo',
  });
  return {
    ...base,
    worksiteRequirements: `${DEMO_NOTE} Site requirements to be confirmed by the employer.`,
    auditTrail: [{ action: 'Demo journey seeded', actorName: 'Demo', actorRole: 'admin', at: SEEDED_AT }],
    ...state,
  };
}

const CLEARED_FOR_CLINICIAN = {
  consentRecorded: true,
  questionnaireStatus: 'completed' as const,
  historyReviewed: true,
  investigationsRequested: 'None required',
  providerId: DEMO_PROVIDER.id,
  providerName: DEMO_PROVIDER.name,
  appointmentDate: '2026-10-28',
  appointmentConfirmed: true,
};

export function createDemoMedicalAssessments(): MedicalAssessmentRecord[] {
  return [
    seed({
      employeeId: 'e7', employeeName: 'Calum Stewart', companyId: 'c2', companyName: 'Northwind Energy plc',
      assessmentType: 'Pre-employment', medicalId: 'm3', medicalRecordType: 'Pre-Employment', workOrderApproved: true,
    }, {
      ...CLEARED_FOR_CLINICIAN,
      investigationsRequested: 'Audiometry and spirometry requested. Laboratory requests prepared outside the app.',
      labResultReceived: true,
      findings: `${DEMO_NOTE} Findings to be entered by the clinician.`,
      clinicianName: DEMO_CLINICIAN,
      clinicianReviewed: true,
    }),
    seed({
      employeeId: 'e9', employeeName: 'Liam MacKenzie', companyId: 'c2', companyName: 'Northwind Energy plc',
      assessmentType: 'Pre-employment', medicalId: 'm14', medicalRecordType: 'Pre-Employment', workOrderApproved: false,
    }, {}),
    seed({
      employeeId: 'e5', employeeName: 'Robert Klein', companyId: 'c1', companyName: 'Meridian Global Logistics',
      assessmentType: 'Periodic', medicalId: 'm10', medicalRecordType: 'Annual Occupational', workOrderApproved: true,
    }, {
      worksiteRequirements: `${DEMO_NOTE} Annual occupational review, no change in duties.`,
    }),
    seed({
      employeeId: 'e1', employeeName: 'Michael Torres', companyId: 'c1', companyName: 'Meridian Global Logistics',
      assessmentType: 'Periodic', medicalId: 'm1', medicalRecordType: 'Annual Occupational', workOrderApproved: true,
    }, {
      worksiteRequirements: `${DEMO_NOTE} Annual occupational review, no change in duties.`,
      consentRecorded: true,
      questionnaireStatus: 'sent',
    }),
    seed({
      employeeId: 'e4', employeeName: 'Sophie Dubois', companyId: 'c1', companyName: 'Meridian Global Logistics',
      assessmentType: 'Periodic', medicalId: 'm7', medicalRecordType: 'Annual Occupational', workOrderApproved: true,
    }, {
      worksiteRequirements: `${DEMO_NOTE} Return from extended leave, review before resuming duties.`,
      consentRecorded: true,
      questionnaireStatus: 'completed',
      historyReviewed: true,
      investigationsRequested: 'None required',
    }),
    seed({
      employeeId: 'e8', employeeName: 'Hannah Forbes', companyId: 'c2', companyName: 'Northwind Energy plc',
      assessmentType: 'Periodic', medicalId: 'm13', medicalRecordType: 'Annual Occupational', workOrderApproved: true,
    }, {
      worksiteRequirements: `${DEMO_NOTE} Annual review for a senior HSE role.`,
      consentRecorded: true,
      questionnaireStatus: 'completed',
      historyReviewed: true,
      investigationsRequested: 'Audiometry requested. Laboratory requests prepared outside the app.',
      labResultReceived: false,
      providerId: DEMO_PROVIDER.id,
      providerName: DEMO_PROVIDER.name,
      appointmentDate: '2026-11-03',
      appointmentConfirmed: true,
    }),
    seed({
      employeeId: 'e1', employeeName: 'Michael Torres', companyId: 'c1', companyName: 'Meridian Global Logistics',
      assessmentType: 'Transfer', medicalId: 'm12', medicalRecordType: 'Transfer', workOrderApproved: true,
    }, {
      worksiteRequirements: `${DEMO_NOTE} Transfer to a new site. Site requirements to be confirmed.`,
      ...CLEARED_FOR_CLINICIAN,
    }),
  ];
}
