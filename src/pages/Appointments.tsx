import { useState } from 'react';
import { CalendarDays, Clock, MapPin, Video, Building, Plus, ChevronDown } from 'lucide-react';
import { appointments } from '@/data/mockData';
import { Badge } from '@/components/Badge';

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

export function Appointments() {
  const [view, setView] = useState<'upcoming' | 'all'>('upcoming');

  const sorted = [...appointments].sort((a, b) => a.date.localeCompare(b.date));
  const upcoming = sorted.filter((a) => a.status === 'Confirmed' || a.status === 'Pending');
  const display = view === 'upcoming' ? upcoming : sorted;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-display font-bold text-ink-900">Appointments</h2>
          <p className="text-sm text-ink-500">{upcoming.length} upcoming · {appointments.length} total</p>
        </div>
        <button className="btn-primary"><Plus size={16} /> Book Appointment</button>
      </div>

      <div className="flex gap-2">
        <button onClick={() => setView('upcoming')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${view === 'upcoming' ? 'bg-brand-600 text-white' : 'bg-white text-ink-600 border border-ink-200 hover:bg-ink-50'}`}>
          Upcoming
        </button>
        <button onClick={() => setView('all')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${view === 'all' ? 'bg-brand-600 text-white' : 'bg-white text-ink-600 border border-ink-200 hover:bg-ink-50'}`}>
          All Appointments
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {display.map((appt) => {
          const ModeIcon = modeIcons[appt.mode] || Building;
          return (
            <div key={appt.id} className="card card-hover p-5">
              <div className="flex items-start gap-4">
                <div className="flex flex-col items-center justify-center w-14 h-14 rounded-xl bg-brand-50 text-brand-700 shrink-0">
                  <span className="text-[10px] font-medium uppercase">{new Date(appt.date).toLocaleDateString('en', { month: 'short' })}</span>
                  <span className="text-xl font-bold leading-none">{new Date(appt.date).getDate()}</span>
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
                  <div className="mt-2.5 pt-2.5 border-t border-ink-100">
                    <p className="text-xs text-ink-400">Provider: <span className="text-ink-600 font-medium">{appt.providerName}</span></p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
