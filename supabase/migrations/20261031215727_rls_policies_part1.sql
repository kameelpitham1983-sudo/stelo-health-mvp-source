/* RLS Policies Part 1: Enable RLS + grants + core table policies */

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medicals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.travel_health ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sickness_absence_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sickness_risk_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.synopses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.synopsis_meeting_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.synopsis_follow_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questionnaire_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questionnaire_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questionnaire_audit_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gop_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gop_audit_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hotels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hotel_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_step_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_audit_trail ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.record_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.digital_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.companies TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.employees TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.medicals TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.appointments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.travel_health TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.documents TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.activity_events TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sickness_absence_cases TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sickness_risk_assessments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.synopses TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.synopsis_meeting_notes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.synopsis_follow_ups TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.questionnaire_templates TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.questionnaire_instances TO authenticated;
GRANT SELECT, INSERT ON public.questionnaire_audit_entries TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.providers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gops TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.gop_invoices TO authenticated;
GRANT SELECT, INSERT ON public.gop_audit_entries TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hotels TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hotel_bookings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workflow_definitions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workflow_steps TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workflow_instances TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.workflow_step_instances TO authenticated;
GRANT SELECT, INSERT ON public.workflow_audit_trail TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.record_notes TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.digital_certificates TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;

-- PROFILES
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id OR public.is_stelo_admin());
DROP POLICY IF EXISTS "profiles_update" ON public.profiles;
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id OR public.is_stelo_admin()) WITH CHECK (auth.uid() = id OR public.is_stelo_admin());
REVOKE UPDATE ON public.profiles FROM authenticated;
GRANT UPDATE (display_name, avatar_initials, company_id, linked_employee_id) ON public.profiles TO authenticated;

-- COMPANIES
DROP POLICY IF EXISTS "companies_select" ON public.companies;
CREATE POLICY "companies_select" ON public.companies FOR SELECT TO authenticated USING (public.is_stelo_admin() OR id = public.user_company_id());
DROP POLICY IF EXISTS "companies_insert" ON public.companies;
CREATE POLICY "companies_insert" ON public.companies FOR INSERT TO authenticated WITH CHECK (public.is_stelo_admin());
DROP POLICY IF EXISTS "companies_update" ON public.companies;
CREATE POLICY "companies_update" ON public.companies FOR UPDATE TO authenticated USING (public.is_stelo_admin()) WITH CHECK (public.is_stelo_admin());
DROP POLICY IF EXISTS "companies_delete" ON public.companies;
CREATE POLICY "companies_delete" ON public.companies FOR DELETE TO authenticated USING (public.is_stelo_admin());

-- EMPLOYEES
DROP POLICY IF EXISTS "employees_select" ON public.employees;
CREATE POLICY "employees_select" ON public.employees FOR SELECT TO authenticated USING (public.is_stelo_admin() OR company_id = public.user_company_id() OR public.user_role() IN ('provider','coordinator') OR id = public.user_employee_id());
DROP POLICY IF EXISTS "employees_insert" ON public.employees;
CREATE POLICY "employees_insert" ON public.employees FOR INSERT TO authenticated WITH CHECK (public.is_stelo_admin() OR (public.user_role() = 'employer' AND company_id = public.user_company_id()) OR public.user_role() IN ('provider','coordinator'));
DROP POLICY IF EXISTS "employees_update" ON public.employees;
CREATE POLICY "employees_update" ON public.employees FOR UPDATE TO authenticated USING (public.is_stelo_admin() OR (public.user_role() = 'employer' AND company_id = public.user_company_id()) OR public.user_role() IN ('provider','coordinator')) WITH CHECK (public.is_stelo_admin() OR (public.user_role() = 'employer' AND company_id = public.user_company_id()) OR public.user_role() IN ('provider','coordinator'));
DROP POLICY IF EXISTS "employees_delete" ON public.employees;
CREATE POLICY "employees_delete" ON public.employees FOR DELETE TO authenticated USING (public.is_stelo_admin());

-- MEDICALS
DROP POLICY IF EXISTS "medicals_select" ON public.medicals;
CREATE POLICY "medicals_select" ON public.medicals FOR SELECT TO authenticated USING (public.is_stelo_admin() OR company_id = public.user_company_id() OR public.user_role() IN ('provider','coordinator') OR employee_id = public.user_employee_id());
DROP POLICY IF EXISTS "medicals_insert" ON public.medicals;
CREATE POLICY "medicals_insert" ON public.medicals FOR INSERT TO authenticated WITH CHECK (public.is_stelo_admin() OR (public.user_role() = 'employer' AND company_id = public.user_company_id()) OR public.user_role() IN ('provider','coordinator'));
DROP POLICY IF EXISTS "medicals_update" ON public.medicals;
CREATE POLICY "medicals_update" ON public.medicals FOR UPDATE TO authenticated USING (public.is_stelo_admin() OR (public.user_role() = 'employer' AND company_id = public.user_company_id()) OR public.user_role() IN ('provider','coordinator')) WITH CHECK (public.is_stelo_admin() OR (public.user_role() = 'employer' AND company_id = public.user_company_id()) OR public.user_role() IN ('provider','coordinator'));
DROP POLICY IF EXISTS "medicals_delete" ON public.medicals;
CREATE POLICY "medicals_delete" ON public.medicals FOR DELETE TO authenticated USING (public.is_stelo_admin());

