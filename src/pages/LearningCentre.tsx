import { useState, useMemo } from 'react';
import {
  BookOpen, Search, ChevronDown, ChevronRight, CheckCircle2, Circle,
  LayoutDashboard, Briefcase, Workflow, Building2, Users, Stethoscope,
  CalendarDays, HeartPulse, Plane, Globe, Network, FileText, BarChart3,
  Award, History, ShieldCheck, Lock, ArrowRight, Lightbulb, HelpCircle,
  Compass, UserCircle, ClipboardList, FlaskConical,
} from 'lucide-react';
import { useApp, type PageId } from '@/context/AppContext';
import type { UserRole } from '@/types';

// --- Role-specific onboarding guides ---

type RoleGuide = { title: string; description: string; steps: { title: string; description: string; page?: PageId }[] };

const baseRoleGuides: Omit<Record<UserRole, RoleGuide>, 'master_admin'> = {
  admin: {
    title: 'Administrator Guide',
    description: 'You have full platform access — manage companies, employees, providers, workflows, cases, and all records.',
    steps: [
      { title: 'Start with the Dashboard', description: 'The Dashboard shows your platform overview — active cases, pending appointments, and recent activity.', page: 'dashboard' },
      { title: 'Open or review a Case', description: 'Case Management is the central hub for every operational matter. Open a new case or review existing ones.', page: 'cases' },
      { title: 'Manage Workflows', description: 'The Workflow Centre defines and tracks step-by-step processes for each type of medical assessment.', page: 'workflows' },
      { title: 'Manage Companies and Employees', description: 'Add or update client companies and their employee records.', page: 'companies' },
      { title: 'Review Medicals and Appointments', description: 'Track medical assessments and schedule appointments with providers.', page: 'medicals' },
      { title: 'Manage the Provider Network', description: 'Verify and manage occupational health clinics, laboratories, and specialists.', page: 'providers' },
      { title: 'Review the Audit Log', description: 'Every action is logged. Review the audit trail for compliance and accountability.', page: 'audit' },
    ],
  },
  coordinator: {
    title: 'Coordinator Guide',
    description: 'You coordinate day-to-day operations — opening cases, scheduling appointments, and tracking progress.',
    steps: [
      { title: 'Open the Dashboard', description: 'See what needs your attention today — new cases, pending actions, and overdue items.', page: 'dashboard' },
      { title: 'Manage Cases', description: 'Open new cases, assign coordinators, link workflows, and track each case through to completion.', page: 'cases' },
      { title: 'Schedule Appointments', description: 'Book appointments with providers for medical assessments, travel consultations, and visa medicals.', page: 'appointments' },
      { title: 'Track Medicals', description: 'Monitor the status of medical assessments and record results.', page: 'medicals' },
      { title: 'Upload and manage Documents', description: 'Ensure all documents are uploaded, verified, and version-controlled.', page: 'documents' },
      { title: 'Monitor Travel and Visa Medicals', description: 'Track travel health consultations and visa medical requirements.', page: 'travel' },
    ],
  },
  provider: {
    title: 'Provider / Clinician Guide',
    description: 'You conduct clinical assessments, review questionnaires, and record fitness outcomes.',
    steps: [
      { title: 'Check your Appointments', description: 'View upcoming appointments assigned to you and record attendance.', page: 'appointments' },
      { title: 'Review Medicals', description: 'Complete medical assessments and record clinical findings.', page: 'medicals' },
      { title: 'Review Questionnaires', description: 'Review employee health questionnaires, flag items for clinical review, and record outcomes.', page: 'medicals' },
      { title: 'Record Fitness Outcomes', description: 'Determine and record one of the five fitness outcomes: Fit, Fit with restrictions, Temporarily unfit, Permanently unfit, or Requires specialist review.', page: 'medicals' },
      { title: 'Create Synopsis Reports', description: 'Generate clinical synopsis reports summarising the employee assessment.', page: 'synopsis' },
      { title: 'Issue Digital Certificates', description: 'Issue fitness certificates with QR verification for employees.', page: 'certificates' },
    ],
  },
  employer: {
    title: 'Employer Guide',
    description: 'You manage your company employees, request assessments, and receive authorised fitness outcomes.',
    steps: [
      { title: 'View the Dashboard', description: 'See an overview of your company health assessments and pending actions.', page: 'dashboard' },
      { title: 'Manage Employees', description: 'Add or update your employee records and track their medical status.', page: 'employees' },
      { title: 'Track Medicals', description: 'View the status of medical assessments for your employees. You see authorised outcomes, not confidential clinical answers.', page: 'medicals' },
      { title: 'Monitor Appointments', description: 'Track scheduled appointments for your employees.', page: 'appointments' },
      { title: 'View Digital Certificates', description: 'Access fitness certificates issued to your employees.', page: 'certificates' },
      { title: 'Track Sickness Absence', description: 'Refer employees for sickness absence management and track return-to-work progress.', page: 'sickness' },
    ],
  },
  employee: {
    title: 'Employee Guide',
    description: 'You can view your own medical records, appointments, and certificates.',
    steps: [
      { title: 'View your Appointments', description: 'Check upcoming appointments scheduled for your medical assessments.', page: 'appointments' },
      { title: 'View your Certificates', description: 'Access your fitness certificates and digital identity.', page: 'certificates' },
      { title: 'Access your Documents', description: 'View documents related to your medical records.', page: 'documents' },
    ],
  },
  lab: {
    title: 'Lab / Specialist Guide',
    description: 'You receive laboratory requests and record test results.',
    steps: [
      { title: 'Check the Provider Network', description: 'Your lab or specialist profile is managed here. Ensure your details and accreditation are current.', page: 'providers' },
      { title: 'View linked Cases', description: 'Cases where you are the assigned laboratory or specialist appear in Case Management.', page: 'cases' },
    ],
  },
  ai: {
    title: 'AI Assistant Guide',
    description: 'The AI assistant helps with clinical decision support.',
    steps: [
      { title: 'Use Stelo AI', description: 'Ask clinical questions and get AI-assisted insights. All AI output must be reviewed by an authorised clinician.', page: 'ai' },
    ],
  },
};

