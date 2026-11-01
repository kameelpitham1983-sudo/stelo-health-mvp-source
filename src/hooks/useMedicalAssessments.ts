import { useCallback, useEffect, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { isDemoMode } from '@/hooks/useSupabaseData';
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

const LIVE_UNAVAILABLE =
  'Live medical assessment storage is not connected yet. It needs database approval before live use. Demo Mode is available.';

export function useMedicalAssessments() {
  const { user } = useApp();
  const allowed = can(user, 'medicalAssessment.view');
  const [records, setRecords] = useState<MedicalAssessmentRecord[]>(() =>
    (isDemoMode ? readDemoState('medicalAssessments', createDemoMedicalAssessments) : []));

  useEffect(() => {
    if (isDemoMode) writeDemoState('medicalAssessments', records);
  }, [records]);

  const error = isDemoMode ? null : LIVE_UNAVAILABLE;

  const makeAuditEntry = (action: string): MedicalAssessmentAuditEntry => ({
    action,
    actorName: user?.name ?? 'Unknown',
    actorRole: user?.role ?? 'unknown',
    at: new Date().toISOString(),
  });

  const createRecord = useCallback(async (input: NewMedicalAssessmentInput): Promise<void> => {
    assertCan(user, 'medicalAssessment.manage');
    if (!isDemoMode) throw new Error(LIVE_UNAVAILABLE);
    const base = createEmptyMedicalAssessment({ ...input, mode: 'demo' });
    const record: MedicalAssessmentRecord = { ...base, auditTrail: [makeAuditEntry('Medical assessment created')] };
    setRecords((prev) => [record, ...prev]);
  }, [user]);

  const updateRecord = useCallback(async (
    id: string,
    patch: MedicalAssessmentPatch,
    action: string,
  ): Promise<void> => {
    const touchesClinical = (Object.keys(patch) as (keyof MedicalAssessmentPatch)[]).some((key) => CLINICAL_FIELDS.includes(key));
    assertCan(user, touchesClinical ? 'medicalAssessment.outcome' : 'medicalAssessment.manage');
    if (!isDemoMode) throw new Error(LIVE_UNAVAILABLE);
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
    setRecords((prev) => prev.map((r) => (r.id === id ? { ...next, auditTrail } : r)));
  }, [user, records]);

  return { records: allowed ? records : [], error, createRecord, updateRecord };
}
