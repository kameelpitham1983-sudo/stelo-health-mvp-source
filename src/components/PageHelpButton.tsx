import { useState, useEffect } from 'react';
import { Info, X, ChevronRight, ArrowRight, Lightbulb, CheckCircle2 } from 'lucide-react';
import { useApp, type PageId } from '@/context/AppContext';
import { getPageHelp } from '@/data/pageHelp';

export function PageHelpButton() {
  const { currentPage, user, setPage } = useApp();
  const [open, setOpen] = useState(false);

  const role = user?.role || 'employee';
  const help = getPageHelp(currentPage, role);

  // Close drawer when page changes
  useEffect(() => {
    setOpen(false);
  }, [currentPage]);

  const pageLabel: Record<string, string> = {
    dashboard: 'Dashboard',
    cases: 'Case Management',
    caseDetail: 'Case Detail',
    workflows: 'Workflow Centre',
    synopsis: 'Synopsis',
    certificates: 'Digital Identity',
    companies: 'Companies',
    employees: 'Employees',
    medicals: 'Medicals',
    appointments: 'Appointments',
    sickness: 'Sickness Absence',
    travel: 'Travel Health',
    visa: 'Visa Medicals',
    providers: 'Provider Network',
    gops: 'Guarantees of Payment',
    accommodation: 'Accommodation',
    documents: 'Documents',
    reports: 'Reports',
    audit: 'Audit Log',
    ai: 'Stelo AI',
    settings: 'Settings',
    learning: 'Learning Centre',
    login: 'Sign In',
  };

  const label = pageLabel[currentPage] || currentPage;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="btn-ghost p-2"
        title={`Help: ${label}`}
        aria-label={`Help for ${label}`}
      >
        <Info size={18} />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 bg-ink-950/40 backdrop-blur-sm z-[90]"
            onClick={() => setOpen(false)}
          />
          <div className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl z-[95] flex flex-col animate-slide-in-right">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-ink-100 bg-brand-50/50">
              <div className="flex items-center gap-2">
                <Info size={18} className="text-brand-600" />
                <h3 className="text-sm font-bold text-ink-900">{label} — Help</h3>
              </div>
              <button onClick={() => setOpen(false)} className="btn-ghost p-1.5 -mr-1.5">
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Purpose */}
              <section>
                <h4 className="text-xs font-bold text-brand-600 uppercase tracking-wider mb-1.5">Purpose</h4>
                <p className="text-sm text-ink-700 leading-relaxed">{help.purpose}</p>
              </section>

              {/* Information required */}
              {help.required.length > 0 && (
                <section>
                  <h4 className="text-xs font-bold text-brand-600 uppercase tracking-wider mb-2">Information Required</h4>
                  <ul className="space-y-1.5">
                    {help.required.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-ink-700">
                        <ChevronRight size={14} className="text-ink-300 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* How to complete */}
              <section>
                <h4 className="text-xs font-bold text-brand-600 uppercase tracking-wider mb-2">How to Complete</h4>
                <ol className="space-y-2">
                  {help.steps.map((step, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-ink-700">
                      <span className="h-5 w-5 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <span className="leading-relaxed">{step}</span>
                    </li>
                  ))}
                </ol>
              </section>

              {/* Example */}
              <section className="p-3.5 bg-ink-50 rounded-lg">
                <h4 className="text-xs font-bold text-ink-400 uppercase tracking-wider mb-1.5">Example</h4>
                <p className="text-sm text-ink-700 leading-relaxed font-mono text-xs">{help.example}</p>
              </section>

              {/* What happens next */}
              <section className="p-3.5 bg-brand-50/50 rounded-lg border border-brand-100">
                <h4 className="text-xs font-bold text-brand-600 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <CheckCircle2 size={12} /> What Happens Next
                </h4>
                <p className="text-sm text-ink-700 leading-relaxed">{help.nextSteps}</p>
              </section>

              {/* Tips */}
              {help.tips && help.tips.length > 0 && (
                <section>
                  <h4 className="text-xs font-bold text-warning-600 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <Lightbulb size={12} /> Tips & Common Mistakes
                  </h4>
                  <ul className="space-y-1.5">
                    {help.tips.map((tip, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-ink-600">
                        <Lightbulb size={12} className="text-warning-500 shrink-0 mt-1" />
                        <span className="leading-relaxed">{tip}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Go to Learning Centre */}
              {currentPage !== 'learning' && (
                <button
                  onClick={() => { setOpen(false); setPage('learning'); }}
                  className="btn-secondary w-full text-sm"
                >
                  <ArrowRight size={14} /> Go to Learning Centre
                </button>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-ink-100 bg-ink-50/50">
              <p className="text-xs text-ink-400 text-center">
                Signed in as <span className="font-semibold text-ink-600">{role}</span> · Help adapts to your role
              </p>
            </div>
          </div>
        </>
      )}
    </>
  );
}
