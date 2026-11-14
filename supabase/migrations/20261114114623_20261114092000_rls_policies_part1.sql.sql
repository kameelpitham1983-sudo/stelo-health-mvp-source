/*
# RLS Policies Part 1: Enable RLS + grants + core table policies

Replaces the existing open (USING true) policies on all tables with
role-based RLS policies. Enables RLS on all new tables created by the
schema foundation migration.

Policies use helper functions: is_stelo_admin(), user_company_id(), 
user_role(), user_employee_id().

Also creates employer views (security_invoker=true) that filter by 
the authenticated user's company_id.
*/

-- Enable RLS on all tables
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

-- Grants to authenticated
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
-- Drop old open policies
DROP POLICY IF EXISTS "company_select_all" ON public.companies;
DROP POLICY IF EXISTS "company_insert_all" ON public.companies;
DROP POLICY IF EXISTS "company_update_all" ON public.companies;
DROP POLICY IF EXISTS "company_delete_all" ON public.companies;

-- EMPLOYEES
DROP POLICY IF EXISTS "employees_select" ON public.employees;
CREATE POLICY "employees_select" ON public.employees FOR SELECT TO authenticated USING (public.is_stelo_admin() OR company_id = public.user_company_id() OR public.user_role() IN ('provider','coordinator') OR id = public.user_employee_id());
DROP POLICY IF EXISTS "employees_insert" ON public.employees;
CREATE POLICY "employees_insert" ON public.employees FOR INSERT TO authenticated WITH CHECK (public.is_stelo_admin() OR (public.user_role() = 'employer' AND company_id = public.user_company_id()) OR public.user_role() IN ('provider','coordinator'));
DROP POLICY IF EXISTS "employees_update" ON public.employees;
CREATE POLICY "employees_update" ON public.employees FOR UPDATE TO authenticated USING (public.is_stelo_admin() OR (public.user_role() = 'employer' AND company_id = public.user_company_id()) OR public.user_role() IN ('provider','coordinator')) WITH CHECK (public.is_stelo_admin() OR (public.user_role() = 'employer' AND company_id = public.user_company_id()) OR public.user_role() IN ('provider','coordinator'));
DROP POLICY IF EXISTS "employees_delete" ON public.employees;
CREATE POLICY "employees_delete" ON public.employees FOR DELETE TO authenticated USING (public.is_stelo_admin());
-- Drop old open policies
DROP POLICY IF EXISTS "employee_select_all" ON public.employees;
DROP POLICY IF EXISTS "employee_insert_all" ON public.employees;
DROP POLICY IF EXISTS "employee_update_all" ON public.employees;
DROP POLICY IF EXISTS "employee_delete_all" ON public.employees;

-- MEDICALS
DROP POLICY IF EXISTS "medicals_select" ON public.medicals;
CREATE POLICY "medicals_select" ON public.medicals FOR SELECT TO authenticated USING (public.is_stelo_admin() OR company_id = public.user_company_id() OR public.user_role() IN ('provider','coordinator') OR employee_id = public.user_employee_id());
DROP POLICY IF EXISTS "medicals_insert" ON public.medicals;
CREATE POLICY "medicals_insert" ON public.medicals FOR INSERT TO authenticated WITH CHECK (public.is_stelo_admin() OR (public.user_role() = 'employer' AND company_id = public.user_company_id()) OR public.user_role() IN ('provider','coordinator'));
DROP POLICY IF EXISTS "medicals_update" ON public.medicals;
CREATE POLICY "medicals_update" ON public.medicals FOR UPDATE TO authenticated USING (public.is_stelo_admin() OR (public.user_role() = 'employer' AND company_id = public.user_company_id()) OR public.user_role() IN ('provider','coordinator')) WITH CHECK (public.is_stelo_admin() OR (public.user_role() = 'employer' AND company_id = public.user_company_id()) OR public.user_role() IN ('provider','coordinator'));
DROP POLICY IF EXISTS "medicals_delete" ON public.medicals;
CREATE POLICY "medicals_delete" ON public.medicals FOR DELETE TO authenticated USING (public.is_stelo_admin());
-- Drop old open policies
DROP POLICY IF EXISTS "medical_select_all" ON public.medicals;
DROP POLICY IF EXISTS "medical_insert_all" ON public.medicals;
DROP POLICY IF EXISTS "medical_update_all" ON public.medicals;
DROP POLICY IF EXISTS "medical_delete_all" ON public.medicals;

