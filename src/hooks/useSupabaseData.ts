import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, supabaseConfigured } from '@/lib/supabase';
import { useApp } from '@/context/AppContext';
import * as mockData from '@/data/mockData';
import type {
  Company,
  Employee,
  Medical,
  Appointment,
  TravelHealthRecord,
  DocumentRecord,
  ActivityEvent,
  SicknessAbsenceCase,
  SicknessRiskAssessment,
  Synopsis,
  SynopsisMeetingNote,
  SynopsisFollowUp,
  VaccineStatus,
} from '@/types';

// Demo data fallback: when the database is empty or unreachable, pages show
// clearly-labelled sample data instead of blank screens. Demo data is read-only
// and never written to Supabase. Write operations are blocked in demo mode.
export const isDemoMode = !supabaseConfigured;

const demoWriteError = 'Demo mode is active — the Supabase connection is not configured. Start the dev server with valid VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to save changes.';

// --- Generic hook helper ---
// transform and demoFallback are module-scope functions (stable references),
// so they are safe to use in useCallback deps without causing re-render loops.

function useSupabaseQuery<T>(
  table: string,
  transform: (row: Record<string, unknown>) => T,
  orderBy?: string,
  ascending = true,
  demoFallback?: () => T[],
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Track whether the first load has completed to avoid flickering on
  // subsequent renders (e.g. when switching pages and back).
  const loadedRef = useRef(false);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    if (!supabaseConfigured) {
      setData(demoFallback ? demoFallback() : []);
      setLoading(false);
      loadedRef.current = true;
      return;
    }
    let query = supabase.from(table).select('*');
    if (orderBy) query = query.order(orderBy, { ascending });
    const { data: rows, error: err } = await query;
    if (err) {
      setError(err.message);
    } else {
      const transformed = (rows as Record<string, unknown>[]).map(transform);
      if (transformed.length === 0 && demoFallback) {
        setData(demoFallback());
      } else {
        setData(transformed);
      }
    }
    setLoading(false);
    loadedRef.current = true;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table, orderBy, ascending]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, loading, error, refetch };
}

// --- Company transforms ---

function transformCompany(row: Record<string, unknown>): Company {
  return {
    id: row.id as string,
    name: row.name as string,
    industry: (row.industry as string) || '',
    tier: (row.tier as string) as Company['tier'],
    status: (row.status as string) as Company['status'],
    employeeCount: (row.employee_count as number) || 0,
    locations: (row.locations as number) || 1,
    primaryLocation: (row.primary_location as string) || '',
    contractStart: row.contract_start ? (row.contract_start as string) : '',
    contractEnd: row.contract_end ? (row.contract_end as string) : '',
    contactName: (row.contact_name as string) || '',
    contactEmail: (row.contact_email as string) || '',
    contactPhone: (row.contact_phone as string) || '',
    logoColor: (row.logo_color as string) || 'brand',
  };
}

export function useCompanies() {
  const { data, loading, error, refetch } = useSupabaseQuery<Company>(
    'companies',
    transformCompany,
    'name',
    true,
    () => mockData.companies,
  );

  const addCompany = useCallback(async (company: Partial<Company>) => {
    if (isDemoMode) throw new Error(demoWriteError);
    const { data: row, error: err } = await supabase
      .from('companies')
      .insert({
        name: company.name,
        industry: company.industry || '',
        tier: company.tier || 'SMB',
        status: company.status || 'Onboarding',
        employee_count: company.employeeCount || 0,
        locations: company.locations || 1,
        primary_location: company.primaryLocation || '',
        contact_name: company.contactName || '',
        contact_email: company.contactEmail || '',
        contact_phone: company.contactPhone || '',
        logo_color: company.logoColor || 'brand',
      })
      .select()
      .single();
    if (err) throw new Error(err.message);
    await refetch();
    return transformCompany(row as Record<string, unknown>);
  }, [refetch]);

  const updateCompany = useCallback(async (id: string, updates: Partial<Company>) => {
    if (isDemoMode) throw new Error(demoWriteError);
    const { error: err } = await supabase
      .from('companies')
      .update({
        name: updates.name,
        industry: updates.industry,
        tier: updates.tier,
        status: updates.status,
        employee_count: updates.employeeCount,
        locations: updates.locations,
        primary_location: updates.primaryLocation,
        contact_name: updates.contactName,
        contact_email: updates.contactEmail,
        contact_phone: updates.contactPhone,
      })
      .eq('id', id);
    if (err) throw new Error(err.message);
    await refetch();
  }, [refetch]);

  return { data, loading, error, refetch, addCompany, updateCompany };
}

