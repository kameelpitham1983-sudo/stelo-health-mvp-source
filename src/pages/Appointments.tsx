import { useState } from 'react';
import { CalendarDays, Clock, MapPin, Video, Building, Plus, ChevronDown, X, AlertCircle, Check, Edit3, Trash2 } from 'lucide-react';
import { useAppointments, useEmployees, useCompanies } from '@/hooks/useSupabaseData';
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
  const { data: appointments, loading, error, addAppointment, updateAppointment } = useAppointments();
  const { data: employees } = useEmployees();
  const { data: companies } = useCompanies();

  const [view, setView] = useState<'upcoming' | 'all'>('upcoming');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<Partial<Appointment>>(emptyForm);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [conflict, setConflict] = useState<string | null>(null);

  const sorted = [...appointments].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  const upcoming = sorted.filter((a) => a.status === 'Confirmed' || a.status === 'Pending');
  const display = view === 'upcoming' ? upcoming : sorted;

  const handleEmployeeSelect = (empId: string) => {
    const emp = employees.find((e) => e.id === empId);
    if (emp) {
      setFormData({ ...formData, employeeName: emp.name, companyName: emp.companyName });
    }
  };

  const checkConflict = (date: string, time: string, providerName: string, employeeName: string, excludeId?: string) => {
    if (!date || !time) return null;
    // Check provider conflict
    const providerConflict = appointments.find(
      (a) => a.date === date && a.time === time &&
      a.providerName === providerName &&
      a.status !== 'Cancelled' && a.status !== 'Completed' &&
      a.id !== excludeId
    );
    if (providerConflict) return providerConflict;
    // Check employee conflict
    const employeeConflict = appointments.find(
      (a) => a.date === date && a.time === time &&
      a.employeeName === employeeName &&
      a.status !== 'Cancelled' && a.status !== 'Completed' &&
      a.id !== excludeId
    );
    return employeeConflict || null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setConflict(null);

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
      if (editingId) {
        await updateAppointment(editingId, formData);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
        setEditingId(null);
      } else {
        await addAppointment(formData);
      }
      setShowForm(false);
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

  const handleCancel = async (id: string) => {
    try {
      await updateAppointment(id, { status: 'Cancelled' });
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to cancel appointment');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><span className="w-6 h-6 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin" /></div>;
  }

  if (error) {
    return <div className="card p-6 text-center"><AlertCircle size={24} className="text-danger-500 mx-auto mb-2" /><p className="text-sm text-ink-600">Failed to load appointments: {error}</p></div>;
  }

  return (
    <div className="space-y-6">
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

      {display.length === 0 ? (
        <div className="card p-12 text-center">
          <CalendarDays size={32} className="text-ink-300 mx-auto mb-3" />
          <p className="text-sm text-ink-500">No appointments found. Click "Book Appointment" to create one.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {display.map((appt) => {
            const ModeIcon = modeIcons[appt.mode] || Building;
            return (
              <div key={appt.id} className="card card-hover p-5">
                <div className="flex items-start gap-4">
                  <div className="flex flex-col items-center justify-center w-14 h-14 rounded-xl bg-brand-50 text-brand-700 shrink-0">
                    <span className="text-[10px] font-medium uppercase">{appt.date ? new Date(appt.date).toLocaleDateString('en', { month: 'short' }) : '—'}</span>
                    <span className="text-xl font-bold leading-none">{appt.date ? new Date(appt.date).getDate() : '—'}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-ink-900">{appt.employeeName}</p>
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
                    <div className="mt-2.5 pt-2.5 border-t border-ink-100 flex items-center justify-between">
                      <p className="text-xs text-ink-400">Provider: <span className="text-ink-600 font-medium">{appt.providerName}</span></p>
                      <div className="flex gap-1">
                        <button onClick={() => startEdit(appt)} className="btn-ghost p-1.5" title="Edit"><Edit3 size={14} /></button>
                        {appt.status !== 'Cancelled' && appt.status !== 'Completed' && (
                          <button onClick={() => handleCancel(appt.id)} className="btn-ghost p-1.5 text-danger-600 hover:bg-danger-50" title="Cancel"><Trash2 size={14} /></button>
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
