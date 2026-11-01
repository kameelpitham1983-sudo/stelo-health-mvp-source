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
  DocumentVersion,
  AuditLogEntry,
  ActivityEvent,
  SicknessAbsenceCase,
  SicknessRiskAssessment,
  Synopsis,
  SynopsisMeetingNote,
  SynopsisFollowUp,
  VaccineStatus,
  WorkflowDefinition,
  WorkflowInstance,
  DigitalCertificate,
  RecordNote,
  CaseRecord,
  CaseActivityEntry,
  Provider,
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

  const addEmployee = useCallback(async (employee: Partial<Employee>) => {
    if (isDemoMode) throw new Error(demoWriteError);
    const nameParts = (employee.name || '').split(' ');    
    const firstName = nameParts[0] || '';
    const surname = nameParts.slice(1).join(' ') || '';
    const { data: row, error: err } = await supabase
      .from('employees')
      .insert({
        first_name: firstName,
        surname,
        email: employee.email || '',
        phone: employee.phone || '',
        job_title: employee.jobTitle || '',
        company_id: employee.companyId || null,
        department: employee.department || '',
        employment_status: employee.status || 'Active',
        fitness_outcome: employee.healthStatus || 'Pending Assessment',
        international_travel_required: employee.travelReady || false,
      })
      .select()
      .single();
    if (err) throw new Error(err.message);
    await refetch();
    return transformEmployee(row as Record<string, unknown>);
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

  return { data, loading, error, refetch, addEmployee, updateEmployeeFitness };
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
  const logAudit = useLogAuditEvent();

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
    const created = transformMedical(row as Record<string, unknown>);
    await logAudit({
      actorName: user?.name || 'Unknown',
      actorRole: user?.role || 'admin',
      recordType: 'medical',
      recordId: created.id,
      recordReference: `${created.employeeName} — ${created.type}`,
      action: 'create',
      toStatus: created.status,
      details: `Medical assessment created: ${created.type} for ${created.employeeName}`,
    });
    await refetch();
    return created;
  }, [refetch, user, logAudit]);

  const updateMedical = useCallback(async (id: string, updates: Partial<Medical>) => {
    if (isDemoMode) throw new Error(demoWriteError);
    const prev = data.find((m) => m.id === id);
    const updateData: Record<string, unknown> = {};
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.result !== undefined) updateData.result = updates.result;
    if (updates.notes !== undefined) updateData.notes = updates.notes;
    if (updates.type !== undefined) updateData.type = updates.type;
    if (updates.date !== undefined) updateData.assessment_date = updates.date;
    if (updates.providerName !== undefined) updateData.provider_name = updates.providerName;

    const { error: err } = await supabase.from('medicals').update(updateData).eq('id', id);
    if (err) throw new Error(err.message);
    await logAudit({
      actorName: user?.name || 'Unknown',
      actorRole: user?.role || 'admin',
      recordType: 'medical',
      recordId: id,
      recordReference: prev ? `${prev.employeeName} — ${prev.type}` : id,
      action: 'update',
      fromStatus: prev?.status,
      toStatus: updates.status,
      details: updates.status ? `Status changed to ${updates.status}` : 'Medical record updated',
    });
    await refetch();
  }, [refetch, data, user, logAudit]);

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
  const { user } = useApp();
  const { data, loading, error, refetch } = useSupabaseQuery<Appointment>(
    'appointments',
    transformAppointment,
    'appointment_date',
    true,
    () => mockData.appointments,
  );
  const logAudit = useLogAuditEvent();

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
    const created = transformAppointment(row as Record<string, unknown>);
    await logAudit({
      actorName: user?.name || 'Unknown',
      actorRole: user?.role || 'admin',
      recordType: 'appointment',
      recordId: created.id,
      recordReference: `${created.employeeName} — ${created.type} — ${created.date}`,
      action: 'create',
      toStatus: created.status,
      details: `Appointment created: ${created.type} for ${created.employeeName}`,
    });
    await refetch();
    return created;
  }, [refetch, user, logAudit]);

  const updateAppointment = useCallback(async (id: string, updates: Partial<Appointment>) => {
    if (isDemoMode) throw new Error(demoWriteError);
    const prev = data.find((a) => a.id === id);
    const updateData: Record<string, unknown> = {};
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.date !== undefined) updateData.appointment_date = updates.date;
    if (updates.time !== undefined) updateData.appointment_time = updates.time;
    if (updates.mode !== undefined) updateData.mode = updates.mode;
    if (updates.location !== undefined) updateData.location = updates.location;
    if (updates.providerName !== undefined) updateData.provider_name = updates.providerName;

    const { error: err } = await supabase.from('appointments').update(updateData).eq('id', id);
    if (err) throw new Error(err.message);
    await logAudit({
      actorName: user?.name || 'Unknown',
      actorRole: user?.role || 'admin',
      recordType: 'appointment',
      recordId: id,
      recordReference: prev ? `${prev.employeeName} — ${prev.type} — ${prev.date}` : id,
      action: 'update',
      fromStatus: prev?.status,
      toStatus: updates.status,
      details: updates.status ? `Status changed to ${updates.status}` : 'Appointment updated',
    });
    await refetch();
  }, [refetch, data, user, logAudit]);

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
    employeeId: (row.employee_id as string) || null,
    medicalId: (row.medical_id as string) || null,
    appointmentId: (row.appointment_id as string) || null,
    providerId: (row.provider_id as string) || null,
    workflowInstanceId: (row.workflow_instance_id as string) || null,
    responsiblePerson: (row.responsible_person as string) || null,
    replacesDocumentId: (row.replaces_document_id as string) || null,
    versionNumber: (row.version_number as number) || 1,
    isCurrentVersion: row.is_current_version !== false,
  };
}

