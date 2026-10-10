import { useState } from 'react';
import { Search, Building2, MapPin, Users, Calendar, Mail, Phone, ArrowLeft, Plus, Filter, MoreVertical } from 'lucide-react';
import { companies } from '@/data/mockData';
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

export function Companies() {
  const [selected, setSelected] = useState<Company | null>(null);
  const [search, setSearch] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  const filtered = companies.filter(
    (c) => c.name.toLowerCase().includes(search.toLowerCase()) || c.industry.toLowerCase().includes(search.toLowerCase())
  );

  if (selected) {
    return (
      <div className="space-y-6">
        <button onClick={() => setSelected(null)} className="btn-secondary">
          <ArrowLeft size={16} />
          Back to Companies
        </button>

        {/* Company header */}
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

        {/* Company details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="card p-5">
            <h3 className="font-display font-bold text-ink-900 mb-4">Key metrics</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-ink-100">
                <span className="flex items-center gap-2 text-sm text-ink-500"><Users size={15} /> Employees</span>
                <span className="font-semibold text-ink-900">{selected.employeeCount.toLocaleString()}</span>
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
            <h3 className="font-display font-bold text-ink-900 mb-4">Compliance summary</h3>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <span className="text-ink-500">Medical compliance</span>
                  <span className="font-semibold text-ink-900">92%</span>
                </div>
                <div className="h-2 bg-ink-100 rounded-full overflow-hidden">
                  <div className="h-full bg-success-500 rounded-full" style={{ width: '92%' }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <span className="text-ink-500">Vaccine coverage</span>
                  <span className="font-semibold text-ink-900">88%</span>
                </div>
                <div className="h-2 bg-ink-100 rounded-full overflow-hidden">
                  <div className="h-full bg-teal-500 rounded-full" style={{ width: '88%' }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <span className="text-ink-500">Travel readiness</span>
                  <span className="font-semibold text-ink-900">76%</span>
                </div>
                <div className="h-2 bg-ink-100 rounded-full overflow-hidden">
                  <div className="h-full bg-brand-500 rounded-full" style={{ width: '76%' }} />
                </div>
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
  <div className="card p-5">Add Company form will go here.</div>
)}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-display font-bold text-ink-900">Companies</h2>
          <p className="text-sm text-ink-500">{companies.length} corporate clients under contract</p>
        </div>
       <button
  className="btn-primary"
  onClick={() => setShowAddForm(true)}
>
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
    </div>
  );
}