-- APPOINTMENTS
DROP POLICY IF EXISTS "appointments_select" ON public.appointments;
CREATE POLICY "appointments_select" ON public.appointments FOR SELECT TO authenticated USING (public.is_stelo_admin() OR company_id = public.user_company_id() OR public.user_role() IN ('provider','coordinator'));
DROP POLICY IF EXISTS "appointments_insert" ON public.appointments;
CREATE POLICY "appointments_insert" ON public.appointments FOR INSERT TO authenticated WITH CHECK (public.is_stelo_admin() OR (public.user_role() = 'employer' AND company_id = public.user_company_id()) OR public.user_role() IN ('provider','coordinator'));
DROP POLICY IF EXISTS "appointments_update" ON public.appointments;
CREATE POLICY "appointments_update" ON public.appointments FOR UPDATE TO authenticated USING (public.is_stelo_admin() OR (public.user_role() = 'employer' AND company_id = public.user_company_id()) OR public.user_role() IN ('provider','coordinator')) WITH CHECK (public.is_stelo_admin() OR (public.user_role() = 'employer' AND company_id = public.user_company_id()) OR public.user_role() IN ('provider','coordinator'));
DROP POLICY IF EXISTS "appointments_delete" ON public.appointments;
CREATE POLICY "appointments_delete" ON public.appointments FOR DELETE TO authenticated USING (public.is_stelo_admin());

-- TRAVEL_HEALTH
DROP POLICY IF EXISTS "travel_health_select" ON public.travel_health;
CREATE POLICY "travel_health_select" ON public.travel_health FOR SELECT TO authenticated USING (public.is_stelo_admin() OR company_id = public.user_company_id() OR public.user_role() IN ('provider','coordinator'));
DROP POLICY IF EXISTS "travel_health_insert" ON public.travel_health;
CREATE POLICY "travel_health_insert" ON public.travel_health FOR INSERT TO authenticated WITH CHECK (public.is_stelo_admin() OR (public.user_role() = 'employer' AND company_id = public.user_company_id()) OR public.user_role() IN ('provider','coordinator'));
DROP POLICY IF EXISTS "travel_health_update" ON public.travel_health;
CREATE POLICY "travel_health_update" ON public.travel_health FOR UPDATE TO authenticated USING (public.is_stelo_admin() OR (public.user_role() = 'employer' AND company_id = public.user_company_id()) OR public.user_role() IN ('provider','coordinator')) WITH CHECK (public.is_stelo_admin() OR (public.user_role() = 'employer' AND company_id = public.user_company_id()) OR public.user_role() IN ('provider','coordinator'));
DROP POLICY IF EXISTS "travel_health_delete" ON public.travel_health;
CREATE POLICY "travel_health_delete" ON public.travel_health FOR DELETE TO authenticated USING (public.is_stelo_admin());

-- DOCUMENTS
DROP POLICY IF EXISTS "documents_select" ON public.documents;
CREATE POLICY "documents_select" ON public.documents FOR SELECT TO authenticated USING (public.is_stelo_admin() OR company_id = public.user_company_id() OR public.user_role() IN ('provider','coordinator'));
DROP POLICY IF EXISTS "documents_insert" ON public.documents;
CREATE POLICY "documents_insert" ON public.documents FOR INSERT TO authenticated WITH CHECK (public.is_stelo_admin() OR (public.user_role() = 'employer' AND company_id = public.user_company_id()) OR public.user_role() IN ('provider','coordinator'));
DROP POLICY IF EXISTS "documents_update" ON public.documents;
CREATE POLICY "documents_update" ON public.documents FOR UPDATE TO authenticated USING (public.is_stelo_admin() OR (public.user_role() = 'employer' AND company_id = public.user_company_id()) OR public.user_role() IN ('provider','coordinator')) WITH CHECK (public.is_stelo_admin() OR (public.user_role() = 'employer' AND company_id = public.user_company_id()) OR public.user_role() IN ('provider','coordinator'));
DROP POLICY IF EXISTS "documents_delete" ON public.documents;
CREATE POLICY "documents_delete" ON public.documents FOR DELETE TO authenticated USING (public.is_stelo_admin());

-- ACTIVITY_EVENTS
DROP POLICY IF EXISTS "activity_select" ON public.activity_events;
CREATE POLICY "activity_select" ON public.activity_events FOR SELECT TO authenticated USING (public.is_stelo_admin() OR public.user_role() IN ('employer','provider','coordinator'));
DROP POLICY IF EXISTS "activity_insert" ON public.activity_events;
CREATE POLICY "activity_insert" ON public.activity_events FOR INSERT TO authenticated WITH CHECK (public.is_stelo_admin() OR public.user_role() IN ('provider','coordinator'));
DROP POLICY IF EXISTS "activity_update" ON public.activity_events;
CREATE POLICY "activity_update" ON public.activity_events FOR UPDATE TO authenticated USING (public.is_stelo_admin());
DROP POLICY IF EXISTS "activity_delete" ON public.activity_events;
CREATE POLICY "activity_delete" ON public.activity_events FOR DELETE TO authenticated USING (public.is_stelo_admin());

-- EMPLOYER VIEWS
CREATE OR REPLACE VIEW public.medicals_employer_view WITH (security_invoker = true) AS SELECT m.* FROM public.medicals m WHERE m.company_id = public.user_company_id();
GRANT SELECT ON public.medicals_employer_view TO authenticated;
CREATE OR REPLACE VIEW public.travel_health_employer_view WITH (security_invoker = true) AS SELECT t.* FROM public.travel_health t WHERE t.company_id = public.user_company_id();
GRANT SELECT ON public.travel_health_employer_view TO authenticated;
CREATE OR REPLACE VIEW public.sickness_cases_employer_view WITH (security_invoker = true) AS SELECT s.* FROM public.sickness_absence_cases s WHERE s.company_id = public.user_company_id();
GRANT SELECT ON public.sickness_cases_employer_view TO authenticated;