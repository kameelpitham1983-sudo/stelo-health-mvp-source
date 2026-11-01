import { useState } from 'react';
import {
  Compass, X, ChevronLeft, ChevronRight, CheckCircle2,
  LayoutDashboard, Briefcase, Workflow, Stethoscope, FileText,
  CalendarDays, Users, Award, ArrowRight, Sparkles, ShieldCheck,
} from 'lucide-react';
import { useApp, type PageId } from '@/context/AppContext';
import type { UserRole } from '@/types';

interface OnboardingStep {
  title: string;
  description: string;
  icon: typeof Compass;
  page?: PageId;
}

const roleIntros: Record<UserRole, string> = {
  admin: 'As an Administrator, you have full platform access. You manage companies, employees, providers, workflows, cases, and all system settings.',
  coordinator: 'As a Coordinator, you are the operational backbone. You open cases, schedule appointments, track progress, and ensure every case moves forward.',
  provider: 'As a Provider or Clinician, you conduct clinical assessments, review questionnaires, and record fitness outcomes. Your clinical decisions are the core of the platform.',
  employer: 'As an Employer, you manage your company employees, request assessments, and receive authorised fitness outcomes. You see outcomes and restrictions, not confidential clinical answers.',
  employee: 'As an Employee, you can view your own appointments, certificates, and documents.',
  lab: 'As a Lab or Specialist, you receive laboratory requests and record test results linked to cases.',
  ai: 'The AI assistant provides clinical decision support. All output must be reviewed by an authorised clinician.',
};

const roleSteps: Record<UserRole, OnboardingStep[]> = {
  admin: [
    { title: 'Dashboard', description: 'Your starting point. See platform-wide activity, active cases, and key statistics at a glance.', icon: LayoutDashboard, page: 'dashboard' },
    { title: 'Case Management', description: 'Every operational matter lives here. Open new cases, track progress, and close them with a full audit trail.', icon: Briefcase, page: 'cases' },
    { title: 'Workflow Centre', description: 'Define and track step-by-step processes for each assessment type. Link workflows to cases.', icon: Workflow, page: 'workflows' },
    { title: 'Companies & Employees', description: 'Manage client companies and their employee records. Each employee links to medicals and cases.', icon: Users, page: 'companies' },
    { title: 'Medicals & Appointments', description: 'Track medical assessments and schedule appointments with providers. The 23-section questionnaire is completed here.', icon: Stethoscope, page: 'medicals' },
    { title: 'Audit Log', description: 'Every action is recorded. Review the complete audit trail for compliance and accountability.', icon: ShieldCheck, page: 'audit' },
    { title: 'Learning Centre', description: 'Return here anytime for guides, the operational workflow, and answers to common questions.', icon: Compass, page: 'learning' },
  ],
  coordinator: [
    { title: 'Dashboard', description: 'See what needs your attention today — new cases, pending actions, and overdue items.', icon: LayoutDashboard, page: 'dashboard' },
    { title: 'Case Management', description: 'Your central workspace. Open new cases, assign coordinators, link workflows, and track each case to completion.', icon: Briefcase, page: 'cases' },
    { title: 'Appointments', description: 'Book appointments with providers for medical assessments and link them to cases.', icon: CalendarDays, page: 'appointments' },
    { title: 'Documents', description: 'Upload, verify, and version all supporting documents for each case.', icon: FileText, page: 'documents' },
    { title: 'Learning Centre', description: 'Come back anytime for step-by-step guides and answers.', icon: Compass, page: 'learning' },
  ],
  provider: [
    { title: 'Appointments', description: 'View your upcoming appointments and record attendance.', icon: CalendarDays, page: 'appointments' },
    { title: 'Medicals', description: 'Complete clinical assessments and review the 23-section questionnaire. Record one of five fitness outcomes.', icon: Stethoscope, page: 'medicals' },
    { title: 'Synopsis', description: 'Create clinical synopsis reports summarising each assessment.', icon: FileText, page: 'synopsis' },
    { title: 'Certificates', description: 'Issue digital fitness certificates with QR verification.', icon: Award, page: 'certificates' },
    { title: 'Learning Centre', description: 'Return for the full operational workflow and questionnaire reference.', icon: Compass, page: 'learning' },
  ],
  employer: [
    { title: 'Dashboard', description: 'See an overview of your company health assessments and pending actions.', icon: LayoutDashboard, page: 'dashboard' },
    { title: 'Employees', description: 'Manage your employee records and track their medical status.', icon: Users, page: 'employees' },
    { title: 'Medicals', description: 'View assessment statuses for your employees. You see authorised outcomes, not confidential clinical answers.', icon: Stethoscope, page: 'medicals' },
    { title: 'Certificates', description: 'Access fitness certificates issued to your employees.', icon: Award, page: 'certificates' },
    { title: 'Learning Centre', description: 'Learn how to request assessments and track progress.', icon: Compass, page: 'learning' },
  ],
  employee: [
    { title: 'Appointments', description: 'Check your upcoming medical assessment appointments.', icon: CalendarDays, page: 'appointments' },
    { title: 'Certificates', description: 'View your fitness certificates and digital identity.', icon: Award, page: 'certificates' },
    { title: 'Documents', description: 'Access documents related to your medical records.', icon: FileText, page: 'documents' },
  ],
  lab: [
    { title: 'Provider Network', description: 'Your lab or specialist profile is managed here. Keep your details and accreditation current.', icon: ShieldCheck, page: 'providers' },
    { title: 'Cases', description: 'Cases where you are the assigned laboratory or specialist appear in Case Management.', icon: Briefcase, page: 'cases' },
  ],
  ai: [
    { title: 'Stelo AI', description: 'Ask clinical questions and get AI-assisted insights. All output must be reviewed by a clinician.', icon: Sparkles, page: 'ai' },
  ],
};

