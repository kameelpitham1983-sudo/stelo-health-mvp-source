/*
# Medical assessments table

Stores pre-employment, periodic and transfer medical assessment records.
Follows the same JSONB record + audit_trail pattern as screening_records.

Clinical roles only: administrator, master administrator, coordinator and provider.
Outcome recording is restricted to provider role via application-level checks.
Audit trail entries are append-only via the existing enforce_audit_trail_append_only() trigger.
No DELETE grant or policy — assessments cannot be deleted once created.
*/

CREATE TABLE IF NOT EXISTS public.medical_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE RESTRICT,
  company_id uuid REFERENCES public.companies(id) ON DELETE RESTRICT,
  assessment_type text NOT NULL CHECK (assessment_type IN ('Pre-employment', 'Periodic', 'Transfer')),
  record jsonb NOT NULL DEFAULT '{}'::jsonb,
  audit_trail jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS medical_assessments_employee_idx ON public.medical_assessments (employee_id);
CREATE INDEX IF NOT EXISTS medical_assessments_company_idx ON public.medical_assessments (company_id);

ALTER TABLE public.medical_assessments ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.medical_assessments FROM anon, authenticated;
GRANT SELECT, INSERT ON public.medical_assessments TO authenticated;
GRANT UPDATE (record, audit_trail, updated_at) ON public.medical_assessments TO authenticated;

DROP POLICY IF EXISTS "select_medical_assessments" ON public.medical_assessments;
CREATE POLICY "select_medical_assessments" ON public.medical_assessments FOR SELECT
  TO authenticated
  USING (
    public.user_role() IN ('admin', 'master_admin', 'coordinator', 'provider')
    OR (public.user_role() = 'employee' AND employee_id = public.user_employee_id())
  );

DROP POLICY IF EXISTS "insert_medical_assessments" ON public.medical_assessments;
CREATE POLICY "insert_medical_assessments" ON public.medical_assessments FOR INSERT
  TO authenticated
  WITH CHECK (public.user_role() IN ('admin', 'master_admin', 'coordinator', 'provider'));

DROP POLICY IF EXISTS "update_medical_assessments" ON public.medical_assessments;
CREATE POLICY "update_medical_assessments" ON public.medical_assessments FOR UPDATE
  TO authenticated
  USING (public.user_role() IN ('admin', 'master_admin', 'coordinator', 'provider'))
  WITH CHECK (public.user_role() IN ('admin', 'master_admin', 'coordinator', 'provider'));

DROP TRIGGER IF EXISTS medical_assessments_audit_append_only ON public.medical_assessments;
CREATE TRIGGER medical_assessments_audit_append_only
  BEFORE UPDATE ON public.medical_assessments
  FOR EACH ROW EXECUTE FUNCTION public.enforce_audit_trail_append_only();
