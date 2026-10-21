import { useState, useMemo, useCallback } from 'react';
import {
  HeartPulse,
  Plus,
  ArrowLeft,
  AlertCircle,
  Save,
  Check,
  ShieldAlert,
  Activity,
  Calendar,
  User,
  Building2,
  X,
  ChevronDown,
  Search,
  Clock,
  ClipboardList,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import {
  useSicknessCases,
  useRiskAssessments,
  useEmployees,
  useCompanies,
  isDemoMode,
} from '@/hooks/useSupabaseData';
import { Badge } from '@/components/Badge';
import type { SicknessAbsenceCase, SicknessCaseStatus, SicknessRiskAssessment } from '@/types';

const caseStatuses: SicknessCaseStatus[] = [
  'Referral Received',
  'Initial Review',
  'Information Gathering',
  'Risk Assessment',
  'Case Management',
  'Accommodation Planning',
  'RTW Review',
  'Follow-up',
  'Closed',
];

const statusColors: Record<string, 'warning' | 'brand' | 'success' | 'danger' | 'ink' | 'teal'> = {
  'Referral Received': 'warning',
  'Initial Review': 'brand',
  'Information Gathering': 'brand',
  'Risk Assessment': 'danger',
  'Case Management': 'brand',
  'Accommodation Planning': 'teal',
  'RTW Review': 'success',
  'Follow-up': 'warning',
  'Closed': 'ink',
};

const severityColors: Record<string, 'success' | 'warning' | 'danger'> = {
  Low: 'success',
  Medium: 'warning',
  High: 'danger',
};

function computeRiskLevel(severity: string, likelihood: string): string {
  const sevMap: Record<string, number> = { Low: 1, Medium: 2, High: 3 };
  const likMap: Record<string, number> = { Low: 1, Medium: 2, High: 3 };
  const score = (sevMap[severity] || 1) * (likMap[likelihood] || 1);
  if (score >= 6) return 'High';
  if (score >= 3) return 'Medium';
  return 'Low';
}

const emptyForm: Partial<SicknessAbsenceCase> = {
  caseReference: '',
  employeeName: '',
  companyName: '',
  referralDate: '',
  referringPerson: '',
  referralTrigger: '',
  injuryOnDuty: false,
  incidentDate: '',
  absenceStartDate: '',
  expectedReturnDate: '',
  caseStatus: 'Referral Received',
  jobDuties: '',
  functionalLimitations: '',
  workplaceAccommodations: '',
  caseManager: '',
};

export function SicknessAbsence() {
  const { user } = useApp();
  const { data: dbCases, loading, error, addCase, updateCase } = useSicknessCases();
  const { data: employees } = useEmployees();
  const { data: companies } = useCompanies();

  // Local demo state: when in demo mode, mutations update local state only
  const [demoCases, setDemoCases] = useState<SicknessAbsenceCase[]>([]);
  const [demoRiskAssessments, setDemoRiskAssessments] = useState<Record<string, SicknessRiskAssessment[]>>({});

  const cases = useMemo(() => {
    if (isDemoMode && demoCases.length > 0) {
      const baseIds = new Set(dbCases.map((c) => c.id));
      const added = demoCases.filter((c) => !baseIds.has(c.id));
      const updated = dbCases.map((c) => demoCases.find((d) => d.id === c.id) || c);
      return [...updated, ...added];
    }
    return dbCases;
  }, [dbCases, demoCases]);

  const [selectedCase, setSelectedCase] = useState<SicknessAbsenceCase | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<Partial<SicknessAbsenceCase>>(emptyForm);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Risk assessment form state
  const [riskSeverity, setRiskSeverity] = useState('Low');
  const [riskLikelihood, setRiskLikelihood] = useState('Low');
  const [riskNotes, setRiskNotes] = useState('');
  const [riskReviewDate, setRiskReviewDate] = useState('');
  const [riskPerson, setRiskPerson] = useState('');
  const [riskError, setRiskError] = useState<string | null>(null);

  // Case update state
  const [updateStatus, setUpdateStatus] = useState<SicknessCaseStatus>('Referral Received');
  const [updateAccommodations, setUpdateAccommodations] = useState('');
  const [updateLimitations, setUpdateLimitations] = useState('');
  const [updateExpectedReturn, setUpdateExpectedReturn] = useState('');
  const [updateActualReturn, setUpdateActualReturn] = useState('');
  const [updateCaseManager, setUpdateCaseManager] = useState('');
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [updateSaved, setUpdateSaved] = useState(false);

  const { data: riskAssessments, addAssessment } = useRiskAssessments(selectedCase?.id ?? null);

  // In demo mode, use local risk assessments instead of the DB-backed hook
  const currentRiskAssessments = isDemoMode
    ? (selectedCase ? (demoRiskAssessments[selectedCase.id] || []) : [])
    : riskAssessments;

  const handleEmployeeSelect = (empId: string) => {
    const emp = employees.find((e) => e.id === empId);
    if (emp) {
      setFormData({ ...formData, employeeName: emp.name, companyName: emp.companyName });
    }
  };

  const generateCaseRef = () => {
    const date = new Date();
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const rand = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `SA-${yyyy}${mm}${dd}-${rand}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    if (!formData.employeeName?.trim()) {
      setSubmitError('Please select or enter an employee name.');
      return;
    }
    setSubmitting(true);
    try {
      const caseData = { ...formData };
      if (!caseData.caseReference) {
        caseData.caseReference = generateCaseRef();
      }
      if (isDemoMode) {
        const newCase: SicknessAbsenceCase = {
          id: `demo-case-${Date.now()}`,
          caseReference: caseData.caseReference || '',
          employeeName: caseData.employeeName || '',
          companyName: caseData.companyName || '',
          referralDate: caseData.referralDate || '',
          referringPerson: caseData.referringPerson || '',
          referralTrigger: caseData.referralTrigger || '',
          injuryOnDuty: caseData.injuryOnDuty || false,
          incidentDate: caseData.incidentDate || '',
          absenceStartDate: caseData.absenceStartDate || '',
          expectedReturnDate: caseData.expectedReturnDate || '',
          actualReturnDate: caseData.actualReturnDate || null,
          caseStatus: caseData.caseStatus || 'Referral Received',
          jobDuties: caseData.jobDuties || '',
          functionalLimitations: caseData.functionalLimitations || '',
          workplaceAccommodations: caseData.workplaceAccommodations || '',
          caseManager: caseData.caseManager || '',
          reviewDate: null,
          closureDate: null,
          closureReason: null,
        };
        setDemoCases((prev) => [...prev, newCase]);
      } else {
        await addCase(caseData);
      }
      setShowForm(false);
      setFormData(emptyForm);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to create case');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateCase = async () => {
    if (!selectedCase) return;
    setUpdateError(null);
    setSubmitting(true);
    try {
      const updates = {
        caseStatus: updateStatus,
        workplaceAccommodations: updateAccommodations,
        functionalLimitations: updateLimitations,
        expectedReturnDate: updateExpectedReturn,
        actualReturnDate: updateActualReturn || null,
        caseManager: updateCaseManager,
      };
      if (isDemoMode) {
        setDemoCases((prev) => {
          const exists = prev.some((c) => c.id === selectedCase.id);
          if (exists) {
            return prev.map((c) => c.id === selectedCase.id ? { ...c, ...updates } : c);
          }
          return [...prev, { ...selectedCase, ...updates }];
        });
        // Also update selectedCase so the detail view reflects changes
        setSelectedCase({ ...selectedCase, ...updates });
      } else {
        await updateCase(selectedCase.id, updates);
        setSelectedCase({ ...selectedCase, ...updates });
      }
      setUpdateSaved(true);
      setTimeout(() => setUpdateSaved(false), 2000);
    } catch (err) {
      setUpdateError(err instanceof Error ? err.message : 'Failed to update case');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddRisk = async () => {
    if (!selectedCase) return;
    setRiskError(null);
    const assessment: SicknessRiskAssessment = {
      id: `demo-risk-${Date.now()}`,
      caseId: selectedCase.id,
      severity: riskSeverity as 'Low' | 'Medium' | 'High',
      likelihood: riskLikelihood as 'Low' | 'Medium' | 'High',
      riskLevel: computeRiskLevel(riskSeverity, riskLikelihood),
      notes: riskNotes,
      reviewDate: riskReviewDate,
      responsiblePerson: riskPerson,
    };
    if (isDemoMode) {
      setDemoRiskAssessments((prev) => ({
        ...prev,
        [selectedCase.id]: [...(prev[selectedCase.id] || []), assessment],
      }));
      setRiskNotes('');
      setRiskReviewDate('');
      setRiskPerson('');
    } else {
      try {
        await addAssessment({
          severity: riskSeverity as 'Low' | 'Medium' | 'High',
          likelihood: riskLikelihood as 'Low' | 'Medium' | 'High',
          riskLevel: computeRiskLevel(riskSeverity, riskLikelihood),
          notes: riskNotes,
          reviewDate: riskReviewDate,
          responsiblePerson: riskPerson,
        });
        setRiskNotes('');
        setRiskReviewDate('');
        setRiskPerson('');
      } catch (err) {
        setRiskError(err instanceof Error ? err.message : 'Failed to add risk assessment');
      }
    }
  };

  const openCase = (c: SicknessAbsenceCase) => {
    setSelectedCase(c);
    setUpdateStatus(c.caseStatus);
    setUpdateAccommodations(c.workplaceAccommodations);
    setUpdateLimitations(c.functionalLimitations);
    setUpdateExpectedReturn(c.expectedReturnDate);
    setUpdateActualReturn(c.actualReturnDate || '');
    setUpdateCaseManager(c.caseManager);
    setUpdateError(null);
  };

  const filteredCases = useMemo(() => {
    let result = cases;
    if (statusFilter !== 'all') {
      result = result.filter((c) => c.caseStatus === statusFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter((c) =>
        c.caseReference.toLowerCase().includes(q) ||
        c.employeeName.toLowerCase().includes(q) ||
        c.companyName.toLowerCase().includes(q) ||
        c.referralTrigger.toLowerCase().includes(q) ||
        c.caseManager.toLowerCase().includes(q)
      );
    }
    return result;
  }, [cases, statusFilter, search]);

  if (loading) {
    return <div className="flex items-center justify-center py-20"><span className="w-6 h-6 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin" /></div>;
  }

  if (error) {
    return <div className="card p-6 text-center"><AlertCircle size={24} className="text-danger-500 mx-auto mb-2" /><p className="text-sm text-ink-600">Failed to load cases: {error}</p></div>;
  }

  // --- Case detail view ---
  if (selectedCase) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <button onClick={() => setSelectedCase(null)} className="btn-secondary">
            <ArrowLeft size={16} />
            Back to Cases
          </button>
          <Badge color={statusColors[selectedCase.caseStatus] || 'ink'} dot>{selectedCase.caseStatus}</Badge>
        </div>

        {/* Case header */}
        <div className="card overflow-hidden">
          <div className="h-20 bg-gradient-to-br from-brand-600 to-brand-900" />
          <div className="p-5 lg:p-6 -mt-8">
            <div className="flex items-end gap-4">
              <div className="h-16 w-16 rounded-2xl bg-white border-4 border-white shadow-lg flex items-center justify-center">
                <HeartPulse size={28} className="text-brand-600" />
              </div>
              <div className="mb-1">
                <h2 className="text-xl font-display font-bold text-ink-900">{selectedCase.caseReference}</h2>
                <p className="text-sm text-ink-500">{selectedCase.employeeName} — {selectedCase.companyName}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Case details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="card p-5">
            <h3 className="font-display font-bold text-ink-900 mb-4">Case Information</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-ink-100">
                <span className="flex items-center gap-2 text-sm text-ink-500"><User size={15} /> Employee</span>
                <span className="font-semibold text-ink-900">{selectedCase.employeeName}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-ink-100">
                <span className="flex items-center gap-2 text-sm text-ink-500"><Building2 size={15} /> Company</span>
                <span className="font-semibold text-ink-900">{selectedCase.companyName}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-ink-100">
                <span className="flex items-center gap-2 text-sm text-ink-500"><Calendar size={15} /> Referral date</span>
                <span className="font-semibold text-ink-900">{selectedCase.referralDate || 'Not set'}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-ink-100">
                <span className="text-sm text-ink-500">Referring person</span>
                <span className="font-semibold text-ink-900">{selectedCase.referringPerson || 'Not specified'}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-ink-100">
                <span className="text-sm text-ink-500">Referral trigger</span>
                <span className="font-semibold text-ink-900 text-right max-w-[200px]">{selectedCase.referralTrigger || 'Not specified'}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-ink-100">
                <span className="text-sm text-ink-500">Classification</span>
                <Badge color={selectedCase.injuryOnDuty ? 'danger' : 'warning'}>{selectedCase.injuryOnDuty ? 'Injury on Duty' : 'Illness'}</Badge>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-ink-100">
                <span className="text-sm text-ink-500">Incident/illness date</span>
                <span className="font-semibold text-ink-900">{selectedCase.incidentDate || 'Not recorded'}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-ink-100">
                <span className="text-sm text-ink-500">Absence start</span>
                <span className="font-semibold text-ink-900">{selectedCase.absenceStartDate || 'Not set'}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-ink-100">
                <span className="text-sm text-ink-500">Expected return</span>
                <span className="font-semibold text-ink-900">{selectedCase.expectedReturnDate || 'TBD'}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-ink-500">Actual return</span>
                <span className="font-semibold text-ink-900">{selectedCase.actualReturnDate || 'Not yet returned'}</span>
              </div>
            </div>
          </div>

          <div className="card p-5">
            <h3 className="font-display font-bold text-ink-900 mb-4">Workplace Details</h3>
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold text-ink-400 uppercase tracking-wider mb-1">Job Duties</p>
                <p className="text-sm text-ink-700">{selectedCase.jobDuties || 'Not documented'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-ink-400 uppercase tracking-wider mb-1">Functional Limitations</p>
                <p className="text-sm text-ink-700">{selectedCase.functionalLimitations || 'Not documented'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-ink-400 uppercase tracking-wider mb-1">Workplace Accommodations</p>
                <p className="text-sm text-ink-700">{selectedCase.workplaceAccommodations || 'Not documented'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-ink-400 uppercase tracking-wider mb-1">Case Manager</p>
                <p className="text-sm text-ink-700">{selectedCase.caseManager || 'Not assigned'}</p>
              </div>
              {selectedCase.reviewDate && (
                <div>
                  <p className="text-xs font-semibold text-ink-400 uppercase tracking-wider mb-1">Next Review</p>
                  <p className="text-sm text-ink-700">{selectedCase.reviewDate}</p>
                </div>
              )}
              {selectedCase.closureDate && (
                <>
                  <div>
                    <p className="text-xs font-semibold text-ink-400 uppercase tracking-wider mb-1">Closure Date</p>
                    <p className="text-sm text-ink-700">{selectedCase.closureDate}</p>
                  </div>
                  {selectedCase.closureReason && (
                    <div>
                      <p className="text-xs font-semibold text-ink-400 uppercase tracking-wider mb-1">Closure Reason</p>
                      <p className="text-sm text-ink-700">{selectedCase.closureReason}</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Update case */}
        <div className="card p-5">
          <h3 className="font-display font-bold text-ink-900 mb-4 flex items-center gap-2"><Activity size={18} className="text-brand-600" /> Update Case</h3>
          {updateError && <div className="p-3 bg-danger-50 text-danger-700 text-sm rounded-lg mb-4">{updateError}</div>}
          {updateSaved && <div className="p-3 bg-success-50 text-success-700 text-sm rounded-lg mb-4 flex items-center gap-2"><Check size={16} /> Case updated successfully.</div>}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-ink-700 mb-1">Case Status</label>
              <div className="relative">
                <select className="input pr-9 appearance-none cursor-pointer w-full" value={updateStatus} onChange={(e) => setUpdateStatus(e.target.value as SicknessCaseStatus)}>
                  {caseStatuses.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-ink-700 mb-1">Case Manager</label>
              <input className="input w-full" value={updateCaseManager} onChange={(e) => setUpdateCaseManager(e.target.value)} placeholder="Assign case manager" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-ink-700 mb-1">Expected Return Date</label>
              <input className="input w-full" type="date" value={updateExpectedReturn} onChange={(e) => setUpdateExpectedReturn(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-ink-700 mb-1">Actual Return Date</label>
              <input className="input w-full" type="date" value={updateActualReturn} onChange={(e) => setUpdateActualReturn(e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold text-ink-700 mb-1">Functional Limitations</label>
              <input className="input w-full" value={updateLimitations} onChange={(e) => setUpdateLimitations(e.target.value)} placeholder="Documented by authorised clinician" />
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="block text-sm font-semibold text-ink-700 mb-1">Workplace Accommodations</label>
              <textarea className="input w-full min-h-[60px] resize-y" value={updateAccommodations} onChange={(e) => setUpdateAccommodations(e.target.value)} placeholder="Accommodations assigned..." />
            </div>
          </div>
          <button onClick={handleUpdateCase} disabled={submitting} className="btn-primary mt-4">
            {submitting ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Save size={16} /> Save Updates</>}
          </button>
        </div>

        {/* Outstanding actions */}
        <div className="card p-5">
          <h3 className="font-display font-bold text-ink-900 mb-4 flex items-center gap-2"><ClipboardList size={18} className="text-brand-600" /> Outstanding Actions</h3>
          {(() => {
            const actions: { label: string; done: boolean }[] = [];
            if (!selectedCase.caseManager) actions.push({ label: 'Assign a case manager', done: false });
            else actions.push({ label: `Case manager assigned: ${selectedCase.caseManager}`, done: true });
            if (!selectedCase.functionalLimitations) actions.push({ label: 'Document functional limitations', done: false });
            else actions.push({ label: 'Functional limitations documented', done: true });
            if (!selectedCase.workplaceAccommodations) actions.push({ label: 'Define workplace accommodations', done: false });
            else actions.push({ label: 'Workplace accommodations defined', done: true });
            if (!selectedCase.actualReturnDate && selectedCase.caseStatus !== 'Closed') actions.push({ label: 'Record actual return date when employee returns', done: false });
            if (selectedCase.reviewDate && selectedCase.caseStatus !== 'Closed') {
              const isOverdue = new Date(selectedCase.reviewDate) < new Date();
              actions.push({ label: `Review due ${selectedCase.reviewDate}${isOverdue ? ' (overdue)' : ''}`, done: false });
            }
            if (selectedCase.caseStatus === 'Closed' && selectedCase.closureDate) {
              actions.push({ label: `Case closed on ${selectedCase.closureDate}`, done: true });
            }
            const outstanding = actions.filter((a) => !a.done);
            if (outstanding.length === 0) {
              return <p className="text-sm text-success-700 flex items-center gap-2"><Check size={16} /> All required actions completed.</p>;
            }
            return (
              <div className="space-y-2">
                {outstanding.map((a, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-ink-700">
                    <Clock size={14} className="text-warning-500 shrink-0" />
                    {a.label}
                  </div>
                ))}
              </div>
            );
          })()}
        </div>

        {/* Risk assessment */}
        <div className="card p-5">
          <h3 className="font-display font-bold text-ink-900 mb-4 flex items-center gap-2"><ShieldAlert size={18} className="text-danger-600" /> Risk Assessment Matrix</h3>
          <p className="text-xs text-ink-500 mb-4">This assesses workplace / case-management risk, not a clinical diagnosis. The risk level is computed from severity and likelihood. {isDemoMode && 'Demo mode — risk assessments are stored locally only.'}</p>

          {riskError && <div className="p-3 bg-danger-50 text-danger-700 text-sm rounded-lg mb-4">{riskError}</div>}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-semibold text-ink-700 mb-1">Severity</label>
              <select className="input w-full" value={riskSeverity} onChange={(e) => setRiskSeverity(e.target.value)}>
                <option>Low</option><option>Medium</option><option>High</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-ink-700 mb-1">Likelihood</label>
              <select className="input w-full" value={riskLikelihood} onChange={(e) => setRiskLikelihood(e.target.value)}>
                <option>Low</option><option>Medium</option><option>High</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-ink-700 mb-1">Computed Risk</label>
              <div className="h-[42px] flex items-center">
                <Badge color={severityColors[computeRiskLevel(riskSeverity, riskLikelihood)] || 'ink'} dot>{computeRiskLevel(riskSeverity, riskLikelihood)}</Badge>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-ink-700 mb-1">Review Date</label>
              <input className="input w-full" type="date" value={riskReviewDate} onChange={(e) => setRiskReviewDate(e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold text-ink-700 mb-1">Responsible Person</label>
              <input className="input w-full" value={riskPerson} onChange={(e) => setRiskPerson(e.target.value)} placeholder="Who is responsible for review" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold text-ink-700 mb-1">Notes</label>
              <textarea className="input w-full min-h-[60px] resize-y" value={riskNotes} onChange={(e) => setRiskNotes(e.target.value)} placeholder="Explanatory notes..." />
            </div>
          </div>
          <button onClick={handleAddRisk} className="btn-secondary"><Plus size={16} /> Add Risk Assessment</button>

          {/* Existing risk assessments */}
          {currentRiskAssessments.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-xs font-semibold text-ink-400 uppercase tracking-wider">Assessment History</p>
              {currentRiskAssessments.map((ra) => (
                <div key={ra.id} className="p-3 bg-ink-50 rounded-lg">
                  <div className="flex items-center gap-3 mb-1">
                    <Badge color={severityColors[ra.riskLevel] || 'ink'} dot>Risk: {ra.riskLevel}</Badge>
                    <span className="text-xs text-ink-500">Severity: {ra.severity}</span>
                    <span className="text-xs text-ink-500">Likelihood: {ra.likelihood}</span>
                  </div>
                  {ra.notes && <p className="text-sm text-ink-700 mt-1">{ra.notes}</p>}
                  <p className="text-xs text-ink-400 mt-1">{ra.responsiblePerson} · Review: {ra.reviewDate || 'Not set'}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- Case list view ---
  return (
    <div className="space-y-6">
      {isDemoMode && (
        <div className="p-3 bg-warning-50 text-warning-700 text-sm rounded-lg flex items-center gap-2">
          <AlertCircle size={16} className="shrink-0" />
          Demo mode — showing sample sickness absence cases. Changes are local only and will not be saved as live records. Restart the dev server with valid Supabase credentials to enable live data.
        </div>
      )}
      {showForm && (
        <div className="card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-ink-900">New Sickness Absence Case</h3>
            <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}><X size={16} /> Cancel</button>
          </div>
          {submitError && <div className="p-3 bg-danger-50 text-danger-700 text-sm rounded-lg">{submitError}</div>}
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-ink-700 mb-1">Case Reference</label>
                <input className="input w-full" value={formData.caseReference || ''} onChange={(e) => setFormData({ ...formData, caseReference: e.target.value })} placeholder="Auto-generated if left blank" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-ink-700 mb-1">Select Employee *</label>
                <select className="input w-full" onChange={(e) => handleEmployeeSelect(e.target.value)} required>
                  <option value="">Choose employee...</option>
                  {employees.map((e) => <option key={e.id} value={e.id}>{e.name} — {e.companyName}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-ink-700 mb-1">Employee Name *</label>
                <input className="input w-full" value={formData.employeeName || ''} onChange={(e) => setFormData({ ...formData, employeeName: e.target.value })} required placeholder="Employee name" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-ink-700 mb-1">Company</label>
                <select className="input w-full" value={formData.companyName || ''} onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}>
                  <option value="">Select company...</option>
                  {companies.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-ink-700 mb-1">Referral Date</label>
                <input className="input w-full" type="date" value={formData.referralDate || ''} onChange={(e) => setFormData({ ...formData, referralDate: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-ink-700 mb-1">Referring Person</label>
                <input className="input w-full" value={formData.referringPerson || ''} onChange={(e) => setFormData({ ...formData, referringPerson: e.target.value })} placeholder="Who referred the case" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-ink-700 mb-1">Referral Trigger</label>
                <input className="input w-full" value={formData.referralTrigger || ''} onChange={(e) => setFormData({ ...formData, referralTrigger: e.target.value })} placeholder="e.g. Self-referral, Manager referral, Incident report" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-ink-700 mb-1">Classification</label>
                <div className="flex gap-4 mt-2">
                  <label className="flex items-center gap-2 text-sm text-ink-700 cursor-pointer">
                    <input type="radio" name="classification" checked={!formData.injuryOnDuty} onChange={() => setFormData({ ...formData, injuryOnDuty: false })} className="text-brand-600 focus:ring-brand-500" />
                    Illness
                  </label>
                  <label className="flex items-center gap-2 text-sm text-ink-700 cursor-pointer">
                    <input type="radio" name="classification" checked={formData.injuryOnDuty} onChange={() => setFormData({ ...formData, injuryOnDuty: true })} className="text-brand-600 focus:ring-brand-500" />
                    Injury on Duty
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-ink-700 mb-1">Incident/Illness Date</label>
                <input className="input w-full" type="date" value={formData.incidentDate || ''} onChange={(e) => setFormData({ ...formData, incidentDate: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-ink-700 mb-1">Absence Start Date</label>
                <input className="input w-full" type="date" value={formData.absenceStartDate || ''} onChange={(e) => setFormData({ ...formData, absenceStartDate: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-ink-700 mb-1">Expected Return Date</label>
                <input className="input w-full" type="date" value={formData.expectedReturnDate || ''} onChange={(e) => setFormData({ ...formData, expectedReturnDate: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-ink-700 mb-1">Case Manager</label>
                <input className="input w-full" value={formData.caseManager || ''} onChange={(e) => setFormData({ ...formData, caseManager: e.target.value })} placeholder="Assign case manager" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-ink-700 mb-1">Job Duties / Work Demands</label>
                <textarea className="input w-full min-h-[60px] resize-y" value={formData.jobDuties || ''} onChange={(e) => setFormData({ ...formData, jobDuties: e.target.value })} placeholder="Relevant work duties and physical demands" />
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
          <h2 className="text-xl font-display font-bold text-ink-900">Sickness Absence Management</h2>
          <p className="text-sm text-ink-500">{cases.length} case{cases.length !== 1 ? 's' : ''} · Return-to-work case management</p>
        </div>
        <button className="btn-primary" onClick={() => { setFormData({ ...emptyForm, caseReference: generateCaseRef() }); setShowForm(true); }}>
          <Plus size={16} />
          New Case
        </button>
      </div>

      {/* Status overview cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {(['Referral Received', 'Case Management', 'Accommodation Planning', 'RTW Review', 'Closed'] as const).map((status) => {
          const count = cases.filter((c) => c.caseStatus === status).length;
          return (
            <div key={status} className="card p-3.5 text-left">
              <div className="flex items-center gap-2 mb-1">
                <span className={`w-2 h-2 rounded-full ${statusColors[status] === 'success' ? 'bg-success-500' : statusColors[status] === 'warning' ? 'bg-warning-500' : statusColors[status] === 'danger' ? 'bg-danger-500' : statusColors[status] === 'brand' ? 'bg-brand-500' : 'bg-ink-400'}`} />
                <span className="text-xs font-medium text-ink-500">{status}</span>
              </div>
              <p className="text-xl font-bold font-display text-ink-900">{count}</p>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
          <input
            className="input w-full pl-9"
            placeholder="Search by case ref, employee, company or trigger..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className="input sm:w-48" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">All statuses</option>
          {caseStatuses.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {filteredCases.length === 0 ? (
        <div className="card p-12 text-center">
          <HeartPulse size={32} className="text-ink-300 mx-auto mb-3" />
          <p className="text-sm text-ink-500">No sickness absence cases found. Adjust your search or click "New Case" to create one.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredCases.map((c) => (
            <div key={c.id} onClick={() => openCase(c)} className="card card-hover p-4 cursor-pointer">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="h-11 w-11 rounded-xl bg-danger-50 flex items-center justify-center shrink-0">
                    <HeartPulse size={20} className="text-danger-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink-900">{c.caseReference}</p>
                    <p className="text-xs text-ink-400 truncate">{c.employeeName} — {c.companyName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="hidden md:block">
                    <p className="text-xs text-ink-400">Absence start</p>
                    <p className="text-sm font-medium text-ink-700">{c.absenceStartDate || 'Not set'}</p>
                  </div>
                  <div className="hidden lg:block">
                    <p className="text-xs text-ink-400">Expected return</p>
                    <p className="text-sm font-medium text-ink-700">{c.expectedReturnDate || 'TBD'}</p>
                  </div>
                  <div className="hidden lg:block">
                    <p className="text-xs text-ink-400">Classification</p>
                    <Badge color={c.injuryOnDuty ? 'danger' : 'warning'}>{c.injuryOnDuty ? 'Injury' : 'Illness'}</Badge>
                  </div>
                  <Badge color={statusColors[c.caseStatus] || 'ink'} dot>{c.caseStatus}</Badge>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
