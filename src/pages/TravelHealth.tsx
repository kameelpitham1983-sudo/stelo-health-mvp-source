import { useState, useMemo, useEffect, useCallback } from 'react';
import { useApp } from '@/context/AppContext';
import { can } from '@/lib/permissions';
import {
  Plane,
  MapPin,
  Calendar,
  ShieldAlert,
  Syringe,
  Pill,
  Package,
  Search,
  AlertCircle,
  ArrowLeft,
  Stethoscope,
  User,
  Building2,
  Clock,
  Plus,
  X,
  Check,
  Save,
  FileText,
  ClipboardList,
  Globe,
  Trash2,
} from 'lucide-react';
import { useTravelHealth, useEmployees, useProviders, isDemoMode } from '@/hooks/useSupabaseData';
import { useTravelConsultations, type TravelConsultationRecord } from '@/hooks/useSupabaseData';
import { Badge } from '@/components/Badge';
import type { TravelHealthRecord, VaccineStatus, UserRole } from '@/types';

const riskColors: Record<string, 'success' | 'warning' | 'danger' | 'ink'> = {
  Low: 'success',
  Moderate: 'warning',
  High: 'danger',
  'Very High': 'danger',
};

const statusColors: Record<string, 'success' | 'warning' | 'danger' | 'brand' | 'ink'> = {
  Cleared: 'success',
  Pending: 'warning',
  'Action Required': 'danger',
  'In Progress': 'brand',
};

const vaccineStatusColors: Record<string, 'success' | 'warning' | 'danger' | 'ink'> = {
  Complete: 'success',
  'In Progress': 'warning',
  'Not Started': 'ink',
  'Booster Due': 'danger',
};

const consultationStatusColors: Record<string, 'success' | 'warning' | 'danger' | 'brand' | 'ink'> = {
  'Not Scheduled': 'ink',
  Scheduled: 'brand',
  Completed: 'success',
  'Post-Travel Review Required': 'warning',
  'Post-Travel Completed': 'success',
};

const allConsultationStatuses = [
  'Not Scheduled',
  'Scheduled',
  'Completed',
  'Post-Travel Review Required',
  'Post-Travel Completed',
] as const;

const canViewClinical = (role: string | undefined) =>
  role === 'admin' || role === 'master_admin' || role === 'provider';

