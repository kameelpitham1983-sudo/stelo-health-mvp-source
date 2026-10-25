import { useState } from 'react';
import { Search, Stethoscope, Calendar, Plus, ChevronDown, X, AlertCircle, Check, ArrowLeft, Edit3, FileText, User, Building2, Clock, ShieldCheck, ClipboardList } from 'lucide-react';
import { useMedicals, useEmployees, useCompanies } from '@/hooks/useSupabaseData';
import { Badge } from '@/components/Badge';
import { QuestionnaireWorkflow } from '@/components/QuestionnaireWorkflow';
import { useApp } from '@/context/AppContext';
import { questionnaireInstances } from '@/data/mockData';
import type { Medical, MedicalType, MedicalStatus, HealthStatus } from '@/types';

const statusColors: Record<string, 'success' | 'warning' | 'danger' | 'brand' | 'ink'> = {
  Completed: 'success',
  Scheduled: 'brand',
  'In Progress': 'warning',
  Overdue: 'danger',
  Cancelled: 'ink',
};

const typeColors: Record<string, string> = {
  'Pre-Employment': 'bg-brand-50 text-brand-600',
  'Annual Occupational': 'bg-teal-50 text-teal-600',
  'Return to Work': 'bg-warning-50 text-warning-600',
  'Travel Health': 'bg-accent-50 text-accent-600',
  'Deployment Readiness': 'bg-brand-50 text-brand-700',
  'Drug & Alcohol Screen': 'bg-danger-50 text-danger-600',
  Audiometry: 'bg-ink-100 text-ink-600',
  Spirometry: 'bg-success-50 text-success-600',
  'Vision Test': 'bg-brand-50 text-brand-600',
};

const medicalTypes: MedicalType[] = [
  'Pre-Employment', 'Annual Occupational', 'Return to Work', 'Travel Health', 'Deployment Readiness',
  'Drug & Alcohol Screen', 'Audiometry', 'Spirometry', 'Vision Test',
];

const medicalStatuses: MedicalStatus[] = ['Completed', 'Scheduled', 'In Progress', 'Overdue', 'Cancelled'];

const fitnessOutcomes: { value: string; label: string; healthStatus: HealthStatus }[] = [
  { value: 'Fit for duty', label: 'Fit for duty', healthStatus: 'Fit' },
  { value: 'Fit with Restrictions', label: 'Fit with restrictions', healthStatus: 'Fit with Restrictions' },
  { value: 'Unfit for duty', label: 'Unfit for duty', healthStatus: 'Unfit' },
  { value: 'Pending further assessment', label: 'Pending further assessment', healthStatus: 'Pending Assessment' },
  { value: 'Negative', label: 'Negative (drug screen)', healthStatus: 'Fit' },
  { value: 'Fit for travel', label: 'Fit for travel', healthStatus: 'Fit' },
];

const emptyForm: Partial<Medical> = {
  employeeName: '',
  employeeId: '',
  companyName: '',
  type: 'Annual Occupational',
  status: 'Scheduled',
  date: '',
  providerName: '',
  result: 'Pending',
  notes: '',
};