-- APPOINTMENTS
DROP POLICY IF EXISTS "appointments_select" ON public.appointments;
CREATE POLICY "appointments_select" ON public.appointments FOR SELECT TO authenticated USING (public.is_stelo_admin() OR company_id = public.user_company_id() OR public.user_role() IN ('provider','coordinator'));
DROP POLICY IF EXISTS "appointments_insert" ON public.appointments;
CREATE POLICY "appointments_insert" ON public.appointments FOR INSERT TO authenticated WITH CHECK (public.is_stelo_admin() OR (public.user_role() = 'employer' AND company_id = public.user_company_id()) OR public.user_role() IN ('provider','coordinator'));
DROP POLICY IF EXISTS "appointments_update" ON public.appointments;
CREATE POLICY "appointments_update" ON public.appointments FOR UPDATE TO authenticated USING (public.is_stelo_admin() OR (public.user_role() = 'employer' AND company_id = public.user_company_id()) OR public.user_role() IN ('provider','coordinator')) WITH CHECK (public.is_stelo_admin() OR (public.user_role() = 'employer' AND company_id = public.user_company_id()) OR public.user_role() IN ('provider','coordinator'));
DROP POLICY IF EXISTS "appointments_delete" ON public.appointments;
CREATE POLICY "appointments_delete" ON public.appointments FOR DELETE TO authenticated USING (public.is_stelo_admin());
-- Drop old open policies
DROP POLICY IF EXISTS "appt_select_all" ON public.appointments;
DROP POLICY IF EXISTS "appt_insert_all" ON public.appointments;
DROP POLICY IF EXISTS "appt_update_all" ON public.appointments;
DROP POLICY IF EXISTS "appt_delete_all" ON public.appointments;

-- TRAVEL_HEALTH
DROP POLICY IF EXISTS "travel_health_select" ON public.travel_health;
CREATE POLICY "travel_health_select" ON public.travel_health FOR SELECT TO authenticated USING (public.is_stelo_admin() OR company_id = public.user_company_id() OR public.user_role() IN ('provider','coordinator'));
DROP POLICY IF EXISTS "travel_health_insert" ON public.travel_health;
CREATE POLICY "travel_health_insert" ON public.travel_health FOR INSERT TO authenticated WITH CHECK (public.is_stelo_admin() OR (public.user_role() = 'employer' AND company_id = public.user_company_id()) OR public.user_role() IN ('provider','coordinator'));
DROP POLICY IF EXISTS "travel_health_update" ON public.travel_health;
CREATE POLICY "travel_health_update" ON public.travel_health FOR UPDATE TO authenticated USING (public.is_stelo_admin() OR (public.user_role() = 'employer' AND company_id = public.user_company_id()) OR public.user_role() IN ('provider','coordinator')) WITH CHECK (public.is_stelo_admin() OR (public.user_role() = 'employer' AND company_id = public.user_company_id()) OR public.user_role() IN ('provider','coordinator'));
DROP POLICY IF EXISTS "travel_health_delete" ON public.travel_health;
CREATE POLICY "travel_health_delete" ON public.travel_health FOR DELETE TO authenticated USING (public.is_stelo_admin());
-- Drop old open policies
DROP POLICY IF EXISTS "travel_select_all" ON public.travel_health;
DROP POLICY IF EXISTS "travel_insert_all" ON public.travel_health;
DROP POLICY IF EXISTS "travel_update_all" ON public.travel_health;
DROP POLICY IF EXISTS "travel_delete_all" ON public.travel_health;