// --- Employee transforms ---

function transformEmployee(row: Record<string, unknown>): Employee {
  const firstName = (row.first_name as string) || '';
  const surname = (row.surname as string) || '';
  return {
    id: row.id as string,
    name: `${firstName} ${surname}`.trim(),
    email: (row.email as string) || '',
    phone: (row.phone as string) || '',
    jobTitle: (row.job_title as string) || '',
    companyId: (row.company_id as string) || '',
    companyName: '',
    department: (row.department as string) || '',
    status: (row.employment_status as string) as Employee['status'],
    healthStatus: ((row.fitness_outcome as string) || 'Pending Assessment') as Employee['healthStatus'],
    lastMedicalDate: row.last_assessment_date ? (row.last_assessment_date as string) : '',
    nextMedicalDue: row.next_assessment_due ? (row.next_assessment_due as string) : '',
    travelReady: (row.international_travel_required as boolean) || false,
    avatarInitials: `${firstName.charAt(0)}${surname.charAt(0)}`.toUpperCase(),
  };
}

export function useEmployees() {
  const [data, setData] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    if (!supabaseConfigured) {
      setData(mockData.employees);
      setLoading(false);
      return;
    }
    const { data: rows, error: err } = await supabase
      .from('employees')
      .select('*, companies!company_id(name)')
      .order('first_name', { ascending: true });
    if (err) {
      setError(err.message);
    } else {
      const transformed = (rows as Record<string, unknown>[]).map((row) => {
        const emp = transformEmployee(row);
        const companyData = row.companies as Record<string, unknown> | null;
        emp.companyName = companyData?.name as string;
        return emp;
      });
      setData(transformed.length > 0 ? transformed : mockData.employees);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const updateEmployeeFitness = useCallback(async (
    employeeId: string,
    fitnessOutcome: string,
    lastAssessmentDate: string,
    nextAssessmentDue: string | null,
    restrictions?: string,
  ) => {
    const updateData: Record<string, unknown> = {
      fitness_outcome: fitnessOutcome,
      last_assessment_date: lastAssessmentDate || null,
    };
    if (nextAssessmentDue !== undefined) updateData.next_assessment_due = nextAssessmentDue;
    if (restrictions !== undefined) updateData.restrictions = restrictions;

    if (isDemoMode) throw new Error(demoWriteError);
    const { error: err } = await supabase.from('employees').update(updateData).eq('id', employeeId);
    if (err) throw new Error(err.message);
    await refetch();
  }, [refetch]);

  return { data, loading, error, refetch, updateEmployeeFitness };
}

// --- Medicals ---

function transformMedical(row: Record<string, unknown>): Medical {
  return {
    id: row.id as string,
    employeeName: (row.employee_name as string) || '',
    employeeId: (row.employee_id as string) || '',
    companyName: (row.company_name as string) || '',
    type: (row.type as string) as Medical['type'],
    status: (row.status as string) as Medical['status'],
    date: row.assessment_date ? (row.assessment_date as string) : '',
    providerName: (row.provider_name as string) || '',
    result: (row.result as string) || '',
    notes: (row.notes as string) || '',
  };
}

export function useMedicals() {
  const { user } = useApp();
  const isEmployer = user?.role === 'employer';
  const { data, loading, error, refetch } = useSupabaseQuery<Medical>(
    isEmployer ? 'medicals_employer_view' : 'medicals',
    transformMedical,
    'assessment_date',
    false,
    () => mockData.medicals,
  );

  const addMedical = useCallback(async (medical: Partial<Medical>) => {
    if (isDemoMode) throw new Error(demoWriteError);
    const { data: row, error: err } = await supabase
      .from('medicals')
      .insert({
        employee_name: medical.employeeName,
        employee_id: medical.employeeId || null,
        company_name: medical.companyName || '',
        type: medical.type || 'Annual Occupational',
        status: medical.status || 'Scheduled',
        assessment_date: medical.date || null,
        provider_name: medical.providerName || '',
        result: medical.result || 'Pending',
        notes: medical.notes || '',
      })
      .select()
      .single();
    if (err) throw new Error(err.message);
    await refetch();
    return transformMedical(row as Record<string, unknown>);
  }, [refetch]);

  const updateMedical = useCallback(async (id: string, updates: Partial<Medical>) => {
    if (isDemoMode) throw new Error(demoWriteError);
    const updateData: Record<string, unknown> = {};
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.result !== undefined) updateData.result = updates.result;
    if (updates.notes !== undefined) updateData.notes = updates.notes;
    if (updates.type !== undefined) updateData.type = updates.type;
    if (updates.date !== undefined) updateData.assessment_date = updates.date;
    if (updates.providerName !== undefined) updateData.provider_name = updates.providerName;

    const { error: err } = await supabase.from('medicals').update(updateData).eq('id', id);
    if (err) throw new Error(err.message);
    await refetch();
  }, [refetch]);

  return { data, loading, error, refetch, addMedical, updateMedical };
}

