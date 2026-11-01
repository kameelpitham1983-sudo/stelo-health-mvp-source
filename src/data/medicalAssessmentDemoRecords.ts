import { createEmptyMedicalAssessment, type MedicalAssessmentRecord } from '@/lib/medicalAssessmentWorkflow';

const DEMO_NOTE = '[Demo] Simulated record. Not a clinical record.';

export function createDemoMedicalAssessments(): MedicalAssessmentRecord[] {
  const preEmployment = createEmptyMedicalAssessment({
    employeeId: 'e7',
    employeeName: 'Calum Stewart',
    companyId: 'c2',
    companyName: 'Northwind Energy plc',
    assessmentType: 'Pre-employment',
    medicalId: 'm3',
    medicalRecordType: 'Pre-Employment',
    onboardingCaseId: 'demo-work-order-approved',
    workOrderApproved: true,
    mode: 'demo',
    caseId: null,
    caseReference: '',
  });

  const periodic = createEmptyMedicalAssessment({
    employeeId: 'e5',
    employeeName: 'Robert Klein',
    companyId: 'c1',
    companyName: 'Meridian Global Logistics',
    assessmentType: 'Periodic',
    medicalId: 'm10',
    medicalRecordType: 'Annual Occupational',
    onboardingCaseId: null,
    workOrderApproved: true,
    mode: 'demo',
    caseId: null,
    caseReference: '',
  });

  return [
    {
      ...preEmployment,
      worksiteRequirements: `${DEMO_NOTE} Offshore worksite, medical standard to be confirmed by the employer.`,
      consentRecorded: true,
      questionnaireStatus: 'completed',
      historyReviewed: true,
      investigationsRequested: 'Audiometry and spirometry requested. Laboratory requests prepared outside the app.',
      providerName: 'Labworks Reference Lab (laboratory, not in Provider Network)',
      appointmentDate: '2026-10-28',
      appointmentConfirmed: true,
      findings: `${DEMO_NOTE} Findings to be entered by the clinician.`,
      clinicianName: 'Dr. James Holt',
      clinicianReviewed: true,
      auditTrail: [{ action: 'Demo journey seeded', actorName: 'Demo', actorRole: 'admin', at: '2026-10-27T09:00:00.000Z' }],
    },
    {
      ...periodic,
      worksiteRequirements: `${DEMO_NOTE} Annual occupational review, no change in duties.`,
      auditTrail: [{ action: 'Demo journey seeded', actorName: 'Demo', actorRole: 'admin', at: '2026-10-27T09:00:00.000Z' }],
    },
  ];
}
