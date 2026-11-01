import type { UserRole } from '@/types';
import type { PageId } from '@/context/AppContext';

export const ROLE_PAGES: Record<UserRole, PageId[]> = {
  master_admin: ['dashboard', 'cases', 'caseDetail', 'workflows', 'synopsis', 'certificates', 'companies', 'employees', 'medicals', 'appointments', 'sickness', 'travel', 'visa', 'providers', 'gops', 'accommodation', 'documents', 'reports', 'audit', 'ai', 'settings', 'learning'],
  admin: ['dashboard', 'cases', 'caseDetail', 'workflows', 'synopsis', 'certificates', 'companies', 'employees', 'medicals', 'appointments', 'sickness', 'travel', 'visa', 'providers', 'gops', 'accommodation', 'documents', 'reports', 'audit', 'ai', 'settings', 'learning'],
  coordinator: ['dashboard', 'cases', 'caseDetail', 'workflows', 'certificates', 'companies', 'employees', 'medicals', 'appointments', 'sickness', 'travel', 'visa', 'providers', 'gops', 'accommodation', 'documents', 'reports', 'audit', 'ai', 'settings', 'learning'],
  provider: ['dashboard', 'cases', 'caseDetail', 'workflows', 'synopsis', 'certificates', 'companies', 'employees', 'medicals', 'appointments', 'sickness', 'travel', 'visa', 'providers', 'gops', 'accommodation', 'documents', 'ai', 'settings', 'learning'],
  employer: ['dashboard', 'cases', 'caseDetail', 'certificates', 'employees', 'medicals', 'appointments', 'sickness', 'travel', 'visa', 'documents', 'reports', 'ai', 'settings', 'learning'],
  employee: ['dashboard', 'certificates', 'medicals', 'appointments', 'documents', 'settings', 'learning'],
  lab: ['dashboard', 'cases', 'caseDetail', 'providers', 'documents', 'settings', 'learning'],
  ai: ['dashboard', 'settings'],
};

export function canAccessPage(role: UserRole | undefined, page: PageId): boolean {
  if (!role) return false;
  return ROLE_PAGES[role].includes(page);
}