// --- Appointments ---

function transformAppointment(row: Record<string, unknown>): Appointment {
  return {
    id: row.id as string,
    employeeName: (row.employee_name as string) || '',
    companyName: (row.company_name as string) || '',
    type: (row.type as string) as Appointment['type'],
    mode: (row.mode as string) as Appointment['mode'],
    status: (row.status as string) as Appointment['status'],
    date: row.appointment_date ? (row.appointment_date as string) : '',
    time: (row.appointment_time as string) || '09:00',
    durationMin: (row.duration_min as number) || 30,
    providerName: (row.provider_name as string) || '',
    location: (row.location as string) || '',
  };
}

export function useAppointments() {
  const { data, loading, error, refetch } = useSupabaseQuery<Appointment>(
    'appointments',
    transformAppointment,
    'appointment_date',
    true,
    () => mockData.appointments,
  );

  const addAppointment = useCallback(async (appt: Partial<Appointment>) => {
    if (isDemoMode) throw new Error(demoWriteError);
    const { data: row, error: err } = await supabase
      .from('appointments')
      .insert({
        employee_name: appt.employeeName,
        company_name: appt.companyName || '',
        type: appt.type || 'Occupational Health',
        mode: appt.mode || 'In-clinic',
        status: appt.status || 'Pending',
        appointment_date: appt.date || null,
        appointment_time: appt.time || '09:00',
        duration_min: appt.durationMin || 30,
        provider_name: appt.providerName || '',
        location: appt.location || '',
      })
      .select()
      .single();
    if (err) throw new Error(err.message);
    await refetch();
    return transformAppointment(row as Record<string, unknown>);
  }, [refetch]);

  const updateAppointment = useCallback(async (id: string, updates: Partial<Appointment>) => {
    if (isDemoMode) throw new Error(demoWriteError);
    const updateData: Record<string, unknown> = {};
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.date !== undefined) updateData.appointment_date = updates.date;
    if (updates.time !== undefined) updateData.appointment_time = updates.time;
    if (updates.mode !== undefined) updateData.mode = updates.mode;
    if (updates.location !== undefined) updateData.location = updates.location;
    if (updates.providerName !== undefined) updateData.provider_name = updates.providerName;

    const { error: err } = await supabase.from('appointments').update(updateData).eq('id', id);
    if (err) throw new Error(err.message);
    await refetch();
  }, [refetch]);

  return { data, loading, error, refetch, addAppointment, updateAppointment };
}

