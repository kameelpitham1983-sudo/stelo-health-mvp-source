import { BarChart3, Download, TrendingUp, Users, Stethoscope, Plane, FileText, ShieldCheck, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import {
  useCompanies,
  useEmployees,
  useMedicals,
  useTravelHealth,
  useDocuments,
} from '@/hooks/useSupabaseData';
import { Badge } from '@/components/Badge';

export function Reports() {
  const { data: companies, loading: coLoading } = useCompanies();
  const { data: employees, loading: empLoading } = useEmployees();
  const { data: medicals, loading: medLoading } = useMedicals();
  const { data: travelHealth, loading: travelLoading } = useTravelHealth();
  const { data: documents, loading: docLoading } = useDocuments();

  const [exporting, setExporting] = useState(false);

  const loading = coLoading || empLoading || medLoading || travelLoading || docLoading;

  if (loading) {
    return <div className="flex items-center justify-center py-20"><span className="w-6 h-6 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin" /></div>;
  }

  // Build monthly medicals from real data
  const now = new Date();
  const months: { month: string; completed: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthStr = d.toLocaleDateString('en', { month: 'short' });
    const yearMonth = d.toISOString().slice(0, 7);
    months.push({
      month: monthStr,
      completed: medicals.filter((m) => m.date.startsWith(yearMonth) && m.status === 'Completed').length,
    });
  }
  const maxMedicals = Math.max(...months.map((m) => m.completed), 1);

  // Health status breakdown from real employee data
  const fitCount = employees.filter((e) => e.healthStatus === 'Fit').length;
  const restrictedCount = employees.filter((e) => e.healthStatus === 'Fit with Restrictions').length;
  const pendingCount = employees.filter((e) => e.healthStatus === 'Pending Assessment').length;
  const unfitCount = employees.filter((e) => e.healthStatus === 'Unfit').length;
  const healthStatusBreakdown = [
    { label: 'Fit', value: fitCount, color: 'bg-success-500' },
    { label: 'Fit with Restrictions', value: restrictedCount, color: 'bg-warning-500' },
    { label: 'Pending Assessment', value: pendingCount, color: 'bg-brand-500' },
    { label: 'Unfit', value: unfitCount, color: 'bg-danger-500' },
  ];

  const reports = [
    { title: 'Workforce Health Compliance Report', description: 'Comprehensive overview of medical compliance across all contracted companies.', icon: ShieldCheck, color: 'bg-success-50 text-success-600' },
    { title: 'Travel Health Risk Summary', description: 'Pre-deployment risk assessments and vaccine coverage for travelling employees.', icon: Plane, color: 'bg-warning-50 text-warning-600' },
    { title: 'Monthly Medical Activity Report', description: 'Breakdown of all occupational health assessments conducted this period.', icon: Stethoscope, color: 'bg-brand-50 text-brand-600' },
    { title: 'Company Performance Dashboard', description: 'Per-company metrics on compliance, appointment attendance and health outcomes.', icon: BarChart3, color: 'bg-teal-50 text-teal-600' },
    { title: 'Vaccination Coverage Report', description: 'Immunisation status across the workforce with gap analysis.', icon: FileText, color: 'bg-accent-50 text-accent-600' },
    { title: 'Employee Health Trends Report', description: 'Year-over-year trends in occupational health indicators.', icon: TrendingUp, color: 'bg-brand-50 text-brand-600' },
  ];

  const handleExport = (reportTitle: string) => {
    setExporting(true);
    const rows: string[] = [];
    rows.push(`Report: ${reportTitle}`);
    rows.push(`Generated: ${new Date().toLocaleString()}`);
    rows.push('');
    rows.push('Summary Statistics');
    rows.push(`Total Companies,${companies.length}`);
    rows.push(`Active Companies,${companies.filter((c) => c.status === 'Active').length}`);
    rows.push(`Total Employees,${employees.length}`);
    rows.push(`Total Medicals,${medicals.length}`);
    rows.push(`Completed Medicals,${medicals.filter((m) => m.status === 'Completed').length}`);
    rows.push(`Scheduled Medicals,${medicals.filter((m) => m.status === 'Scheduled').length}`);
    rows.push(`Overdue Medicals,${medicals.filter((m) => m.status === 'Overdue').length}`);
    rows.push(`Total Appointments,${travelHealth.length}`);
    rows.push(`Travel Records,${travelHealth.length}`);
    rows.push(`Documents,${documents.length}`);
    rows.push('');
    rows.push('Health Status Breakdown');
    rows.push(`Fit,${fitCount}`);
    rows.push(`Fit with Restrictions,${restrictedCount}`);
    rows.push(`Pending Assessment,${pendingCount}`);
    rows.push(`Unfit,${unfitCount}`);

    const csv = rows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement('a');
    a.href = url;
    a.download = `${reportTitle.replace(/[^a-zA-Z0-9]/g, '_')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setTimeout(() => setExporting(false), 500);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-display font-bold text-ink-900">Reports</h2>
          <p className="text-sm text-ink-500">Generate and download compliance and health analytics</p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-3"><Users size={16} className="text-brand-600" /><span className="text-xs font-semibold text-ink-500">Total Workforce</span></div>
          <p className="text-2xl font-bold font-display text-ink-900">{employees.length}</p>
          <p className="text-xs text-ink-400 mt-1">Employees tracked in system</p>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-3"><Stethoscope size={16} className="text-teal-600" /><span className="text-xs font-semibold text-ink-500">Total Medicals</span></div>
          <p className="text-2xl font-bold font-display text-ink-900">{medicals.length}</p>
          <p className="text-xs text-ink-400 mt-1">{medicals.filter((m) => m.status === 'Completed').length} completed</p>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-3"><Plane size={16} className="text-warning-600" /><span className="text-xs font-semibold text-ink-500">Travel Records</span></div>
          <p className="text-2xl font-bold font-display text-ink-900">{travelHealth.length}</p>
          <p className="text-xs text-ink-400 mt-1">{travelHealth.filter((t) => t.status === 'Action Required').length} need action</p>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-3"><FileText size={16} className="text-accent-600" /><span className="text-xs font-semibold text-ink-500">Documents</span></div>
          <p className="text-2xl font-bold font-display text-ink-900">{documents.length}</p>
          <p className="text-xs text-ink-400 mt-1">{documents.filter((d) => d.status === 'Pending Review').length} pending review</p>
        </div>
      </div>

      {/* Mini chart */}
      <div className="card p-5">
        <h3 className="font-display font-bold text-ink-900 mb-1">Completed medicals — 6 month trend</h3>
        <p className="text-xs text-ink-400 mb-4">Monthly assessment volume from stored data</p>
        <div className="flex items-end gap-4 h-36">
          {months.map((m) => (
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
          {(() => {
            const total = healthStatusBreakdown.reduce((s, h) => s + h.value, 0) || 1;
            return healthStatusBreakdown.map((h) => {
              const pct = (h.value / total) * 100;
              return <div key={h.label} className={h.color} style={{ width: `${pct}%` }} title={h.label} />;
            });
          })()}
        </div>
        <div className="flex flex-wrap gap-4">
          {healthStatusBreakdown.map((h) => (
            <span key={h.label} className="flex items-center gap-2 text-xs text-ink-600">
              <span className={`w-2.5 h-2.5 rounded-sm ${h.color}`} />
              {h.label} ({h.value})
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
                  <Badge color="ink">CSV Export</Badge>
                </div>
                <h4 className="font-display font-bold text-ink-900 text-sm mb-1.5">{report.title}</h4>
                <p className="text-xs text-ink-500 leading-relaxed mb-4">{report.description}</p>
                <div className="flex items-center justify-between pt-3 border-t border-ink-100">
                  <span className="text-xs text-ink-400">From stored data</span>
                  <button
                    onClick={() => handleExport(report.title)}
                    disabled={exporting}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-700"
                  >
                    <Download size={14} /> {exporting ? 'Exporting...' : 'Download'}
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
