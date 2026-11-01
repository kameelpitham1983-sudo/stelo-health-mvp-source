/*
# Create Visa Medical Cases tables

1. New Tables
- `visa_medical_cases`: Stores visa medical assessment cases with full workflow tracking.
  - case_reference (text, unique) — human-readable reference like VM-YYYYMMDD-NNN
  - employee_id (uuid, FK to employees) — nullable, links to employee record
  - employee_name (text) — denormalized for display
  - company_id (uuid, FK to companies) — nullable, links to company
  - company_name (text) — denormalized for display
  - destination_country (text) — destination country for visa
  - visa_category (text) — type of visa (e.g. Work Visa, Residence Visa)
  - status (text) — workflow status: Requested, Awaiting Documents, Questionnaire Pending, Appointment Booked, Tests Pending, Awaiting Clinician Review, Completed, Follow-up Required
  - requirements (jsonb) — array of requirement items (id, name, type, required) copied from country requirements at creation
  - checklist_progress (jsonb) — map of requirement ID to boolean checked status
  - appointment_id (uuid, FK to appointments) — nullable, linked appointment
  - appointment_date (date) — nullable, appointment date for display
  - provider_name (text) — provider/clinician name
  - questionnaire_status (text) — Not Started, Draft, Submitted, Under Review, Completed
  - clinician_review_notes (text) — clinician-only field, not visible to non-clinical roles
  - certificate_issued (boolean) — whether a visa medical certificate was issued
  - certificate_expiry_date (date) — nullable, certificate expiry
  - follow_up_date (date) — nullable, follow-up appointment date
  - requested_by (text) — name of requester
  - requested_at (timestamptz) — when the case was requested
  - completed_at (timestamptz) — nullable, when the case was completed
  - created_at (timestamptz)

- `visa_medical_audit_entries`: Audit trail for visa medical cases.
  - visa_case_id (uuid, FK to visa_medical_cases)
  - action (text) — description of action taken
  - actor (text) — name of person who performed the action
  - created_at (timestamptz)

2. Security
- Enable RLS on both tables.
- Grant SELECT, INSERT, UPDATE to authenticated (no DELETE for non-admins).
- SELECT: admins, providers, coordinators, and company-scoped employer/employee access.
- INSERT: admins, providers, coordinators, and employer (for own company).
- UPDATE: admins, providers, coordinators only (clinician workflow control).
- DELETE: admins only.
- Audit entries: SELECT for authenticated (same scope), INSERT for authenticated (same write scope), no UPDATE/DELETE.
*/

CREATE TABLE IF NOT EXISTS public.visa_medical_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_reference text UNIQUE NOT NULL,
  employee_id uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  employee_name text NOT NULL DEFAULT '',
  company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  company_name text NOT NULL DEFAULT '',
  destination_country text NOT NULL DEFAULT '',
  visa_category text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'Requested',
  requirements jsonb NOT NULL DEFAULT '[]'::jsonb,
  checklist_progress jsonb NOT NULL DEFAULT '{}'::jsonb,
  appointment_id uuid REFERENCES public.appointments(id) ON DELETE SET NULL,
  appointment_date date,
  provider_name text NOT NULL DEFAULT '',
  questionnaire_status text NOT NULL DEFAULT 'Not Started',
  clinician_review_notes text NOT NULL DEFAULT '',
  certificate_issued boolean NOT NULL DEFAULT false,
  certificate_expiry_date date,
  follow_up_date date,
  requested_by text NOT NULL DEFAULT '',
  requested_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.visa_medical_audit_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visa_case_id uuid NOT NULL REFERENCES public.visa_medical_cases(id) ON DELETE CASCADE,
  action text NOT NULL,
  actor text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.visa_medical_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visa_medical_audit_entries ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE ON public.visa_medical_cases TO authenticated;
GRANT SELECT, INSERT ON public.visa_medical_audit_entries TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.visa_medical_cases TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.visa_medical_audit_entries TO service_role;

-- Visa medical cases policies
DROP POLICY IF EXISTS "vm_select" ON public.visa_medical_cases;
CREATE POLICY "vm_select" ON public.visa_medical_cases FOR SELECT
  TO authenticated USING (
    public.is_stelo_admin()
    OR company_id = public.user_company_id()
    OR public.user_role() IN ('provider','coordinator')
  );

DROP POLICY IF EXISTS "vm_insert" ON public.visa_medical_cases;
CREATE POLICY "vm_insert" ON public.visa_medical_cases FOR INSERT
  TO authenticated WITH CHECK (
    public.is_stelo_admin()
    OR (public.user_role() = 'employer' AND company_id = public.user_company_id())
    OR public.user_role() IN ('provider','coordinator')
  );

DROP POLICY IF EXISTS "vm_update" ON public.visa_medical_cases;
CREATE POLICY "vm_update" ON public.visa_medical_cases FOR UPDATE
  TO authenticated
  USING (public.is_stelo_admin() OR public.user_role() IN ('provider','coordinator'))
  WITH CHECK (public.is_stelo_admin() OR public.user_role() IN ('provider','coordinator'));

DROP POLICY IF EXISTS "vm_delete" ON public.visa_medical_cases;
CREATE POLICY "vm_delete" ON public.visa_medical_cases FOR DELETE
  TO authenticated USING (public.is_stelo_admin());

-- Visa medical audit entries policies
DROP POLICY IF EXISTS "vm_audit_select" ON public.visa_medical_audit_entries;
CREATE POLICY "vm_audit_select" ON public.visa_medical_audit_entries FOR SELECT
  TO authenticated USING (
    public.is_stelo_admin()
    OR public.user_role() IN ('provider','coordinator')
    OR EXISTS (
      SELECT 1 FROM public.visa_medical_cases vc
      WHERE vc.id = visa_medical_audit_entries.visa_case_id
      AND vc.company_id = public.user_company_id()
    )
  );

DROP POLICY IF EXISTS "vm_audit_insert" ON public.visa_medical_audit_entries;
CREATE POLICY "vm_audit_insert" ON public.visa_medical_audit_entries FOR INSERT
  TO authenticated WITH CHECK (
    public.is_stelo_admin()
    OR public.user_role() IN ('provider','coordinator','employer')
  );

CREATE INDEX IF NOT EXISTS idx_visa_medical_cases_company_id ON public.visa_medical_cases(company_id);
CREATE INDEX IF NOT EXISTS idx_visa_medical_cases_employee_id ON public.visa_medical_cases(employee_id);
CREATE INDEX IF NOT EXISTS idx_visa_medical_cases_status ON public.visa_medical_cases(status);
CREATE INDEX IF NOT EXISTS idx_visa_medical_audit_visa_case_id ON public.visa_medical_audit_entries(visa_case_id);