// --- Operational workflow stages ---

const roleGuides: Record<UserRole, RoleGuide> = { ...baseRoleGuides, master_admin: baseRoleGuides.admin };

const workflowStages = [
  { number: 1, title: 'Receive and Record a Request', module: 'Case Management', page: 'cases' as PageId, description: 'A client requests a medical assessment. Open a new case with the case type, company, and employee details.', who: 'Coordinator or Admin' },
  { number: 2, title: 'Identify the Company and Employee', module: 'Companies & Employees', page: 'companies' as PageId, description: 'Confirm the company and employee records exist. Create them if needed. Link the employee to the case.', who: 'Coordinator' },
  { number: 3, title: 'Review the Requested Service', module: 'Case Management', page: 'cases' as PageId, description: 'Determine whether this is a pre-employment, periodical, transfer, travel, visa, lab request, specialist referral, or sickness absence case.', who: 'Coordinator' },
  { number: 4, title: 'Start the Appropriate Workflow', module: 'Workflow Centre', page: 'workflows' as PageId, description: 'Link the relevant workflow to the case. This creates a step-by-step process with assigned responsibilities and completion criteria.', who: 'Coordinator or Admin' },
  { number: 5, title: 'Schedule Appointments', module: 'Appointments', page: 'appointments' as PageId, description: 'Book an appointment with a provider for the assessment. Link the appointment to the case.', who: 'Coordinator' },
  { number: 6, title: 'Complete Questionnaires and Assessments', module: 'Medicals', page: 'medicals' as PageId, description: 'The employee completes the Deployment Readiness Questionnaire (23 sections, A–W). The provider conducts the clinical assessment.', who: 'Employee and Provider' },
  { number: 7, title: 'Record Clinical Review and Outcome', module: 'Medicals & Synopsis', page: 'medicals' as PageId, description: 'The authorised clinician reviews the questionnaire and assessment, then records one of five fitness outcomes.', who: 'Provider / Clinician' },
  { number: 8, title: 'Manage Restrictions and Referrals', module: 'Case Management', page: 'cases' as PageId, description: 'If the outcome includes restrictions or requires specialist review, record the restrictions and link any specialist referrals or lab requests.', who: 'Coordinator and Provider' },
  { number: 9, title: 'Generate Certificates and Documents', module: 'Certificates & Documents', page: 'certificates' as PageId, description: 'Issue digital fitness certificates with QR verification. Upload and version all supporting documents.', who: 'Provider and Coordinator' },
  { number: 10, title: 'Communicate Authorised Outcomes', module: 'Reports', page: 'reports' as PageId, description: 'Share the authorised fitness outcome and relevant restrictions with the employer. Confidential clinical answers are never shared with employers.', who: 'Coordinator' },
  { number: 11, title: 'Monitor Outstanding Actions', module: 'Case Management', page: 'cases' as PageId, description: 'Track overdue cases, pending actions, and exceptions. Reassign tasks or record reasons for delays.', who: 'Coordinator and Admin' },
  { number: 12, title: 'Close the Case', module: 'Case Management', page: 'cases' as PageId, description: 'Confirm all steps are complete, documents are filed, and the audit trail is intact. Close the case with closure notes.', who: 'Coordinator or Admin' },
];

