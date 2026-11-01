import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { UserRole, User } from '@/types';
import { users } from '@/data/mockData';
import { supabase, supabaseConfigured } from '@/lib/supabase';

export type PageId = 'dashboard' | 'workflows' | 'companies' | 'employees' | 'medicals' | 'appointments' | 'sickness' | 'travel' | 'visa' | 'providers' | 'gops' | 'accommodation' | 'documents' | 'reports' | 'ai' | 'settings' | 'synopsis' | 'certificates' | 'audit' | 'cases' | 'caseDetail' | 'learning' | 'userManagement';

export interface NavContext {
  employeeId?: string;
  employeeName?: string;
  companyId?: string;
  companyName?: string;
  medicalId?: string;
  visaCaseId?: string;
  certificateId?: string;
}

interface AppContextValue {
  user: User | null;
  login: (role: UserRole) => void;
  logout: () => void;
  switchRole: (role: UserRole) => void;
  currentPage: PageId;
  setPage: (page: PageId) => void;
  setPageWithContext: (page: PageId, context: NavContext) => void;
  navContext: NavContext | null;
  clearNavContext: () => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  authReady: boolean;
  showOnboarding: boolean;
  startOnboarding: () => void;
  completeOnboarding: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState<PageId>('dashboard');
  const [navContext, setNavContext] = useState<NavContext | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [onboardingShown, setOnboardingShown] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const loadSessionUser = useCallback(async (session: { user: { id: string; email?: string } } | null) => {
    if (!session?.user) {
      setUser(null);
      setAuthReady(true);
      return;
    }
    const { data: profile, error } = await supabase.from('profiles').select('id, role, company_id, linked_employee_id, display_name, avatar_initials').eq('id', session.user.id).maybeSingle();
    if (error || !profile) {
      setUser(null);
      setAuthReady(true);
      return;
    }
    let company: string | undefined;
    let jobTitle: string | undefined;
    if (profile.company_id) {
      const { data } = await supabase.from('companies').select('name').eq('id', profile.company_id).maybeSingle();
      if (data) company = data.name;
    }
    if (profile.linked_employee_id) {
      const { data } = await supabase.from('employees').select('job_title').eq('id', profile.linked_employee_id).maybeSingle();
      if (data) jobTitle = data.job_title;
    }
    const displayName = profile.display_name || session.user.email || 'User';
    setUser({ id: profile.id, name: displayName, email: session.user.email || '', role: profile.role as UserRole, avatarInitials: profile.avatar_initials || displayName.slice(0, 2).toUpperCase(), company, jobTitle, companyId: profile.company_id, linkedEmployeeId: profile.linked_employee_id });
    setAuthReady(true);
  }, []);

  useEffect(() => {
    if (!supabaseConfigured) {
      setAuthReady(true);
      return;
    }
    supabase.auth.getSession().then(({ data: { session } }) => loadSessionUser(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => { await loadSessionUser(session); })();
    });
    return () => subscription.unsubscribe();
  }, [loadSessionUser]);

  const login = useCallback((role: UserRole) => {
    setUser(users[role]);
    setCurrentPage('dashboard');
    setShowOnboarding(true);
  }, []);

  const switchRole = useCallback((role: UserRole) => {
    if (supabaseConfigured) return;
    setUser(users[role]);
  }, []);

  const logout = useCallback(async () => {
    if (supabaseConfigured) await supabase.auth.signOut();
    setUser(null);
    setCurrentPage('dashboard');
  }, []);

  const setPage = useCallback((page: PageId) => {
    setCurrentPage(page);
    setNavContext(null);
    setSidebarOpen(false);
  }, []);

  const setPageWithContext = useCallback((page: PageId, context: NavContext) => {
    setNavContext(context);
    setCurrentPage(page);
    setSidebarOpen(false);
  }, []);

  const clearNavContext = useCallback(() => {
    setNavContext(null);
  }, []);

  const startOnboarding = useCallback(() => {
    setShowOnboarding(true);
  }, []);

  // Show onboarding when a user logs in via Supabase auth (first session)
  useEffect(() => {
    if (user && !onboardingShown) {
      const key = `stelo_onboarding_${user.id}`;
      if (!localStorage.getItem(key)) {
        setShowOnboarding(true);
      } else {
        setOnboardingShown(true);
      }
    }
  }, [user, onboardingShown]);

  const completeOnboarding = useCallback(() => {
    setShowOnboarding(false);
    setOnboardingShown(true);
    if (user) localStorage.setItem(`stelo_onboarding_${user.id}`, '1');
  }, [user]);

  return <AppContext.Provider value={{ user, login, logout, switchRole, currentPage, setPage, setPageWithContext, navContext, clearNavContext, sidebarOpen, setSidebarOpen, authReady, showOnboarding, startOnboarding, completeOnboarding }}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