// --- Travel Health ---

function transformTravelHealth(row: Record<string, unknown>): TravelHealthRecord {
  return {
    id: row.id as string,
    employeeName: (row.employee_name as string) || '',
    companyName: (row.company_name as string) || '',
    destination: (row.destination as string) || '',
    departureDate: row.departure_date ? (row.departure_date as string) : '',
    returnDate: row.return_date ? (row.return_date as string) : '',
    riskLevel: (row.risk_level as string) as TravelHealthRecord['riskLevel'],
    vaccines: (row.vaccines as { name: string; status: VaccineStatus }[]) || [],
    malariaProphylaxis: (row.malaria_prophylaxis as boolean) || false,
    travelKitIssued: (row.travel_kit_issued as boolean) || false,
    lastConsultation: row.last_consultation ? (row.last_consultation as string) : '',
    status: (row.status as string) as TravelHealthRecord['status'],
  };
}

export function useTravelHealth() {
  const { user } = useApp();
  const isEmployer = user?.role === 'employer';
  const { data, loading, error, refetch } = useSupabaseQuery<TravelHealthRecord>(
    isEmployer ? 'travel_health_employer_view' : 'travel_health',
    transformTravelHealth,
    'departure_date',
    true,
    () => mockData.travelHealth,
  );
  return { data, loading, error, refetch };
}

// --- Documents ---

function transformDocument(row: Record<string, unknown>): DocumentRecord {
  return {
    id: row.id as string,
    name: (row.name as string) || '',
    type: (row.type as string) as DocumentRecord['type'],
    status: (row.status as string) as DocumentRecord['status'],
    companyName: (row.company_name as string) || '',
    employeeName: (row.employee_name as string) || undefined,
    uploadedBy: (row.uploaded_by as string) || '',
    uploadedDate: row.uploaded_date ? (row.uploaded_date as string) : '',
    fileSize: (row.file_size as string) || '',
    fileType: (row.file_type as string) || 'PDF',
    expiryDate: row.expiry_date ? (row.expiry_date as string) : null,
  };
}

export function useDocuments() {
  const { data, loading, error, refetch } = useSupabaseQuery<DocumentRecord>(
    'documents',
    transformDocument,
    'uploaded_date',
    false,
    () => mockData.documents,
  );

  const addDocument = useCallback(async (doc: Partial<DocumentRecord>) => {
    if (isDemoMode) throw new Error(demoWriteError);
    const { data: row, error: err } = await supabase
      .from('documents')
      .insert({
        name: doc.name,
        type: doc.type || 'Medical Report',
        status: doc.status || 'Draft',
        company_name: doc.companyName || '',
        employee_name: doc.employeeName || null,
        uploaded_by: doc.uploadedBy || '',
        uploaded_date: doc.uploadedDate || null,
        file_size: doc.fileSize || '',
        file_type: doc.fileType || 'PDF',
        expiry_date: doc.expiryDate || null,
      })
      .select()
      .single();
    if (err) throw new Error(err.message);
    await refetch();
    return transformDocument(row as Record<string, unknown>);
  }, [refetch]);

  const updateDocument = useCallback(async (id: string, updates: Partial<DocumentRecord>) => {
    if (isDemoMode) throw new Error(demoWriteError);
    const updateData: Record<string, unknown> = {};
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.type !== undefined) updateData.type = updates.type;
    if (updates.expiryDate !== undefined) updateData.expiry_date = updates.expiryDate || null;

    const { error: err } = await supabase.from('documents').update(updateData).eq('id', id);
    if (err) throw new Error(err.message);
    await refetch();
  }, [refetch]);

  return { data, loading, error, refetch, addDocument, updateDocument };
}

