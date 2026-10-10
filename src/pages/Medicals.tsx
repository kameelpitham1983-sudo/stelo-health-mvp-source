import { useState } from 'react';
import { Search, Stethoscope, Calendar, Plus, ChevronDown } from 'lucide-react';
import { medicals } from '@/data/mockData';
import { Badge } from '@/components/Badge';

const statusColors: Record<string, 'success' | 'warning' | 'danger' | 'brand' | 'ink'> = {
  Completed: 'success',
  Scheduled: 'brand',
  'In Progress': 'warning',
  Overdue: 'danger',
  Cancelled: 'ink',
};

const typeColors: Record<string, string> = {
  'Pre-Employment': 'bg-brand-50 text-brand-600',
  'Annual Occupational': 'bg-teal-50 text-teal-600',
  'Return to Work': 'bg-warning-50 text-warning-600',
  'Travel Health': 'bg-accent-50 text-accent-600',
  'Drug & Alcohol Screen': 'bg-danger-50 text-danger-600',
  Audiometry: 'bg-ink-100 text-ink-600',
  Spirometry: 'bg-success-50 text-success-600',
  'Vision Test': 'bg-brand-50 text-brand-600',
};

export function Medicals() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = medicals.filter((m) => {
    const matchSearch = m.employeeName.toLowerCase().includes(search.toLowerCase()) || m.type.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || m.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-display font-bold text-ink-900">Medicals</h2>
          <p className="text-sm text-ink-500">{filtered.length} medical assessments</p>
        </div>
        <button className="btn-primary"><Plus size={16} /> New Assessment</button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {(['Completed', 'Scheduled', 'In Progress', 'Overdue', 'Cancelled'] as const).map((status) => {
          const count = medicals.filter((m) => m.status === status).length;
          return (
            <button
              key={status}
              onClick={() => setStatusFilter(statusFilter === status ? 'all' : status)}
              className={`card p-3.5 text-left transition-all ${statusFilter === status ? 'ring-2 ring-brand-500 border-brand-300' : 'card-hover'}`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className={`w-2 h-2 rounded-full ${statusColors[status] === 'success' ? 'bg-success-500' : statusColors[status] === 'warning' ? 'bg-warning-500' : statusColors[status] === 'danger' ? 'bg-danger-500' : statusColors[status] === 'brand' ? 'bg-brand-500' : 'bg-ink-400'}`} />
                <span className="text-xs font-medium text-ink-500">{status}</span>
              </div>
              <p className="text-xl font-bold font-display text-ink-900">{count}</p>
            </button>
          );
        })}
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
        <input type="text" placeholder="Search by employee or assessment type..." value={search} onChange={(e) => setSearch(e.target.value)} className="input pl-10" />
      </div>

      <div className="space-y-3">
        {filtered.map((med) => (
          <div key={med.id} className="card card-hover p-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 ${typeColors[med.type] || 'bg-ink-100 text-ink-600'}`}>
                  <Stethoscope size={20} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink-900">{med.employeeName}</p>
                  <p className="text-xs text-ink-400 truncate">{med.companyName}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 sm:gap-6 flex-wrap">
                <div>
                  <p className="text-xs text-ink-400">Type</p>
                  <p className="text-sm font-medium text-ink-700">{med.type}</p>
                </div>
                <div className="hidden md:block">
                  <p className="text-xs text-ink-400">Date</p>
                  <p className="text-sm font-medium text-ink-700 flex items-center gap-1"><Calendar size={12} className="text-ink-400" />{med.date}</p>
                </div>
                <div className="hidden lg:block">
                  <p className="text-xs text-ink-400">Provider</p>
                  <p className="text-sm font-medium text-ink-700">{med.providerName}</p>
                </div>
                <div className="hidden xl:block max-w-[200px]">
                  <p className="text-xs text-ink-400">Result</p>
                  <p className="text-sm font-medium text-ink-700 truncate">{med.result}</p>
                </div>
                <Badge color={statusColors[med.status]} dot>{med.status}</Badge>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
