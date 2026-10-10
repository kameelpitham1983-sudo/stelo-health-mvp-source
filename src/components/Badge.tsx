import type { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  color?: 'success' | 'warning' | 'danger' | 'brand' | 'teal' | 'ink' | 'accent';
  dot?: boolean;
}

const colorMap: Record<string, string> = {
  success: 'bg-success-50 text-success-700',
  warning: 'bg-warning-50 text-warning-700',
  danger: 'bg-danger-50 text-danger-700',
  brand: 'bg-brand-50 text-brand-700',
  teal: 'bg-teal-50 text-teal-700',
  ink: 'bg-ink-100 text-ink-600',
  accent: 'bg-accent-50 text-accent-700',
};

const dotMap: Record<string, string> = {
  success: 'bg-success-500',
  warning: 'bg-warning-500',
  danger: 'bg-danger-500',
  brand: 'bg-brand-500',
  teal: 'bg-teal-500',
  ink: 'bg-ink-400',
  accent: 'bg-accent-500',
};

export function Badge({ children, color = 'ink', dot = false }: BadgeProps) {
  return (
    <span className={`badge ${colorMap[color]}`}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotMap[color]}`} />}
      {children}
    </span>
  );
}
