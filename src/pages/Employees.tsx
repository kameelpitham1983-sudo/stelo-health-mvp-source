import { useState } from 'react';
import { Search, Users, Filter, Plane, ChevronDown, AlertCircle } from 'lucide-react';
import { useEmployees, useCompanies } from '@/hooks/useSupabaseData';
import { Badge } from '@/components/Badge';

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

export function Employees() {
  const { data: employees, loading, error } = useEmployees();
  const { data: companies } = useCompanies();
  const [search, setSearch] = useState('');
  const [companyFilter, setCompanyFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = employees.filter((e) => {
    const matchSearch = e.name.toLowerCase().includes(search.toLowerCase()) || e.jobTitle.toLowerCase().includes(search.toLowerCase());
    const matchCompany = companyFilter === 'all' || e.companyId === companyFilter;
    const matchStatus = statusFilter === 'all' || e.status === statusFilter;
    return matchSearch && matchCompany && matchStatus;
  });

  if (loading) {
    return <div className="flex items-center justify-center py-20"><span className="w-6 h-6 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin" /></div>;
  }

  if (error) {
    return <div className="card p-6 text-center"><AlertCircle size={24} className="text-danger-500 mx-auto mb-2" /><p className="text-sm text-ink-600">Failed to load employees: {error}</p></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-display font-bold text-ink-900">Employees</h2>
          <p className="text-sm text-ink-500">{filtered.length} of {employees.length} employees</p>
        </div>
      </div>

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
                <tr key={emp.id} className="hover:bg-ink-50/50 transition-colors cursor-pointer">
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
