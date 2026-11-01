import type { PageId } from '@/context/AppContext';
import type { UserRole } from '@/types';

export interface PageHelpContent {
  purpose: string;
  required: string[];
  steps: string[];
  example: string;
  nextSteps: string;
  tips?: string[];
}

const allPagesHelp: Record<string, PageHelpContent> = {
  login: {
    purpose: 'Sign in to STelo Health or create a new account. If this is your first visit, use the sign-up form to register.',
    required: ['A valid email address', 'A password of at least 6 characters', 'For sign-up: an account type (Admin, Coordinator, Provider, Employer, Employee, or Lab/Specialist)'],
    steps: [
      'Enter your email address in the email field.',
      'Enter your password in the password field. The password is masked for security.',
      'If you are new, click "Sign up" and choose an account type. The first account registered becomes the admin; subsequent sign-ups default to Employee.',
      'Click "Sign In to Stelo Health" to access the platform.',
      'If you see an error message, check your email and password and try again.',
    ],
    example: 'Email: you@company.com · Password: at least 6 characters · Account type: Employer (for sign-up)',
    nextSteps: 'After signing in, you will see the Dashboard. If this is your first login, a guided tour will appear automatically. You can revisit the Learning Centre anytime from the sidebar.',
    tips: [
      'Privileged roles (Admin, Coordinator, Provider, Employer) are only assigned if no admin exists yet. Once an admin is registered, all new sign-ups receive Employee access and must be upgraded by an administrator.',
      'Click the info icon at the top-right for help on any page.',
    ],
  },
  dashboard: {
    purpose: 'Your starting point. The Dashboard shows a platform-wide overview of activity, active cases, pending appointments, and key statistics.',
    required: [],
    steps: [
      'Review the stat cards at the top for a quick summary.',
      'Check the recent activity feed for new events.',
      'Click any card or link to navigate to the relevant module.',
    ],
    example: 'Click "Active Cases" to go to Case Management, or "Pending Appointments" to see the appointment schedule.',
    nextSteps: 'Use the Dashboard to identify what needs your attention, then navigate to the relevant module using the sidebar.',
    tips: ['The Dashboard updates in real time as new activity is logged across the platform.'],
  },
  cases: {
    purpose: 'Central hub for every operational matter. Each case links to a company, employee, workflow, appointment, medical record, provider, documents, and audit history.',
    required: ['Case type (e.g. pre-employment, travel, visa, sickness absence)', 'Company', 'Employee (if applicable)', 'Priority', 'Assigned coordinator'],
    steps: [
      'Click "Open New Case" to create a case.',
      'Select the case type, company, and employee.',
      'Set the priority and target completion date.',
      'Assign a coordinator and case owner.',
      'Click "Create Case" to generate a unique case reference.',
      'Click on any case in the list to view its full detail page.',
    ],
    example: 'Case type: Pre-Employment Medical · Company: Acme Mining · Employee: John Doe · Priority: High · Coordinator: Sarah Smith',
    nextSteps: 'After creating a case, open it to link a workflow, schedule an appointment, and track progress through to completion. The coordinator and case owner are responsible for moving the case forward.',
    tips: [
      'Use the stat cards to filter by status (New, Active, Overdue, etc.).',
      'Cases with overdue target dates are automatically flagged.',
    ],
  },
  caseDetail: {
    purpose: 'View and manage a single case in detail, including all linked records, workflow progress, documents, notes, activity timeline, and audit history.',
    required: ['At minimum, the case must already exist. Use Case Management to create one first.'],
    steps: [
      'Review the case overview section for status, priority, and assigned coordinator.',
      'Check the company and employee details.',
      'Review the linked workflow and outstanding steps.',
      'Check linked appointments and medical records.',
      'Review provider, laboratory, or specialist details.',
      'Upload or review linked documents.',
      'Add notes using the Notes panel (confidential notes are hidden from employers).',
      'Review the chronological activity timeline and audit history.',
      'Use the Edit button to update status, priority, next action, or reassign the coordinator.',
    ],
    example: 'Status: Active → Awaiting Appointment · Next Action: Book travel consultation · Next Action Due: 2026-11-05',
    nextSteps: 'Once all workflow steps are complete and the fitness outcome is recorded, update the case status to "Completed" with closure notes. The coordinator or admin is responsible for closing the case.',
  },
  workflows: {
    purpose: 'Define and track step-by-step processes for each type of medical assessment. Each workflow has ordered steps with responsible roles, required documents, and completion criteria.',
    required: ['Workflow definition name', 'Category', 'Step definitions with responsible roles'],
    steps: [
      'Browse existing workflow definitions in the list.',
      'Click a workflow to view its steps and instances.',
      'Create a new workflow definition if needed (Admin only).',
      'Link a workflow instance to a case from Case Management.',
      'Track each step from Pending through to Completed.',
      'Flag exceptions or record reasons for delays.',
    ],
    example: 'Workflow: Pre-Employment Medical · Step 1: Register employee (Coordinator) · Step 2: Schedule appointment (Coordinator) · Step 3: Conduct assessment (Provider) · Step 4: Record outcome (Provider)',
    nextSteps: 'When a workflow is linked to a case, each step is tracked automatically. Overdue steps and exceptions are flagged. Admins and coordinators can reassign tasks.',
    tips: ['Do not create duplicate workflow definitions. Reuse existing ones where possible.'],
  },
  synopsis: {
    purpose: 'Create clinical synopsis reports summarising an employee assessment, including meeting notes and follow-up actions.',
    required: ['Employee name', 'Clinical prompt or question', 'Assessment content'],
    steps: [
      'Click "New Synopsis" to create a report.',
      'Select the employee and enter the clinical prompt.',
      'Record the synopsis content.',
      'Save as Draft or mark as Displayed.',
      'Add meeting notes and follow-up actions as needed.',
    ],
    example: 'Employee: John Doe · Prompt: Deployment readiness summary for offshore assignment · Content: Fit with restrictions — no work at heights',
    nextSteps: 'The synopsis is available for review by admins and providers. Follow-up actions should be tracked and completed.',
    tips: ['Synopsis reports are clinical documents. They are only visible to Admins and Providers.'],
  },
  certificates: {
    purpose: 'Manage digital fitness certificates and employee ID cards with QR verification. Certificates are issued after a clinician records a fitness outcome.',
    required: ['Certificate type (membership, medical alert, or fitness)', 'Employee name', 'Issue date', 'Issuing authority'],
    steps: [
      'Click "Issue Certificate" to create a new certificate.',
      'Select the certificate type and employee.',
      'Enter the title, description, and validity dates.',
      'The system generates a unique certificate number and QR payload.',
      'View, verify, or revoke certificates as needed.',
      'Certificates can be replaced with a new version if information changes.',
    ],
    example: 'Type: Fitness · Employee: John Doe · Title: Fit for Offshore Deployment · Issue: 2026-11-01 · Expiry: 2027-11-01',
    nextSteps: 'The certificate is immediately available with a QR code for verification. Employers can view issued certificates for their employees. Note: issuing an ID card does NOT mean medical clearance has been given — only a fitness certificate from a clinician confirms that.',
    tips: [
      'An employee ID card confirms identity, not medical fitness. A medical fitness certificate confirms clinical clearance.',
      'Revoked certificates are retained for audit purposes.',
    ],
  },
  companies: {
    purpose: 'Manage client company records including contract details, employee counts, contact information, and operating locations.',
    required: ['Company legal name', 'Industry', 'Tier (Enterprise, Mid-Market, SMB)', 'Primary contact name and email'],
    steps: [
      'Click "Add Company" to create a new company.',
      'Enter the company name, industry, and tier.',
      'Add the primary contact, email, and phone.',
      'Set the contract start and end dates.',
      'Click save to create the company record.',
      'Click on a company to view or edit its details.',
    ],
    example: 'Name: Acme Mining (Pty) Ltd · Industry: Mining · Tier: Enterprise · Contact: HR Manager · Email: hr@acme.co.za',
    nextSteps: 'After creating a company, add its employees from the Employees page. Link cases and medical assessments to the company. The coordinator is responsible for maintaining company records.',
  },
  employees: {
    purpose: 'Manage employee records linked to companies. Track medical status, fitness outcomes, and next assessment dates.',
    required: ['First name and surname', 'Email', 'Job title', 'Company', 'Department'],
    steps: [
      'Click "Add Employee" to create a new record.',
      'Enter the employee name, email, phone, and job title.',
      'Select the company they belong to.',
      'Set the employment status and fitness outcome.',
      'Click save to create the employee record.',
      'Click on an employee to view or update their details and fitness status.',
    ],
    example: 'Name: John Doe · Email: j.doe@acme.co.za · Job: Crane Operator · Company: Acme Mining · Department: Operations',
    nextSteps: 'After creating an employee, you can schedule medical assessments, open cases, and issue certificates. The coordinator or employer is responsible for maintaining employee records.',
    tips: ['Employees can be linked to a digital ID card from the Certificates page.'],
  },
  medicals: {
    purpose: 'Track medical assessments. The 23-section Deployment Readiness Questionnaire (A–W) is completed here. Clinicians record fitness outcomes.',
    required: ['Employee name', 'Assessment type', 'Assessment date', 'Provider name'],
    steps: [
      'Click "Add Medical" to create a new assessment record.',
      'Select the employee, assessment type, and date.',
      'Assign a provider for the assessment.',
      'The employee completes the Deployment Readiness Questionnaire (if required).',
      'The provider conducts the clinical assessment.',
      'The authorised clinician records one of five fitness outcomes: Fit, Fit with restrictions, Temporarily unfit, Permanently unfit, or Requires specialist review.',
      'Results and notes are saved to the medical record.',
    ],
    example: 'Employee: John Doe · Type: Pre-Employment · Date: 2026-11-01 · Provider: Dr. Chen · Result: Fit with restrictions',
    nextSteps: 'After recording the outcome, issue a fitness certificate from the Certificates page and update the case status. The provider is responsible for the clinical decision. The coordinator communicates the authorised outcome to the employer.',
    tips: [
      'Clinical questionnaire answers are confidential. Employers see only the fitness outcome and relevant restrictions.',
      'The system never auto-generates clinical decisions. Only an authorised clinician can record a fitness outcome.',
    ],
  },
  appointments: {
    purpose: 'Schedule and track appointments with providers for medical assessments, travel consultations, and visa medicals.',
    required: ['Employee name', 'Appointment type', 'Date and time', 'Provider name', 'Mode (in-clinic, on-site, telemedicine)'],
    steps: [
      'Click "New Appointment" to schedule.',
      'Select the employee, appointment type, and mode.',
      'Choose the date, time, and duration.',
      'Assign a provider and enter the location.',
      'Click save to create the appointment.',
      'Track the appointment status from Pending through to Completed or Cancelled.',
    ],
    example: 'Employee: John Doe · Type: Travel Vaccination · Date: 2026-11-05 · Time: 09:00 · Provider: Dr. Holt · Mode: In-clinic',
    nextSteps: 'After the appointment, the provider records the assessment outcome in the Medicals module. The coordinator links the appointment to the relevant case.',
    tips: ['Link appointments to cases for complete tracking. No-shows should be recorded for audit purposes.'],
  },
  sickness: {
    purpose: 'Manage sickness absence referrals, risk assessments, return-to-work planning, and case closure.',
    required: ['Employee name', 'Company', 'Referral date', 'Referring person', 'Absence start date'],
    steps: [
      'Click "New Referral" to open a sickness absence case.',
      'Enter the employee, company, and referral details.',
      'Record whether the injury was on duty.',
      'Set the expected return date.',
      'Complete a risk assessment if needed.',
      'Track the case through statuses: Referral Received → Initial Review → Information Gathering → Risk Assessment → Case Management → RTW Review → Closed.',
      'Record the actual return date and closure reason when the case closes.',
    ],
    example: 'Employee: John Doe · Company: Acme Mining · Referral: 2026-11-01 · Absence start: 2026-10-25 · Expected return: 2026-11-15',
    nextSteps: 'The case manager monitors progress, arranges return-to-work reviews, and closes the case when the employee returns. Employers can track the status of their employees\' cases.',
    tips: ['Record workplace accommodations and functional limitations clearly. These inform the return-to-work plan.'],
  },
  travel: {
    purpose: 'Manage travel health consultations including vaccination plans, malaria prophylaxis, travel risk assessments, and post-travel reviews.',
    required: ['Employee name', 'Company', 'Destination', 'Departure and return dates', 'Risk level'],
    steps: [
      'Click "New Travel Record" to create a travel health entry.',
      'Enter the employee, destination, and travel dates.',
      'Assess the risk level (Low, Moderate, High, Very High).',
      'Record the vaccination plan and status.',
      'Note malaria prophylaxis and travel kit issuance.',
      'Schedule a travel health consultation appointment.',
      'Complete a post-travel review if required.',
    ],
    example: 'Employee: John Doe · Destination: Democratic Republic of Congo · Risk: Very High · Vaccines: Yellow Fever (complete), Typhoid (in progress) · Malaria prophylaxis: Yes',
    nextSteps: 'The provider records the travel health consultation outcome and any required follow-up. The coordinator links the travel record to the relevant case and ensures all vaccines are completed before departure.',
    tips: ['Yellow fever certificates may be a mandatory legal entry requirement for certain countries. Verify current official CDC notices before operational use.'],
  },
  visa: {
    purpose: 'Manage visa medical cases with country-specific requirements, checklists, and clinician review.',
    required: ['Employee name', 'Company', 'Destination country', 'Visa category'],
    steps: [
      'Click "New Visa Case" to create a visa medical case.',
      'Select the employee, destination country, and visa category.',
      'Review the country-specific requirements checklist.',
      'Track checklist progress for each required examination, test, and document.',
      'Schedule the visa medical appointment.',
      'The clinician completes the assessment and records the outcome.',
      'Issue the visa medical certificate if required.',
    ],
    example: 'Employee: John Doe · Country: United Kingdom · Visa: Skilled Worker · Checklist: 8/10 complete · Status: Awaiting Clinician Review',
    nextSteps: 'The coordinator ensures all requirements are met before submission. The clinician reviews and signs off. The certificate is issued and linked to the case.',
    tips: ['Visa requirements vary by country. Always verify with the destination embassy or consulate.'],
  },
  providers: {
    purpose: 'Manage the network of occupational health clinics, laboratories, and specialists. Track verification status, accreditation, and performance.',
    required: ['Provider name', 'Category', 'Contact details', 'Services offered'],
    steps: [
      'Click "Add Provider" to register a new provider.',
      'Enter the name, category, and contact information.',
      'Record services, operating hours, and booking process.',
      'Track verification status (Unverified → Onboarding → Verified).',
      'Record accreditation details and expiry dates.',
      'Monitor performance metrics and site visit outcomes.',
    ],
    example: 'Name: City Occupational Health Clinic · Category: Occupational Health Clinic · Status: Verified · Services: Pre-employment, Audiometry, Spirometry',
    nextSteps: 'Verified providers can be assigned to appointments and cases. Admins are responsible for verifying accreditation and conducting site visits.',
    tips: ['Providers with expired accreditation should be flagged and prevented from receiving new referrals until renewed.'],
  },
  gops: {
    purpose: 'Authorise and track Guarantees of Payment (GOPs) for providers and accommodation.',
    required: ['Recipient type (provider, accommodation, laboratory)', 'Recipient name', 'Authorised amount', 'Validity dates'],
    steps: [
      'Click "New GOP" to create a guarantee of payment.',
      'Select the recipient type and verify the recipient.',
      'Enter the service description and authorised amount.',
      'Set the validity start and end dates.',
      'Submit for approval (Admin or Coordinator).',
      'Once approved, the GOP is issued to the provider.',
      'Track invoices against the GOP.',
    ],
    example: 'Recipient: City Occupational Health · Amount: R5,000 ZAR · Validity: 2026-11-01 to 2026-12-01 · Service: Pre-employment medical',
    nextSteps: 'The provider submits invoices against the GOP. The admin matches invoices and records payment status. Exceptions require documented approval.',
  },
  accommodation: {
    purpose: 'Manage hotel bookings and accommodation for employees travelling for assessments.',
    required: ['Hotel name', 'Traveller name', 'Check-in and check-out dates', 'Room type'],
    steps: [
      'Click "New Booking" to create a hotel booking.',
      'Select the hotel from the network or add a new one.',
      'Enter the traveller and company details.',
      'Set the check-in and check-out dates.',
      'Record the room type and agreed rate.',
      'Link the booking to a GOP if applicable.',
    ],
    example: 'Hotel: Safari Lodge · Traveller: John Doe · Dates: 2026-11-05 to 2026-11-08 · Room: Single · Rate: R850/night',
    nextSteps: 'The coordinator confirms the booking and shares the confirmation with the employee. The booking is linked to the relevant case and GOP.',
  },
  documents: {
    purpose: 'Central document store with version history, expiry tracking, and role-based access control. Documents can be linked to companies, employees, medicals, appointments, and providers.',
    required: ['Document name', 'Document type', 'Company (if applicable)', 'Uploaded by'],
    steps: [
      'Click "Upload Document" to add a new document.',
      'Enter the document name and type.',
      'Select the linked company, employee, or medical record.',
      'Set the responsible person and expiry date if applicable.',
      'Click save to upload.',
      'If replacing an existing document, the old version is marked as superseded and a new version is created.',
      'View version history for any document.',
    ],
    example: 'Name: Pre-Employment Medical Report — John Doe · Type: Medical Report · Company: Acme Mining · Status: Verified · Version: 2',
    nextSteps: 'Documents are automatically linked to the relevant case and medical record. Expired documents are flagged for renewal. The coordinator is responsible for maintaining document records.',
    tips: [
      'Always upload the current version. Previous versions are retained for audit but marked as superseded.',
      'Set expiry dates for certificates and compliance documents to get automatic renewal alerts.',
    ],
  },
  reports: {
    purpose: 'Generate reports on assessments, outcomes, and platform activity. Reports help administrators and employers understand health assessment trends and compliance.',
    required: [],
    steps: [
      'Select the report type you want to view.',
      'Apply filters (date range, company, assessment type).',
      'Review the summary statistics and charts.',
      'Export the report if needed.',
    ],
    example: 'Report: Assessment Outcomes by Company · Period: 2026 Q3 · Company: Acme Mining · Total assessments: 45 · Fit: 38 · Fit with restrictions: 5 · Temporarily unfit: 2',
    nextSteps: 'Use reports to identify trends, plan resources, and demonstrate compliance. Employers can view reports for their own company only.',
  },
  audit: {
    purpose: 'Complete audit trail of every action on the platform, filterable by actor, record type, and action. Used for compliance and accountability.',
    required: [],
    steps: [
      'Use the filters to narrow by record type, action, or actor.',
      'Search by reference, actor name, or details.',
      'Review the chronological list of audit entries.',
      'Export the filtered results as CSV (Admin and Coordinator only).',
    ],
    example: 'Filter: Record Type = Medical · Action = update · Actor: Dr. Chen · Result: 12 entries showing fitness outcome updates',
    nextSteps: 'The audit log is read-only. Use it to investigate actions, verify compliance, and trace changes. Admins and coordinators have full access; other roles see limited entries.',
    tips: ['The audit log is tamper-proof. Every action — create, update, delete — is automatically recorded.'],
  },
  ai: {
    purpose: 'AI-assisted clinical decision support. Ask clinical questions and get AI-generated insights to support assessment and decision-making.',
    required: ['A clinical question or prompt'],
    steps: [
      'Type your clinical question in the chat input.',
      'The AI assistant provides a response based on occupational health knowledge.',
      'Review the response carefully.',
      'Use the insights to support — not replace — your clinical judgement.',
    ],
    example: 'Question: "What are the key considerations for deploying an employee with Type 2 diabetes to a remote site?" → AI provides guidance on insulin storage, glucose monitoring, and heat risk.',
    nextSteps: 'All AI output must be reviewed by an authorised clinician. The AI does not make clinical decisions. Record the final outcome in the Medicals module.',
    tips: [
      'AI output is decision support, not a clinical decision.',
      'Never rely solely on AI output for fitness determinations.',
    ],
  },
  settings: {
    purpose: 'Manage your account settings, preferences, and platform configuration.',
    required: [],
    steps: [
      'Review your profile information.',
      'Update your display name and avatar initials if needed.',
      'Review platform settings available to your role.',
    ],
    example: 'Display name: Sarah Smith · Avatar: SS · Role: Coordinator',
    nextSteps: 'Settings changes take effect immediately. Contact an administrator if you need your role or company association changed.',
  },
  learning: {
    purpose: 'The Learning Centre provides guides, the complete operational workflow, module reference, questionnaire details, and FAQs to help you use STelo Health.',
    required: [],
    steps: [
      'Use the tabs to browse Role Guide, Operational Workflow, Module Reference, Questionnaire, and FAQ.',
      'Use the search bar to find specific topics.',
      'Click "Start Guided Tour" for an interactive walkthrough of the platform.',
      'Click module links to navigate directly to any page.',
      'Mark role guide steps as complete to track your progress.',
    ],
    example: 'Search "fitness outcome" → shows FAQ about who can record fitness outcomes and the five outcome types.',
    nextSteps: 'Return to the Learning Centre anytime you need help. Click the info icon on any page for page-specific guidance.',
  },
};

