/*
# Create Visa Medical Cases tables

Creates visa_medical_cases and visa_medical_audit_entries with role-based RLS.
SELECT: admins, providers, coordinators, company-scoped employer/employee.
INSERT: admins, providers, coordinators, employer (own company).
UPDATE: admins, providers, coordinators only.
DELETE: admins only.
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