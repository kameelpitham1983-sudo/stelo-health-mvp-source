import type { UserRole, User } from '@/types';
import type { PageId } from '@/context/AppContext';

type Role = Exclude<UserRole, 'master_admin'> | 'master_admin';

const effectiveRole = (role: Role): Exclude<UserRole, 'master_admin'> =>
  role === 'master_admin' ? 'admin' : role;

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

const ACTION_ROLES = {
  'company.create': ['admin', 'coordinator'],
  'company.edit': ['admin', 'coordinator'],
  'company.delete': ['admin'],
  'employee.create': ['admin', 'coordinator'],
  'employee.edit': ['admin', 'coordinator'],
  'employee.delete': ['admin'],
  'medical.create': ['admin', 'coordinator', 'provider'],
  'medical.edit': ['admin', 'coordinator', 'provider'],
  'medical.delete': ['admin'],
  'medical.clinical_review': ['admin', 'provider'],
  'appointment.create': ['admin', 'coordinator', 'provider'],
  'appointment.edit': ['admin', 'coordinator', 'provider'],
  'appointment.delete': ['admin', 'coordinator'],
  'case.create': ['admin', 'coordinator'],
  'case.edit': ['admin', 'coordinator', 'provider', 'lab'],
  'case.assign': ['admin', 'coordinator'],
  'document.upload': ['admin', 'coordinator', 'provider', 'lab', 'employee'],
  'document.download': ['admin', 'coordinator', 'provider', 'lab', 'employee', 'employer'],
  'document.verify': ['admin', 'coordinator', 'provider'],
  'document.delete': ['admin'],
  'gop.create': ['admin', 'coordinator'],
  'gop.approve': ['admin'],
  'gop.issue': ['admin', 'coordinator'],
  'certificate.issue': ['admin', 'provider'],
  'certificate.suspend': ['admin', 'provider'],
  'certificate.revoke': ['admin'],
  'provider.edit': ['admin', 'coordinator'],
  'provider.verify': ['admin'],
  'lab_result.submit': ['provider', 'lab'],
  'workflow.edit': ['admin', 'coordinator'],
  'clinical.view': ['admin', 'coordinator', 'provider', 'employee'],
  'confidential_note.view': ['admin', 'coordinator', 'provider'],
  'confidential_note.create': ['admin', 'provider'],
  'report.view': ['admin', 'coordinator', 'employer'],
  'audit.view': ['admin', 'coordinator'],
  'user.manage': ['admin'],
  'system.settings': ['admin'],
} as const satisfies Record<string, readonly Exclude<UserRole, 'master_admin'>[]>;

export type PermissionAction = keyof typeof ACTION_ROLES;

export function canAccessPage(role: UserRole | undefined, page: PageId): boolean {
  if (!role) return false;
  return ROLE_PAGES[role].includes(page);
}

export function can(user: Pick<User, 'role'> | null | undefined, action: PermissionAction): boolean {
  if (!user) return false;
  return (ACTION_ROLES[action] as readonly string[]).includes(effectiveRole(user.role));
}

export function assertCan(user: Pick<User, 'role'> | null | undefined, action: PermissionAction): void {
  if (!can(user, action)) throw new Error('You do not have permission to perform this action.');
}

export function canViewCompany(user: User | null | undefined, companyId: string | null | undefined): boolean {
  if (!user || !companyId) return false;
  if (effectiveRole(user.role) === 'employer') return user.companyId === companyId;
  return true;
}

export function canViewEmployeeRecord(user: User | null | undefined, employeeId: string | null | undefined, companyId: string | null | undefined): boolean {
  if (!user) return false;
  switch (effectiveRole(user.role)) {
    case 'employee':
      return !!employeeId && user.linkedEmployeeId === employeeId;
    case 'employer':
      return !!companyId && user.companyId === companyId;
    default:
      return true;
  }
}
