import type { ReactNode } from 'react';

export function DashboardHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-6">
      <h2 className="text-2xl font-bold font-display text-ink-900">{title}</h2>
      <p className="text-sm text-ink-500 mt-1">{subtitle}</p>
    </div>
  );
}

export function Panel({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="card p-5">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h3 className="text-base font-semibold text-ink-900">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}

export function EmptyRow({ text }: { text: string }) {
  return <p className="text-sm text-ink-400 py-6 text-center">{text}</p>;
}

export const CLOSED_CASE_STATUSES = ['completed', 'cancelled'];

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}