export function useDocuments() {
  const { user } = useApp();
  const { data, loading, error, refetch } = useSupabaseQuery<DocumentRecord>(
    'documents',
    transformDocument,
    'uploaded_date',
    false,
    () => mockData.documents,
  );
  const logAudit = useLogAuditEvent();

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
        employee_id: doc.employeeId || null,
        medical_id: doc.medicalId || null,
        appointment_id: doc.appointmentId || null,
        provider_id: doc.providerId || null,
        workflow_instance_id: doc.workflowInstanceId || null,
        responsible_person: doc.responsiblePerson || null,
        version_number: 1,
        is_current_version: true,
      })
      .select()
      .single();
    if (err) throw new Error(err.message);
    const created = transformDocument(row as Record<string, unknown>);
    await logAudit({
      actorName: user?.name || 'Unknown',
      actorRole: user?.role || 'admin',
      recordType: 'document',
      recordId: created.id,
      recordReference: created.name,
      action: 'create',
      toStatus: created.status,
      details: `Document uploaded: ${created.name} (${created.type})`,
    });
    await refetch();
    return created;
  }, [refetch, user, logAudit]);

  const updateDocument = useCallback(async (id: string, updates: Partial<DocumentRecord>) => {
    if (isDemoMode) throw new Error(demoWriteError);
    const prev = data.find((d) => d.id === id);
    const updateData: Record<string, unknown> = {};
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.type !== undefined) updateData.type = updates.type;
    if (updates.expiryDate !== undefined) updateData.expiry_date = updates.expiryDate || null;
    if (updates.responsiblePerson !== undefined) updateData.responsible_person = updates.responsiblePerson || null;

    const { error: err } = await supabase.from('documents').update(updateData).eq('id', id);
    if (err) throw new Error(err.message);
    await logAudit({
      actorName: user?.name || 'Unknown',
      actorRole: user?.role || 'admin',
      recordType: 'document',
      recordId: id,
      recordReference: prev?.name || id,
      action: 'update',
      fromStatus: prev?.status,
      toStatus: updates.status,
      details: updates.status ? `Status changed to ${updates.status}` : 'Document updated',
    });
    await refetch();
  }, [refetch, data, user, logAudit]);

  const replaceDocument = useCallback(async (id: string, replacement: Partial<DocumentRecord> & { versionNotes?: string }) => {
    if (isDemoMode) throw new Error(demoWriteError);
    const prev = data.find((d) => d.id === id);
    if (!prev) throw new Error('Document not found');

    // Archive current version into document_versions
    const { error: archiveErr } = await supabase.from('document_versions').insert({
      document_id: id,
      version_number: prev.versionNumber || 1,
      name: prev.name,
      type: prev.type,
      status: prev.status,
      uploaded_by: prev.uploadedBy,
      version_notes: replacement.versionNotes || 'Replaced with new version',
    });
    if (archiveErr) throw new Error(archiveErr.message);

    // Update the document in place with new version info
    const newVersionNumber = (prev.versionNumber || 1) + 1;
    const { data: row, error: err } = await supabase
      .from('documents')
      .update({
        name: replacement.name || prev.name,
        type: replacement.type || prev.type,
        status: replacement.status || 'Draft',
        uploaded_by: replacement.uploadedBy || prev.uploadedBy,
        uploaded_date: new Date().toISOString(),
        file_size: replacement.fileSize || prev.fileSize,
        file_type: replacement.fileType || prev.fileType,
        expiry_date: replacement.expiryDate || prev.expiryDate,
        version_number: newVersionNumber,
        replaces_document_id: id,
      })
      .eq('id', id)
      .select()
      .single();
    if (err) throw new Error(err.message);
    const updated = transformDocument(row as Record<string, unknown>);

    await logAudit({
      actorName: user?.name || 'Unknown',
      actorRole: user?.role || 'admin',
      recordType: 'document',
      recordId: id,
      recordReference: updated.name,
      action: 'version_replace',
      fromStatus: prev.status,
      toStatus: updated.status,
      details: `Document replaced: v${prev.versionNumber || 1} → v${newVersionNumber}`,
    });
    await refetch();
    return updated;
  }, [refetch, data, user, logAudit]);

  return { data, loading, error, refetch, addDocument, updateDocument, replaceDocument };
}

