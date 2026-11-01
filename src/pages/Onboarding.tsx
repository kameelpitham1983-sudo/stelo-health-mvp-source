import { useState } from 'react';
import { ArrowLeft, Plus, UserPlus, CheckCircle2, Circle, Lock } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { can } from '@/lib/permissions';
import { isDemoMode } from '@/hooks/useSupabaseData';
import { useOnboardingCases } from '@/hooks/useOnboardingCases';
import { OnboardingStagePanel } from '@/components/OnboardingStagePanel';
import { DemoNotice } from '@/components/DemoNotice';
import {
  ONBOARDING_STAGES,
  getActiveStageId,
  type OnboardingCase,
  type OnboardingPatch,
  type OnboardingStageDefinition,
} from '@/lib/onboardingStages';

type StageView = 'done' | 'active' | 'upcoming' | 'not_applicable' | 'not_reached';

function stageView(c: OnboardingCase, stage: OnboardingStageDefinition, activeId: number | null): StageView {
  if (!stage.isApplicable(c)) return 'not_applicable';
  if (stage.isDone(c)) return 'done';
  if (stage.id === activeId) return 'active';
  return c.status === 'open' ? 'upcoming' : 'not_reached';
}

const statusLabel: Record<OnboardingCase['status'], string> = {
  open: 'In progress',
  closed: 'Closed',
  case_opened: 'Employee case opened',
};

