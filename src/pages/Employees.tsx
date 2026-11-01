import { useState, useEffect } from 'react';
import {
  Search,
  Users,
  Filter,
  Plane,
  ChevronDown,
  AlertCircle,
  Plus,
  X,
  ArrowLeft,
  Mail,
  Phone,
  Building2,
  Briefcase,
  Calendar,
  Check,
  Stethoscope,
  FileText,
  ArrowRight,
} from 'lucide-react';
import { useEmployees, useCompanies, useMedicals } from '@/hooks/useSupabaseData';
import { useApp } from '@/context/AppContext';
import { can } from '@/lib/permissions';
import { Badge } from '@/components/Badge';
import { NotesPanel } from '@/components/NotesPanel';
import type { Employee } from '@/types';

const statusColors: Record<string, 'success' | 'warning' | 'danger' | 'brand' | 'teal' | 'ink'> = {
  Active: 'success',
  'On Leave': 'warning',
  'Pending Clearance': 'brand',
  Cleared: 'teal',
};

const healthColors: Record<string, 'success' | 'warning' | 'danger' | 'brand'> = {
  Fit: 'success',
  'Fit with Restrictions': 'warning',
  Unfit: 'danger',
  'Pending Assessment': 'brand',
};

const emptyForm: Partial<Employee> = {
  name: '',
  email: '',
  phone: '',
  jobTitle: '',
  companyId: '',
  department: '',
  status: 'Pending Clearance',
  healthStatus: 'Pending Assessment',
  travelReady: false,
};