// --- Document Versions ---

function transformDocumentVersion(row: Record<string, unknown>): DocumentVersion {
  return {
    id: row.id as string,
    documentId: (row.document_id as string) || '',
    versionNumber: (row.version_number as number) || 1,
    name: (row.name as string) || '',
    type: (row.type as string) || '',
    status: (row.status as string) || '',
    uploadedBy: (row.uploaded_by as string) || '',
    versionNotes: (row.version_notes as string) || null,
    createdAt: (row.created_at as string) || '',
  };
}

export function useDocumentVersions(documentId: string | null) {
  const [data, setData] = useState<DocumentVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!documentId) return;
    setLoading(true);
    setError(null);
    if (!supabaseConfigured) { setData([]); setLoading(false); return; }
    const { data: rows, error: err } = await supabase
      .from('document_versions')
      .select('*')
      .eq('document_id', documentId)
      .order('version_number', { ascending: false });
    if (err) { setError(err.message); }
    else { setData((rows as Record<string, unknown>[]).map(transformDocumentVersion)); }
    setLoading(false);
  }, [documentId]);

  useEffect(() => { refetch(); }, [refetch]);

  return { data, loading, error, refetch };
}

// --- Audit Log ---

function transformAuditLog(row: Record<string, unknown>): AuditLogEntry {
  return {
    id: row.id as string,
    actorId: (row.actor_id as string) || null,
    actorName: (row.actor_name as string) || '',
    actorRole: (row.actor_role as string) || '',
    recordType: (row.record_type as string) || '',
    recordId: (row.record_id as string) || null,
    recordReference: (row.record_reference as string) || '',
    action: (row.action as string) || '',
    fromStatus: (row.from_status as string) || null,
    toStatus: (row.to_status as string) || null,
    companyId: (row.company_id as string) || null,
    workflowInstanceId: (row.workflow_instance_id as string) || null,
    details: (row.details as string) || null,
    success: (row.success as boolean) !== false,
    createdAt: (row.created_at as string) || '',
  };
}

export function useAuditLog() {
  const [data, setData] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    if (!supabaseConfigured) { setData([]); setLoading(false); return; }
    const { data: rows, error: err } = await supabase
      .from('audit_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);
    if (err) { setError(err.message); }
    else { setData((rows as Record<string, unknown>[]).map(transformAuditLog)); }
    setLoading(false);
  }, []);

  useEffect(() => { refetch(); }, [refetch]);

  return { data, loading, error, refetch };
}

