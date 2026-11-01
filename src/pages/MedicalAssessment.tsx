import { useState } from 'react';
import { ArrowLeft, CheckCircle2, Circle, ClipboardCheck, Plus } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { can } from '@/lib/permissions';
import { isDemoMode, saveDemoMedicalOverride, useCases, useEmployees, useMedicals } from '@/hooks/useSupabaseData';
import { useOnboardingCases } from '@/hooks/useOnboardingCases';
import { useMedicalAssessments, type MedicalAssessmentPatch } from '@/hooks/useMedicalAssessments';
import { MedicalAssessmentStagePanel } from '@/components/MedicalAssessmentStagePanel';
import {
  MEDICAL_ASSESSMENT_NOTICE,
  MEDICAL_ASSESSMENT_STEPS,
  MEDICAL_RECORD_TYPE_FOR,
  MEDICAL_RESULT_FOR_OUTCOME,
  getMedicalAssessmentStatusLabel,
  getMedicalAssessmentStepId,
  type MedicalAssessmentType,
} from '@/lib/medicalAssessmentWorkflow';
import type { PermissionAction } from '@/lib/permissions';

const ASSESSMENT_TYPES: MedicalAssessmentType[] = ['Pre-employment', 'Periodic', 'Transfer'];

export function MedicalAssessment() {
  const { user } = useApp();
  const { data: employees } = useEmployees();
  const { data: medicals, updateMedical } = useMedicals();
  const { data: cases } = useCases();
  const { cases: onboardingCases } = useOnboardingCases();
  const { records, error, createRecord, updateRecord } = useMedicalAssessments();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [employeeId, setEmployeeId] = useState('');
  const [assessmentType, setAssessmentType] = useState<MedicalAssessmentType>('Pre-employment');
  const [medicalId, setMedicalId] = useState('');
  const [onboardingCaseId, setOnboardingCaseId] = useState('');
  const [caseId, setCaseId] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const canManage = can(user, 'medicalAssessment.manage');
  const canClinical = can(user, 'medicalAssessment.outcome');
  const selected = records.find((r) => r.id === selectedId) ?? null;
  const chosenEmployee = employees.find((e) => e.id === employeeId) ?? null;
  const employeeMedicals = medicals.filter((m) => m.employeeId === employeeId && m.type === MEDICAL_RECORD_TYPE_FOR[assessmentType]);
  const chosenMedical = employeeMedicals.find((m) => m.id === medicalId) ?? null;
  const approvedWorkOrders = onboardingCases.filter((c) => c.data.workOrderStatus === 'approved' && c.companyName === chosenEmployee?.companyName);
  const chosenWorkOrder = approvedWorkOrders.find((c) => c.id === onboardingCaseId) ?? null;
  const employeeCases = cases.filter((c) => c.employeeId !== null && c.employeeId === employeeId);
  const chosenCase = employeeCases.find((c) => c.id === caseId) ?? null;
  const canCreate = !!chosenEmployee && !!chosenMedical && !!chosenWorkOrder && !creating;

  const handleCreate = async () => {
    if (!chosenEmployee || !chosenMedical || !chosenWorkOrder) return;
    setCreating(true);
    setCreateError(null);
    try {
      await createRecord({
        employeeId: chosenEmployee.id,
        employeeName: chosenEmployee.name,
        companyId: chosenEmployee.companyId || null,
        companyName: chosenEmployee.companyName,
        assessmentType,
        medicalId: chosenMedical.id,
        medicalRecordType: chosenMedical.type,
        onboardingCaseId: chosenWorkOrder.id,
        workOrderApproved: true,
        caseId: chosenCase?.id ?? null,
        caseReference: chosenCase?.caseReference ?? '',
      });
      setEmployeeId('');
      setMedicalId('');
      setOnboardingCaseId('');
      setCaseId('');
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'The medical assessment could not be created.');
    } finally {
      setCreating(false);
    }
  };

  const handleUpdate = async (patch: MedicalAssessmentPatch, action: string, permission: PermissionAction) => {
    if (!selected) return;
    await updateRecord(selected.id, patch, action, permission);
    const outcome = patch.fitnessOutcome;
    if (!outcome || outcome === 'not_recorded') return;
    const findings = patch.findings ?? selected.findings;
    const restrictions = patch.restrictions ?? selected.restrictions;
    const medicalPatch = {
      result: MEDICAL_RESULT_FOR_OUTCOME[outcome],
      status: 'Completed' as const,
      notes: `Findings: ${findings || 'None recorded'}. Restrictions: ${restrictions || 'None recorded'}.`,
    };
    if (isDemoMode) {
      saveDemoMedicalOverride(selected.medicalId, medicalPatch);
    } else {
      await updateMedical(selected.medicalId, medicalPatch);
    }
  };

  const modeBanner = isDemoMode
    ? 'Demo Mode: simulated records held in this browser session. Nothing is saved to the live database. Recorded outcomes update the linked Medical record in this session only.'
    : 'Live: recording an approved outcome also updates the linked Medical record.';

  const currentStepId = selected ? getMedicalAssessmentStepId(selected) : null;
  const currentIndex = MEDICAL_ASSESSMENT_STEPS.findIndex((s) => s.id === currentStepId);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-display font-bold text-ink-900 flex items-center gap-2"><ClipboardCheck size={24} className="text-brand-600" /> Medical Assessments</h1>
        <p className="text-sm text-ink-600 mt-1">Pre-employment, periodic and transfer assessments linked to an approved onboarding work order and the employee's existing medical record.</p>
        <p className="text-xs text-ink-500 mt-2 bg-ink-50 rounded-lg p-3">{modeBanner}</p>
        <p className="text-xs text-ink-500 mt-2">{MEDICAL_ASSESSMENT_NOTICE}</p>
      </div>

      {error && <p className="text-sm text-red-700 bg-red-50 rounded-lg p-3">{error}</p>}

      {!selected && (
        <>
          {canManage && (
            <div className="card p-4 space-y-3">
              <h2 className="font-display font-bold text-ink-900">Start an assessment</h2>
              <p className="text-sm text-ink-600">Choose the employee, the approved work order and the existing medical record. Medical records are created in Medicals, not here.</p>
              <div className="grid gap-2 sm:grid-cols-2">
                <select className="input" value={employeeId} onChange={(e) => { setEmployeeId(e.target.value); setMedicalId(''); setOnboardingCaseId(''); setCaseId(''); }}>
                  <option value="">Select employee</option>
                  {employees.map((e) => <option key={e.id} value={e.id}>{e.name} ({e.companyName})</option>)}
                </select>
                <select className="input" value={assessmentType} onChange={(e) => setAssessmentType(e.target.value as MedicalAssessmentType)}>
                  {ASSESSMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                <select className="input" disabled={!chosenEmployee} value={onboardingCaseId} onChange={(e) => setOnboardingCaseId(e.target.value)}>
                  <option value="">{approvedWorkOrders.length > 0 ? 'Select approved work order' : 'No approved work order for this company'}</option>
                  {approvedWorkOrders.map((c) => <option key={c.id} value={c.id}>{c.data.workOrderNumber || 'Work order'} · {c.companyName}</option>)}
                </select>
                <select className="input" disabled={!chosenEmployee} value={medicalId} onChange={(e) => setMedicalId(e.target.value)}>
                  <option value="">{employeeMedicals.length > 0 ? 'Select existing medical record' : 'No medical record for this employee'}</option>
                  {employeeMedicals.map((m) => <option key={m.id} value={m.id}>{m.type} · {m.date || 'no date'} · {m.status}</option>)}
                </select>
                <select className="input sm:col-span-2" disabled={!chosenEmployee} value={caseId} onChange={(e) => setCaseId(e.target.value)}>
                  <option value="">{employeeCases.length > 0 ? 'Link to a medical case (optional)' : 'No medical case available to link'}</option>
                  {employeeCases.map((c) => <option key={c.id} value={c.id}>{c.caseReference} · {c.title}</option>)}
                </select>
              </div>
              {chosenEmployee && !chosenWorkOrder && <p className="text-xs text-ink-500">An assessment needs an approved onboarding work order. Approve one in Onboarding first.</p>}
              {chosenEmployee && !chosenMedical && <p className="text-xs text-ink-500">Create the medical record in Medicals first, then link it here.</p>}
              <button className="btn-primary" disabled={!canCreate} onClick={handleCreate}><Plus size={16} /> Start assessment</button>
              {createError && <p className="text-sm text-red-700">{createError}</p>}
            </div>
          )}

          {records.length === 0 && (
            <div className="card p-6 text-sm text-ink-600">No medical assessments are recorded yet.</div>
          )}

          <ul className="space-y-2">
            {records.map((r) => (
              <li key={r.id}>
                <button onClick={() => setSelectedId(r.id)} className="card w-full text-left p-4 hover:shadow-md transition-shadow flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span>
                    <span className="block font-medium text-ink-900">{r.employeeName} · {r.assessmentType}</span>
                    <span className="block text-xs text-ink-500">{r.companyName} · Medical record {r.medicalRecordType}</span>
                  </span>
                  <span className="text-sm text-ink-700">{getMedicalAssessmentStatusLabel(r)}</span>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      {selected && (
        <div className="space-y-6">
          <button className="btn-secondary" onClick={() => setSelectedId(null)}><ArrowLeft size={16} /> All assessments</button>
          <div className="card p-4">
            <h2 className="font-display font-bold text-ink-900">{selected.employeeName} · {selected.assessmentType}</h2>
            <p className="text-sm text-ink-600">{selected.companyName} · Medical record: {selected.medicalRecordType}</p>
            <p className="text-xs text-ink-500 mt-1">Medical case: {selected.caseReference || 'not linked'} · Work order: {selected.workOrderApproved ? 'approved' : 'not approved'}</p>
          </div>
          <MedicalAssessmentStagePanel
            key={`${selected.id}-${currentStepId ?? 'done'}`}
            record={selected}
            canManage={canManage}
            canClinical={canClinical}
            onUpdate={handleUpdate}
          />
          <ol className="card p-4 space-y-2">
            {MEDICAL_ASSESSMENT_STEPS.map((step, index) => {
              const done = currentStepId === null || index < currentIndex;
              const current = index === currentIndex;
              return (
                <li key={step.id} className={`flex items-center gap-2 text-sm ${current ? 'text-ink-900 font-medium' : done ? 'text-ink-600' : 'text-ink-400'}`}>
                  {done ? <CheckCircle2 size={16} className="text-success-600" /> : <Circle size={16} />}
                  <span>{step.title}</span>
                  <span className="ml-auto text-xs text-ink-500">{step.channel}</span>
                </li>
              );
            })}
          </ol>
        </div>
      )}
    </div>
  );
}
