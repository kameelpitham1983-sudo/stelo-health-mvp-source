import { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  X,
  ArrowLeft,
  ShieldCheck,
  AlertCircle,
  FileText,
  Clock,
  CheckCircle2,
  DollarSign,
  Receipt,
  History,
  Building2,
  User,
  Calendar,
  Ban,
  Send,
  CheckCheck,
  CircleDollarSign,
} from 'lucide-react';
import { Badge } from '@/components/Badge';
import { isDemoMode } from '@/hooks/useSupabaseData';
import { demoGOPs } from '@/data/mockData';
import type { GOP, GOPStatus, GOPRecipientType, GOPAuditEntry, GOPInvoice } from '@/types';

const statusColors: Record<GOPStatus, 'success' | 'warning' | 'danger' | 'brand' | 'ink'> = {
  Draft: 'ink',
  'Pending Approval': 'warning',
  Approved: 'brand',
  Issued: 'brand',
  Utilised: 'success',
  Invoiced: 'warning',
  Paid: 'success',
  Cancelled: 'danger',
  Expired: 'danger',
};

const statusFlow: Record<string, GOPStatus[]> = {
  Draft: ['Pending Approval'],
  'Pending Approval': ['Approved', 'Cancelled'],
  Approved: ['Issued', 'Cancelled'],
  Issued: ['Utilised', 'Invoiced', 'Cancelled'],
  Utilised: ['Invoiced'],
  Invoiced: ['Paid'],
  Paid: [],
  Cancelled: [],
  Expired: [],
};

const recipientTypeLabels: Record<GOPRecipientType, string> = {
  provider: 'Healthcare Provider',
  accommodation: 'Accommodation',
  laboratory: 'Laboratory',
  other: 'Other',
};

const allStatuses: GOPStatus[] = ['Draft', 'Pending Approval', 'Approved', 'Issued', 'Utilised', 'Invoiced', 'Paid', 'Cancelled', 'Expired'];

const emptyForm: Partial<GOP> = {
  recipientType: 'provider',
  recipientName: '',
  companyName: '',
  employeeName: '',
  serviceDescription: '',
  authorisedAmount: 0,
  currency: 'ZAR',
  validityStartDate: '',
  validityEndDate: '',
  notes: '',
};

