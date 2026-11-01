import { useState, useMemo } from 'react';
import {
  Briefcase, Search, Plus, X, AlertCircle, ChevronDown, Filter,
  Clock, CheckCircle2, AlertTriangle, UserCircle, Stethoscope, FlaskConical,
  Globe, HeartPulse, FileInput, ArrowRight, CalendarClock, User,
} from 'lucide-react';
import { useCases, useCompanies, useEmployees } from '@/hooks/useSupabaseData';
import { useApp } from '@/context/AppContext';
import { Badge } from '@/components/Badge';
import type { CaseRecord, CaseType, CaseStatus, CasePriority } from '@/types';

const caseTypeLabels: Record<CaseType, string> = {
  pre_employment: 'Pre-Employment Medical',
  periodical: 'Periodical Medical',
  transfer: 'Transfer Medical',
  travel_medical: 'Travel Medical',
  visa_medical: 'Visa Medical',
  lab_request: 'Laboratory Request',
  specialist_referral: 'Specialist Referral',
  sickness_absence: 'Sickness Absence',
  other: 'Other',
};

const caseTypeIcons: Record<CaseType, typeof Briefcase> = {
  pre_employment: User,
  periodical: Stethoscope,
  transfer: ArrowRight,
  travel_medical: Globe,
  visa_medical: Globe,
  lab_request: FlaskConical,
  specialist_referral: Stethoscope,
  sickness_absence: HeartPulse,
  other: Briefcase,
};

const statusConfig: Record<CaseStatus, { label: string; color: 'success' | 'warning' | 'danger' | 'brand' | 'ink' }> = {
  new: { label: 'New', color: 'brand' },
  active: { label: 'Active', color: 'brand' },
  awaiting_client_approval: { label: 'Awaiting Client Approval', color: 'warning' },
  awaiting_employee_info: { label: 'Awaiting Employee Info', color: 'warning' },
  awaiting_appointment: { label: 'Awaiting Appointment', color: 'warning' },
  awaiting_provider: { label: 'Awaiting Provider', color: 'warning' },
  awaiting_clinical_review: { label: 'Awaiting Clinical Review', color: 'warning' },
  awaiting_outcome: { label: 'Awaiting Outcome', color: 'warning' },
  overdue: { label: 'Overdue', color: 'danger' },
  completed: { label: 'Completed', color: 'success' },
  on_hold: { label: 'On Hold', color: 'ink' },
  cancelled: { label: 'Cancelled', color: 'ink' },
  exception: { label: 'Exception', color: 'danger' },
};

const priorityConfig: Record<CasePriority, { color: 'success' | 'warning' | 'danger' | 'ink' }> = {
  low: { color: 'ink' },
  medium: { color: 'warning' },
  high: { color: 'danger' },
  urgent: { color: 'danger' },
};

const allCaseTypes = Object.keys(caseTypeLabels) as CaseType[];
const allStatuses = Object.keys(statusConfig) as CaseStatus[];

const emptyForm = {
  caseType: 'pre_employment' as CaseType,
  title: '',
  description: '',
  companyId: '',
  employeeId: '',
  assignedCoordinator: '',
  caseOwner: '',
  priority: 'medium' as CasePriority,
  targetCompletionDate: '',
};

interface CaseManagementProps {
  onOpenCase: (caseId: string) => void;
}

