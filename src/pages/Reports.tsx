import { BarChart3, Download, TrendingUp, Users, Stethoscope, Plane, FileText, ShieldCheck } from 'lucide-react';
import { companies, employees, medicals, travelHealth, documents, monthlyMedicals, healthStatusBreakdown } from '@/data/mockData';
import { Badge } from '@/components/Badge';

export function Reports() {
  const maxMedicals = Math.max(...monthlyMedicals.map((m) => m.completed));

  const reports = [
    { title: 'Workforce Health Compliance Report', description: 'Comprehensive overview of medical compliance across all contracted companies.', icon: ShieldCheck, color: 'bg-success-50 text-success-600', date: 'Oct 2025', pages: 24 },
    { title: 'Travel Health Risk Summary', description: 'Pre-deployment risk assessments and vaccine coverage for travelling employees.', icon: Plane, color: 'bg-warning-50 text-warning-600', date: 'Oct 2025', pages: 12 },
    { title: 'Monthly Medical Activity Report', description: 'Breakdown of all occupational health assessments conducted this period.', icon: Stethoscope, color: 'bg-brand-50 text-brand-600', date: 'Sep 2025', pages: 18 },
    { title: 'Company Performance Dashboard', description: 'Per-company metrics on compliance, appointment attendance and health outcomes.', icon: BarChart3, color: 'bg-teal-50 text-teal-600', date: 'Sep 2025', pages: 31 },
    { title: 'Vaccination Coverage Report', description: 'Immunisation status across the workforce with gap analysis.', icon: FileText, color: 'bg-accent-50 text-accent-600', date: 'Sep 2025', pages: 9 },
    { title: 'Employee Health Trends Report', description: 'Year-over-year trends in occupational health indicators.', icon: TrendingUp, color: 'bg-brand-50 text-brand-600', date: 'Q3 2025', pages: 42 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-display font-bold text-ink-900">Reports</h2>
          <p className="text-sm text-ink-500">Generate and download compliance and health analytics</p>
        </div>
        <button className="btn-primary"><Download size={16} /> Generate Report</button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-3"><Users size={16} className="text-brand-600" /><span className="text-xs font-semibold text-ink-500">Total Workforce</span></div>
          <p className="text-2xl font-bold font-display text-ink-900">{employees.length}</p>
          <p className="text-xs text-ink-400 mt-1">Sample employees tracked</p>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-3"><Stethoscope size={16} className="text-teal-600" /><span className="text-xs font-semibold text-ink-500">Assessments (6mo)</span></div>
          <p className="text-2xl font-bold font-display text-ink-900">{monthlyMedicals.reduce((s, m) => s + m.completed, 0)}</p>
          <p className="text-xs text-ink-400 mt-1">Completed medicals</p>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-3"><Plane size={16} className="text-warning-600" /><span className="text-xs font-semibold text-ink-500">Travel Records</span></div>
          <p className="text-2xl font-bold font-display text-ink-900">{travelHealth.length}</p>
          <p className="text-xs text-ink-400 mt-1">Active travel assessments</p>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-3"><FileText size={16} className="text-accent-600" /><span className="text-xs font-semibold text-ink-500">Documents</span></div>
          <p className="text-2xl font-bold font-display text-ink-900">{documents.length}</p>
          <p className="text-xs text-ink-400 mt-1">Managed in system</p>
        </div>
      </div>

      {/* Mini chart */}
      <div className="card p-5">
        <h3 className="font-display font-bold text-ink-900 mb-1">Completed medicals — 6 month trend</h3>
        <p className="text-xs text-ink-400 mb-4">Monthly assessment volume</p>
        <div className="flex items-end gap-4 h-36">
          {monthlyMedicals.map((m) => (
            <div key={m.month} className="flex-1 flex flex-col items-center gap-2">
              <span className="text-xs font-semibold text-ink-700">{m.completed}</span>
              <div className="w-full max-w-[60px] bg-brand-100 rounded-t-md flex items-end" style={{ height: '100%' }}>
                <div className="w-full bg-brand-500 rounded-t-md transition-all duration-500" style={{ height: `${(m.completed / maxMedicals) * 100}%` }} />
              </div>
              <span className="text-xs text-ink-400 font-medium">{m.month}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Health status breakdown bar */}
      <div className="card p-5">
        <h3 className="font-display font-bold text-ink-900 mb-4">Health status distribution</h3>
        <div className="flex h-8 rounded-lg overflow-hidden mb-3">
          {healthStatusBreakdown.map((h) => {
            const total = healthStatusBreakdown.reduce((s, h) => s + h.value, 0);
            const pct = (h.value / total) * 100;
            return <div key={h.label} className={h.color} style={{ width: `${pct}%` }} title={h.label} />;
          })}
        </div>
        <div className="flex flex-wrap gap-4">
          {healthStatusBreakdown.map((h) => (
            <span key={h.label} className="flex items-center gap-2 text-xs text-ink-600">
              <span className={`w-2.5 h-2.5 rounded-sm ${h.color}`} />
              {h.label} ({h.value.toLocaleString()})
            </span>
          ))}
        </div>
      </div>

      {/* Available reports */}
      <div>
        <h3 className="font-display font-bold text-ink-900 mb-3">Available reports</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {reports.map((report) => {
            const Icon = report.icon;
            return (
              <div key={report.title} className="card card-hover p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className={`h-11 w-11 rounded-xl flex items-center justify-center ${report.color}`}>
                    <Icon size={20} />
                  </div>
                  <Badge color="ink">{report.date}</Badge>
                </div>
                <h4 className="font-display font-bold text-ink-900 text-sm mb-1.5">{report.title}</h4>
                <p className="text-xs text-ink-500 leading-relaxed mb-4">{report.description}</p>
                <div className="flex items-center justify-between pt-3 border-t border-ink-100">
                  <span className="text-xs text-ink-400">{report.pages} pages</span>
                  <button className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-700">
                    <Download size={14} /> Download
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
