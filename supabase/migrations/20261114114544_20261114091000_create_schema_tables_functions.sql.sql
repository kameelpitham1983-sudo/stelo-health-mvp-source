/*
# STelo Health — Schema Foundation (Tables, Functions, Triggers)

Creates ALL database tables for the platform in dependency order,
plus helper functions for RLS policies and the auth trigger.

This migration is idempotent — uses IF NOT EXISTS throughout.
Existing tables (companies, employees, medicals, appointments, etc.) 
are not modified. Only missing tables are created.

New tables: profiles, questionnaire_templates, questionnaire_instances,
questionnaire_audit_entries, providers, gops, gop_invoices,
gop_audit_entries, hotels, hotel_bookings, workflow_definitions,
workflow_steps, workflow_instances, workflow_step_instances,
workflow_audit_trail, record_notes, digital_certificates, notifications.

Helper functions: is_stelo_admin(), user_company_id(), user_role(),
user_employee_id().
Trigger: handle_new_user() on auth.users.
*/

-- ============================================================
-- PROFILES (FK -> auth.users, companies, employees)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'employee',
  company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  linked_employee_id uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  display_name text DEFAULT '',
  avatar_initials text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- HELPER FUNCTIONS (depend on profiles table)
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_stelo_admin()
RETURNS boolean LANGUAGE sql SECURITY DEFINER SET search_path = 'public' AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin');
$$;

CREATE OR REPLACE FUNCTION public.user_company_id()
RETURNS uuid LANGUAGE sql SECURITY DEFINER SET search_path = 'public' AS $$
  SELECT company_id FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.user_role()
RETURNS text LANGUAGE sql SECURITY DEFINER SET search_path = 'public' AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.user_employee_id()
RETURNS uuid LANGUAGE sql SECURITY DEFINER SET search_path = 'public' AS $$
  SELECT linked_employee_id FROM public.profiles WHERE id = auth.uid();
$$;

-- ============================================================
-- QUESTIONNAIRE ENGINE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.questionnaire_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  medical_types jsonb DEFAULT '[]',
  fields jsonb DEFAULT '[]',
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.questionnaire_instances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  medical_id uuid,
  template_id uuid REFERENCES public.questionnaire_templates(id) ON DELETE SET NULL,
  template_name text DEFAULT '',
  employee_name text DEFAULT '',
  employee_id uuid,
  medical_type text DEFAULT '',
  status text DEFAULT 'Not Started',
  answers jsonb DEFAULT '{}',
  flagged_for_review jsonb DEFAULT '[]',
  clinician_comments text DEFAULT '',
  additional_tests text DEFAULT '',
  recommendations text DEFAULT '',
  fitness_outcome text DEFAULT '',
  follow_up_date date,
  completed_by text DEFAULT '',
  completed_at timestamptz,
  submitted_by text DEFAULT '',
  submitted_at timestamptz,
  reviewed_by text DEFAULT '',
  reviewed_at timestamptz,
  updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_qi_medical_id ON public.questionnaire_instances(medical_id);
CREATE INDEX IF NOT EXISTS idx_qi_status ON public.questionnaire_instances(status);

CREATE TABLE IF NOT EXISTS public.questionnaire_audit_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id uuid,
  action text NOT NULL,
  from_status text DEFAULT '',
  to_status text DEFAULT '',
  actor text DEFAULT '',
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_qae_instance_id ON public.questionnaire_audit_entries(instance_id);

-- ============================================================
-- PROVIDERS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  provider_code text DEFAULT '',
  category text DEFAULT 'Occupational Health Clinic',
  services jsonb DEFAULT '[]',
  status text DEFAULT 'Unverified',
  tier text DEFAULT 'Not Rated',
  contact_person text DEFAULT '',
  phone text DEFAULT '',
  email text DEFAULT '',
  physical_address text DEFAULT '',
  gps_coordinates text,
  provinces_served jsonb DEFAULT '[]',
  towns_served jsonb DEFAULT '[]',
  operating_hours text DEFAULT '',
  booking_process text DEFAULT '',
  appointment_availability text DEFAULT '',
  indicative_pricing text DEFAULT '',
  commercial_terms text DEFAULT '',
  service_capacity int,
  mobile_service_available boolean DEFAULT false,
  travel_charges text DEFAULT '',
  registration_number text DEFAULT '',
  licence_number text DEFAULT '',
  accreditation_details text DEFAULT '',
  accreditation_expiry_date date,
  last_verification_date date,
  internal_notes text DEFAULT '',
  documents jsonb DEFAULT '[]',
  performance_metrics jsonb DEFAULT '[]',
  site_visits jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================
