/*
# Create core occupational health tables

## Overview
Creates the primary tables needed for the Stelo Health MVP: medicals, appointments,
travel_health (with travel_vaccines), documents, activity_events, sickness_absence_cases
(with sickness_risk_assessments), synopses (with synopsis_actions), and synopsis_meeting_notes.

## New Tables

### medicals
Stores occupational medical assessment records linked to employees and companies.
- employee_id (uuid, FK to employees) — which employee
- employee_name (text) — denormalized for quick display
- company_name (text) — denormalized for quick display
- type (text) — assessment type (Pre-Employment, Annual Occupational, etc.)
- status (text) — Completed, Scheduled, In Progress, Overdue, Cancelled
- assessment_date (date) — when the assessment was/will be done
- provider_name (text) — clinician who performed it
- result (text) — outcome (Fit for duty, Fit with Restrictions, etc.)
- notes (text) — clinical notes
- created_at (timestamptz)

### appointments
Stores appointment/scheduling records.
- employee_name (text) — who the appointment is for
- company_name (text) — their employer
- type (text) — appointment type
- mode (text) — In-clinic, On-site, Telemedicine
- status (text) — Confirmed, Pending, Completed, Cancelled, No-show
- appointment_date (date)
- appointment_time (text) — HH:MM format
- duration_min (int) — duration in minutes
- provider_name (text) — clinician
- location (text) — where it takes place
- created_at (timestamptz)

### travel_health
Stores travel health assessment records.
- employee_name, company_name (text) — denormalized
- destination (text) — where they're going
- departure_date, return_date (date)
- risk_level (text) — Low, Moderate, High, Very High
- vaccines (jsonb) — array of {name, status} objects
- malaria_prophylaxis (bool)
- travel_kit_issued (bool)
- last_consultation (date)
- status (text) — Cleared, Pending, Action Required, In Progress
- created_at (timestamptz)

### documents
Stores document metadata (not file contents).
- name (text), type (text), status (text)
- company_name (text), employee_name (text, nullable)
- uploaded_by (text), uploaded_date (date)
- file_size (text), file_type (text)
- created_at (timestamptz)

### activity_events
Stores recent activity feed items.
- type (text) — medical, appointment, document, travel, company, employee, ai
- title (text), description (text)
- actor (text), created_at (timestamptz)

### sickness_absence_cases
Stores sickness absence and return-to-work case records.
- case_reference (text) — unique case ID
- employee_name (text), company_name (text)
- referral_date (date), referring_person (text)
- referral_trigger (text)
- injury_on_duty (bool) — injury vs illness
- incident_date (date) — when incident/illness started
- absence_start_date (date)
- expected_return_date (date, nullable)
- actual_return_date (date, nullable)
- case_status (text) — Referral Received, Initial Review, Information Gathering,
  Risk Assessment, Case Management, Accommodation Planning, RTW Review, Follow-up, Closed
- job_duties (text) — relevant work duties
- functional_limitations (text) — documented by clinician
- workplace_accommodations (text)
- case_manager (text)
- review_date (date, nullable)
- closure_date (date, nullable)
- closure_reason (text, nullable)
- created_at (timestamptz)

### sickness_risk_assessments
Stores risk assessment matrices for sickness absence cases.
- case_id (uuid, FK to sickness_absence_cases)
- severity (text) — Low, Medium, High
- likelihood (text) — Low, Medium, High
- risk_level (text) — resulting calculated risk level
- notes (text) — explanatory notes
- review_date (date)
- responsible_person (text)
- created_at (timestamptz)

### synopses
Stores synopsis records for morning medical meeting briefings.
- employee_name (text) — selected employee
- employee_id (uuid, nullable, FK to employees)
- prompt (text) — user's free-text prompt
- content (text) — generated/edited synopsis content
- status (text) — Draft, Saved, Displayed
- created_by (text)
- created_at (timestamptz)

### synopsis_meeting_notes
Stores meeting notes linked to a synopsis.
- synopsis_id (uuid, FK to synopses)
- note (text)
- created_by (text)
- created_at (timestamptz)

### synopsis_follow_ups
Stores follow-up actions linked to a synopsis.
- synopsis_id (uuid, FK to synopses)
- action (text) — what needs to be done
- responsible_person (text)
- due_date (date, nullable)
- completed (bool, default false)
- created_at (timestamptz)

## Security
All tables have RLS enabled with anon+authenticated CRUD access (single-tenant demo mode
matching the existing companies/employees pattern). No auth UI exists yet, so policies
allow both anon and authenticated roles.
*/

