import {
  Users,
  Building2,
  CalendarDays,
  Stethoscope,
  Plane,
  FileText,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  AlertCircle,
  Clock,
  CheckCircle2,
  ArrowRight,
  Activity as ActivityIcon,
} from 'lucide-react';
import { StatCard } from '@/components/StatCard';
import { Badge } from '@/components/Badge';
import { useApp } from '@/context/AppContext';
import {
  dashboardStats,
  monthlyMedicals,
  healthStatusBreakdown,
  activityFeed,
  appointments,
  companies,
} from '@/data/mockData';

const activityIcons: Record<string, typeof ActivityIcon> = {
  medical: Stethoscope,
  appointment: CalendarDays,
  document: FileText,
  travel: Plane,
  company: Building2,
  employee: Users,
  ai: Sparkles,
};

const activityColors: Record<string, string> = {
  medical: 'bg-brand-50 text-brand-600',
  appointment: 'bg-teal-50 text-teal-600',
  document: 'bg-accent-50 text-accent-600',
  travel: 'bg-warning-50 text-warning-600',
  company: 'bg-success-50 text-success-600',
  employee: 'bg-ink-100 text-ink-600',
  ai: 'bg-brand-50 text-brand-600',
};

export function Dashboard() {
  const { user, setPage } = useApp();
  if (!user) return null;

  const upcomingAppts = appointments.filter((a) => a.status === 'Confirmed' || a.status === 'Pending').slice(0, 5);
  const maxMedicals = Math.max(...monthlyMedicals.map((m) => m.completed + m.scheduled));

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-700 via-brand-800 to-brand-950 p-6 lg:p-8 text-white">
        <div className="absolute inset-0 bg-grid opacity-10" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/15 rounded-full blur-3xl" />
        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={16} className="text-teal-300" />
              <span className="text-xs font-semibold text-teal-300 uppercase tracking-wider">AI insights active</span>
            </div>
            <h2 className="text-2xl font-display font-bold mb-1">Welcome back, {user.name.split(' ')[0]}</h2>
            <p className="text-white/70 text-sm">Here's what's happening across your occupational health programme today.</p>
          </div>
          <button
            onClick={() => setPage('ai')}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-sm font-medium hover:bg-white/15 transition-colors shrink-0"
          >
            <Sparkles size={16} className="text-teal-300" />
            Ask Stelo AI
            <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Total Employees" value={dashboardStats.totalEmployees.toLocaleString()} icon={<Users size={20} />} iconBg="bg-brand-50 text-brand-600" trend={{ value: '+8.2%', up: true }} subtitle="Across all companies" />
        <StatCard label="Active Companies" value={dashboardStats.activeCompanies} icon={<Building2 size={20} />} iconBg="bg-teal-50 text-teal-600" subtitle={`${dashboardStats.totalCompanies} total contracted`} />
        <StatCard label="Upcoming Appointments" value={dashboardStats.upcomingAppointments} icon={<CalendarDays size={20} />} iconBg="bg-accent-50 text-accent-600" trend={{ value: '+3 this week', up: true }} />
        <StatCard label="Pending Medicals" value={dashboardStats.pendingMedicals} icon={<Stethoscope size={20} />} iconBg="bg-warning-50 text-warning-600" subtitle={`${dashboardStats.overdueMedicals} overdue`} />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Medicals chart */}
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-display font-bold text-ink-900">Medical assessments</h3>
              <p className="text-xs text-ink-400">Completed vs scheduled — last 6 months</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-brand-500" />Completed</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-brand-100" />Scheduled</span>
            </div>
          </div>
          <div className="flex items-end justify-between gap-3 h-48">
            {monthlyMedicals.map((m) => (
              <div key={m.month} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full flex flex-col items-center gap-1 h-full justify-end">
                  <div className="w-full max-w-[48px] flex flex-col gap-1 justify-end h-full">
                    <div className="w-full bg-brand-100 rounded-t-md transition-all duration-500" style={{ height: `${(m.scheduled / maxMedicals) * 100}%` }} />
                    <div className="w-full bg-brand-500 rounded-t-md transition-all duration-500" style={{ height: `${(m.completed / maxMedicals) * 100}%` }} />
                  </div>
                </div>
                <span className="text-xs text-ink-400 font-medium">{m.month}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Health status donut */}
        <div className="card p-5">
          <h3 className="font-display font-bold text-ink-900 mb-1">Health status</h3>
          <p className="text-xs text-ink-400 mb-5">Workforce breakdown</p>
          <div className="relative w-40 h-40 mx-auto mb-4">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              {(() => {
                const total = healthStatusBreakdown.reduce((s, h) => s + h.value, 0);
                let offset = 0;
                const colors = ['#12b85f', '#f88506', '#1a6ef5', '#d23a35'];
                return healthStatusBreakdown.map((h, i) => {
                  const dash = (h.value / total) * 251.2;
                  const el = (
                    <circle
                      key={h.label}
                      cx="50" cy="50" r="40"
                      fill="none"
                      stroke={colors[i]}
                      strokeWidth="14"
                      strokeDasharray={`${dash} 251.2`}
                      strokeDashoffset={-offset}
                    />
                  );
                  offset += dash;
                  return el;
                });
              })()}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold font-display text-ink-900">{dashboardStats.complianceRate}%</span>
              <span className="text-xs text-ink-400">compliance</span>
            </div>
          </div>
          <div className="space-y-2">
            {healthStatusBreakdown.map((h) => (
              <div key={h.label} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-ink-600">
                  <span className={`w-2.5 h-2.5 rounded-sm ${h.color}`} />
                  {h.label}
                </span>
                <span className="font-semibold text-ink-900">{h.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom row: activity + upcoming */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Activity feed */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold text-ink-900">Recent activity</h3>
            <button className="text-xs text-brand-600 font-medium hover:text-brand-700">View all</button>
          </div>
          <div className="space-y-1 max-h-[340px] overflow-y-auto -mr-2 pr-2">
            {activityFeed.map((event) => {
              const Icon = activityIcons[event.type] || ActivityIcon;
              return (
                <div key={event.id} className="flex gap-3 p-2.5 rounded-lg hover:bg-ink-50 transition-colors">
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${activityColors[event.type]}`}>
                    <Icon size={15} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-ink-900 leading-tight">{event.title}</p>
                    <p className="text-xs text-ink-500 mt-0.5 leading-snug">{event.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[11px] text-ink-400">{event.actor}</span>
                      <span className="text-[11px] text-ink-300">·</span>
                      <span className="text-[11px] text-ink-400">{event.timestamp}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Upcoming appointments + alerts */}
        <div className="space-y-4">
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-ink-900">Upcoming appointments</h3>
              <button onClick={() => setPage('appointments')} className="text-xs text-brand-600 font-medium hover:text-brand-700">View all</button>
            </div>
            <div className="space-y-2.5">
              {upcomingAppts.slice(0, 4).map((appt) => (
                <div key={appt.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-ink-50 transition-colors">
                  <div className="flex flex-col items-center justify-center w-12 h-12 rounded-lg bg-brand-50 text-brand-700 shrink-0">
                    <span className="text-[10px] font-medium uppercase">{new Date(appt.date).toLocaleDateString('en', { month: 'short' })}</span>
                    <span className="text-lg font-bold leading-none">{new Date(appt.date).getDate()}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-ink-900 truncate">{appt.employeeName}</p>
                    <p className="text-xs text-ink-500 truncate">{appt.type} · {appt.time}</p>
                  </div>
                  <Badge color={appt.status === 'Confirmed' ? 'success' : 'warning'} dot>
                    {appt.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          {/* AI alert card */}
          <div className="card p-5 border-brand-200 bg-gradient-to-br from-brand-50/50 to-white">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shrink-0">
                <Sparkles size={18} className="text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-display font-bold text-ink-900 text-sm">Stelo AI alert</h4>
                  <Badge color="brand">Action required</Badge>
                </div>
                <p className="text-sm text-ink-600 leading-relaxed">
                  <strong className="text-ink-800">3 travel health actions</strong> need attention before upcoming deployments. Meningitis ACWY booster due for Michael Torres.
                </p>
                <button onClick={() => setPage('travel')} className="mt-2.5 inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700">
                  Review travel health
                  <ArrowRight size={12} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick stats bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: ShieldCheck, label: 'Compliance rate', value: `${dashboardStats.complianceRate}%`, color: 'success' as const },
          { icon: Plane, label: 'Travel actions', value: dashboardStats.travelActionsRequired, color: 'warning' as const },
          { icon: FileText, label: 'Documents pending', value: dashboardStats.documentsPending, color: 'brand' as const },
          { icon: TrendingUp, label: 'Vaccine coverage', value: `${dashboardStats.vaccineCoverage}%`, color: 'teal' as const },
        ].map((stat) => {
          const Icon = stat.icon;
          const colorMap = {
            success: 'bg-success-50 text-success-600',
            warning: 'bg-warning-50 text-warning-600',
            brand: 'bg-brand-50 text-brand-600',
            teal: 'bg-teal-50 text-teal-600',
          };
          return (
            <div key={stat.label} className="card p-4 flex items-center gap-3 card-hover">
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${colorMap[stat.color]}`}>
                <Icon size={18} />
              </div>
              <div>
                <p className="text-lg font-bold font-display text-ink-900">{stat.value}</p>
                <p className="text-xs text-ink-400">{stat.label}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}