import { useState, useMemo } from 'react';
import { History, Search, Filter, ChevronDown, AlertCircle, Download, CheckCircle2, XCircle } from 'lucide-react';
import { useAuditLog } from '@/hooks/useSupabaseData';
import { Badge } from '@/components/Badge';
import { useApp } from '@/context/AppContext';

const recordTypeLabels: Record<string, string> = {
  medical: 'Medical Assessment',
  appointment: 'Appointment',
  document: 'Document',
  travel: 'Travel Health',
  company: 'Company',
  employee: 'Employee',
  sickness: 'Sickness Absence',
  workflow: 'Workflow',
  gop: 'Guarantee of Payment',
  certificate: 'Digital Certificate',
  provider: 'Provider',
  accommodation: 'Accommodation',
  synopsis: 'Synopsis',
  note: 'Record Note',
};

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) +
    ' · ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

export function AuditLog() {
  const { user } = useApp();
  const { data: entries, loading, error } = useAuditLog();

  const [search, setSearch] = useState('');
  const [recordTypeFilter, setRecordTypeFilter] = useState('all');
  const [actionFilter, setActionFilter] = useState('all');
  const [actorFilter, setActorFilter] = useState('all');

  const recordTypes = useMemo(() => {
    const set = new Set(entries.map((e) => e.recordType));
    return ['all', ...Array.from(set).sort()];
  }, [entries]);

  const actions = useMemo(() => {
    const set = new Set(entries.map((e) => e.action));
    return ['all', ...Array.from(set).sort()];
  }, [entries]);

  const actors = useMemo(() => {
    const set = new Set(entries.map((e) => e.actorName).filter(Boolean));
    return ['all', ...Array.from(set).sort()];
  }, [entries]);

  const filtered = useMemo(() => {
    return entries.filter((e) => {
      if (recordTypeFilter !== 'all' && e.recordType !== recordTypeFilter) return false;
      if (actionFilter !== 'all' && e.action !== actionFilter) return false;
      if (actorFilter !== 'all' && e.actorName !== actorFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const matches =
          e.recordReference.toLowerCase().includes(q) ||
          e.actorName.toLowerCase().includes(q) ||
          e.action.toLowerCase().includes(q) ||
          (e.details || '').toLowerCase().includes(q) ||
          recordTypeLabels[e.recordType]?.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [entries, recordTypeFilter, actionFilter, actorFilter, search]);

  const handleExport = () => {
    const rows: string[] = [];
    rows.push('Date,Actor,Role,Record Type,Record Reference,Action,From Status,To Status,Details,Success');
    filtered.forEach((e) => {
      rows.push([
        e.createdAt,
        `"${e.actorName}"`,
        e.actorRole,
        recordTypeLabels[e.recordType] || e.recordType,
        `"${e.recordReference}"`,
        e.action,
        e.fromStatus || '',
        e.toStatus || '',
        `"${(e.details || '').replace(/"/g, '""')}"`,
        e.success ? 'Yes' : 'No',
      ].join(','));
    });
    const csv = rows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement('a');
    a.href = url;
    a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><span className="w-6 h-6 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin" /></div>;
  }

  if (error) {
    return (
      <div className="card p-6 text-center">
        <AlertCircle size={24} className="text-danger-500 mx-auto mb-2" />
        <p className="text-sm text-ink-600">Failed to load audit log: {error}</p>
      </div>
    );
  }

  const isAdmin = user?.role === 'admin' || user?.role === 'coordinator';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-display font-bold text-ink-900 flex items-center gap-2">
            <History size={20} className="text-brand-600" /> Audit Log
          </h2>
          <p className="text-sm text-ink-500">Central record of all platform activity — {entries.length} entries</p>
        </div>
        {isAdmin && filtered.length > 0 && (
          <button onClick={handleExport} className="btn-secondary">
            <Download size={16} /> Export CSV
          </button>
        )}
      </div>

      {!isAdmin && (
        <div className="p-3 bg-warning-50 text-warning-700 text-sm rounded-lg flex items-center gap-2">
          <AlertCircle size={16} className="shrink-0" />
          You have limited access to audit entries. Only entries from your company are shown.
        </div>
      )}

      {/* Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
          <input
            type="text"
            placeholder="Search by reference, actor, action or details..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <FilterSelect label="Record Type" value={recordTypeFilter} options={recordTypes.map((t) => ({ value: t, label: t === 'all' ? 'All types' : recordTypeLabels[t] || t }))} onChange={setRecordTypeFilter} />
          <FilterSelect label="Action" value={actionFilter} options={actions.map((a) => ({ value: a, label: a === 'all' ? 'All actions' : a }))} onChange={setActionFilter} />
          <FilterSelect label="Actor" value={actorFilter} options={actors.map((a) => ({ value: a, label: a === 'all' ? 'All users' : a }))} onChange={setActorFilter} />
        </div>
      </div>

      {/* Entries */}
      {filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <History size={32} className="text-ink-300 mx-auto mb-3" />
          <p className="text-sm text-ink-500">No audit entries match your filters.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="divide-y divide-ink-100">
            {filtered.map((entry) => (
              <div key={entry.id} className="p-4 flex items-start gap-4 hover:bg-ink-50/50 transition-colors">
                <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${entry.success ? 'bg-success-50' : 'bg-danger-50'}`}>
                  {entry.success ? <CheckCircle2 size={16} className="text-success-600" /> : <XCircle size={16} className="text-danger-600" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-sm font-semibold text-ink-900">{entry.actorName}</span>
                    <Badge color="ink">{entry.actorRole}</Badge>
                    <Badge color="brand">{recordTypeLabels[entry.recordType] || entry.recordType}</Badge>
                    <span className="text-sm text-ink-600 font-medium">{entry.action}</span>
                  </div>
                  {entry.recordReference && (
                    <p className="text-xs text-ink-500 mb-0.5">Record: {entry.recordReference}</p>
                  )}
                  {(entry.fromStatus || entry.toStatus) && (
                    <p className="text-xs text-ink-500 mb-0.5">
                      {entry.fromStatus && <span className="text-ink-400">{entry.fromStatus}</span>}
                      {entry.fromStatus && entry.toStatus && <span className="text-ink-300 mx-1">→</span>}
                      {entry.toStatus && <span className="text-ink-700 font-medium">{entry.toStatus}</span>}
                    </p>
                  )}
                  {entry.details && (
                    <p className="text-xs text-ink-500 mt-1">{entry.details}</p>
                  )}
                </div>
                <span className="text-xs text-ink-400 shrink-0 whitespace-nowrap">{formatDateTime(entry.createdAt)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function FilterSelect({ label, value, options, onChange }: { label: string; value: string; options: { value: string; label: string }[]; onChange: (v: string) => void }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input pr-9 appearance-none cursor-pointer min-w-[140px] text-sm"
      >
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
      <span className="absolute -top-2 left-2 px-1 bg-white text-[10px] font-semibold text-ink-400 uppercase tracking-wider">{label}</span>
    </div>
  );
}