export function useLogAuditEvent() {
  return useCallback(async (entry: {
    actorName: string;
    actorRole: string;
    recordType: string;
    recordId?: string | null;
    recordReference?: string;
    action: string;
    fromStatus?: string | null;
    toStatus?: string | null;
    companyId?: string | null;
    workflowInstanceId?: string | null;
    details?: string | null;
    success?: boolean;
  }) => {
    if (isDemoMode || !supabaseConfigured) return;
    await supabase.from('audit_log').insert({
      actor_name: entry.actorName,
      actor_role: entry.actorRole,
      record_type: entry.recordType,
      record_id: entry.recordId || null,
      record_reference: entry.recordReference || '',
      action: entry.action,
      from_status: entry.fromStatus || null,
      to_status: entry.toStatus || null,
      company_id: entry.companyId || null,
      workflow_instance_id: entry.workflowInstanceId || null,
      details: entry.details || null,
      success: entry.success !== false,
    });
  }, []);
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
  const logAudit = useLogAuditEvent();

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
    const created = transformSicknessCase(row as Record<string, unknown>);
    await logAudit({
      actorName: user?.name || 'Unknown',
      actorRole: user?.role || 'admin',
      recordType: 'sickness_case',
      recordId: created.id,
      recordReference: `${created.caseReference} — ${created.employeeName}`,
      action: 'create',
      toStatus: created.caseStatus,
      details: `Sickness absence case created: ${created.caseReference}`,
    });
    await refetch();
    return created;
  }, [refetch, user, logAudit]);

  const updateCase = useCallback(async (id: string, updates: Partial<SicknessAbsenceCase>) => {
    if (isDemoMode) throw new Error(demoWriteError);
    const prev = data.find((c) => c.id === id);
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
    await logAudit({
      actorName: user?.name || 'Unknown',
      actorRole: user?.role || 'admin',
      recordType: 'sickness_case',
      recordId: id,
      recordReference: prev ? `${prev.caseReference} — ${prev.employeeName}` : id,
      action: 'update',
      fromStatus: prev?.caseStatus,
      toStatus: updates.caseStatus,
      details: updates.caseStatus ? `Case status changed to ${updates.caseStatus}` : 'Sickness case updated',
    });
    await refetch();
  }, [refetch, data, user, logAudit]);

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

// --- Workflow Definitions ---

function transformWorkflowDefinition(row: Record<string, unknown>): WorkflowDefinition {
  return {
    id: row.id as string,
    name: (row.name as string) || '',
    category: (row.category as string) as WorkflowDefinition['category'],
    description: (row.description as string) || '',
    version: (row.version as number) || 1,
    active: (row.active as boolean) ?? true,
    steps: ((row.steps as Record<string, unknown>[]) || []).map((s) => ({
      id: s.id as string,
      stepNumber: s.stepNumber as number,
      stepName: s.stepName as string,
      purpose: s.purpose as string,
      instructions: s.instructions as string,
      responsibleRole: s.responsibleRole as WorkflowDefinition['steps'][number]['responsibleRole'],
      requiredInfo: (s.requiredInfo as string[]) || [],
      requiredDocuments: (s.requiredDocuments as string[]) || [],
      requiredApprovals: (s.requiredApprovals as string[]) || [],
      systemActions: (s.systemActions as string[]) || [],
      completionCriteria: s.completionCriteria as string,
      escalationRules: s.escalationRules as string,
      exceptionHandling: s.exceptionHandling as string,
    })),
    createdAt: (row.created_at as string) || '',
    updatedAt: (row.updated_at as string) || '',
  };
}

export function useWorkflowDefinitions() {
  return useSupabaseQuery<WorkflowDefinition>(
    'workflow_definitions',
    transformWorkflowDefinition,
    'name',
    true,
    () => mockData.workflowDefinitions,
  );
}

// --- Workflow Instances ---

