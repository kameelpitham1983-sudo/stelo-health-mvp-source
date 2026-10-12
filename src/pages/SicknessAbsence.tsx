import { useState, type FormEvent } from 'react';
import { AlertCircle, CalendarDays, HeartPulse, Plus, ShieldAlert, Trash2 } from 'lucide-react';
import { Badge } from '@/components/Badge';

type RiskLevel = 'Low' | 'Moderate' | 'High' | 'Critical';
type CaseType = 'Injury on duty' | 'Illness';

interface AbsenceCase {
  id: number;
  employee: string;
  company: string;
  referralTrigger: string;
  caseType: CaseType;
  firstDayOff: string;
  expectedReturn: string;
  accommodation: string;
  risk: RiskLevel;
  notes: string;
}

const riskColor: Record<RiskLevel, 'success' | 'warning' | 'danger' | 'ink'> = {
  Low: 'success',
  Moderate: 'warning',
  High: 'danger',
  Critical: 'danger',
};

const emptyForm = {
  employee: '',
  company: '',
  referralTrigger: '',
  caseType: 'Illness' as CaseType,
  firstDayOff: '',
  expectedReturn: '',
  accommodation: '',
  risk: 'Moderate' as RiskLevel,
  notes: '',
};

export function SicknessAbsence() {
  const [cases, setCases] = useState<AbsenceCase[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<'All' | RiskLevel>('All');
  const [form, setForm] = useState(emptyForm);
  const [notice, setNotice] = useState('');

  const update = (field: keyof typeof emptyForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setNotice('');
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const record: AbsenceCase = {
      ...form,
      caseType: form.caseType,
      risk: form.risk,
      id: Date.now(),
    };
    setCases((current) => [record, ...current]);
    setForm(emptyForm);
    setShowForm(false);
    setNotice('Referral added to this prototype session.');
  };

  const visibleCases = filter === 'All' ? cases : cases.filter((item) => item.risk === filter);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <div className="mb-1 flex items-center gap-2 text-brand-600"><HeartPulse size={18} /><span className="text-xs font-semibold uppercase tracking-wider">People support</span></div>
          <h2 className="text-xl font-display font-bold text-ink-900">Sickness Absence Management</h2>
          <p className="mt-1 text-sm text-ink-500">Capture referrals, absence periods, workplace accommodations and return-to-work risk.</p>
        </div>
        <button type="button" onClick={() => setShowForm((open) => !open)} className="btn-primary self-start sm:self-auto"><Plus size={16} /> New referral</button>
      </div>

      <div className="rounded-xl border border-warning-200 bg-warning-50 p-3 text-sm text-warning-800">
        <div className="flex items-start gap-2"><AlertCircle size={17} className="mt-0.5 shrink-0" /><p><strong>Prototype notice:</strong> referrals added here are held in the current page session only. Database saving and permissions still need to be connected before operational use. Do not enter real patient or employee health information yet.</p></div>
      </div>

      {notice && <div className="rounded-lg bg-success-50 px-4 py-3 text-sm text-success-700">{notice}</div>}

      {showForm && (
        <form onSubmit={submit} className="card space-y-5 p-5">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-display font-bold text-ink-900">New sickness absence referral</h3>
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div><label className="mb-1 block text-sm font-semibold text-ink-700">Employee name / reference *</label><input className="input w-full" value={form.employee} onChange={(e) => update('employee', e.target.value)} required /></div>
            <div><label className="mb-1 block text-sm font-semibold text-ink-700">Employer / company *</label><input className="input w-full" value={form.company} onChange={(e) => update('company', e.target.value)} required /></div>
            <div><label className="mb-1 block text-sm font-semibold text-ink-700">Referral trigger *</label><select className="input w-full" value={form.referralTrigger} onChange={(e) => update('referralTrigger', e.target.value)} required><option value="">Select trigger</option><option>Manager referral</option><option>Repeated absence</option><option>Extended absence</option><option>Injury / incident</option><option>Return-to-work review</option><option>Employee request</option><option>Other</option></select></div>
            <div><label className="mb-1 block text-sm font-semibold text-ink-700">Case type *</label><select className="input w-full" value={form.caseType} onChange={(e) => update('caseType', e.target.value)}><option>Illness</option><option>Injury on duty</option></select></div>
            <div><label className="mb-1 block text-sm font-semibold text-ink-700">First day off work *</label><input type="date" className="input w-full" value={form.firstDayOff} onChange={(e) => update('firstDayOff', e.target.value)} required /></div>
            <div><label className="mb-1 block text-sm font-semibold text-ink-700">Expected return date</label><input type="date" className="input w-full" value={form.expectedReturn} onChange={(e) => update('expectedReturn', e.target.value)} /></div>
            <div><label className="mb-1 block text-sm font-semibold text-ink-700">Risk matrix level *</label><select className="input w-full" value={form.risk} onChange={(e) => update('risk', e.target.value)}><option>Low</option><option>Moderate</option><option>High</option><option>Critical</option></select></div>
            <div><label className="mb-1 block text-sm font-semibold text-ink-700">Workplace accommodations</label><input className="input w-full" value={form.accommodation} onChange={(e) => update('accommodation', e.target.value)} placeholder="e.g. phased return, adjusted duties" /></div>
          </div>
          <div><label className="mb-1 block text-sm font-semibold text-ink-700">Case notes (avoid unnecessary medical detail)</label><textarea className="input min-h-24 w-full" value={form.notes} onChange={(e) => update('notes', e.target.value)} placeholder="Work-related restrictions, agreed actions, follow-up required..." /></div>
          <div className="flex justify-end"><button type="submit" className="btn-primary"><Plus size={16} /> Add referral</button></div>
        </form>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="card p-4"><p className="text-sm text-ink-500">Referrals in this session</p><p className="mt-1 text-2xl font-display font-bold text-ink-900">{cases.length}</p></div>
        <div className="card p-4"><p className="text-sm text-ink-500">High / critical risk</p><p className="mt-1 text-2xl font-display font-bold text-danger-600">{cases.filter((item) => item.risk === 'High' || item.risk === 'Critical').length}</p></div>
        <div className="card p-4"><p className="text-sm text-ink-500">Accommodations recorded</p><p className="mt-1 text-2xl font-display font-bold text-ink-900">{cases.filter((item) => item.accommodation.trim()).length}</p></div>
      </div>

      <div className="card overflow-hidden">
        <div className="flex flex-col justify-between gap-3 border-b border-ink-100 p-4 sm:flex-row sm:items-center">
          <div><h3 className="font-display font-bold text-ink-900">Absence referrals</h3><p className="text-xs text-ink-500">Current prototype-session entries</p></div>
          <select aria-label="Filter by risk" className="input sm:w-44" value={filter} onChange={(e) => setFilter(e.target.value as 'All' | RiskLevel)}><option>All</option><option>Low</option><option>Moderate</option><option>High</option><option>Critical</option></select>
        </div>
        {visibleCases.length === 0 ? (
          <div className="px-5 py-12 text-center"><div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-600"><CalendarDays size={22} /></div><p className="font-semibold text-ink-800">No referrals to display</p><p className="mt-1 text-sm text-ink-500">Select “New referral” to test the sickness absence workflow.</p></div>
        ) : (
          <div className="overflow-x-auto"><table className="w-full"><thead><tr className="border-b border-ink-100 bg-ink-50/50 text-left text-xs uppercase tracking-wider text-ink-500"><th className="px-4 py-3">Employee / employer</th><th className="px-4 py-3">Referral</th><th className="px-4 py-3">Absence period</th><th className="px-4 py-3">Risk</th><th className="px-4 py-3">Actions</th></tr></thead><tbody className="divide-y divide-ink-100">{visibleCases.map((item) => <tr key={item.id}><td className="px-4 py-3"><p className="font-semibold text-ink-900">{item.employee}</p><p className="text-xs text-ink-500">{item.company}</p></td><td className="px-4 py-3"><p className="text-sm text-ink-800">{item.referralTrigger}</p><p className="text-xs text-ink-500">{item.caseType}</p></td><td className="px-4 py-3 text-sm text-ink-600"><span>{item.firstDayOff}</span><span className="block text-xs text-ink-400">Return: {item.expectedReturn || 'Not set'}</span></td><td className="px-4 py-3"><Badge color={riskColor[item.risk]} dot>{item.risk}</Badge></td><td className="px-4 py-3"><button type="button" className="btn-secondary" aria-label={`Delete referral for ${item.employee}`} onClick={() => setCases((current) => current.filter((entry) => entry.id !== item.id))}><Trash2 size={14} /> Remove</button></td></tr>)}</tbody></table></div>
        )}
      </div>
      <div className="flex items-start gap-2 text-xs text-ink-400"><ShieldAlert size={14} className="mt-0.5 shrink-0" /><p>Risk level is a workflow prompt, not a clinical assessment. Configure a validated risk matrix, role-based access, audit trail and secure persistence before using real cases.</p></div>
    </div>
  );
}