export function GOPs() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedGOP, setSelectedGOP] = useState<GOP | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [gopState, setGopState] = useState<GOP[]>([]);
  const [exceptionModal, setExceptionModal] = useState<{ gop: GOP; targetStatus: GOPStatus } | null>(null);
  const [exceptionReason, setExceptionReason] = useState('');

  const mergedGOPs = useMemo(() => {
    const overrides = new Map(gopState.map((g) => [g.id, g]));
    return demoGOPs.map((g) => overrides.get(g.id) || g).concat(gopState.filter((g) => !demoGOPs.find((d) => d.id === g.id)));
  }, [gopState]);

  const filtered = mergedGOPs.filter((g) => {
    const matchSearch =
      g.gopReference.toLowerCase().includes(search.toLowerCase()) ||
      g.recipientName.toLowerCase().includes(search.toLowerCase()) ||
      g.employeeName.toLowerCase().includes(search.toLowerCase()) ||
      g.companyName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || g.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const counts = {
    total: mergedGOPs.length,
    pending: mergedGOPs.filter((g) => g.status === 'Pending Approval').length,
    issued: mergedGOPs.filter((g) => g.status === 'Issued').length,
    utilised: mergedGOPs.filter((g) => g.status === 'Utilised').length,
    invoiced: mergedGOPs.filter((g) => g.status === 'Invoiced').length,
    paid: mergedGOPs.filter((g) => g.status === 'Paid').length,
  };

  const updateGOP = (id: string, updates: Partial<GOP>) => {
    setGopState((prev: GOP[]) => {
      const existing = prev.find((g) => g.id === id);
      if (existing) return prev.map((g) => (g.id === id ? { ...g, ...updates } : g));
      const base = demoGOPs.find((g) => g.id === id);
      return base ? [...prev, { ...base, ...updates }] : prev;
    });
    if (selectedGOP?.id === id) {
      setSelectedGOP((prev: GOP | null) => (prev ? { ...prev, ...updates } : prev));
    }
  };

  const advanceStatus = (gop: GOP, targetStatus: GOPStatus) => {
    if (!gop.recipientVerified && !gop.exceptionApproved && targetStatus === 'Issued') {
      setExceptionModal({ gop, targetStatus });
      return;
    }
    const now = new Date().toISOString();
    const auditEntry: GOPAuditEntry = {
      id: `ga-${Date.now()}`,
      timestamp: now,
      action: `GOP ${targetStatus.toLowerCase()} by Dr. Amara Okonkwo`,
      actor: 'Dr. Amara Okonkwo',
    };
    const updates: Partial<GOP> = {
      status: targetStatus,
      auditTrail: [...gop.auditTrail, auditEntry],
    };
    if (targetStatus === 'Approved') {
      updates.approvedBy = 'Dr. Amara Okonkwo';
      updates.approvedAt = now;
      updates.approverRole = 'admin';
    }
    if (targetStatus === 'Issued') {
      updates.issuedBy = 'Dr. Amara Okonkwo';
      updates.issuedAt = now;
    }
    updateGOP(gop.id, updates);
  };

  const confirmException = () => {
    if (!exceptionModal || !exceptionReason.trim()) return;
    const { gop, targetStatus } = exceptionModal;
    const now = new Date().toISOString();
    const auditEntry: GOPAuditEntry = {
      id: `ga-${Date.now()}`,
      timestamp: now,
      action: `Exception approved for unverified provider — GOP issued by Dr. Amara Okonkwo`,
      actor: 'Dr. Amara Okonkwo',
    };
    updateGOP(gop.id, {
      status: targetStatus,
      exceptionApproved: true,
      exceptionReason: exceptionReason.trim(),
      issuedBy: 'Dr. Amara Okonkwo',
      issuedAt: now,
      auditTrail: [...gop.auditTrail, auditEntry],
    });
    setExceptionModal(null);
    setExceptionReason('');
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    if (!formData.recipientName || !formData.companyName || !formData.employeeName) {
      setSubmitError('Recipient name, company, and employee name are required.');
      return;
    }
    if (!formData.authorisedAmount || formData.authorisedAmount <= 0) {
      setSubmitError('Authorised amount must be greater than zero.');
      return;
    }
    const ref = `GOP-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(mergedGOPs.length + 1).padStart(3, '0')}`;
    const newGOP: GOP = {
      id: `gop-demo-${Date.now()}`,
      gopReference: ref,
      status: 'Draft',
      recipientType: (formData.recipientType as GOPRecipientType) || 'provider',
      recipientName: formData.recipientName,
      recipientId: null,
      recipientVerified: false,
      companyName: formData.companyName,
      employeeName: formData.employeeName,
      appointmentId: null,
      tripId: null,
      serviceDescription: formData.serviceDescription || '',
      authorisedAmount: formData.authorisedAmount,
      currency: (formData.currency as GOP['currency']) || 'ZAR',
      validityStartDate: formData.validityStartDate || '',
      validityEndDate: formData.validityEndDate || '',
      approvedBy: null,
      approvedAt: null,
      approverRole: null,
      issuedBy: '',
      issuedAt: '',
      notes: formData.notes || '',
      exceptionApproved: false,
      exceptionReason: '',
      invoices: [],
      auditTrail: [
        { id: `ga-${Date.now()}`, timestamp: new Date().toISOString(), action: 'GOP drafted', actor: 'Dr. Amara Okonkwo' },
      ],
    };
    setGopState((prev: GOP[]) => [...prev, newGOP]);
    setShowForm(false);
    setFormData(emptyForm);
  };

  if (selectedGOP) {
    const g = selectedGOP;
    const nextStatuses = statusFlow[g.status] || [];
    return (
      <div className="space-y-6">
        <button onClick={() => setSelectedGOP(null)} className="btn-ghost">
          <ArrowLeft size={16} /> Back to GOPs
        </button>

        <div className="card p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <ShieldCheck size={20} className="text-brand-600" />
                <h2 className="text-xl font-display font-bold text-ink-900">{g.gopReference}</h2>
                <Badge color={statusColors[g.status]}>{g.status}</Badge>
              </div>
              <p className="text-sm text-ink-500">{recipientTypeLabels[g.recipientType]} · {g.serviceDescription}</p>
            </div>
          </div>

          {!g.recipientVerified && !g.exceptionApproved && (
            <div className="p-3 bg-danger-50 text-danger-700 text-sm rounded-lg flex items-start gap-2">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>Recipient is <strong>unverified</strong>. This GOP cannot be issued until the recipient is verified or an authorised exception is approved.</span>
            </div>
          )}
          {g.exceptionApproved && (
            <div className="p-3 bg-warning-50 text-warning-700 text-sm rounded-lg flex items-start gap-2">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <div>
                <p><strong>Exception approved</strong> for unverified recipient.</p>
                <p className="text-xs mt-1">{g.exceptionReason}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DetailItem icon={Building2} label="Recipient" value={g.recipientName} />
            <DetailItem icon={User} label="Employee / Traveller" value={g.employeeName} />
            <DetailItem icon={Building2} label="Company" value={g.companyName} />
            <DetailItem icon={DollarSign} label="Authorised Amount" value={`${g.currency} ${g.authorisedAmount.toLocaleString()}`} />
            <DetailItem icon={Calendar} label="Valid From" value={g.validityStartDate || 'Not set'} />
            <DetailItem icon={Calendar} label="Valid Until" value={g.validityEndDate || 'Not set'} />
            {g.approvedBy && <DetailItem icon={CheckCircle2} label="Approved By" value={g.approvedBy} />}
            {g.issuedBy && <DetailItem icon={Send} label="Issued By" value={g.issuedBy} />}
          </div>

          {g.notes && (
            <div className="p-3 bg-ink-50 rounded-lg">
              <p className="text-xs font-semibold text-ink-400 uppercase tracking-wide mb-1">Notes</p>
              <p className="text-sm text-ink-700">{g.notes}</p>
            </div>
          )}

          {nextStatuses.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-3 border-t border-ink-100">
              <p className="w-full text-xs font-semibold text-ink-400 uppercase tracking-wide mb-1">Workflow Actions</p>
              {nextStatuses.map((status) => {
                const isIssue = status === 'Issued';
                const blocked = isIssue && !g.recipientVerified && !g.exceptionApproved;
                return (
                  <button
                    key={status}
                    onClick={() => advanceStatus(g, status)}
                    className={blocked ? 'btn-secondary opacity-75' : 'btn-primary'}
                  >
                    {status === 'Cancelled' ? <Ban size={16} /> : status === 'Issued' ? <Send size={16} /> : status === 'Approved' ? <CheckCircle2 size={16} /> : status === 'Utilised' ? <CheckCheck size={16} /> : status === 'Invoiced' ? <Receipt size={16} /> : status === 'Paid' ? <CircleDollarSign size={16} /> : <Clock size={16} />}
                    {blocked ? `Issue (Exception Required)` : `Mark as ${status}`}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="card p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Receipt size={18} className="text-brand-600" />
            <h3 className="text-lg font-bold text-ink-900">Invoices</h3>
          </div>
          {g.invoices.length === 0 ? (
            <p className="text-sm text-ink-400">No invoices recorded for this GOP.</p>
          ) : (
            <div className="space-y-2">
              {g.invoices.map((inv: GOPInvoice) => (
                <div key={inv.id} className="p-3 border border-ink-100 rounded-lg space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-ink-900">{inv.invoiceNumber}</span>
                    <Badge color={inv.paymentStatus === 'Paid' ? 'success' : inv.paymentStatus === 'Partially Paid' ? 'warning' : 'ink'}>
                      {inv.paymentStatus}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-ink-500">
                    <span>Date: {inv.invoiceDate}</span>
                    <span>Amount: {inv.currency} {inv.invoicedAmount.toLocaleString()}</span>
                    <span>Matched: {inv.matched ? 'Yes' : 'No'}</span>
                  </div>
                  {inv.notes && <p className="text-xs text-ink-400">{inv.notes}</p>}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card p-5 space-y-3">
          <div className="flex items-center gap-2">
            <History size={18} className="text-brand-600" />
            <h3 className="text-lg font-bold text-ink-900">Audit Trail</h3>
          </div>
          <div className="space-y-2">
            {g.auditTrail.map((entry: GOPAuditEntry) => (
              <div key={entry.id} className="flex items-start gap-3 text-sm">
                <div className="w-2 h-2 rounded-full bg-brand-500 mt-1.5 shrink-0" />
                <div>
                  <span className="text-ink-900 font-medium">{entry.action}</span>
                  <span className="text-ink-400 ml-2">— {entry.actor} · {new Date(entry.timestamp).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
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
          Demo mode — all GOP records are fictional sample data. New records and changes are stored locally only.
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-display font-bold text-ink-900">Guarantees of Payment</h2>
          <p className="text-sm text-ink-500">{filtered.length} GOPs across all statuses</p>
        </div>
        <button className="btn-primary" onClick={() => { setFormData(emptyForm); setShowForm(true); }}>
          <Plus size={16} /> Create GOP
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <GOPStat icon={ShieldCheck} label="Total" value={counts.total} color="brand" />
        <GOPStat icon={Clock} label="Pending Approval" value={counts.pending} color="warning" />
        <GOPStat icon={Send} label="Issued" value={counts.issued} color="brand" />
        <GOPStat icon={CheckCheck} label="Utilised" value={counts.utilised} color="success" />
        <GOPStat icon={Receipt} label="Invoiced" value={counts.invoiced} color="warning" />
        <GOPStat icon={CircleDollarSign} label="Paid" value={counts.paid} color="success" />
      </div>

      <div className="space-y-3">
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
          <input type="text" placeholder="Search by reference, recipient, employee, or company..." value={search} onChange={(e) => setSearch(e.target.value)} className="input pl-10" />
        </div>
        <div className="flex flex-wrap gap-2">
          <FilterSelect label="Status" value={statusFilter} options={['all', ...allStatuses]} onChange={setStatusFilter} />
        </div>
      </div>

      {showForm && (
        <div className="card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-ink-900">Create New GOP</h3>
            <button type="button" className="btn-secondary" onClick={() => { setShowForm(false); setFormData(emptyForm); }}><X size={16} /> Cancel</button>
          </div>
          {submitError && <div className="p-3 bg-danger-50 text-danger-700 text-sm rounded-lg">{submitError}</div>}
          <form className="space-y-4" onSubmit={handleCreate}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1">Recipient Type</label>
                <select className="input" value={formData.recipientType} onChange={(e) => setFormData({ ...formData, recipientType: e.target.value as GOPRecipientType })}>
                  <option value="provider">Healthcare Provider</option>
                  <option value="accommodation">Accommodation</option>
                  <option value="laboratory">Laboratory</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1">Recipient Name</label>
                <input type="text" className="input" value={formData.recipientName} onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })} placeholder="Provider or hotel name" />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1">Company</label>
                <input type="text" className="input" value={formData.companyName} onChange={(e) => setFormData({ ...formData, companyName: e.target.value })} placeholder="Company name" />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1">Employee / Traveller</label>
                <input type="text" className="input" value={formData.employeeName} onChange={(e) => setFormData({ ...formData, employeeName: e.target.value })} placeholder="Employee name" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-ink-700 mb-1">Service Description</label>
                <textarea className="input min-h-[80px]" value={formData.serviceDescription} onChange={(e) => setFormData({ ...formData, serviceDescription: e.target.value })} placeholder="Description of services covered by this GOP" />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1">Authorised Amount</label>
                <input type="number" className="input" value={formData.authorisedAmount || ''} onChange={(e) => setFormData({ ...formData, authorisedAmount: Number(e.target.value) })} placeholder="0" />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1">Currency</label>
                <select className="input" value={formData.currency} onChange={(e) => setFormData({ ...formData, currency: e.target.value as GOP['currency'] })}>
                  <option value="ZAR">ZAR</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="AED">AED</option>
                  <option value="KES">KES</option>
                  <option value="SGD">SGD</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1">Valid From</label>
                <input type="date" className="input" value={formData.validityStartDate} onChange={(e) => setFormData({ ...formData, validityStartDate: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1">Valid Until</label>
                <input type="date" className="input" value={formData.validityEndDate} onChange={(e) => setFormData({ ...formData, validityEndDate: e.target.value })} />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-ink-700 mb-1">Notes</label>
                <textarea className="input min-h-[60px]" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="Additional notes or instructions" />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" className="btn-secondary" onClick={() => { setShowForm(false); setFormData(emptyForm); }}>Cancel</button>
              <button type="submit" className="btn-primary"><FileText size={16} /> Create Draft GOP</button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="card p-8 text-center text-ink-400">
            <ShieldCheck size={32} className="mx-auto mb-2 opacity-50" />
            <p>No GOPs match your filters.</p>
          </div>
        ) : (
          filtered.map((g) => (
            <button
              key={g.id}
              onClick={() => setSelectedGOP(g)}
              className="card p-4 w-full text-left hover:border-brand-300 hover:shadow-md transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-brand-50 flex items-center justify-center shrink-0">
                    <ShieldCheck size={18} className="text-brand-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-ink-900">{g.gopReference}</span>
                      <Badge color={statusColors[g.status]}>{g.status}</Badge>
                    </div>
                    <p className="text-xs text-ink-500 mt-0.5">{g.recipientName} · {g.employeeName} · {g.companyName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs text-ink-500">
                  <span className="font-semibold text-ink-700">{g.currency} {g.authorisedAmount.toLocaleString()}</span>
                  {!g.recipientVerified && !g.exceptionApproved && (
                    <Badge color="danger">Unverified</Badge>
                  )}
                  {g.exceptionApproved && (
                    <Badge color="warning">Exception</Badge>
                  )}
                </div>
              </div>
            </button>
          ))
        )}
      </div>

      {exceptionModal && (
        <div className="fixed inset-0 bg-ink-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-5 space-y-4">
            <div className="flex items-center gap-2">
              <AlertCircle size={20} className="text-danger-600" />
              <h3 className="text-lg font-bold text-ink-900">Exception Approval Required</h3>
            </div>
            <p className="text-sm text-ink-600">
              The recipient <strong>{exceptionModal.gop.recipientName}</strong> is <strong>unverified</strong>. Issuing a GOP to an unverified recipient requires an explicitly authorised exception. Please provide a reason for this exception.
            </p>
            <textarea
              className="input min-h-[80px]"
              placeholder="Reason for exception approval..."
              value={exceptionReason}
              onChange={(e) => setExceptionReason(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <button className="btn-secondary" onClick={() => { setExceptionModal(null); setExceptionReason(''); }}>Cancel</button>
              <button className="btn-primary" onClick={confirmException} disabled={!exceptionReason.trim()}>
                <ShieldCheck size={16} /> Approve Exception & Issue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailItem({ icon: Icon, label, value }: { icon: typeof Building2; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <Icon size={16} className="text-ink-400 mt-0.5 shrink-0" />
      <div>
        <p className="text-xs font-semibold text-ink-400 uppercase tracking-wide">{label}</p>
        <p className="text-sm text-ink-900">{value}</p>
      </div>
    </div>
  );
}

function GOPStat({ icon: Icon, label, value, color }: { icon: typeof ShieldCheck; label: string; value: number; color: 'brand' | 'success' | 'warning' | 'danger' }) {
  const colorClasses: Record<string, string> = {
    brand: 'bg-brand-50 text-brand-600',
    success: 'bg-success-50 text-success-600',
    warning: 'bg-warning-50 text-warning-600',
    danger: 'bg-danger-50 text-danger-600',
  };
  return (
    <div className="card p-3 flex items-center gap-3">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${colorClasses[color]}`}>
        <Icon size={16} />
      </div>
      <div>
        <p className="text-lg font-bold text-ink-900 leading-none">{value}</p>
        <p className="text-xs text-ink-400 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

function FilterSelect({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs font-semibold text-ink-400">{label}:</span>
      <select
        className="text-sm border border-ink-200 rounded-lg px-2 py-1.5 bg-white text-ink-900 focus:outline-none focus:border-brand-500"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt === 'all' ? 'All' : opt}</option>
        ))}
      </select>
    </div>
  );
}
