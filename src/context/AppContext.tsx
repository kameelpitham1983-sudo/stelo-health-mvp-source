import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { UserRole, User } from '@/types';
import { users } from '@/data/mockData';

export type PageId =
  | 'dashboard'
  | 'companies'
  | 'employees'
  | 'medicals'
  | 'appointments'
  | 'sickness'
  | 'travel'
  | 'visa'
  | 'providers'
  | 'documents'
  | 'reports'
  | 'ai'
  | 'settings'
  | 'synopsis';

interface AppContextValue {
  user: User | null;
  login: (role: UserRole) => void;
  logout: () => void;
  currentPage: PageId;
  setPage: (page: PageId) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState<PageId>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const login = useCallback((role: UserRole) => {
    setUser(users[role]);
    setCurrentPage('dashboard');
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setCurrentPage('dashboard');
  }, []);

  const setPage = useCallback((page: PageId) => {
    setCurrentPage(page);
    setSidebarOpen(false);
  }, []);

  return (
    <AppContext.Provider value={{ user, login, logout, currentPage, setPage, sidebarOpen, setSidebarOpen }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