-- Medicals
CREATE TABLE IF NOT EXISTS medicals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES employees(id) ON DELETE SET NULL,
  employee_name text NOT NULL,
  company_name text NOT NULL DEFAULT '',
  type text NOT NULL DEFAULT 'Annual Occupational',
  status text NOT NULL DEFAULT 'Scheduled',
  assessment_date date,
  provider_name text NOT NULL DEFAULT '',
  result text NOT NULL DEFAULT 'Pending',
  notes text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE medicals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "medical_select_all" ON medicals;
CREATE POLICY "medical_select_all" ON medicals FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "medical_insert_all" ON medicals;
CREATE POLICY "medical_insert_all" ON medicals FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "medical_update_all" ON medicals;
CREATE POLICY "medical_update_all" ON medicals FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "medical_delete_all" ON medicals;
CREATE POLICY "medical_delete_all" ON medicals FOR DELETE TO anon, authenticated USING (true);

-- Appointments
CREATE TABLE IF NOT EXISTS appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_name text NOT NULL,
  company_name text NOT NULL DEFAULT '',
  type text NOT NULL DEFAULT 'Occupational Health',
  mode text NOT NULL DEFAULT 'In-clinic',
  status text NOT NULL DEFAULT 'Pending',
  appointment_date date,
  appointment_time text NOT NULL DEFAULT '09:00',
  duration_min int NOT NULL DEFAULT 30,
  provider_name text NOT NULL DEFAULT '',
  location text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "appt_select_all" ON appointments;
CREATE POLICY "appt_select_all" ON appointments FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "appt_insert_all" ON appointments;
CREATE POLICY "appt_insert_all" ON appointments FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "appt_update_all" ON appointments;
CREATE POLICY "appt_update_all" ON appointments FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "appt_delete_all" ON appointments;
CREATE POLICY "appt_delete_all" ON appointments FOR DELETE TO anon, authenticated USING (true);

