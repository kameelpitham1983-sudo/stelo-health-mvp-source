import { useState } from 'react';
import { FileText, Search, Download, Filter, FileCheck2, Clock, XCircle, FileEdit, ChevronDown } from 'lucide-react';
import { documents } from '@/data/mockData';
import { Badge } from '@/components/Badge';

const statusColors: Record<string, 'success' | 'warning' | 'danger' | 'ink'> = {
  Verified: 'success',
  'Pending Review': 'warning',
  Rejected: 'danger',
  Draft: 'ink',
};

const statusIcons: Record<string, typeof FileCheck2> = {
  Verified: FileCheck2,
  'Pending Review': Clock,
  Rejected: XCircle,
  Draft: FileEdit,
};

export function Documents() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const filtered = documents.filter((d) => {
    const matchSearch = d.name.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === 'all' || d.type === typeFilter;
    return matchSearch && matchType;
  });

  const types = [...new Set(documents.map((d) => d.type))];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-display font-bold text-ink-900">Documents</h2>
          <p className="text-sm text-ink-500">{filtered.length} documents</p>
        </div>
        <button className="btn-primary"><FileText size={16} /> Upload Document</button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {(['Verified', 'Pending Review', 'Draft', 'Rejected'] as const).map((status) => {
          const Icon = statusIcons[status];
          const count = documents.filter((d) => d.status === status).length;
          const colorMap = { Verified: 'text-success-600 bg-success-50', 'Pending Review': 'text-warning-600 bg-warning-50', Draft: 'text-ink-500 bg-ink-100', Rejected: 'text-danger-600 bg-danger-50' };
          return (
            <div key={status} className="card p-4 flex items-center gap-3">
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${colorMap[status]}`}>
                <Icon size={18} />
              </div>
              <div><p className="text-xl font-bold font-display text-ink-900">{count}</p><p className="text-xs text-ink-400">{status}</p></div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
          <input type="text" placeholder="Search documents..." value={search} onChange={(e) => setSearch(e.target.value)} className="input pl-10" />
        </div>
        <div className="relative">
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="input pr-9 appearance-none cursor-pointer min-w-[180px]">
            <option value="all">All types</option>
            {types.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="divide-y divide-ink-100">
          {filtered.map((doc) => (
            <div key={doc.id} className="p-4 flex items-center gap-4 hover:bg-ink-50/50 transition-colors">
              <div className="h-10 w-10 rounded-lg bg-brand-50 flex items-center justify-center shrink-0">
                <FileText size={18} className="text-brand-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-ink-900 truncate">{doc.name}</p>
                <div className="flex items-center gap-3 mt-0.5 text-xs text-ink-400 flex-wrap">
                  <span>{doc.type}</span>
                  <span>·</span>
                  <span>{doc.companyName}</span>
                  {doc.employeeName && (<><span>·</span><span>{doc.employeeName}</span></>)}
                  <span>·</span>
                  <span>{doc.fileSize}</span>
                </div>
              </div>
              <div className="hidden sm:flex flex-col items-end gap-1 shrink-0">
                <Badge color={statusColors[doc.status]} dot>{doc.status}</Badge>
                <span className="text-xs text-ink-400">{doc.uploadedDate}</span>
              </div>
              <button className="btn-ghost p-2 shrink-0" title="Download">
                <Download size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