export function TravelHealth() {
  const { user } = useApp();
  const { data: travelHealth, loading, error, updateTravelHealthDetails } = useTravelHealth();
  const { data: employees } = useEmployees();
  const { data: providers } = useProviders();
  const {
    data: consultations,
    loading: consultationsLoading,
    error: consultationsError,
    getClinicalNotes,
    addConsultation,
    updateConsultation,
    updateClinicalNotes,
    deleteConsultation,
  } = useTravelConsultations();

  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [selectedConsultation, setSelectedConsultation] = useState<TravelConsultationRecord | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [view, setView] = useState<'records' | 'consultations'>('records');

  const filteredRecords = travelHealth.filter(
    (t) =>
      t.employeeName.toLowerCase().includes(search.toLowerCase()) ||
      t.destination.toLowerCase().includes(search.toLowerCase()),
  );

  const filteredConsultations = consultations.filter((c) => {
    const matchSearch =
      c.employeeName.toLowerCase().includes(search.toLowerCase()) ||
      c.purposeOfTravel.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const actionsRequired = travelHealth.filter((t) => t.status === 'Action Required').length;
  const inProgress = travelHealth.filter((t) => t.status === 'In Progress').length;
  const cleared = travelHealth.filter((t) => t.status === 'Cleared').length;
  const upcomingConsultations = consultations.filter(
    (c) => c.status === 'Not Scheduled' || c.status === 'Scheduled',
  ).length;
  const postTravelDue = consultations.filter(
    (c) => c.status === 'Post-Travel Review Required',
  ).length;

  if (loading || consultationsLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="w-6 h-6 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="card p-6 text-center">
        <AlertCircle size={24} className="text-danger-500 mx-auto mb-2" />
        <p className="text-sm text-ink-600">Failed to load travel health records: {error}</p>
      </div>
    );
  }

  if (consultationsError) {
    return (
      <div className="card p-6 text-center">
        <AlertCircle size={24} className="text-danger-500 mx-auto mb-2" />
        <p className="text-sm text-ink-600">Failed to load consultations: {consultationsError}</p>
      </div>
    );
  }

  // --- Consultation detail/edit view ---
  if (selectedConsultation) {
    return (
      <ConsultationDetail
        consultation={selectedConsultation}
        travelHealthRecords={travelHealth}
        providers={providers}
        user={user}
        onBack={() => setSelectedConsultation(null)}
        onUpdate={updateConsultation}
        onUpdateClinical={updateClinicalNotes}
        onGetClinical={getClinicalNotes}
        onDelete={async (id) => {
          await deleteConsultation(id);
          setSelectedConsultation(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {isDemoMode && (
        <div className="p-3 bg-warning-50 text-warning-700 text-sm rounded-lg flex items-center gap-2">
          <AlertCircle size={16} className="shrink-0" />
          Demo mode — travel health records shown are fictional sample data. Consultations require a live database connection to save.
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-display font-bold text-ink-900">Travel Health</h2>
          <p className="text-sm text-ink-500">Pre-deployment travel risk assessments, consultations, and vaccine tracking</p>
        </div>
        {can(user, 'medical.create') && (
          <button className="btn-primary" onClick={() => setShowCreateForm(true)}>
            <Plus size={16} /> New Consultation
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="card p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-success-50 flex items-center justify-center"><Plane size={18} className="text-success-600" /></div>
          <div><p className="text-xl font-bold font-display text-ink-900">{cleared}</p><p className="text-xs text-ink-400">Cleared</p></div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-brand-50 flex items-center justify-center"><Syringe size={18} className="text-brand-600" /></div>
          <div><p className="text-xl font-bold font-display text-ink-900">{inProgress}</p><p className="text-xs text-ink-400">In Progress</p></div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-danger-50 flex items-center justify-center"><ShieldAlert size={18} className="text-danger-600" /></div>
          <div><p className="text-xl font-bold font-display text-ink-900">{actionsRequired}</p><p className="text-xs text-ink-400">Action Required</p></div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-warning-50 flex items-center justify-center"><Clock size={18} className="text-warning-600" /></div>
          <div><p className="text-xl font-bold font-display text-ink-900">{upcomingConsultations}</p><p className="text-xs text-ink-400">Consultations Due</p></div>
        </div>
      </div>

      {actionsRequired > 0 && (
        <div className="card p-4 border-danger-200 bg-danger-50/30 flex items-start gap-3">
          <ShieldAlert size={18} className="text-danger-600 shrink-0 mt-0.5" />
          <p className="text-sm text-ink-700">
            <strong className="text-danger-700">{actionsRequired} travel health record(s) need immediate attention</strong> before upcoming deployments. Review vaccine boosters and malaria prophylaxis.
          </p>
        </div>
      )}

      {postTravelDue > 0 && (
        <div className="card p-4 border-warning-200 bg-warning-50/30 flex items-start gap-3">
          <Clock size={18} className="text-warning-600 shrink-0 mt-0.5" />
          <p className="text-sm text-ink-700">
            <strong className="text-warning-700">{postTravelDue} post-travel review(s) due</strong> for employees who have returned from travel.
          </p>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
        <input type="text" placeholder="Search by employee or destination..." value={search} onChange={(e) => setSearch(e.target.value)} className="input pl-10" />
      </div>

      {/* View toggle */}
      <div className="flex gap-2 border-b border-ink-100">
        <button
          onClick={() => setView('records')}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${view === 'records' ? 'border-brand-600 text-brand-700' : 'border-transparent text-ink-400 hover:text-ink-600'}`}
        >
          Travel Health Records
        </button>
        <button
          onClick={() => setView('consultations')}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${view === 'consultations' ? 'border-brand-600 text-brand-700' : 'border-transparent text-ink-400 hover:text-ink-600'}`}
        >
          Consultations ({consultations.length})
        </button>
      </div>

      {/* Create consultation form */}
      {showCreateForm && (
        <CreateConsultationForm
          employees={employees}
          travelHealthRecords={travelHealth}
          providers={providers}
          onSaveRecordDetails={updateTravelHealthDetails}
          onClose={() => setShowCreateForm(false)}
          onCreate={async (c) => {
            await addConsultation(c);
            setShowCreateForm(false);
            setView('consultations');
          }}
        />
      )}

      {/* Travel records */}
      {view === 'records' && (
        <div>
          {filteredRecords.length === 0 ? (
            <div className="card p-12 text-center">
              <Plane size={32} className="text-ink-300 mx-auto mb-3" />
              <p className="text-sm text-ink-500">No travel health records found.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredRecords.map((record) => {
                const linkedConsultations = consultations.filter((c) => c.travelHealthId === record.id);
                return (
                  <div key={record.id} className="card overflow-hidden">
                    <button
                      onClick={() => setExpanded(expanded === record.id ? null : record.id)}
                      className="w-full p-4 flex items-center gap-4 hover:bg-ink-50/50 transition-colors text-left"
                    >
                      <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white shrink-0">
                        <Plane size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-ink-900">{record.employeeName}</p>
                          <Badge color={statusColors[record.status]} dot>{record.status}</Badge>
                          {linkedConsultations.length > 0 && (
                            <Badge color={consultationStatusColors[linkedConsultations[0].status]} dot>
                              Consultation: {linkedConsultations[0].status}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-ink-500 flex-wrap">
                          <span className="flex items-center gap-1"><MapPin size={12} /> {record.destination}</span>
                          <span className="flex items-center gap-1"><Calendar size={12} /> Departs {record.departureDate}</span>
                          <Badge color={riskColors[record.riskLevel]}>{record.riskLevel} risk</Badge>
                        </div>
                      </div>
                    </button>

                    {expanded === record.id && (
                      <div className="border-t border-ink-100 p-4 bg-ink-50/30">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="text-xs font-bold text-ink-500 uppercase tracking-wider mb-3">Vaccinations</h4>
                            <div className="space-y-2">
                              {record.vaccines.map((v) => (
                                <div key={v.name} className="flex items-center justify-between py-2 px-3 bg-white rounded-lg border border-ink-100">
                                  <span className="flex items-center gap-2 text-sm text-ink-700"><Syringe size={14} className="text-ink-400" /> {v.name}</span>
                                  <Badge color={vaccineStatusColors[v.status]}>{v.status}</Badge>
                                </div>
                              ))}
                              {record.vaccines.length === 0 && <p className="text-sm text-ink-400">No vaccines recorded.</p>}
                            </div>
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-ink-500 uppercase tracking-wider mb-3">Travel preparation</h4>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between py-2 px-3 bg-white rounded-lg border border-ink-100">
                                <span className="flex items-center gap-2 text-sm text-ink-700"><Pill size={14} className="text-ink-400" /> Malaria prophylaxis</span>
                                <Badge color={record.malariaProphylaxis ? 'success' : 'ink'}>{record.malariaProphylaxis ? 'Issued' : 'Not required'}</Badge>
                              </div>
                              <div className="flex items-center justify-between py-2 px-3 bg-white rounded-lg border border-ink-100">
                                <span className="flex items-center gap-2 text-sm text-ink-700"><Package size={14} className="text-ink-400" /> Travel medical kit</span>
                                <Badge color={record.travelKitIssued ? 'success' : 'ink'}>{record.travelKitIssued ? 'Issued' : 'Not issued'}</Badge>
                              </div>
                              <div className="flex items-center justify-between py-2 px-3 bg-white rounded-lg border border-ink-100">
                                <span className="flex items-center gap-2 text-sm text-ink-700"><Calendar size={14} className="text-ink-400" /> Last consultation</span>
                                <span className="text-sm font-medium text-ink-700">{record.lastConsultation || 'Not recorded'}</span>
                              </div>
                              <div className="flex items-center justify-between py-2 px-3 bg-white rounded-lg border border-ink-100">
                                <span className="flex items-center gap-2 text-sm text-ink-700"><Calendar size={14} className="text-ink-400" /> Return date</span>
                                <span className="text-sm font-medium text-ink-700">{record.returnDate}</span>
                              </div>
                              <div className="flex items-center justify-between py-2 px-3 bg-white rounded-lg border border-ink-100">
                                <span className="flex items-center gap-2 text-sm text-ink-700"><Globe size={14} className="text-ink-400" /> Purpose of travel</span>
                                <span className="text-sm font-medium text-ink-700">{record.purposeOfTravel || 'Not recorded'}</span>
                              </div>
                              <div className="flex items-center justify-between py-2 px-3 bg-white rounded-lg border border-ink-100">
                                <span className="flex items-center gap-2 text-sm text-ink-700"><User size={14} className="text-ink-400" /> Provider</span>
                                <span className="text-sm font-medium text-ink-700">{record.provider || 'Not recorded'}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        {linkedConsultations.length > 0 && (
                          <div className="mt-4 pt-3 border-t border-ink-100 space-y-2">
                            {linkedConsultations.map((tc) => (
                              <button
                                key={tc.id}
                                onClick={() => setSelectedConsultation(tc)}
                                className="btn-secondary text-sm w-full sm:w-auto"
                              >
                                <Stethoscope size={14} /> View: {tc.status} — {tc.consultationDate || 'Not scheduled'}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Consultations section */}
      {view === 'consultations' && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="relative">
                <select
                  className="input pr-9 appearance-none cursor-pointer text-sm py-2"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All statuses</option>
                  {allConsultationStatuses.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
          </div>

          {filteredConsultations.length === 0 ? (
            <div className="card p-12 text-center">
              <Stethoscope size={32} className="text-ink-300 mx-auto mb-3" />
              <p className="text-sm text-ink-500">No consultations found. Click "New Consultation" to create one.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredConsultations.map((tc) => {
                const linkedRecord = travelHealth.find((r) => r.id === tc.travelHealthId);
                return (
                  <div
                    key={tc.id}
                    className="card card-hover p-4 cursor-pointer"
                    onClick={() => setSelectedConsultation(tc)}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white shrink-0">
                          <Stethoscope size={20} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-ink-900">{tc.employeeName}</p>
                          <p className="text-xs text-ink-400 truncate">
                            {linkedRecord ? `${linkedRecord.destination} — Departs ${linkedRecord.departureDate}` : tc.purposeOfTravel || 'No travel record linked'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 sm:gap-6 flex-wrap">
                        <div className="hidden md:block">
                          <p className="text-xs text-ink-400">Consultation</p>
                          <p className="text-sm font-medium text-ink-700">{tc.consultationDate || 'Not scheduled'}</p>
                        </div>
                        <div className="hidden lg:block">
                          <p className="text-xs text-ink-400">Provider</p>
                          <p className="text-sm font-medium text-ink-700">{tc.providerName || 'Not assigned'}</p>
                        </div>
                        {linkedRecord && <Badge color={riskColors[linkedRecord.riskLevel]}>{linkedRecord.riskLevel} risk</Badge>}
                        <Badge color={consultationStatusColors[tc.status]} dot>{tc.status}</Badge>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
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

function LinkCard({ label, value, icon: Icon }: { label: string; value: string; icon: typeof Plane }) {
  return (
    <div className="border border-ink-100 rounded-lg p-3">
      <p className="text-xs font-semibold text-ink-400 uppercase tracking-wider mb-1 flex items-center gap-1"><Icon size={12} /> {label}</p>
      <p className="text-sm font-medium text-ink-700">{value}</p>
    </div>
  );
}

// --- Consultation detail/edit view ---

function ConsultationDetail({
  consultation: initial,
  travelHealthRecords,
  providers,
  user,
  onBack,
  onUpdate,
  onUpdateClinical,
  onGetClinical,
  onDelete,
}: {
  consultation: TravelConsultationRecord;
  travelHealthRecords: TravelHealthRecord[];
  providers: { id: string; name: string }[];
  user: { role: UserRole; name: string } | null;
  onBack: () => void;
  onUpdate: (id: string, updates: Record<string, unknown>) => Promise<void>;
  onUpdateClinical: (id: string, clinicianNotes: string | null, postTravelNotes: string | null) => Promise<void>;
  onGetClinical: (id: string) => Promise<{ clinicianNotes: string; postTravelNotes: string }>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [tc, setTc] = useState(initial);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [clinicianNotes, setClinicianNotes] = useState('');
  const [postTravelNotes, setPostTravelNotes] = useState('');
  const [clinicalLoaded, setClinicalLoaded] = useState(false);
  const [clinicalSaving, setClinicalSaving] = useState(false);
  const [clinicalError, setClinicalError] = useState<string | null>(null);

  const showClinical = canViewClinical(user?.role);
  const linkedRecord = travelHealthRecords.find((r) => r.id === tc.travelHealthId);

  // Editable form state
  const [editStatus, setEditStatus] = useState(tc.status);
  const [editConsultationDate, setEditConsultationDate] = useState(tc.consultationDate || '');
  const [editProviderId, setEditProviderId] = useState(tc.providerId || '');
  const [editProviderName, setEditProviderName] = useState(tc.providerName || '');
  const [editPurpose, setEditPurpose] = useState(tc.purposeOfTravel || '');
  const [editTravelAdvice, setEditTravelAdvice] = useState(tc.travelAdvice || '');
  const [editMalaria, setEditMalaria] = useState(tc.malariaProphylaxis);
  const [editTravelKit, setEditTravelKit] = useState(tc.travelKitIssued);
  const [editPostTravelReviewDate, setEditPostTravelReviewDate] = useState(tc.postTravelReviewDate || '');
  const [editQuestionnaireStatus, setEditQuestionnaireStatus] = useState(tc.questionnaireStatus);

  // Load clinical notes for authorized users
  useEffect(() => {
    if (!showClinical || clinicalLoaded) return;
    onGetClinical(tc.id).then((notes) => {
      setClinicianNotes(notes.clinicianNotes);
      setPostTravelNotes(notes.postTravelNotes);
      setClinicalLoaded(true);
    }).catch(() => setClinicalLoaded(true));
  }, [showClinical, clinicalLoaded, tc.id, onGetClinical]);

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      const provider = providers.find((p) => p.id === editProviderId);
      const updates: Record<string, unknown> = {
        status: editStatus,
        consultationDate: editConsultationDate || null,
        providerId: editProviderId || null,
        providerName: provider?.name || editProviderName || '',
        purposeOfTravel: editPurpose,
        travelAdvice: editTravelAdvice,
        malariaProphylaxis: editMalaria,
        travelKitIssued: editTravelKit,
        postTravelReviewDate: editPostTravelReviewDate || null,
        questionnaireStatus: editQuestionnaireStatus,
      };
      await onUpdate(tc.id, updates);
      setTc({
        ...tc,
        status: editStatus,
        consultationDate: editConsultationDate || null,
        providerId: editProviderId || null,
        providerName: provider?.name || editProviderName || '',
        purposeOfTravel: editPurpose,
        travelAdvice: editTravelAdvice,
        malariaProphylaxis: editMalaria,
        travelKitIssued: editTravelKit,
        postTravelReviewDate: editPostTravelReviewDate || null,
        questionnaireStatus: editQuestionnaireStatus,
      });
      setEditing(false);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save consultation.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveClinical = async () => {
    setClinicalSaving(true);
    setClinicalError(null);
    try {
      await onUpdateClinical(tc.id, clinicianNotes, postTravelNotes);
    } catch (err) {
      setClinicalError(err instanceof Error ? err.message : 'Failed to save clinical notes.');
    } finally {
      setClinicalSaving(false);
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      await onDelete(tc.id);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to delete consultation.');
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="btn-secondary">
          <ArrowLeft size={16} /> Back to Travel Health
        </button>
        <div className="flex items-center gap-2">
          {can(user, 'medical.edit') && !editing && (
            <button onClick={() => setEditing(true)} className="btn-secondary text-sm">
              <Save size={14} /> Edit
            </button>
          )}
          {can(user, 'medical.delete') && !confirmDelete && (
            <button onClick={() => setConfirmDelete(true)} className="btn-secondary text-sm text-danger-600 hover:bg-danger-50">
              <Trash2 size={14} /> Delete
            </button>
          )}
          {confirmDelete && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-ink-600">Confirm?</span>
              <button onClick={handleDelete} className="btn-primary text-sm bg-danger-600 hover:bg-danger-700" disabled={saving}>
                Yes, delete
              </button>
              <button onClick={() => setConfirmDelete(false)} className="btn-secondary text-sm">
                Cancel
              </button>
            </div>
          )}
          <Badge color={consultationStatusColors[tc.status]} dot>{tc.status}</Badge>
        </div>
      </div>

      {saveError && <div className="p-3 bg-danger-50 text-danger-700 text-sm rounded-lg">{saveError}</div>}

      <div className="card overflow-hidden">
        <div className="h-20 bg-gradient-to-br from-brand-600 to-brand-900" />
        <div className="p-5 lg:p-6 -mt-8">
          <div className="flex items-end gap-4">
            <div className="h-16 w-16 rounded-2xl bg-white border-4 border-white shadow-lg flex items-center justify-center">
              <Plane size={28} className="text-brand-600" />
            </div>
            <div className="mb-1">
              <h2 className="text-xl font-display font-bold text-ink-900">{tc.employeeName}</h2>
              <p className="text-sm text-ink-500">
                {linkedRecord ? `${linkedRecord.destination} — Departs ${linkedRecord.departureDate}` : tc.purposeOfTravel || 'No travel record linked'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <h3 className="font-display font-bold text-ink-900 mb-4">Travel Details</h3>
          {editing ? (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-semibold text-ink-700 mb-1">Status</label>
                <select className="input w-full" value={editStatus} onChange={(e) => setEditStatus(e.target.value)}>
                  {allConsultationStatuses.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-ink-700 mb-1">Consultation date</label>
                <input className="input w-full" type="date" value={editConsultationDate} onChange={(e) => setEditConsultationDate(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-ink-700 mb-1">Provider</label>
                <select className="input w-full" value={editProviderId} onChange={(e) => { setEditProviderId(e.target.value); const p = providers.find((p) => p.id === e.target.value); if (p) setEditProviderName(p.name); }}>
                  <option value="">Select provider...</option>
                  {providers.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-ink-700 mb-1">Purpose of travel</label>
                <input className="input w-full" value={editPurpose} onChange={(e) => setEditPurpose(e.target.value)} placeholder="e.g. Client site visit" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-ink-700 mb-1">Post-travel review date</label>
                <input className="input w-full" type="date" value={editPostTravelReviewDate} onChange={(e) => setEditPostTravelReviewDate(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-ink-700 mb-1">Questionnaire status</label>
                <select className="input w-full" value={editQuestionnaireStatus} onChange={(e) => setEditQuestionnaireStatus(e.target.value)}>
                  <option value="Not Started">Not Started</option>
                  <option value="Draft">Draft</option>
                  <option value="Submitted">Submitted</option>
                  <option value="Under Review">Under Review</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
            </div>
          ) : (
            <div className="space-y-0">
              <DetailRow icon={User} label="Employee" value={tc.employeeName} />
              <DetailRow icon={Building2} label="Company" value={tc.companyName || 'Not recorded'} />
              {linkedRecord && (
                <>
                  <DetailRow icon={MapPin} label="Destination" value={linkedRecord.destination} />
                  <DetailRow icon={Calendar} label="Departure" value={linkedRecord.departureDate} />
                  <DetailRow icon={Calendar} label="Return" value={linkedRecord.returnDate} />
                  <div className="flex items-center justify-between py-2 border-b border-ink-100">
                    <span className="flex items-center gap-2 text-sm text-ink-500"><ShieldAlert size={15} /> Risk level</span>
                    <Badge color={riskColors[linkedRecord.riskLevel]}>{linkedRecord.riskLevel}</Badge>
                  </div>
                </>
              )}
              <DetailRow icon={Globe} label="Purpose" value={tc.purposeOfTravel || 'Not recorded'} />
              <DetailRow icon={Calendar} label="Consultation date" value={tc.consultationDate || 'Not scheduled'} />
              <DetailRow icon={User} label="Provider" value={tc.providerName || 'Not assigned'} />
            </div>
          )}
        </div>

        <div className="card p-5">
          <h3 className="font-display font-bold text-ink-900 mb-4">Vaccination Plan</h3>
          <div className="space-y-2 mb-4">
            {tc.vaccinationPlan.map((v) => (
              <div key={v.name} className="flex items-center justify-between py-2 px-3 bg-white rounded-lg border border-ink-100">
                <span className="flex items-center gap-2 text-sm text-ink-700">
                  <Syringe size={14} className="text-ink-400" />
                  {v.name}
                </span>
                <Badge color={vaccineStatusColors[v.status as VaccineStatus]}>{v.status}</Badge>
              </div>
            ))}
            {tc.vaccinationPlan.length === 0 && (
              <p className="text-sm text-ink-400">No vaccinations recorded for this consultation.</p>
            )}
          </div>
          {editing ? (
            <div className="space-y-2 pt-3 border-t border-ink-100">
              <label className="flex items-center justify-between py-2 px-3 bg-white rounded-lg border border-ink-100 cursor-pointer">
                <span className="flex items-center gap-2 text-sm text-ink-700"><Pill size={14} className="text-ink-400" /> Malaria prophylaxis</span>
                <input type="checkbox" checked={editMalaria} onChange={(e) => setEditMalaria(e.target.checked)} className="w-4 h-4 accent-brand-600" />
              </label>
              <label className="flex items-center justify-between py-2 px-3 bg-white rounded-lg border border-ink-100 cursor-pointer">
                <span className="flex items-center gap-2 text-sm text-ink-700"><Package size={14} className="text-ink-400" /> Travel medical kit</span>
                <input type="checkbox" checked={editTravelKit} onChange={(e) => setEditTravelKit(e.target.checked)} className="w-4 h-4 accent-brand-600" />
              </label>
            </div>
          ) : (
            <div className="space-y-2 pt-3 border-t border-ink-100">
              <div className="flex items-center justify-between py-2 px-3 bg-white rounded-lg border border-ink-100">
                <span className="flex items-center gap-2 text-sm text-ink-700"><Pill size={14} className="text-ink-400" /> Malaria prophylaxis</span>
                <Badge color={tc.malariaProphylaxis ? 'success' : 'ink'}>{tc.malariaProphylaxis ? 'Prescribed' : 'Not required'}</Badge>
              </div>
              <div className="flex items-center justify-between py-2 px-3 bg-white rounded-lg border border-ink-100">
                <span className="flex items-center gap-2 text-sm text-ink-700"><Package size={14} className="text-ink-400" /> Travel medical kit</span>
                <Badge color={tc.travelKitIssued ? 'success' : 'ink'}>{tc.travelKitIssued ? 'Issued' : 'Not issued'}</Badge>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Travel advice */}
      <div className="card p-5">
        <h3 className="font-display font-bold text-ink-900 mb-3 flex items-center gap-2"><FileText size={18} className="text-brand-600" /> Travel Advice</h3>
        {editing ? (
          <textarea
            className="input w-full min-h-[100px] resize-y"
            value={editTravelAdvice}
            onChange={(e) => setEditTravelAdvice(e.target.value)}
            placeholder="Enter travel advice for the employee..."
          />
        ) : (
          <p className="text-sm text-ink-700 leading-relaxed">{tc.travelAdvice || 'No travel advice recorded yet.'}</p>
        )}
      </div>

      {/* Clinician notes — only for admin/provider */}
      {showClinical && (
        <div className="card p-5">
          <h3 className="font-display font-bold text-ink-900 mb-3 flex items-center gap-2"><Stethoscope size={18} className="text-brand-600" /> Clinician Notes</h3>
          <p className="text-xs text-ink-400 mb-3">Clinical notes are visible to authorised clinical staff only and are not shared with employers or employees.</p>
          {clinicalError && <div className="p-3 bg-danger-50 text-danger-700 text-sm rounded-lg mb-3">{clinicalError}</div>}
          <textarea
            className="input w-full min-h-[100px] resize-y"
            value={clinicianNotes}
            onChange={(e) => setClinicianNotes(e.target.value)}
            placeholder="Enter clinical notes..."
          />
          <div className="flex justify-end mt-3">
            <button onClick={handleSaveClinical} className="btn-primary text-sm" disabled={clinicalSaving}>
              <Save size={14} /> {clinicalSaving ? 'Saving...' : 'Save Clinical Notes'}
            </button>
          </div>
        </div>
      )}

      {/* Post-travel review */}
      {(tc.status === 'Post-Travel Review Required' || tc.status === 'Post-Travel Completed') && (
        <div className="card p-5">
          <h3 className="font-display font-bold text-ink-900 mb-3 flex items-center gap-2"><ClipboardList size={18} className="text-brand-600" /> Post-Travel Review</h3>
          <div className="space-y-3">
            <DetailRow icon={Calendar} label="Review date" value={tc.postTravelReviewDate || 'Not scheduled'} />
            {showClinical && (
              <div>
                <p className="text-xs font-semibold text-ink-400 uppercase tracking-wider mb-1">Review notes (clinical)</p>
                <textarea
                  className="input w-full min-h-[80px] resize-y"
                  value={postTravelNotes}
                  onChange={(e) => setPostTravelNotes(e.target.value)}
                  placeholder="Enter post-travel review notes..."
                />
                <div className="flex justify-end mt-2">
                  <button onClick={handleSaveClinical} className="btn-primary text-sm" disabled={clinicalSaving}>
                    <Save size={14} /> {clinicalSaving ? 'Saving...' : 'Save Review Notes'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Linked records */}
      <div className="card p-5">
        <h3 className="font-display font-bold text-ink-900 mb-4">Linked Records</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <LinkCard label="Travel Health Record" value={tc.travelHealthId ? 'Linked' : 'Not linked'} icon={Plane} />
          <LinkCard label="Appointment" value={tc.appointmentId ? 'Linked' : 'Not linked'} icon={Calendar} />
          <LinkCard label="Medical Assessment" value={tc.medicalId ? 'Linked' : 'Not linked'} icon={Stethoscope} />
        </div>
        <div className="mt-3 pt-3 border-t border-ink-100">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm text-ink-500"><ClipboardList size={15} /> Questionnaire</span>
            <Badge color={
              tc.questionnaireStatus === 'Completed' ? 'success' :
              tc.questionnaireStatus === 'Submitted' || tc.questionnaireStatus === 'Under Review' ? 'brand' :
              tc.questionnaireStatus === 'Draft' ? 'warning' : 'ink'
            } dot>{tc.questionnaireStatus}</Badge>
          </div>
        </div>
      </div>

      {/* Save/cancel for edit mode */}
      {editing && (
        <div className="card p-4 flex items-center justify-end gap-3">
          <button onClick={() => { setEditing(false); setSaveError(null); }} className="btn-secondary">
            <X size={16} /> Cancel
          </button>
          <button onClick={handleSave} className="btn-primary" disabled={saving}>
            <Check size={16} /> {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      )}
    </div>
  );
}

// --- Create consultation form ---

function CreateConsultationForm({
  employees,
  travelHealthRecords,
  providers,
  onSaveRecordDetails,
  onClose,
  onCreate,
}: {
  employees: { id: string; name: string; companyName: string; companyId: string }[];
  travelHealthRecords: TravelHealthRecord[];
  providers: { id: string; name: string }[];
  onSaveRecordDetails: (recordId: string, updates: { purposeOfTravel?: string; provider?: string }) => Promise<void>;
  onClose: () => void;
  onCreate: (c: {
    travelHealthId?: string | null;
    employeeId?: string | null;
    employeeName: string;
    companyId?: string | null;
    companyName?: string;
    providerId?: string | null;
    providerName?: string;
    purposeOfTravel?: string;
    consultationDate?: string | null;
    status?: string;
    vaccinationPlan?: { name: string; status: string }[];
    malariaProphylaxis?: boolean;
    travelKitIssued?: boolean;
    travelAdvice?: string;
  }) => Promise<void>;
}) {
  const [employeeId, setEmployeeId] = useState('');
  const [travelRecordId, setTravelRecordId] = useState('');
  const [providerId, setProviderId] = useState('');
  const [purposeOfTravel, setPurposeOfTravel] = useState('');
  const [consultationDate, setConsultationDate] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const emp = employees.find((em) => em.id === employeeId);
    const record = travelHealthRecords.find((r) => r.id === travelRecordId);
    const provider = providers.find((p) => p.id === providerId);

    if (!emp && !record) {
      setError('Select an employee or link to an existing travel health record.');
      return;
    }

    setSaving(true);
    try {
      if (record && !isDemoMode) {
        await onSaveRecordDetails(record.id, {
          purposeOfTravel: purposeOfTravel.trim() || undefined,
          provider: provider?.name || undefined,
        });
      }

      await onCreate({
        travelHealthId: record?.id || null,
        employeeId: emp?.id || null,
        employeeName: emp?.name || record?.employeeName || '',
        companyId: emp?.companyId || null,
        companyName: emp?.companyName || record?.companyName || '',
        providerId: provider?.id || null,
        providerName: provider?.name || '',
        purposeOfTravel: purposeOfTravel || 'Business travel',
        consultationDate: consultationDate || null,
        status: consultationDate ? 'Scheduled' : 'Not Scheduled',
        vaccinationPlan: record?.vaccines || [],
        malariaProphylaxis: record?.malariaProphylaxis || false,
        travelKitIssued: record?.travelKitIssued || false,
        travelAdvice: '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The consultation could not be saved.');
      setSaving(false);
    }
  };

  return (
    <div className="card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-ink-900">New Travel Consultation</h3>
        <button type="button" className="btn-secondary" onClick={onClose}><X size={16} /> Cancel</button>
      </div>
      {error && <div className="p-3 bg-danger-50 text-danger-700 text-sm rounded-lg">{error}</div>}
      <form className="space-y-4" onSubmit={handleCreate}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-ink-700 mb-1">Select Employee</label>
            <select className="input w-full" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}>
              <option value="">Choose employee...</option>
              {employees.map((em) => <option key={em.id} value={em.id}>{em.name} — {em.companyName}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-ink-700 mb-1">Link to Travel Health Record</label>
            <select className="input w-full" value={travelRecordId} onChange={(e) => setTravelRecordId(e.target.value)}>
              <option value="">Select record (optional)...</option>
              {travelHealthRecords.map((r) => <option key={r.id} value={r.id}>{r.employeeName} — {r.destination}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-ink-700 mb-1">Provider</label>
            <select className="input w-full" value={providerId} onChange={(e) => setProviderId(e.target.value)}>
              <option value="">Select provider...</option>
              {providers.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-ink-700 mb-1">Consultation Date</label>
            <input className="input w-full" type="date" value={consultationDate} onChange={(e) => setConsultationDate(e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-semibold text-ink-700 mb-1">Purpose of Travel</label>
            <input className="input w-full" value={purposeOfTravel} onChange={(e) => setPurposeOfTravel(e.target.value)} placeholder="e.g. Client site visit" />
          </div>
        </div>
        <button type="submit" className="btn-primary" disabled={saving}>
          <Plus size={16} /> {saving ? 'Saving...' : 'Create Consultation'}
        </button>
      </form>
    </div>
  );
}
