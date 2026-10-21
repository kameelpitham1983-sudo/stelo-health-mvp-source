import { useState, useMemo, useCallback } from 'react';
import { CalendarDays, Clock, MapPin, Video, Building, Plus, ChevronDown, X, AlertCircle, Check, Edit3, Trash2, Search, Stethoscope, ArrowRight } from 'lucide-react';
import { useAppointments, useEmployees, useCompanies, useMedicals, isDemoMode } from '@/hooks/useSupabaseData';
import { Badge } from '@/components/Badge';
import type { Appointment, AppointmentType, AppointmentMode, AppointmentStatus } from '@/types';

const statusColors: Record<string, 'success' | 'warning' | 'danger' | 'ink' | 'brand'> = {
  Confirmed: 'success',
  Pending: 'warning',
  Completed: 'brand',
  Cancelled: 'ink',
  'No-show': 'danger',
};

const modeIcons: Record<string, typeof Video> = {
  'In-clinic': Building,
  'On-site': MapPin,
  Telemedicine: Video,
};

const appointmentTypes: AppointmentType[] = ['Occupational Health', 'Travel Vaccination', 'Telemedicine', 'Follow-up', 'Pre-Employment Screening'];
const appointmentModes: AppointmentMode[] = ['In-clinic', 'On-site', 'Telemedicine'];
const appointmentStatuses: AppointmentStatus[] = ['Confirmed', 'Pending', 'Completed', 'Cancelled', 'No-show'];

const emptyForm: Partial<Appointment> = {
  employeeName: '',
  companyName: '',
  type: 'Occupational Health',
  mode: 'In-clinic',
  status: 'Pending',
  date: '',
  time: '09:00',
  durationMin: 30,
  providerName: '',
  location: '',
};

