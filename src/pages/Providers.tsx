import { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  X,
  ArrowLeft,
  Building2,
  MapPin,
  Phone,
  Mail,
  Clock,
  Stethoscope,
  TestTube,
  Syringe,
  Truck,
  Ear,
  FileText,
  CheckCircle2,
  AlertCircle,
  Star,
  TrendingUp,
  Calendar,
  ClipboardCheck,
  ShieldCheck,
  Settings as SettingsIcon,
  Info,
  ChevronDown,
} from 'lucide-react';
import { Badge } from '@/components/Badge';
import { useApp } from '@/context/AppContext';
import { isDemoMode } from '@/hooks/useSupabaseData';
import { providers as demoProviders } from '@/data/mockData';
import { medicals, appointments } from '@/data/mockData';
import type {
  Provider,
  ProviderCategory,
  ProviderStatus,
  ProviderTier,
  ProviderSiteVisit,
} from '@/types';

const categoryIcons: Record<string, typeof Stethoscope> = {
  'Occupational Health Clinic': Stethoscope,
  'Mobile Occupational Health Unit': Truck,
  'Medical Laboratory': TestTube,
  'General Practitioner / Specialist': Stethoscope,
  'Audiometry / Spirometry / Radiology': Ear,
  'Vaccination / Travel Health': Syringe,
  'Other': Building2,
};

const statusColors: Record<string, 'success' | 'warning' | 'danger' | 'brand' | 'ink'> = {
  Verified: 'success',
  Onboarding: 'brand',
  'Pending Verification': 'warning',
  Unverified: 'ink',
  Suspended: 'danger',
  Inactive: 'ink',
};

const tierColors: Record<string, 'success' | 'brand' | 'ink'> = {
  Preferred: 'success',
  Standard: 'brand',
  'Not Rated': 'ink',
};

const allCategories: ProviderCategory[] = [
  'Occupational Health Clinic',
  'Mobile Occupational Health Unit',
  'Medical Laboratory',
  'General Practitioner / Specialist',
  'Audiometry / Spirometry / Radiology',
  'Vaccination / Travel Health',
  'Other',
];

const allStatuses: ProviderStatus[] = ['Unverified', 'Onboarding', 'Pending Verification', 'Verified', 'Suspended', 'Inactive'];
const allTiers: ProviderTier[] = ['Not Rated', 'Standard', 'Preferred'];

const emptyForm: Partial<Provider> = {
  name: '',
  category: 'Occupational Health Clinic',
  services: [],
  contactPerson: '',
  phone: '',
  email: '',
  physicalAddress: '',
  provincesServed: [],
};

