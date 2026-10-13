import { useState } from 'react';
import { FileText, Search, Download, Filter, FileCheck2, Clock, XCircle, FileEdit, ChevronDown, X, AlertCircle, Plus, Check } from 'lucide-react';
import { useDocuments, useCompanies, useEmployees } from '@/hooks/useSupabaseData';
import { Badge } from '@/components/Badge';
import type { DocumentType, DocumentStatus } from '@/types';

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

const documentTypes: DocumentType[] = [
  'Medical Report', 'Vaccination Record', 'Travel Risk Assessment',
  'Fitness Certificate', 'Drug Screen Result', 'Company Contract', 'Compliance Certificate',
];

const emptyForm = {
  name: '',
  type: 'Medical Report' as DocumentType,
  status: 'Draft' as DocumentStatus,
  companyName: '',
  employeeName: '',
  uploadedBy: '',
  uploadedDate: '',
  fileSize: '',
  fileType: 'PDF',
};

export function Documents() {
  const { data: documents, loading, error, addDocument, updateDocument } = useDocuments();
  const { data: companies } = useCompanies();
  const { data: employees } = useEmployees();

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const filtered = documents.filter((d) => {
    const matchSearch = d.name.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === 'all' || d.type === typeFilter;
    return matchSearch && matchType;
  });

  const types = [...new Set(documents.map((d) => d.type))];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitting(true);
    try {
      await addDocument({
        ...formData,
        employeeName: formData.employeeName || undefined,
        uploadedDate: formData.uploadedDate || new Date().toISOString().slice(0, 10),
      });
      setShowForm(false);
      setFormData(emptyForm);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to upload document');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (id: string, status: DocumentStatus) => {
    try {
      await updateDocument(id, { status });
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to update document');
    }
  };

  const handleDownload = (doc: typeof documents[0]) => {
    const csvContent = `Document Name,Type,Status,Company,Employee,Uploaded By,Date,Size\n"${doc.name}","${doc.type}","${doc.status}","${doc.companyName}","${doc.employeeName || ''}","${doc.uploadedBy}","${doc.uploadedDate}","${doc.fileSize}"`;
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement('a');
    a.href = url;
    a.download = `${doc.name.replace(/\.[^.]+$/, '')}-metadata.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><span className="w-6 h-6 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin" /></div>;
  }

  if (error) {
    return <div className="card p-6 text-center"><AlertCircle size={24} className="text-danger-500 mx-auto mb-2" /><p className="text-sm text-ink-600">Failed to load documents: {error}</p></div>;
  }

  return (
    <div className="space-y-6">
      {submitError && <div className="p-3 bg-danger-50 text-danger-700 text-sm rounded-lg flex items-center gap-2"><AlertCircle size={16} /> {submitError}</div>}

      {showForm && (
        <div className="card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-ink-900">Upload Document</h3>
            <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}><X size={16} /> Cancel</button>
          </div>
          <p className="text-xs text-ink-500 bg-ink-50 p-3 rounded-lg">File storage is not yet configured. You can register document metadata for tracking purposes. To enable actual file uploads, Supabase Storage needs to be set up.</p>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-ink-700 mb-1">Document Name *</label>
                <input className="input w-full" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required placeholder="e.g. Fitness Certificate — John Doe.pdf" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-ink-700 mb-1">Type</label>
                <div className="relative">
                  <select className="input w-full pr-9 appearance-none cursor-pointer" value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value as DocumentType })}>
                    {documentTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-ink-700 mb-1">Status</label>
                <div className="relative">
                  <select className="input w-full pr-9 appearance-none cursor-pointer" value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as DocumentStatus })}>
                    <option>Draft</option><option>Pending Review</option><option>Verified</option><option>Rejected</option>
                  </select>
                  <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-ink-700 mb-1">Company</label>
                <select className="input w-full" value={formData.companyName} onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}>
                  <option value="">Select company...</option>
                  {companies.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-ink-700 mb-1">Employee (optional)</label>
                <select className="input w-full" value={formData.employeeName} onChange={(e) => setFormData({ ...formData, employeeName: e.target.value })}>
                  <option value="">None</option>
                  {employees.map((e) => <option key={e.id} value={e.name}>{e.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-ink-700 mb-1">Uploaded By</label>
                <input className="input w-full" value={formData.uploadedBy} onChange={(e) => setFormData({ ...formData, uploadedBy: e.target.value })} placeholder="Your name" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-ink-700 mb-1">File Size</label>
                <input className="input w-full" value={formData.fileSize} onChange={(e) => setFormData({ ...formData, fileSize: e.target.value })} placeholder="e.g. 184 KB" />
              </div>
            </div>
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Plus size={16} /> Register Document</>}
            </button>
          </form>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-display font-bold text-ink-900">Documents</h2>
          <p className="text-sm text-ink-500">{filtered.length} documents</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(true)}><FileText size={16} /> Upload Document</button>
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

      {filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <FileText size={32} className="text-ink-300 mx-auto mb-3" />
          <p className="text-sm text-ink-500">No documents found. Click "Upload Document" to register one.</p>
        </div>
      ) : (
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
                  <select
                    className="text-xs border border-ink-200 rounded-lg px-2 py-1 bg-white cursor-pointer focus:outline-none focus:border-brand-500"
                    value={doc.status}
                    onChange={(e) => handleStatusChange(doc.id, e.target.value as DocumentStatus)}
                  >
                    <option>Draft</option><option>Pending Review</option><option>Verified</option><option>Rejected</option>
                  </select>
                  <span className="text-xs text-ink-400">{doc.uploadedDate}</span>
                </div>
                <Badge color={statusColors[doc.status]} dot>{doc.status}</Badge>
                <button onClick={() => handleDownload(doc)} className="btn-ghost p-2 shrink-0" title="Download metadata">
                  <Download size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
