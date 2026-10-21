import { useState, useMemo } from 'react';
import {
  Globe,
  Search,
  Plus,
  X,
  ChevronDown,
  ArrowLeft,
  AlertCircle,
  Check,
  FileText,
  Stethoscope,
  TestTube,
  Calendar,
  Clock,
  User,
  Building2,
  ClipboardList,
  ShieldCheck,
  Award,
  Info,
} from 'lucide-react';
import { Badge } from '@/components/Badge';
import { useApp } from '@/context/AppContext';
import { isDemoMode } from '@/hooks/useSupabaseData';
import { visaMedicalCases, visaCountryRequirements } from '@/data/mockData';
import type {
  VisaMedicalCase,
  VisaMedicalStatus,
  VisaCountryRequirement,
} from '@/types';

const statusColors: Record<string, 'success' | 'warning' | 'danger' | 'brand' | 'ink'> = {
  Requested: 'ink',
  'Awaiting Documents': 'warning',
  'Questionnaire Pending': 'warning',
  'Appointment Booked': 'brand',
  'Tests Pending': 'warning',
  'Awaiting Clinician Review': 'brand',
  Completed: 'success',
  'Follow-up Required': 'danger',
};

const allStatuses: VisaMedicalStatus[] = [
  'Requested',
  'Awaiting Documents',
  'Questionnaire Pending',
  'Appointment Booked',
  'Tests Pending',
  'Awaiting Clinician Review',
  'Completed',
  'Follow-up Required',
];

const reqTypeIcons: Record<string, typeof FileText> = {
  examination: Stethoscope,
  test: TestTube,
  document: FileText,
};

const emptyForm: Partial<VisaMedicalCase> & {
  employeeName?: string;
  employeeId?: string;
  companyName?: string;
  destinationCountry?: string;
  visaCategory?: string;
  requestedBy?: string;
} = {
  employeeName: '',
  employeeId: '',
  companyName: '',
  destinationCountry: '',
  visaCategory: '',
  requestedBy: '',
};