// --- Module reference ---

const moduleGuides: { page: PageId; label: string; icon: typeof LayoutDashboard; description: string; who: string }[] = [
  { page: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, description: 'Platform overview showing active cases, pending appointments, recent activity, and key statistics.', who: 'All roles' },
  { page: 'cases', label: 'Case Management', icon: Briefcase, description: 'Central hub for every operational matter. Each case links to the company, employee, workflow, appointment, medical, provider, documents, and audit history.', who: 'Admin, Coordinator, Provider, Employer' },
  { page: 'workflows', label: 'Workflow Centre', icon: Workflow, description: 'Defines and tracks step-by-step processes for each assessment type. Each step has a responsible role, completion criteria, and escalation rules.', who: 'Admin, Coordinator, Provider' },
  { page: 'synopsis', label: 'Synopsis', icon: ClipboardList, description: 'Clinical synopsis reports summarising the employee assessment, including meeting notes and follow-up actions.', who: 'Admin, Provider' },
  { page: 'certificates', label: 'Digital Identity', icon: Award, description: 'Digital fitness certificates with QR verification. Issued after a clinician records a fitness outcome.', who: 'All roles' },
  { page: 'companies', label: 'Companies', icon: Building2, description: 'Client company records including contract details, employee counts, and contact information.', who: 'Admin, Coordinator, Provider' },
  { page: 'employees', label: 'Employees', icon: Users, description: 'Employee records linked to companies. Track medical status, fitness outcomes, and next assessment dates.', who: 'Admin, Coordinator, Provider, Employer' },
  { page: 'medicals', label: 'Medicals', icon: Stethoscope, description: 'Medical assessment records. The 23-section Deployment Readiness Questionnaire is completed here. Clinicians record fitness outcomes.', who: 'Admin, Coordinator, Provider, Employer' },
  { page: 'appointments', label: 'Appointments', icon: CalendarDays, description: 'Schedule and track appointments with providers. Link appointments to cases and medicals.', who: 'All roles' },
  { page: 'sickness', label: 'Sickness Absence', icon: HeartPulse, description: 'Manage sickness absence referrals, risk assessments, return-to-work planning, and case closure.', who: 'Admin, Coordinator, Provider, Employer' },
  { page: 'travel', label: 'Travel Health', icon: Plane, description: 'Travel health consultations including vaccination plans, malaria prophylaxis, and travel risk assessments.', who: 'Admin, Coordinator, Provider, Employer' },
  { page: 'visa', label: 'Visa Medicals', icon: Globe, description: 'Visa medical cases with country-specific requirements, checklists, and clinician review.', who: 'Admin, Coordinator, Provider, Employer' },
  { page: 'providers', label: 'Provider Network', icon: Network, description: 'Manage the network of occupational health clinics, laboratories, and specialists. Track verification status and accreditation.', who: 'Admin, Coordinator, Provider, Lab' },
  { page: 'gops', label: 'Guarantees of Payment', icon: ShieldCheck, description: 'Authorise and track guarantees of payment for providers and accommodation.', who: 'Admin, Coordinator, Provider' },
  { page: 'accommodation', label: 'Accommodation', icon: FileText, description: 'Manage hotel bookings and accommodation for employees travelling for assessments.', who: 'Admin, Coordinator, Provider' },
  { page: 'documents', label: 'Documents', icon: FileText, description: 'Central document store with version history, expiry tracking, and role-based access control.', who: 'All roles' },
  { page: 'reports', label: 'Reports', icon: BarChart3, description: 'Generate reports on assessments, outcomes, and platform activity.', who: 'Admin, Coordinator, Employer' },
  { page: 'audit', label: 'Audit Log', icon: History, description: 'Complete audit trail of every action on the platform, filterable by actor, record type, and action.', who: 'Admin, Coordinator' },
  { page: 'ai', label: 'Stelo AI', icon: BarChart3, description: 'AI-assisted clinical decision support. All AI output must be reviewed by an authorised clinician.', who: 'Admin, Coordinator, Provider, Employer' },
];