-- Travel health
CREATE TABLE IF NOT EXISTS travel_health (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_name text NOT NULL,
  company_name text NOT NULL DEFAULT '',
  destination text NOT NULL DEFAULT '',
  departure_date date,
  return_date date,
  risk_level text NOT NULL DEFAULT 'Low',
  vaccines jsonb NOT NULL DEFAULT '[]'::jsonb,
  malaria_prophylaxis boolean NOT NULL DEFAULT false,
  travel_kit_issued boolean NOT NULL DEFAULT false,
  last_consultation date,
  status text NOT NULL DEFAULT 'Pending',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE travel_health ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "travel_select_all" ON travel_health;
CREATE POLICY "travel_select_all" ON travel_health FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "travel_insert_all" ON travel_health;
CREATE POLICY "travel_insert_all" ON travel_health FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "travel_update_all" ON travel_health;
CREATE POLICY "travel_update_all" ON travel_health FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "travel_delete_all" ON travel_health;
CREATE POLICY "travel_delete_all" ON travel_health FOR DELETE TO anon, authenticated USING (true);

-- Documents
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL DEFAULT 'Medical Report',
  status text NOT NULL DEFAULT 'Draft',
  company_name text NOT NULL DEFAULT '',
  employee_name text,
  uploaded_by text NOT NULL DEFAULT '',
  uploaded_date date,
  file_size text NOT NULL DEFAULT '',
  file_type text NOT NULL DEFAULT 'PDF',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "doc_select_all" ON documents;
CREATE POLICY "doc_select_all" ON documents FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "doc_insert_all" ON documents;
CREATE POLICY "doc_insert_all" ON documents FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "doc_update_all" ON documents;
CREATE POLICY "doc_update_all" ON documents FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "doc_delete_all" ON documents;
CREATE POLICY "doc_delete_all" ON documents FOR DELETE TO anon, authenticated USING (true);

-- Activity events
CREATE TABLE IF NOT EXISTS activity_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL DEFAULT 'medical',
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  actor text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE activity_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "activity_select_all" ON activity_events;
CREATE POLICY "activity_select_all" ON activity_events FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "activity_insert_all" ON activity_events;
CREATE POLICY "activity_insert_all" ON activity_events FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "activity_update_all" ON activity_events;
CREATE POLICY "activity_update_all" ON activity_events FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "activity_delete_all" ON activity_events;
CREATE POLICY "activity_delete_all" ON activity_events FOR DELETE TO anon, authenticated USING (true);

-- Sickness absence cases
CREATE TABLE IF NOT EXISTS sickness_absence_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_reference text NOT NULL,
  employee_name text NOT NULL,
  company_name text NOT NULL DEFAULT '',
  referral_date date,
  referring_person text NOT NULL DEFAULT '',
  referral_trigger text NOT NULL DEFAULT '',
  injury_on_duty boolean NOT NULL DEFAULT false,
  incident_date date,
  absence_start_date date,
  expected_return_date date,
  actual_return_date date,
  case_status text NOT NULL DEFAULT 'Referral Received',
  job_duties text NOT NULL DEFAULT '',
  functional_limitations text NOT NULL DEFAULT '',
  workplace_accommodations text NOT NULL DEFAULT '',
  case_manager text NOT NULL DEFAULT '',
  review_date date,
  closure_date date,
  closure_reason text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE sickness_absence_cases ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "sickness_select_all" ON sickness_absence_cases;
CREATE POLICY "sickness_select_all" ON sickness_absence_cases FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "sickness_insert_all" ON sickness_absence_cases;
CREATE POLICY "sickness_insert_all" ON sickness_absence_cases FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "sickness_update_all" ON sickness_absence_cases;
CREATE POLICY "sickness_update_all" ON sickness_absence_cases FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "sickness_delete_all" ON sickness_absence_cases;
CREATE POLICY "sickness_delete_all" ON sickness_absence_cases FOR DELETE TO anon, authenticated USING (true);

-- Sickness risk assessments
CREATE TABLE IF NOT EXISTS sickness_risk_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES sickness_absence_cases(id) ON DELETE CASCADE,
  severity text NOT NULL DEFAULT 'Low',
  likelihood text NOT NULL DEFAULT 'Low',
  risk_level text NOT NULL DEFAULT 'Low',
  notes text NOT NULL DEFAULT '',
  review_date date,
  responsible_person text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE sickness_risk_assessments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "risk_select_all" ON sickness_risk_assessments;
CREATE POLICY "risk_select_all" ON sickness_risk_assessments FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "risk_insert_all" ON sickness_risk_assessments;
CREATE POLICY "risk_insert_all" ON sickness_risk_assessments FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "risk_update_all" ON sickness_risk_assessments;
CREATE POLICY "risk_update_all" ON sickness_risk_assessments FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "risk_delete_all" ON sickness_risk_assessments;
CREATE POLICY "risk_delete_all" ON sickness_risk_assessments FOR DELETE TO anon, authenticated USING (true);

-- Synopses
CREATE TABLE IF NOT EXISTS synopses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_name text NOT NULL,
  employee_id uuid REFERENCES employees(id) ON DELETE SET NULL,
  prompt text NOT NULL DEFAULT '',
  content text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'Draft',
  created_by text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE synopses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "synopsis_select_all" ON synopses;
CREATE POLICY "synopsis_select_all" ON synopses FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "synopsis_insert_all" ON synopses;
CREATE POLICY "synopsis_insert_all" ON synopses FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "synopsis_update_all" ON synopses;
CREATE POLICY "synopsis_update_all" ON synopses FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "synopsis_delete_all" ON synopses;
CREATE POLICY "synopsis_delete_all" ON synopses FOR DELETE TO anon, authenticated USING (true);

-- Synopsis meeting notes
CREATE TABLE IF NOT EXISTS synopsis_meeting_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  synopsis_id uuid NOT NULL REFERENCES synopses(id) ON DELETE CASCADE,
  note text NOT NULL,
  created_by text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE synopsis_meeting_notes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "syn_note_select_all" ON synopsis_meeting_notes;
CREATE POLICY "syn_note_select_all" ON synopsis_meeting_notes FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "syn_note_insert_all" ON synopsis_meeting_notes;
CREATE POLICY "syn_note_insert_all" ON synopsis_meeting_notes FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "syn_note_delete_all" ON synopsis_meeting_notes;
CREATE POLICY "syn_note_delete_all" ON synopsis_meeting_notes FOR DELETE TO anon, authenticated USING (true);

-- Synopsis follow-up actions
CREATE TABLE IF NOT EXISTS synopsis_follow_ups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  synopsis_id uuid NOT NULL REFERENCES synopses(id) ON DELETE CASCADE,
  action text NOT NULL,
  responsible_person text NOT NULL DEFAULT '',
  due_date date,
  completed boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE synopsis_follow_ups ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "syn_fu_select_all" ON synopsis_follow_ups;
CREATE POLICY "syn_fu_select_all" ON synopsis_follow_ups FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "syn_fu_insert_all" ON synopsis_follow_ups;
CREATE POLICY "syn_fu_insert_all" ON synopsis_follow_ups FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "syn_fu_update_all" ON synopsis_follow_ups;
CREATE POLICY "syn_fu_update_all" ON synopsis_follow_ups FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "syn_fu_delete_all" ON synopsis_follow_ups;
CREATE POLICY "syn_fu_delete_all" ON synopsis_follow_ups FOR DELETE TO anon, authenticated USING (true);