export function VisaMedicals() {
  const { user } = useApp();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [selectedCase, setSelectedCase] = useState<VisaMedicalCase | null>(null);
  const [showRequirements, setShowRequirements] = useState(false);
  const [demoCases, setDemoCases] = useState<VisaMedicalCase[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const isProvider = user?.role === 'admin' || user?.role === 'provider';

  const allCases = useMemo(() => {
    if (demoCases.length === 0) return visaMedicalCases;
    const baseIds = new Set(visaMedicalCases.map((c) => c.id));
    const added = demoCases.filter((c) => !baseIds.has(c.id));
    return [...visaMedicalCases, ...added];
  }, [demoCases]);

  const filtered = allCases.filter((c) => {
    const matchSearch =
      c.employeeName.toLowerCase().includes(search.toLowerCase()) ||
      c.destinationCountry.toLowerCase().includes(search.toLowerCase()) ||
      c.caseReference.toLowerCase().includes(search.toLowerCase()) ||
      c.visaCategory.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const counts = allStatuses.reduce((acc, s) => {
    acc[s] = allCases.filter((c) => c.status === s).length;
    return acc;
  }, {} as Record<string, number>);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    if (!formData.employeeName || !formData.destinationCountry || !formData.visaCategory) {
      setSubmitError('Employee, destination country, and visa category are required.');
      return;
    }
    const countryReq = visaCountryRequirements.find(
      (r) => r.country === formData.destinationCountry && r.visaCategory === formData.visaCategory,
    );
    const newCase: VisaMedicalCase = {
      id: `vm-demo-${Date.now()}`,
      caseReference: `VM-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(demoCases.length + 4).padStart(3, '0')}`,
      employeeName: formData.employeeName || '',
      employeeId: formData.employeeId || '',
      companyName: formData.companyName || '',
      destinationCountry: formData.destinationCountry || '',
      visaCategory: formData.visaCategory || '',
      status: 'Requested',
      requirements: countryReq?.requirements || [],
      checklistProgress: {},
      appointmentId: null,
      appointmentDate: null,
      providerName: '',
      questionnaireStatus: 'Not Started',
      clinicianReviewNotes: '',
      certificateIssued: false,
      certificateExpiryDate: null,
      followUpDate: null,
      requestedBy: formData.requestedBy || user?.name || '',
      requestedAt: new Date().toISOString(),
      completedAt: null,
      auditTrail: [
        { id: `va-${Date.now()}`, timestamp: new Date().toISOString(), action: 'Visa medical requested', actor: formData.requestedBy || user?.name || '' },
      ],
    };
    setDemoCases((prev) => [...prev, newCase]);
    setShowForm(false);
    setFormData(emptyForm);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const updateCaseStatus = (caseId: string, newStatus: VisaMedicalStatus) => {
    const update = (c: VisaMedicalCase): VisaMedicalCase => {
      if (c.id !== caseId) return c;
      return {
        ...c,
        status: newStatus,
        completedAt: newStatus === 'Completed' ? new Date().toISOString() : c.completedAt,
        auditTrail: [
          ...c.auditTrail,
          { id: `va-${Date.now()}`, timestamp: new Date().toISOString(), action: `Status changed to ${newStatus}`, actor: user?.name || 'Clinician' },
        ],
      };
    };
    setDemoCases((prev) => {
      const existing = prev.find((c) => c.id === caseId);
      if (existing) return prev.map(update);
      const baseCase = visaMedicalCases.find((c) => c.id === caseId);
      if (baseCase) return [...prev, update(baseCase)];
      return prev;
    });
    if (selectedCase?.id === caseId) {
      setSelectedCase((prev) => prev ? { ...update(prev) } : prev);
    }
  };

  const toggleChecklistItem = (caseId: string, reqId: string) => {
    const update = (c: VisaMedicalCase): VisaMedicalCase => {
      if (c.id !== caseId) return c;
      const current = c.checklistProgress[reqId] || false;
      return {
        ...c,
        checklistProgress: { ...c.checklistProgress, [reqId]: !current },
      };
    };
    setDemoCases((prev) => {
      const existing = prev.find((c) => c.id === caseId);
      if (existing) return prev.map(update);
      const baseCase = visaMedicalCases.find((c) => c.id === caseId);
      if (baseCase) return [...prev, update(baseCase)];
      return prev;
    });
    if (selectedCase?.id === caseId) {
      setSelectedCase((prev) => prev ? { ...update(prev) } : prev);
    }
  };

  // --- Detail view ---
  if (selectedCase) {
    const vc = selectedCase;
    const countryReq = visaCountryRequirements.find(
      (r) => r.country === vc.destinationCountry && r.visaCategory === vc.visaCategory,
    );
    const completedReqs = vc.requirements.filter((r) => vc.checklistProgress[r.id]).length;
    const totalReqs = vc.requirements.length || 1;
    const checklistPct = Math.round((completedReqs / totalReqs) * 100);

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <button onClick={() => setSelectedCase(null)} className="btn-secondary">
            <ArrowLeft size={16} /> Back to Visa Medicals
          </button>
          <Badge color={statusColors[vc.status]} dot>{vc.status}</Badge>
        </div>

        {isDemoMode && (
          <div className="p-3 bg-warning-50 text-warning-700 text-sm rounded-lg flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            Demo mode — changes to this visa medical case are stored locally only and will not be saved as live records.
          </div>
        )}

        {/* Header */}
        <div className="card overflow-hidden">
          <div className="h-20 bg-gradient-to-br from-brand-600 to-brand-900" />
          <div className="p-5 lg:p-6 -mt-8">
            <div className="flex items-end gap-4">
              <div className="h-16 w-16 rounded-2xl bg-white border-4 border-white shadow-lg flex items-center justify-center">
                <Globe size={28} className="text-brand-600" />
              </div>
              <div className="mb-1">
                <h2 className="text-xl font-display font-bold text-ink-900">{vc.caseReference}</h2>
                <p className="text-sm text-ink-500">{vc.employeeName} — {vc.destinationCountry} ({vc.visaCategory})</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Case details */}
          <div className="card p-5">
            <h3 className="font-display font-bold text-ink-900 mb-4">Case Details</h3>
            <div className="space-y-3">
              <DetailRow icon={User} label="Employee" value={vc.employeeName} />
              <DetailRow icon={Building2} label="Company" value={vc.companyName} />
              <DetailRow icon={Globe} label="Destination" value={`${vc.destinationCountry} — ${vc.visaCategory}`} />
              <DetailRow icon={Calendar} label="Appointment" value={vc.appointmentDate || 'Not booked'} />
              <DetailRow icon={User} label="Provider" value={vc.providerName || 'Not assigned'} />
              <div className="flex items-center justify-between py-2 border-b border-ink-100">
                <span className="flex items-center gap-2 text-sm text-ink-500"><ClipboardList size={15} /> Questionnaire</span>
                <Badge color={
                  vc.questionnaireStatus === 'Completed' ? 'success' :
                  vc.questionnaireStatus === 'Submitted' || vc.questionnaireStatus === 'Under Review' ? 'brand' :
                  vc.questionnaireStatus === 'Draft' ? 'warning' : 'ink'
                } dot>{vc.questionnaireStatus}</Badge>
              </div>
              <DetailRow icon={User} label="Requested by" value={vc.requestedBy} />
              <DetailRow icon={Clock} label="Requested at" value={new Date(vc.requestedAt).toLocaleString()} />
              {vc.completedAt && <DetailRow icon={Check} label="Completed at" value={new Date(vc.completedAt).toLocaleString()} />}
            </div>
          </div>

          {/* Certificate & follow-up */}
          <div className="card p-5">
            <h3 className="font-display font-bold text-ink-900 mb-4">Certificate & Follow-up</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b border-ink-100">
                <span className="flex items-center gap-2 text-sm text-ink-500"><Award size={15} /> Certificate issued</span>
                <Badge color={vc.certificateIssued ? 'success' : 'ink'}>{vc.certificateIssued ? 'Yes' : 'No'}</Badge>
              </div>
              <DetailRow icon={Calendar} label="Certificate expiry" value={vc.certificateExpiryDate || 'Not issued'} />
              <DetailRow icon={Calendar} label="Follow-up date" value={vc.followUpDate || 'None'} />
              {vc.clinicianReviewNotes && (
                <div className="pt-3 border-t border-ink-100">
                  <p className="text-xs font-semibold text-ink-400 uppercase tracking-wider mb-1">Clinician Review Notes</p>
                  <p className="text-sm text-ink-700 leading-relaxed">{vc.clinicianReviewNotes}</p>
                </div>
              )}
              <div className="p-3 bg-brand-50 text-brand-700 text-xs rounded-lg flex items-start gap-2">
                <Info size={14} className="mt-0.5 shrink-0" />
                <span>Completing a medical does not guarantee visa approval. The destination country's embassy or immigration authority makes the final decision.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Requirements checklist */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold text-ink-900">Requirements Checklist</h3>
            <span className="text-sm font-semibold text-ink-600">{completedReqs}/{vc.requirements.length} completed ({checklistPct}%)</span>
          </div>
          {vc.requirements.length === 0 ? (
            <p className="text-sm text-ink-500">No specific requirements configured for this destination and visa category.</p>
          ) : (
            <div className="space-y-2">
              {vc.requirements.map((req) => {
                const ReqIcon = reqTypeIcons[req.type] || FileText;
                const isChecked = vc.checklistProgress[req.id] || false;
                return (
                  <div key={req.id} className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${isChecked ? 'bg-success-50 border-success-200' : 'bg-white border-ink-100'}`}>
                    <button
                      onClick={() => isProvider && toggleChecklistItem(vc.id, req.id)}
                      disabled={!isProvider}
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all ${
                        isChecked ? 'bg-success-500 border-success-500' : 'border-ink-300 hover:border-brand-400'
                      } ${isProvider ? 'cursor-pointer' : 'cursor-default'}`}
                    >
                      {isChecked && <Check size={12} className="text-white" />}
                    </button>
                    <ReqIcon size={16} className={isChecked ? 'text-success-600' : 'text-ink-400'} />
                    <span className={`text-sm flex-1 ${isChecked ? 'text-ink-600 line-through' : 'text-ink-800'}`}>{req.name}</span>
                    <Badge color={req.type === 'examination' ? 'brand' : req.type === 'test' ? 'warning' : 'ink'}>
                      {req.type}
                    </Badge>
                    {req.required && <span className="text-xs text-danger-500">Required</span>}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Status management */}
        {isProvider && vc.status !== 'Completed' && (
          <div className="card p-5">
            <h3 className="font-display font-bold text-ink-900 mb-4">Update Status</h3>
            <div className="flex flex-wrap gap-2">
              {allStatuses.filter((s) => s !== vc.status).map((s) => (
                <button
                  key={s}
                  onClick={() => updateCaseStatus(vc.id, s)}
                  className="btn-secondary text-sm"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Audit trail */}
        <div className="card p-5">
          <h3 className="font-display font-bold text-ink-900 mb-4">Audit Trail</h3>
          <div className="space-y-3">
            {vc.auditTrail.map((entry, i) => (
              <div key={entry.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className={`w-2.5 h-2.5 rounded-full ${i === 0 ? 'bg-brand-500' : 'bg-ink-300'}`} />
                  {i < vc.auditTrail.length - 1 && <div className="w-px h-6 bg-ink-200" />}
                </div>
                <div className="pb-1">
                  <p className="text-sm font-medium text-ink-800">{entry.action}</p>
                  <p className="text-xs text-ink-400">{entry.actor} — {new Date(entry.timestamp).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {isDemoMode && (
        <div className="p-3 bg-warning-50 text-warning-700 text-sm rounded-lg flex items-center gap-2">
          <AlertCircle size={16} className="shrink-0" />
          Demo mode — visa medical cases shown are fictional sample data. New cases and changes are stored locally only and not saved as live records.
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-display font-bold text-ink-900">Visa Medicals</h2>
          <p className="text-sm text-ink-500">{filtered.length} visa medical cases</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary" onClick={() => setShowRequirements(true)}>
            <Info size={16} /> Country Requirements
          </button>
          {isProvider && (
            <button className="btn-primary" onClick={() => { setFormData(emptyForm); setShowForm(true); }}>
              <Plus size={16} /> New Visa Medical
            </button>
          )}
        </div>
      </div>

      {/* Status overview cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {allStatuses.slice(0, 4).map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(statusFilter === status ? 'all' : status)}
            className={`card p-3.5 text-left transition-all ${statusFilter === status ? 'ring-2 ring-brand-500 border-brand-300' : 'card-hover'}`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className={`w-2 h-2 rounded-full ${
                statusColors[status] === 'success' ? 'bg-success-500' :
                statusColors[status] === 'warning' ? 'bg-warning-500' :
                statusColors[status] === 'danger' ? 'bg-danger-500' :
                statusColors[status] === 'brand' ? 'bg-brand-500' : 'bg-ink-400'
              }`} />
              <span className="text-xs font-medium text-ink-500">{status}</span>
            </div>
            <p className="text-xl font-bold font-display text-ink-900">{counts[status] || 0}</p>
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {allStatuses.slice(4).map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(statusFilter === status ? 'all' : status)}
            className={`card p-3.5 text-left transition-all ${statusFilter === status ? 'ring-2 ring-brand-500 border-brand-300' : 'card-hover'}`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className={`w-2 h-2 rounded-full ${
                statusColors[status] === 'success' ? 'bg-success-500' :
                statusColors[status] === 'warning' ? 'bg-warning-500' :
                statusColors[status] === 'danger' ? 'bg-danger-500' :
                statusColors[status] === 'brand' ? 'bg-brand-500' : 'bg-ink-400'
              }`} />
              <span className="text-xs font-medium text-ink-500">{status}</span>
            </div>
            <p className="text-xl font-bold font-display text-ink-900">{counts[status] || 0}</p>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
        <input type="text" placeholder="Search by employee, country, case reference, or visa category..." value={search} onChange={(e) => setSearch(e.target.value)} className="input pl-10" />
      </div>

      {/* New case form */}
      {showForm && (
        <div className="card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-ink-900">New Visa Medical Request</h3>
            <button type="button" className="btn-secondary" onClick={() => { setShowForm(false); setFormData(emptyForm); }}><X size={16} /> Cancel</button>
          </div>
          {submitError && <div className="p-3 bg-danger-50 text-danger-700 text-sm rounded-lg">{submitError}</div>}
          <form className="space-y-4" onSubmit={handleCreate}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-ink-700 mb-1">Employee Name *</label>
                <input className="input w-full" value={formData.employeeName || ''} onChange={(e) => setFormData({ ...formData, employeeName: e.target.value })} placeholder="Employee or applicant name" required />
              </div>
              <div>
                <label className="block text-sm font-semibold text-ink-700 mb-1">Company</label>
                <input className="input w-full" value={formData.companyName || ''} onChange={(e) => setFormData({ ...formData, companyName: e.target.value })} placeholder="Company name" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-ink-700 mb-1">Destination Country *</label>
                <div className="relative">
                  <select
                    className="input w-full pr-9 appearance-none cursor-pointer"
                    value={formData.destinationCountry || ''}
                    onChange={(e) => {
                      const country = e.target.value;
                      const matching = visaCountryRequirements.filter((r) => r.country === country);
                      setFormData({
                        ...formData,
                        destinationCountry: country,
                        visaCategory: matching[0]?.visaCategory || '',
                      });
                    }}
                    required
                  >
                    <option value="">Select country...</option>
                    {[...new Set(visaCountryRequirements.map((r) => r.country))].map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-ink-700 mb-1">Visa Category *</label>
                <div className="relative">
                  <select
                    className="input w-full pr-9 appearance-none cursor-pointer"
                    value={formData.visaCategory || ''}
                    onChange={(e) => setFormData({ ...formData, visaCategory: e.target.value })}
                    required
                  >
                    <option value="">Select visa category...</option>
                    {visaCountryRequirements
                      .filter((r) => r.country === formData.destinationCountry)
                      .map((r) => <option key={r.id} value={r.visaCategory}>{r.visaCategory}</option>)}
                  </select>
                  <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-ink-700 mb-1">Requested By</label>
                <input className="input w-full" value={formData.requestedBy || ''} onChange={(e) => setFormData({ ...formData, requestedBy: e.target.value })} placeholder="Requester name" />
              </div>
            </div>
            <div className="p-3 bg-brand-50 text-brand-700 text-xs rounded-lg flex items-start gap-2">
              <Info size={14} className="mt-0.5 shrink-0" />
              <span>Completing a medical does not guarantee visa approval. The destination country's embassy or immigration authority makes the final decision. Requirements shown are illustrative and must be verified with the relevant embassy or panel physician.</span>
            </div>
            <button type="submit" className="btn-primary">
              {saved ? <><Check size={16} /> Created</> : <><Plus size={16} /> Create Visa Medical Case</>}
            </button>
          </form>
        </div>
      )}

      {/* Case list */}
      {filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <Globe size={32} className="text-ink-300 mx-auto mb-3" />
          <p className="text-sm text-ink-500">No visa medical cases found. {isProvider && 'Click "New Visa Medical" to create one.'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((vc) => {
            const completedReqs = vc.requirements.filter((r) => vc.checklistProgress[r.id]).length;
            const totalReqs = vc.requirements.length;
            const checklistPct = totalReqs > 0 ? Math.round((completedReqs / totalReqs) * 100) : 0;
            return (
              <div key={vc.id} className="card card-hover p-4 cursor-pointer" onClick={() => setSelectedCase(vc)}>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white shrink-0">
                      <Globe size={20} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-ink-900">{vc.employeeName}</p>
                      <p className="text-xs text-ink-400 truncate">{vc.caseReference} — {vc.destinationCountry} ({vc.visaCategory})</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 sm:gap-6 flex-wrap">
                    <div className="hidden md:block">
                      <p className="text-xs text-ink-400">Checklist</p>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 bg-ink-100 rounded-full overflow-hidden">
                          <div className="h-full bg-brand-500 rounded-full transition-all" style={{ width: `${checklistPct}%` }} />
                        </div>
                        <span className="text-xs text-ink-500">{completedReqs}/{totalReqs}</span>
                      </div>
                    </div>
                    {vc.appointmentDate && (
                      <div className="hidden lg:block">
                        <p className="text-xs text-ink-400">Appointment</p>
                        <p className="text-sm font-medium text-ink-700 flex items-center gap-1"><Calendar size={12} className="text-ink-400" />{vc.appointmentDate}</p>
                      </div>
                    )}
                    <div className="hidden lg:block">
                      <p className="text-xs text-ink-400">Questionnaire</p>
                      <Badge color={
                        vc.questionnaireStatus === 'Completed' ? 'success' :
                        vc.questionnaireStatus === 'Submitted' || vc.questionnaireStatus === 'Under Review' ? 'brand' :
                        vc.questionnaireStatus === 'Draft' ? 'warning' : 'ink'
                      }>{vc.questionnaireStatus}</Badge>
                    </div>
                    <Badge color={statusColors[vc.status]} dot>{vc.status}</Badge>
                    {vc.certificateIssued && (
                      <span className="hidden sm:flex items-center gap-1 text-xs text-success-600"><ShieldCheck size={12} /> Certified</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Country requirements modal */}
      {showRequirements && (
        <CountryRequirementsPanel onClose={() => setShowRequirements(false)} />
      )}
    </div>
  );
}

function DetailRow({ icon: Icon, label, value }: { icon: typeof User; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-ink-100">
      <span className="flex items-center gap-2 text-sm text-ink-500"><Icon size={15} /> {label}</span>
      <span className="font-semibold text-ink-900 text-sm text-right">{value}</span>
    </div>
  );
}

function CountryRequirementsPanel({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-ink-100 p-5 flex items-center justify-between">
          <div>
            <h3 className="font-display font-bold text-ink-900">Country-Specific Visa Requirements</h3>
            <p className="text-xs text-ink-500">Illustrative demo data — unverified. Must be confirmed with the relevant embassy or approved panel physician.</p>
          </div>
          <button onClick={onClose} className="btn-ghost p-2"><X size={18} /></button>
        </div>
        <div className="p-5 space-y-4">
          {visaCountryRequirements.map((req: VisaCountryRequirement) => (
            <div key={req.id} className="border border-ink-100 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-semibold text-ink-900">{req.country} — {req.visaCategory}</p>
                </div>
                <Badge color={req.reviewStatus === 'Current' ? 'success' : req.reviewStatus === 'Needs Review' ? 'warning' : 'ink'}>
                  {req.reviewStatus}
                </Badge>
              </div>
              <div className="space-y-1 mb-3">
                {req.requirements.map((r) => {
                  const ReqIcon = reqTypeIcons[r.type] || FileText;
                  return (
                    <div key={r.id} className="flex items-center gap-2 text-sm text-ink-700">
                      <ReqIcon size={14} className="text-ink-400" />
                      <span>{r.name}</span>
                      {r.required && <span className="text-xs text-danger-500">*</span>}
                    </div>
                  );
                })}
              </div>
              <div className="text-xs text-ink-500 space-y-1">
                {req.validityDays && <p>Validity: {req.validityDays} days from issue</p>}
                <p>Last verified: {req.lastVerified}</p>
                <p>Responsible admin: {req.responsibleAdmin}</p>
                <p className="text-ink-400 italic mt-1">{req.source}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