// --- Questionnaire sections summary ---

const questionnaireSections = [
  { id: 'A', title: 'Deployment & Demographic Details', count: 15 },
  { id: 'B', title: 'Travel History', count: 3 },
  { id: 'C', title: 'Allergies', count: 8 },
  { id: 'D', title: 'Pre-Existing Medical Conditions', count: 15 },
  { id: 'E', title: 'Phobias, Motion Sickness & Jet Lag', count: 7 },
  { id: 'F', title: 'Medical Alert, Blood Group & Organ Donor', count: 6 },
  { id: 'G', title: 'Fit to Fly', count: 1 },
  { id: 'H', title: 'Surgical History', count: 6 },
  { id: 'I', title: 'Current Medication & Adherence', count: 7 },
  { id: 'J', title: 'Disability & Work Restrictions', count: 7 },
  { id: 'K', title: 'Mental Health', count: 6 },
  { id: 'L', title: 'Alcohol Use', count: 5 },
  { id: 'M', title: 'Smoking & Tobacco/Nicotine Use', count: 4 },
  { id: 'N', title: 'Recreational / Illicit Drug Use', count: 5 },
  { id: 'O', title: 'Cardiovascular Risk Assessment', count: 7 },
  { id: 'P', title: 'DVT / VTE Risk', count: 7 },
  { id: 'Q', title: 'Heat-Related Illness Risk', count: 7 },
  { id: 'R', title: 'Family History', count: 7 },
  { id: 'S', title: 'Reproductive Health (Confidential)', count: 8 },
  { id: 'T', title: 'Visa, Legal & Occupational Restrictions', count: 7 },
  { id: 'U', title: 'Immunisation & Travel Medicine History', count: 5 },
  { id: 'V', title: 'Blood Products, TB & Infectious Disease', count: 14 },
  { id: 'W', title: 'Declaration & Consent', count: 7 },
];

const fitnessOutcomes = [
  { outcome: 'Fit', description: 'The employee is medically fit for the deployment or role without any restrictions.' },
  { outcome: 'Fit with restrictions', description: 'The employee is fit subject to specific documented restrictions or accommodations (e.g. no work at heights, medication supply planning).' },
  { outcome: 'Temporarily unfit', description: 'The employee is not fit at this time but the condition may resolve. Reassessment is required after a defined period.' },
  { outcome: 'Permanently unfit', description: 'The employee has a permanent condition that precludes this role or deployment. No reassessment is expected to change the outcome.' },
  { outcome: 'Requires specialist review', description: 'The assessing clinician cannot determine fitness without further specialist input (e.g. cardiology, neurology, psychiatry).' },
];

