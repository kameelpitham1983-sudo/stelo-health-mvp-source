/*
# Create travel_consultations table

Separate table for travel health consultations, linked to travel_health, employees,
companies, providers, appointments and medicals.

Status values: Not Scheduled, Scheduled, Completed, Post-Travel Review Required, Post-Travel Completed.

Access:
  SELECT (non-clinical) — admins (all), employers (own company), employees (own record),
            providers (own provider_id), coordinators (own company).
  SELECT (clinical)     — admins and providers (own provider_id) via get_clinical function only.
  INSERT  — admins, employers (own company), providers (own provider_id), coordinators (own company).
  UPDATE (non-clinical) — same as INSERT.
  UPDATE (clinical)     — admins and providers (own provider_id) via update_clinical function only.
  DELETE  — admins only.

Employers, employees and coordinators cannot read or write clinician_notes or post_travel_notes
through any database interface. Clinical columns have no SELECT or UPDATE grant to authenticated.
Depends on migration 20261104175000 (linked_provider_id + user_provider_id + set_user_provider_link).
*/

CREATE TABLE IF NOT EXISTS public.travel_consultations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  travel_health_id uuid REFERENCES public.travel_health(id) ON DELETE RESTRICT,
  employee_id uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  employee_name text NOT NULL DEFAULT '',
  company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  company_name text NOT NULL DEFAULT '',
  provider_id uuid REFERENCES public.providers(id) ON DELETE SET NULL,
  provider_name text NOT NULL DEFAULT '',
  purpose_of_travel text,
  consultation_date date,
  status text NOT NULL DEFAULT 'Not Scheduled',
  vaccination_plan jsonb NOT NULL DEFAULT '[]'::jsonb,
  malaria_prophylaxis boolean NOT NULL DEFAULT false,
  travel_kit_issued boolean NOT NULL DEFAULT false,
  travel_advice text NOT NULL DEFAULT '',
  clinician_notes text NOT NULL DEFAULT '',
  post_travel_review_date date,
  post_travel_notes text NOT NULL DEFAULT '',
  appointment_id uuid REFERENCES public.appointments(id) ON DELETE SET NULL,
  medical_id uuid REFERENCES public.medicals(id) ON DELETE SET NULL,
  questionnaire_status text NOT NULL DEFAULT 'Not Started',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT travel_consultations_status_check
    CHECK (status IN ('Not Scheduled','Scheduled','Completed','Post-Travel Review Required','Post-Travel Completed'))
);

CREATE INDEX IF NOT EXISTS idx_travel_consultations_travel_health_id
  ON public.travel_consultations(travel_health_id);
CREATE INDEX IF NOT EXISTS idx_travel_consultations_employee_id
  ON public.travel_consultations(employee_id);
CREATE INDEX IF NOT EXISTS idx_travel_consultations_company_id
  ON public.travel_consultations(company_id);
CREATE INDEX IF NOT EXISTS idx_travel_consultations_provider_id
  ON public.travel_consultations(provider_id);
CREATE INDEX IF NOT EXISTS idx_travel_consultations_status
  ON public.travel_consultations(status);
CREATE INDEX IF NOT EXISTS idx_travel_consultations_consultation_date
  ON public.travel_consultations(consultation_date);

ALTER TABLE public.travel_consultations ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.travel_consultations FROM anon, authenticated;

-- Column-level SELECT: non-clinical columns only. Clinical columns NOT granted to authenticated.
GRANT SELECT (
  id, travel_health_id, employee_id, employee_name, company_id, company_name,
  provider_id, provider_name, purpose_of_travel, consultation_date, status,
  vaccination_plan, malaria_prophylaxis, travel_kit_issued, travel_advice,
  post_travel_review_date, appointment_id, medical_id, questionnaire_status,
  created_at, updated_at
) ON public.travel_consultations TO authenticated;

-- INSERT needs all columns insertable (clinical columns default to '' so callers rarely set them,
-- but a provider creating a record may include initial clinical notes).
GRANT INSERT ON public.travel_consultations TO authenticated;

-- UPDATE: non-clinical columns only. Clinical columns NOT updatable through the table grant.
GRANT UPDATE (
  travel_health_id, employee_id, employee_name, company_id, company_name,
  provider_id, provider_name, purpose_of_travel, consultation_date, status,
  vaccination_plan, malaria_prophylaxis, travel_kit_issued, travel_advice,
  post_travel_review_date, appointment_id, medical_id, questionnaire_status, updated_at
) ON public.travel_consultations TO authenticated;

-- service_role bypasses RLS and has full access to all columns.
GRANT SELECT, INSERT, UPDATE, DELETE ON public.travel_consultations TO service_role;

-- RLS policies
DROP POLICY IF EXISTS "tc_select" ON public.travel_consultations;
CREATE POLICY "tc_select" ON public.travel_consultations FOR SELECT
  TO authenticated USING (
    public.is_stelo_admin()
    OR (public.user_role() = 'employer' AND company_id = public.user_company_id())
    OR (public.user_role() = 'employee' AND employee_id = public.user_employee_id())
    OR (public.user_role() = 'provider' AND provider_id = public.user_provider_id())
    OR (public.user_role() = 'coordinator' AND company_id = public.user_company_id())
  );

