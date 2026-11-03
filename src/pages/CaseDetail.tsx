import { useState } from 'react';
import {
  ArrowLeft, Briefcase, Building2, User, Stethoscope, Calendar, FileText,
  FlaskConical, Globe, HeartPulse, Workflow, Clock, AlertCircle, CheckCircle2,
  ChevronDown, Save, X, Lock, Activity as ActivityIcon, History as HistoryIcon,
  Upload, ChevronRight,
} from 'lucide-react';
import { useCases, useCaseActivity, useCompanies, useEmployees, useMedicals, useAppointments, useDocuments, useWorkflowInstances, useProviders, useAuditLog, isDemoMode } from '@/hooks/useSupabaseData';
import { supabase } from '@/lib/supabase';
import { useApp } from '@/context/AppContext';
import { can } from '@/lib/permissions';
import { Badge } from '@/components/Badge';
import { NotesPanel } from '@/components/NotesPanel';
import type { CaseRecord, CaseType, CaseStatus, CasePriority, DocumentType, DocumentStatus } from '@/types';

const caseTypeLabels: Record<CaseType, string> = {
  pre_employment: 'Pre-Employment Medical',
  periodical: 'Periodical Medical',
  transfer: 'Transfer Medical',
  travel_medical: 'Travel Medical',
  visa_medical: 'Visa Medical',
  lab_request: 'Laboratory Request',
  specialist_referral: 'Specialist Referral',
  sickness_absence: 'Sickness Absence',
  other: 'Other',
};

const statusConfig: Record<CaseStatus, { label: string; color: 'success' | 'warning' | 'danger' | 'brand' | 'ink' }> = {
  new: { label: 'New', color: 'brand' },
  active: { label: 'Active', color: 'brand' },
  awaiting_client_approval: { label: 'Awaiting Client Approval', color: 'warning' },
  awaiting_employee_info: { label: 'Awaiting Employee Info', color: 'warning' },
  awaiting_appointment: { label: 'Awaiting Appointment', color: 'warning' },
  awaiting_provider: { label: 'Awaiting Provider', color: 'warning' },
  awaiting_clinical_review: { label: 'Awaiting Clinical Review', color: 'warning' },
  awaiting_outcome: { label: 'Awaiting Outcome', color: 'warning' },
  overdue: { label: 'Overdue', color: 'danger' },
  completed: { label: 'Completed', color: 'success' },
  on_hold: { label: 'On Hold', color: 'ink' },
  cancelled: { label: 'Cancelled', color: 'ink' },
  exception: { label: 'Exception', color: 'danger' },
};

const allStatuses = Object.keys(statusConfig) as CaseStatus[];

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) +
    ' · ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

const activityIcons: Record<string, typeof Briefcase> = {
  created: Briefcase,
  status_change: ArrowLeft,
  note_added: FileText,
  document_uploaded: FileText,
  workflow_progress: Workflow,
  appointment_scheduled: Calendar,
  provider_update: Stethoscope,
  clinical_review: CheckCircle2,
  completion: CheckCircle2,
  notification: ActivityIcon,
  assignment: User,
};

interface CaseDetailProps {
  caseId: string;
  onBack: () => void;
}