const faqs = [
  { q: 'How do I open a new case?', a: 'Go to Case Management in the sidebar and click "Open New Case". Select the case type, company, employee, priority, and target completion date. A unique case reference is generated automatically.' },
  { q: 'What is the Deployment Readiness Questionnaire?', a: 'It is a 23-section health questionnaire (sections A–W) covering demographics, medical history, allergies, medications, mental health, cardiovascular risk, travel health, reproductive health, and more. It is completed by the employee and reviewed by an authorised clinician.' },
  { q: 'Who can record a fitness outcome?', a: 'Only an authorised clinician (provider role) can record one of the five fitness outcomes. The system never auto-generates clinical decisions.' },
  { q: 'Can employers see clinical questionnaire answers?', a: 'No. Employers receive only the authorised fitness outcome and relevant work restrictions. Confidential clinical answers, including reproductive health and mental health responses, are protected by role-based access controls.' },
  { q: 'How does the workflow system work?', a: 'Each workflow defines a sequence of steps with responsible roles, required documents, and completion criteria. When a workflow is linked to a case, each step is tracked from Pending through Completed. Overdue steps and exceptions are flagged automatically.' },
  { q: 'What happens after I schedule an appointment?', a: 'The appointment is linked to the case and the assigned provider. The provider conducts the assessment, the employee completes the questionnaire if required, and the clinician records the fitness outcome. The case status updates automatically.' },
  { q: 'How are documents versioned?', a: 'Every document upload creates a version. Replaced documents are linked to their replacement, and previous versions are retained with their status set to superseded. The current version is always clearly marked.' },
  { q: 'What should I do if a case is overdue?', a: 'Check the Case Management dashboard and filter by "Overdue". Review the case, identify the blocking step, reassign or escalate as needed, and record the reason for the delay in the case notes.' },
  { q: 'How do I access the Learning Centre again?', a: 'Click "Learning Centre" in the sidebar navigation. You can return at any time for guides, FAQs, and the operational workflow walkthrough.' },
];

interface LearningCentreProps {
  onStartOnboarding: () => void;
  onboardingCompleted: boolean;
}

