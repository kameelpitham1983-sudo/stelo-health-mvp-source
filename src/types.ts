export type UserRole =
  | 'admin'
  | 'employer'
  | 'provider'
  | 'employee';

export interface RoleInfo {
  id: UserRole;
  label: string;
  description: string;
}

export interface Profile {
  id: string;
  role: UserRole;
  companyId: string | null;
  linkedEmployeeId: string | null;
  displayName: string;
  avatarInitials: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarInitials: string;
  company?: string;
  jobTitle?: string;
  companyId?: string | null;
  linkedEmployeeId?: string | null;
}

export type CompanyTier = 'Enterprise' | 'Mid-Market' | 'SMB';
export type CompanyStatus = 'Active' | 'Onboarding' | 'Suspended';

export interface Company {
  id: string;
  name: string;
  industry: string;
  tier: CompanyTier;
  status: CompanyStatus;
  employeeCount: number;
  locations: number;
  primaryLocation: string;
  contractStart: string;
  contractEnd: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  logoColor: string;
}

export type EmployeeStatus = 'Active' | 'On Leave' | 'Pending Clearance' | 'Cleared';
export type HealthStatus = 'Fit' | 'Fit with Restrictions' | 'Unfit' | 'Pending Assessment';

export interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  jobTitle: string;
  companyId: string;
  companyName: string;
  department: string;
  status: EmployeeStatus;
  healthStatus: HealthStatus;
  lastMedicalDate: string;
  nextMedicalDue: string;
  travelReady: boolean;
  avatarInitials: string;
}

export type MedicalType =
  | 'Pre-Employment'
  | 'Annual Occupational'
  | 'Return to Work'
  | 'Travel Health'
  | 'Deployment Readiness'
  | 'Drug & Alcohol Screen'
  | 'Audiometry'
  | 'Spirometry'
  | 'Vision Test';

export type MedicalStatus = 'Completed' | 'Scheduled' | 'In Progress' | 'Overdue' | 'Cancelled';

export interface Medical {
  id: string;
  employeeName: string;
  employeeId: string;
  companyName: string;
  type: MedicalType;
  status: MedicalStatus;
  date: string;
  providerName: string;
  result: string;
  notes: string;
}

export type AppointmentType = 'Occupational Health' | 'Travel Vaccination' | 'Telemedicine' | 'Follow-up' | 'Pre-Employment Screening';
export type AppointmentStatus = 'Confirmed' | 'Pending' | 'Completed' | 'Cancelled' | 'No-show';
export type AppointmentMode = 'In-clinic' | 'On-site' | 'Telemedicine';

export interface Appointment {
  id: string;
  employeeName: string;
  companyName: string;
  type: AppointmentType;
  mode: AppointmentMode;
  status: AppointmentStatus;
  date: string;
  time: string;
  durationMin: number;
  providerName: string;
  location: string;
}

export type VaccineStatus = 'Complete' | 'In Progress' | 'Not Started' | 'Booster Due';

export interface TravelHealthRecord {
  id: string;
  employeeName: string;
  companyName: string;
  destination: string;
  departureDate: string;
  returnDate: string;
  riskLevel: 'Low' | 'Moderate' | 'High' | 'Very High';
  vaccines: { name: string; status: VaccineStatus }[];
  malariaProphylaxis: boolean;
  travelKitIssued: boolean;
  lastConsultation: string;
  status: 'Cleared' | 'Pending' | 'Action Required' | 'In Progress';
}

export type DocumentType = 'Medical Report' | 'Vaccination Record' | 'Travel Risk Assessment' | 'Fitness Certificate' | 'Drug Screen Result' | 'Company Contract' | 'Compliance Certificate';
export type DocumentStatus = 'Verified' | 'Pending Review' | 'Rejected' | 'Draft';

