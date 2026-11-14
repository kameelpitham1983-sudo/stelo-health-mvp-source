import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  ClipboardList,
  Pin,
  PinOff,
  Calendar,
  Clock,
  Filter,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Users,
  Building2,
  TrendingUp,
  Info,
  Plus,
  StickyNote,
  CheckSquare,
  Square,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { can, canViewCompany } from '@/lib/permissions';
import {
  useCases,
  useAppointments,
  useSynopses,
  useSynopsisNotes,
  useSynopsisFollowUps,
} from '@/hooks/useSupabaseData';
import { Badge } from '@/components/Badge';
import type { CaseRecord, CaseStatus, Appointment } from '@/types';

// --- Status classification ---

const OPEN_STATUSES: CaseStatus[] = [
  'new', 'active', 'overdue', 'on_hold', 'exception',
];

const PENDING_CASE_STATUSES: CaseStatus[] = [
  'awaiting_client_approval', 'awaiting_employee_info',
  'awaiting_appointment', 'awaiting_provider',
  'awaiting_clinical_review', 'awaiting_outcome',
];

const CLOSED_STATUSES: CaseStatus[] = ['completed', 'cancelled'];

const PENDING_APPT_STATUSES = ['Pending', 'Confirmed'];

const STATUS_LABELS: Record<string, string> = {
  new: 'New',
  active: 'Active',
  awaiting_client_approval: 'Awaiting Client Approval',
  awaiting_employee_info: 'Awaiting Employee Info',
  awaiting_appointment: 'Awaiting Appointment',
  awaiting_provider: 'Awaiting Provider',
  awaiting_clinical_review: 'Awaiting Clinical Review',
  awaiting_outcome: 'Awaiting Outcome',
  overdue: 'Overdue',
  completed: 'Completed',
  on_hold: 'On Hold',
  cancelled: 'Cancelled',
  exception: 'Exception',
};

const CASE_TYPE_LABELS: Record<string, string> = {
  pre_employment: 'Pre-Employment',
  periodical: 'Periodical',
  transfer: 'Transfer',
  travel_medical: 'Travel Medical',
  visa_medical: 'Visa Medical',
  lab_request: 'Lab Request',
  specialist_referral: 'Specialist Referral',
  sickness_absence: 'Sickness Absence',
  other: 'Other',
};

// --- localStorage helpers for pinning and scheduled opening dates ---

const PIN_KEY = 'stelo_synopsis_pinned';
const OPENING_KEY = 'stelo_synopsis_opening_dates';

function getPinnedIds(): Set<string> {
  try {
    const raw = localStorage.getItem(PIN_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch { return new Set(); }
}

function setPinnedIds(ids: Set<string>) {
  localStorage.setItem(PIN_KEY, JSON.stringify([...ids]));
}

function getOpeningDates(): Record<string, string> {
  try {
    const raw = localStorage.getItem(OPENING_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function setOpeningDates(map: Record<string, string>) {
  localStorage.setItem(OPENING_KEY, JSON.stringify(map));
}

function defaultOpeningDate(apptDate: string | null): string | null {
  if (!apptDate) return null;
  const d = new Date(apptDate);
  d.setDate(d.getDate() - 14);
  return d.toISOString().slice(0, 10);
}

function isEligibleToday(openingDate: string | null): boolean {
  if (!openingDate) return true;
  const today = new Date().toISOString().slice(0, 10);
  return openingDate <= today;
}

// --- Date formatting ---

function fmtDate(d: string | null | undefined): string {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }); }
  catch { return d; }
}

function fmtDateTime(d: string | null | undefined): string {
  if (!d) return '—';
  try { return new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }); }
  catch { return d; }
}

function fmtTime(t: string | null | undefined): string {
  if (!t) return '';
  return t;
}

// --- Priority badge ---

function PriorityBadge({ priority }: { priority: string }) {
  const color = priority === 'urgent' ? 'danger' : priority === 'high' ? 'warning' : priority === 'medium' ? 'brand' : 'success';
  return <Badge color={color as 'danger' | 'warning' | 'brand' | 'success'}>{priority}</Badge>;
}