// --- Activity Events ---

function transformActivity(row: Record<string, unknown>): ActivityEvent {
  const createdAt = row.created_at as string;
  const date = new Date(createdAt);
  const now = new Date();
  const diffHours = Math.round((now.getTime() - date.getTime()) / (1000 * 60 * 60));
  let timestamp: string;
  if (diffHours < 1) timestamp = 'Just now';
  else if (diffHours < 24) timestamp = `${diffHours} hours ago`;
  else timestamp = `${Math.round(diffHours / 24)} days ago`;

  return {
    id: row.id as string,
    type: (row.type as string) as ActivityEvent['type'],
    title: (row.title as string) || '',
    description: (row.description as string) || '',
    actor: (row.actor as string) || '',
    timestamp,
  };
}

export function useActivityEvents() {
  const { data, loading, error } = useSupabaseQuery<ActivityEvent>(
    'activity_events',
    transformActivity,
    'created_at',
    false,
    () => mockData.activityFeed,
  );
  return { data, loading, error };
}

// --- Sickness Absence Cases ---

const mockSicknessCases: SicknessAbsenceCase[] = [
  {
    id: 'sa-demo-1',
    caseReference: 'SA-20251001-0001',
    employeeName: 'Emma Larsson',
    companyName: 'Meridian Global Logistics',
    referralDate: '2025-09-15',
    referringPerson: 'James Whitfield',
    referralTrigger: 'Manager referral — back injury reported',
    injuryOnDuty: true,
    incidentDate: '2025-09-10',
    absenceStartDate: '2025-09-12',
    expectedReturnDate: '2025-10-20',
    actualReturnDate: null,
    caseStatus: 'Case Management',
    jobDuties: 'Warehouse supervisor — lifting, bending, prolonged standing',
    functionalLimitations: 'No lifting >15kg for 6 weeks. Avoid repetitive bending.',
    workplaceAccommodations: 'Reassigned to light duties — desk-based inventory management',
    caseManager: 'Dr. Sarah Chen',
    reviewDate: '2025-10-15',
    closureDate: null,
    closureReason: null,
  },
  {
    id: 'sa-demo-2',
    caseReference: 'SA-20250920-0002',
    employeeName: 'Sophie Dubois',
    companyName: 'Meridian Global Logistics',
    referralDate: '2025-08-25',
    referringPerson: 'Self-referral',
    referralTrigger: 'Extended sickness absence — stress-related illness',
    injuryOnDuty: false,
    incidentDate: '2025-08-01',
    absenceStartDate: '2025-08-05',
    expectedReturnDate: '2025-10-01',
    actualReturnDate: null,
    caseStatus: 'Accommodation Planning',
    jobDuties: 'Operations coordinator — desk-based, high-pressure scheduling',
    functionalLimitations: 'Reduced hours recommended. Phased return 3 days/week.',
    workplaceAccommodations: 'Phased return: 3 days/week, flexible start times',
    caseManager: 'Dr. Sarah Chen',
    reviewDate: '2025-09-30',
    closureDate: null,
    closureReason: null,
  },
  {
    id: 'sa-demo-3',
    caseReference: 'SA-20250905-0003',
    employeeName: 'Nina Volkov',
    companyName: 'Helix Pharma Research',
    referralDate: '2025-07-10',
    referringPerson: 'Lena Fischer',
    referralTrigger: 'Occupational health referral — chemical exposure concern',
    injuryOnDuty: true,
    incidentDate: '2025-06-28',
    absenceStartDate: '2025-07-01',
    expectedReturnDate: '2025-09-15',
    actualReturnDate: '2025-09-18',
    caseStatus: 'Closed',
    jobDuties: 'QA lead — lab-based chemical handling and testing',
    functionalLimitations: 'Temporary reassignment from chemical handling duties',
    workplaceAccommodations: 'Reassigned to documentation QA during recovery',
    caseManager: 'Dr. James Holt',
    reviewDate: null,
    closureDate: '2025-09-18',
    closureReason: 'Full recovery confirmed. Returned to full duties.',
  },
];