function transformWorkflowInstance(row: Record<string, unknown>): WorkflowInstance {
  return {
    id: row.id as string,
    workflowDefinitionId: (row.workflow_definition_id as string) || '',
    workflowName: (row.workflow_name as string) || '',
    instanceReference: (row.instance_reference as string) || '',
    employeeName: (row.employee_name as string) || '',
    employeeId: (row.employee_id as string) || null,
    companyName: (row.company_name as string) || '',
    companyId: (row.company_id as string) || null,
    linkedMedicalId: (row.linked_medical_id as string) || null,
    linkedAppointmentId: (row.linked_appointment_id as string) || null,
    status: (row.status as string) as WorkflowInstance['status'],
    currentStep: (row.current_step as number) || 0,
    totalSteps: (row.total_steps as number) || 0,
    assignedTo: (row.assigned_to as string) || '',
    notes: (row.notes as string) || '',
    stepInstances: ((row.step_instances as Record<string, unknown>[]) || []).map((s) => ({
      id: s.id as string,
      workflowInstanceId: (s.workflow_instance_id as string) || '',
      stepNumber: s.stepNumber as number,
      stepName: s.stepName as string,
      status: s.status as WorkflowInstance['stepInstances'][number]['status'],
      responsibleRole: s.responsibleRole as WorkflowInstance['stepInstances'][number]['responsibleRole'],
      assignedPerson: (s.assignedPerson as string) || '',
      startedAt: (s.startedAt as string) || null,
      completedAt: (s.completedAt as string) || null,
      notes: (s.notes as string) || '',
      exceptionFlagged: (s.exceptionFlagged as boolean) || false,
      exceptionReason: (s.exceptionReason as string) || '',
    })),
    createdAt: (row.created_at as string) || '',
    updatedAt: (row.updated_at as string) || '',
  };
}

export function useWorkflowInstances() {
  return useSupabaseQuery<WorkflowInstance>(
    'workflow_instances',
    transformWorkflowInstance,
    'created_at',
    false,
    () => mockData.workflowInstances,
  );
}

// --- Digital Certificates ---

function transformCertificate(row: Record<string, unknown>): DigitalCertificate {
  return {
    id: row.id as string,
    certificateType: (row.certificate_type as string) as DigitalCertificate['certificateType'],
    certificateNumber: (row.certificate_number as string) || '',
    employeeId: (row.employee_id as string) || null,
    employeeName: (row.employee_name as string) || '',
    companyName: (row.company_name as string) || '',
    linkedMedicalId: (row.linked_medical_id as string) || null,
    title: (row.title as string) || '',
    description: (row.description as string) || '',
    status: (row.status as string) as DigitalCertificate['status'],
    issueDate: (row.issue_date as string) || '',
    expiryDate: (row.expiry_date as string) || null,
    issuedBy: (row.issued_by as string) || '',
    verificationCode: (row.verification_code as string) || '',
    qrPayload: (row.qr_payload as string) || '',
    metadata: (row.metadata as Record<string, unknown>) || {},
    revokedReason: (row.revoked_reason as string) || '',
    revokedAt: (row.revoked_at as string) || null,
    replacedBy: (row.replaced_by as string) || null,
    createdAt: (row.created_at as string) || '',
  };
}

export function useDigitalCertificates() {
  return useSupabaseQuery<DigitalCertificate>(
    'digital_certificates',
    transformCertificate,
    'created_at',
    false,
    () => mockData.digitalCertificates,
  );
}

// --- Record Notes ---

function transformRecordNote(row: Record<string, unknown>): RecordNote {
  return {
    id: row.id as string,
    recordType: (row.record_type as string) || '',
    recordId: (row.record_id as string) || '',
    note: (row.note as string) || '',
    noteType: (row.note_type as string) || 'general',
    authorName: (row.author_name as string) || '',
    isConfidential: (row.is_confidential as boolean) || false,
    createdAt: (row.created_at as string) || '',
  };
}