function StatusBadge({ status }: { status: string }) {
  if (CLOSED_STATUSES.includes(status as CaseStatus)) return <Badge color="success" dot>{STATUS_LABELS[status] || status}</Badge>;
  if (status === 'overdue') return <Badge color="danger" dot>{STATUS_LABELS[status] || status}</Badge>;
  if (status === 'exception') return <Badge color="danger" dot>{STATUS_LABELS[status] || status}</Badge>;
  if (PENDING_CASE_STATUSES.includes(status as CaseStatus)) return <Badge color="warning" dot>{STATUS_LABELS[status] || status}</Badge>;
  return <Badge color="brand" dot>{STATUS_LABELS[status] || status}</Badge>;
}

// --- Filters ---

interface SynopsisFilters {
  showOpen: boolean;
  showPending: boolean;
  showPinned: boolean;
  companyId: string;
  caseType: string;
  dateFrom: string;
  dateTo: string;
}

const DEFAULT_FILTERS: SynopsisFilters = {
  showOpen: true,
  showPending: true,
  showPinned: false,
  companyId: '',
  caseType: '',
  dateFrom: '',
  dateTo: '',
};

// --- Main component ---

export function Synopsis() {
  const { user, setPage } = useApp();
  const { data: cases, loading: casesLoading, error: casesError } = useCases();
  const { data: appointments, loading: apptLoading, error: apptError } = useAppointments();
  const { data: synopses, addSynopsis, updateSynopsis } = useSynopses();

  const [reportGenerated, setReportGenerated] = useState(false);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [filters, setFilters] = useState<SynopsisFilters>(DEFAULT_FILTERS);
  const [showFilters, setShowFilters] = useState(false);
  const [pinnedIds, setPinnedIds] = useState<Set<string>>(new Set());
  const [openingDates, setOpeningDates] = useState<Record<string, string>>({});
  const [openingDateModalId, setOpeningDateModalId] = useState<string | null>(null);
  const [openingDateInput, setOpeningDateInput] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  // Meeting notes state (for saved synopsis records)
  const [selectedSynopsisId, setSelectedSynopsisId] = useState<string | null>(null);
  const { data: notes, addNote } = useSynopsisNotes(selectedSynopsisId);
  const { data: followUps, addFollowUp, toggleFollowUp } = useSynopsisFollowUps(selectedSynopsisId);
  const [noteText, setNoteText] = useState('');
  const [fuAction, setFuAction] = useState('');
  const [fuPerson, setFuPerson] = useState('');
  const [fuDue, setFuDue] = useState('');

  useEffect(() => {
    setPinnedIds(getPinnedIds());
    setOpeningDates(getOpeningDates());
  }, []);

  const showNotice = useCallback((msg: string) => {
    setSavedNotice(msg);
    setTimeout(() => setSavedNotice(null), 2500);
  }, []);

  const togglePin = useCallback((id: string) => {
    setPinnedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      setPinnedIds(next);
      return next;
    });
  }, []);

  const saveOpeningDate = useCallback((id: string, date: string) => {
    setOpeningDates(prev => {
      const next = { ...prev };
      if (date) next[id] = date; else delete next[id];
      setOpeningDates(next);
      return next;
    });
    setOpeningDateModalId(null);
  }, []);

  const handleRunSynopsis = useCallback(() => {
    setReportGenerated(true);
    setGeneratedAt(new Date().toISOString());
    setActionError(null);
  }, []);

  const handleAddNote = useCallback(async () => {
    if (!noteText.trim() || !selectedSynopsisId) return;
    try {
      await addNote(noteText.trim(), user?.name || 'Unknown');
      setNoteText('');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to add note');
    }
  }, [noteText, selectedSynopsisId, addNote, user]);

  const handleAddFollowUp = useCallback(async () => {
    if (!fuAction.trim() || !selectedSynopsisId) return;
    try {
      await addFollowUp(fuAction.trim(), fuPerson.trim(), fuDue || null);
      setFuAction(''); setFuPerson(''); setFuDue('');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to add follow-up');
    }
  }, [fuAction, selectedSynopsisId, addFollowUp, fuPerson, fuDue]);

  // Filter cases by company access for employers
  const visibleCases = useMemo(() => {
    return cases.filter(c => canViewCompany(user, c.companyId));
  }, [cases, user]);

  // Filter appointments by company - appointments have companyName but not companyId
  // We match by company name to the visible companies
  const visibleCompanyNames = useMemo(() => {
    const names = new Set(visibleCases.map(c => c.companyName).filter(Boolean));
    return names;
  }, [visibleCases]);

  const visibleAppointments = useMemo(() => {
    if (!user) return [];
    if (user.role === 'employer') {
      return appointments.filter(a => {
        // Match appointment company name to cases from same company
        return visibleCompanyNames.has(a.companyName) || visibleCases.some(c => c.companyName === a.companyName);
      });
    }
    return appointments;
  }, [appointments, user, visibleCompanyNames, visibleCases]);

  // Apply filters
  const filterCase = useCallback((c: CaseRecord) => {
    if (filters.companyId && c.companyId !== filters.companyId) return false;
    if (filters.caseType && c.caseType !== filters.caseType) return false;
    if (filters.dateFrom && c.dateOpened < filters.dateFrom) return false;
    if (filters.dateTo && c.dateOpened > filters.dateTo) return false;
    return true;
  }, [filters]);

  // Classify cases into open / pending / closed
  const openCases = useMemo(() => {
    return visibleCases.filter(c => {
      if (!OPEN_STATUSES.includes(c.status)) return false;
      if (!filterCase(c)) return false;
      // Check scheduled opening date eligibility
      const openingDate = openingDates[c.id];
      if (openingDate && !isEligibleToday(openingDate)) return false;
      return true;
    }).sort((a, b) => {
      // Sort: pinned first, then by priority, then by date opened
      const aPinned = pinnedIds.has(a.id) ? 0 : 1;
      const bPinned = pinnedIds.has(b.id) ? 0 : 1;
      if (aPinned !== bPinned) return aPinned - bPinned;
      const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
      const aP = priorityOrder[a.priority as keyof typeof priorityOrder] ?? 2;
      const bP = priorityOrder[b.priority as keyof typeof priorityOrder] ?? 2;
      if (aP !== bP) return aP - bP;
      return (b.dateOpened || '').localeCompare(a.dateOpened || '');
    });
  }, [visibleCases, filterCase, openingDates, pinnedIds]);

  const pendingCases = useMemo(() => {
    return visibleCases.filter(c => {
      if (!PENDING_CASE_STATUSES.includes(c.status)) return false;
      if (!filterCase(c)) return false;
      return true;
    }).sort((a, b) => (b.dateOpened || '').localeCompare(a.dateOpened || ''));
  }, [visibleCases, filterCase]);

  const pinnedRecords = useMemo(() => {
    return visibleCases.filter(c => pinnedIds.has(c.id) && !CLOSED_STATUSES.includes(c.status));
  }, [visibleCases, pinnedIds]);

  // Pending appointments - upcoming, not completed/cancelled/no-show
  const todayStr = new Date().toISOString().slice(0, 10);
  const pendingAppointments = useMemo(() => {
    return visibleAppointments.filter(a => {
      if (!PENDING_APPT_STATUSES.includes(a.status)) return false;
      // Only future or today appointments
      if (a.date && a.date < todayStr) return false;
      if (filters.companyId) {
        // Match by company name since appointments don't have companyId
        const matchingCase = visibleCases.find(c => c.companyId === filters.companyId && c.companyName === a.companyName);
        if (!matchingCase) return false;
      }
      return true;
    }).sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  }, [visibleAppointments, todayStr, filters.companyId, visibleCases]);

  // Check if a pending case is already in openCases (to avoid duplication in pending section)
  const openCaseIds = useMemo(() => new Set(openCases.map(c => c.id)), [openCases]);

  // Combined pending list: pending cases not already in open + pending appointments
  const pendingItems = useMemo(() => {
    const caseItems = pendingCases
      .filter(c => !openCaseIds.has(c.id))
      .map(c => ({
        kind: 'case' as const,
        id: c.id,
        employeeName: c.employeeName || '—',
        companyName: c.companyName,
        reference: c.caseReference,
        status: STATUS_LABELS[c.status] || c.status,
        date: c.nextActionDueDate || c.targetCompletionDate || null,
        time: '',
        type: CASE_TYPE_LABELS[c.caseType] || c.caseType,
        caseId: c.id,
      }));

    const apptItems = pendingAppointments.map(a => ({
      kind: 'appointment' as const,
      id: a.id,
      employeeName: a.employeeName,
      companyName: a.companyName,
      reference: 'APPT',
      status: a.status,
      date: a.date || null,
      time: a.time || '',
      type: a.type,
      caseId: null,
    }));

    return [...caseItems, ...apptItems].sort((a, b) => {
      const aDate = a.date || '9999';
      const bDate = b.date || '9999';
      return aDate.localeCompare(bDate);
    });
  }, [pendingCases, openCaseIds, pendingAppointments]);

  // Companies for filter dropdown
  const companies = useMemo(() => {
    const map = new Map<string, string>();
    visibleCases.forEach(c => { if (c.companyId && c.companyName) map.set(c.companyId, c.companyName); });
    return [...map].map(([id, name]) => ({ id, name }));
  }, [visibleCases]);

  const caseTypes = useMemo(() => {
    const set = new Set(visibleCases.map(c => c.caseType));
    return [...set];
  }, [visibleCases]);

  // Apply showPinned filter override
  const displayOpenCases = filters.showPinned ? openCases.filter(c => pinnedIds.has(c.id)) : (filters.showOpen ? openCases : []);
  const displayPending = filters.showPinned ? [] : (filters.showPending ? pendingItems : []);

  const loading = casesLoading || apptLoading;
  const error = casesError || apptError;

  // Selected saved synopsis for meeting notes
  const selectedSynopsis = synopses.find(s => s.id === selectedSynopsisId) || null;
  const canReview = can(user, 'medical.clinical_review');

  if (loading && !reportGenerated) {
    return <div className="flex items-center justify-center py-20"><span className="w-6 h-6 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin" /></div>;
  }

  if (error && !reportGenerated) {
    return <div className="card p-6 text-center"><AlertCircle size={24} className="text-danger-500 mx-auto mb-2" /><p className="text-sm text-ink-600">Failed to load data: {error}</p></div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-display font-bold text-ink-900">Synopsis</h2>
          <p className="text-sm text-ink-500">Morning case-management briefing report</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowFilters(s => !s)} className="btn-secondary">
            <Filter size={16} /> Filters
          </button>
          <button onClick={handleRunSynopsis} className="btn-primary">
            <RefreshCw size={16} /> Run Synopsis
          </button>
        </div>
      </div>

      {/* Database dependency notice */}
      <div className="card p-4 border-brand-200 bg-gradient-to-br from-brand-50/50 to-white">
        <div className="flex items-start gap-3">
          <Info size={18} className="text-brand-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-ink-800">Operational report mode</p>
            <p className="text-xs text-ink-600 mt-0.5">This report shows open cases, pending appointments, and pinned records from live application data. Case pinning and scheduled opening dates are stored locally in your browser — a database column for these features is documented as a pending dependency for approval.</p>
          </div>
        </div>
      </div>

      {savedNotice && (
        <div className="p-3 bg-success-50 text-success-700 text-sm rounded-lg flex items-center gap-2"><CheckCircle2 size={16} /> {savedNotice}</div>
      )}
      {actionError && (
        <div className="p-3 bg-danger-50 text-danger-700 text-sm rounded-lg flex items-center gap-2"><AlertCircle size={16} /> {actionError}</div>
      )}

      {/* Filters panel */}
      {showFilters && (
        <div className="card p-5">
          <h3 className="font-display font-bold text-ink-900 mb-3 flex items-center gap-2"><Filter size={16} className="text-brand-600" /> Filters</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-ink-500 mb-1">Sections</label>
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 text-sm text-ink-700">
                  <input type="checkbox" checked={filters.showOpen} onChange={e => setFilters(f => ({ ...f, showOpen: e.target.checked }))} className="rounded border-ink-300" /> Open cases
                </label>
                <label className="flex items-center gap-2 text-sm text-ink-700">
                  <input type="checkbox" checked={filters.showPending} onChange={e => setFilters(f => ({ ...f, showPending: e.target.checked }))} className="rounded border-ink-300" /> Pending
                </label>
                <label className="flex items-center gap-2 text-sm text-ink-700">
                  <input type="checkbox" checked={filters.showPinned} onChange={e => setFilters(f => ({ ...f, showPinned: e.target.checked, showOpen: !e.target.checked, showPending: !e.target.checked }))} className="rounded border-ink-300" /> Pinned only
                </label>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink-500 mb-1">Company</label>
              <select className="input w-full text-sm" value={filters.companyId} onChange={e => setFilters(f => ({ ...f, companyId: e.target.value }))}>
                <option value="">All companies</option>
                {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink-500 mb-1">Case type</label>
              <select className="input w-full text-sm" value={filters.caseType} onChange={e => setFilters(f => ({ ...f, caseType: e.target.value }))}>
                <option value="">All types</option>
                {caseTypes.map(t => <option key={t} value={t}>{CASE_TYPE_LABELS[t] || t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink-500 mb-1">Date range (opened)</label>
              <div className="flex gap-2">
                <input type="date" className="input flex-1 text-sm" value={filters.dateFrom} onChange={e => setFilters(f => ({ ...f, dateFrom: e.target.value }))} />
                <input type="date" className="input flex-1 text-sm" value={filters.dateTo} onChange={e => setFilters(f => ({ ...f, dateTo: e.target.value }))} />
              </div>
            </div>
          </div>
          <div className="mt-3 flex justify-end">
            <button onClick={() => setFilters(DEFAULT_FILTERS)} className="text-xs text-brand-600 hover:text-brand-700 font-semibold">Reset filters</button>
          </div>
        </div>
      )}

      {/* Report */}
      {reportGenerated ? (
        <div className="space-y-6">
          {/* Report header */}
          <div className="card p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-brand-50 flex items-center justify-center">
                  <ClipboardList size={20} className="text-brand-600" />
                </div>
                <div>
                  <h3 className="text-lg font-display font-bold text-ink-900">Synopsis Report</h3>
                  <p className="text-xs text-ink-400">Generated {fmtDateTime(generatedAt)}</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 mt-5">
              <div className="p-3 bg-brand-50 rounded-lg text-center">
                <p className="text-2xl font-display font-bold text-brand-700">{displayOpenCases.length}</p>
                <p className="text-xs text-ink-500 mt-0.5">Open cases</p>
              </div>
              <div className="p-3 bg-warning-50 rounded-lg text-center">
                <p className="text-2xl font-display font-bold text-warning-700">{displayPending.length}</p>
                <p className="text-xs text-ink-500 mt-0.5">Pending items</p>
              </div>
              <div className="p-3 bg-ink-50 rounded-lg text-center">
                <p className="text-2xl font-display font-bold text-ink-700">{pinnedRecords.length}</p>
                <p className="text-xs text-ink-500 mt-0.5">Pinned records</p>
              </div>
            </div>
          </div>

          {/* Open Cases section */}
          <div className="card p-5">
            <h3 className="font-display font-bold text-ink-900 mb-4 flex items-center gap-2">
              <AlertCircle size={18} className="text-brand-600" /> Open Cases — Detailed Summary
            </h3>
            {displayOpenCases.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle2 size={32} className="text-success-400 mx-auto mb-2" />
                <p className="text-sm text-ink-400">No open cases require attention.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {displayOpenCases.map(c => {
                  const isPinned = pinnedIds.has(c.id);
                  const openingDate = openingDates[c.id] || null;
                  return (
                    <div key={c.id} className={`p-4 rounded-lg border ${isPinned ? 'border-brand-300 bg-brand-50/30' : 'border-ink-100'} hover:border-brand-200 transition-colors`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <p className="text-sm font-semibold text-ink-900">{c.employeeName || '—'}</p>
                            <StatusBadge status={c.status} />
                            <PriorityBadge priority={c.priority} />
                            {isPinned && <Badge color="brand" dot><Pin size={10} className="inline" /> Pinned</Badge>}
                          </div>
                          <p className="text-xs text-ink-500 mb-2">{c.companyName} · {c.caseReference} · {CASE_TYPE_LABELS[c.caseType] || c.caseType}</p>
                          {c.description && <p className="text-sm text-ink-600 mb-2">{c.description}</p>}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs text-ink-500">
                            {c.nextAction && <p><span className="font-semibold text-ink-600">Next action:</span> {c.nextAction}</p>}
                            {c.nextActionDueDate && <p><span className="font-semibold text-ink-600">Due:</span> {fmtDate(c.nextActionDueDate)}</p>}
                            {c.assignedCoordinator && <p><span className="font-semibold text-ink-600">Coordinator:</span> {c.assignedCoordinator}</p>}
                            {c.providerName && <p><span className="font-semibold text-ink-600">Provider:</span> {c.providerName}</p>}
                            {c.targetCompletionDate && <p><span className="font-semibold text-ink-600">Target completion:</span> {fmtDate(c.targetCompletionDate)}</p>}
                            <p><span className="font-semibold text-ink-600">Opened:</span> {fmtDate(c.dateOpened)}</p>
                            <p><span className="font-semibold text-ink-600">Last update:</span> {fmtDate(c.updatedAt)}</p>
                            {openingDate && <p><span className="font-semibold text-ink-600">Opens:</span> {fmtDate(openingDate)}</p>}
                          </div>
                        </div>
                        <div className="flex flex-col gap-1 shrink-0">
                          <button onClick={() => togglePin(c.id)} className="p-1.5 rounded-lg hover:bg-ink-100 transition-colors" title={isPinned ? 'Unpin' : 'Pin for attention'}>
                            {isPinned ? <PinOff size={16} className="text-brand-600" /> : <Pin size={16} className="text-ink-400" />}
                          </button>
                          <button onClick={() => setOpeningDateModalId(c.id)} className="p-1.5 rounded-lg hover:bg-ink-100 transition-colors" title="Set opening date">
                            <Calendar size={16} className="text-ink-400" />
                          </button>
                          <button onClick={() => setPage('cases')} className="p-1.5 rounded-lg hover:bg-ink-100 transition-colors" title="Open case in Case Management">
                            <ChevronRight size={16} className="text-ink-400" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Pending section */}
          {!filters.showPinned && (
            <div className="card p-5">
              <h3 className="font-display font-bold text-ink-900 mb-4 flex items-center gap-2">
                <Clock size={18} className="text-warning-600" /> Pending Cases / Appointments
              </h3>
              {displayPending.length === 0 ? (
                <div className="text-center py-8">
                  <Clock size={32} className="text-ink-300 mx-auto mb-2" />
                  <p className="text-sm text-ink-400">No pending appointments or cases.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {displayPending.map(item => (
                    <div key={`${item.kind}-${item.id}`} className="flex items-center gap-3 p-3 rounded-lg border border-ink-100 hover:border-warning-200 transition-colors">
                      <div className="flex-1 min-w-0 flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-ink-900 truncate">{item.employeeName}</p>
                          <p className="text-xs text-ink-400 truncate">{item.companyName} · {item.reference}</p>
                        </div>
                        <Badge color={item.kind === 'appointment' ? 'brand' : 'warning'}>{item.type}</Badge>
                        <Badge color="warning" dot>{item.status}</Badge>
                        <div className="text-xs text-ink-500 text-right shrink-0">
                          <p className="flex items-center gap-1"><Calendar size={12} /> {fmtDate(item.date)}</p>
                          {item.time && <p className="flex items-center gap-1"><Clock size={12} /> {item.time}</p>}
                        </div>
                      </div>
                      {item.kind === 'case' && (
                        <button onClick={() => setPage('cases')} className="p-1.5 rounded-lg hover:bg-ink-100 transition-colors shrink-0">
                          <ChevronRight size={16} className="text-ink-400" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Pinned records section (visible when showPinned filter is on) */}
          {filters.showPinned && (
            <div className="card p-5">
              <h3 className="font-display font-bold text-ink-900 mb-4 flex items-center gap-2">
                <Pin size={18} className="text-brand-600" /> Pinned Records
              </h3>
              {pinnedRecords.length === 0 ? (
                <div className="text-center py-8">
                  <Pin size={32} className="text-ink-300 mx-auto mb-2" />
                  <p className="text-sm text-ink-400">No records pinned for attention.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {pinnedRecords.map(c => (
                    <div key={c.id} className="flex items-center gap-3 p-3 rounded-lg border border-brand-200 bg-brand-50/30">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-ink-900">{c.employeeName || '—'}</p>
                        <p className="text-xs text-ink-400">{c.companyName} · {c.caseReference}</p>
                      </div>
                      <StatusBadge status={c.status} />
                      <button onClick={() => togglePin(c.id)} className="p-1.5 rounded-lg hover:bg-ink-100 transition-colors">
                        <PinOff size={16} className="text-brand-600" />
                      </button>
                      <button onClick={() => setPage('cases')} className="p-1.5 rounded-lg hover:bg-ink-100 transition-colors">
                        <ChevronRight size={16} className="text-ink-400" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Meeting notes and follow-ups */}
          {canReview && (
            <div className="card p-5">
              <h3 className="font-display font-bold text-ink-900 mb-4 flex items-center gap-2">
                <StickyNote size={18} className="text-brand-600" /> Meeting Notes & Follow-up Actions
              </h3>
              {synopses.length === 0 ? (
                <p className="text-sm text-ink-400 mb-3">No saved synopsis records yet. Meeting notes are attached to a saved synopsis record.</p>
              ) : (
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-ink-500 mb-1">Attach notes to synopsis</label>
                  <select
                    className="input w-full text-sm"
                    value={selectedSynopsisId || ''}
                    onChange={e => setSelectedSynopsisId(e.target.value || null)}
                  >
                    <option value="">Select a saved synopsis...</option>
                    {synopses.map(s => (
                      <option key={s.id} value={s.id}>{s.employeeName} — {new Date(s.createdAt).toLocaleDateString()}</option>
                    ))}
                  </select>
                </div>
              )}

              {selectedSynopsis && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  {/* Notes */}
                  <div>
                    <h4 className="text-sm font-semibold text-ink-800 mb-2 flex items-center gap-2"><StickyNote size={14} /> Notes</h4>
                    <div className="flex gap-2 mb-3">
                      <input className="input flex-1 text-sm" value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="Add note..." onKeyDown={e => e.key === 'Enter' && handleAddNote()} />
                      <button onClick={handleAddNote} className="btn-secondary text-sm py-1.5"><Plus size={14} /></button>
                    </div>
                    <div className="space-y-2 max-h-[200px] overflow-y-auto">
                      {notes.map(n => (
                        <div key={n.id} className="p-2.5 bg-ink-50 rounded-lg">
                          <p className="text-sm text-ink-700">{n.note}</p>
                          <p className="text-xs text-ink-400 mt-1">{n.createdBy} — {new Date(n.createdAt).toLocaleTimeString()}</p>
                        </div>
                      ))}
                      {notes.length === 0 && <p className="text-xs text-ink-400">No notes yet.</p>}
                    </div>
                  </div>

                  {/* Follow-ups */}
                  <div>
                    <h4 className="text-sm font-semibold text-ink-800 mb-2 flex items-center gap-2"><CheckSquare size={14} /> Follow-up Actions</h4>
                    <div className="space-y-2 mb-3">
                      <input className="input w-full text-sm" value={fuAction} onChange={e => setFuAction(e.target.value)} placeholder="Action required..." />
                      <div className="flex gap-2">
                        <input className="input flex-1 text-sm" value={fuPerson} onChange={e => setFuPerson(e.target.value)} placeholder="Responsible person" />
                        <input className="input w-32 text-sm" type="date" value={fuDue} onChange={e => setFuDue(e.target.value)} />
                      </div>
                      <button onClick={handleAddFollowUp} className="btn-secondary text-sm py-1.5 w-full"><Plus size={14} /> Add Action</button>
                    </div>
                    <div className="space-y-2 max-h-[200px] overflow-y-auto">
                      {followUps.map(f => (
                        <div key={f.id} className="flex items-start gap-2 p-2.5 bg-ink-50 rounded-lg cursor-pointer" onClick={() => toggleFollowUp(f.id, f.completed)}>
                          {f.completed ? <CheckSquare size={16} className="text-success-600 mt-0.5 shrink-0" /> : <Square size={16} className="text-ink-400 mt-0.5 shrink-0" />}
                          <div className="min-w-0 flex-1">
                            <p className={`text-sm ${f.completed ? 'line-through text-ink-400' : 'text-ink-700'}`}>{f.action}</p>
                            <p className="text-xs text-ink-400">{f.responsiblePerson}{f.dueDate ? ` · Due ${fmtDate(f.dueDate)}` : ''}</p>
                          </div>
                        </div>
                      ))}
                      {followUps.length === 0 && <p className="text-xs text-ink-400">No follow-up actions yet.</p>}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        // Pre-run state
        <div className="card p-8 text-center">
          <div className="h-14 w-14 rounded-2xl bg-brand-50 flex items-center justify-center mx-auto mb-4">
            <ClipboardList size={28} className="text-brand-600" />
          </div>
          <h3 className="text-lg font-display font-bold text-ink-900 mb-2">Morning Synopsis Report</h3>
          <p className="text-sm text-ink-500 max-w-md mx-auto mb-6">
            Generate a morning briefing report showing open cases requiring attention, pending appointments, and pinned records. The report aggregates live case and appointment data.
          </p>
          <button onClick={handleRunSynopsis} className="btn-primary mx-auto">
            <RefreshCw size={16} /> Run Synopsis
          </button>
          {visibleCases.length > 0 && (
            <p className="text-xs text-ink-400 mt-4">{visibleCases.length} cases available · {visibleAppointments.length} appointments available</p>
          )}
        </div>
      )}

      {/* Opening date modal */}
      {openingDateModalId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setOpeningDateModalId(null)}>
          <div className="card p-6 max-w-sm w-full mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="font-display font-bold text-ink-900 mb-2 flex items-center gap-2"><Calendar size={16} className="text-brand-600" /> Schedule Opening Date</h3>
            <p className="text-xs text-ink-500 mb-3">When this date arrives, the case becomes eligible for the Open Cases section. The case status is not changed.</p>
            <input
              type="date"
              className="input w-full"
              value={openingDateInput || openingDates[openingDateModalId] || defaultOpeningDate(visibleCases.find(c => c.id === openingDateModalId)?.dateOpened || null) || ''}
              onChange={e => setOpeningDateInput(e.target.value)}
            />
            <div className="flex gap-2 mt-4">
              <button onClick={() => saveOpeningDate(openingDateModalId, openingDateInput || openingDates[openingDateModalId] || '')} className="btn-primary flex-1">Save</button>
              {openingDates[openingDateModalId] && (
                <button onClick={() => saveOpeningDate(openingDateModalId, '')} className="btn-secondary">Remove</button>
              )}
              <button onClick={() => setOpeningDateModalId(null)} className="btn-secondary">Cancel</button>
            </div>
            <p className="text-xs text-ink-400 mt-3">Default: 14 days before the case opened date.</p>
          </div>
        </div>
      )}
    </div>
  );
}
