import type { ReactNode } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: ReactNode;
  iconBg?: string;
  trend?: { value: string; up: boolean };
  subtitle?: string;
}

export function StatCard({ label, value, icon, iconBg = 'bg-brand-50 text-brand-600', trend, subtitle }: StatCardProps) {
  return (
    <div className="card card-hover p-5 animate-slide-up">
      <div className="flex items-start justify-between">
        <div className={`h-11 w-11 rounded-xl flex items-center justify-center ${iconBg}`}>
          {icon}
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-semibold ${trend.up ? 'text-success-600' : 'text-danger-600'}`}>
            {trend.up ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            {trend.value}
          </div>
        )}
      </div>
      <div className="mt-4">
        <p className="text-2xl font-bold font-display text-ink-900">{value}</p>
        <p className="text-sm text-ink-500 mt-0.5">{label}</p>
        {subtitle && <p className="text-xs text-ink-400 mt-1">{subtitle}</p>}
      </div>
    </div>
  );
}