export function CaseManagement({ onOpenCase }: CaseManagementProps) {
  const { user } = useApp();
  const { data: cases, loading, error, addCase } = useCases();
  const { data: companies } = useCompanies();
  const { data: employees } = useEmployees();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [companyFilter, setCompanyFilter] = useState('all');
  const [coordinatorFilter, setCoordinatorFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const coordinators = useMemo(() => {
    const set = new Set(cases.map((c) => c.assignedCoordinator).filter(Boolean));
    return Array.from(set).sort();
  }, [cases]);

  const filtered = useMemo(() => {
    return cases.filter((c) => {
      if (statusFilter !== 'all' && c.status !== statusFilter) return false;
      if (typeFilter !== 'all' && c.caseType !== typeFilter) return false;
      if (companyFilter !== 'all' && c.companyId !== companyFilter) return false;
      if (coordinatorFilter !== 'all' && c.assignedCoordinator !== coordinatorFilter) return false;
      if (priorityFilter !== 'all' && c.priority !== priorityFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const matches =
          c.caseReference.toLowerCase().includes(q) ||
          c.title.toLowerCase().includes(q) ||
          (c.employeeName || '').toLowerCase().includes(q) ||
          c.companyName.toLowerCase().includes(q) ||
          c.caseType.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [cases, statusFilter, typeFilter, companyFilter, coordinatorFilter, priorityFilter, search]);

  const stats = useMemo(() => {
    const s: Record<string, number> = {
      new: 0, active: 0, awaiting_client_approval: 0, awaiting_employee_info: 0,
      awaiting_appointment: 0, awaiting_provider: 0, awaiting_clinical_review: 0,
      awaiting_outcome: 0, overdue: 0, completed: 0, exception: 0,
    };
    cases.forEach((c) => {
      if (s[c.status] !== undefined) s[c.status]++;
    });
    return s;
  }, [cases]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitting(true);
    try {
      const company = companies.find((co) => co.id === formData.companyId);
      const employee = employees.find((em) => em.id === formData.employeeId);
      const created = await addCase({
        caseType: formData.caseType,
        title: formData.title,
        description: formData.description,
        companyId: formData.companyId || null,
        companyName: company?.name || '',
        employeeId: formData.employeeId || null,
        employeeName: employee?.name || null,
        assignedCoordinator: formData.assignedCoordinator || user?.name || '',
        caseOwner: formData.caseOwner || formData.assignedCoordinator || user?.name || '',
        priority: formData.priority,
        targetCompletionDate: formData.targetCompletionDate || null,
      });
      setShowForm(false);
      setFormData(emptyForm);
      onOpenCase(created.id);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to create case');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><span className="w-6 h-6 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin" /></div>;
  }

  if (error) {
    return <div className="card p-6 text-center"><AlertCircle size={24} className="text-danger-500 mx-auto mb-2" /><p className="text-sm text-ink-600">Failed to load cases: {error}</p></div>;
  }

  const canCreate = user?.role === 'admin' || user?.role === 'coordinator';

  return (
    <div className="space-y-6">
      {submitError && <div className="p-3 bg-danger-50 text-danger-700 text-sm rounded-lg flex items-center gap-2"><AlertCircle size={16} /> {submitError}</div>}

      {showForm && canCreate && (
        <div className="card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-ink-900 flex items-center gap-2"><Plus size={18} className="text-brand-600" /> Open New Case</h3>
            <button type="button" className="btn-secondary" onClick={() => { setShowForm(false); setFormData(emptyForm); setSubmitError(null); }}><X size={16} /> Cancel</button>
          </div>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-ink-700 mb-1">Case Type *</label>
                <div className="relative">
                  <select className="input w-full pr-9 appearance-none cursor-pointer" value={formData.caseType} onChange={(e) => setFormData({ ...formData, caseType: e.target.value as CaseType })}>
                    {allCaseTypes.map((t) => <option key={t} value={t}>{caseTypeLabels[t]}</option>)}
                  </select>
                  <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-ink-700 mb-1">Priority</label>
                <div className="relative">
                  <select className="input w-full pr-9 appearance-none cursor-pointer" value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value as CasePriority })}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                  <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-ink-700 mb-1">Title *</label>
                <input className="input w-full" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required placeholder="e.g. Pre-employment medical — John Doe" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-ink-700 mb-1">Description</label>
                <textarea className="input w-full" rows={2} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Brief description of the case" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-ink-700 mb-1">Company</label>
                <select className="input w-full" value={formData.companyId} onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}>
                  <option value="">Select company...</option>
                  {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-ink-700 mb-1">Employee</label>
                <select className="input w-full" value={formData.employeeId} onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })} disabled={!formData.companyId}>
                  <option value="">Select employee...</option>
                  {employees.filter((em) => !formData.companyId || em.companyId === formData.companyId).map((em) => <option key={em.id} value={em.id}>{em.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-ink-700 mb-1">Assigned Coordinator</label>
                <input className="input w-full" value={formData.assignedCoordinator} onChange={(e) => setFormData({ ...formData, assignedCoordinator: e.target.value })} placeholder="Coordinator name" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-ink-700 mb-1">Target Completion Date</label>
                <input className="input w-full" type="date" value={formData.targetCompletionDate} onChange={(e) => setFormData({ ...formData, targetCompletionDate: e.target.value })} />
              </div>
            </div>
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Plus size={16} /> Create Case</>}
            </button>
          </form>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-display font-bold text-ink-900 flex items-center gap-2"><Briefcase size={20} className="text-brand-600" /> Case Management</h2>
          <p className="text-sm text-ink-500">{filtered.length} of {cases.length} cases</p>
        </div>
        {canCreate && !showForm && (
          <button className="btn-primary" onClick={() => setShowForm(true)}><Plus size={16} /> Open New Case</button>
        )}
      </div>

      {/* Status stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatCard label="New" count={stats.new} icon={Briefcase} colorClass="bg-brand-50 text-brand-600" onClick={() => setStatusFilter(statusFilter === 'new' ? 'all' : 'new')} active={statusFilter === 'new'} />
        <StatCard label="Active" count={stats.active} icon={Clock} colorClass="bg-brand-50 text-brand-600" onClick={() => setStatusFilter(statusFilter === 'active' ? 'all' : 'active')} active={statusFilter === 'active'} />
        <StatCard label="Awaiting Approval" count={stats.awaiting_client_approval} icon={AlertCircle} colorClass="bg-warning-50 text-warning-600" onClick={() => setStatusFilter(statusFilter === 'awaiting_client_approval' ? 'all' : 'awaiting_client_approval')} active={statusFilter === 'awaiting_client_approval'} />
        <StatCard label="Awaiting Appointment" count={stats.awaiting_appointment} icon={CalendarClock} colorClass="bg-warning-50 text-warning-600" onClick={() => setStatusFilter(statusFilter === 'awaiting_appointment' ? 'all' : 'awaiting_appointment')} active={statusFilter === 'awaiting_appointment'} />
        <StatCard label="Awaiting Provider" count={stats.awaiting_provider} icon={Stethoscope} colorClass="bg-warning-50 text-warning-600" onClick={() => setStatusFilter(statusFilter === 'awaiting_provider' ? 'all' : 'awaiting_provider')} active={statusFilter === 'awaiting_provider'} />
        <StatCard label="Clinical Review" count={stats.awaiting_clinical_review} icon={FileInput} colorClass="bg-warning-50 text-warning-600" onClick={() => setStatusFilter(statusFilter === 'awaiting_clinical_review' ? 'all' : 'awaiting_clinical_review')} active={statusFilter === 'awaiting_clinical_review'} />
        <StatCard label="Awaiting Outcome" count={stats.awaiting_outcome} icon={Clock} colorClass="bg-warning-50 text-warning-600" onClick={() => setStatusFilter(statusFilter === 'awaiting_outcome' ? 'all' : 'awaiting_outcome')} active={statusFilter === 'awaiting_outcome'} />
        <StatCard label="Overdue" count={stats.overdue} icon={AlertTriangle} colorClass="bg-danger-50 text-danger-600" onClick={() => setStatusFilter(statusFilter === 'overdue' ? 'all' : 'overdue')} active={statusFilter === 'overdue'} />
        <StatCard label="Completed" count={stats.completed} icon={CheckCircle2} colorClass="bg-success-50 text-success-600" onClick={() => setStatusFilter(statusFilter === 'completed' ? 'all' : 'completed')} active={statusFilter === 'completed'} />
        <StatCard label="Exceptions" count={stats.exception} icon={AlertTriangle} colorClass="bg-danger-50 text-danger-600" onClick={() => setStatusFilter(statusFilter === 'exception' ? 'all' : 'exception')} active={statusFilter === 'exception'} />
      </div>

      {/* Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
          <input type="text" placeholder="Search by reference, title, employee or company..." value={search} onChange={(e) => setSearch(e.target.value)} className="input pl-10" />
        </div>
        <div className="flex flex-wrap gap-2">
          <FilterSelect label="Status" value={statusFilter} options={[{ value: 'all', label: 'All statuses' }, ...allStatuses.map((s) => ({ value: s, label: statusConfig[s].label }))]} onChange={setStatusFilter} />
          <FilterSelect label="Type" value={typeFilter} options={[{ value: 'all', label: 'All types' }, ...allCaseTypes.map((t) => ({ value: t, label: caseTypeLabels[t] }))]} onChange={setTypeFilter} />
          <FilterSelect label="Company" value={companyFilter} options={[{ value: 'all', label: 'All companies' }, ...companies.map((c) => ({ value: c.id, label: c.name }))]} onChange={setCompanyFilter} />
          <FilterSelect label="Coordinator" value={coordinatorFilter} options={[{ value: 'all', label: 'All coordinators' }, ...coordinators.map((c) => ({ value: c, label: c }))]} onChange={setCoordinatorFilter} />
          <FilterSelect label="Priority" value={priorityFilter} options={[{ value: 'all', label: 'All priorities' }, { value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' }, { value: 'high', label: 'High' }, { value: 'urgent', label: 'Urgent' }]} onChange={setPriorityFilter} />
        </div>
      </div>

      {/* Case list */}
      {filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <Briefcase size={32} className="text-ink-300 mx-auto mb-3" />
          <p className="text-sm text-ink-500">No cases match your filters. {canCreate && 'Click "Open New Case" to create one.'}</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="divide-y divide-ink-100">
            {filtered.map((c) => {
              const TypeIcon = caseTypeIcons[c.caseType] || Briefcase;
              const sc = statusConfig[c.status];
              const pc = priorityConfig[c.priority];
              const isOverdue = c.status === 'overdue' || (c.targetCompletionDate && new Date(c.targetCompletionDate) < new Date() && c.status !== 'completed' && c.status !== 'cancelled');
              return (
                <div key={c.id} className="p-4 flex items-center gap-4 hover:bg-ink-50/50 transition-colors cursor-pointer" onClick={() => onOpenCase(c.id)}>
                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${isOverdue ? 'bg-danger-50' : 'bg-brand-50'}`}>
                    <TypeIcon size={18} className={isOverdue ? 'text-danger-600' : 'text-brand-600'} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-ink-900 truncate">{c.title}</span>
                      <Badge color={pc.color} dot>{c.priority}</Badge>
                      {isOverdue && <Badge color="danger" dot>Overdue</Badge>}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-ink-400 flex-wrap">
                      <span className="font-mono text-ink-500">{c.caseReference}</span>
                      <span>·</span>
                      <span>{c.companyName}</span>
                      {c.employeeName && (<><span>·</span><span>{c.employeeName}</span></>)}
                      <span>·</span>
                      <span>{caseTypeLabels[c.caseType]}</span>
                      {c.assignedCoordinator && (<><span>·</span><span className="flex items-center gap-0.5"><UserCircle size={11} /> {c.assignedCoordinator}</span></>)}
                    </div>
                  </div>
                  <div className="hidden sm:flex flex-col items-end gap-1 shrink-0">
                    <Badge color={sc.color} dot>{sc.label}</Badge>
                    {c.targetCompletionDate && <span className="text-xs text-ink-400">Target: {c.targetCompletionDate}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, count, icon: Icon, colorClass, onClick, active }: { label: string; count: number; icon: typeof Briefcase; colorClass: string; onClick: () => void; active: boolean }) {
  return (
    <button onClick={onClick} className={`card p-3 flex items-center gap-3 text-left transition-all ${active ? 'ring-2 ring-brand-500 border-brand-300' : 'card-hover'}`}>
      <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${colorClass}`}>
        <Icon size={16} />
      </div>
      <div><p className="text-lg font-bold font-display text-ink-900">{count}</p><p className="text-xs text-ink-400 truncate">{label}</p></div>
    </button>
  );
}

function FilterSelect({ label, value, options, onChange }: { label: string; value: string; options: { value: string; label: string }[]; onChange: (v: string) => void }) {
  return (
    <div className="relative">
      <select value={value} onChange={(e) => onChange(e.target.value)} className="input pr-9 appearance-none cursor-pointer min-w-[140px] text-sm">
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
      <span className="absolute -top-2 left-2 px-1 bg-white text-[10px] font-semibold text-ink-400 uppercase tracking-wider">{label}</span>
    </div>
  );
}
