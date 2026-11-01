import { useState, useEffect } from 'react';
import { FileText, Search, Download, FileCheck2, Clock, XCircle, FileEdit, ChevronDown, X, AlertCircle, Plus, CalendarClock, AlertTriangle, ArrowLeft, Link2, User, Building2, Stethoscope, Calendar, Workflow, History, Lock, Replace } from 'lucide-react';
import { useDocuments, useCompanies, useEmployees, useMedicals, useAppointments, useDocumentVersions, useLogAuditEvent } from '@/hooks/useSupabaseData';
import { useApp } from '@/context/AppContext';
import { Badge } from '@/components/Badge';
import { NotesPanel } from '@/components/NotesPanel';
import type { DocumentType, DocumentStatus, DocumentRecord } from '@/types';

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
  expiryDate: '' as string,
};

function getExpiryStatus(expiryDate?: string | null): { label: string; color: 'success' | 'warning' | 'danger' | 'ink'; expired: boolean; expiringSoon: boolean } {
  if (!expiryDate) return { label: 'No expiry', color: 'ink', expired: false, expiringSoon: false };
  const now = new Date();
  const expiry = new Date(expiryDate);
  const daysUntilExpiry = Math.floor((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (daysUntilExpiry < 0) return { label: 'Expired', color: 'danger', expired: true, expiringSoon: false };
  if (daysUntilExpiry <= 30) return { label: `Expires in ${daysUntilExpiry}d`, color: 'warning', expired: false, expiringSoon: true };
  return { label: expiryDate, color: 'success', expired: false, expiringSoon: false };
}

export function Documents() {
  const { user, navContext, clearNavContext } = useApp();
  const { data: documents, loading, error, addDocument, updateDocument, replaceDocument } = useDocuments();
  const { data: companies } = useCompanies();
  const { data: employees } = useEmployees();
  const { data: medicals } = useMedicals();
  const { data: appointments } = useAppointments();
  const logAudit = useLogAuditEvent();

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showExpiredOnly, setShowExpiredOnly] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<DocumentRecord | null>(null);

  // Consume navigation context from other pages
  useEffect(() => {
    if (!navContext) return;
    if (navContext.employeeName) {
      setSearch(navContext.employeeName);
    } else if (navContext.companyName) {
      setSearch(navContext.companyName);
    }
    clearNavContext();
  }, [navContext, clearNavContext]);

  const filtered = documents.filter((d) => {
    const matchSearch = d.name.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === 'all' || d.type === typeFilter;
    const matchExpiry = !showExpiredOnly || getExpiryStatus(d.expiryDate).expired || getExpiryStatus(d.expiryDate).expiringSoon;
    return matchSearch && matchType && matchExpiry;
  });

  const types = [...new Set(documents.map((d) => d.type))];

  const expiredCount = documents.filter((d) => getExpiryStatus(d.expiryDate).expired).length;
  const expiringSoonCount = documents.filter((d) => getExpiryStatus(d.expiryDate).expiringSoon).length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitting(true);
    try {
      if (editingId) {
        const prevDoc = documents.find((d) => d.id === editingId);
        await updateDocument(editingId, {
          name: formData.name,
          type: formData.type,
          status: formData.status,
          expiryDate: formData.expiryDate || null,
        });
        await logAudit({
          actorName: user?.name || 'Unknown',
          actorRole: user?.role || 'admin',
          recordType: 'document',
          recordId: editingId,
          recordReference: formData.name,
          action: 'update',
          fromStatus: prevDoc?.status,
          toStatus: formData.status,
          details: `Document metadata updated`,
        });
        setEditingId(null);
      } else {
        const created = await addDocument({
          ...formData,
          employeeName: formData.employeeName || undefined,
          uploadedDate: formData.uploadedDate || new Date().toISOString().slice(0, 10),
          expiryDate: formData.expiryDate || null,
        });
        await logAudit({
          actorName: user?.name || 'Unknown',
          actorRole: user?.role || 'admin',
          recordType: 'document',
          recordId: created.id,
          recordReference: formData.name,
          action: 'create',
          toStatus: formData.status,
          details: `Document registered: ${formData.type}`,
        });
      }
      setShowForm(false);
      setFormData(emptyForm);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to save document');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (id: string, status: DocumentStatus) => {
    const prevDoc = documents.find((d) => d.id === id);
    try {
      await updateDocument(id, { status });
      await logAudit({
        actorName: user?.name || 'Unknown',
        actorRole: user?.role || 'admin',
        recordType: 'document',
        recordId: id,
        recordReference: prevDoc?.name || '',
        action: 'status_change',
        fromStatus: prevDoc?.status,
        toStatus: status,
        details: `Document status changed`,
      });
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to update document');
    }
  };

  const startEdit = (doc: DocumentRecord) => {
    setFormData({
      name: doc.name,
      type: doc.type,
      status: doc.status,
      companyName: doc.companyName,
      employeeName: doc.employeeName || '',
      uploadedBy: doc.uploadedBy,
      uploadedDate: doc.uploadedDate,
      fileSize: doc.fileSize,
      fileType: doc.fileType,
      expiryDate: doc.expiryDate || '',
    });
    setEditingId(doc.id);
    setShowForm(true);
  };

  const handleDownload = (doc: DocumentRecord) => {
    const csvContent = `Document Name,Type,Status,Company,Employee,Uploaded By,Date,Size,Expiry Date\n"${doc.name}","${doc.type}","${doc.status}","${doc.companyName}","${doc.employeeName || ''}","${doc.uploadedBy}","${doc.uploadedDate}","${doc.fileSize}","${doc.expiryDate || ''}"`;
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

  // --- Document Detail View ---
  const handleReplace = async (id: string, replacement: { name: string; type: DocumentType; versionNotes: string }) => {
    const prevDoc = documents.find((d) => d.id === id);
    if (!prevDoc) return;
    await replaceDocument(id, {
      name: replacement.name,
      type: replacement.type,
      status: 'Pending Review',
      uploadedBy: user?.name || 'Unknown',
      versionNotes: replacement.versionNotes,
    });
    const updated = { ...prevDoc, name: replacement.name, type: replacement.type, status: 'Pending Review' as DocumentStatus };
    setSelectedDoc(updated);
  };

  if (selectedDoc) {
    return <DocumentDetail doc={selectedDoc} onBack={() => setSelectedDoc(null)} onStatusChange={handleStatusChange} onDownload={handleDownload} onReplace={handleReplace} medicals={medicals} appointments={appointments} employees={employees} companies={companies} user={user} />;
  }

  return (
    <div className="space-y-6">
      {submitError && <div className="p-3 bg-danger-50 text-danger-700 text-sm rounded-lg flex items-center gap-2"><AlertCircle size={16} /> {submitError}</div>}

      {showForm && (
        <div className="card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-ink-900">{editingId ? 'Edit Document' : 'Upload Document'}</h3>
            <button type="button" className="btn-secondary" onClick={() => { setShowForm(false); setEditingId(null); setFormData(emptyForm); }}><X size={16} /> Cancel</button>
          </div>
          {!editingId && (
            <p className="text-xs text-ink-500 bg-ink-50 p-3 rounded-lg">File storage is not yet configured. You can register document metadata for tracking purposes. To enable actual file uploads, Supabase Storage needs to be set up.</p>
          )}
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
              {!editingId && (
                <>
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
                </>
              )}
              <div className={editingId ? 'sm:col-span-2' : ''}>
                <label className="block text-sm font-semibold text-ink-700 mb-1">Expiry Date</label>
                <input className="input w-full" type="date" value={formData.expiryDate} onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })} />
                <p className="text-xs text-ink-400 mt-1">Leave blank if no expiry applies</p>
              </div>
            </div>
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Plus size={16} /> {editingId ? 'Save Changes' : 'Register Document'}</>}
            </button>
          </form>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-display font-bold text-ink-900">Documents</h2>
          <p className="text-sm text-ink-500">{filtered.length} documents</p>
        </div>
        <button className="btn-primary" onClick={() => { setFormData(emptyForm); setEditingId(null); setShowForm(true); }}><FileText size={16} /> Upload Document</button>
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

      {/* Expiry alerts */}
      {(expiredCount > 0 || expiringSoonCount > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {expiredCount > 0 && (
            <button
              onClick={() => setShowExpiredOnly(!showExpiredOnly)}
              className={`card p-4 flex items-center gap-3 text-left transition-all ${showExpiredOnly ? 'ring-2 ring-danger-500 border-danger-300' : 'card-hover'}`}
            >
              <div className="h-10 w-10 rounded-lg bg-danger-50 flex items-center justify-center"><AlertTriangle size={18} className="text-danger-600" /></div>
              <div><p className="text-xl font-bold font-display text-ink-900">{expiredCount}</p><p className="text-xs text-ink-400">Expired documents</p></div>
            </button>
          )}
          {expiringSoonCount > 0 && (
            <button
              onClick={() => setShowExpiredOnly(!showExpiredOnly)}
              className={`card p-4 flex items-center gap-3 text-left transition-all ${showExpiredOnly ? 'ring-2 ring-warning-500 border-warning-300' : 'card-hover'}`}
            >
              <div className="h-10 w-10 rounded-lg bg-warning-50 flex items-center justify-center"><CalendarClock size={18} className="text-warning-600" /></div>
              <div><p className="text-xl font-bold font-display text-ink-900">{expiringSoonCount}</p><p className="text-xs text-ink-400">Expiring within 30 days</p></div>
            </button>
          )}
        </div>
      )}
      {showExpiredOnly && (
        <button onClick={() => setShowExpiredOnly(false)} className="text-xs font-semibold text-brand-600 hover:text-brand-700">Clear expiry filter</button>
      )}

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
            {filtered.map((doc) => {
              const expiry = getExpiryStatus(doc.expiryDate);
              return (
                <div key={doc.id} className="p-4 flex items-center gap-4 hover:bg-ink-50/50 transition-colors cursor-pointer" onClick={() => setSelectedDoc(doc)}>
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
                      {doc.expiryDate && (
                        <>
                          <span>·</span>
                          <span className={`flex items-center gap-1 font-medium ${expiry.expired ? 'text-danger-600' : expiry.expiringSoon ? 'text-warning-600' : 'text-ink-400'}`}>
                            <CalendarClock size={11} />
                            {expiry.label}
                          </span>
                        </>
                      )}
                      {doc.versionNumber && doc.versionNumber > 1 && (
                        <><span>·</span><span className="text-brand-600 font-medium">v{doc.versionNumber}</span></>
                      )}
                    </div>
                  </div>
                  {expiry.expired && <Badge color="danger" dot>Expired</Badge>}
                  {expiry.expiringSoon && <Badge color="warning" dot>Expiring</Badge>}
                  <div className="hidden sm:flex flex-col items-end gap-1 shrink-0">
                    <select
                      className="text-xs border border-ink-200 rounded-lg px-2 py-1 bg-white cursor-pointer focus:outline-none focus:border-brand-500"
                      value={doc.status}
                      onChange={(e) => { e.stopPropagation(); handleStatusChange(doc.id, e.target.value as DocumentStatus); }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <option>Draft</option><option>Pending Review</option><option>Verified</option><option>Rejected</option>
                    </select>
                    <span className="text-xs text-ink-400">{doc.uploadedDate}</span>
                  </div>
                  <Badge color={statusColors[doc.status]} dot>{doc.status}</Badge>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={(e) => { e.stopPropagation(); startEdit(doc); }} className="btn-ghost p-2 shrink-0" title="Edit"><FileEdit size={14} /></button>
                    <button onClick={(e) => { e.stopPropagation(); handleDownload(doc); }} className="btn-ghost p-2 shrink-0" title="Download metadata"><Download size={16} /></button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// --- Document Detail View Component ---

function DocumentDetail({
  doc,
  onBack,
  onStatusChange,
  onDownload,
  onReplace,
  medicals,
  appointments,
  employees,
  companies,
  user,
}: {
  doc: DocumentRecord;
  onBack: () => void;
  onStatusChange: (id: string, status: DocumentStatus) => void;
  onDownload: (doc: DocumentRecord) => void;
  onReplace: (id: string, replacement: { name: string; type: DocumentType; versionNotes: string }) => Promise<void>;
  medicals: { id: string; employeeName: string; type: string; date: string; status: string; result: string }[];
  appointments: { id: string; employeeName: string; type: string; date: string; providerName: string }[];
  employees: { id: string; name: string; jobTitle: string; companyName: string }[];
  companies: { id: string; name: string }[];
  user: { name: string; role: string } | null;
}) {
  const { data: versions, loading: versionsLoading } = useDocumentVersions(doc.id);
  const expiry = getExpiryStatus(doc.expiryDate);
  const Icon = statusIcons[doc.status] || FileText;
  const [showReplaceForm, setShowReplaceForm] = useState(false);
  const [replaceName, setReplaceName] = useState(doc.name);
  const [replaceType, setReplaceType] = useState(doc.type);
  const [replaceNotes, setReplaceNotes] = useState('');
  const [replacing, setReplacing] = useState(false);
  const [replaceError, setReplaceError] = useState<string | null>(null);
  const canReplace = user?.role === 'admin' || user?.role === 'coordinator' || user?.role === 'provider';

  const linkedEmployee = doc.employeeId ? employees.find((e) => e.id === doc.employeeId) : null;
  const linkedCompany = companies.find((c) => c.name === doc.companyName);
  const linkedMedical = doc.medicalId ? medicals.find((m) => m.id === doc.medicalId) : null;
  const linkedAppointment = doc.appointmentId ? appointments.find((a) => a.id === doc.appointmentId) : null;

  const isMedicalDoc = doc.type === 'Medical Report' || doc.type === 'Fitness Certificate' || doc.type === 'Drug Screen Result';
  const isEmployer = user?.role === 'employer';
  const restrictMedical = isMedicalDoc && isEmployer;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <button onClick={onBack} className="btn-secondary">
          <ArrowLeft size={16} /> Back to Documents
        </button>
        <div className="flex items-center gap-2">
          <Badge color={statusColors[doc.status]} dot>{doc.status}</Badge>
          {expiry.expired && <Badge color="danger" dot>Expired</Badge>}
          {expiry.expiringSoon && <Badge color="warning" dot>{expiry.label}</Badge>}
          {doc.versionNumber && doc.versionNumber > 1 && <Badge color="brand">v{doc.versionNumber}</Badge>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6">
            <div className="flex items-start gap-4 mb-5">
              <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${doc.status === 'Verified' ? 'bg-success-50' : doc.status === 'Rejected' ? 'bg-danger-50' : 'bg-brand-50'}`}>
                <Icon size={24} className={doc.status === 'Verified' ? 'text-success-600' : doc.status === 'Rejected' ? 'text-danger-600' : 'text-brand-600'} />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-display font-bold text-ink-900 break-words">{doc.name}</h2>
                <p className="text-sm text-ink-500 mt-0.5">{doc.type} · {doc.fileType} · {doc.fileSize}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <DetailField label="Status">
                <select
                  className="input text-sm"
                  value={doc.status}
                  onChange={(e) => onStatusChange(doc.id, e.target.value as DocumentStatus)}
                >
                  <option>Draft</option>
                  <option>Pending Review</option>
                  <option>Verified</option>
                  <option>Rejected</option>
                </select>
              </DetailField>
              <DetailField label="Uploaded By">{doc.uploadedBy || '—'}</DetailField>
              <DetailField label="Upload Date">{doc.uploadedDate || '—'}</DetailField>
              <DetailField label="Expiry Date">
                {doc.expiryDate ? (
                  <span className={expiry.expired ? 'text-danger-600 font-medium' : expiry.expiringSoon ? 'text-warning-600 font-medium' : ''}>
                    {doc.expiryDate} ({expiry.label})
                  </span>
                ) : 'No expiry'}
              </DetailField>
              {doc.responsiblePerson && <DetailField label="Responsible Person">{doc.responsiblePerson}</DetailField>}
              {doc.replacesDocumentId && <DetailField label="Replaces"><span className="text-xs text-brand-600">Previous version archived</span></DetailField>}
            </div>

            {restrictMedical && (
              <div className="mt-4 p-3 bg-danger-50 rounded-lg flex items-center gap-2">
                <Lock size={16} className="text-danger-600 shrink-0" />
                <p className="text-sm text-danger-700">This is a medical document. Access is restricted to clinical and administrative staff only.</p>
              </div>
            )}

            <div className="mt-5 pt-4 border-t border-ink-100 flex flex-wrap gap-2">
              <button onClick={() => onDownload(doc)} className="btn-secondary">
                <Download size={16} /> Download Metadata
              </button>
              {canReplace && !showReplaceForm && (
                <button onClick={() => setShowReplaceForm(true)} className="btn-secondary">
                  <Replace size={16} /> Replace with New Version
                </button>
              )}
            </div>

            {showReplaceForm && (
              <div className="mt-4 p-4 bg-ink-50 rounded-lg space-y-3">
                <h4 className="text-sm font-bold text-ink-900 flex items-center gap-2"><Replace size={14} /> Replace Document Version</h4>
                <p className="text-xs text-ink-500">The current version (v{doc.versionNumber || 1}) will be archived in version history. The document will be updated with new metadata and the version number incremented.</p>
                {replaceError && <p className="text-xs text-danger-600 flex items-center gap-1"><AlertCircle size={12} /> {replaceError}</p>}
                <div>
                  <label className="block text-xs font-semibold text-ink-600 mb-1">New Document Name *</label>
                  <input className="input w-full text-sm" value={replaceName} onChange={(e) => setReplaceName(e.target.value)} placeholder="e.g. Updated Fitness Certificate.pdf" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink-600 mb-1">Type</label>
                  <select className="input w-full text-sm" value={replaceType} onChange={(e) => setReplaceType(e.target.value as DocumentType)}>
                    {documentTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink-600 mb-1">Version Notes</label>
                  <textarea className="input w-full text-sm" rows={2} value={replaceNotes} onChange={(e) => setReplaceNotes(e.target.value)} placeholder="Reason for replacement, e.g. Corrected clinical details" />
                </div>
                <div className="flex gap-2">
                  <button
                    disabled={replacing || !replaceName.trim()}
                    onClick={async () => {
                      setReplaceError(null);
                      setReplacing(true);
                      try {
                        await onReplace(doc.id, { name: replaceName.trim(), type: replaceType, versionNotes: replaceNotes.trim() || 'Replaced with new version' });
                        setShowReplaceForm(false);
                        setReplaceNotes('');
                      } catch (err) {
                        setReplaceError(err instanceof Error ? err.message : 'Failed to replace document');
                      } finally {
                        setReplacing(false);
                      }
                    }}
                    className="btn-primary"
                  >
                    {replacing ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Replace size={14} /> Confirm Replacement</>}
                  </button>
                  <button onClick={() => { setShowReplaceForm(false); setReplaceError(null); }} className="btn-secondary">Cancel</button>
                </div>
              </div>
            )}
          </div>

          {/* Linked records */}
          <div className="card p-5">
            <h3 className="font-display font-bold text-ink-900 mb-4 flex items-center gap-2"><Link2 size={18} className="text-brand-600" /> Linked Records</h3>
            <div className="space-y-3">
              {linkedCompany && (
                <LinkedRow icon={Building2} label="Company" value={linkedCompany.name} />
              )}
              {linkedEmployee && (
                <LinkedRow icon={User} label="Employee" value={`${linkedEmployee.name} — ${linkedEmployee.jobTitle}`} />
              )}
              {linkedMedical && (
                <LinkedRow icon={Stethoscope} label="Medical Assessment" value={`${linkedMedical.type} — ${linkedMedical.date} — ${linkedMedical.status}`} />
              )}
              {linkedAppointment && (
                <LinkedRow icon={Calendar} label="Appointment" value={`${linkedAppointment.type} — ${linkedAppointment.date} — ${linkedAppointment.providerName}`} />
              )}
              {doc.workflowInstanceId && (
                <LinkedRow icon={Workflow} label="Workflow Instance" value={doc.workflowInstanceId} />
              )}
              {!linkedCompany && !linkedEmployee && !linkedMedical && !linkedAppointment && !doc.workflowInstanceId && (
                <p className="text-sm text-ink-400">No linked records.</p>
              )}
            </div>
          </div>

          {/* Version history */}
          <div className="card p-5">
            <h3 className="font-display font-bold text-ink-900 mb-4 flex items-center gap-2"><History size={18} className="text-brand-600" /> Version History</h3>
            {versionsLoading ? (
              <p className="text-sm text-ink-400">Loading version history...</p>
            ) : versions.length === 0 ? (
              <p className="text-sm text-ink-400">No previous versions recorded. This is the initial version (v{doc.versionNumber || 1}).</p>
            ) : (
              <div className="space-y-2">
                {versions.map((v) => (
                  <div key={v.id} className="flex items-start gap-3 p-3 bg-ink-50 rounded-lg">
                    <div className="h-8 w-8 rounded-lg bg-brand-50 flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-brand-600">v{v.versionNumber}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-ink-900">{v.name}</p>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-ink-400">
                        <span>{v.type}</span>
                        <Badge color={statusColors[v.status] || 'ink'}>{v.status}</Badge>
                        <span>· {v.uploadedBy}</span>
                        <span>· {v.createdAt.slice(0, 10)}</span>
                      </div>
                      {v.versionNotes && <p className="text-xs text-ink-500 mt-1">{v.versionNotes}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Notes panel */}
        <div className="lg:col-span-1">
          <NotesPanel recordType="document" recordId={doc.id} authorName={user?.name || 'Unknown'} canAddNote={!restrictMedical} />
        </div>
      </div>
    </div>
  );
}

function DetailField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold text-ink-400 uppercase tracking-wider mb-1">{label}</p>
      <div className="text-sm text-ink-700">{children}</div>
    </div>
  );
}

function LinkedRow({ icon: Icon, label, value }: { icon: typeof Building2; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-ink-50 rounded-lg">
      <div className="h-8 w-8 rounded-lg bg-white flex items-center justify-center shrink-0">
        <Icon size={14} className="text-brand-600" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-ink-400 uppercase tracking-wider">{label}</p>
        <p className="text-sm text-ink-700 truncate">{value}</p>
      </div>
    </div>
  );
}
