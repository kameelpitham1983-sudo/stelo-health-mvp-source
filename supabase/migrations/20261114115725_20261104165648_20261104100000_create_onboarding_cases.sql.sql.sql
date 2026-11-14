/*
# Onboarding cases (corrected for approval)

- Staff (administrators and coordinators) create and update onboarding cases.
- Employers can read cases for their own company only. They cannot change cases.
- A new case must be recorded as created by the signed-in user.
- Updates may only change the process fields; company and creator are fixed after creation.
- Audit trail entries are append-only: existing entries cannot be edited or removed.
- No DELETE grant or policy, so cases cannot be deleted through the app.
*/

CREATE TABLE IF NOT EXISTS public.onboarding_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE RESTRICT,
  company_name text NOT NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'case_opened')),
  closed_reason text,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  audit_trail jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_by uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_onboarding_cases_company_id ON public.onboarding_cases (company_id);

ALTER TABLE public.onboarding_cases ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.onboarding_cases FROM anon, authenticated;
GRANT SELECT ON public.onboarding_cases TO authenticated;
GRANT INSERT ON public.onboarding_cases TO authenticated;
GRANT UPDATE (status, closed_reason, data, audit_trail, updated_at) ON public.onboarding_cases TO authenticated;

DROP POLICY IF EXISTS "select_onboarding_cases" ON public.onboarding_cases;
CREATE POLICY "select_onboarding_cases" ON public.onboarding_cases FOR SELECT
  TO authenticated
  USING (
    public.is_stelo_admin()
    OR public.user_role() = 'coordinator'
    OR (public.user_role() = 'employer' AND company_id = public.user_company_id())
  );

DROP POLICY IF EXISTS "insert_onboarding_cases" ON public.onboarding_cases;
CREATE POLICY "insert_onboarding_cases" ON public.onboarding_cases FOR INSERT
  TO authenticated
  WITH CHECK (
    (public.is_stelo_admin() OR public.user_role() = 'coordinator')
    AND created_by = auth.uid()
  );

DROP POLICY IF EXISTS "update_onboarding_cases" ON public.onboarding_cases;
CREATE POLICY "update_onboarding_cases" ON public.onboarding_cases FOR UPDATE
  TO authenticated
  USING (public.is_stelo_admin() OR public.user_role() = 'coordinator')
  WITH CHECK (public.is_stelo_admin() OR public.user_role() = 'coordinator');

CREATE OR REPLACE FUNCTION public.enforce_audit_trail_append_only()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  i integer;
BEGIN
  IF jsonb_array_length(NEW.audit_trail) < jsonb_array_length(OLD.audit_trail) THEN
    RAISE EXCEPTION 'Audit trail entries cannot be removed';
  END IF;
  FOR i IN 0 .. jsonb_array_length(OLD.audit_trail) - 1 LOOP
    IF NEW.audit_trail -> i IS DISTINCT FROM OLD.audit_trail -> i THEN
      RAISE EXCEPTION 'Existing audit trail entries cannot be changed';
    END IF;
  END LOOP;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.enforce_audit_trail_append_only() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS onboarding_cases_audit_append_only ON public.onboarding_cases;
CREATE TRIGGER onboarding_cases_audit_append_only
  BEFORE UPDATE ON public.onboarding_cases
  FOR EACH ROW EXECUTE FUNCTION public.enforce_audit_trail_append_only();
