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
} from 'lucide-react';
import { useApp, type PageId } from '@/context/AppContext';
import { Logo } from '@/components/Logo';
import type { UserRole } from '@/types';

interface NavItem {
  id: PageId;
  label: string;
  icon: typeof LayoutDashboard;
  roles?: UserRole[];
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'synopsis', label: 'Synopsis', icon: ClipboardList, roles: ['admin', 'provider'] },
  { id: 'companies', label: 'Companies', icon: Building2, roles: ['admin', 'provider'] },
  { id: 'employees', label: 'Employees', icon: Users, roles: ['admin', 'employer', 'provider'] },
  { id: 'medicals', label: 'Medicals', icon: Stethoscope, roles: ['admin', 'employer', 'provider'] },
  { id: 'appointments', label: 'Appointments', icon: CalendarDays },
  { id: 'sickness', label: 'Sickness Absence', icon: HeartPulse, roles: ['admin', 'employer', 'provider'] },
  { id: 'travel', label: 'Travel Health', icon: Plane, roles: ['admin', 'employer', 'provider'] },
  { id: 'visa', label: 'Visa Medicals', icon: Globe, roles: ['admin', 'employer', 'provider'] },
  { id: 'providers', label: 'Provider Network', icon: Network, roles: ['admin', 'provider'] },
  { id: 'gops', label: 'Guarantees of Payment', icon: ShieldCheck, roles: ['admin', 'provider'] },
  { id: 'accommodation', label: 'Accommodation', icon: BedDouble, roles: ['admin', 'provider'] },
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'reports', label: 'Reports', icon: BarChart3, roles: ['admin', 'employer'] },
  { id: 'ai', label: 'Stelo AI', icon: Sparkles },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const { user, currentPage, setPage, sidebarOpen, setSidebarOpen, logout } = useApp();
  if (!user) return null;

  const visibleItems = navItems.filter((item) => !item.roles || item.roles.includes(user.role));

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