export function Medicals() {
  const { user } = useApp();
  const { data: medicals, loading, error, addMedical, updateMedical } = useMedicals();
  const { data: employees, updateEmployeeFitness } = useEmployees();
  const { data: companies } = useCompanies();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<Partial<Medical>>(emptyForm);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [selectedMedical, setSelectedMedical] = useState<Medical | null>(null);
  const [restrictions, setRestrictions] = useState('');
  const [nextDueDate, setNextDueDate] = useState('');
  const [fitnessNotice, setFitnessNotice] = useState<string | null>(null);
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);

  const isProvider = user?.role === 'admin' || user?.role === 'provider';

  const filtered = medicals.filter((m) => {
    const matchSearch = m.employeeName.toLowerCase().includes(search.toLowerCase()) || m.type.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || m.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleEmployeeSelect = (empId: string) => {
    const emp = employees.find((e) => e.id === empId);
    if (emp) {
      setFormData({ ...formData, employeeName: emp.name, employeeId: emp.id, companyName: emp.companyName });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitting(true);
    try {
      if (editingId) {
        await updateMedical(editingId, formData);

        // If status is being set to Completed with a fitness outcome, update the employee record
        if (formData.status === 'Completed' && formData.result && formData.employeeId) {
          const outcome = fitnessOutcomes.find((o) => o.value === formData.result);
          if (outcome) {
            try {
              await updateEmployeeFitness(
                formData.employeeId,
                outcome.healthStatus,
                formData.date || new Date().toISOString().slice(0, 10),
                nextDueDate || null,
                restrictions || undefined,
              );
              setFitnessNotice(`Employee fitness record updated: ${outcome.healthStatus}.`);
              setTimeout(() => setFitnessNotice(null), 4000);
            } catch {
              // Non-fatal: the medical record was saved, employee update failed
              setFitnessNotice('Medical saved but employee fitness record could not be updated automatically.');
              setTimeout(() => setFitnessNotice(null), 4000);
            }
          }
        }

        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
        setEditingId(null);
      } else {
        await addMedical(formData);
      }
      setShowForm(false);
      setFormData(emptyForm);
      setRestrictions('');
      setNextDueDate('');
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to save medical');
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (med: Medical) => {
    setFormData({
      employeeName: med.employeeName,
      employeeId: med.employeeId,
      companyName: med.companyName,
      type: med.type,
      status: med.status,
      date: med.date,
      providerName: med.providerName,
      result: med.result,
      notes: med.notes,
    });
    setEditingId(med.id);
    setSelectedMedical(null);
    setShowForm(true);
    // Pre-fill restrictions from existing employee data
    const emp = employees.find((e) => e.id === med.employeeId);
    setRestrictions(emp ? '' : '');
    setNextDueDate('');
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><span className="w-6 h-6 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin" /></div>;
  }

  if (error) {
    return <div className="card p-6 text-center"><AlertCircle size={24} className="text-danger-500 mx-auto mb-2" /><p className="text-sm text-ink-600">Failed to load medicals: {error}</p></div>;
  }

  // --- Questionnaire workflow view ---
  if (showQuestionnaire && selectedMedical) {
    return <QuestionnaireWorkflow medical={selectedMedical} onBack={() => setShowQuestionnaire(false)} />;
  }

  // --- Detail view ---
  if (selectedMedical) {
    const med = selectedMedical;
    const emp = employees.find((e) => e.id === med.employeeId);
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <button onClick={() => setSelectedMedical(null)} className="btn-secondary">
            <ArrowLeft size={16} />
            Back to Medicals
          </button>
          <div className="flex gap-2">
            <button onClick={() => setShowQuestionnaire(true)} className="btn-secondary">
              <ClipboardList size={16} /> Questionnaire
            </button>
            {isProvider && (
              <button onClick={() => startEdit(med)} className="btn-primary">
                <Edit3 size={16} />
                Edit Assessment
              </button>
            )}
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="h-20 bg-gradient-to-br from-brand-600 to-brand-900" />
          <div className="p-5 lg:p-6 -mt-8">
            <div className="flex items-end gap-4">
              <div className="h-16 w-16 rounded-2xl bg-white border-4 border-white shadow-lg flex items-center justify-center">
                <Stethoscope size={28} className="text-brand-600" />
              </div>
              <div className="mb-1">
                <h2 className="text-xl font-display font-bold text-ink-900">{med.type}</h2>
                <p className="text-sm text-ink-500">{med.employeeName}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="card p-5">
            <h3 className="font-display font-bold text-ink-900 mb-4">Assessment Details</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-ink-100">
                <span className="flex items-center gap-2 text-sm text-ink-500"><User size={15} /> Employee</span>
                <span className="font-semibold text-ink-900">{med.employeeName}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-ink-100">
                <span className="flex items-center gap-2 text-sm text-ink-500"><Building2 size={15} /> Company</span>
                <span className="font-semibold text-ink-900">{med.companyName}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-ink-100">
                <span className="flex items-center gap-2 text-sm text-ink-500"><Calendar size={15} /> Date</span>
                <span className="font-semibold text-ink-900">{med.date || 'Not set'}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-ink-100">
                <span className="text-sm text-ink-500">Type</span>
                <span className="font-semibold text-ink-900">{med.type}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-ink-100">
                <span className="text-sm text-ink-500">Status</span>
                <Badge color={statusColors[med.status]} dot>{med.status}</Badge>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-ink-500">Provider</span>
                <span className="font-semibold text-ink-900">{med.providerName || 'Not assigned'}</span>
              </div>
            </div>
          </div>

          <div className="card p-5">
            <h3 className="font-display font-bold text-ink-900 mb-4">Clinical Outcome</h3>
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold text-ink-400 uppercase tracking-wider mb-1">Result</p>
                <div className="flex items-center gap-2">
                  <Badge color={
                    med.result === 'Fit for duty' || med.result === 'Negative' || med.result === 'Fit for travel' ? 'success' :
                    med.result === 'Fit with Restrictions' ? 'warning' :
                    med.result === 'Unfit for duty' ? 'danger' :
                    'brand'
                  } dot>{med.result || 'Pending'}</Badge>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-ink-400 uppercase tracking-wider mb-1">Clinical Notes</p>
                <p className="text-sm text-ink-700 leading-relaxed">{med.notes || 'No notes recorded.'}</p>
              </div>
              {emp && (
                <div className="pt-3 border-t border-ink-100">
                  <p className="text-xs font-semibold text-ink-400 uppercase tracking-wider mb-2">Employee Health Status</p>
                  <div className="flex items-center gap-2">
                    <Badge color={
                      emp.healthStatus === 'Fit' ? 'success' :
                      emp.healthStatus === 'Fit with Restrictions' ? 'warning' :
                      emp.healthStatus === 'Unfit' ? 'danger' : 'brand'
                    } dot>{emp.healthStatus}</Badge>
                    <span className="text-xs text-ink-400">Next due: {emp.nextMedicalDue || 'Not scheduled'}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Questionnaire status card */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold text-ink-900 flex items-center gap-2"><ClipboardList size={18} className="text-brand-600" /> Medical Questionnaire</h3>
            <button onClick={() => setShowQuestionnaire(true)} className="btn-secondary text-sm">
              <ClipboardList size={14} /> Open Questionnaire
            </button>
          </div>
          <QuestionnaireStatusBadge medicalId={med.id} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {showForm && (
        <div className="card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-ink-900">{editingId ? 'Edit Assessment' : 'New Medical Assessment'}</h3>
            <button type="button" className="btn-secondary" onClick={() => { setShowForm(false); setEditingId(null); setFormData(emptyForm); }}><X size={16} /> Cancel</button>
          </div>
          {submitError && <div className="p-3 bg-danger-50 text-danger-700 text-sm rounded-lg">{submitError}</div>}
          {fitnessNotice && <div className="p-3 bg-success-50 text-success-700 text-sm rounded-lg flex items-center gap-2"><ShieldCheck size={16} /> {fitnessNotice}</div>}
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {!editingId && (
                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-1">Select Employee *</label>
                  <select className="input w-full" onChange={(e) => handleEmployeeSelect(e.target.value)} required>
                    <option value="">Choose employee...</option>
                    {employees.map((e) => <option key={e.id} value={e.id}>{e.name} — {e.companyName}</option>)}
                  </select>
                </div>
              )}
              {editingId && (
                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-1">Employee</label>
                  <input className="input w-full" value={formData.employeeName || ''} disabled />
                </div>
              )}
              <div>
                <label className="block text-sm font-semibold text-ink-700 mb-1">Company</label>
                <select className="input w-full" value={formData.companyName || ''} onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}>
                  <option value="">Select company...</option>
                  {companies.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-ink-700 mb-1">Assessment Type *</label>
                <div className="relative">
                  <select className="input w-full pr-9 appearance-none cursor-pointer" value={formData.type || 'Annual Occupational'} onChange={(e) => setFormData({ ...formData, type: e.target.value as MedicalType })}>
                    {medicalTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-ink-700 mb-1">Status</label>
                <div className="relative">
                  <select className="input w-full pr-9 appearance-none cursor-pointer" value={formData.status || 'Scheduled'} onChange={(e) => setFormData({ ...formData, status: e.target.value as MedicalStatus })}>
                    {medicalStatuses.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-ink-700 mb-1">Date</label>
                <input className="input w-full" type="date" value={formData.date || ''} onChange={(e) => setFormData({ ...formData, date: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-ink-700 mb-1">Provider</label>
                <input className="input w-full" value={formData.providerName || ''} onChange={(e) => setFormData({ ...formData, providerName: e.target.value })} placeholder="Clinician name" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-ink-700 mb-1">Fitness Outcome</label>
                <div className="relative">
                  <select className="input w-full pr-9 appearance-none cursor-pointer" value={formData.result || 'Pending'} onChange={(e) => setFormData({ ...formData, result: e.target.value })}>
                    <option value="Pending">Pending</option>
                    {fitnessOutcomes.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                  <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
                </div>
              </div>

              {/* Conditional fields when completing with fitness outcome */}
              {editingId && formData.status === 'Completed' && formData.result && formData.result !== 'Pending' && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-ink-700 mb-1">Restrictions (if applicable)</label>
                    <input className="input w-full" value={restrictions} onChange={(e) => setRestrictions(e.target.value)} placeholder="e.g. No lifting >15kg for 6 weeks" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-ink-700 mb-1">Next Assessment Due</label>
                    <input className="input w-full" type="date" value={nextDueDate} onChange={(e) => setNextDueDate(e.target.value)} />
                  </div>
                </>
              )}

              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-ink-700 mb-1">Clinical Notes</label>
                <textarea className="input w-full min-h-[80px] resize-y" value={formData.notes || ''} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="Assessment notes and recommendations" />
              </div>
            </div>
            {editingId && formData.status === 'Completed' && formData.result && formData.result !== 'Pending' && (
              <div className="p-3 bg-brand-50 text-brand-700 text-xs rounded-lg flex items-start gap-2">
                <ShieldCheck size={14} className="mt-0.5 shrink-0" />
                <span>Saving a Completed assessment with a fitness outcome will update the employee's health status, restrictions, and next assessment due date. This is a clinical decision restricted to authorised providers.</span>
              </div>
            )}
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : saved ? <><Check size={16} /> Saved</> : <><Plus size={16} /> {editingId ? 'Save Changes' : 'Create Assessment'}</>}
            </button>
          </form>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-display font-bold text-ink-900">Medicals</h2>
          <p className="text-sm text-ink-500">{filtered.length} medical assessments</p>
        </div>
        {isProvider && (
          <button className="btn-primary" onClick={() => { setFormData(emptyForm); setEditingId(null); setShowForm(true); }}>
            <Plus size={16} /> New Assessment
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {medicalStatuses.map((status) => {
          const count = medicals.filter((m) => m.status === status).length;
          return (
            <button
              key={status}
              onClick={() => setStatusFilter(statusFilter === status ? 'all' : status)}
              className={`card p-3.5 text-left transition-all ${statusFilter === status ? 'ring-2 ring-brand-500 border-brand-300' : 'card-hover'}`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className={`w-2 h-2 rounded-full ${statusColors[status] === 'success' ? 'bg-success-500' : statusColors[status] === 'warning' ? 'bg-warning-500' : statusColors[status] === 'danger' ? 'bg-danger-500' : statusColors[status] === 'brand' ? 'bg-brand-500' : 'bg-ink-400'}`} />
                <span className="text-xs font-medium text-ink-500">{status}</span>
              </div>
              <p className="text-xl font-bold font-display text-ink-900">{count}</p>
            </button>
          );
        })}
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
        <input type="text" placeholder="Search by employee or assessment type..." value={search} onChange={(e) => setSearch(e.target.value)} className="input pl-10" />
      </div>

      {filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <Stethoscope size={32} className="text-ink-300 mx-auto mb-3" />
          <p className="text-sm text-ink-500">No medical assessments found. {isProvider && 'Click "New Assessment" to create one.'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((med) => (
            <div key={med.id} className="card card-hover p-4 cursor-pointer" onClick={() => setSelectedMedical(med)}>
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 ${typeColors[med.type] || 'bg-ink-100 text-ink-600'}`}>
                    <Stethoscope size={20} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink-900">{med.employeeName}</p>
                    <p className="text-xs text-ink-400 truncate">{med.companyName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 sm:gap-6 flex-wrap">
                  <div>
                    <p className="text-xs text-ink-400">Type</p>
                    <p className="text-sm font-medium text-ink-700">{med.type}</p>
                  </div>
                  <div className="hidden md:block">
                    <p className="text-xs text-ink-400">Date</p>
                    <p className="text-sm font-medium text-ink-700 flex items-center gap-1"><Calendar size={12} className="text-ink-400" />{med.date || 'Not set'}</p>
                  </div>
                  <div className="hidden lg:block">
                    <p className="text-xs text-ink-400">Provider</p>
                    <p className="text-sm font-medium text-ink-700">{med.providerName || 'Not assigned'}</p>
                  </div>
                  <div className="hidden xl:block max-w-[200px]">
                    <p className="text-xs text-ink-400">Result</p>
                    <p className="text-sm font-medium text-ink-700 truncate">{med.result}</p>
                  </div>
                  <Badge color={statusColors[med.status]} dot>{med.status}</Badge>
                  {questionnaireInstances.find((qi) => qi.medicalId === med.id) && (
                    <span className="hidden sm:flex items-center gap-1 text-xs text-ink-400">
                      <ClipboardList size={12} /> Questionnaire
                    </span>
                  )}
                  {isProvider && (
                    <button
                      onClick={(e) => { e.stopPropagation(); startEdit(med); }}
                      className="btn-ghost p-2 text-xs"
                      title="Edit"
                    >
                      <Edit3 size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function QuestionnaireStatusBadge({ medicalId }: { medicalId: string }) {
  const instance = questionnaireInstances.find((qi) => qi.medicalId === medicalId);
  if (!instance) {
    return (
      <div className="flex items-center gap-3 text-sm text-ink-500">
        <ClipboardList size={16} className="text-ink-400" />
        No questionnaire assigned yet. Click "Open Questionnaire" to select a template and begin.
      </div>
    );
  }
  const statusColorMap: Record<string, 'success' | 'warning' | 'danger' | 'brand' | 'ink'> = {
    'Not Started': 'ink',
    Draft: 'warning',
    Submitted: 'brand',
    'Under Review': 'brand',
    Completed: 'success',
  };
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Badge color={statusColorMap[instance.status]} dot>{instance.status}</Badge>
        <span className="text-sm text-ink-600">{instance.templateName}</span>
      </div>
      <div className="text-xs text-ink-500 space-y-1">
        {instance.completedBy && <p>Completed by: {instance.completedBy}</p>}
        {instance.submittedAt && <p>Submitted: {new Date(instance.submittedAt).toLocaleString()}</p>}
        {instance.reviewedBy && <p>Reviewed by: {instance.reviewedBy}</p>}
        {instance.flaggedForReview.length > 0 && (
          <p className="text-warning-600">{instance.flaggedForReview.length} item(s) flagged for clinician review</p>
        )}
      </div>
    </div>
  );
}
