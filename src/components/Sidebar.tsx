import {
  LayoutDashboard,
  Building2,
  Users,
  Stethoscope,
  CalendarDays,
  Plane,
  Globe,
  Network,
  FileText,
  BarChart3,
  Sparkles,
  Settings,
  LogOut,
  X,
  ShieldCheck,
  ClipboardList,
  HeartPulse,
  BedDouble,
  Workflow,
  Award,
  History,
  Briefcase,
  UserCheck,
} from 'lucide-react';
import { useApp, type PageId } from '@/context/AppContext';
import { Logo } from '@/components/Logo';
import { canAccessPage } from '@/lib/permissions';

interface NavItem {
  id: PageId;
  label: string;
  icon: typeof LayoutDashboard;
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'cases', label: 'Case Management', icon: Briefcase },
  { id: 'onboarding', label: 'Onboarding', icon: UserCheck },
  { id: 'screening', label: 'HPV & Colorectal Screening', icon: HeartPulse },
  { id: 'workflows', label: 'Workflow Centre', icon: Workflow },
  { id: 'synopsis', label: 'Synopsis', icon: ClipboardList },
  { id: 'certificates', label: 'Digital Identity', icon: Award },
  { id: 'companies', label: 'Companies', icon: Building2 },
  { id: 'employees', label: 'Employees', icon: Users },
  { id: 'medicals', label: 'Medicals', icon: Stethoscope },
  { id: 'appointments', label: 'Appointments', icon: CalendarDays },
  { id: 'sickness', label: 'Sickness Absence', icon: HeartPulse },
  { id: 'travel', label: 'Travel Health', icon: Plane },
  { id: 'visa', label: 'Visa Medicals', icon: Globe },
  { id: 'providers', label: 'Provider Network', icon: Network },
  { id: 'gops', label: 'Guarantees of Payment', icon: ShieldCheck },
  { id: 'accommodation', label: 'Accommodation', icon: BedDouble },
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'reports', label: 'Reports', icon: BarChart3 },
  { id: 'audit', label: 'Audit Log', icon: History },
  { id: 'ai', label: 'Stelo AI', icon: Sparkles },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const { user, currentPage, setPage, sidebarOpen, setSidebarOpen, logout } = useApp();
  if (!user) return null;

  const visibleItems = navItems.filter((item) => canAccessPage(user.role, item.id));

  return (
    <>
      {sidebarOpen && (
        <div className="fixed inset-0 bg-ink-950/40 backdrop-blur-sm z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-[260px] bg-white border-r border-ink-100 flex flex-col transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-16 px-5 flex items-center justify-between border-b border-ink-100 shrink-0">
          <Logo size="sm" />
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden btn-ghost p-1.5 -mr-1">
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <p className="px-3 text-[10px] font-bold text-ink-300 uppercase tracking-wider mb-2">Platform</p>
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const active = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setPage(item.id)}
                className={`nav-item w-full ${active ? 'nav-item-active' : ''}`}
              >
                <Icon size={18} className={active ? 'text-brand-600' : 'text-ink-400'} strokeWidth={2} />
                <span>{item.label}</span>
                {item.id === 'ai' && (
                  <span className="ml-auto text-[10px] font-bold text-brand-600 bg-brand-50 px-1.5 py-0.5 rounded">AI</span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-ink-100 shrink-0">
          <div className="flex items-center gap-2 px-3 py-2 mb-2 rounded-lg bg-success-50">
            <ShieldCheck size={16} className="text-success-600" />
            <span className="text-xs font-semibold text-success-700">Secure Session Active</span>
          </div>
          <button onClick={logout} className="nav-item w-full text-danger-600 hover:bg-danger-50 hover:text-danger-700">
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