export interface DocumentRecord {
  id: string;
  name: string;
  type: DocumentType;
  status: DocumentStatus;
  companyName: string;
  employeeName?: string;
  uploadedBy: string;
  uploadedDate: string;
  fileSize: string;
  fileType: string;
  expiryDate?: string | null;
}

export interface ActivityEvent {
  id: string;
  type: 'medical' | 'appointment' | 'document' | 'travel' | 'company' | 'employee' | 'ai';
  title: string;
  description: string;
  timestamp: string;
  actor: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

// --- New types for Synopsis and Sickness Absence ---

export type SicknessCaseStatus =
  | 'Referral Received'
  | 'Initial Review'
  | 'Information Gathering'
  | 'Risk Assessment'
  | 'Case Management'
  | 'Accommodation Planning'
  | 'RTW Review'
  | 'Follow-up'
  | 'Closed';

export interface SicknessAbsenceCase {
  id: string;
  caseReference: string;
  employeeName: string;
  companyName: string;
  referralDate: string;
  referringPerson: string;
  referralTrigger: string;
  injuryOnDuty: boolean;
  incidentDate: string;
  absenceStartDate: string;
  expectedReturnDate: string;
  actualReturnDate: string | null;
  caseStatus: SicknessCaseStatus;
  jobDuties: string;
  functionalLimitations: string;
  workplaceAccommodations: string;
  caseManager: string;
  reviewDate: string | null;
  closureDate: string | null;
  closureReason: string | null;
}

export interface SicknessRiskAssessment {
  id: string;
  caseId: string;
  severity: 'Low' | 'Medium' | 'High';
  likelihood: 'Low' | 'Medium' | 'High';
  riskLevel: string;
  notes: string;
  reviewDate: string;
  responsiblePerson: string;
}

export type SynopsisStatus = 'Draft' | 'Saved' | 'Displayed';

export interface Synopsis {
  id: string;
  employeeName: string;
  employeeId: string | null;
  prompt: string;
  content: string;
  status: SynopsisStatus;
  createdBy: string;
  createdAt: string;
}

export interface SynopsisMeetingNote {
  id: string;
  synopsisId: string;
  note: string;
  createdBy: string;
  createdAt: string;
}

export interface SynopsisFollowUp {
  id: string;
  synopsisId: string;
  action: string;
  responsiblePerson: string;
  dueDate: string | null;
  completed: boolean;
}

// --- Medical Questionnaire types ---

export type QuestionnaireFieldType = 'yesno' | 'text' | 'textarea' | 'date' | 'select' | 'number' | 'multi' | 'notice';

export interface QuestionnaireField {
  id: string;
  label: string;
  type: QuestionnaireFieldType;
  required: boolean;
  options?: string[];
  placeholder?: string;
  followUpLabel?: string;
  section: string;
  dependsOn?: { field: string; value: string };
  clinicianNote?: string;
}

export interface QuestionnaireTemplate {
  id: string;
  name: string;
  description: string;
  medicalTypes: MedicalType[];
  fields: QuestionnaireField[];
}

export type QuestionnaireInstanceStatus = 'Not Started' | 'Draft' | 'Submitted' | 'Under Review' | 'Completed';

export interface QuestionnaireInstance {
  id: string;
  medicalId: string;
  templateId: string;
  templateName: string;
  employeeName: string;
  employeeId: string;
  medicalType: MedicalType;
  status: QuestionnaireInstanceStatus;
  answers: Record<string, string>;
  flaggedForReview: string[];
  clinicianComments: string;
  additionalTests: string;
  recommendations: string;
  followUpDate: string | null;
  completedBy: string;
  completedAt: string | null;
  submittedBy: string;
  submittedAt: string | null;
  reviewedBy: string;
  reviewedAt: string | null;
}

// --- Visa Medical types ---

export type VisaMedicalStatus =
  | 'Requested'
  | 'Awaiting Documents'
  | 'Questionnaire Pending'
  | 'Appointment Booked'
  | 'Tests Pending'
  | 'Awaiting Clinician Review'
  | 'Completed'
  | 'Follow-up Required';

export interface VisaRequirementItem {
  id: string;
  name: string;
  type: 'examination' | 'test' | 'document';
  required: boolean;
}

export interface VisaCountryRequirement {
  id: string;
  country: string;
  visaCategory: string;
  requirements: VisaRequirementItem[];
  validityDays: number | null;
  source: string;
  lastVerified: string;
  reviewStatus: 'Current' | 'Needs Review' | 'Unverified';
  responsibleAdmin: string;
}

export interface VisaMedicalCase {
  id: string;
  caseReference: string;
  employeeName: string;
  employeeId: string;
  companyName: string;
  destinationCountry: string;
  visaCategory: string;
  status: VisaMedicalStatus;
  requirements: VisaRequirementItem[];
  checklistProgress: Record<string, boolean>;
  appointmentId: string | null;
  appointmentDate: string | null;
  providerName: string;
  questionnaireStatus: QuestionnaireInstanceStatus;
  clinicianReviewNotes: string;
  certificateIssued: boolean;
  certificateExpiryDate: string | null;
  followUpDate: string | null;
  requestedBy: string;
  requestedAt: string;
  completedAt: string | null;
  auditTrail: VisaAuditEntry[];
}

export interface VisaAuditEntry {
  id: string;
  timestamp: string;
  action: string;
  actor: string;
}

// --- Travel Health Consultation types ---

export type TravelConsultationStatus =
  | 'Not Scheduled'
  | 'Scheduled'
  | 'Completed'
  | 'Post-Travel Review Required'
  | 'Post-Travel Completed';

export interface TravelConsultation {
  id: string;
  travelHealthRecordId: string;
  employeeName: string;
  employeeId: string;
  companyName: string;
  destination: string;
  departureDate: string;
  returnDate: string;
  purposeOfTravel: string;
  riskLevel: 'Low' | 'Moderate' | 'High' | 'Very High';
  consultationDate: string | null;
  providerName: string;
  status: TravelConsultationStatus;
  vaccinationPlan: { name: string; status: VaccineStatus }[];
  malariaProphylaxis: boolean;
  travelKitIssued: boolean;
  travelAdvice: string;
  clinicianNotes: string;
  postTravelReviewDate: string | null;
  postTravelNotes: string;
  appointmentId: string | null;
  medicalId: string | null;
  questionnaireStatus: QuestionnaireInstanceStatus;
}

// --- Guarantee of Payment (GOP) types ---

export type GOPStatus =
  | 'Draft'
  | 'Pending Approval'
  | 'Approved'
  | 'Issued'
  | 'Utilised'
  | 'Invoiced'
  | 'Paid'
  | 'Cancelled'
  | 'Expired';

export type GOPRecipientType = 'provider' | 'accommodation' | 'laboratory' | 'other';
export type GOPCurrency = 'ZAR' | 'USD' | 'EUR' | 'GBP' | 'AED' | 'KES' | 'SGD';

export interface GOPInvoice {
  id: string;
  gopId: string;
  invoiceNumber: string;
  invoiceDate: string;
  invoicedAmount: number;
  currency: GOPCurrency;
  matched: boolean;
  paymentStatus: 'Unpaid' | 'Partially Paid' | 'Paid';
  paymentDate: string | null;
  notes: string;
}

export interface GOPAuditEntry {
  id: string;
  timestamp: string;
  action: string;
  actor: string;
}

export interface GOP {
  id: string;
  gopReference: string;
  status: GOPStatus;
  recipientType: GOPRecipientType;
  recipientName: string;
  recipientId: string | null;
  recipientVerified: boolean;
  companyName: string;
  employeeName: string;
  appointmentId: string | null;
  tripId: string | null;
  serviceDescription: string;
  authorisedAmount: number;
  currency: GOPCurrency;
  validityStartDate: string;
  validityEndDate: string;
  approvedBy: string | null;
  approvedAt: string | null;
  approverRole: string | null;
  issuedBy: string;
  issuedAt: string;
  notes: string;
  exceptionApproved: boolean;
  exceptionReason: string;
  invoices: GOPInvoice[];
  auditTrail: GOPAuditEntry[];
}

// --- Hotel / Accommodation types ---

export type AccommodationCategory = 'Preferred' | 'Non-Verified' | 'Core Providers';
export type AccommodationStatus = 'Verified' | 'Unverified' | 'Suspended' | 'Inactive';

export interface HotelBooking {
  id: string;
  hotelId: string;
  hotelName: string;
  travellerName: string;
  companyName: string;
  linkedTripId: string | null;
  linkedAppointmentId: string | null;
  checkInDate: string;
  checkOutDate: string;
  guestDetails: string;
  bookingConfirmation: string;
  roomType: string;
  agreedRate: number;
  currency: GOPCurrency;
  paymentResponsibility: 'Company' | 'Employee' | 'GOP';
  linkedGOPId: string | null;
  bookingNotes: string;
  status: 'Confirmed' | 'Pending' | 'Cancelled' | 'Checked Out';
}

export interface Hotel {
  id: string;
  name: string;
  category: AccommodationCategory;
  status: AccommodationStatus;
  contactPerson: string;
  phone: string;
  email: string;
  physicalAddress: string;
  gpsCoordinates: string | null;
  area: string;
  roomTypes: string[];
  indicativeRate: number;
  currency: GOPCurrency;
  operatingDetails: string;
  bookingContact: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

// --- Provider Network types ---

export type ProviderCategory =
  | 'Occupational Health Clinic'
  | 'Mobile Occupational Health Unit'
  | 'Medical Laboratory'
  | 'General Practitioner / Specialist'
  | 'Audiometry / Spirometry / Radiology'
  | 'Vaccination / Travel Health'
  | 'Other';

export type ProviderStatus =
  | 'Unverified'
  | 'Onboarding'
  | 'Pending Verification'
  | 'Verified'
  | 'Suspended'
  | 'Inactive';

export type ProviderTier = 'Standard' | 'Preferred' | 'Not Rated';

export interface ProviderService {
  id: string;
  name: string;
  category: ProviderCategory;
}

export interface ProviderDocument {
  id: string;
  name: string;
  type: string;
  uploadedDate: string;
  expiryDate: string | null;
  verified: boolean;
}

export interface ProviderPerformanceMetric {
  id: string;
  period: string;
  appointmentsCompleted: number;
  noShowRate: number;
  averageTurnaroundDays: number;
  qualityScore: number;
  clientSatisfactionScore: number | null;
}

export interface ProviderSiteVisit {
  id: string;
  visitDate: string;
  visitedBy: string;
  findings: string;
  recommendations: string;
  outcome: 'Satisfactory' | 'Minor Issues' | 'Major Issues' | 'Failed';
  followUpRequired: boolean;
  followUpDate: string | null;
}

export interface Provider {
  id: string;
  name: string;
  providerCode: string;
  category: ProviderCategory;
  services: string[];
  status: ProviderStatus;
  tier: ProviderTier;
  contactPerson: string;
  phone: string;
  email: string;
  physicalAddress: string;
  gpsCoordinates: string | null;
  provincesServed: string[];
  townsServed: string[];
  operatingHours: string;
  bookingProcess: string;
  appointmentAvailability: string;
  indicativePricing: string;
  commercialTerms: string;
  serviceCapacity: number | null;
  mobileServiceAvailable: boolean;
  travelCharges: string;
  registrationNumber: string;
  licenceNumber: string;
  accreditationDetails: string;
  accreditationExpiryDate: string | null;
  lastVerificationDate: string | null;
  internalNotes: string;
  documents: ProviderDocument[];
  performanceMetrics: ProviderPerformanceMetric[];
  siteVisits: ProviderSiteVisit[];
  createdAt: string;
  updatedAt: string;
}
