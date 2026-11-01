import { createEmptyScreeningRecord, type ScreeningRecord } from '@/lib/screeningWorkflow';

type SeedInput = {
  employeeId: string;
  employeeName: string;
  companyId: string;
  companyName: string;
  screeningType: ScreeningRecord['screeningType'];
  apply: (r: ScreeningRecord) => ScreeningRecord;
};

const SEEDS: SeedInput[] = [
  {
    employeeId: 'e2', employeeName: 'Emma Larsson', companyId: 'c1', companyName: 'Meridian Global Logistics', screeningType: 'HPV',
    apply: (r) => ({
      ...r,
      considerationNote: 'Discussed the option at the annual review. Employee asked for written information.',
      decision: 'accepted', decisionNote: 'Employee accepted after reading the information leaflet.',
      consentRecorded: true, consentNote: 'Consent recorded at the clinic.', responsibleClinician: 'Dr. Aisha Bello',
      requestFormPrepared: true, mnemonicReference: '',
      fulfilment: 'courier', kitDispatchedOn: '2026-10-20',
    }),
  },
  {
    employeeId: 'e3', employeeName: 'David Osei', companyId: 'c1', companyName: 'Meridian Global Logistics', screeningType: 'Colorectal',
    apply: (r) => ({
      ...r,
      considerationNote: 'Option discussed with the employee.',
      decision: 'declined', decisionNote: 'Employee declined at this time.',
      closedReason: 'Employee declined screening',
    }),
  },
  {
    employeeId: 'e7', employeeName: 'Calum Stewart', companyId: 'c2', companyName: 'Northwind Energy plc', screeningType: 'Colorectal',
    apply: (r) => ({
      ...r,
      considerationNote: 'Option discussed with the employee.',
      decision: 'accepted', decisionNote: 'Employee wishes to proceed. Consent form not yet signed.',
      responsibleClinician: 'Dr. James Holt',
    }),
  },
  {
    employeeId: 'e5', employeeName: 'Robert Klein', companyId: 'c1', companyName: 'Meridian Global Logistics', screeningType: 'HPV',
    apply: (r) => ({
      ...r,
      considerationNote: 'Option discussed. Employee wants more information before deciding.',
      decision: 'needs_information', decisionNote: 'Employee asked for more information about the test.',
    }),
  },
  {
    employeeId: 'e8', employeeName: 'Hannah Forbes', companyId: 'c2', companyName: 'Northwind Energy plc', screeningType: 'Colorectal',
    apply: (r) => ({
      ...r,
      considerationNote: 'Option discussed at the annual review.',
      decision: 'accepted', decisionNote: 'Employee accepted.',
      consentRecorded: true, consentNote: 'Consent recorded.', responsibleClinician: 'Dr. James Holt',
      requestFormPrepared: true, mnemonicReference: '',
      fulfilment: 'collection', kitDispatchedOn: '2026-10-05', kitReceivedOn: '2026-10-12', sampleSubmittedOn: '2026-10-13',
      resultReceivedOn: '2026-10-27', resultStatusNote: 'Result received by the coordinator. Not yet reviewed.',
    }),
  },
  {
    employeeId: 'e11', employeeName: 'Grace Wanjiru', companyId: 'c5', companyName: 'Greenfield Agribusiness', screeningType: 'HPV',
    apply: (r) => ({
      ...r,
      considerationNote: 'Option discussed with the employee.',
      decision: 'accepted', decisionNote: 'Employee accepted.',
      consentRecorded: true, consentNote: 'Consent recorded.', responsibleClinician: 'Dr. Aisha Bello',
      requestFormPrepared: true, mnemonicReference: '',
      fulfilment: 'courier', kitDispatchedOn: '2026-10-14', kitReceivedOn: '2026-10-24',
    }),
  },
  {
    employeeId: 'e9', employeeName: 'Liam MacKenzie', companyId: 'c2', companyName: 'Northwind Energy plc', screeningType: 'Colorectal',
    apply: (r) => ({
      ...r,
      considerationNote: 'Option discussed with the employee.',
      decision: 'accepted', decisionNote: 'Employee accepted.',
      consentRecorded: true, consentNote: 'Consent recorded.', responsibleClinician: 'Dr. James Holt',
      requestFormPrepared: true, mnemonicReference: '',
      fulfilment: 'courier', kitDispatchedOn: '2026-09-15', kitReceivedOn: '2026-09-25', sampleSubmittedOn: '2026-09-26',
      resultReceivedOn: '2026-10-10', resultStatusNote: 'Result received and routed to the clinician.',
      review: {
        reviewedBy: 'Dr. James Holt', reviewedAt: '2026-10-15', outcomeNote: 'Clinician review recorded. Follow-up needed.',
        referralRequired: true, referralDetail: 'Referral to the specialist team to be arranged by the clinician.',
        followUpAction: 'Confirm referral has been made and book a follow-up review.', completed: false,
      },
    }),
  },
  {
    employeeId: 'e12', employeeName: 'Lucas Meyer', companyId: 'c6', companyName: 'Helix Pharma Research', screeningType: 'Colorectal',
    apply: (r) => ({
      ...r,
      considerationNote: 'Option discussed with the employee.',
      decision: 'accepted', decisionNote: 'Employee accepted.',
      consentRecorded: true, consentNote: 'Consent recorded.', responsibleClinician: 'Dr. James Holt',
      requestFormPrepared: true, mnemonicReference: '',
      fulfilment: 'courier', kitDispatchedOn: '2026-08-01', kitReceivedOn: '2026-08-10', sampleSubmittedOn: '2026-08-11',
      resultReceivedOn: '2026-08-25', resultStatusNote: 'Result received and reviewed.',
      review: {
        reviewedBy: 'Dr. James Holt', reviewedAt: '2026-08-28', outcomeNote: 'Clinician review recorded. No referral required.',
        referralRequired: false, referralDetail: '', followUpAction: '', completed: true,
      },
    }),
  },
];

export function createDemoScreeningRecords(): ScreeningRecord[] {
  return SEEDS.map((seed) => {
    const base = createEmptyScreeningRecord({
      employeeId: seed.employeeId,
      employeeName: seed.employeeName,
      companyId: seed.companyId,
      companyName: seed.companyName,
      screeningType: seed.screeningType,
      mode: 'demo',
    });
    return seed.apply({ ...base, auditTrail: [{ action: 'Demo example record', actorName: 'Demo data', actorRole: 'system', at: base.createdAt }] });
  });
}