-- GOPs
-- ============================================================

CREATE TABLE IF NOT EXISTS public.gops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gop_reference text NOT NULL,
  status text DEFAULT 'Draft',
  recipient_type text DEFAULT 'provider',
  recipient_name text DEFAULT '',
  recipient_id uuid,
  recipient_verified boolean DEFAULT false,
  company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  company_name text DEFAULT '',
  employee_name text DEFAULT '',
  appointment_id uuid,
  trip_id text,
  service_description text DEFAULT '',
  authorised_amount numeric DEFAULT 0,
  currency text DEFAULT 'ZAR',
  validity_start_date date,
  validity_end_date date,
  approved_by text,
  approved_at timestamptz,
  approver_role text,
  issued_by text DEFAULT '',
  issued_at timestamptz DEFAULT now(),
  notes text DEFAULT '',
  exception_approved boolean DEFAULT false,
  exception_reason text DEFAULT '',
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_gops_company_id ON public.gops(company_id);
CREATE INDEX IF NOT EXISTS idx_gops_status ON public.gops(status);

CREATE TABLE IF NOT EXISTS public.gop_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gop_id uuid NOT NULL REFERENCES public.gops(id) ON DELETE CASCADE,
  invoice_number text DEFAULT '',
  invoice_date date,
  invoiced_amount numeric DEFAULT 0,
  currency text DEFAULT 'ZAR',
  matched boolean DEFAULT false,
  payment_status text DEFAULT 'Unpaid',
  payment_date date,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_gop_invoices_gop_id ON public.gop_invoices(gop_id);

CREATE TABLE IF NOT EXISTS public.gop_audit_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gop_id uuid NOT NULL REFERENCES public.gops(id) ON DELETE CASCADE,
  action text NOT NULL,
  actor text DEFAULT '',
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_gop_audit_gop_id ON public.gop_audit_entries(gop_id);

-- ============================================================
-- HOTELS / ACCOMMODATION
-- ============================================================

CREATE TABLE IF NOT EXISTS public.hotels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text DEFAULT 'Non-Verified',
  status text DEFAULT 'Unverified',
  contact_person text DEFAULT '',
  phone text DEFAULT '',
  email text DEFAULT '',
  physical_address text DEFAULT '',
  gps_coordinates text,
  area text DEFAULT '',
  room_types jsonb DEFAULT '[]',
  indicative_rate numeric DEFAULT 0,
  currency text DEFAULT 'ZAR',
  operating_details text DEFAULT '',
  booking_contact text DEFAULT '',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.hotel_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id uuid REFERENCES public.hotels(id) ON DELETE SET NULL,
  hotel_name text DEFAULT '',
  traveller_name text DEFAULT '',
  company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  company_name text DEFAULT '',
  linked_trip_id text,
  linked_appointment_id uuid,
  check_in_date date,
  check_out_date date,
  guest_details text DEFAULT '',
  booking_confirmation text DEFAULT '',
  room_type text DEFAULT '',
  agreed_rate numeric DEFAULT 0,
  currency text DEFAULT 'ZAR',
  payment_responsibility text DEFAULT 'Company',
  linked_gop_id uuid,
  booking_notes text DEFAULT '',
  status text DEFAULT 'Pending',
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- WORKFLOW MANAGEMENT
-- ============================================================

CREATE TABLE IF NOT EXISTS public.workflow_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text DEFAULT 'Occupational Medical',
  description text DEFAULT '',
  version int DEFAULT 1,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.workflow_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_definition_id uuid NOT NULL REFERENCES public.workflow_definitions(id) ON DELETE CASCADE,
  step_number int NOT NULL,
  step_name text NOT NULL,
  purpose text DEFAULT '',
  instructions text DEFAULT '',
  responsible_role text DEFAULT 'admin',
  required_info jsonb DEFAULT '[]',
  required_documents jsonb DEFAULT '[]',
  required_approvals jsonb DEFAULT '[]',
  system_actions jsonb DEFAULT '[]',
  completion_criteria text DEFAULT '',
  escalation_rules text DEFAULT '',
  exception_handling text DEFAULT '',
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ws_definition_id ON public.workflow_steps(workflow_definition_id);

CREATE TABLE IF NOT EXISTS public.workflow_instances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_definition_id uuid NOT NULL REFERENCES public.workflow_definitions(id) ON DELETE CASCADE,
  instance_reference text NOT NULL,
  employee_name text DEFAULT '',
  employee_id uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  company_name text DEFAULT '',
  linked_medical_id uuid,
  linked_appointment_id uuid,
  status text DEFAULT 'Not Started',
  current_step int DEFAULT 1,
  assigned_to text DEFAULT '',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_wi_company_id ON public.workflow_instances(company_id);