function transformSicknessCase(row: Record<string, unknown>): SicknessAbsenceCase {
  return {
    id: row.id as string,
    caseReference: (row.case_reference as string) || '',
    employeeName: (row.employee_name as string) || '',
    companyName: (row.company_name as string) || '',
    referralDate: row.referral_date ? (row.referral_date as string) : '',
    referringPerson: (row.referring_person as string) || '',
    referralTrigger: (row.referral_trigger as string) || '',
    injuryOnDuty: (row.injury_on_duty as boolean) || false,
    incidentDate: row.incident_date ? (row.incident_date as string) : '',
    absenceStartDate: row.absence_start_date ? (row.absence_start_date as string) : '',
    expectedReturnDate: row.expected_return_date ? (row.expected_return_date as string) : '',
    actualReturnDate: row.actual_return_date ? (row.actual_return_date as string) : null,
    caseStatus: (row.case_status as string) as SicknessAbsenceCase['caseStatus'],
    jobDuties: (row.job_duties as string) || '',
    functionalLimitations: (row.functional_limitations as string) || '',
    workplaceAccommodations: (row.workplace_accommodations as string) || '',
    caseManager: (row.case_manager as string) || '',
    reviewDate: row.review_date ? (row.review_date as string) : null,
    closureDate: row.closure_date ? (row.closure_date as string) : null,
    closureReason: row.closure_reason ? (row.closure_reason as string) : null,
  };
}

export function useSicknessCases() {
  const { user } = useApp();
  const isEmployer = user?.role === 'employer';
  const { data, loading, error, refetch } = useSupabaseQuery<SicknessAbsenceCase>(
    isEmployer ? 'sickness_cases_employer_view' : 'sickness_absence_cases',
    transformSicknessCase,
    'created_at',
    false,
    () => mockSicknessCases,
  );

  const addCase = useCallback(async (caseData: Partial<SicknessAbsenceCase>) => {
    if (isDemoMode) throw new Error(demoWriteError);
    const { data: row, error: err } = await supabase
      .from('sickness_absence_cases')
      .insert({
        case_reference: caseData.caseReference,
        employee_name: caseData.employeeName,
        company_name: caseData.companyName || '',
        referral_date: caseData.referralDate || null,
        referring_person: caseData.referringPerson || '',
        referral_trigger: caseData.referralTrigger || '',
        injury_on_duty: caseData.injuryOnDuty || false,
        incident_date: caseData.incidentDate || null,
        absence_start_date: caseData.absenceStartDate || null,
        expected_return_date: caseData.expectedReturnDate || null,
        case_status: caseData.caseStatus || 'Referral Received',
        job_duties: caseData.jobDuties || '',
        functional_limitations: caseData.functionalLimitations || '',
        workplace_accommodations: caseData.workplaceAccommodations || '',
        case_manager: caseData.caseManager || '',
      })
      .select()
      .single();
    if (err) throw new Error(err.message);
    await refetch();
    return transformSicknessCase(row as Record<string, unknown>);
  }, [refetch]);

  const updateCase = useCallback(async (id: string, updates: Partial<SicknessAbsenceCase>) => {
    if (isDemoMode) throw new Error(demoWriteError);
    const updateData: Record<string, unknown> = {};
    if (updates.caseStatus !== undefined) updateData.case_status = updates.caseStatus;
    if (updates.expectedReturnDate !== undefined) updateData.expected_return_date = updates.expectedReturnDate;
    if (updates.actualReturnDate !== undefined) updateData.actual_return_date = updates.actualReturnDate;
    if (updates.functionalLimitations !== undefined) updateData.functional_limitations = updates.functionalLimitations;
    if (updates.workplaceAccommodations !== undefined) updateData.workplace_accommodations = updates.workplaceAccommodations;
    if (updates.reviewDate !== undefined) updateData.review_date = updates.reviewDate;
    if (updates.closureDate !== undefined) updateData.closure_date = updates.closureDate;
    if (updates.closureReason !== undefined) updateData.closure_reason = updates.closureReason;
    if (updates.caseManager !== undefined) updateData.case_manager = updates.caseManager;

    const { error: err } = await supabase.from('sickness_absence_cases').update(updateData).eq('id', id);
    if (err) throw new Error(err.message);
    await refetch();
  }, [refetch]);

  return { data, loading, error, refetch, addCase, updateCase };
}