-- DOCUMENTS
DROP POLICY IF EXISTS "documents_select" ON public.documents;
CREATE POLICY "documents_select" ON public.documents FOR SELECT TO authenticated USING (public.is_stelo_admin() OR company_id = public.user_company_id() OR public.user_role() IN ('provider','coordinator'));
DROP POLICY IF EXISTS "documents_insert" ON public.documents;
CREATE POLICY "documents_insert" ON public.documents FOR INSERT TO authenticated WITH CHECK (public.is_stelo_admin() OR (public.user_role() = 'employer' AND company_id = public.user_company_id()) OR public.user_role() IN ('provider','coordinator'));
DROP POLICY IF EXISTS "documents_update" ON public.documents;
CREATE POLICY "documents_update" ON public.documents FOR UPDATE TO authenticated USING (public.is_stelo_admin() OR (public.user_role() = 'employer' AND company_id = public.user_company_id()) OR public.user_role() IN ('provider','coordinator')) WITH CHECK (public.is_stelo_admin() OR (public.user_role() = 'employer' AND company_id = public.user_company_id()) OR public.user_role() IN ('provider','coordinator'));
DROP POLICY IF EXISTS "documents_delete" ON public.documents;
CREATE POLICY "documents_delete" ON public.documents FOR DELETE TO authenticated USING (public.is_stelo_admin());
-- Drop old open policies
DROP POLICY IF EXISTS "doc_select_all" ON public.documents;
DROP POLICY IF EXISTS "doc_insert_all" ON public.documents;
DROP POLICY IF EXISTS "doc_update_all" ON public.documents;
DROP POLICY IF EXISTS "doc_delete_all" ON public.documents;

-- ACTIVITY_EVENTS
DROP POLICY IF EXISTS "activity_select" ON public.activity_events;
CREATE POLICY "activity_select" ON public.activity_events FOR SELECT TO authenticated USING (public.is_stelo_admin() OR public.user_role() IN ('employer','provider','coordinator'));
DROP POLICY IF EXISTS "activity_insert" ON public.activity_events;
CREATE POLICY "activity_insert" ON public.activity_events FOR INSERT TO authenticated WITH CHECK (public.is_stelo_admin() OR public.user_role() IN ('provider','coordinator'));
DROP POLICY IF EXISTS "activity_update" ON public.activity_events;
CREATE POLICY "activity_update" ON public.activity_events FOR UPDATE TO authenticated USING (public.is_stelo_admin());
DROP POLICY IF EXISTS "activity_delete" ON public.activity_events;
CREATE POLICY "activity_delete" ON public.activity_events FOR DELETE TO authenticated USING (public.is_stelo_admin());
-- Drop old open policies
DROP POLICY IF EXISTS "activity_select_all" ON public.activity_events;
DROP POLICY IF EXISTS "activity_insert_all" ON public.activity_events;
DROP POLICY IF EXISTS "activity_update_all" ON public.activity_events;
DROP POLICY IF EXISTS "activity_delete_all" ON public.activity_events;

-- SICKNESS_ABSENCE_CASES
DROP POLICY IF EXISTS "sickness_select" ON public.sickness_absence_cases;
CREATE POLICY "sickness_select" ON public.sickness_absence_cases FOR SELECT TO authenticated USING (public.is_stelo_admin() OR company_id = public.user_company_id() OR public.user_role() IN ('provider','coordinator'));
DROP POLICY IF EXISTS "sickness_insert" ON public.sickness_absence_cases;
CREATE POLICY "sickness_insert" ON public.sickness_absence_cases FOR INSERT TO authenticated WITH CHECK (public.is_stelo_admin() OR (public.user_role() = 'employer' AND company_id = public.user_company_id()) OR public.user_role() IN ('provider','coordinator'));
DROP POLICY IF EXISTS "sickness_update" ON public.sickness_absence_cases;
CREATE POLICY "sickness_update" ON public.sickness_absence_cases FOR UPDATE TO authenticated USING (public.is_stelo_admin() OR (public.user_role() = 'employer' AND company_id = public.user_company_id()) OR public.user_role() IN ('provider','coordinator')) WITH CHECK (public.is_stelo_admin() OR (public.user_role() = 'employer' AND company_id = public.user_company_id()) OR public.user_role() IN ('provider','coordinator'));
DROP POLICY IF EXISTS "sickness_delete" ON public.sickness_absence_cases;
CREATE POLICY "sickness_delete" ON public.sickness_absence_cases FOR DELETE TO authenticated USING (public.is_stelo_admin());
-- Drop old open policies
DROP POLICY IF EXISTS "sickness_select_all" ON public.sickness_absence_cases;
DROP POLICY IF EXISTS "sickness_insert_all" ON public.sickness_absence_cases;
DROP POLICY IF EXISTS "sickness_update_all" ON public.sickness_absence_cases;
DROP POLICY IF EXISTS "sickness_delete_all" ON public.sickness_absence_cases;