export function useRecordNotes(recordType: string | null, recordId: string | null) {
  const [data, setData] = useState<RecordNote[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const refetch = useCallback(async () => {
    if (!recordType || !recordId) return;
    setLoading(true);
    setError(null);
    if (!supabaseConfigured) {
      setData(mockData.recordNotes.filter((n) => n.recordType === recordType && n.recordId === recordId));
      setLoading(false);
      return;
    }
    const { data: rows, error: err } = await supabase
      .from('record_notes')
      .select('*')
      .eq('record_type', recordType)
      .eq('record_id', recordId)
      .order('created_at', { ascending: false });
    if (err) {
      setError(err.message);
    } else if (rows) {
      setData((rows as Record<string, unknown>[]).map(transformRecordNote));
    }
    setLoading(false);
  }, [recordType, recordId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const addNote = useCallback(async (note: string, noteType: string, authorName: string, isConfidential: boolean) => {
    if (isDemoMode) throw new Error(demoWriteError);
    const { error: err } = await supabase
      .from('record_notes')
      .insert({ record_type: recordType, record_id: recordId, note, note_type: noteType, author_name: authorName, is_confidential: isConfidential });
    if (err) throw new Error(err.message);
    await refetch();
  }, [recordType, recordId, refetch]);

  return { data, loading, refetch, addNote };
}

// --- Providers ---

function transformProvider(row: Record<string, unknown>): Provider {
  return {
    id: row.id as string,
    name: (row.name as string) || '',
    providerCode: (row.provider_code as string) || '',
    category: (row.category as string) as Provider['category'],
    services: ((row.services as string[]) || []).map((s) => String(s)),
    status: (row.status as string) as Provider['status'],
    tier: (row.tier as string) as Provider['tier'],
    contactPerson: (row.contact_person as string) || '',
    phone: (row.phone as string) || '',
    email: (row.email as string) || '',
    physicalAddress: (row.physical_address as string) || '',
    gpsCoordinates: (row.gps_coordinates as string) || null,
    provincesServed: ((row.provinces_served as string[]) || []).map((s) => String(s)),
    townsServed: ((row.towns_served as string[]) || []).map((s) => String(s)),
    operatingHours: (row.operating_hours as string) || '',
    bookingProcess: (row.booking_process as string) || '',
    appointmentAvailability: (row.appointment_availability as string) || '',
    indicativePricing: (row.indicative_pricing as string) || '',
    commercialTerms: (row.commercial_terms as string) || '',
    serviceCapacity: (row.service_capacity as number) || null,
    mobileServiceAvailable: (row.mobile_service_available as boolean) || false,
    travelCharges: (row.travel_charges as string) || '',
    registrationNumber: (row.registration_number as string) || '',
    licenceNumber: (row.licence_number as string) || '',
    accreditationDetails: (row.accreditation_details as string) || '',
    accreditationExpiryDate: row.accreditation_expiry_date ? (row.accreditation_expiry_date as string) : null,
    lastVerificationDate: row.last_verification_date ? (row.last_verification_date as string) : null,
    internalNotes: (row.internal_notes as string) || '',
    documents: (row.documents as Provider['documents']) || [],
    performanceMetrics: (row.performance_metrics as Provider['performanceMetrics']) || [],
    siteVisits: (row.site_visits as Provider['siteVisits']) || [],
    createdAt: (row.created_at as string) || '',
    updatedAt: (row.updated_at as string) || '',
  };
}

export function useProviders() {
  return useSupabaseQuery<Provider>(
    'providers',
    transformProvider,
    'name',
    true,
    () => [],
  );
}

// --- Central Case Management ---

function transformCase(row: Record<string, unknown>): CaseRecord {
  return {
    id: row.id as string,
    caseReference: (row.case_reference as string) || '',
    caseType: (row.case_type as string) as CaseRecord['caseType'],
    title: (row.title as string) || '',
    description: (row.description as string) || '',
    companyId: (row.company_id as string) || null,
    companyName: (row.company_name as string) || '',
    employeeId: (row.employee_id as string) || null,
    employeeName: (row.employee_name as string) || null,
    assignedCoordinator: (row.assigned_coordinator as string) || '',
    caseOwner: (row.case_owner as string) || '',
    dateOpened: (row.date_opened as string) || '',
    targetCompletionDate: (row.target_completion_date as string) || null,
    priority: (row.priority as string) as CaseRecord['priority'],
    status: (row.status as string) as CaseRecord['status'],
    nextAction: (row.next_action as string) || null,
    nextActionDueDate: (row.next_action_due_date as string) || null,
    linkedMedicalId: (row.linked_medical_id as string) || null,
    linkedAppointmentId: (row.linked_appointment_id as string) || null,
    linkedTravelId: (row.linked_travel_id as string) || null,
    linkedSicknessId: (row.linked_sickness_id as string) || null,
    linkedWorkflowInstanceId: (row.linked_workflow_instance_id as string) || null,
    providerId: (row.provider_id as string) || null,
    providerName: (row.provider_name as string) || null,
    laboratoryName: (row.laboratory_name as string) || null,
    specialistName: (row.specialist_name as string) || null,
    linkedDocumentIds: (row.linked_document_ids as string[]) || [],
    closureNotes: (row.closure_notes as string) || null,
    closureDate: (row.closure_date as string) || null,
    createdBy: (row.created_by as string) || '',
    createdAt: (row.created_at as string) || '',
    updatedAt: (row.updated_at as string) || '',
  };
}

function transformCaseActivity(row: Record<string, unknown>): CaseActivityEntry {
  return {
    id: row.id as string,
    caseId: (row.case_id as string) || '',
    activityType: (row.activity_type as string) as CaseActivityEntry['activityType'],
    title: (row.title as string) || '',
    description: (row.description as string) || null,
    actorName: (row.actor_name as string) || '',
    actorRole: (row.actor_role as string) || '',
    metadata: (row.metadata as Record<string, unknown>) || null,
    createdAt: (row.created_at as string) || '',
  };
}

export function useCases() {
  const { user } = useApp();
  const [data, setData] = useState<CaseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const logAudit = useLogAuditEvent();

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    if (!supabaseConfigured) { setData([]); setLoading(false); return; }
    const { data: rows, error: err } = await supabase
      .from('cases')
      .select('*')
      .order('created_at', { ascending: false });
    if (err) { setError(err.message); }
    else { setData((rows as Record<string, unknown>[]).map(transformCase)); }
    setLoading(false);
  }, []);

  useEffect(() => { refetch(); }, [refetch]);

  const addCase = useCallback(async (caseData: Partial<CaseRecord>) => {
    if (isDemoMode) throw new Error(demoWriteError);
    const now = new Date();
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const { data: existing } = await supabase
      .from('cases')
      .select('case_reference')
      .like('case_reference', `STELO-${dateStr}-%`)
      .order('case_reference', { ascending: false })
      .limit(1);
    const seqNum = existing && existing.length > 0
      ? parseInt((existing[0] as Record<string, unknown>).case_reference as string, 10) + 1 || 1
      : 1;
    const caseReference = `STELO-${dateStr}-${String(seqNum).padStart(4, '0')}`;

    const { data: row, error: err } = await supabase
      .from('cases')
      .insert({
        case_reference: caseReference,
        case_type: caseData.caseType || 'other',
        title: caseData.title || '',
        description: caseData.description || '',
        company_id: caseData.companyId || null,
        company_name: caseData.companyName || '',
        employee_id: caseData.employeeId || null,
        employee_name: caseData.employeeName || null,
        assigned_coordinator: caseData.assignedCoordinator || '',
        case_owner: caseData.caseOwner || '',
        date_opened: caseData.dateOpened || new Date().toISOString().slice(0, 10),
        target_completion_date: caseData.targetCompletionDate || null,
        priority: caseData.priority || 'medium',
        status: caseData.status || 'new',
        next_action: caseData.nextAction || null,
        next_action_due_date: caseData.nextActionDueDate || null,
        linked_medical_id: caseData.linkedMedicalId || null,
        linked_appointment_id: caseData.linkedAppointmentId || null,
        linked_travel_id: caseData.linkedTravelId || null,
        linked_sickness_id: caseData.linkedSicknessId || null,
        linked_workflow_instance_id: caseData.linkedWorkflowInstanceId || null,
        provider_id: caseData.providerId || null,
        provider_name: caseData.providerName || null,
        laboratory_name: caseData.laboratoryName || null,
        specialist_name: caseData.specialistName || null,
        created_by: user?.name || 'Unknown',
      })
      .select()
      .single();
    if (err) throw new Error(err.message);
    const created = transformCase(row as Record<string, unknown>);

    await supabase.from('case_activity').insert({
      case_id: created.id,
      activity_type: 'created',
      title: `Case ${created.caseReference} opened`,
      description: created.title,
      actor_name: user?.name || 'Unknown',
      actor_role: user?.role || 'admin',
    });

    await logAudit({
      actorName: user?.name || 'Unknown',
      actorRole: user?.role || 'admin',
      recordType: 'case',
      recordId: created.id,
      recordReference: created.caseReference,
      action: 'create',
      toStatus: created.status,
      details: `Case created: ${created.title} (${created.caseType})`,
    });
    await refetch();
    return created;
  }, [refetch, user, logAudit]);

  const updateCase = useCallback(async (id: string, updates: Partial<CaseRecord>) => {
    if (isDemoMode) throw new Error(demoWriteError);
    const prev = data.find((c) => c.id === id);
    const updateData: Record<string, unknown> = {};
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.priority !== undefined) updateData.priority = updates.priority;
    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.assignedCoordinator !== undefined) updateData.assigned_coordinator = updates.assignedCoordinator;
    if (updates.caseOwner !== undefined) updateData.case_owner = updates.caseOwner;
    if (updates.targetCompletionDate !== undefined) updateData.target_completion_date = updates.targetCompletionDate || null;
    if (updates.nextAction !== undefined) updateData.next_action = updates.nextAction;
    if (updates.nextActionDueDate !== undefined) updateData.next_action_due_date = updates.nextActionDueDate || null;
    if (updates.linkedMedicalId !== undefined) updateData.linked_medical_id = updates.linkedMedicalId || null;
    if (updates.linkedAppointmentId !== undefined) updateData.linked_appointment_id = updates.linkedAppointmentId || null;
    if (updates.linkedTravelId !== undefined) updateData.linked_travel_id = updates.linkedTravelId || null;
    if (updates.linkedSicknessId !== undefined) updateData.linked_sickness_id = updates.linkedSicknessId || null;
    if (updates.linkedWorkflowInstanceId !== undefined) updateData.linked_workflow_instance_id = updates.linkedWorkflowInstanceId || null;
    if (updates.providerId !== undefined) updateData.provider_id = updates.providerId || null;
    if (updates.providerName !== undefined) updateData.provider_name = updates.providerName || null;
    if (updates.laboratoryName !== undefined) updateData.laboratory_name = updates.laboratoryName || null;
    if (updates.specialistName !== undefined) updateData.specialist_name = updates.specialistName || null;
    if (updates.closureNotes !== undefined) updateData.closure_notes = updates.closureNotes;
    if (updates.closureDate !== undefined) updateData.closure_date = updates.closureDate;

    const { error: err } = await supabase.from('cases').update(updateData).eq('id', id);
    if (err) throw new Error(err.message);

    if (updates.status && prev && prev.status !== updates.status) {
      await supabase.from('case_activity').insert({
        case_id: id,
        activity_type: 'status_change',
        title: `Status changed from ${prev.status} to ${updates.status}`,
        description: updates.nextAction || undefined,
        actor_name: user?.name || 'Unknown',
        actor_role: user?.role || 'admin',
        metadata: { from_status: prev.status, to_status: updates.status },
      });
    }

    await logAudit({
      actorName: user?.name || 'Unknown',
      actorRole: user?.role || 'admin',
      recordType: 'case',
      recordId: id,
      recordReference: prev?.caseReference || id,
      action: 'update',
      fromStatus: prev?.status,
      toStatus: updates.status,
      details: updates.status ? `Case status changed to ${updates.status}` : 'Case updated',
    });
    await refetch();
  }, [refetch, data, user, logAudit]);

  return { data, loading, error, refetch, addCase, updateCase };
}