DROP POLICY IF EXISTS "tc_insert" ON public.travel_consultations;
CREATE POLICY "tc_insert" ON public.travel_consultations FOR INSERT
  TO authenticated WITH CHECK (
    public.is_stelo_admin()
    OR (public.user_role() = 'employer' AND company_id = public.user_company_id())
    OR (public.user_role() = 'provider' AND provider_id = public.user_provider_id())
    OR (public.user_role() = 'coordinator' AND company_id = public.user_company_id())
  );

DROP POLICY IF EXISTS "tc_update" ON public.travel_consultations;
CREATE POLICY "tc_update" ON public.travel_consultations FOR UPDATE
  TO authenticated
  USING (
    public.is_stelo_admin()
    OR (public.user_role() = 'employer' AND company_id = public.user_company_id())
    OR (public.user_role() = 'provider' AND provider_id = public.user_provider_id())
    OR (public.user_role() = 'coordinator' AND company_id = public.user_company_id())
  )
  WITH CHECK (
    public.is_stelo_admin()
    OR (public.user_role() = 'employer' AND company_id = public.user_company_id())
    OR (public.user_role() = 'provider' AND provider_id = public.user_provider_id())
    OR (public.user_role() = 'coordinator' AND company_id = public.user_company_id())
  );

DROP POLICY IF EXISTS "tc_delete" ON public.travel_consultations;
CREATE POLICY "tc_delete" ON public.travel_consultations FOR DELETE
  TO authenticated USING (public.is_stelo_admin());

-- updated_at trigger (SECURITY DEFINER with search_path, matching existing function conventions)
CREATE OR REPLACE FUNCTION public.update_travel_consultations_updated_at()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_travel_consultations_updated_at ON public.travel_consultations;
CREATE TRIGGER trg_travel_consultations_updated_at
  BEFORE UPDATE ON public.travel_consultations
  FOR EACH ROW EXECUTE FUNCTION public.update_travel_consultations_updated_at();

REVOKE EXECUTE ON FUNCTION public.update_travel_consultations_updated_at FROM PUBLIC, anon;

-- Clinical notes READ function (SECURITY DEFINER)
-- Returns clinical notes only to admins and the assigned provider.
-- Returns empty strings to unauthorised callers (no error to avoid information leakage).
CREATE OR REPLACE FUNCTION public.travel_consultations_get_clinical(p_id uuid)
RETURNS TABLE(clinician_notes text, post_travel_notes text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_stelo_admin()
     AND NOT (public.user_role() = 'provider'
              AND EXISTS (SELECT 1 FROM public.travel_consultations
                          WHERE id = p_id AND provider_id = public.user_provider_id()))
  THEN
    RETURN QUERY SELECT ''::text, ''::text;
    RETURN;
  END IF;
  RETURN QUERY
    SELECT tc.clinician_notes, tc.post_travel_notes
    FROM public.travel_consultations tc
    WHERE tc.id = p_id;
END $$;

REVOKE EXECUTE ON FUNCTION public.travel_consultations_get_clinical FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.travel_consultations_get_clinical TO authenticated;

-- Clinical notes WRITE function (SECURITY DEFINER)
-- Admins and providers (on their own consultations) only. Coordinators excluded.
CREATE OR REPLACE FUNCTION public.travel_consultations_update_clinical(
  p_id uuid,
  p_clinician_notes text DEFAULT NULL,
  p_post_travel_notes text DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_stelo_admin()
     AND NOT (public.user_role() = 'provider'
              AND EXISTS (SELECT 1 FROM public.travel_consultations
                          WHERE id = p_id AND provider_id = public.user_provider_id()))
  THEN
    RAISE EXCEPTION 'Not authorised to update clinical notes';
  END IF;
  UPDATE public.travel_consultations
  SET updated_at = now(),
      clinician_notes = COALESCE(p_clinician_notes, clinician_notes),
      post_travel_notes = COALESCE(p_post_travel_notes, post_travel_notes)
  WHERE id = p_id;
END $$;

REVOKE EXECUTE ON FUNCTION public.travel_consultations_update_clinical FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.travel_consultations_update_clinical TO authenticated;

-- Employer/employee-facing view (non-clinical columns only, security_invoker = true)
CREATE OR REPLACE VIEW public.travel_consultations_employer_view
WITH (security_invoker = true) AS
SELECT
  id, travel_health_id, employee_id, employee_name, company_id, company_name,
  provider_id, provider_name, purpose_of_travel, consultation_date, status,
  vaccination_plan, malaria_prophylaxis, travel_kit_issued, travel_advice,
  post_travel_review_date, appointment_id, medical_id, questionnaire_status,
  created_at, updated_at
FROM public.travel_consultations;

GRANT SELECT ON public.travel_consultations_employer_view TO authenticated;