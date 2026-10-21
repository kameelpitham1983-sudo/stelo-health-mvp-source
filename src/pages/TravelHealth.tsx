import { useState, useMemo } from 'react';
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
  FileText,
  ClipboardList,
  Globe,
} from 'lucide-react';
import { useTravelHealth, useEmployees, isDemoMode } from '@/hooks/useSupabaseData';
import { Badge } from '@/components/Badge';
import { travelConsultations } from '@/data/mockData';
import type {
  TravelHealthRecord,
  TravelConsultation,
  TravelConsultationStatus,
} from '@/types';

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

const allConsultationStatuses: TravelConsultationStatus[] = [
  'Not Scheduled',
  'Scheduled',
  'Completed',
  'Post-Travel Review Required',
  'Post-Travel Completed',
];

export function TravelHealth() {
  const { data: travelHealth, loading, error } = useTravelHealth();
  const { data: employees } = useEmployees();

  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [selectedConsultation, setSelectedConsultation] = useState<TravelConsultation | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [demoConsultations, setDemoConsultations] = useState<TravelConsultation[]>([]);

  const allConsultations = useMemo(() => {
    if (demoConsultations.length === 0) return travelConsultations;
    const baseIds = new Set(travelConsultations.map((c) => c.id));
    const added = demoConsultations.filter((c) => !baseIds.has(c.id));
    return [...travelConsultations, ...added];
  }, [demoConsultations]);

  const filteredRecords = travelHealth.filter(
    (t) =>
      t.employeeName.toLowerCase().includes(search.toLowerCase()) ||
      t.destination.toLowerCase().includes(search.toLowerCase()),
  );

  const filteredConsultations = allConsultations.filter((c) => {
    const matchSearch =
      c.employeeName.toLowerCase().includes(search.toLowerCase()) ||
      c.destination.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const actionsRequired = travelHealth.filter((t) => t.status === 'Action Required').length;
  const inProgress = travelHealth.filter((t) => t.status === 'In Progress').length;
  const cleared = travelHealth.filter((t) => t.status === 'Cleared').length;
  const upcomingConsultations = allConsultations.filter(
    (c) => c.status === 'Not Scheduled' || c.status === 'Scheduled',
  ).length;
  const postTravelDue = allConsultations.filter(
    (c) => c.status === 'Post-Travel Review Required',
  ).length;

  if (loading) {
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

  // --- Consultation detail view ---
  if (selectedConsultation) {
    const tc = selectedConsultation;
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <button onClick={() => setSelectedConsultation(null)} className="btn-secondary">
            <ArrowLeft size={16} /> Back to Travel Health
          </button>
          <Badge color={consultationStatusColors[tc.status]} dot>{tc.status}</Badge>
        </div>

        {isDemoMode && (
          <div className="p-3 bg-warning-50 text-warning-700 text-sm rounded-lg flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            Demo mode — consultation details are fictional sample data. Changes are stored locally only.
          </div>
        )}

        <div className="card overflow-hidden">
          <div className="h-20 bg-gradient-to-br from-brand-600 to-brand-900" />
          <div className="p-5 lg:p-6 -mt-8">
            <div className="flex items-end gap-4">
              <div className="h-16 w-16 rounded-2xl bg-white border-4 border-white shadow-lg flex items-center justify-center">
                <Plane size={28} className="text-brand-600" />
              </div>
              <div className="mb-1">
                <h2 className="text-xl font-display font-bold text-ink-900">{tc.employeeName}</h2>
                <p className="text-sm text-ink-500">{tc.destination} — Departs {tc.departureDate}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="card p-5">
            <h3 className="font-display font-bold text-ink-900 mb-4">Travel Details</h3>
            <div className="space-y-3">
              <DetailRow icon={User} label="Employee" value={tc.employeeName} />
              <DetailRow icon={Building2} label="Company" value={tc.companyName} />
              <DetailRow icon={MapPin} label="Destination" value={tc.destination} />
              <DetailRow icon={Calendar} label="Departure" value={tc.departureDate} />
              <DetailRow icon={Calendar} label="Return" value={tc.returnDate} />
              <DetailRow icon={Globe} label="Purpose" value={tc.purposeOfTravel} />
              <div className="flex items-center justify-between py-2 border-b border-ink-100">
                <span className="flex items-center gap-2 text-sm text-ink-500"><ShieldAlert size={15} /> Risk level</span>
                <Badge color={riskColors[tc.riskLevel]}>{tc.riskLevel}</Badge>
              </div>
              <DetailRow icon={Calendar} label="Consultation date" value={tc.consultationDate || 'Not scheduled'} />
              <DetailRow icon={User} label="Provider" value={tc.providerName || 'Not assigned'} />
            </div>
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
                  <Badge color={vaccineStatusColors[v.status]}>{v.status}</Badge>
                </div>
              ))}
            </div>
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
          </div>
        </div>

        {/* Travel advice */}
        {tc.travelAdvice && (
          <div className="card p-5">
            <h3 className="font-display font-bold text-ink-900 mb-3 flex items-center gap-2"><FileText size={18} className="text-brand-600" /> Travel Advice</h3>
            <p className="text-sm text-ink-700 leading-relaxed">{tc.travelAdvice}</p>
          </div>
        )}

        {/* Clinician notes */}
        {tc.clinicianNotes && (
          <div className="card p-5">
            <h3 className="font-display font-bold text-ink-900 mb-3 flex items-center gap-2"><Stethoscope size={18} className="text-brand-600" /> Clinician Notes</h3>
            <p className="text-sm text-ink-700 leading-relaxed">{tc.clinicianNotes}</p>
            <p className="text-xs text-ink-400 mt-3">Clinical notes are visible to authorised clinical staff only and are not shared with employers by default.</p>
          </div>
        )}

        {/* Post-travel review */}
        {(tc.status === 'Post-Travel Review Required' || tc.status === 'Post-Travel Completed') && (
          <div className="card p-5">
            <h3 className="font-display font-bold text-ink-900 mb-3 flex items-center gap-2"><ClipboardList size={18} className="text-brand-600" /> Post-Travel Review</h3>
            <div className="space-y-3">
              <DetailRow icon={Calendar} label="Review date" value={tc.postTravelReviewDate || 'Not scheduled'} />
              {tc.postTravelNotes && (
                <div>
                  <p className="text-xs font-semibold text-ink-400 uppercase tracking-wider mb-1">Review notes</p>
                  <p className="text-sm text-ink-700 leading-relaxed">{tc.postTravelNotes}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Linked records */}
        <div className="card p-5">
          <h3 className="font-display font-bold text-ink-900 mb-4">Linked Records</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <LinkCard label="Travel Health Record" value={tc.travelHealthRecordId ? `Record ${tc.travelHealthRecordId}` : 'Not linked'} icon={Plane} />
            <LinkCard label="Appointment" value={tc.appointmentId ? `Appointment ${tc.appointmentId}` : 'Not linked'} icon={Calendar} />
            <LinkCard label="Medical Assessment" value={tc.medicalId ? `Medical ${tc.medicalId}` : 'Not linked'} icon={Stethoscope} />
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

        {/* Status update */}
        <div className="card p-5">
          <h3 className="font-display font-bold text-ink-900 mb-4">Update Consultation Status</h3>
          <div className="flex flex-wrap gap-2">
            {allConsultationStatuses.filter((s) => s !== tc.status).map((s) => (
              <button
                key={s}
                onClick={() => {
                  const update = (c: TravelConsultation): TravelConsultation =>
                    c.id === tc.id ? { ...c, status: s } : c;
                  setDemoConsultations((prev) => {
                    const existing = prev.find((c) => c.id === tc.id);
                    if (existing) return prev.map(update);
                    const base = travelConsultations.find((c) => c.id === tc.id);
                    return base ? [...prev, update(base)] : prev;
                  });
                  setSelectedConsultation((prev) => prev ? { ...prev, status: s } : prev);
                }}
                className="btn-secondary text-sm"
              >
                {s}
              </button>
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
          Demo mode — travel health records and consultations shown are fictional sample data. Changes are stored locally only and not saved as live records.
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-display font-bold text-ink-900">Travel Health</h2>
          <p className="text-sm text-ink-500">Pre-deployment travel risk assessments, consultations, and vaccine tracking</p>
        </div>
        <button className="btn-primary" onClick={() => setShowCreateForm(true)}>
          <Plus size={16} /> New Consultation
        </button>
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

      {/* Create consultation form */}
      {showCreateForm && (
        <CreateConsultationForm
          employees={employees}
          travelHealthRecords={travelHealth}
          onClose={() => setShowCreateForm(false)}
          onCreate={(tc) => {
            setDemoConsultations((prev) => [...prev, tc]);
            setShowCreateForm(false);
          }}
        />
      )}

      {/* Travel records (existing) */}
      <div>
        <h3 className="font-display font-bold text-ink-900 mb-3">Travel Health Records</h3>
        {filteredRecords.length === 0 ? (
          <div className="card p-12 text-center">
            <Plane size={32} className="text-ink-300 mx-auto mb-3" />
            <p className="text-sm text-ink-500">No travel health records found.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredRecords.map((record) => {
              const linkedConsultation = allConsultations.find((c) => c.travelHealthRecordId === record.id);
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
                        {linkedConsultation && (
                          <Badge color={consultationStatusColors[linkedConsultation.status]} dot>Consultation: {linkedConsultation.status}</Badge>
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
                          </div>
                        </div>
                      </div>
                      {linkedConsultation && (
                        <div className="mt-4 pt-3 border-t border-ink-100">
                          <button
                            onClick={() => setSelectedConsultation(linkedConsultation)}
                            className="btn-secondary text-sm"
                          >
                            <Stethoscope size={14} /> View Consultation Details
                          </button>
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

      {/* Consultations section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display font-bold text-ink-900">Travel Consultations</h3>
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
            {filteredConsultations.map((tc) => (
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
                      <p className="text-xs text-ink-400 truncate">{tc.destination} — Departs {tc.departureDate}</p>
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
                    <Badge color={riskColors[tc.riskLevel]}>{tc.riskLevel} risk</Badge>
                    <Badge color={consultationStatusColors[tc.status]} dot>{tc.status}</Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
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

function CreateConsultationForm({
  employees,
  travelHealthRecords,
  onClose,
  onCreate,
}: {
  employees: { id: string; name: string; companyName: string }[];
  travelHealthRecords: TravelHealthRecord[];
  onClose: () => void;
  onCreate: (tc: TravelConsultation) => void;
}) {
  const [employeeId, setEmployeeId] = useState('');
  const [travelRecordId, setTravelRecordId] = useState('');
  const [purposeOfTravel, setPurposeOfTravel] = useState('');
  const [consultationDate, setConsultationDate] = useState('');
  const [providerName, setProviderName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const emp = employees.find((em) => em.id === employeeId);
    const record = travelHealthRecords.find((r) => r.id === travelRecordId);
    if (!emp && !record) {
      setError('Select an employee or link to an existing travel health record.');
      return;
    }
    const newTc: TravelConsultation = {
      id: `tc-demo-${Date.now()}`,
      travelHealthRecordId: record?.id || '',
      employeeName: emp?.name || record?.employeeName || '',
      employeeId: emp?.id || '',
      companyName: emp?.companyName || record?.companyName || '',
      destination: record?.destination || '',
      departureDate: record?.departureDate || '',
      returnDate: record?.returnDate || '',
      purposeOfTravel: purposeOfTravel || 'Business travel',
      riskLevel: record?.riskLevel || 'Moderate',
      consultationDate: consultationDate || null,
      providerName: providerName || '',
      status: consultationDate ? 'Scheduled' : 'Not Scheduled',
      vaccinationPlan: record?.vaccines || [],
      malariaProphylaxis: record?.malariaProphylaxis || false,
      travelKitIssued: record?.travelKitIssued || false,
      travelAdvice: '',
      clinicianNotes: '',
      postTravelReviewDate: null,
      postTravelNotes: '',
      appointmentId: null,
      medicalId: null,
      questionnaireStatus: 'Not Started',
    };
    onCreate(newTc);
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
            <label className="block text-sm font-semibold text-ink-700 mb-1">Purpose of Travel</label>
            <input className="input w-full" value={purposeOfTravel} onChange={(e) => setPurposeOfTravel(e.target.value)} placeholder="e.g. Client site visit" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-ink-700 mb-1">Consultation Date</label>
            <input className="input w-full" type="date" value={consultationDate} onChange={(e) => setConsultationDate(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-ink-700 mb-1">Provider</label>
            <input className="input w-full" value={providerName} onChange={(e) => setProviderName(e.target.value)} placeholder="Clinician name" />
          </div>
        </div>
        <button type="submit" className="btn-primary">
          <Plus size={16} /> Create Consultation
        </button>
      </form>
    </div>
  );
}