export function Appointments() {
  const { data: dbAppointments, loading, error, addAppointment, updateAppointment } = useAppointments();
  const { data: employees } = useEmployees();
  const { data: companies } = useCompanies();
  const { data: medicals } = useMedicals();

  const [view, setView] = useState<'upcoming' | 'all'>('upcoming');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<Partial<Appointment>>(emptyForm);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [conflict, setConflict] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [cancelTarget, setCancelTarget] = useState<Appointment | null>(null);
  const [detailAppt, setDetailAppt] = useState<Appointment | null>(null);

  // Local demo state: when in demo mode, mutations update this local list
  // instead of hitting the blocked database.
  const [demoAppointments, setDemoAppointments] = useState<Appointment[]>([]);

  const appointments = useMemo(() => {
    if (isDemoMode && demoAppointments.length > 0) {
      // Merge: base demo data + locally added demo records
      const baseIds = new Set(dbAppointments.map((a) => a.id));
      const added = demoAppointments.filter((a) => !baseIds.has(a.id));
      return [...dbAppointments, ...added];
    }
    return dbAppointments;
  }, [dbAppointments, demoAppointments]);

  const sorted = useMemo(() => [...appointments].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)), [appointments]);
  const upcoming = sorted.filter((a) => a.status === 'Confirmed' || a.status === 'Pending');
  const viewFiltered = view === 'upcoming' ? upcoming : sorted;

  const display = useMemo(() => {
    let result = viewFiltered;
    if (statusFilter !== 'all') {
      result = result.filter((a) => a.status === statusFilter);
    }
    if (dateFrom) {
      result = result.filter((a) => a.date >= dateFrom);
    }
    if (dateTo) {
      result = result.filter((a) => a.date <= dateTo);
    }
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter((a) =>
        a.employeeName.toLowerCase().includes(q) ||
        a.companyName.toLowerCase().includes(q) ||
        a.providerName.toLowerCase().includes(q) ||
        a.type.toLowerCase().includes(q) ||
        a.location.toLowerCase().includes(q)
      );
    }
    return result;
  }, [viewFiltered, statusFilter, dateFrom, dateTo, search]);

  const relatedMedicals = useCallback((appt: Appointment) => {
    return medicals.filter(
      (m) =>
        m.employeeName === appt.employeeName &&
        m.companyName === appt.companyName
    );
  }, [medicals]);

  const handleEmployeeSelect = (empId: string) => {
    const emp = employees.find((e) => e.id === empId);
    if (emp) {
      setFormData({ ...formData, employeeName: emp.name, companyName: emp.companyName });
    }
  };

  const checkConflict = (date: string, time: string, providerName: string, employeeName: string, excludeId?: string) => {
    if (!date || !time) return null;
    const providerConflict = appointments.find(
      (a) => a.date === date && a.time === time &&
      a.providerName === providerName &&
      a.providerName &&
      a.status !== 'Cancelled' && a.status !== 'Completed' &&
      a.id !== excludeId
    );
    if (providerConflict) return providerConflict;
    const employeeConflict = appointments.find(
      (a) => a.date === date && a.time === time &&
      a.employeeName === employeeName &&
      a.employeeName &&
      a.status !== 'Cancelled' && a.status !== 'Completed' &&
      a.id !== excludeId
    );
    return employeeConflict || null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setConflict(null);

    if (!formData.employeeName?.trim()) {
      setSubmitError('Please select an employee.');
      return;
    }
    if (!formData.date) {
      setSubmitError('Please select a date.');
      return;
    }

    const conflictAppt = checkConflict(formData.date || '', formData.time || '', formData.providerName || '', formData.employeeName || '', editingId || undefined);
    if (conflictAppt) {
      const isProviderConflict = conflictAppt.providerName === formData.providerName;
      setConflict(isProviderConflict
        ? `Provider conflict: ${conflictAppt.providerName} already has an appointment with ${conflictAppt.employeeName} at ${conflictAppt.time} on ${conflictAppt.date}.`
        : `Employee conflict: ${conflictAppt.employeeName} already has an appointment with ${conflictAppt.providerName} at ${conflictAppt.time} on ${conflictAppt.date}.`
      );
      return;
    }

    setSubmitting(true);
    try {
      if (isDemoMode) {
        // Demo mode: update local state only
        if (editingId) {
          setDemoAppointments((prev) =>
            prev.map((a) => a.id === editingId ? { ...a, ...formData } : a)
          );
          // Also update base demo data items in local state
          setDemoAppointments((prev) => {
            const exists = prev.some((a) => a.id === editingId);
            if (!exists) {
              const baseItem = dbAppointments.find((a) => a.id === editingId);
              if (baseItem) {
                return [...prev, { ...baseItem, ...formData }];
              }
            }
            return prev;
          });
        } else {
          const newAppt: Appointment = {
            id: `demo-appt-${Date.now()}`,
            employeeName: formData.employeeName || '',
            companyName: formData.companyName || '',
            type: formData.type || 'Occupational Health',
            mode: formData.mode || 'In-clinic',
            status: formData.status || 'Pending',
            date: formData.date || '',
            time: formData.time || '09:00',
            durationMin: formData.durationMin || 30,
            providerName: formData.providerName || '',
            location: formData.location || '',
          };
          setDemoAppointments((prev) => [...prev, newAppt]);
        }
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } else {
        if (editingId) {
          await updateAppointment(editingId, formData);
          setSaved(true);
          setTimeout(() => setSaved(false), 2000);
        } else {
          await addAppointment(formData);
        }
      }
      setShowForm(false);
      setEditingId(null);
      setFormData(emptyForm);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to save appointment');
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (appt: Appointment) => {
    setFormData({
      employeeName: appt.employeeName,
      companyName: appt.companyName,
      type: appt.type,
      mode: appt.mode,
      status: appt.status,
      date: appt.date,
      time: appt.time,
      durationMin: appt.durationMin,
      providerName: appt.providerName,
      location: appt.location,
    });
    setEditingId(appt.id);
    setShowForm(true);
  };

  const confirmCancel = async () => {
    if (!cancelTarget) return;
    try {
      if (isDemoMode) {
        setDemoAppointments((prev) => {
          const exists = prev.some((a) => a.id === cancelTarget.id);
          if (exists) {
            return prev.map((a) => a.id === cancelTarget.id ? { ...a, status: 'Cancelled' } : a);
          }
          return [...prev, { ...cancelTarget, status: 'Cancelled' }];
        });
      } else {
        await updateAppointment(cancelTarget.id, { status: 'Cancelled' });
      }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to cancel appointment');
    }
    setCancelTarget(null);
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><span className="w-6 h-6 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin" /></div>;
  }

  if (error) {
    return <div className="card p-6 text-center"><AlertCircle size={24} className="text-danger-500 mx-auto mb-2" /><p className="text-sm text-ink-600">Failed to load appointments: {error}</p></div>;
  }

  // --- Detail view ---
  if (detailAppt) {
    const linkedMedicals = relatedMedicals(detailAppt);
    const ModeIcon = modeIcons[detailAppt.mode] || Building;
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <button onClick={() => setDetailAppt(null)} className="btn-secondary">
            <ArrowRight size={16} className="rotate-180" /> Back to Appointments
          </button>
          <Badge color={statusColors[detailAppt.status]} dot>{detailAppt.status}</Badge>
        </div>

        <div className="card overflow-hidden">
          <div className="h-20 bg-gradient-to-br from-brand-600 to-brand-900" />
          <div className="p-5 lg:p-6 -mt-8">
            <div className="flex items-end gap-4">
              <div className="h-16 w-16 rounded-2xl bg-white border-4 border-white shadow-lg flex items-center justify-center">
                <CalendarDays size={28} className="text-brand-600" />
              </div>
              <div className="mb-1">
                <h2 className="text-xl font-display font-bold text-ink-900">{detailAppt.employeeName}</h2>
                <p className="text-sm text-ink-500">{detailAppt.companyName} · {detailAppt.type}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="card p-5">
            <h3 className="font-display font-bold text-ink-900 mb-4">Appointment Details</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-ink-100">
                <span className="flex items-center gap-2 text-sm text-ink-500"><CalendarDays size={15} /> Date</span>
                <span className="font-semibold text-ink-900">{detailAppt.date || 'Not set'}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-ink-100">
                <span className="flex items-center gap-2 text-sm text-ink-500"><Clock size={15} /> Time</span>
                <span className="font-semibold text-ink-900">{detailAppt.time} · {detailAppt.durationMin}min</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-ink-100">
                <span className="flex items-center gap-2 text-sm text-ink-500"><ModeIcon size={15} /> Mode</span>
                <span className="font-semibold text-ink-900">{detailAppt.mode}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-ink-100">
                <span className="flex items-center gap-2 text-sm text-ink-500"><MapPin size={15} /> Location</span>
                <span className="font-semibold text-ink-900">{detailAppt.location || 'Not set'}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-ink-500">Provider</span>
                <span className="font-semibold text-ink-900">{detailAppt.providerName || 'Not assigned'}</span>
              </div>
            </div>
          </div>

          <div className="card p-5">
            <h3 className="font-display font-bold text-ink-900 mb-4 flex items-center gap-2"><Stethoscope size={18} className="text-brand-600" /> Linked Medical Assessments</h3>
            {linkedMedicals.length === 0 ? (
              <p className="text-sm text-ink-400 py-6 text-center">No medical assessments linked to this employee.</p>
            ) : (
              <div className="space-y-2.5">
                {linkedMedicals.map((m) => (
                  <div key={m.id} className="p-3 bg-ink-50 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-semibold text-ink-900">{m.type}</p>
                      <Badge color={m.status === 'Completed' ? 'success' : m.status === 'Overdue' ? 'danger' : 'warning'}>{m.status}</Badge>
                    </div>
                    <p className="text-xs text-ink-500">{m.date} · {m.providerName} · {m.result}</p>
                    {m.notes && <p className="text-xs text-ink-400 mt-1">{m.notes}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <button onClick={() => { setDetailAppt(null); startEdit(detailAppt); }} className="btn-secondary"><Edit3 size={16} /> Edit</button>
          {detailAppt.status !== 'Cancelled' && detailAppt.status !== 'Completed' && (
            <button onClick={() => { setDetailAppt(null); setCancelTarget(detailAppt); }} className="btn-secondary text-danger-600 hover:bg-danger-50"><Trash2 size={16} /> Cancel Appointment</button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {isDemoMode && (
        <div className="p-3 bg-warning-50 text-warning-700 text-sm rounded-lg flex items-center gap-2">
          <AlertCircle size={16} className="shrink-0" />
          Demo mode — showing sample appointments. Changes are local only and will not be saved as live records. Restart the dev server with valid Supabase credentials to enable live data.
        </div>
      )}
      {showForm && (
        <div className="card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-ink-900">{editingId ? 'Edit Appointment' : 'Book Appointment'}</h3>
            <button type="button" className="btn-secondary" onClick={() => { setShowForm(false); setEditingId(null); setFormData(emptyForm); setConflict(null); }}><X size={16} /> Cancel</button>
          </div>
          {submitError && <div className="p-3 bg-danger-50 text-danger-700 text-sm rounded-lg">{submitError}</div>}
          {conflict && <div className="p-3 bg-warning-50 text-warning-700 text-sm rounded-lg flex items-start gap-2"><AlertCircle size={16} className="mt-0.5 shrink-0" /> {conflict}</div>}
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
                <label className="block text-sm font-semibold text-ink-700 mb-1">Type</label>
                <div className="relative">
                  <select className="input w-full pr-9 appearance-none cursor-pointer" value={formData.type || 'Occupational Health'} onChange={(e) => setFormData({ ...formData, type: e.target.value as AppointmentType })}>
                    {appointmentTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-ink-700 mb-1">Mode</label>
                <div className="relative">
                  <select className="input w-full pr-9 appearance-none cursor-pointer" value={formData.mode || 'In-clinic'} onChange={(e) => setFormData({ ...formData, mode: e.target.value as AppointmentMode })}>
                    {appointmentModes.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                  <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-ink-700 mb-1">Status</label>
                <div className="relative">
                  <select className="input w-full pr-9 appearance-none cursor-pointer" value={formData.status || 'Pending'} onChange={(e) => setFormData({ ...formData, status: e.target.value as AppointmentStatus })}>
                    {appointmentStatuses.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-ink-700 mb-1">Date *</label>
                <input className="input w-full" type="date" value={formData.date || ''} onChange={(e) => setFormData({ ...formData, date: e.target.value })} required />
              </div>
              <div>
                <label className="block text-sm font-semibold text-ink-700 mb-1">Time</label>
                <input className="input w-full" type="time" value={formData.time || '09:00'} onChange={(e) => setFormData({ ...formData, time: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-ink-700 mb-1">Duration (min)</label>
                <input className="input w-full" type="number" min={5} step={5} value={formData.durationMin || 30} onChange={(e) => setFormData({ ...formData, durationMin: parseInt(e.target.value) || 30 })} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-ink-700 mb-1">Provider</label>
                <input className="input w-full" value={formData.providerName || ''} onChange={(e) => setFormData({ ...formData, providerName: e.target.value })} placeholder="Clinician name" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-ink-700 mb-1">Location</label>
                <input className="input w-full" value={formData.location || ''} onChange={(e) => setFormData({ ...formData, location: e.target.value })} placeholder="Clinic, site, or video call" />
              </div>
            </div>
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : saved ? <><Check size={16} /> Saved</> : <><Plus size={16} /> {editingId ? 'Save Changes' : 'Book Appointment'}</>}
            </button>
          </form>
        </div>
      )}

      {/* Cancel confirmation */}
      {cancelTarget && (
        <div className="card p-5 space-y-4 border-danger-200">
          <div className="flex items-center gap-3">
            <AlertCircle size={20} className="text-danger-600" />
            <h3 className="text-lg font-bold text-ink-900">Cancel this appointment?</h3>
          </div>
          <p className="text-sm text-ink-600">
            {cancelTarget.employeeName} — {cancelTarget.type} on {cancelTarget.date} at {cancelTarget.time}.
            {isDemoMode ? ' This is a demo record — the change will be local only.' : ' This will mark the appointment as cancelled.'}
          </p>
          <div className="flex gap-2">
            <button onClick={confirmCancel} className="btn-primary bg-danger-600 hover:bg-danger-700">Yes, Cancel Appointment</button>
            <button onClick={() => setCancelTarget(null)} className="btn-secondary">Keep Appointment</button>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-display font-bold text-ink-900">Appointments</h2>
          <p className="text-sm text-ink-500">{upcoming.length} upcoming · {appointments.length} total</p>
        </div>
        <button className="btn-primary" onClick={() => { setFormData(emptyForm); setEditingId(null); setShowForm(true); }}>
          <Plus size={16} /> Book Appointment
        </button>
      </div>

      <div className="flex gap-2">
        <button onClick={() => setView('upcoming')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${view === 'upcoming' ? 'bg-brand-600 text-white' : 'bg-white text-ink-600 border border-ink-200 hover:bg-ink-50'}`}>
          Upcoming
        </button>
        <button onClick={() => setView('all')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${view === 'all' ? 'bg-brand-600 text-white' : 'bg-white text-ink-600 border border-ink-200 hover:bg-ink-50'}`}>
          All Appointments
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
          <input
            className="input w-full pl-9"
            placeholder="Search by employee, company, provider, type or location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className="input sm:w-44" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">All statuses</option>
          {appointmentStatuses.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <label className="block text-xs font-medium text-ink-500 mb-1">From date</label>
          <input className="input w-full" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        </div>
        <div className="flex-1">
          <label className="block text-xs font-medium text-ink-500 mb-1">To date</label>
          <input className="input w-full" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </div>
        {(dateFrom || dateTo) && (
          <button onClick={() => { setDateFrom(''); setDateTo(''); }} className="btn-secondary self-end">Clear dates</button>
        )}
      </div>

      {display.length === 0 ? (
        <div className="card p-12 text-center">
          <CalendarDays size={32} className="text-ink-300 mx-auto mb-3" />
          <p className="text-sm text-ink-500">No appointments found. {search || statusFilter !== 'all' || dateFrom || dateTo ? 'Try adjusting your filters.' : 'Click "Book Appointment" to create one.'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {display.map((appt) => {
            const ModeIcon = modeIcons[appt.mode] || Building;
            const linkedCount = relatedMedicals(appt).length;
            return (
              <div key={appt.id} className="card card-hover p-5">
                <div className="flex items-start gap-4">
                  <div className="flex flex-col items-center justify-center w-14 h-14 rounded-xl bg-brand-50 text-brand-700 shrink-0">
                    <span className="text-[10px] font-medium uppercase">{appt.date ? new Date(appt.date).toLocaleDateString('en', { month: 'short' }) : '—'}</span>
                    <span className="text-xl font-bold leading-none">{appt.date ? new Date(appt.date).getDate() : '—'}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 cursor-pointer" onClick={() => setDetailAppt(appt)}>
                        <p className="text-sm font-semibold text-ink-900 hover:text-brand-600 transition-colors">{appt.employeeName}</p>
                        <p className="text-xs text-ink-400 truncate">{appt.companyName}</p>
                      </div>
                      <Badge color={statusColors[appt.status]} dot>{appt.status}</Badge>
                    </div>
                    <p className="text-sm text-ink-700 mt-2 font-medium">{appt.type}</p>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-ink-500">
                      <span className="flex items-center gap-1"><Clock size={12} /> {appt.time} · {appt.durationMin}min</span>
                      <span className="flex items-center gap-1"><ModeIcon size={12} /> {appt.mode}</span>
                      <span className="flex items-center gap-1"><MapPin size={12} /> {appt.location}</span>
                    </div>
                    {linkedCount > 0 && (
                      <button onClick={() => setDetailAppt(appt)} className="mt-1.5 inline-flex items-center gap-1 text-xs text-brand-600 font-medium hover:text-brand-700">
                        <Stethoscope size={12} /> {linkedCount} linked medical{linkedCount !== 1 ? 's' : ''}
                      </button>
                    )}
                    <div className="mt-2.5 pt-2.5 border-t border-ink-100 flex items-center justify-between">
                      <p className="text-xs text-ink-400">Provider: <span className="text-ink-600 font-medium">{appt.providerName || 'Not assigned'}</span></p>
                      <div className="flex gap-1">
                        <button onClick={() => setDetailAppt(appt)} className="btn-ghost p-1.5" title="View details"><CalendarDays size={14} /></button>
                        <button onClick={() => startEdit(appt)} className="btn-ghost p-1.5" title="Edit"><Edit3 size={14} /></button>
                        {appt.status !== 'Cancelled' && appt.status !== 'Completed' && (
                          <button onClick={() => setCancelTarget(appt)} className="btn-ghost p-1.5 text-danger-600 hover:bg-danger-50" title="Cancel"><Trash2 size={14} /></button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