// --- Sickness Risk Assessments ---

function transformRiskAssessment(row: Record<string, unknown>): SicknessRiskAssessment {
  return {
    id: row.id as string,
    caseId: (row.case_id as string) || '',
    severity: (row.severity as string) as SicknessRiskAssessment['severity'],
    likelihood: (row.likelihood as string) as SicknessRiskAssessment['likelihood'],
    riskLevel: (row.risk_level as string) || 'Low',
    notes: (row.notes as string) || '',
    reviewDate: row.review_date ? (row.review_date as string) : '',
    responsiblePerson: (row.responsible_person as string) || '',
  };
}

export function useRiskAssessments(caseId: string | null) {
  const [data, setData] = useState<SicknessRiskAssessment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!caseId) return;
    setLoading(true);
    const { data: rows, error: err } = await supabase
      .from('sickness_risk_assessments')
      .select('*')
      .eq('case_id', caseId)
      .order('created_at', { ascending: false });
    if (err) {
      setError(err.message);
    } else {
      setData((rows as Record<string, unknown>[]).map(transformRiskAssessment));
    }
    setLoading(false);
  }, [caseId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const addAssessment = useCallback(async (assessment: Partial<SicknessRiskAssessment>) => {
    if (isDemoMode) throw new Error(demoWriteError);
    const { error: err } = await supabase
      .from('sickness_risk_assessments')
      .insert({
        case_id: caseId,
        severity: assessment.severity || 'Low',
        likelihood: assessment.likelihood || 'Low',
        risk_level: assessment.riskLevel || 'Low',
        notes: assessment.notes || '',
        review_date: assessment.reviewDate || null,
        responsible_person: assessment.responsiblePerson || '',
      });
    if (err) throw new Error(err.message);
    await refetch();
  }, [caseId, refetch]);

  return { data, loading, error, refetch, addAssessment };
}

// --- Synopses ---

function transformSynopsis(row: Record<string, unknown>): Synopsis {
  return {
    id: row.id as string,
    employeeName: (row.employee_name as string) || '',
    employeeId: (row.employee_id as string) || null,
    prompt: (row.prompt as string) || '',
    content: (row.content as string) || '',
    status: (row.status as string) as Synopsis['status'],
    createdBy: (row.created_by as string) || '',
    createdAt: (row.created_at as string) || '',
  };
}

export function useSynopses() {
  const { data, loading, error, refetch } = useSupabaseQuery<Synopsis>(
    'synopses',
    transformSynopsis,
    'created_at',
    false,
  );

  const addSynopsis = useCallback(async (syn: Partial<Synopsis>) => {
    if (isDemoMode) throw new Error(demoWriteError);
    const { data: row, error: err } = await supabase
      .from('synopses')
      .insert({
        employee_name: syn.employeeName,
        employee_id: syn.employeeId || null,
        prompt: syn.prompt || '',
        content: syn.content || '',
        status: syn.status || 'Draft',
        created_by: syn.createdBy || '',
      })
      .select()
      .single();
    if (err) throw new Error(err.message);
    await refetch();
    return transformSynopsis(row as Record<string, unknown>);
  }, [refetch]);

  const updateSynopsis = useCallback(async (id: string, updates: Partial<Synopsis>) => {
    if (isDemoMode) throw new Error(demoWriteError);
    const updateData: Record<string, unknown> = {};
    if (updates.content !== undefined) updateData.content = updates.content;
    if (updates.status !== undefined) updateData.status = updates.status;

    const { error: err } = await supabase.from('synopses').update(updateData).eq('id', id);
    if (err) throw new Error(err.message);
    await refetch();
  }, [refetch]);

  return { data, loading, error, refetch, addSynopsis, updateSynopsis };
}