export function Providers() {
  const { user } = useApp();
  const isAdmin = user?.role === 'admin';

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [tierFilter, setTierFilter] = useState('all');
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [serviceInput, setServiceInput] = useState('');
  const [provinceInput, setProvinceInput] = useState('');
  const [demoProvidersState, setDemoProvidersState] = useState<Provider[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const allProviders = useMemo(() => {
    if (demoProvidersState.length === 0) return demoProviders;
    const baseIds = new Set(demoProviders.map((p) => p.id));
    const added = demoProvidersState.filter((p) => !baseIds.has(p.id));
    return [...demoProviders, ...added];
  }, [demoProvidersState]);

  const filtered = allProviders.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.providerCode.toLowerCase().includes(search.toLowerCase()) ||
      p.services.some((s) => s.toLowerCase().includes(search.toLowerCase()));
    const matchCategory = categoryFilter === 'all' || p.category === categoryFilter;
    const matchStatus = statusFilter === 'all' || p.status === statusFilter;
    const matchTier = tierFilter === 'all' || p.tier === tierFilter;
    return matchSearch && matchCategory && matchStatus && matchTier;
  });

  const counts = {
    total: allProviders.length,
    verified: allProviders.filter((p) => p.status === 'Verified').length,
    preferred: allProviders.filter((p) => p.tier === 'Preferred').length,
    onboarding: allProviders.filter((p) => p.status === 'Onboarding' || p.status === 'Pending Verification').length,
    unverified: allProviders.filter((p) => p.status === 'Unverified').length,
    mobile: allProviders.filter((p) => p.mobileServiceAvailable).length,
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    if (!formData.name) {
      setSubmitError('Provider or organisation name is required.');
      return;
    }
    const newProvider: Provider = {
      id: `pr-demo-${Date.now()}`,
      name: formData.name,
      providerCode: `PR-NEW-${String(allProviders.length + 1).padStart(3, '0')}`,
      category: (formData.category as ProviderCategory) || 'Other',
      services: formData.services || [],
      status: 'Unverified',
      tier: 'Not Rated',
      contactPerson: formData.contactPerson || 'To be confirmed',
      phone: formData.phone || 'To be confirmed',
      email: formData.email || 'To be confirmed',
      physicalAddress: formData.physicalAddress || 'To be confirmed',
      gpsCoordinates: null,
      provincesServed: formData.provincesServed || [],
      townsServed: [],
      operatingHours: 'To be confirmed',
      bookingProcess: 'To be confirmed — contact provider to establish booking procedure',
      appointmentAvailability: 'Unknown — not yet assessed',
      indicativePricing: 'Not provided — quotation required',
      commercialTerms: 'Not yet negotiated',
      serviceCapacity: null,
      mobileServiceAvailable: false,
      travelCharges: 'To be confirmed',
      registrationNumber: 'To be verified',
      licenceNumber: 'To be verified',
      accreditationDetails: 'To be verified',
      accreditationExpiryDate: null,
      lastVerificationDate: null,
      internalNotes: 'Newly created record — all fields pending verification. Do not deploy employees until provider is verified.',
      documents: [],
      performanceMetrics: [],
      siteVisits: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setDemoProvidersState((prev) => [...prev, newProvider]);
    setShowForm(false);
    setFormData(emptyForm);
  };

  const updateProviderStatus = (id: string, newStatus: ProviderStatus) => {
    const update = (p: Provider): Provider =>
      p.id === id ? { ...p, status: newStatus, updatedAt: new Date().toISOString() } : p;
    setDemoProvidersState((prev) => {
      const existing = prev.find((p) => p.id === id);
      if (existing) return prev.map(update);
      const base = demoProviders.find((p) => p.id === id);
      return base ? [...prev, update(base)] : prev;
    });
    if (selectedProvider?.id === id) {
      setSelectedProvider((prev) => prev ? { ...prev, status: newStatus, updatedAt: new Date().toISOString() } : prev);
    }
  };

  const updateProviderTier = (id: string, newTier: ProviderTier) => {
    const update = (p: Provider): Provider =>
      p.id === id ? { ...p, tier: newTier, updatedAt: new Date().toISOString() } : p;
    setDemoProvidersState((prev) => {
      const existing = prev.find((p) => p.id === id);
      if (existing) return prev.map(update);
      const base = demoProviders.find((p) => p.id === id);
      return base ? [...prev, update(base)] : prev;
    });
    if (selectedProvider?.id === id) {
      setSelectedProvider((prev) => prev ? { ...prev, tier: newTier, updatedAt: new Date().toISOString() } : prev);
    }
  };

  const addSiteVisit = (id: string, visit: Omit<ProviderSiteVisit, 'id'>) => {
    const newVisit: ProviderSiteVisit = { ...visit, id: `psv-${Date.now()}` };
    const update = (p: Provider): Provider =>
      p.id === id ? { ...p, siteVisits: [newVisit, ...p.siteVisits], updatedAt: new Date().toISOString() } : p;
    setDemoProvidersState((prev) => {
      const existing = prev.find((p) => p.id === id);
      if (existing) return prev.map(update);
      const base = demoProviders.find((p) => p.id === id);
      return base ? [...prev, update(base)] : prev;
    });
    if (selectedProvider?.id === id) {
      setSelectedProvider((prev) => prev ? { ...prev, siteVisits: [newVisit, ...prev.siteVisits] } : prev);
    }
  };

  // --- Detail view ---
  if (selectedProvider) {
    const p = selectedProvider;
    const CatIcon = categoryIcons[p.category] || Building2;

    const linkedMedicals = medicals.filter((m) => m.providerName && p.name.includes(m.providerName.split('—')[0].trim()));
    const linkedAppointments = appointments.filter((a) => a.providerName && p.name.includes(a.providerName.split('—')[0].trim()));

    return (
      <ProviderDetail
        provider={p}
        isAdmin={isAdmin}
        linkedMedicalsCount={linkedMedicals.length}
        linkedAppointmentsCount={linkedAppointments.length}
        onBack={() => setSelectedProvider(null)}
        onStatusChange={updateProviderStatus}
        onTierChange={updateProviderTier}
        onAddSiteVisit={addSiteVisit}
      />
    );
  }

  return (
    <div className="space-y-6">
      {isDemoMode && (
        <div className="p-3 bg-warning-50 text-warning-700 text-sm rounded-lg flex items-center gap-2">
          <AlertCircle size={16} className="shrink-0" />
          Demo mode — all provider records are fictional sample data with unverified placeholder fields. New records and changes are stored locally only and not saved as live records.
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-display font-bold text-ink-900">Provider Network</h2>
          <p className="text-sm text-ink-500">{filtered.length} providers across South Africa</p>
        </div>
        {isAdmin && (
          <button className="btn-primary" onClick={() => { setFormData(emptyForm); setShowForm(true); }}>
            <Plus size={16} /> Add Provider
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <ProviderStat icon={Building2} label="Total" value={counts.total} color="brand" />
        <ProviderStat icon={ShieldCheck} label="Verified" value={counts.verified} color="success" />
        <ProviderStat icon={Star} label="Preferred" value={counts.preferred} color="success" />
        <ProviderStat icon={ClipboardCheck} label="Onboarding" value={counts.onboarding} color="warning" />
        <ProviderStat icon={AlertCircle} label="Unverified" value={counts.unverified} color="danger" />
        <ProviderStat icon={Truck} label="Mobile Units" value={counts.mobile} color="brand" />
      </div>

      {/* Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
          <input type="text" placeholder="Search by provider name, code, or service..." value={search} onChange={(e) => setSearch(e.target.value)} className="input pl-10" />
        </div>
        <div className="flex flex-wrap gap-2">
          <FilterSelect label="Category" value={categoryFilter} options={['all', ...allCategories]} onChange={setCategoryFilter} />
          <FilterSelect label="Status" value={statusFilter} options={['all', ...allStatuses]} onChange={setStatusFilter} />
          <FilterSelect label="Tier" value={tierFilter} options={['all', ...allTiers]} onChange={setTierFilter} />
        </div>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-ink-900">Add New Provider</h3>
            <button type="button" className="btn-secondary" onClick={() => { setShowForm(false); setFormData(emptyForm); }}><X size={16} /> Cancel</button>
          </div>
          {submitError && <div className="p-3 bg-danger-50 text-danger-700 text-sm rounded-lg">{submitError}</div>}
          <form className="space-y-4" onSubmit={handleCreate}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-ink-700 mb-1">Provider / Organisation Name *</label>
                <input className="input w-full" value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. [Provider Name] Occupational Health" required />
              </div>
              <div>
                <label className="block text-sm font-semibold text-ink-700 mb-1">Category *</label>
                <div className="relative">
                  <select className="input w-full pr-9 appearance-none cursor-pointer" value={formData.category || ''} onChange={(e) => setFormData({ ...formData, category: e.target.value as ProviderCategory })} required>
                    {allCategories.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-ink-700 mb-1">Contact Person</label>
                <input className="input w-full" value={formData.contactPerson || ''} onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })} placeholder="Contact name (or 'To be confirmed')" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-ink-700 mb-1">Phone</label>
                <input className="input w-full" value={formData.phone || ''} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="Phone number (or 'To be confirmed')" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-ink-700 mb-1">Email</label>
                <input className="input w-full" value={formData.email || ''} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="Email address (or 'To be confirmed')" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-ink-700 mb-1">Physical Address</label>
                <input className="input w-full" value={formData.physicalAddress || ''} onChange={(e) => setFormData({ ...formData, physicalAddress: e.target.value })} placeholder="Physical address (or 'To be confirmed')" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-ink-700 mb-1">Services Offered</label>
                <div className="flex gap-2">
                  <input className="input flex-1" value={serviceInput} onChange={(e) => setServiceInput(e.target.value)} placeholder="Type a service and press Enter" onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (serviceInput.trim()) { setFormData({ ...formData, services: [...(formData.services || []), serviceInput.trim()] }); setServiceInput(''); } } }} />
                  <button type="button" className="btn-secondary" onClick={() => { if (serviceInput.trim()) { setFormData({ ...formData, services: [...(formData.services || []), serviceInput.trim()] }); setServiceInput(''); } }}><Plus size={14} /></button>
                </div>
                {formData.services && formData.services.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {formData.services.map((s, i) => (
                      <span key={i} className="inline-flex items-center gap-1 px-2 py-1 bg-brand-50 text-brand-700 text-xs rounded-md">
                        {s}
                        <button type="button" onClick={() => setFormData({ ...formData, services: formData.services?.filter((_, idx) => idx !== i) })}><X size={10} /></button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-ink-700 mb-1">Provinces Served</label>
                <div className="flex gap-2">
                  <input className="input flex-1" value={provinceInput} onChange={(e) => setProvinceInput(e.target.value)} placeholder="e.g. Gauteng, Western Cape" onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (provinceInput.trim()) { setFormData({ ...formData, provincesServed: [...(formData.provincesServed || []), provinceInput.trim()] }); setProvinceInput(''); } } }} />
                  <button type="button" className="btn-secondary" onClick={() => { if (provinceInput.trim()) { setFormData({ ...formData, provincesServed: [...(formData.provincesServed || []), provinceInput.trim()] }); setProvinceInput(''); } }}><Plus size={14} /></button>
                </div>
                {formData.provincesServed && formData.provincesServed.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {formData.provincesServed.map((s, i) => (
                      <span key={i} className="inline-flex items-center gap-1 px-2 py-1 bg-teal-50 text-teal-700 text-xs rounded-md">
                        {s}
                        <button type="button" onClick={() => setFormData({ ...formData, provincesServed: formData.provincesServed?.filter((_, idx) => idx !== i) })}><X size={10} /></button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="p-3 bg-warning-50 text-warning-700 text-xs rounded-lg flex items-start gap-2">
              <Info size={14} className="mt-0.5 shrink-0" />
              <span>Do not enter real provider credentials, prices, or capabilities unless you have verified them. New providers start as "Unverified" — all fields should be confirmed before use.</span>
            </div>
            <button type="submit" className="btn-primary"><Plus size={16} /> Create Provider Record</button>
          </form>
        </div>
      )}

      {/* Provider list */}
      {filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <Building2 size={32} className="text-ink-300 mx-auto mb-3" />
          <p className="text-sm text-ink-500">No providers found matching your filters. {isAdmin && 'Click "Add Provider" to create a new record.'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {filtered.map((p) => {
            const CatIcon = categoryIcons[p.category] || Building2;
            return (
              <div key={p.id} className="card card-hover p-4 cursor-pointer" onClick={() => setSelectedProvider(p)}>
                <div className="flex items-start gap-3">
                  <div className={`h-12 w-12 rounded-xl flex items-center justify-center text-white shrink-0 ${p.tier === 'Preferred' ? 'bg-gradient-to-br from-success-400 to-success-600' : 'bg-gradient-to-br from-brand-400 to-brand-600'}`}>
                    <CatIcon size={22} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-ink-900 truncate">{p.name}</p>
                        <p className="text-xs text-ink-400">{p.providerCode} — {p.category}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <Badge color={statusColors[p.status]} dot>{p.status}</Badge>
                        <Badge color={tierColors[p.tier]}>{p.tier === 'Preferred' && <Star size={10} className="mr-0.5" />}{p.tier}</Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-xs text-ink-500 flex-wrap">
                      {p.provincesServed.length > 0 && <span className="flex items-center gap-1"><MapPin size={12} /> {p.provincesServed.join(', ')}</span>}
                      {p.mobileServiceAvailable && <span className="flex items-center gap-1"><Truck size={12} /> Mobile</span>}
                      {p.services.length > 0 && <span className="text-ink-400">{p.services.length} services</span>}
                    </div>
                    {p.services.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {p.services.slice(0, 3).map((s, i) => <span key={i} className="px-1.5 py-0.5 bg-ink-50 text-ink-600 text-xs rounded">{s}</span>)}
                        {p.services.length > 3 && <span className="px-1.5 py-0.5 text-ink-400 text-xs">+{p.services.length - 3} more</span>}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// --- Detail view component ---

function ProviderDetail({
  provider: p,
  isAdmin,
  linkedMedicalsCount,
  linkedAppointmentsCount,
  onBack,
  onStatusChange,
  onTierChange,
  onAddSiteVisit,
}: {
  provider: Provider;
  isAdmin: boolean;
  linkedMedicalsCount: number;
  linkedAppointmentsCount: number;
  onBack: () => void;
  onStatusChange: (id: string, status: ProviderStatus) => void;
  onTierChange: (id: string, tier: ProviderTier) => void;
  onAddSiteVisit: (id: string, visit: Omit<ProviderSiteVisit, 'id'>) => void;
}) {
  const [activeTab, setActiveTab] = useState<'overview' | 'documents' | 'performance' | 'siteVisits'>('overview');
  const [showSiteVisitForm, setShowSiteVisitForm] = useState(false);
  const [siteVisitForm, setSiteVisitForm] = useState<Omit<ProviderSiteVisit, 'id'>>({
    visitDate: '',
    visitedBy: '',
    findings: '',
    recommendations: '',
    outcome: 'Satisfactory',
    followUpRequired: false,
    followUpDate: null,
  });
  const CatIcon = categoryIcons[p.category] || Building2;

  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: Info },
    { id: 'documents' as const, label: 'Documents', icon: FileText },
    { id: 'performance' as const, label: 'Performance', icon: TrendingUp },
    { id: 'siteVisits' as const, label: 'Site Visits', icon: ClipboardCheck },
  ];

  const handleSiteVisitSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!siteVisitForm.visitDate || !siteVisitForm.visitedBy) return;
    onAddSiteVisit(p.id, siteVisitForm);
    setShowSiteVisitForm(false);
    setSiteVisitForm({ visitDate: '', visitedBy: '', findings: '', recommendations: '', outcome: 'Satisfactory', followUpRequired: false, followUpDate: null });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="btn-secondary"><ArrowLeft size={16} /> Back to Providers</button>
        <div className="flex items-center gap-2">
          <Badge color={statusColors[p.status]} dot>{p.status}</Badge>
          <Badge color={tierColors[p.tier]}>{p.tier === 'Preferred' && <Star size={10} className="mr-0.5" />}{p.tier}</Badge>
        </div>
      </div>

      {isDemoMode && (
        <div className="p-3 bg-warning-50 text-warning-700 text-sm rounded-lg flex items-center gap-2">
          <AlertCircle size={16} className="shrink-0" />
          Demo mode — this provider record is fictional sample data. All fields are unverified placeholders. Changes are stored locally only.
        </div>
      )}

      {/* Header */}
      <div className="card overflow-hidden">
        <div className="h-20 bg-gradient-to-br from-brand-600 to-brand-900" />
        <div className="p-5 lg:p-6 -mt-8">
          <div className="flex items-end gap-4">
            <div className="h-16 w-16 rounded-2xl bg-white border-4 border-white shadow-lg flex items-center justify-center">
              <CatIcon size={28} className="text-brand-600" />
            </div>
            <div className="mb-1 flex-1">
              <h2 className="text-xl font-display font-bold text-ink-900">{p.name}</h2>
              <p className="text-sm text-ink-500">{p.providerCode} — {p.category}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-ink-100">
        {tabs.map((tab) => {
          const TabIcon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id ? 'border-brand-500 text-brand-600' : 'border-transparent text-ink-500 hover:text-ink-700'
              }`}
            >
              <TabIcon size={15} /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* Overview tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="card p-5">
            <h3 className="font-display font-bold text-ink-900 mb-4">Contact & Location</h3>
            <div className="space-y-3">
              <DetailRow icon={Building2} label="Category" value={p.category} />
              <DetailRow icon={MapPin} label="Address" value={p.physicalAddress} />
              {p.gpsCoordinates && <DetailRow icon={MapPin} label="GPS" value={p.gpsCoordinates} />}
              <DetailRow icon={Phone} label="Phone" value={p.phone} />
              <DetailRow icon={Mail} label="Email" value={p.email} />
              <DetailRow icon={Building2} label="Contact person" value={p.contactPerson} />
              <DetailRow icon={Clock} label="Operating hours" value={p.operatingHours} />
            </div>
          </div>

          <div className="card p-5">
            <h3 className="font-display font-bold text-ink-900 mb-4">Service Area & Capacity</h3>
            <div className="space-y-3">
              <div className="py-2 border-b border-ink-100">
                <p className="text-xs font-semibold text-ink-400 uppercase tracking-wider mb-1">Provinces served</p>
                <div className="flex flex-wrap gap-1.5">
                  {p.provincesServed.length > 0 ? p.provincesServed.map((prov) => <span key={prov} className="px-2 py-0.5 bg-teal-50 text-teal-700 text-xs rounded-md">{prov}</span>) : <span className="text-sm text-ink-400">Not specified</span>}
                </div>
              </div>
              <div className="py-2 border-b border-ink-100">
                <p className="text-xs font-semibold text-ink-400 uppercase tracking-wider mb-1">Towns served</p>
                <div className="flex flex-wrap gap-1.5">
                  {p.townsServed.length > 0 ? p.townsServed.map((t) => <span key={t} className="px-2 py-0.5 bg-ink-50 text-ink-600 text-xs rounded-md">{t}</span>) : <span className="text-sm text-ink-400">Not specified</span>}
                </div>
              </div>
              <DetailRow icon={Truck} label="Mobile service" value={p.mobileServiceAvailable ? 'Available' : 'Not available'} />
              <DetailRow icon={Building2} label="Service capacity" value={p.serviceCapacity ? `${p.serviceCapacity} per day` : 'Not specified'} />
              <div className="py-2 border-b border-ink-100">
                <p className="text-xs font-semibold text-ink-400 uppercase tracking-wider mb-1">Travel charges</p>
                <p className="text-sm text-ink-700">{p.travelCharges}</p>
              </div>
            </div>
          </div>

          <div className="card p-5">
            <h3 className="font-display font-bold text-ink-900 mb-4">Services Offered</h3>
            {p.services.length > 0 ? (
              <div className="space-y-2">
                {p.services.map((s, i) => (
                  <div key={i} className="flex items-center gap-2 py-2 px-3 bg-white rounded-lg border border-ink-100">
                    <CheckCircle2 size={14} className="text-success-500" />
                    <span className="text-sm text-ink-700">{s}</span>
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-ink-400">No services listed yet.</p>}
          </div>

          <div className="card p-5">
            <h3 className="font-display font-bold text-ink-900 mb-4">Booking & Commercial</h3>
            <div className="space-y-3">
              <div className="py-2 border-b border-ink-100">
                <p className="text-xs font-semibold text-ink-400 uppercase tracking-wider mb-1">Booking process</p>
                <p className="text-sm text-ink-700">{p.bookingProcess}</p>
              </div>
              <div className="py-2 border-b border-ink-100">
                <p className="text-xs font-semibold text-ink-400 uppercase tracking-wider mb-1">Appointment availability</p>
                <p className="text-sm text-ink-700">{p.appointmentAvailability}</p>
              </div>
              <div className="py-2 border-b border-ink-100">
                <p className="text-xs font-semibold text-ink-400 uppercase tracking-wider mb-1">Indicative pricing</p>
                <p className="text-sm text-ink-700">{p.indicativePricing}</p>
              </div>
              <div className="py-2 border-b border-ink-100">
                <p className="text-xs font-semibold text-ink-400 uppercase tracking-wider mb-1">Commercial terms</p>
                <p className="text-sm text-ink-700">{p.commercialTerms}</p>
              </div>
            </div>
          </div>

          <div className="card p-5">
            <h3 className="font-display font-bold text-ink-900 mb-4">Credentials & Accreditation</h3>
            <div className="space-y-3">
              <DetailRow icon={ShieldCheck} label="Registration no." value={p.registrationNumber} />
              <DetailRow icon={ShieldCheck} label="Licence no." value={p.licenceNumber} />
              <div className="py-2 border-b border-ink-100">
                <p className="text-xs font-semibold text-ink-400 uppercase tracking-wider mb-1">Accreditation details</p>
                <p className="text-sm text-ink-700">{p.accreditationDetails}</p>
              </div>
              <DetailRow icon={Calendar} label="Accreditation expiry" value={p.accreditationExpiryDate || 'Not specified'} />
              <DetailRow icon={Calendar} label="Last verified" value={p.lastVerificationDate || 'Never'} />
            </div>
          </div>

          <div className="card p-5">
            <h3 className="font-display font-bold text-ink-900 mb-4">Integration</h3>
            <div className="grid grid-cols-2 gap-3">
              <LinkStat icon={Stethoscope} label="Linked Medicals" value={linkedMedicalsCount} />
              <LinkStat icon={Calendar} label="Linked Appointments" value={linkedAppointmentsCount} />
            </div>
          </div>

          {p.internalNotes && (
            <div className="card p-5 lg:col-span-2">
              <h3 className="font-display font-bold text-ink-900 mb-2">Internal Notes</h3>
              <p className="text-sm text-ink-700 leading-relaxed">{p.internalNotes}</p>
              <p className="text-xs text-ink-400 mt-2">Record created: {new Date(p.createdAt).toLocaleDateString()} — Last updated: {new Date(p.updatedAt).toLocaleDateString()}</p>
            </div>
          )}
        </div>
      )}

      {/* Documents tab */}
      {activeTab === 'documents' && (
        <div className="card p-5">
          <h3 className="font-display font-bold text-ink-900 mb-4">Supporting Documents</h3>
          {p.documents.length === 0 ? (
            <p className="text-sm text-ink-400">No documents uploaded for this provider yet.</p>
          ) : (
            <div className="space-y-2">
              {p.documents.map((doc) => (
                <div key={doc.id} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-ink-100">
                  <FileText size={18} className={doc.verified ? 'text-success-500' : 'text-ink-400'} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink-800 truncate">{doc.name}</p>
                    <p className="text-xs text-ink-400">{doc.type} — Uploaded {doc.uploadedDate}{doc.expiryDate ? ` — Expires ${doc.expiryDate}` : ''}</p>
                  </div>
                  <Badge color={doc.verified ? 'success' : 'warning'}>{doc.verified ? 'Verified' : 'Pending'}</Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Performance tab */}
      {activeTab === 'performance' && (
        <div className="card p-5">
          <h3 className="font-display font-bold text-ink-900 mb-4">Performance Metrics</h3>
          {p.performanceMetrics.length === 0 ? (
            <p className="text-sm text-ink-400">No performance data recorded yet. Metrics will appear after the provider has completed appointments through the platform.</p>
          ) : (
            <div className="space-y-3">
              {p.performanceMetrics.map((m) => (
                <div key={m.id} className="border border-ink-100 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-semibold text-ink-900">{m.period}</span>
                    {m.clientSatisfactionScore !== null && (
                      <span className="flex items-center gap-1 text-sm text-success-600"><Star size={14} /> {m.clientSatisfactionScore}/10</span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <MetricBox label="Appointments" value={String(m.appointmentsCompleted)} />
                    <MetricBox label="No-show rate" value={`${m.noShowRate}%`} />
                    <MetricBox label="Avg turnaround" value={`${m.averageTurnaroundDays}d`} />
                    <MetricBox label="Quality score" value={`${m.qualityScore}/10`} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Site visits tab */}
      {activeTab === 'siteVisits' && (
        <div className="space-y-4">
          {isAdmin && !showSiteVisitForm && (
            <button className="btn-primary" onClick={() => setShowSiteVisitForm(true)}><Plus size={16} /> Record Site Visit</button>
          )}

          {showSiteVisitForm && (
            <div className="card p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-ink-900">Record Site Visit</h3>
                <button type="button" className="btn-secondary" onClick={() => setShowSiteVisitForm(false)}><X size={16} /> Cancel</button>
              </div>
              <form className="space-y-4" onSubmit={handleSiteVisitSubmit}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-ink-700 mb-1">Visit Date *</label>
                    <input className="input w-full" type="date" value={siteVisitForm.visitDate} onChange={(e) => setSiteVisitForm({ ...siteVisitForm, visitDate: e.target.value })} required />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-ink-700 mb-1">Visited By *</label>
                    <input className="input w-full" value={siteVisitForm.visitedBy} onChange={(e) => setSiteVisitForm({ ...siteVisitForm, visitedBy: e.target.value })} placeholder="Assessor name" required />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-1">Findings</label>
                  <textarea className="input w-full" rows={3} value={siteVisitForm.findings} onChange={(e) => setSiteVisitForm({ ...siteVisitForm, findings: e.target.value })} placeholder="Observations from the site visit" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-1">Recommendations</label>
                  <textarea className="input w-full" rows={2} value={siteVisitForm.recommendations} onChange={(e) => setSiteVisitForm({ ...siteVisitForm, recommendations: e.target.value })} placeholder="Any recommendations or required actions" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-ink-700 mb-1">Outcome</label>
                    <div className="relative">
                      <select className="input w-full pr-9 appearance-none cursor-pointer" value={siteVisitForm.outcome} onChange={(e) => setSiteVisitForm({ ...siteVisitForm, outcome: e.target.value as ProviderSiteVisit['outcome'] })}>
                        <option value="Satisfactory">Satisfactory</option>
                        <option value="Minor Issues">Minor Issues</option>
                        <option value="Major Issues">Major Issues</option>
                        <option value="Failed">Failed</option>
                      </select>
                      <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-6">
                    <input type="checkbox" id="followup" checked={siteVisitForm.followUpRequired} onChange={(e) => setSiteVisitForm({ ...siteVisitForm, followUpRequired: e.target.checked })} className="w-4 h-4 rounded border-ink-300" />
                    <label htmlFor="followup" className="text-sm text-ink-700">Follow-up required</label>
                  </div>
                </div>
                <button type="submit" className="btn-primary"><CheckCircle2 size={16} /> Save Site Visit</button>
              </form>
            </div>
          )}

          {p.siteVisits.length === 0 && !showSiteVisitForm ? (
            <div className="card p-12 text-center">
              <ClipboardCheck size={32} className="text-ink-300 mx-auto mb-3" />
              <p className="text-sm text-ink-500">No site visits recorded yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {p.siteVisits.map((visit) => (
                <div key={visit.id} className="card p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-sm font-semibold text-ink-900">{visit.visitDate}</p>
                      <p className="text-xs text-ink-400">Visited by {visit.visitedBy}</p>
                    </div>
                    <Badge color={visit.outcome === 'Satisfactory' ? 'success' : visit.outcome === 'Minor Issues' ? 'warning' : 'danger'}>{visit.outcome}</Badge>
                  </div>
                  {visit.findings && <p className="text-sm text-ink-700 mb-2"><span className="font-medium text-ink-500">Findings: </span>{visit.findings}</p>}
                  {visit.recommendations && <p className="text-sm text-ink-700 mb-2"><span className="font-medium text-ink-500">Recommendations: </span>{visit.recommendations}</p>}
                  {visit.followUpRequired && visit.followUpDate && (
                    <div className="flex items-center gap-1.5 text-xs text-warning-600 mt-2"><AlertCircle size={12} /> Follow-up required by {visit.followUpDate}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Admin status & tier management */}
      {isAdmin && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="card p-5">
            <h3 className="font-display font-bold text-ink-900 mb-3 flex items-center gap-2"><SettingsIcon size={16} /> Status Management</h3>
            <div className="flex flex-wrap gap-2">
              {allStatuses.filter((s) => s !== p.status).map((s) => (
                <button key={s} onClick={() => onStatusChange(p.id, s)} className="btn-secondary text-sm">{s}</button>
              ))}
            </div>
          </div>
          <div className="card p-5">
            <h3 className="font-display font-bold text-ink-900 mb-3 flex items-center gap-2"><Star size={16} /> Provider Tier</h3>
            <div className="flex flex-wrap gap-2">
              {allTiers.filter((t) => t !== p.tier).map((t) => (
                <button key={t} onClick={() => onTierChange(p.id, t)} className="btn-secondary text-sm">{t}</button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Helper components ---

function DetailRow({ icon: Icon, label, value }: { icon: typeof Building2; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-ink-100">
      <span className="flex items-center gap-2 text-sm text-ink-500"><Icon size={15} /> {label}</span>
      <span className="font-semibold text-ink-900 text-sm text-right">{value}</span>
    </div>
  );
}

function ProviderStat({ icon: Icon, label, value, color }: { icon: typeof Building2; label: string; value: number; color: 'success' | 'warning' | 'danger' | 'brand' }) {
  const colorMap = {
    success: 'bg-success-50 text-success-600',
    warning: 'bg-warning-50 text-warning-600',
    danger: 'bg-danger-50 text-danger-600',
    brand: 'bg-brand-50 text-brand-600',
  };
  return (
    <div className="card p-3.5 flex items-center gap-3">
      <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${colorMap[color]}`}><Icon size={18} /></div>
      <div><p className="text-xl font-bold font-display text-ink-900">{value}</p><p className="text-xs text-ink-400">{label}</p></div>
    </div>
  );
}

function LinkStat({ icon: Icon, label, value }: { icon: typeof Building2; label: string; value: number }) {
  return (
    <div className="border border-ink-100 rounded-lg p-3 flex items-center gap-2">
      <Icon size={16} className="text-ink-400" />
      <div><p className="text-lg font-bold font-display text-ink-900">{value}</p><p className="text-xs text-ink-400">{label}</p></div>
    </div>
  );
}

function MetricBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-ink-100 rounded-lg p-2.5">
      <p className="text-xs text-ink-400">{label}</p>
      <p className="text-base font-bold font-display text-ink-900">{value}</p>
    </div>
  );
}

function FilterSelect({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <div className="relative">
      <select className="input pr-9 appearance-none cursor-pointer text-sm py-2" value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="all">{label}: All</option>
        {options.filter((o) => o !== 'all').map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
    </div>
  );
}