interface GuidedOnboardingProps {
  onComplete: () => void;
  onOpenPage: (page: PageId) => void;
}

export function GuidedOnboarding({ onComplete, onOpenPage }: GuidedOnboardingProps) {
  const { user } = useApp();
  const role = user?.role || 'employee';
  const steps = roleSteps[role];
  const [current, setCurrent] = useState(0);

  const isIntro = current === 0;
  const isOutro = current === steps.length + 1;
  const stepIndex = current - 1;
  const step = stepIndex >= 0 && stepIndex < steps.length ? steps[stepIndex] : null;

  const next = () => {
    if (current < steps.length + 1) setCurrent(current + 1);
    else onComplete();
  };
  const prev = () => {
    if (current > 0) setCurrent(current - 1);
  };

  const handleSkip = () => onComplete();

  const handleGoToPage = () => {
    if (step?.page) {
      onOpenPage(step.page);
      onComplete();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-ink-950/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-ink-100 bg-brand-50/50">
          <div className="flex items-center gap-2">
            <Compass size={18} className="text-brand-600" />
            <span className="text-sm font-bold text-ink-900">STelo Health Guided Tour</span>
          </div>
          <button onClick={handleSkip} className="btn-ghost p-1.5 -mr-1.5">
            <X size={18} />
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-ink-100">
          <div
            className="h-full bg-brand-600 transition-all duration-300"
            style={{ width: `${((current + 1) / (steps.length + 2)) * 100}%` }}
          />
        </div>

        {/* Content */}
        <div className="p-6">
          {isIntro && (
            <div className="text-center space-y-4">
              <div className="h-16 w-16 rounded-2xl bg-brand-50 flex items-center justify-center mx-auto">
                <Sparkles size={32} className="text-brand-600" />
              </div>
              <h2 className="text-xl font-display font-bold text-ink-900">Welcome to STelo Health</h2>
              <p className="text-sm text-ink-600 leading-relaxed">{roleIntros[role]}</p>
              <p className="text-xs text-ink-400">
                This quick tour will show you the key areas of the platform. You can return to the Learning Centre anytime.
              </p>
            </div>
          )}

          {step && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-brand-50 flex items-center justify-center shrink-0">
                  <step.icon size={24} className="text-brand-600" />
                </div>
                <div>
                  <span className="text-xs font-bold text-ink-400 uppercase tracking-wider">Step {stepIndex + 1} of {steps.length}</span>
                  <h3 className="text-lg font-display font-bold text-ink-900">{step.title}</h3>
                </div>
              </div>
              <p className="text-sm text-ink-600 leading-relaxed">{step.description}</p>
              {step.page && (
                <button onClick={handleGoToPage} className="btn-secondary text-sm">
                  Go to {step.title} <ArrowRight size={14} />
                </button>
              )}
            </div>
          )}

          {isOutro && (
            <div className="text-center space-y-4">
              <div className="h-16 w-16 rounded-2xl bg-success-50 flex items-center justify-center mx-auto">
                <CheckCircle2 size={32} className="text-success-600" />
              </div>
              <h2 className="text-xl font-display font-bold text-ink-900">You're all set!</h2>
              <p className="text-sm text-ink-600">
                You can revisit the Learning Centre anytime from the sidebar. It has the full operational workflow,
                module reference, questionnaire details, and answers to common questions.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-ink-100">
          <div className="flex items-center gap-1.5">
            {Array.from({ length: steps.length + 2 }).map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${i === current ? 'w-6 bg-brand-600' : 'w-1.5 bg-ink-200'}`}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            {current > 0 && (
              <button onClick={prev} className="btn-secondary text-sm">
                <ChevronLeft size={14} /> Back
              </button>
            )}
            <button onClick={handleSkip} className="text-sm text-ink-400 hover:text-ink-600 font-medium px-3 py-2">
              Skip
            </button>
            <button onClick={next} className="btn-primary text-sm">
              {isOutro ? <><CheckCircle2 size={14} /> Done</> : <>Next <ChevronRight size={14} /></>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