-- SICKNESS_RISK_ASSESSMENTS
DROP POLICY IF EXISTS "risk_select" ON public.sickness_risk_assessments;
CREATE POLICY "risk_select" ON public.sickness_risk_assessments FOR SELECT TO authenticated USING (public.is_stelo_admin() OR public.user_role() IN ('provider','coordinator') OR EXISTS (SELECT 1 FROM public.sickness_absence_cases c WHERE c.id = sickness_risk_assessments.case_id AND c.company_id = public.user_company_id()));
DROP POLICY IF EXISTS "risk_insert" ON public.sickness_risk_assessments;
CREATE POLICY "risk_insert" ON public.sickness_risk_assessments FOR INSERT TO authenticated WITH CHECK (public.is_stelo_admin() OR public.user_role() IN ('provider','coordinator','employer'));
DROP POLICY IF EXISTS "risk_update" ON public.sickness_risk_assessments;
CREATE POLICY "risk_update" ON public.sickness_risk_assessments FOR UPDATE TO authenticated USING (public.is_stelo_admin() OR public.user_role() IN ('provider','coordinator')) WITH CHECK (public.is_stelo_admin() OR public.user_role() IN ('provider','coordinator'));
DROP POLICY IF EXISTS "risk_delete" ON public.sickness_risk_assessments;
CREATE POLICY "risk_delete" ON public.sickness_risk_assessments FOR DELETE TO authenticated USING (public.is_stelo_admin());
-- Drop old open policies
DROP POLICY IF EXISTS "risk_select_all" ON public.sickness_risk_assessments;
DROP POLICY IF EXISTS "risk_insert_all" ON public.sickness_risk_assessments;
DROP POLICY IF EXISTS "risk_update_all" ON public.sickness_risk_assessments;
DROP POLICY IF EXISTS "risk_delete_all" ON public.sickness_risk_assessments;

-- SYNOPSES (clinical: admin + provider only)
DROP POLICY IF EXISTS "synopses_select" ON public.synopses;
CREATE POLICY "synopses_select" ON public.synopses FOR SELECT TO authenticated USING (public.is_stelo_admin() OR public.user_role() = 'provider');
DROP POLICY IF EXISTS "synopses_insert" ON public.synopses;
CREATE POLICY "synopses_insert" ON public.synopses FOR INSERT TO authenticated WITH CHECK (public.is_stelo_admin() OR public.user_role() = 'provider');
DROP POLICY IF EXISTS "synopses_update" ON public.synopses;
CREATE POLICY "synopses_update" ON public.synopses FOR UPDATE TO authenticated USING (public.is_stelo_admin() OR public.user_role() = 'provider') WITH CHECK (public.is_stelo_admin() OR public.user_role() = 'provider');
DROP POLICY IF EXISTS "synopses_delete" ON public.synopses;
CREATE POLICY "synopses_delete" ON public.synopses FOR DELETE TO authenticated USING (public.is_stelo_admin());
-- Drop old open policies
DROP POLICY IF EXISTS "synopsis_select_all" ON public.synopses;
DROP POLICY IF EXISTS "synopsis_insert_all" ON public.synopses;
DROP POLICY IF EXISTS "synopsis_update_all" ON public.synopses;
DROP POLICY IF EXISTS "synopsis_delete_all" ON public.synopses;