CREATE INDEX IF NOT EXISTS idx_wi_status ON public.workflow_instances(status);
CREATE INDEX IF NOT EXISTS idx_wi_employee_id ON public.workflow_instances(employee_id);

CREATE TABLE IF NOT EXISTS public.workflow_step_instances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_instance_id uuid NOT NULL REFERENCES public.workflow_instances(id) ON DELETE CASCADE,
  step_number int NOT NULL,
  step_name text NOT NULL,
  status text DEFAULT 'Pending',
  responsible_role text DEFAULT 'admin',
  assigned_person text DEFAULT '',
  started_at timestamptz,
  completed_at timestamptz,
  notes text DEFAULT '',
  documents jsonb DEFAULT '[]',
  approvals jsonb DEFAULT '[]',
  exception_flagged boolean DEFAULT false,
  exception_reason text DEFAULT '',
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_wsi_instance_id ON public.workflow_step_instances(workflow_instance_id);

CREATE TABLE IF NOT EXISTS public.workflow_audit_trail (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_instance_id uuid NOT NULL REFERENCES public.workflow_instances(id) ON DELETE CASCADE,
  step_number int,
  action text NOT NULL,
  actor text DEFAULT '',
  from_status text DEFAULT '',
  to_status text DEFAULT '',
  details text DEFAULT '',
  previous_hash text DEFAULT '',
  record_hash text DEFAULT '',
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_wat_instance_id ON public.workflow_audit_trail(workflow_instance_id);

-- ============================================================
-- RECORD NOTES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.record_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  record_type text NOT NULL,
  record_id uuid NOT NULL,
  note text NOT NULL,
  note_type text DEFAULT 'general',
  author_id uuid,
  author_name text DEFAULT '',
  is_confidential boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notes_record ON public.record_notes(record_type, record_id);

-- ============================================================
-- DIGITAL CERTIFICATES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.digital_certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  certificate_type text NOT NULL,
  certificate_number text UNIQUE NOT NULL,
  employee_id uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  employee_name text NOT NULL,
  company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  company_name text DEFAULT '',
  linked_medical_id uuid,
  title text NOT NULL,
  description text DEFAULT '',
  status text DEFAULT 'Active',
  issue_date date NOT NULL,
  expiry_date date,
  issued_by text DEFAULT '',
  verification_code text NOT NULL,
  qr_payload text DEFAULT '',
  metadata jsonb DEFAULT '{}',
  revoked_reason text DEFAULT '',
  revoked_at timestamptz,
  replaced_by uuid REFERENCES public.digital_certificates(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cert_employee_id ON public.digital_certificates(employee_id);
CREATE INDEX IF NOT EXISTS idx_cert_verification_code ON public.digital_certificates(verification_code);
CREATE INDEX IF NOT EXISTS idx_cert_status ON public.digital_certificates(status);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text DEFAULT '',
  type text DEFAULT 'info',
  link text DEFAULT '',
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notif_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notif_read ON public.notifications(read);

-- ============================================================
-- TRIGGERS
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_questionnaire_instance_updated_at()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_qi_updated_at ON public.questionnaire_instances;
CREATE TRIGGER trg_qi_updated_at
  BEFORE UPDATE ON public.questionnaire_instances
  FOR EACH ROW EXECUTE FUNCTION public.update_questionnaire_instance_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
DECLARE
  requested_role text;
  display_name text;
  initials text;
BEGIN
  requested_role := COALESCE(NEW.raw_user_meta_data->>'role', 'employee');
  display_name := COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1));
  initials := UPPER(LEFT(display_name, 2));

  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE role = 'admin') THEN
    INSERT INTO public.profiles (id, role, display_name, avatar_initials)
    VALUES (
      NEW.id,
      CASE WHEN requested_role IN ('admin', 'provider', 'employer', 'coordinator') THEN requested_role ELSE 'employee' END,
      display_name,
      initials
    )
    ON CONFLICT (id) DO NOTHING;
  ELSE
    INSERT INTO public.profiles (id, role, display_name, avatar_initials)
    VALUES (NEW.id, 'employee', display_name, initials)
    ON CONFLICT (id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Revoke EXECUTE on trigger functions from public
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_questionnaire_instance_updated_at() FROM PUBLIC, anon, authenticated;

-- Grant EXECUTE on helper functions
GRANT EXECUTE ON FUNCTION public.is_stelo_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_company_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_employee_id() TO authenticated;