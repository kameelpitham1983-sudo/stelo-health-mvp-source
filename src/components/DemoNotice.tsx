import { FlaskConical } from 'lucide-react';
import { isDemoMode } from '@/hooks/useSupabaseData';

interface DemoNoticeProps {
  steps: string[];
}

export function DemoNotice({ steps }: DemoNoticeProps) {
  if (!isDemoMode) return null;
  return (
    <div className="card p-4 sm:p-5 border border-warning-200 bg-warning-50">
      <div className="flex items-start gap-3">
        <FlaskConical size={18} className="text-warning-700 mt-0.5 shrink-0" />
        <div className="min-w-0 space-y-2">
          <p className="text-sm font-semibold text-warning-800">Demo mode: simulated records</p>
          <p className="text-sm text-warning-800">Records you add or change here are kept in this browser tab only. Nothing is saved to the live database.</p>
          <ul className="list-disc pl-5 space-y-1 text-sm text-warning-800">
            {steps.map((step) => <li key={step}>{step}</li>)}
          </ul>
        </div>
      </div>
    </div>
  );
}
