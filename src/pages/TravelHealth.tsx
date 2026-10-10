import { useState } from 'react';
import { Plane, MapPin, Calendar, ShieldAlert, Syringe, Pill, Package, Search } from 'lucide-react';
import { travelHealth } from '@/data/mockData';
import { Badge } from '@/components/Badge';

const riskColors: Record<string, 'success' | 'warning' | 'danger' | 'ink'> = {
  Low: 'success',
  Moderate: 'warning',
  High: 'danger',
  'Very High': 'danger',
};

const statusColors: Record<string, 'success' | 'warning' | 'danger' | 'brand'> = {
  Cleared: 'success',
  Pending: 'warning',
  'Action Required': 'danger',
  'In Progress': 'brand',
};

const vaccineStatusColors: Record<string, 'success' | 'warning' | 'danger' | 'ink'> = {
  Complete: 'success',
  'In Progress': 'warning',
  'Not Started': 'ink',
  'Booster Due': 'danger',
};

export function TravelHealth() {
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = travelHealth.filter(
    (t) => t.employeeName.toLowerCase().includes(search.toLowerCase()) || t.destination.toLowerCase().includes(search.toLowerCase())
  );

  const actionsRequired = travelHealth.filter((t) => t.status === 'Action Required').length;
  const inProgress = travelHealth.filter((t) => t.status === 'In Progress').length;
  const cleared = travelHealth.filter((t) => t.status === 'Cleared').length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-display font-bold text-ink-900">Travel Health</h2>
        <p className="text-sm text-ink-500">Pre-deployment travel risk assessments and vaccine tracking</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="card p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-success-50 flex items-center justify-center"><Plane size={18} className="text-success-600" /></div>
          <div><p className="text-xl font-bold font-display text-ink-900">{cleared}</p><p className="text-xs text-ink-400">Cleared</p></div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-brand-50 flex items-center justify-center"><Syringe size={18} className="text-brand-600" /></div>
          <div><p className="text-xl font-bold font-display text-ink-900">{inProgress}</p><p className="text-xs text-ink-400">In Progress</p></div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-danger-50 flex items-center justify-center"><ShieldAlert size={18} className="text-danger-600" /></div>
          <div><p className="text-xl font-bold font-display text-ink-900">{actionsRequired}</p><p className="text-xs text-ink-400">Action Required</p></div>
        </div>
      </div>

      {actionsRequired > 0 && (
        <div className="card p-4 border-danger-200 bg-danger-50/30 flex items-start gap-3">
          <ShieldAlert size={18} className="text-danger-600 shrink-0 mt-0.5" />
          <p className="text-sm text-ink-700">
            <strong className="text-danger-700">{actionsRequired} travel health record(s) need immediate attention</strong> before upcoming deployments. Review vaccine boosters and malaria prophylaxis.
          </p>
        </div>
      )}

      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
        <input type="text" placeholder="Search by employee or destination..." value={search} onChange={(e) => setSearch(e.target.value)} className="input pl-10" />
      </div>

      <div className="space-y-3">
        {filtered.map((record) => (
          <div key={record.id} className="card overflow-hidden">
            <button
              onClick={() => setExpanded(expanded === record.id ? null : record.id)}
              className="w-full p-4 flex items-center gap-4 hover:bg-ink-50/50 transition-colors text-left"
            >
              <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white shrink-0">
                <Plane size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-ink-900">{record.employeeName}</p>
                  <Badge color={statusColors[record.status]} dot>{record.status}</Badge>
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-ink-500 flex-wrap">
                  <span className="flex items-center gap-1"><MapPin size={12} /> {record.destination}</span>
                  <span className="flex items-center gap-1"><Calendar size={12} /> Departs {record.departureDate}</span>
                  <Badge color={riskColors[record.riskLevel]}>{record.riskLevel} risk</Badge>
                </div>
              </div>
            </button>

            {expanded === record.id && (
              <div className="border-t border-ink-100 p-4 bg-ink-50/30 animate-slide-down">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-xs font-bold text-ink-500 uppercase tracking-wider mb-3">Vaccinations</h4>
                    <div className="space-y-2">
                      {record.vaccines.map((v) => (
                        <div key={v.name} className="flex items-center justify-between py-2 px-3 bg-white rounded-lg border border-ink-100">
                          <span className="flex items-center gap-2 text-sm text-ink-700">
                            <Syringe size={14} className="text-ink-400" />
                            {v.name}
                          </span>
                          <Badge color={vaccineStatusColors[v.status]}>{v.status}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-ink-500 uppercase tracking-wider mb-3">Travel preparation</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between py-2 px-3 bg-white rounded-lg border border-ink-100">
                        <span className="flex items-center gap-2 text-sm text-ink-700"><Pill size={14} className="text-ink-400" /> Malaria prophylaxis</span>
                        <Badge color={record.malariaProphylaxis ? 'success' : 'ink'}>{record.malariaProphylaxis ? 'Issued' : 'Not required'}</Badge>
                      </div>
                      <div className="flex items-center justify-between py-2 px-3 bg-white rounded-lg border border-ink-100">
                        <span className="flex items-center gap-2 text-sm text-ink-700"><Package size={14} className="text-ink-400" /> Travel medical kit</span>
                        <Badge color={record.travelKitIssued ? 'success' : 'ink'}>{record.travelKitIssued ? 'Issued' : 'Not issued'}</Badge>
                      </div>
                      <div className="flex items-center justify-between py-2 px-3 bg-white rounded-lg border border-ink-100">
                        <span className="flex items-center gap-2 text-sm text-ink-700"><Calendar size={14} className="text-ink-400" /> Last consultation</span>
                        <span className="text-sm font-medium text-ink-700">{record.lastConsultation}</span>
                      </div>
                      <div className="flex items-center justify-between py-2 px-3 bg-white rounded-lg border border-ink-100">
                        <span className="flex items-center gap-2 text-sm text-ink-700"><Calendar size={14} className="text-ink-400" /> Return date</span>
                        <span className="text-sm font-medium text-ink-700">{record.returnDate}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