const roleAdditions: Partial<Record<UserRole, Partial<Record<string, Partial<PageHelpContent>>>>> = {
  employer: {
    medicals: {
      purpose: 'View assessment statuses for your employees. You see authorised fitness outcomes and work restrictions — not confidential clinical questionnaire answers.',
      nextSteps: 'After an assessment is complete, the authorised fitness outcome is shared with you. If restrictions apply, coordinate with your coordinator to implement workplace accommodations.',
    },
    cases: {
      purpose: 'Track cases for your company employees. You can view case status and progress but cannot create or edit cases.',
      nextSteps: 'Contact your coordinator to open a new case or update an existing one.',
    },
  },
  employee: {
    medicals: {
      purpose: 'You can view your own medical assessment records. Clinical details are visible to you and your authorised clinician only.',
      nextSteps: 'If you have questions about your assessment, contact your coordinator or the provider who conducted the assessment.',
    },
    appointments: {
      purpose: 'View your upcoming medical assessment appointments. Arrive on time and bring any required documents.',
      nextSteps: 'After your appointment, the provider records the assessment. You can view your fitness certificate from the Digital Identity page.',
    },
  },
};

export function getPageHelp(page: string, role: UserRole): PageHelpContent {
  const base = allPagesHelp[page] || allPagesHelp.dashboard;
  const addition = roleAdditions[role]?.[page];
  if (!addition) return base;
  return {
    ...base,
    ...addition,
    purpose: addition.purpose || base.purpose,
    nextSteps: addition.nextSteps || base.nextSteps,
  };
}
