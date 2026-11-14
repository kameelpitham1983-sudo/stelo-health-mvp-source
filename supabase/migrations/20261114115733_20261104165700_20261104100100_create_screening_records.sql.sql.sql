/*
# Screening records (corrected for approval)

- Clinical roles only: administrator, master administrator, coordinator and provider.
- Deleting an employee is blocked while screening records exist, so records are retained.
- Audit trail entries are append-only, and the screening type and employee link are fixed after creation.
- No DELETE grant or policy.
- Demo Mode records are never written here.
*/

CREATE TABLE IF NOT EXISTS public.screening_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE RESTRICT,
  company_id uuid REFERENCES public.companies(id) ON DELETE RESTRICT,
  screening_type text NOT NULL CHECK (screening_type IN ('HPV', 'Colorectal')),
  record jsonb NOT NULL DEFAULT '{}'::jsonb,
  audit_trail jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS screening_records_employee_idx ON public.screening_records (employee_id);

ALTER TABLE public.screening_records ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.screening_records FROM anon, authenticated;
GRANT SELECT, INSERT ON public.screening_records TO authenticated;
GRANT UPDATE (record, audit_trail, updated_at) ON public.screening_records TO authenticated;

DROP POLICY IF EXISTS "select_screening_records" ON public.screening_records;
CREATE POLICY "select_screening_records" ON public.screening_records FOR SELECT
  TO authenticated
  USING (public.user_role() IN ('admin', 'master_admin', 'coordinator', 'provider'));

DROP POLICY IF EXISTS "insert_screening_records" ON public.screening_records;
CREATE POLICY "insert_screening_records" ON public.screening_records FOR INSERT
  TO authenticated
  WITH CHECK (public.user_role() IN ('admin', 'master_admin', 'coordinator', 'provider'));

DROP POLICY IF EXISTS "update_screening_records" ON public.screening_records;
CREATE POLICY "update_screening_records" ON public.screening_records FOR UPDATE
  TO authenticated
  USING (public.user_role() IN ('admin', 'master_admin', 'coordinator', 'provider'))
  WITH CHECK (public.user_role() IN ('admin', 'master_admin', 'coordinator', 'provider'));

DROP TRIGGER IF EXISTS screening_records_audit_append_only ON public.screening_records;
CREATE TRIGGER screening_records_audit_append_only
  BEFORE UPDATE ON public.screening_records
  FOR EACH ROW EXECUTE FUNCTION public.enforce_audit_trail_append_only();