export function Employees() {
  const { user, setPage, setPageWithContext, navContext, clearNavContext } = useApp();
  const { data: employees, loading, error, addEmployee } = useEmployees();
  const { data: companies } = useCompanies();
  const { data: medicals } = useMedicals();
  const [search, setSearch] = useState('');
  const [companyFilter, setCompanyFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selected, setSelected] = useState<Employee | null>(null);

  // Consume navigation context from other pages
  useEffect(() => {
    if (!navContext) return;
    if (navContext.companyId) {
      setCompanyFilter(navContext.companyId);
    } else if (navContext.companyName) {
      const company = companies.find((c) => c.name === navContext.companyName);
      if (company) setCompanyFilter(company.id);
    }
    clearNavContext();
  }, [navContext, companies, clearNavContext]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState<Partial<Employee>>(emptyForm);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const filtered = employees.filter((e) => {
    const matchSearch = e.name.toLowerCase().includes(search.toLowerCase()) || e.jobTitle.toLowerCase().includes(search.toLowerCase());
    const matchCompany = companyFilter === 'all' || e.companyId === companyFilter;
    const matchStatus = statusFilter === 'all' || e.status === statusFilter;
    return matchSearch && matchCompany && matchStatus;
  });

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitting(true);
    try {
      await addEmployee(formData);
      setShowAddForm(false);
      setFormData(emptyForm);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to register employee');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><span className="w-6 h-6 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin" /></div>;
  }

  if (error) {
    return <div className="card p-6 text-center"><AlertCircle size={24} className="text-danger-500 mx-auto mb-2" /><p className="text-sm text-ink-600">Failed to load employees: {error}</p></div>;
  }

  if (selected) {
    const employeeMedicals = medicals.filter((m) => m.employeeId === selected.id);
    const company = companies.find((c) => c.id === selected.companyId);
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <button onClick={() => setSelected(null)} className="btn-secondary">
            <ArrowLeft size={16} /> Back to Employees
          </button>
        </div>

        <div className="card overflow-hidden">
          <div className="h-24 bg-gradient-to-br from-brand-600 to-brand-900" />
          <div className="p-5 lg:p-6 -mt-10">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div className="flex items-end gap-4">
                <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 border-4 border-white shadow-lg flex items-center justify-center text-white text-xl font-bold">
                  {selected.avatarInitials}
                </div>
                <div className="mb-1">
                  <h2 className="text-xl font-display font-bold text-ink-900">{selected.name}</h2>
                  <p className="text-sm text-ink-500">{selected.jobTitle}</p>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Badge color={statusColors[selected.status] || 'ink'} dot>{selected.status}</Badge>
                <Badge color={healthColors[selected.healthStatus] || 'ink'}>{selected.healthStatus}</Badge>
                {selected.travelReady && <Badge color="teal" dot>Travel Ready</Badge>}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            <button onClick={() => setPageWithContext('medicals', { employeeId: selected.id, employeeName: selected.name })} className="btn-secondary text-sm">
              <Stethoscope size={15} /> New Assessment
            </button>
            <button onClick={() => setPageWithContext('appointments', { employeeId: selected.id, employeeName: selected.name, companyName: selected.companyName })} className="btn-secondary text-sm">
              <Calendar size={15} /> Book Appointment
            </button>
            <button onClick={() => setPageWithContext('documents', { employeeName: selected.name })} className="btn-secondary text-sm">
              <FileText size={15} /> View Documents
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="card p-5">
            <h3 className="font-display font-bold text-ink-900 mb-4">Contact Information</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Mail size={16} className="text-ink-400" />
                <span className="text-sm text-ink-700">{selected.email || '—'}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone size={16} className="text-ink-400" />
                <span className="text-sm text-ink-700">{selected.phone || '—'}</span>
              </div>
              <div className="flex items-center gap-3">
                <Building2 size={16} className="text-ink-400" />
                <span className="text-sm text-ink-700">{selected.companyName || company?.name || '—'}</span>
              </div>
              <div className="flex items-center gap-3">
                <Briefcase size={16} className="text-ink-400" />
                <span className="text-sm text-ink-700">{selected.department || '—'}</span>
              </div>
            </div>
          </div>

          <div className="card p-5">
            <h3 className="font-display font-bold text-ink-900 mb-4">Health & Compliance</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-ink-100">
                <span className="text-sm text-ink-500">Last Medical</span>
                <span className="font-semibold text-ink-900">{selected.lastMedicalDate || '—'}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-ink-100">
                <span className="text-sm text-ink-500">Next Due</span>
                <span className="font-semibold text-ink-900">{selected.nextMedicalDue || '—'}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-ink-100">
                <span className="text-sm text-ink-500">Fitness</span>
                <Badge color={healthColors[selected.healthStatus] || 'ink'}>{selected.healthStatus}</Badge>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-ink-500">Travel Ready</span>
                {selected.travelReady ? (
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-success-50 text-success-600"><Check size={14} /></span>
                ) : (
                  <span className="text-xs text-ink-400">No</span>
                )}
              </div>
            </div>
          </div>

          <div className="card p-5">
            <h3 className="font-display font-bold text-ink-900 mb-4">Medical Records</h3>
            {employeeMedicals.length === 0 ? (
              <p className="text-sm text-ink-400">No medical records on file.</p>
            ) : (
              <div className="space-y-2">
                {employeeMedicals.slice(0, 5).map((m) => (
                  <button key={m.id} onClick={() => setPageWithContext('medicals', { medicalId: m.id, employeeId: selected.id, employeeName: selected.name })} className="flex items-center justify-between py-2 border-b border-ink-100 last:border-0 w-full text-left hover:bg-ink-50 -mx-1 px-1 rounded transition-colors">
                    <div>
                      <p className="text-sm font-semibold text-ink-900">{m.type}</p>
                      <p className="text-xs text-ink-400">{m.date} · {m.providerName}</p>
                    </div>
                    <Badge color={m.status === 'Completed' ? 'success' : 'brand'}>{m.status}</Badge>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <NotesPanel recordType="employee" recordId={selected.id} authorName={user?.name || 'STelo Admin'} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-display font-bold text-ink-900">Employees</h2>
          <p className="text-sm text-ink-500">{filtered.length} of {employees.length} employees</p>
        </div>
        {can(user, 'employee.create') && (
        <button className="btn-primary" onClick={() => { setFormData(emptyForm); setShowAddForm(true); }}>
          <Plus size={16} /> Register Employee
        </button>
        )}
      </div>

      {showAddForm && (
        <div className="card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-ink-900">Register New Employee</h3>
            <button type="button" className="btn-secondary" onClick={() => setShowAddForm(false)}><X size={16} /> Cancel</button>
          </div>
          {submitError && <div className="p-3 bg-danger-50 text-danger-700 text-sm rounded-lg">{submitError}</div>}
          <form className="space-y-4" onSubmit={handleAddSubmit}>
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
              {submitting ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Plus size={16} /> Register Employee</>}
            </button>
          </form>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
          <input type="text" placeholder="Search by name or job title..." value={search} onChange={(e) => setSearch(e.target.value)} className="input pl-10" />
        </div>
        <div className="relative">
          <select value={companyFilter} onChange={(e) => setCompanyFilter(e.target.value)} className="input pr-9 appearance-none cursor-pointer min-w-[180px]">
            <option value="all">All companies</option>
            {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
        </div>
        <div className="relative">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input pr-9 appearance-none cursor-pointer min-w-[150px]">
            <option value="all">All statuses</option>
            <option value="Active">Active</option>
            <option value="On Leave">On Leave</option>
            <option value="Pending Clearance">Pending Clearance</option>
            <option value="Cleared">Cleared</option>
          </select>
          <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-ink-100 bg-ink-50/50">
                <th className="text-left text-xs font-bold text-ink-500 uppercase tracking-wider px-4 py-3">Employee</th>
                <th className="text-left text-xs font-bold text-ink-500 uppercase tracking-wider px-4 py-3 hidden md:table-cell">Company</th>
                <th className="text-left text-xs font-bold text-ink-500 uppercase tracking-wider px-4 py-3 hidden lg:table-cell">Department</th>
                <th className="text-left text-xs font-bold text-ink-500 uppercase tracking-wider px-4 py-3">Health</th>
                <th className="text-left text-xs font-bold text-ink-500 uppercase tracking-wider px-4 py-3 hidden sm:table-cell">Status</th>
                <th className="text-left text-xs font-bold text-ink-500 uppercase tracking-wider px-4 py-3 hidden xl:table-cell">Next Medical</th>
                <th className="text-center text-xs font-bold text-ink-500 uppercase tracking-wider px-4 py-3">Travel</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {filtered.map((emp) => (
                <tr key={emp.id} onClick={() => setSelected(emp)} className="hover:bg-ink-50/50 transition-colors cursor-pointer">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {emp.avatarInitials}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-ink-900 truncate">{emp.name}</p>
                        <p className="text-xs text-ink-400 truncate">{emp.jobTitle}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <p className="text-sm text-ink-600 truncate max-w-[180px]">{emp.companyName}</p>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <p className="text-sm text-ink-600">{emp.department}</p>
                  </td>
                  <td className="px-4 py-3">
                    <Badge color={healthColors[emp.healthStatus] || 'ink'}>{emp.healthStatus}</Badge>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <Badge color={statusColors[emp.status] || 'ink'} dot>{emp.status}</Badge>
                  </td>
                  <td className="px-4 py-3 hidden xl:table-cell">
                    <p className="text-sm text-ink-600">{emp.nextMedicalDue}</p>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {emp.travelReady ? (
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-success-50 text-success-600">
                        <Plane size={14} />
                      </span>
                    ) : (
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-ink-100 text-ink-400">
                        <Plane size={14} />
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="py-12 text-center">
            <Users size={32} className="mx-auto text-ink-300 mb-2" />
            <p className="text-sm text-ink-400">No employees match your filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}
