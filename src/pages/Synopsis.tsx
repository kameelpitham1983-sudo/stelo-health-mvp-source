import { useState } from 'react';
import {
  ClipboardList,
  Users,
  Sparkles,
  Save,
  Edit3,
  Monitor,
  ArrowLeft,
  Plus,
  Check,
  AlertCircle,
  StickyNote,
  CheckSquare,
  Square,
  Info,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import {
  useEmployees,
  useMedicals,
  useSynopses,
  useSynopsisNotes,
  useSynopsisFollowUps,
} from '@/hooks/useSupabaseData';
import { Badge } from '@/components/Badge';
import type { Employee, Synopsis as SynopsisType } from '@/types';

const suggestedPrompts = [
  'Summarise this patient\'s relevant medical history for today\'s meeting.',
  'Prepare a concise overview of the current case, outstanding investigations, and follow-up requirements.',
  'Summarise the sickness absence timeline and return-to-work considerations.',
  'List outstanding documents, appointments, and actions.',
  'Prepare a neutral case summary for a multidisciplinary discussion.',
  'Highlight missing information that needs to be confirmed.',
];

function buildDraftSynopsis(employee: Employee, prompt: string, medicals: { employeeName: string; type: string; status: string; date: string; result: string; providerName: string; notes: string }[]): string {
  const empMedicals = medicals.filter((m) => m.employeeName === employee.name);
  const completedMedicals = empMedicals.filter((m) => m.status === 'Completed');
  const pendingMedicals = empMedicals.filter((m) => m.status === 'Scheduled' || m.status === 'Overdue' || m.status === 'In Progress');

  const lines: string[] = [];
  lines.push(`# Synopsis — ${employee.name}`);
  lines.push('');
  lines.push(`**Employee:** ${employee.name}`);
  lines.push(`**Job Title:** ${employee.jobTitle}`);
  lines.push(`**Company:** ${employee.companyName}`);
  lines.push(`**Department:** ${employee.department}`);
  lines.push(`**Health Status:** ${employee.healthStatus}`);
  lines.push(`**Employment Status:** ${employee.status}`);
  lines.push('');
  lines.push(`**Reason for Review:** ${prompt}`);
  lines.push('');
  lines.push('## Relevant Background and History');
  if (completedMedicals.length > 0) {
    lines.push('- Last assessment date: ' + (employee.lastMedicalDate || 'Not recorded'));
    lines.push('- Next assessment due: ' + (employee.nextMedicalDue || 'Not scheduled'));
    lines.push('');
    lines.push('### Completed Assessments');
    completedMedicals.forEach((m) => {
      lines.push(`- ${m.type} (${m.date}) — ${m.result}. Provider: ${m.providerName}.`);
    });
  } else {
    lines.push('- No completed assessments on record for this employee.');
    lines.push('- [Missing information: assessment history to be confirmed.]');
  }
  lines.push('');
  lines.push('## Current Case Status');
  lines.push(`- Current health status: ${employee.healthStatus}`);
  if (employee.status === 'On Leave') {
    lines.push('- Employee currently on leave.');
  }
  lines.push('');
  lines.push('## Outstanding Assessments');
  if (pendingMedicals.length > 0) {
    pendingMedicals.forEach((m) => {
      lines.push(`- ${m.type} — Status: ${m.status}, Date: ${m.date || 'TBD'}.`);
    });
  } else {
    lines.push('- No outstanding assessments recorded.');
  }
  lines.push('');
  lines.push('## Fitness Restrictions or Accommodations');
  if (employee.healthStatus === 'Fit with Restrictions') {
    lines.push('- Restrictions documented. Details to be confirmed by authorised clinician.');
  } else if (employee.healthStatus === 'Unfit') {
    lines.push('- Currently classified as unfit. Clinical review required.');
  } else {
    lines.push('- No restrictions or accommodations currently documented.');
  }
  lines.push('');
  lines.push('## Follow-up Requirements');
  lines.push('- Next medical assessment due: ' + (employee.nextMedicalDue || 'To be scheduled'));
  if (employee.travelReady) {
    lines.push('- Travel readiness: cleared.');
  } else {
    lines.push('- Travel readiness: not cleared.');
  }
  lines.push('');
  lines.push('## Questions and Actions for the Meeting');
  lines.push('- [To be completed during the meeting.]');
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('**IMPORTANT:** This synopsis was auto-generated from available records. It is a DRAFT pending clinical review. No clinical findings have been invented. Missing or unverified information is labelled as such. An authorised clinician must review and approve before this is treated as a clinical record.');

  return lines.join('\n');
}

export function Synopsis() {
  const { user } = useApp();
  const { data: employees, loading: empLoading, error: empError } = useEmployees();
  const { data: medicals } = useMedicals();
  const { data: synopses, loading: synLoading, error: synError, addSynopsis, updateSynopsis } = useSynopses();

  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [prompt, setPrompt] = useState('');
  const [draft, setDraft] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [currentSynopsis, setCurrentSynopsis] = useState<SynopsisType | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  const { data: notes, addNote } = useSynopsisNotes(currentSynopsis?.id ?? null);
  const { data: followUps, addFollowUp, toggleFollowUp } = useSynopsisFollowUps(currentSynopsis?.id ?? null);

  const [noteText, setNoteText] = useState('');
  const [fuAction, setFuAction] = useState('');
  const [fuPerson, setFuPerson] = useState('');
  const [fuDue, setFuDue] = useState('');

  const showNotice = (msg: string) => {
    setSavedNotice(msg);
    setTimeout(() => setSavedNotice(null), 2500);
  };

  const handleGenerate = () => {
    if (!selectedEmployee || !prompt.trim()) return;
    const content = buildDraftSynopsis(selectedEmployee, prompt.trim(), medicals);
    setDraft(content);
    setIsEditing(false);
    setCurrentSynopsis(null);
  };

  const handleSaveDraft = async () => {
    if (!selectedEmployee || !draft) return;
    setActionError(null);
    setSubmitting(true);
    try {
      const created = await addSynopsis({
        employeeName: selectedEmployee.name,
        employeeId: selectedEmployee.id,
        prompt,
        content: draft,
        status: 'Draft',
        createdBy: user?.name || 'Unknown',
      });
      setCurrentSynopsis(created);
      showNotice('Draft saved.');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to save draft');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveSynopsis = async () => {
    if (!currentSynopsis) return;
    setActionError(null);
    setSubmitting(true);
    try {
      await updateSynopsis(currentSynopsis.id, { content: draft, status: 'Saved' });
      setCurrentSynopsis({ ...currentSynopsis, content: draft, status: 'Saved' });
      showNotice('Synopsis saved as a clinical record.');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to save synopsis');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDisplay = async () => {
    if (!currentSynopsis) return;
    setActionError(null);
    setSubmitting(true);
    try {
      await updateSynopsis(currentSynopsis.id, { status: 'Displayed' });
      setCurrentSynopsis({ ...currentSynopsis, status: 'Displayed' });
      showNotice('Synopsis displayed for meeting.');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to update synopsis');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddNote = async () => {
    if (!noteText.trim() || !currentSynopsis) return;
    try {
      await addNote(noteText.trim(), user?.name || 'Unknown');
      setNoteText('');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to add note');
    }
  };

  const handleAddFollowUp = async () => {
    if (!fuAction.trim() || !currentSynopsis) return;
    try {
      await addFollowUp(fuAction.trim(), fuPerson.trim(), fuDue || null);
      setFuAction('');
      setFuPerson('');
      setFuDue('');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to add follow-up');
    }
  };

  const openExisting = (syn: SynopsisType) => {
    setSelectedEmployee(employees.find((e) => e.id === syn.employeeId) || null);
    setPrompt(syn.prompt);
    setDraft(syn.content);
    setCurrentSynopsis(syn);
    setIsEditing(false);
  };

  const reset = () => {
    setSelectedEmployee(null);
    setPrompt('');
    setDraft('');
    setCurrentSynopsis(null);
    setIsEditing(false);
  };

  if (empLoading || synLoading) {
    return <div className="flex items-center justify-center py-20"><span className="w-6 h-6 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin" /></div>;
  }

  if (empError || synError) {
    return <div className="card p-6 text-center"><AlertCircle size={24} className="text-danger-500 mx-auto mb-2" /><p className="text-sm text-ink-600">Failed to load data: {empError || synError}</p></div>;
  }

  // --- Meeting display mode ---
  if (currentSynopsis && currentSynopsis.status === 'Displayed') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <button onClick={() => updateSynopsis(currentSynopsis.id, { status: 'Saved' }).then(() => { setCurrentSynopsis({ ...currentSynopsis, status: 'Saved' }); })} className="btn-secondary">
            <ArrowLeft size={16} />
            Exit Display
          </button>
          <Badge color="brand" dot>Meeting Display</Badge>
        </div>

        <div className="card p-8 lg:p-10 min-h-[60vh]">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-6 pb-6 border-b border-ink-100">
              <div className="h-12 w-12 rounded-xl bg-brand-50 flex items-center justify-center">
                <ClipboardList size={24} className="text-brand-600" />
              </div>
              <div>
                <h2 className="text-xl font-display font-bold text-ink-900">Synopsis — {currentSynopsis.employeeName}</h2>
                <p className="text-xs text-ink-400">{new Date(currentSynopsis.createdAt).toLocaleString()}</p>
              </div>
            </div>
            <div className="prose prose-sm max-w-none">
              <pre className="whitespace-pre-wrap text-sm text-ink-700 font-sans leading-relaxed">{currentSynopsis.content}</pre>
            </div>
          </div>
        </div>

        {/* Meeting notes live entry */}
        <div className="card p-5">
          <h3 className="font-display font-bold text-ink-900 mb-3 flex items-center gap-2"><StickyNote size={16} /> Meeting Notes</h3>
          <div className="flex gap-2 mb-4">
            <input className="input flex-1" value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="Add a meeting note..." onKeyDown={(e) => e.key === 'Enter' && handleAddNote()} />
            <button onClick={handleAddNote} className="btn-primary"><Plus size={16} /> Add</button>
          </div>
          <div className="space-y-2">
            {notes.map((n) => (
              <div key={n.id} className="p-3 bg-ink-50 rounded-lg">
                <p className="text-sm text-ink-700">{n.note}</p>
                <p className="text-xs text-ink-400 mt-1">{n.createdBy} — {new Date(n.createdAt).toLocaleTimeString()}</p>
              </div>
            ))}
            {notes.length === 0 && <p className="text-sm text-ink-400">No notes recorded yet.</p>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-display font-bold text-ink-900">Synopsis</h2>
          <p className="text-sm text-ink-500">Morning medical-meeting briefing workspace</p>
        </div>
        {currentSynopsis && (
          <button onClick={reset} className="btn-secondary">
            <Plus size={16} />
            New Synopsis
          </button>
        )}
      </div>

      {/* AI limitation notice */}
      <div className="card p-4 border-brand-200 bg-gradient-to-br from-brand-50/50 to-white">
        <div className="flex items-start gap-3">
          <Info size={18} className="text-brand-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-ink-800">Draft preparation mode</p>
            <p className="text-xs text-ink-600 mt-0.5">No external AI service is connected. Synopses are auto-structured from available employee and medical records. All drafts require review by an authorised clinician before being treated as a clinical record. Missing information is clearly labelled — no clinical facts are invented.</p>
          </div>
        </div>
      </div>

      {savedNotice && (
        <div className="p-3 bg-success-50 text-success-700 text-sm rounded-lg flex items-center gap-2"><Check size={16} /> {savedNotice}</div>
      )}
      {actionError && (
        <div className="p-3 bg-danger-50 text-danger-700 text-sm rounded-lg flex items-center gap-2"><AlertCircle size={16} /> {actionError}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: workspace */}
        <div className="lg:col-span-2 space-y-4">
          {/* Step 1: Select employee */}
          <div className="card p-5">
            <h3 className="font-display font-bold text-ink-900 mb-3 flex items-center gap-2"><Users size={18} className="text-brand-600" /> Select Employee / Patient</h3>
            <select
              className="input w-full"
              value={selectedEmployee?.id || ''}
              onChange={(e) => {
                const emp = employees.find((x) => x.id === e.target.value);
                setSelectedEmployee(emp || null);
                setDraft('');
                setCurrentSynopsis(null);
              }}
            >
              <option value="">Choose an employee...</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>{e.name} — {e.companyName}</option>
              ))}
            </select>
            {selectedEmployee && (
              <div className="mt-3 p-3 bg-ink-50 rounded-lg space-y-1">
                <p className="text-sm font-semibold text-ink-900">{selectedEmployee.name}</p>
                <p className="text-xs text-ink-500">{selectedEmployee.jobTitle} · {selectedEmployee.department}</p>
                <p className="text-xs text-ink-500">{selectedEmployee.companyName}</p>
                <div className="flex gap-2 mt-2">
                  <Badge color={selectedEmployee.healthStatus === 'Fit' ? 'success' : selectedEmployee.healthStatus === 'Fit with Restrictions' ? 'warning' : selectedEmployee.healthStatus === 'Unfit' ? 'danger' : 'brand'}>
                    {selectedEmployee.healthStatus}
                  </Badge>
                  <Badge color={selectedEmployee.status === 'Active' ? 'success' : 'warning'} dot>{selectedEmployee.status}</Badge>
                </div>
              </div>
            )}
          </div>

          {/* Step 2: Prompt */}
          <div className="card p-5">
            <h3 className="font-display font-bold text-ink-900 mb-3 flex items-center gap-2"><Sparkles size={18} className="text-brand-600" /> Review Prompt</h3>
            <textarea
              className="input w-full min-h-[80px] resize-y"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Enter what you want summarised or discussed..."
            />
            <p className="text-xs font-semibold text-ink-500 mt-3 mb-2">Suggested prompts:</p>
            <div className="flex flex-wrap gap-2">
              {suggestedPrompts.map((sp) => (
                <button
                  key={sp}
                  onClick={() => setPrompt(sp)}
                  className="text-xs px-3 py-1.5 bg-ink-50 hover:bg-brand-50 text-ink-600 hover:text-brand-700 rounded-lg transition-colors border border-ink-200 hover:border-brand-300"
                >
                  {sp}
                </button>
              ))}
            </div>
            <button
              onClick={handleGenerate}
              disabled={!selectedEmployee || !prompt.trim()}
              className="btn-primary mt-4"
            >
              <Sparkles size={16} />
              Generate Draft Synopsis
            </button>
          </div>

          {/* Step 3: Draft */}
          {draft && (
            <div className="card p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-display font-bold text-ink-900 flex items-center gap-2"><ClipboardList size={18} className="text-brand-600" /> Draft Synopsis</h3>
                <div className="flex gap-2">
                  {currentSynopsis && (
                    <Badge color={currentSynopsis.status === 'Draft' ? 'warning' : 'success'} dot>
                      {currentSynopsis.status}
                    </Badge>
                  )}
                  {!isEditing ? (
                    <button onClick={() => setIsEditing(true)} className="btn-secondary text-sm py-1.5"><Edit3 size={14} /> Edit</button>
                  ) : (
                    <button onClick={() => setIsEditing(false)} className="btn-secondary text-sm py-1.5"><Check size={14} /> Done</button>
                  )}
                </div>
              </div>

              {isEditing ? (
                <textarea
                  className="input w-full min-h-[400px] resize-y font-mono text-sm"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                />
              ) : (
                <div className="p-4 bg-ink-50 rounded-lg max-h-[500px] overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-sm text-ink-700 font-sans leading-relaxed">{draft}</pre>
                </div>
              )}

              <div className="flex flex-wrap gap-2 mt-4">
                {!currentSynopsis && (
                  <button onClick={handleSaveDraft} disabled={submitting} className="btn-secondary">
                    {submitting ? <span className="w-4 h-4 border-2 border-ink-200 border-t-ink-600 rounded-full animate-spin" /> : <><Save size={16} /> Save as Draft</>}
                  </button>
                )}
                {currentSynopsis && currentSynopsis.status === 'Draft' && (
                  <>
                    <button onClick={handleSaveSynopsis} disabled={submitting} className="btn-primary">
                      {submitting ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Check size={16} /> Save Synopsis</>}
                    </button>
                    <button onClick={handleDisplay} disabled={submitting} className="btn-secondary">
                      <Monitor size={16} /> Display for Meeting
                    </button>
                  </>
                )}
                {currentSynopsis && currentSynopsis.status === 'Saved' && (
                  <button onClick={handleDisplay} disabled={submitting} className="btn-primary">
                    <Monitor size={16} /> Display for Meeting
                  </button>
                )}
              </div>

              {currentSynopsis && (
                <p className="text-xs text-ink-400 mt-3">
                  {currentSynopsis.status === 'Draft' && 'This is a draft. It must be reviewed and saved before it becomes a clinical record.'}
                  {currentSynopsis.status === 'Saved' && 'This synopsis has been saved as a clinical record. It can be displayed during a meeting.'}
                </p>
              )}
            </div>
          )}

          {/* Step 4: Meeting notes and follow-ups (only after saving) */}
          {currentSynopsis && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="card p-5">
                <h3 className="font-display font-bold text-ink-900 mb-3 flex items-center gap-2"><StickyNote size={16} /> Meeting Notes</h3>
                <div className="flex gap-2 mb-3">
                  <input className="input flex-1 text-sm" value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="Add note..." onKeyDown={(e) => e.key === 'Enter' && handleAddNote()} />
                  <button onClick={handleAddNote} className="btn-secondary text-sm py-1.5"><Plus size={14} /></button>
                </div>
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {notes.map((n) => (
                    <div key={n.id} className="p-2.5 bg-ink-50 rounded-lg">
                      <p className="text-sm text-ink-700">{n.note}</p>
                      <p className="text-xs text-ink-400 mt-1">{n.createdBy}</p>
                    </div>
                  ))}
                  {notes.length === 0 && <p className="text-xs text-ink-400">No notes yet.</p>}
                </div>
              </div>

              <div className="card p-5">
                <h3 className="font-display font-bold text-ink-900 mb-3 flex items-center gap-2"><CheckSquare size={16} /> Follow-up Actions</h3>
                <div className="space-y-2 mb-3">
                  <input className="input w-full text-sm" value={fuAction} onChange={(e) => setFuAction(e.target.value)} placeholder="Action required..." />
                  <div className="flex gap-2">
                    <input className="input flex-1 text-sm" value={fuPerson} onChange={(e) => setFuPerson(e.target.value)} placeholder="Responsible person" />
                    <input className="input w-36 text-sm" type="date" value={fuDue} onChange={(e) => setFuDue(e.target.value)} />
                  </div>
                  <button onClick={handleAddFollowUp} className="btn-secondary text-sm py-1.5 w-full"><Plus size={14} /> Add Action</button>
                </div>
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {followUps.map((f) => (
                    <div key={f.id} className="flex items-start gap-2 p-2.5 bg-ink-50 rounded-lg cursor-pointer" onClick={() => toggleFollowUp(f.id, f.completed)}>
                      {f.completed ? <CheckSquare size={16} className="text-success-600 mt-0.5 shrink-0" /> : <Square size={16} className="text-ink-400 mt-0.5 shrink-0" />}
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm ${f.completed ? 'line-through text-ink-400' : 'text-ink-700'}`}>{f.action}</p>
                        <p className="text-xs text-ink-400">{f.responsiblePerson}{f.dueDate ? ` · Due ${f.dueDate}` : ''}</p>
                      </div>
                    </div>
                  ))}
                  {followUps.length === 0 && <p className="text-xs text-ink-400">No follow-up actions yet.</p>}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right: previous synopses */}
        <div className="space-y-4">
          <div className="card p-5">
            <h3 className="font-display font-bold text-ink-900 mb-3">Previous Synopses</h3>
            {synopses.length === 0 ? (
              <p className="text-sm text-ink-400">No synopses have been created yet.</p>
            ) : (
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {synopses.map((syn) => (
                  <button
                    key={syn.id}
                    onClick={() => openExisting(syn)}
                    className="w-full text-left p-3 rounded-lg border border-ink-100 hover:border-brand-300 hover:bg-brand-50/30 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-semibold text-ink-900 truncate">{syn.employeeName}</p>
                      <Badge color={syn.status === 'Draft' ? 'warning' : 'success'} dot>{syn.status}</Badge>
                    </div>
                    <p className="text-xs text-ink-400 truncate">{syn.prompt}</p>
                    <p className="text-xs text-ink-300 mt-1">{new Date(syn.createdAt).toLocaleDateString()} {new Date(syn.createdAt).toLocaleTimeString()}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
