import { useCallback, useEffect, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { isDemoMode } from '@/hooks/useSupabaseData';
import { supabase } from '@/lib/supabase';
import { assertCan, can } from '@/lib/permissions';
import { readDemoState, writeDemoState } from '@/lib/demoStore';
import {
  createEmptyMedicalAssessment,
  getOutcomeGateBlocker,
  type MedicalAssessmentAuditEntry,
  type MedicalAssessmentRecord,
} from '@/lib/medicalAssessmentWorkflow';
import { createDemoMedicalAssessments } from '@/data/medicalAssessmentDemoRecords';

export type MedicalAssessmentPatch = Partial<Omit<MedicalAssessmentRecord, 'id' | 'mode' | 'auditTrail' | 'createdAt'>>;

const CLINICAL_FIELDS: (keyof MedicalAssessmentPatch)[] = [
  'historyReviewed',
  'clinicianName',
  'findings',
  'restrictions',
  'clinicianReviewed',
  'additionalReviewRequired',
  'additionalReviewNote',
  'fitnessOutcome',
];

export type NewMedicalAssessmentInput = Omit<Parameters<typeof createEmptyMedicalAssessment>[0], 'mode'>;

function transformRecord(row: Record<string, unknown>): MedicalAssessmentRecord {
  const stored = (row.record as Partial<MedicalAssessmentRecord>) ?? {};
  return {
    ...createEmptyMedicalAssessment({
      employeeId: row.employee_id as string,
      employeeName: stored.employeeName ?? '',
      companyId: (row.company_id as string) || null,
      companyName: stored.companyName ?? '',
      assessmentType: row.assessment_type as MedicalAssessmentRecord['assessmentType'],
      medicalId: stored.medicalId ?? '',
      medicalRecordType: stored.medicalRecordType ?? '',
      mode: 'live',
    }),
    ...stored,
    id: row.id as string,
    employeeId: row.employee_id as string,
    companyId: (row.company_id as string) || null,
    assessmentType: row.assessment_type as MedicalAssessmentRecord['assessmentType'],
    auditTrail: (row.audit_trail as MedicalAssessmentAuditEntry[]) ?? [],
    createdAt: (row.created_at as string) || '',
    mode: 'live',
  };
}

export function useMedicalAssessments() {
  const { user } = useApp();
  const allowed = can(user, 'medicalAssessment.view');
  const [records, setRecords] = useState<MedicalAssessmentRecord[]>(() =>
    (isDemoMode ? readDemoState('medicalAssessments', createDemoMedicalAssessments) : []));
  const [loading, setLoading] = useState(!isDemoMode);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isDemoMode) writeDemoState('medicalAssessments', records);
  }, [records]);

  const refetch = useCallback(async () => {
    if (isDemoMode || !allowed) return;
    setLoading(true);
    const { data: rows, error: err } = await supabase
      .from('medical_assessments')
      .select('*')
      .order('created_at', { ascending: false });
    if (err) {
      setError(`Medical assessments could not be loaded from the live database (${err.message}).`);
    } else {
      setError(null);
      setRecords((rows as Record<string, unknown>[]).map(transformRecord));
    }
    setLoading(false);
  }, [allowed]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const makeAuditEntry = (action: string): MedicalAssessmentAuditEntry => ({
    action,
    actorName: user?.name ?? 'Unknown',
    actorRole: user?.role ?? 'unknown',
    at: new Date().toISOString(),
  });

  const createRecord = useCallback(async (input: NewMedicalAssessmentInput): Promise<void> => {
    assertCan(user, 'medicalAssessment.manage');
    const base = createEmptyMedicalAssessment({ ...input, mode: isDemoMode ? 'demo' : 'live' });
    const record: MedicalAssessmentRecord = { ...base, auditTrail: [makeAuditEntry('Medical assessment created')] };
    if (isDemoMode) {
      setRecords((prev) => [record, ...prev]);
      return;
    }
    const { error: err } = await supabase.from('medical_assessments').insert({
      id: record.id,
      employee_id: input.employeeId,
      company_id: input.companyId,
      assessment_type: input.assessmentType,
      record,
      audit_trail: record.auditTrail,
    });
    if (err) throw new Error(err.message);
    await refetch();
  }, [user, refetch]);

  const updateRecord = useCallback(async (
    id: string,
    patch: MedicalAssessmentPatch,
    action: string,
  ): Promise<void> => {
    const touchesClinical = (Object.keys(patch) as (keyof MedicalAssessmentPatch)[]).some((key) => CLINICAL_FIELDS.includes(key));
    assertCan(user, touchesClinical ? 'medicalAssessment.outcome' : 'medicalAssessment.manage');
    const target = records.find((r) => r.id === id);
    if (!target) throw new Error('This medical assessment could not be found.');
    if (touchesClinical && target.fitnessOutcome !== 'not_recorded') {
      throw new Error('The clinical record is locked because an outcome has already been recorded.');
    }
    const next = { ...target, ...patch };
    if (patch.fitnessOutcome && patch.fitnessOutcome !== 'not_recorded') {
      const blocker = getOutcomeGateBlocker(next);
      if (blocker) throw new Error(blocker);
    }
    const auditTrail = [...target.auditTrail, makeAuditEntry(action)];
    const updated: MedicalAssessmentRecord = { ...next, auditTrail };

    if (isDemoMode) {
      setRecords((prev) => prev.map((r) => (r.id === id ? updated : r)));
      return;
    }
    const { error: err } = await supabase
      .from('medical_assessments')
      .update({ record: updated, audit_trail: auditTrail, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (err) throw new Error(err.message);
    await refetch();
  }, [user, records, refetch]);

  return { records: allowed ? records : [], loading, error, createRecord, updateRecord, refetch };
}