export function LearningCentre({ onStartOnboarding, onboardingCompleted }: LearningCentreProps) {
  const { user, setPage } = useApp();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'workflow' | 'modules' | 'questionnaire' | 'faq'>('overview');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const role = user?.role || 'employee';
  const guide = roleGuides[role];

  const filteredFaqs = useMemo(() => {
    if (!search.trim()) return faqs;
    const q = search.toLowerCase();
    return faqs.filter((f) => f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q));
  }, [search]);

  const toggleStep = (n: number) => {
    setCompletedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(n)) next.delete(n);
      else next.add(n);
      return next;
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-display font-bold text-ink-900 flex items-center gap-2">
            <BookOpen size={20} className="text-brand-600" /> Learning Centre
          </h2>
          <p className="text-sm text-ink-500">Guides, workflow explanations, and answers to help you use STelo Health.</p>
        </div>
        <button onClick={onStartOnboarding} className="btn-primary shrink-0">
          <Compass size={16} /> {onboardingCompleted ? 'Restart Guided Tour' : 'Start Guided Tour'}
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Search guides, FAQs, and topics..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input pl-10"
        />
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 border-b border-ink-100">
        {([
          { id: 'overview', label: 'Role Guide', icon: UserCircle },
          { id: 'workflow', label: 'Operational Workflow', icon: Workflow },
          { id: 'modules', label: 'Module Reference', icon: LayoutDashboard },
          { id: 'questionnaire', label: 'Questionnaire', icon: ClipboardList },
          { id: 'faq', label: 'FAQ', icon: HelpCircle },
        ] as const).map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all ${
                active ? 'border-brand-600 text-brand-700' : 'border-transparent text-ink-500 hover:text-ink-700'
              }`}
            >
              <Icon size={16} /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* Role Guide Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-5">
          <div className="card p-6">
            <div className="flex items-start gap-4 mb-5">
              <div className="h-12 w-12 rounded-xl bg-brand-50 flex items-center justify-center shrink-0">
                <Lightbulb size={24} className="text-brand-600" />
              </div>
              <div>
                <h3 className="text-lg font-display font-bold text-ink-900">{guide.title}</h3>
                <p className="text-sm text-ink-600 mt-1">{guide.description}</p>
              </div>
            </div>
            <div className="space-y-3">
              {guide.steps.map((step, i) => {
                const done = completedSteps.has(i + 1);
                return (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-ink-50/50 hover:bg-ink-50 transition-colors">
                    <button onClick={() => toggleStep(i + 1)} className="shrink-0 mt-0.5">
                      {done ? <CheckCircle2 size={20} className="text-success-600" /> : <Circle size={20} className="text-ink-300" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-ink-400">{i + 1}</span>
                        <p className={`text-sm font-semibold ${done ? 'text-ink-400 line-through' : 'text-ink-900'}`}>{step.title}</p>
                      </div>
                      <p className="text-sm text-ink-600 mt-0.5">{step.description}</p>
                      {step.page && (
                        <button onClick={() => setPage(step.page!)} className="mt-1.5 text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1">
                          Go to {step.page} <ArrowRight size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            {completedSteps.size === guide.steps.length && (
              <div className="mt-4 p-3 bg-success-50 rounded-lg flex items-center gap-2">
                <CheckCircle2 size={16} className="text-success-600" />
                <span className="text-sm font-semibold text-success-700">You've completed all the steps for your role.</span>
              </div>
            )}
          </div>

          {/* What STelo Health Does */}
          <div className="card p-6">
            <h3 className="text-lg font-display font-bold text-ink-900 mb-3 flex items-center gap-2">
              <ShieldCheck size={18} className="text-brand-600" /> What STelo Health Does
            </h3>
            <p className="text-sm text-ink-600 leading-relaxed">
              STelo Health is an AI-enabled occupational and travel health platform that unifies workforce medical records,
              travel risk assessments, clinical appointments, and fitness certifications into one secure system. It supports
              pre-employment medicals, periodical assessments, travel and visa medicals, sickness absence management, and
              specialist referrals — all managed through a central case system with workflow tracking, document versioning,
              and a complete audit trail.
            </p>
          </div>

          {/* Confidentiality notice */}
          <div className="card p-5 bg-warning-50/50 border-warning-200">
            <div className="flex items-start gap-3">
              <Lock size={18} className="text-warning-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-ink-900">Clinical Confidentiality</h4>
                <p className="text-sm text-ink-600 mt-1">
                  Clinical questionnaire answers — including reproductive health, mental health, and infectious disease screening —
                  are confidential. Employers and HR receive only the authorised fitness outcome and relevant work restrictions,
                  never the underlying clinical answers. This is enforced by database-level role-based access controls.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Operational Workflow Tab */}
      {activeTab === 'workflow' && (
        <div className="space-y-4">
          <div className="card p-5">
            <h3 className="text-lg font-display font-bold text-ink-900 mb-1 flex items-center gap-2">
              <Workflow size={18} className="text-brand-600" /> The Complete Operational Workflow
            </h3>
            <p className="text-sm text-ink-500">
              The journey from an initial client request through to case completion. Each stage links to the relevant STelo module.
            </p>
          </div>
          {workflowStages.map((stage) => (
            <div key={stage.number} className="card p-5">
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold font-display text-sm shrink-0">
                  {stage.number}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-ink-900">{stage.title}</h4>
                  <p className="text-sm text-ink-600 mt-1">{stage.description}</p>
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    <span className="text-xs font-semibold text-ink-400 uppercase tracking-wider">Module: {stage.module}</span>
                    <span className="text-xs text-ink-400">·</span>
                    <span className="text-xs font-semibold text-ink-500">{stage.who}</span>
                    <button onClick={() => setPage(stage.page)} className="ml-auto text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1">
                      Open <ArrowRight size={12} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Module Reference Tab */}
      {activeTab === 'modules' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {moduleGuides.map((mod) => {
            const Icon = mod.icon;
            return (
              <div key={mod.page} className="card p-4 card-hover cursor-pointer" onClick={() => setPage(mod.page)}>
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-lg bg-brand-50 flex items-center justify-center shrink-0">
                    <Icon size={18} className="text-brand-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-ink-900">{mod.label}</h4>
                    <p className="text-xs text-ink-600 mt-1">{mod.description}</p>
                    <p className="text-xs text-ink-400 mt-1.5 font-semibold">{mod.who}</p>
                  </div>
                  <ChevronRight size={16} className="text-ink-300 shrink-0" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Questionnaire Tab */}
      {activeTab === 'questionnaire' && (
        <div className="space-y-5">
          <div className="card p-6">
            <h3 className="text-lg font-display font-bold text-ink-900 mb-2 flex items-center gap-2">
              <ClipboardList size={18} className="text-brand-600" /> Deployment Readiness Questionnaire
            </h3>
            <p className="text-sm text-ink-600">
              The 23-section questionnaire (A–W) covers the full health assessment for deployment readiness. It is completed by
              the employee and reviewed by an authorised clinician. The questionnaire maps to the Medicals module, and clinical
              outcomes feed into Synopsis, Certificates, and Reports.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {questionnaireSections.map((s) => (
              <div key={s.id} className="card p-3">
                <div className="flex items-center gap-2">
                  <span className="h-7 w-7 rounded-lg bg-brand-50 flex items-center justify-center text-xs font-bold text-brand-600 shrink-0">{s.id}</span>
                  <div>
                    <p className="text-sm font-semibold text-ink-900">{s.title}</p>
                    <p className="text-xs text-ink-400">{s.count} questions</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="card p-6">
            <h4 className="text-sm font-bold text-ink-900 mb-4 flex items-center gap-2">
              <CheckCircle2 size={16} className="text-brand-600" /> Five Fitness Outcomes
            </h4>
            <div className="space-y-3">
              {fitnessOutcomes.map((f) => (
                <div key={f.outcome} className="flex items-start gap-3 p-3 bg-ink-50 rounded-lg">
                  <div className="h-8 w-8 rounded-lg bg-brand-50 flex items-center justify-center shrink-0">
                    <CheckCircle2 size={16} className="text-brand-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-ink-900">{f.outcome}</p>
                    <p className="text-sm text-ink-600 mt-0.5">{f.description}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-warning-50/50 rounded-lg flex items-start gap-2 border border-warning-200">
              <Lock size={14} className="text-warning-600 shrink-0 mt-0.5" />
              <p className="text-xs text-ink-600">
                Clinical conclusions and fitness determinations are made only by an authorised clinician. The system does not
                automatically diagnose conditions or make clinical fitness decisions. Section S (Reproductive Health) answers
                are confidential clinical data and are never shared with employers or HR.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* FAQ Tab */}
      {activeTab === 'faq' && (
        <div className="space-y-3">
          {filteredFaqs.length === 0 ? (
            <div className="card p-12 text-center">
              <HelpCircle size={32} className="text-ink-300 mx-auto mb-3" />
              <p className="text-sm text-ink-500">No FAQs match your search.</p>
            </div>
          ) : (
            filteredFaqs.map((faq, i) => (
              <div key={i} className="card overflow-hidden">
                <button
                  onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                  className="w-full p-4 flex items-center justify-between gap-3 text-left hover:bg-ink-50/50 transition-colors"
                >
                  <span className="text-sm font-semibold text-ink-900">{faq.q}</span>
                  <ChevronDown size={16} className={`text-ink-400 shrink-0 transition-transform ${expandedFaq === i ? 'rotate-180' : ''}`} />
                </button>
                {expandedFaq === i && (
                  <div className="px-4 pb-4 text-sm text-ink-600 leading-relaxed">{faq.a}</div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
