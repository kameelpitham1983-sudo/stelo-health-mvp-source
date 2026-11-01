import { X, Plus } from 'lucide-react';
import type { Company, Employee } from '@/types';

interface EmployeeFormProps {
  title: string;
  formData: Partial<Employee>;
  setFormData: (data: Partial<Employee>) => void;
  companies: Company[];
  submitting: boolean;
  submitError: string | null;
  submitLabel: string;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

export function EmployeeForm({ title, formData, setFormData, companies, submitting, submitError, submitLabel, onSubmit, onCancel }: EmployeeFormProps) {
  return (
    <div className="card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-ink-900">{title}</h3>
        <button type="button" className="btn-secondary" onClick={onCancel}><X size={16} /> Cancel</button>
      </div>
      {submitError && <div className="p-3 bg-danger-50 text-danger-700 text-sm rounded-lg">{submitError}</div>}
      <form className="space-y-4" onSubmit={onSubmit}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-ink-700 mb-1">Full Name *</label>
            <input className="input w-full" value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required placeholder="First and last name" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-ink-700 mb-1">Email Address *</label>
            <input className="input w-full" type="email" value={formData.email || ''} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required placeholder="name@company.com" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-ink-700 mb-1">Phone Number</label>
            <input className="input w-full" value={formData.phone || ''} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="Phone number" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-ink-700 mb-1">Job Title *</label>
            <input className="input w-full" value={formData.jobTitle || ''} onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })} required placeholder="e.g. Site Engineer" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-ink-700 mb-1">Company *</label>
            <select className="input w-full" value={formData.companyId || ''} onChange={(e) => setFormData({ ...formData, companyId: e.target.value })} required>
              <option value="">Select company...</option>
              {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-ink-700 mb-1">Department</label>
            <input className="input w-full" value={formData.department || ''} onChange={(e) => setFormData({ ...formData, department: e.target.value })} placeholder="e.g. Operations" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-ink-700 mb-1">Employment Status</label>
            <select className="input w-full" value={formData.status || 'Pending Clearance'} onChange={(e) => setFormData({ ...formData, status: e.target.value as Employee['status'] })}>
              <option>Pending Clearance</option>
              <option>Active</option>
              <option>On Leave</option>
              <option>Cleared</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-ink-700 mb-1">International Travel Required</label>
            <select className="input w-full" value={formData.travelReady ? 'yes' : 'no'} onChange={(e) => setFormData({ ...formData, travelReady: e.target.value === 'yes' })}>
              <option value="no">No</option>
              <option value="yes">Yes</option>
            </select>
          </div>
        </div>
        <button type="submit" disabled={submitting} className="btn-primary">
          {submitting ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Plus size={16} /> {submitLabel}</>}
        </button>
      </form>
    </div>
  );
}
