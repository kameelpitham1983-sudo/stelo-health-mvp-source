import { useState } from 'react';
import { Search, Building2, MapPin, Users, Calendar, Mail, Phone, ArrowLeft, Plus, Filter, Edit3, X, Check, AlertCircle } from 'lucide-react';
import { useCompanies } from '@/hooks/useSupabaseData';
import { useEmployees, useMedicals } from '@/hooks/useSupabaseData';
import { Badge } from '@/components/Badge';
import type { Company } from '@/types';

const statusColors: Record<string, 'success' | 'warning' | 'danger'> = {
  Active: 'success',
  Onboarding: 'warning',
  Suspended: 'danger',
};

const tierColors: Record<string, 'brand' | 'teal' | 'ink'> = {
  Enterprise: 'brand',
  'Mid-Market': 'teal',
  SMB: 'ink',
};

const emptyForm: Partial<Company> = {
  name: '',
  industry: '',
  tier: 'SMB',
  status: 'Onboarding',
  employeeCount: 0,
  locations: 1,
  primaryLocation: '',
  contactName: '',
  contactEmail: '',
  contactPhone: '',
  logoColor: 'brand',
};

export function Companies() {
  const { data: companyList, loading, error, addCompany, updateCompany } = useCompanies();
  const { data: employees } = useEmployees();
  const { data: medicals } = useMedicals();
  const [selected, setSelected] = useState<Company | null>(null);
  const [search, setSearch] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [formData, setFormData] = useState<Partial<Company>>(emptyForm);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);

  const filtered = companyList.filter(
    (c) => c.name.toLowerCase().includes(search.toLowerCase()) || c.industry.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitting(true);
    try {
      await addCompany(formData);
      setShowAddForm(false);
      setFormData(emptyForm);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to add company');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    setSubmitError(null);
    setSubmitting(true);
    try {
      await updateCompany(selected.id, formData);
      setShowEditForm(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to update company');
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = () => {
    setFormData({
      name: selected!.name,
      industry: selected!.industry,
      tier: selected!.tier,
      status: selected!.status,
      employeeCount: selected!.employeeCount,
      locations: selected!.locations,
      primaryLocation: selected!.primaryLocation,
      contactName: selected!.contactName,
      contactEmail: selected!.contactEmail,
      contactPhone: selected!.contactPhone,
    });
    setShowEditForm(true);
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><span className="w-6 h-6 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin" /></div>;
  }

  if (error) {
    return <div className="card p-6 text-center"><AlertCircle size={24} className="text-danger-500 mx-auto mb-2" /><p className="text-sm text-ink-600">Failed to load companies: {error}</p></div>;
  }

  if (selected) {
    const companyEmployees = employees.filter((e) => e.companyId === selected.id);
    const companyMedicals = medicals.filter((m) => m.companyName === selected.name);
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <button onClick={() => setSelected(null)} className="btn-secondary">
            <ArrowLeft size={16} />
            Back to Companies
          </button>
          <button onClick={startEdit} className="btn-primary">
            <Edit3 size={16} />
            Edit Company
          </button>
        </div>

        {showEditForm && (
          <div className="card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-ink-900">Edit Company</h3>
              <button type="button" className="btn-secondary" onClick={() => setShowEditForm(false)}><X size={16} /> Cancel</button>
            </div>
            {submitError && <div className="p-3 bg-danger-50 text-danger-700 text-sm rounded-lg">{submitError}</div>}
            <form className="space-y-4" onSubmit={handleEditSubmit}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className="block text-sm font-semibold text-ink-700 mb-1">Company Name *</label><input className="input w-full" value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required /></div>
                <div><label className="block text-sm font-semibold text-ink-700 mb-1">Industry *</label><input className="input w-full" value={formData.industry || ''} onChange={(e) => setFormData({ ...formData, industry: e.target.value })} required /></div>
                <div><label className="block text-sm font-semibold text-ink-700 mb-1">Contact Person *</label><input className="input w-full" value={formData.contactName || ''} onChange={(e) => setFormData({ ...formData, contactName: e.target.value })} required /></div>
                <div><label className="block text-sm font-semibold text-ink-700 mb-1">Contact Email *</label><input className="input w-full" type="email" value={formData.contactEmail || ''} onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })} required /></div>
                <div><label className="block text-sm font-semibold text-ink-700 mb-1">Contact Phone</label><input className="input w-full" value={formData.contactPhone || ''} onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })} /></div>
                <div><label className="block text-sm font-semibold text-ink-700 mb-1">Primary Location *</label><input className="input w-full" value={formData.primaryLocation || ''} onChange={(e) => setFormData({ ...formData, primaryLocation: e.target.value })} required /></div>
                <div><label className="block text-sm font-semibold text-ink-700 mb-1">Status</label><select className="input w-full" value={formData.status || 'Active'} onChange={(e) => setFormData({ ...formData, status: e.target.value as Company['status'] })}><option>Active</option><option>Onboarding</option><option>Suspended</option></select></div>
                <div><label className="block text-sm font-semibold text-ink-700 mb-1">Tier</label><select className="input w-full" value={formData.tier || 'SMB'} onChange={(e) => setFormData({ ...formData, tier: e.target.value as Company['tier'] })}><option>Enterprise</option><option>Mid-Market</option><option>SMB</option></select></div>
              </div>
              <button type="submit" disabled={submitting} className="btn-primary">
                {submitting ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : saved ? <><Check size={16} /> Saved</> : 'Save Changes'}
              </button>
            </form>
          </div>
        )}

        <div className="card overflow-hidden">
          <div className="h-24 bg-gradient-to-br from-brand-600 to-brand-900" />
          <div className="p-5 lg:p-6 -mt-10">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div className="flex items-end gap-4">
                <div className="h-20 w-20 rounded-2xl bg-white border-4 border-white shadow-lg flex items-center justify-center">
                  <Building2 size={32} className="text-brand-600" />
                </div>
                <div className="mb-1">
                  <h2 className="text-xl font-display font-bold text-ink-900">{selected.name}</h2>
                  <p className="text-sm text-ink-500">{selected.industry}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Badge color={statusColors[selected.status]} dot>{selected.status}</Badge>
                <Badge color={tierColors[selected.tier]}>{selected.tier}</Badge>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="card p-5">
            <h3 className="font-display font-bold text-ink-900 mb-4">Key metrics</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-ink-100">
                <span className="flex items-center gap-2 text-sm text-ink-500"><Users size={15} /> Employees</span>
                <span className="font-semibold text-ink-900">{selected.employeeCount.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-ink-100">
                <span className="flex items-center gap-2 text-sm text-ink-500"><Users size={15} /> Tracked in system</span>
                <span className="font-semibold text-ink-900">{companyEmployees.length}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-ink-100">
                <span className="flex items-center gap-2 text-sm text-ink-500"><MapPin size={15} /> Locations</span>
                <span className="font-semibold text-ink-900">{selected.locations}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-ink-100">
                <span className="flex items-center gap-2 text-sm text-ink-500"><Calendar size={15} /> Contract start</span>
                <span className="font-semibold text-ink-900">{selected.contractStart}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="flex items-center gap-2 text-sm text-ink-500"><Calendar size={15} /> Contract end</span>
                <span className="font-semibold text-ink-900">{selected.contractEnd}</span>
              </div>
            </div>
          </div>

          <div className="card p-5">
            <h3 className="font-display font-bold text-ink-900 mb-4">Primary location</h3>
            <div className="flex items-start gap-3 mb-4">
              <MapPin size={18} className="text-brand-600 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-ink-900">{selected.primaryLocation}</p>
                <p className="text-xs text-ink-400">Headquarters</p>
              </div>
            </div>
            <h3 className="font-display font-bold text-ink-900 mb-3 mt-6">Primary contact</h3>
            <div className="space-y-2">
              <p className="text-sm font-semibold text-ink-900">{selected.contactName}</p>
              <div className="flex items-center gap-2 text-sm text-ink-500"><Mail size={14} /> {selected.contactEmail}</div>
              <div className="flex items-center gap-2 text-sm text-ink-500"><Phone size={14} /> {selected.contactPhone}</div>
            </div>
          </div>

          <div className="card p-5">
            <h3 className="font-display font-bold text-ink-900 mb-4">Assessments</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-ink-100">
                <span className="text-sm text-ink-500">Total medicals</span>
                <span className="font-semibold text-ink-900">{companyMedicals.length}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-ink-100">
                <span className="text-sm text-ink-500">Completed</span>
                <span className="font-semibold text-success-600">{companyMedicals.filter((m) => m.status === 'Completed').length}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-ink-100">
                <span className="text-sm text-ink-500">Scheduled</span>
                <span className="font-semibold text-brand-600">{companyMedicals.filter((m) => m.status === 'Scheduled').length}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-ink-500">Overdue</span>
                <span className="font-semibold text-danger-600">{companyMedicals.filter((m) => m.status === 'Overdue').length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {showAddForm && (
        <div className="card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-ink-900">Add New Company</h3>
            <button type="button" className="btn-secondary" onClick={() => setShowAddForm(false)}><X size={16} /> Cancel</button>
          </div>
          {submitError && <div className="p-3 bg-danger-50 text-danger-700 text-sm rounded-lg">{submitError}</div>}
          <form className="space-y-4" onSubmit={handleAddSubmit}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label className="block text-sm font-semibold text-ink-700 mb-1">Company Name *</label><input className="input w-full" value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required placeholder="Company name" /></div>
              <div><label className="block text-sm font-semibold text-ink-700 mb-1">Industry *</label><input className="input w-full" value={formData.industry || ''} onChange={(e) => setFormData({ ...formData, industry: e.target.value })} required placeholder="e.g. Mining, Security, Energy" /></div>
              <div><label className="block text-sm font-semibold text-ink-700 mb-1">Contact Person *</label><input className="input w-full" value={formData.contactName || ''} onChange={(e) => setFormData({ ...formData, contactName: e.target.value })} required placeholder="Full name" /></div>
              <div><label className="block text-sm font-semibold text-ink-700 mb-1">Contact Email *</label><input className="input w-full" type="email" value={formData.contactEmail || ''} onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })} required placeholder="name@company.com" /></div>
              <div><label className="block text-sm font-semibold text-ink-700 mb-1">Contact Phone</label><input className="input w-full" value={formData.contactPhone || ''} onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })} placeholder="Phone number" /></div>
              <div><label className="block text-sm font-semibold text-ink-700 mb-1">Primary Location *</label><input className="input w-full" value={formData.primaryLocation || ''} onChange={(e) => setFormData({ ...formData, primaryLocation: e.target.value })} required placeholder="City or site" /></div>
            </div>
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Plus size={16} /> Submit Company</>}
            </button>
          </form>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-display font-bold text-ink-900">Companies</h2>
          <p className="text-sm text-ink-500">{companyList.length} corporate clients under contract</p>
        </div>
        <button className="btn-primary" onClick={() => { setFormData(emptyForm); setShowAddForm(true); }}>
          <Plus size={16} />
          Add Company
        </button>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
          <input type="text" placeholder="Search companies..." value={search} onChange={(e) => setSearch(e.target.value)} className="input pl-10" />
        </div>
        <button className="btn-secondary"><Filter size={16} /> Filter</button>
      </div>

      {filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <Building2 size={32} className="text-ink-300 mx-auto mb-3" />
          <p className="text-sm text-ink-500">No companies found. Try adjusting your search or add a new company.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((company) => (
            <div key={company.id} onClick={() => setSelected(company)} className="card card-hover p-5 cursor-pointer">
              <div className="flex items-start justify-between mb-4">
                <div className="h-12 w-12 rounded-xl bg-brand-50 flex items-center justify-center">
                  <Building2 size={22} className="text-brand-600" />
                </div>
                <div className="flex gap-1.5">
                  <Badge color={statusColors[company.status]} dot>{company.status}</Badge>
                </div>
              </div>
              <h3 className="font-display font-bold text-ink-900 mb-1">{company.name}</h3>
              <p className="text-xs text-ink-400 mb-4">{company.industry}</p>
              <div className="grid grid-cols-2 gap-3 pt-4 border-t border-ink-100">
                <div>
                  <p className="text-lg font-bold font-display text-ink-900">{company.employeeCount.toLocaleString()}</p>
                  <p className="text-xs text-ink-400">Employees</p>
                </div>
                <div>
                  <p className="text-lg font-bold font-display text-ink-900">{company.locations}</p>
                  <p className="text-xs text-ink-400">Locations</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 mt-3 text-xs text-ink-400">
                <MapPin size={12} />
                {company.primaryLocation}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
