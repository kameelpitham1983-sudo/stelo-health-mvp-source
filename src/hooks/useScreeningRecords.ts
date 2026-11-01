import { useCallback, useEffect, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { isDemoMode } from '@/hooks/useSupabaseData';
import { supabase } from '@/lib/supabase';
import { assertCan, can, type PermissionAction } from '@/lib/permissions';
import {
  createEmptyScreeningRecord,
  type ScreeningAuditEntry,
  type ScreeningRecord,
  type ScreeningType,
} from '@/lib/screeningWorkflow';
import { createDemoScreeningRecords } from '@/data/screeningDemoRecords';

export type ScreeningPatch = Partial<Omit<ScreeningRecord, 'id' | 'mode' | 'auditTrail' | 'createdAt'>>;

export interface NewScreeningInput {
  employeeId: string;
  employeeName: string;
  companyId: string | null;
  companyName: string;
  screeningType: ScreeningType;
}

function transformRecord(row: Record<string, unknown>): ScreeningRecord {
  const stored = (row.record as Partial<ScreeningRecord>) ?? {};
  return {
    ...createEmptyScreeningRecord({
      employeeId: row.employee_id as string,
      employeeName: stored.employeeName ?? '',
      companyId: (row.company_id as string) || null,
      companyName: stored.companyName ?? '',
      screeningType: row.screening_type as ScreeningType,
      mode: 'live',
    }),
    ...stored,
    id: row.id as string,
    employeeId: row.employee_id as string,
    companyId: (row.company_id as string) || null,
    screeningType: row.screening_type as ScreeningType,
    auditTrail: (row.audit_trail as ScreeningAuditEntry[]) ?? [],
    createdAt: (row.created_at as string) || '',
    mode: 'live',
  };
}

export function useScreeningRecords() {
  const { user } = useApp();
  const allowed = can(user, 'screening.view');
  const [records, setRecords] = useState<ScreeningRecord[]>(() => (isDemoMode ? createDemoScreeningRecords() : []));
  const [loading, setLoading] = useState(!isDemoMode);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (isDemoMode || !allowed) return;
    setLoading(true);
    const { data: rows, error: err } = await supabase
      .from('screening_records')
      .select('*')
      .order('created_at', { ascending: false });
    if (err) {
      setError(`Screening records could not be loaded from the live database (${err.message}).`);
    } else {
      setError(null);
      setRecords((rows as Record<string, unknown>[]).map(transformRecord));
    }
    setLoading(false);
  }, [allowed]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const makeAuditEntry = (action: string): ScreeningAuditEntry => ({
    action,
    actorName: user?.name ?? 'Unknown',
    actorRole: user?.role ?? 'unknown',
    at: new Date().toISOString(),
  });

  const createRecord = useCallback(async (input: NewScreeningInput): Promise<void> => {
    assertCan(user, 'screening.manage');
    const base = createEmptyScreeningRecord({ ...input, mode: isDemoMode ? 'demo' : 'live' });
    const record: ScreeningRecord = { ...base, auditTrail: [makeAuditEntry('Screening considered')] };
    if (isDemoMode) {
      setRecords((prev) => [record, ...prev]);
      return;
    }
    const { error: err } = await supabase.from('screening_records').insert({
      id: record.id,
      employee_id: input.employeeId,
      company_id: input.companyId,
      screening_type: input.screeningType,
      record,
      audit_trail: record.auditTrail,
    });
    if (err) throw new Error(err.message);
    await refetch();
  }, [user, refetch]);

  const updateRecord = useCallback(async (
    id: string,
    patch: ScreeningPatch,
    action: string,
    permission: PermissionAction,
  ): Promise<void> => {
    assertCan(user, permission);
    const target = records.find((r) => r.id === id);
    if (!target) throw new Error('This screening record could not be found.');
    const auditTrail = [...target.auditTrail, makeAuditEntry(action)];
    const next: ScreeningRecord = { ...target, ...patch, auditTrail };

    if (isDemoMode) {
      setRecords((prev) => prev.map((r) => (r.id === id ? next : r)));
      return;
    }
    const { error: err } = await supabase
      .from('screening_records')
      .update({ record: next, audit_trail: auditTrail, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (err) throw new Error(err.message);
    await refetch();
  }, [user, records, refetch]);

  return { records: allowed ? records : [], loading, error, createRecord, updateRecord, refetch };
}