export function CaseDetail({ caseId, onBack }: CaseDetailProps) {
  const { user } = useApp();
  const { data: cases, updateCase } = useCases();
  const { data: companies } = useCompanies();
  const { data: employees } = useEmployees();
  const { data: medicals } = useMedicals();
  const { data: appointments } = useAppointments();
  const { data: documents, addDocument } = useDocuments();
  const { data: providers } = useProviders();
  const { data: workflowInstances } = useWorkflowInstances();
  const { data: activity, addActivity } = useCaseActivity(caseId);
  const { data: auditEntries } = useAuditLog();

  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<CaseRecord>>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showDocForm, setShowDocForm] = useState(false);
  const [docForm, setDocForm] = useState({ name: '', type: 'Medical Report' as DocumentType, status: 'Draft' as DocumentStatus, fileSize: '', expiryDate: '' });
  const [docUploading, setDocUploading] = useState(false);
  const [docError, setDocError] = useState<string | null>(null);

  const caseRecord = cases.find((c) => c.id === caseId);

  if (!caseRecord) {
    return (
      <div className="card p-6 text-center">
        <AlertCircle size={24} className="text-danger-500 mx-auto mb-2" />
        <p className="text-sm text-ink-600">Case not found.</p>
        <button onClick={onBack} className="btn-secondary mt-3"><ArrowLeft size={16} /> Back to Cases</button>
      </div>
    );
  }

  const canEdit = can(user, 'case.edit');
  const canUploadDoc = can(user, 'document.upload');
  const canVerifyDoc = can(user, 'document.verify');
  const sc = statusConfig[caseRecord.status];
  const isOverdue = caseRecord.status === 'overdue' || (caseRecord.targetCompletionDate && new Date(caseRecord.targetCompletionDate) < new Date() && caseRecord.status !== 'completed' && caseRecord.status !== 'cancelled');

  const linkedEmployee = caseRecord.employeeId ? employees.find((e) => e.id === caseRecord.employeeId) : null;
  const linkedCompany = caseRecord.companyId ? companies.find((c) => c.id === caseRecord.companyId) : null;
  const linkedMedical = caseRecord.linkedMedicalId ? medicals.find((m) => m.id === caseRecord.linkedMedicalId) : null;
  const linkedAppointment = caseRecord.linkedAppointmentId ? appointments.find((a) => a.id === caseRecord.linkedAppointmentId) : null;
  const linkedWorkflow = caseRecord.linkedWorkflowInstanceId ? workflowInstances.find((w) => w.id === caseRecord.linkedWorkflowInstanceId) : null;
  const linkedProvider = caseRecord.providerId ? providers.find((p) => p.id === caseRecord.providerId) : null;
  const linkedDocs = caseRecord.linkedDocumentIds && caseRecord.linkedDocumentIds.length > 0
    ? documents.filter((d) => caseRecord.linkedDocumentIds.includes(d.id))
    : [];

  const caseAuditEntries = auditEntries.filter((a) => a.recordType === 'case' && a.recordId === caseId);

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      await updateCase(caseId, editData);
      setEditing(false);
      setEditData({});
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to update case');
    } finally {
      setSaving(false);
    }
  };

  const startEdit = () => {
    setEditData({
      title: caseRecord.title,
      description: caseRecord.description,
      status: caseRecord.status,
      priority: caseRecord.priority,
      assignedCoordinator: caseRecord.assignedCoordinator,
      caseOwner: caseRecord.caseOwner,
      targetCompletionDate: caseRecord.targetCompletionDate,
      nextAction: caseRecord.nextAction,
      nextActionDueDate: caseRecord.nextActionDueDate,
      providerName: caseRecord.providerName,
      laboratoryName: caseRecord.laboratoryName,
      specialistName: caseRecord.specialistName,
    });
    setEditing(true);
  };

  const handleDocUpload = async () => {
    if (!docForm.name.trim()) { setDocError('Document name is required.'); return; }
    setDocError(null);
    setDocUploading(true);
    try {
      const created = await addDocument({
        name: docForm.name.trim(),
        type: docForm.type,
        status: docForm.status,
        companyName: caseRecord.companyName,
        employeeName: caseRecord.employeeName || undefined,
        employeeId: caseRecord.employeeId || undefined,
        medicalId: caseRecord.linkedMedicalId || undefined,
        appointmentId: caseRecord.linkedAppointmentId || undefined,
        uploadedBy: user?.name || 'Unknown',
        uploadedDate: new Date().toISOString().slice(0, 10),
        fileSize: docForm.fileSize || '—',
        expiryDate: docForm.expiryDate || null,
      });
      const newDocIds = [...(caseRecord.linkedDocumentIds || []), created.id];
      await updateCase(caseId, { linkedDocumentIds: newDocIds });
      await addActivity({
        activityType: 'document_uploaded',
        title: `Document uploaded: ${created.name}`,
        description: `${docForm.type} — registered by ${user?.name || 'Unknown'}`,
      });
      setShowDocForm(false);
      setDocForm({ name: '', type: 'Medical Report', status: 'Draft', fileSize: '', expiryDate: '' });
    } catch (err) {
      setDocError(err instanceof Error ? err.message : 'Failed to upload document');
    } finally {
      setDocUploading(false);
    }
  };

  const handleDocStatusChange = async (docId: string, status: DocumentStatus) => {
    try {
      const { data: rows, error } = await supabase
        .from('documents').update({ status }).eq('id', docId).select('id');
      if (error) throw new Error(error.message);
      if (!rows?.length) throw new Error('Could not update document status.');
      await addActivity({
        activityType: 'document_uploaded',
        title: `Document status changed to ${status}`,
        description: `Updated by ${user?.name || 'Unknown'}`,
      });
    } catch (err) {
      setDocError(err instanceof Error ? err.message : 'Failed to update document status');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <button onClick={onBack} className="btn-secondary">
          <ArrowLeft size={16} /> Back to Cases
        </button>
        <div className="flex items-center gap-2">
          <Badge color={sc.color} dot>{sc.label}</Badge>
          {isOverdue && <Badge color="danger" dot>Overdue</Badge>}
          <Badge color={caseRecord.priority === 'urgent' || caseRecord.priority === 'high' ? 'danger' : caseRecord.priority === 'medium' ? 'warning' : 'ink'} dot>{caseRecord.priority}</Badge>
        </div>
      </div>

      {/* Case title and reference */}
      <div className="card p-6">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-xl bg-brand-50 flex items-center justify-center shrink-0">
            <Briefcase size={24} className="text-brand-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-display font-bold text-ink-900">{caseRecord.title}</h1>
            <div className="flex items-center gap-3 mt-1 text-sm text-ink-500 flex-wrap">
              <span className="font-mono">{caseRecord.caseReference}</span>
              <span>·</span>
              <span>{caseTypeLabels[caseRecord.caseType]}</span>
              <span>·</span>
              <span>Opened {formatDate(caseRecord.dateOpened)}</span>
              {caseRecord.createdBy && (<><span>·</span><span>by {caseRecord.createdBy}</span></>)}
            </div>
            {caseRecord.description && <p className="text-sm text-ink-600 mt-3">{caseRecord.description}</p>}
          </div>
          {canEdit && !editing && (
            <button onClick={startEdit} className="btn-secondary shrink-0"><FileText size={16} /> Edit</button>
          )}
          {editing && (
            <div className="flex gap-2 shrink-0">
              <button onClick={handleSave} disabled={saving} className="btn-primary"><Save size={16} /> {saving ? 'Saving...' : 'Save'}</button>
              <button onClick={() => { setEditing(false); setEditData({}); }} className="btn-secondary"><X size={16} /> Cancel</button>
            </div>
          )}
        </div>
        {saveError && <div className="mt-3 p-2.5 bg-danger-50 text-danger-700 text-sm rounded-lg flex items-center gap-2"><AlertCircle size={14} /> {saveError}</div>}
      </div>

      {/* Section 1 & 2: Case Overview + Company/Employee */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <h3 className="font-display font-bold text-ink-900 mb-4 flex items-center gap-2"><Briefcase size={18} className="text-brand-600" /> Case Overview</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Status">
              {editing ? (
                <select className="input text-sm" value={editData.status as string} onChange={(e) => setEditData({ ...editData, status: e.target.value as CaseStatus })}>
                  {allStatuses.map((s) => <option key={s} value={s}>{statusConfig[s].label}</option>)}
                </select>
              ) : <Badge color={sc.color} dot>{sc.label}</Badge>}
            </Field>
            <Field label="Priority">
              {editing ? (
                <select className="input text-sm" value={editData.priority as string} onChange={(e) => setEditData({ ...editData, priority: e.target.value as CasePriority })}>
                  <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Urgent</option>
                </select>
              ) : <Badge color={caseRecord.priority === 'urgent' || caseRecord.priority === 'high' ? 'danger' : caseRecord.priority === 'medium' ? 'warning' : 'ink'}>{caseRecord.priority}</Badge>}
            </Field>
            <Field label="Assigned Coordinator">
              {editing ? <input className="input text-sm" value={editData.assignedCoordinator || ''} onChange={(e) => setEditData({ ...editData, assignedCoordinator: e.target.value })} /> : <span className="text-sm text-ink-700">{caseRecord.assignedCoordinator || '—'}</span>}
            </Field>
            <Field label="Case Owner">
              {editing ? <input className="input text-sm" value={editData.caseOwner || ''} onChange={(e) => setEditData({ ...editData, caseOwner: e.target.value })} /> : <span className="text-sm text-ink-700">{caseRecord.caseOwner || '—'}</span>}
            </Field>
            <Field label="Target Completion">
              {editing ? <input className="input text-sm" type="date" value={editData.targetCompletionDate || ''} onChange={(e) => setEditData({ ...editData, targetCompletionDate: e.target.value })} /> : <span className="text-sm text-ink-700">{formatDate(caseRecord.targetCompletionDate)}</span>}
            </Field>
            <Field label="Next Action">
              {editing ? <input className="input text-sm" value={editData.nextAction || ''} onChange={(e) => setEditData({ ...editData, nextAction: e.target.value })} /> : <span className="text-sm text-ink-700">{caseRecord.nextAction || '—'}</span>}
            </Field>
            <Field label="Next Action Due">
              {editing ? <input className="input text-sm" type="date" value={editData.nextActionDueDate || ''} onChange={(e) => setEditData({ ...editData, nextActionDueDate: e.target.value })} /> : <span className="text-sm text-ink-700">{formatDate(caseRecord.nextActionDueDate)}</span>}
            </Field>
          </div>
        </div>

        <div className="card p-5">
          <h3 className="font-display font-bold text-ink-900 mb-4 flex items-center gap-2"><Building2 size={18} className="text-brand-600" /> Company & Employee</h3>
          <div className="space-y-3">
            {linkedCompany && (
              <LinkedRow icon={Building2} label="Company" value={linkedCompany.name} subValue={linkedCompany.industry} />
            )}
            {linkedEmployee && (
              <LinkedRow icon={User} label="Employee" value={linkedEmployee.name} subValue={`${linkedEmployee.jobTitle} · ${linkedEmployee.department || 'No dept'}`} />
            )}
            {!linkedCompany && !linkedEmployee && (
              <p className="text-sm text-ink-400">No company or employee linked.</p>
            )}
          </div>
        </div>
      </div>

      {/* Section 3: Workflow & Outstanding Steps */}
      {linkedWorkflow && (
        <div className="card p-5">
          <h3 className="font-display font-bold text-ink-900 mb-4 flex items-center gap-2"><Workflow size={18} className="text-brand-600" /> Workflow & Outstanding Steps</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-ink-900">{linkedWorkflow.workflowName}</p>
                <p className="text-xs text-ink-400 font-mono">{linkedWorkflow.instanceReference}</p>
              </div>
              <Badge color={linkedWorkflow.status === 'Completed' ? 'success' : linkedWorkflow.status === 'In Progress' ? 'brand' : 'ink'} dot>{linkedWorkflow.status}</Badge>
            </div>
            <div className="flex items-center gap-2 text-xs text-ink-500">
              <span>Step {linkedWorkflow.currentStep} of {linkedWorkflow.totalSteps}</span>
              <div className="flex-1 h-2 bg-ink-100 rounded-full overflow-hidden">
                <div className="h-full bg-brand-500 rounded-full" style={{ width: `${linkedWorkflow.totalSteps > 0 ? (linkedWorkflow.currentStep / linkedWorkflow.totalSteps) * 100 : 0}%` }} />
              </div>
            </div>
            {linkedWorkflow.assignedTo && <p className="text-xs text-ink-500">Assigned to: {linkedWorkflow.assignedTo}</p>}
          </div>
        </div>
      )}

      {/* Section 4 & 5: Appointments/Medical/Travel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {linkedAppointment && (
          <div className="card p-5">
            <h3 className="font-display font-bold text-ink-900 mb-4 flex items-center gap-2"><Calendar size={18} className="text-brand-600" /> Appointment</h3>
            <div className="space-y-2 text-sm">
              <Row label="Type" value={linkedAppointment.type} />
              <Row label="Date" value={`${linkedAppointment.date} ${linkedAppointment.time}`} />
              <Row label="Mode" value={linkedAppointment.mode} />
              <Row label="Provider" value={linkedAppointment.providerName} />
              <Row label="Location" value={linkedAppointment.location} />
              <Row label="Status" value={linkedAppointment.status} />
            </div>
          </div>
        )}

        {linkedMedical && (
          <div className="card p-5">
            <h3 className="font-display font-bold text-ink-900 mb-4 flex items-center gap-2"><Stethoscope size={18} className="text-brand-600" /> Medical Record</h3>
            <div className="space-y-2 text-sm">
              <Row label="Type" value={linkedMedical.type} />
              <Row label="Date" value={linkedMedical.date} />
              <Row label="Provider" value={linkedMedical.providerName} />
              <Row label="Result" value={linkedMedical.result} />
              <Row label="Status" value={linkedMedical.status} />
            </div>
          </div>
        )}
      </div>

      {/* Section 6: Provider/Lab/Specialist */}
      {(linkedProvider || caseRecord.laboratoryName || caseRecord.specialistName) && (
        <div className="card p-5">
          <h3 className="font-display font-bold text-ink-900 mb-4 flex items-center gap-2"><Stethoscope size={18} className="text-brand-600" /> Provider, Laboratory & Specialist</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {linkedProvider && (
              <div className="p-3 bg-ink-50 rounded-lg">
                <p className="text-xs font-semibold text-ink-400 uppercase tracking-wider mb-1">Provider</p>
                <p className="text-sm font-semibold text-ink-900">{linkedProvider.name}</p>
                <p className="text-xs text-ink-500">{linkedProvider.category}</p>
                {linkedProvider.phone && <p className="text-xs text-ink-500 mt-1">{linkedProvider.phone}</p>}
              </div>
            )}
            {(caseRecord.laboratoryName || editing) && (
              <div className="p-3 bg-ink-50 rounded-lg">
                <p className="text-xs font-semibold text-ink-400 uppercase tracking-wider mb-1">Laboratory</p>
                {editing ? <input className="input text-sm" value={editData.laboratoryName || ''} onChange={(e) => setEditData({ ...editData, laboratoryName: e.target.value })} placeholder="Lab name" /> : <p className="text-sm font-semibold text-ink-900">{caseRecord.laboratoryName || '—'}</p>}
              </div>
            )}
            {(caseRecord.specialistName || editing) && (
              <div className="p-3 bg-ink-50 rounded-lg">
                <p className="text-xs font-semibold text-ink-400 uppercase tracking-wider mb-1">Specialist</p>
                {editing ? <input className="input text-sm" value={editData.specialistName || ''} onChange={(e) => setEditData({ ...editData, specialistName: e.target.value })} placeholder="Specialist name" /> : <p className="text-sm font-semibold text-ink-900">{caseRecord.specialistName || '—'}</p>}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Section 7: Documents & Clearance Certificates */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold text-ink-900 flex items-center gap-2"><FileText size={18} className="text-brand-600" /> Documents & Clearance Certificates</h3>
          {canUploadDoc && !showDocForm && (
            <button onClick={() => setShowDocForm(true)} className="btn-secondary text-sm"><Upload size={14} /> Upload Document</button>
          )}
        </div>

        {showDocForm && (
          <div className="mb-4 p-4 bg-ink-50 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-ink-900">Register Document for this Case</h4>
              <button onClick={() => { setShowDocForm(false); setDocError(null); }} className="btn-ghost text-sm"><X size={14} /> Cancel</button>
            </div>
            {docError && <p className="text-xs text-danger-600 flex items-center gap-1"><AlertCircle size={12} /> {docError}</p>}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-ink-600 mb-1">Document Name *</label>
                <input className="input w-full text-sm" value={docForm.name} onChange={(e) => setDocForm({ ...docForm, name: e.target.value })} placeholder="e.g. Fitness Clearance Certificate.pdf" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink-600 mb-1">Type</label>
                <div className="relative">
                  <select className="input w-full text-sm pr-8 appearance-none cursor-pointer" value={docForm.type} onChange={(e) => setDocForm({ ...docForm, type: e.target.value as DocumentType })}>
                    <option>Medical Report</option>
                    <option>Fitness Certificate</option>
                    <option>Vaccination Record</option>
                    <option>Compliance Certificate</option>
                    <option>Drug Screen Result</option>
                    <option>Travel Risk Assessment</option>
                    <option>Company Contract</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink-600 mb-1">Status</label>
                <select className="input w-full text-sm" value={docForm.status} onChange={(e) => setDocForm({ ...docForm, status: e.target.value as DocumentStatus })}>
                  <option>Draft</option>
                  <option>Pending Review</option>
                  <option>Verified</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink-600 mb-1">File Size</label>
                <input className="input w-full text-sm" value={docForm.fileSize} onChange={(e) => setDocForm({ ...docForm, fileSize: e.target.value })} placeholder="e.g. 245 KB" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink-600 mb-1">Expiry Date</label>
                <input className="input w-full text-sm" type="date" value={docForm.expiryDate} onChange={(e) => setDocForm({ ...docForm, expiryDate: e.target.value })} />
              </div>
            </div>
            <p className="text-xs text-ink-500">The document will be linked to this case and the associated employee and medical record automatically.</p>
            <button onClick={handleDocUpload} disabled={docUploading || !docForm.name.trim()} className="btn-primary text-sm">
              {docUploading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Upload size={14} /> Register & Link Document</>}
            </button>
          </div>
        )}

        {linkedDocs.length === 0 && !showDocForm ? (
          <p className="text-sm text-ink-400">No documents linked to this case yet. {canUploadDoc && 'Click "Upload Document" to register one.'}</p>
        ) : (
          <div className="space-y-3">
            {linkedDocs.map((doc) => (
              <div key={doc.id} className="flex items-center gap-3 p-3 bg-ink-50 rounded-lg">
                <div className="h-8 w-8 rounded-lg bg-white flex items-center justify-center shrink-0">
                  <FileText size={14} className="text-brand-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-ink-900 truncate">{doc.name}</p>
                  <div className="flex items-center gap-2 text-xs text-ink-400">
                    <span>{doc.type}</span>
                    <Badge color={doc.status === 'Verified' ? 'success' : doc.status === 'Rejected' ? 'danger' : 'warning'}>{doc.status}</Badge>
                    {doc.versionNumber && doc.versionNumber > 1 && <Badge color="brand">v{doc.versionNumber}</Badge>}
                    <span>· {doc.uploadedBy}</span>
                    <span>· {doc.uploadedDate}</span>
                  </div>
                </div>
                {canVerifyDoc && (
                  <select
                    className="text-xs border border-ink-200 rounded-lg px-2 py-1 bg-white cursor-pointer focus:outline-none focus:border-brand-500 shrink-0"
                    value={doc.status}
                    onChange={(e) => handleDocStatusChange(doc.id, e.target.value as DocumentStatus)}
                  >
                    <option>Draft</option>
                    <option>Pending Review</option>
                    <option>Verified</option>
                    <option>Rejected</option>
                  </select>
                )}
                <ChevronRight size={16} className="text-ink-300 shrink-0" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section 8: Notes & Correspondence */}
      <NotesPanel recordType="case" recordId={caseId} authorName={user?.name || 'Unknown'} canAddNote={canEdit} />

      {/* Section 9: Activity Timeline */}
      <div className="card p-5">
        <h3 className="font-display font-bold text-ink-900 mb-4 flex items-center gap-2"><ActivityIcon size={18} className="text-brand-600" /> Activity Timeline</h3>
        {activity.length === 0 ? (
          <p className="text-sm text-ink-400">No activity recorded yet.</p>
        ) : (
          <div className="space-y-3">
            {activity.map((a) => {
              const Icon = activityIcons[a.activityType] || ActivityIcon;
              return (
                <div key={a.id} className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-lg bg-brand-50 flex items-center justify-center shrink-0">
                    <Icon size={14} className="text-brand-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-ink-900">{a.title}</p>
                    {a.description && <p className="text-xs text-ink-500 mt-0.5">{a.description}</p>}
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-ink-400">
                      <span>{a.actorName}</span>
                      <Badge color="ink">{a.actorRole}</Badge>
                      <span>· {formatDateTime(a.createdAt)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Section 10: Audit History */}
      <div className="card p-5">
        <h3 className="font-display font-bold text-ink-900 mb-4 flex items-center gap-2"><HistoryIcon size={18} className="text-brand-600" /> Audit History</h3>
        {caseAuditEntries.length === 0 ? (
          <p className="text-sm text-ink-400">No audit entries recorded for this case.</p>
        ) : (
          <div className="space-y-2">
            {caseAuditEntries.map((entry) => (
              <div key={entry.id} className="flex items-start gap-3 p-3 bg-ink-50 rounded-lg">
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${entry.success ? 'bg-success-50' : 'bg-danger-50'}`}>
                  {entry.success ? <CheckCircle2 size={14} className="text-success-600" /> : <AlertCircle size={14} className="text-danger-600" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-ink-900">{entry.actorName}</span>
                    <Badge color="ink">{entry.actorRole}</Badge>
                    <span className="text-sm text-ink-600 font-medium">{entry.action}</span>
                  </div>
                  {entry.details && <p className="text-xs text-ink-500 mt-0.5">{entry.details}</p>}
                  {(entry.fromStatus || entry.toStatus) && (
                    <p className="text-xs text-ink-500 mt-0.5">
                      {entry.fromStatus && <span className="text-ink-400">{entry.fromStatus}</span>}
                      {entry.fromStatus && entry.toStatus && <span className="text-ink-300 mx-1">→</span>}
                      {entry.toStatus && <span className="text-ink-700 font-medium">{entry.toStatus}</span>}
                    </p>
                  )}
                </div>
                <span className="text-xs text-ink-400 shrink-0 whitespace-nowrap">{formatDateTime(entry.createdAt)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {isDemoMode && (
        <div className="p-3 bg-warning-50 text-warning-700 text-sm rounded-lg flex items-center gap-2">
          <AlertCircle size={16} className="shrink-0" />
          Demo mode — case changes cannot be saved. Connecting the database will enable full case management.
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold text-ink-400 uppercase tracking-wider mb-1">{label}</p>
      <div className="text-sm text-ink-700">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-ink-400">{label}</span>
      <span className="text-ink-700 font-medium text-right">{value || '—'}</span>
    </div>
  );
}

function LinkedRow({ icon: Icon, label, value, subValue }: { icon: typeof Building2; label: string; value: string; subValue?: string }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-ink-50 rounded-lg">
      <div className="h-8 w-8 rounded-lg bg-white flex items-center justify-center shrink-0">
        <Icon size={14} className="text-brand-600" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-ink-400 uppercase tracking-wider">{label}</p>
        <p className="text-sm text-ink-700 truncate">{value}</p>
        {subValue && <p className="text-xs text-ink-400 truncate">{subValue}</p>}
      </div>
    </div>
  );
}

function DocumentSummary({ doc }: { doc: { id: string; name: string; type: string; status: string; uploadedBy: string; uploadedDate: string; versionNumber?: number } }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-ink-50 rounded-lg">
      <div className="h-8 w-8 rounded-lg bg-white flex items-center justify-center shrink-0">
        <FileText size={14} className="text-brand-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-ink-900 truncate">{doc.name}</p>
        <div className="flex items-center gap-2 text-xs text-ink-400">
          <span>{doc.type}</span>
          <Badge color={doc.status === 'Verified' ? 'success' : doc.status === 'Rejected' ? 'danger' : 'warning'}>{doc.status}</Badge>
          {doc.versionNumber && doc.versionNumber > 1 && <Badge color="brand">v{doc.versionNumber}</Badge>}
          <span>· {doc.uploadedBy}</span>
          <span>· {doc.uploadedDate}</span>
        </div>
      </div>
    </div>
  );
}