export function useCaseActivity(caseId: string | null) {
  const { user } = useApp();
  const [data, setData] = useState<CaseActivityEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!caseId) return;
    setLoading(true);
    setError(null);
    if (!supabaseConfigured) { setData([]); setLoading(false); return; }
    const { data: rows, error: err } = await supabase
      .from('case_activity')
      .select('*')
      .eq('case_id', caseId)
      .order('created_at', { ascending: false });
    if (err) { setError(err.message); }
    else { setData((rows as Record<string, unknown>[]).map(transformCaseActivity)); }
    setLoading(false);
  }, [caseId]);

  useEffect(() => { refetch(); }, [refetch]);

  const addActivity = useCallback(async (entry: {
    activityType: CaseActivityEntry['activityType'];
    title: string;
    description?: string;
    metadata?: Record<string, unknown>;
  }) => {
    if (isDemoMode) throw new Error(demoWriteError);
    const { error: err } = await supabase.from('case_activity').insert({
      case_id: caseId,
      activity_type: entry.activityType,
      title: entry.title,
      description: entry.description || null,
      actor_name: user?.name || 'Unknown',
      actor_role: user?.role || 'admin',
      metadata: entry.metadata || null,
    });
    if (err) throw new Error(err.message);
    await refetch();
  }, [caseId, refetch, user]);

  return { data, loading, error, refetch, addActivity };
}
