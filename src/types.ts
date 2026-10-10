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

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarInitials: string;
  company?: string;
  jobTitle?: string;
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
