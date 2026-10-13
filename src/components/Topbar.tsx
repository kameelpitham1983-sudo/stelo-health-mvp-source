import { Menu, Search, Bell, ChevronDown, X } from 'lucide-react';
import { useApp, type PageId } from '@/context/AppContext';
import { roles } from '@/data/mockData';
import { useState, useRef, useEffect } from 'react';
import { useEmployees, useCompanies } from '@/hooks/useSupabaseData';

const pageTitles: Record<string, string> = {
  dashboard: 'Dashboard',
  synopsis: 'Synopsis',
  companies: 'Companies',
  employees: 'Employees',
  medicals: 'Medicals',
  appointments: 'Appointments',
  sickness: 'Sickness Absence',
  travel: 'Travel Health',
  documents: 'Documents',
  reports: 'Reports',
  ai: 'Stelo AI',
  settings: 'Settings',
};

interface SearchResult {
  type: 'employee' | 'company';
  id: string;
  name: string;
  subtitle: string;
  page: PageId;
}

export function Topbar() {
  const { user, currentPage, setSidebarOpen, setPage, logout } = useApp();
  const { data: employees } = useEmployees();
  const { data: companies } = useCompanies();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchFocused(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  if (!user) return null;

  const roleInfo = roles.find((r) => r.id === user.role);

  const results: SearchResult[] = [];
  if (searchQuery.trim().length >= 1) {
    const q = searchQuery.toLowerCase();
    employees.forEach((e) => {
      if (e.name.toLowerCase().includes(q) || e.jobTitle.toLowerCase().includes(q)) {
        results.push({ type: 'employee', id: e.id, name: e.name, subtitle: `${e.jobTitle} · ${e.companyName}`, page: 'employees' });
      }
    });
    companies.forEach((c) => {
      if (c.name.toLowerCase().includes(q) || c.industry.toLowerCase().includes(q)) {
        results.push({ type: 'company', id: c.id, name: c.name, subtitle: c.industry, page: 'companies' });
      }
    });
  }
  const displayResults = results.slice(0, 8);

  const handleResultClick = (page: PageId) => {
    setPage(page);
    setSearchQuery('');
    setSearchFocused(false);
  };

  return (
    <header className="h-16 bg-white/80 backdrop-blur-md border-b border-ink-100 sticky top-0 z-30 flex items-center px-4 lg:px-6 gap-3">
      <button onClick={() => setSidebarOpen(true)} className="lg:hidden btn-ghost p-2 -ml-1">
        <Menu size={20} />
      </button>

      <h1 className="text-lg font-bold font-display text-ink-900 hidden sm:block">{pageTitles[currentPage]}</h1>

      <div className="flex-1" />

      <div className="hidden md:flex relative" ref={searchRef}>
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400 z-10" />
        <input
          type="text"
          placeholder="Search employees, companies..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setSearchFocused(true)}
          className="w-56 lg:w-72 pl-9 pr-3 py-2 bg-ink-50 border border-transparent rounded-lg text-sm text-ink-900 placeholder-ink-400 focus:outline-none focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-500/10 transition-all"
        />
        {searchFocused && searchQuery.trim().length >= 1 && (
          <div className="absolute top-full mt-2 w-80 lg:w-96 card p-2 animate-slide-down z-50 max-h-[400px] overflow-y-auto">
            {displayResults.length === 0 ? (
              <p className="text-sm text-ink-400 px-3 py-4 text-center">No results for "{searchQuery}"</p>
            ) : (
              <>
                {displayResults.map((r) => (
                  <button
                    key={`${r.type}-${r.id}`}
                    onClick={() => handleResultClick(r.page)}
                    className="w-full text-left p-2.5 rounded-lg hover:bg-ink-50 transition-colors flex items-center gap-3"
                  >
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${r.type === 'employee' ? 'bg-brand-50 text-brand-600' : 'bg-teal-50 text-teal-600'}`}>
                      <Search size={14} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-ink-900 truncate">{r.name}</p>
                      <p className="text-xs text-ink-400 truncate">{r.subtitle}</p>
                    </div>
                    <span className="text-[10px] font-medium text-ink-400 uppercase ml-auto shrink-0">{r.type}</span>
                  </button>
                ))}
                {results.length > 8 && (
                  <p className="text-xs text-ink-400 text-center py-2 border-t border-ink-100 mt-1">Showing 8 of {results.length} results</p>
                )}
              </>
            )}
          </div>
        )}
      </div>

      <button className="relative btn-ghost p-2">
        <Bell size={18} />
        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger-500 rounded-full" />
      </button>

      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex items-center gap-2 pl-1.5 pr-2 py-1.5 rounded-lg hover:bg-ink-50 transition-colors"
        >
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white text-xs font-bold">
            {user.avatarInitials}
          </div>
          <div className="hidden lg:flex flex-col items-start leading-none">
            <span className="text-sm font-semibold text-ink-900">{user.name}</span>
            <span className="text-xs text-ink-400">{roleInfo?.label}</span>
          </div>
          <ChevronDown size={16} className="text-ink-400 hidden lg:block" />
        </button>

        {menuOpen && (
          <div className="absolute right-0 mt-2 w-64 card p-2 animate-slide-down z-50">
            <div className="px-3 py-2.5 border-b border-ink-100">
              <p className="text-sm font-semibold text-ink-900">{user.name}</p>
              <p className="text-xs text-ink-400">{user.email}</p>
              <p className="text-xs text-brand-600 font-medium mt-1">{roleInfo?.label}</p>
            </div>
            <div className="py-1.5">
              <button
                onClick={() => { setMenuOpen(false); logout(); }}
                className="w-full text-left px-3 py-2 text-sm text-danger-600 hover:bg-danger-50 rounded-lg font-medium transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