export function Onboarding() {
  const { user } = useApp();
  const { cases, loading, error, createCase, updateCase } = useOnboardingCases();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const canStart = can(user, 'onboarding.client_hr');
  const visibleCases = user?.role === 'employer'
    ? cases.filter((c) => c.companyId === user.companyId)
    : cases;
  const selected = visibleCases.find((c) => c.id === selectedId) ?? null;
  const activeId = selected ? getActiveStageId(selected) : null;
  const activeStage = ONBOARDING_STAGES.find((s) => s.id === activeId) ?? null;

  const handleCreate = async () => {
    setCreating(true);
    setCreateError(null);
    try {
      await createCase(companyName.trim());
      setCompanyName('');
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'The case could not be created.');
    } finally {
      setCreating(false);
    }
  };

  const handleUpdate = async (patch: OnboardingPatch, action: string, stage: OnboardingStageDefinition) => {
    if (!selected) return;
    await updateCase(selected.id, patch, action, stage.permission);
  };

  const modeBanner = isDemoMode
    ? 'Demo Mode: records exist only in this browser session and are never saved to the live database. Simulated steps are labelled.'
    : 'Live: records save to the STelo Health database. Steps marked manual or not connected happen outside the app.';

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-display font-bold text-ink-900">Onboarding</h1>
        <p className="text-sm text-ink-600 mt-1">Occupational and travel medical onboarding, from client consent to an opened employee case.</p>
        <p className="text-xs text-ink-500 mt-2 bg-ink-50 rounded-lg p-3">{modeBanner}</p>
      </div>

      <DemoNotice steps={[
        'Start a case by entering the client company name, then work through the 13 stages in order.',
        'Responsible role: Admin or Coordinator runs the stages. Client HR and employees complete their own steps.',
        'Next step: open the case and complete the current stage. Stages marked manual happen outside the app.',
      ]} />

      {error && <p className="text-sm text-red-700 bg-red-50 rounded-lg p-3">{error}</p>}

      {!selected && (
        <>
          {canStart && (
            <div className="card p-4 space-y-3">
              <h2 className="font-display font-bold text-ink-900 flex items-center gap-2"><UserPlus size={18} className="text-brand-600" /> Start an onboarding process</h2>
              <p className="text-sm text-ink-600">Enter the client company name. The first step is identity verification for the employee.</p>
              <div className="flex flex-col sm:flex-row gap-2">
                <input className="input flex-1" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Client company name" />
                <button className="btn-primary" disabled={creating || companyName.trim() === ''} onClick={handleCreate}><Plus size={16} /> Start process</button>
              </div>
              {createError && <p className="text-sm text-red-700">{createError}</p>}
            </div>
          )}

          {loading && <p className="text-sm text-ink-500">Loading onboarding records...</p>}

          {!loading && visibleCases.length === 0 && (
            <div className="card p-6 text-sm text-ink-600">
              {error
                ? 'The onboarding records are not available. Nothing has been saved or changed.'
                : canStart
                  ? 'No onboarding processes yet. Start one above.'
                  : 'No onboarding processes are visible to your role.'}
            </div>
          )}

          <ul className="space-y-2">
            {visibleCases.map((c) => {
              const step = getActiveStageId(c);
              const current = ONBOARDING_STAGES.find((s) => s.id === step);
              return (
                <li key={c.id}>
                  <button onClick={() => setSelectedId(c.id)} className="card w-full text-left p-4 hover:shadow-md transition-shadow flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span>
                      <span className="block font-medium text-ink-900">{c.companyName}</span>
                      <span className="block text-xs text-ink-500">{statusLabel[c.status]}{current ? ` · Next: ${current.title}` : ''}</span>
                    </span>
                    <span className="text-xs text-ink-400">{c.mode === 'demo' ? 'Demo record' : 'Live record'}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}

      {selected && (
        <div className="space-y-6">
          <button className="btn-secondary" onClick={() => setSelectedId(null)}><ArrowLeft size={16} /> All processes</button>
          <div className="card p-4">
            <h2 className="font-display font-bold text-ink-900">{selected.companyName}</h2>
            <p className="text-sm text-ink-600">{statusLabel[selected.status]}{selected.closedReason ? ` · ${selected.closedReason}` : ''}</p>
          </div>

          <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
            <ol className="card p-4 space-y-2 h-fit">
              {ONBOARDING_STAGES.map((stage) => {
                const view = stageView(selected, stage, activeId);
                return (
                  <li key={stage.id} className={`flex items-start gap-2 text-sm rounded-lg p-2 ${view === 'active' ? 'bg-brand-50 text-ink-900' : 'text-ink-600'}`}>
                    {view === 'done' ? <CheckCircle2 size={16} className="text-green-600 mt-0.5 shrink-0" /> : view === 'not_applicable' ? <Lock size={14} className="text-ink-400 mt-0.5 shrink-0" /> : <Circle size={16} className="text-ink-300 mt-0.5 shrink-0" />}
                    <span>
                      <span className="block">{stage.id}. {stage.title}</span>
                      <span className="block text-xs text-ink-500">
                        {view === 'done' ? 'Done' : view === 'active' ? 'Current step' : view === 'not_applicable' ? 'Not required for this case' : view === 'not_reached' ? 'Not reached' : 'Waiting'}
                      </span>
                    </span>
                  </li>
                );
              })}
            </ol>

            <div className="card p-4 sm:p-6 space-y-6">
              {activeStage ? (
                <OnboardingStagePanel key={`${selected.id}-${activeStage.id}`} caseItem={selected} stage={activeStage} onUpdate={handleUpdate} />
              ) : (
                <p className="text-sm text-ink-600">
                  {selected.status === 'open'
                    ? 'All steps are complete. Open the employee case when ready.'
                    : 'This process is closed. No further steps are required.'}
                </p>
              )}
            </div>
          </div>

          <div className="card p-4">
            <h3 className="font-display font-bold text-ink-900 mb-3">Audit trail</h3>
            {selected.auditTrail.length === 0 ? (
              <p className="text-sm text-ink-500">No actions recorded yet.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {[...selected.auditTrail].reverse().map((entry, i) => (
                  <li key={`${entry.at}-${i}`} className="text-ink-600">
                    <span className="font-medium text-ink-800">{entry.action}</span> by {entry.actorName} ({entry.actorRole}) at {new Date(entry.at).toLocaleString()}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
