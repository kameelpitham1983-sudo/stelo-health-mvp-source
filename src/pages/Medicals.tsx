import { useState } from 'react';
import { Search, Stethoscope, Calendar, Plus, ChevronDown, X, AlertCircle, Check } from 'lucide-react';
import { useMedicals, useEmployees, useCompanies } from '@/hooks/useSupabaseData';
import { Badge } from '@/components/Badge';
import { useApp } from '@/context/AppContext';
import type { Medical, MedicalType, MedicalStatus } from '@/types';

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
  'Drug & Alcohol Screen': 'bg-danger-50 text-danger-600',
  Audiometry: 'bg-ink-100 text-ink-600',
  Spirometry: 'bg-success-50 text-success-600',
  'Vision Test': 'bg-brand-50 text-brand-600',
};

const medicalTypes: MedicalType[] = [
  'Pre-Employment', 'Annual Occupational', 'Return to Work', 'Travel Health',
  'Drug & Alcohol Screen', 'Audiometry', 'Spirometry', 'Vision Test',
];

const medicalStatuses: MedicalStatus[] = ['Completed', 'Scheduled', 'In Progress', 'Overdue', 'Cancelled'];

const emptyForm: Partial<Medical> = {
  employeeName: '',
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
  const { data: employees } = useEmployees();
  const { data: companies } = useCompanies();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<Partial<Medical>>(emptyForm);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const isProvider = user?.role === 'admin' || user?.role === 'provider';

  const filtered = medicals.filter((m) => {
    const matchSearch = m.employeeName.toLowerCase().includes(search.toLowerCase()) || m.type.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || m.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleEmployeeSelect = (empId: string) => {
    const emp = employees.find((e) => e.id === empId);
    if (emp) {
      setFormData({ ...formData, employeeName: emp.name, companyName: emp.companyName });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitting(true);
    try {
      if (editingId) {
        await updateMedical(editingId, formData);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
        setEditingId(null);
      } else {
        await addMedical(formData);
      }
      setShowForm(false);
      setFormData(emptyForm);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to save medical');
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (med: Medical) => {
    setFormData({
      employeeName: med.employeeName,
      companyName: med.companyName,
      type: med.type,
      status: med.status,
      date: med.date,
      providerName: med.providerName,
      result: med.result,
      notes: med.notes,
    });
    setEditingId(med.id);
    setShowForm(true);
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><span className="w-6 h-6 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin" /></div>;
  }

  if (error) {
    return <div className="card p-6 text-center"><AlertCircle size={24} className="text-danger-500 mx-auto mb-2" /><p className="text-sm text-ink-600">Failed to load medicals: {error}</p></div>;
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
                <label className="block text-sm font-semibold text-ink-700 mb-1">Result</label>
                <input className="input w-full" value={formData.result || ''} onChange={(e) => setFormData({ ...formData, result: e.target.value })} placeholder="e.g. Fit for duty" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-ink-700 mb-1">Clinical Notes</label>
                <textarea className="input w-full min-h-[60px] resize-y" value={formData.notes || ''} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="Assessment notes and recommendations" />
              </div>
            </div>
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
            <div key={med.id} className="card card-hover p-4">
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
                  {isProvider && (
                    <button onClick={() => startEdit(med)} className="btn-ghost p-2 text-xs" title="Edit">
                      <Stethoscope size={14} />
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
