import { useCallback, useEffect, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { isDemoMode } from '@/hooks/useSupabaseData';
import { supabase } from '@/lib/supabase';
import { readDemoState, writeDemoState } from '@/lib/demoStore';
import { assertCan, type PermissionAction } from '@/lib/permissions';
import {
  createEmptyOnboardingData,
  type OnboardingAuditEntry,
  type OnboardingCase,
  type OnboardingData,
  type OnboardingPatch,
} from '@/lib/onboardingStages';

function transformCase(row: Record<string, unknown>): OnboardingCase {
  return {
    id: row.id as string,
    companyId: (row.company_id as string) || null,
    companyName: (row.company_name as string) || '',
    status: (row.status as OnboardingCase['status']) || 'open',
    closedReason: (row.closed_reason as string) || '',
    data: { ...createEmptyOnboardingData(), ...((row.data as Partial<OnboardingData>) ?? {}) },
    auditTrail: (row.audit_trail as OnboardingAuditEntry[]) ?? [],
    createdAt: (row.created_at as string) || '',
    mode: 'live',
  };
}

export function useOnboardingCases() {
  const { user } = useApp();
  const [cases, setCases] = useState<OnboardingCase[]>(() => readDemoState<OnboardingCase[]>('onboarding', () => []));

  useEffect(() => {
    if (isDemoMode) writeDemoState('onboarding', cases);
  }, [cases]);

  const [loading, setLoading] = useState(!isDemoMode);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (isDemoMode) return;
    setLoading(true);
    const { data: rows, error: err } = await supabase
      .from('onboarding_cases')
      .select('*')
      .order('created_at', { ascending: false });
    if (err) {
      setError(`Onboarding records could not be loaded from the live database (${err.message}).`);
    } else {
      setError(null);
      setCases((rows as Record<string, unknown>[]).map(transformCase));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const makeAuditEntry = (action: string): OnboardingAuditEntry => ({
    action,
    actorName: user?.name ?? 'Unknown',
    actorRole: user?.role ?? 'unknown',
    at: new Date().toISOString(),
  });

  const createCase = useCallback(async (companyName: string): Promise<void> => {
    assertCan(user, 'onboarding.client_hr');
    const entry = makeAuditEntry('Onboarding process initiated');
    const data = createEmptyOnboardingData();
    if (isDemoMode) {
      const newCase: OnboardingCase = {
        id: crypto.randomUUID(),
        companyId: user?.companyId ?? null,
        companyName,
        status: 'open',
        closedReason: '',
        data,
        auditTrail: [entry],
        createdAt: new Date().toISOString(),
        mode: 'demo',
      };
      setCases((prev) => [newCase, ...prev]);
      return;
    }
    const { error: err } = await supabase.from('onboarding_cases').insert({
      company_id: user?.companyId ?? null,
      company_name: companyName,
      status: 'open',
      data,
      audit_trail: [entry],
    });
    if (err) throw new Error(err.message);
    await refetch();
  }, [user, refetch]);

  const updateCase = useCallback(async (
    id: string,
    patch: OnboardingPatch,
    action: string,
    permission: PermissionAction,
  ): Promise<void> => {
    assertCan(user, permission);
    const target = cases.find((c) => c.id === id);
    if (!target) throw new Error('This onboarding case could not be found.');
    const { status, closedReason, ...dataPatch } = patch;
    const data: OnboardingData = { ...target.data, ...dataPatch };
    const nextStatus = status ?? target.status;
    const nextClosedReason = closedReason ?? target.closedReason;
    const auditTrail = [...target.auditTrail, makeAuditEntry(action)];

    if (isDemoMode) {
      setCases((prev) => prev.map((c) => (c.id === id
        ? { ...c, data, status: nextStatus, closedReason: nextClosedReason, auditTrail }
        : c)));
      return;
    }
    const { error: err } = await supabase
      .from('onboarding_cases')
      .update({
        data,
        status: nextStatus,
        closed_reason: nextClosedReason,
        audit_trail: auditTrail,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);
    if (err) throw new Error(err.message);
    await refetch();
  }, [user, cases, refetch]);

  return { cases, loading, error, createCase, updateCase, refetch };
}