// --- Synopsis Meeting Notes ---

export function useSynopsisNotes(synopsisId: string | null) {
  const [data, setData] = useState<SynopsisMeetingNote[]>([]);
  const [loading, setLoading] = useState(false);

  const refetch = useCallback(async () => {
    if (!synopsisId) return;
    setLoading(true);
    const { data: rows, error: err } = await supabase
      .from('synopsis_meeting_notes')
      .select('*')
      .eq('synopsis_id', synopsisId)
      .order('created_at', { ascending: false });
    if (!err && rows) {
      setData(
        (rows as Record<string, unknown>[]).map((row) => ({
          id: row.id as string,
          synopsisId: (row.synopsis_id as string) || '',
          note: (row.note as string) || '',
          createdBy: (row.created_by as string) || '',
          createdAt: (row.created_at as string) || '',
        })),
      );
    }
    setLoading(false);
  }, [synopsisId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const addNote = useCallback(async (note: string, createdBy: string) => {
    if (isDemoMode) throw new Error(demoWriteError);
    const { error: err } = await supabase
      .from('synopsis_meeting_notes')
      .insert({ synopsis_id: synopsisId, note, created_by: createdBy });
    if (err) throw new Error(err.message);
    await refetch();
  }, [synopsisId, refetch]);

  return { data, loading, refetch, addNote };
}

// --- Synopsis Follow-ups ---

export function useSynopsisFollowUps(synopsisId: string | null) {
  const [data, setData] = useState<SynopsisFollowUp[]>([]);
  const [loading, setLoading] = useState(false);

  const refetch = useCallback(async () => {
    if (!synopsisId) return;
    setLoading(true);
    const { data: rows, error: err } = await supabase
      .from('synopsis_follow_ups')
      .select('*')
      .eq('synopsis_id', synopsisId)
      .order('created_at', { ascending: false });
    if (!err && rows) {
      setData(
        (rows as Record<string, unknown>[]).map((row) => ({
          id: row.id as string,
          synopsisId: (row.synopsis_id as string) || '',
          action: (row.action as string) || '',
          responsiblePerson: (row.responsible_person as string) || '',
          dueDate: row.due_date ? (row.due_date as string) : null,
          completed: (row.completed as boolean) || false,
        })),
      );
    }
    setLoading(false);
  }, [synopsisId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const addFollowUp = useCallback(async (action: string, responsiblePerson: string, dueDate: string | null) => {
    if (isDemoMode) throw new Error(demoWriteError);
    const { error: err } = await supabase
      .from('synopsis_follow_ups')
      .insert({ synopsis_id: synopsisId, action, responsible_person: responsiblePerson, due_date: dueDate });
    if (err) throw new Error(err.message);
    await refetch();
  }, [synopsisId, refetch]);

  const toggleFollowUp = useCallback(async (id: string, completed: boolean) => {
    if (isDemoMode) throw new Error(demoWriteError);
    const { error: err } = await supabase
      .from('synopsis_follow_ups')
      .update({ completed: !completed })
      .eq('id', id);
    if (err) throw new Error(err.message);
    await refetch();
  }, [refetch]);

  return { data, loading, refetch, addFollowUp, toggleFollowUp };
}
