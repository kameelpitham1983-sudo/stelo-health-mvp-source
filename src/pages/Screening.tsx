import { useState } from 'react';
import { ArrowLeft, Plus, HeartPulse } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { can } from '@/lib/permissions';
import { isDemoMode, useCases, useEmployees } from '@/hooks/useSupabaseData';
import { useScreeningRecords, type ScreeningPatch } from '@/hooks/useScreeningRecords';
import { ScreeningDetail } from '@/components/ScreeningDetail';
import { getScreeningStatusLabel, type ScreeningType } from '@/lib/screeningWorkflow';
import type { PermissionAction } from '@/lib/permissions';

export function Screening() {
  const { user } = useApp();
  const { data: employees } = useEmployees();
  const { data: cases } = useCases();
  const { records, loading, error, createRecord, updateRecord } = useScreeningRecords();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [employeeId, setEmployeeId] = useState('');
  const [screeningType, setScreeningType] = useState<ScreeningType>('HPV');
  const [caseId, setCaseId] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const canManage = can(user, 'screening.manage');
  const selected = records.find((r) => r.id === selectedId) ?? null;
  const chosenEmployee = employees.find((e) => e.id === employeeId) ?? null;
  const employeeCases = cases.filter((c) => c.employeeId !== null && c.employeeId === employeeId);
  const chosenCase = employeeCases.find((c) => c.id === caseId) ?? null;

  const handleCreate = async () => {
    if (!chosenEmployee) return;
    setCreating(true);
    setCreateError(null);
    try {
      await createRecord({
        employeeId: chosenEmployee.id,
        employeeName: chosenEmployee.name,
        companyId: chosenEmployee.companyId || null,
        companyName: chosenEmployee.companyName,
        screeningType,
        caseId: chosenCase?.id ?? null,
        caseReference: chosenCase?.caseReference ?? '',
      });
      setEmployeeId('');
      setCaseId('');
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'The screening record could not be created.');
    } finally {
      setCreating(false);
    }
  };

  const handleUpdate = async (patch: ScreeningPatch, action: string, permission: PermissionAction) => {
    if (!selected) return;
    await updateRecord(selected.id, patch, action, permission);
  };

  const modeBanner = isDemoMode
    ? 'Demo Mode: example records only, held in this browser session and never saved to the live database.'
    : 'Live: records save to the STelo Health database. Laboratory and courier steps are recorded manually.';

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-display font-bold text-ink-900 flex items-center gap-2"><HeartPulse size={24} className="text-brand-600" /> HPV and Colorectal Screening</h1>
        <p className="text-sm text-ink-600 mt-1">Screening linked to the employee record. Clinicians decide eligibility and interpret results.</p>
        <p className="text-xs text-ink-500 mt-2 bg-ink-50 rounded-lg p-3">{modeBanner}</p>
      </div>

      {error && <p className="text-sm text-red-700 bg-red-50 rounded-lg p-3">{error}</p>}

      {!selected && (
        <>
          {canManage && (
            <div className="card p-4 space-y-3">
              <h2 className="font-display font-bold text-ink-900">Consider screening for an employee</h2>
              <p className="text-sm text-ink-600">Choose the employee and screening type. The clinician then decides whether to proceed.</p>
              <div className="grid gap-2 sm:grid-cols-[1fr_180px_auto]">
                <select className="input" value={employeeId} onChange={(e) => { setEmployeeId(e.target.value); setCaseId(''); }}>
                  <option value="">Select employee</option>
                  {employees.map((e) => <option key={e.id} value={e.id}>{e.name} ({e.companyName})</option>)}
                </select>
                <select className="input" value={screeningType} onChange={(e) => setScreeningType(e.target.value as ScreeningType)}>
                  <option value="HPV">HPV</option>
                  <option value="Colorectal">Colorectal</option>
                </select>
                <button className="btn-primary" disabled={creating || !chosenEmployee} onClick={handleCreate}><Plus size={16} /> Start</button>
              </div>
              <select className="input w-full" value={caseId} disabled={!chosenEmployee} onChange={(e) => setCaseId(e.target.value)}>
                <option value="">{employeeCases.length > 0 ? 'Link to a medical case (optional)' : 'No medical case available to link'}</option>
                {employeeCases.map((c) => <option key={c.id} value={c.id}>{c.caseReference} · {c.title}</option>)}
              </select>
              {isDemoMode && <p className="text-xs text-ink-500">Demo Mode has no live medical cases, so screenings created here cannot be linked to one.</p>}
              {createError && <p className="text-sm text-red-700">{createError}</p>}
            </div>
          )}

          {loading && <p className="text-sm text-ink-500">Loading screening records...</p>}

          {!loading && records.length === 0 && (
            <div className="card p-6 text-sm text-ink-600">
              {error ? 'Screening records are not available. Nothing has been changed.' : 'No screening records are visible to your role.'}
            </div>
          )}

          <ul className="space-y-2">
            {records.map((r) => (
              <li key={r.id}>
                <button onClick={() => setSelectedId(r.id)} className="card w-full text-left p-4 hover:shadow-md transition-shadow flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span>
                    <span className="block font-medium text-ink-900">{r.employeeName} · {r.screeningType}</span>
                    <span className="block text-xs text-ink-500">{r.companyName}{r.caseReference ? ` · Case ${r.caseReference}` : ' · No medical case linked'}</span>
                  </span>
                  <span className="text-sm text-ink-700">{getScreeningStatusLabel(r)}</span>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      {selected && (
        <div className="space-y-6">
          <button className="btn-secondary" onClick={() => setSelectedId(null)}><ArrowLeft size={16} /> All screenings</button>
          <ScreeningDetail key={selected.id} record={selected} onUpdate={handleUpdate} />
        </div>
      )}
    </div>
  );
}