-- SYNOPSIS_MEETING_NOTES
DROP POLICY IF EXISTS "syn_notes_select" ON public.synopsis_meeting_notes;
CREATE POLICY "syn_notes_select" ON public.synopsis_meeting_notes FOR SELECT TO authenticated USING (public.is_stelo_admin() OR public.user_role() = 'provider');
DROP POLICY IF EXISTS "syn_notes_insert" ON public.synopsis_meeting_notes;
CREATE POLICY "syn_notes_insert" ON public.synopsis_meeting_notes FOR INSERT TO authenticated WITH CHECK (public.is_stelo_admin() OR public.user_role() = 'provider');
DROP POLICY IF EXISTS "syn_notes_delete" ON public.synopsis_meeting_notes;
CREATE POLICY "syn_notes_delete" ON public.synopsis_meeting_notes FOR DELETE TO authenticated USING (public.is_stelo_admin());
-- Drop old open policies
DROP POLICY IF EXISTS "syn_note_select_all" ON public.synopsis_meeting_notes;
DROP POLICY IF EXISTS "syn_note_insert_all" ON public.synopsis_meeting_notes;
DROP POLICY IF EXISTS "syn_note_delete_all" ON public.synopsis_meeting_notes;

-- SYNOPSIS_FOLLOW_UPS
DROP POLICY IF EXISTS "syn_followups_select" ON public.synopsis_follow_ups;
CREATE POLICY "syn_followups_select" ON public.synopsis_follow_ups FOR SELECT TO authenticated USING (public.is_stelo_admin() OR public.user_role() = 'provider');
DROP POLICY IF EXISTS "syn_followups_insert" ON public.synopsis_follow_ups;
CREATE POLICY "syn_followups_insert" ON public.synopsis_follow_ups FOR INSERT TO authenticated WITH CHECK (public.is_stelo_admin() OR public.user_role() = 'provider');
DROP POLICY IF EXISTS "syn_followups_update" ON public.synopsis_follow_ups;
CREATE POLICY "syn_followups_update" ON public.synopsis_follow_ups FOR UPDATE TO authenticated USING (public.is_stelo_admin() OR public.user_role() = 'provider') WITH CHECK (public.is_stelo_admin() OR public.user_role() = 'provider');
DROP POLICY IF EXISTS "syn_followups_delete" ON public.synopsis_follow_ups;
CREATE POLICY "syn_followups_delete" ON public.synopsis_follow_ups FOR DELETE TO authenticated USING (public.is_stelo_admin());
-- Drop old open policies
DROP POLICY IF EXISTS "syn_fu_select_all" ON public.synopsis_follow_ups;
DROP POLICY IF EXISTS "syn_fu_insert_all" ON public.synopsis_follow_ups;
DROP POLICY IF EXISTS "syn_fu_update_all" ON public.synopsis_follow_ups;
DROP POLICY IF EXISTS "syn_fu_delete_all" ON public.synopsis_follow_ups;

-- EMPLOYER VIEWS
CREATE OR REPLACE VIEW public.medicals_employer_view WITH (security_invoker = true) AS SELECT m.* FROM public.medicals m WHERE m.company_id = public.user_company_id();
GRANT SELECT ON public.medicals_employer_view TO authenticated;
CREATE OR REPLACE VIEW public.travel_health_employer_view WITH (security_invoker = true) AS SELECT t.* FROM public.travel_health t WHERE t.company_id = public.user_company_id();
GRANT SELECT ON public.travel_health_employer_view TO authenticated;
CREATE OR REPLACE VIEW public.sickness_cases_employer_view WITH (security_invoker = true) AS SELECT s.* FROM public.sickness_absence_cases s WHERE s.company_id = public.user_company_id();
GRANT SELECT ON public.sickness_cases_employer_view TO authenticated;

-- Revoke anon access from all tables (this app requires sign-in)
REVOKE ALL ON public.companies, public.employees, public.profiles, public.medicals, public.appointments,
  public.travel_health, public.documents, public.activity_events, public.sickness_absence_cases,
  public.sickness_risk_assessments, public.synopses, public.synopsis_meeting_notes,
  public.synopsis_follow_ups, public.questionnaire_templates, public.questionnaire_instances,
  public.questionnaire_audit_entries, public.providers, public.gops, public.gop_invoices,
  public.gop_audit_entries, public.hotels, public.hotel_bookings, public.workflow_definitions,
  public.workflow_steps, public.workflow_instances, public.workflow_step_instances,
  public.workflow_audit_trail, public.record_notes, public.digital_certificates, public.notifications
FROM anon;
REVOKE ALL ON public.medicals_employer_view, public.travel_health_employer_view, public.sickness_cases_employer_view FROM anon;