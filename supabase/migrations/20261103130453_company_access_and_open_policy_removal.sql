/*
# Coordinator company access and removal of 47 unrestricted policies

1. Coordinators can read, create and edit companies. Administrators keep full access.
2. Removes exactly the 47 policies that grant unrestricted access
   (USING true / WITH CHECK true) on companies, employees and core health tables.
   Each table keeps its role-based policies from the RLS migrations.
3. Removes anon table privileges on those 12 tables.
   Reference-data policies (questionnaire templates, workflow definitions and steps) are not touched.
*/

GRANT SELECT, INSERT, UPDATE ON public.companies TO authenticated;

DROP POLICY IF EXISTS "companies_select" ON public.companies;
CREATE POLICY "companies_select" ON public.companies FOR SELECT TO authenticated
  USING (public.is_stelo_admin() OR public.user_role() = 'coordinator' OR id = public.user_company_id());

DROP POLICY IF EXISTS "companies_insert" ON public.companies;
CREATE POLICY "companies_insert" ON public.companies FOR INSERT TO authenticated
  WITH CHECK (public.is_stelo_admin() OR public.user_role() = 'coordinator');

DROP POLICY IF EXISTS "companies_update" ON public.companies;
CREATE POLICY "companies_update" ON public.companies FOR UPDATE TO authenticated
  USING (public.is_stelo_admin() OR public.user_role() = 'coordinator')
  WITH CHECK (public.is_stelo_admin() OR public.user_role() = 'coordinator');

DROP POLICY IF EXISTS "company_select_all" ON public.companies;
DROP POLICY IF EXISTS "company_insert_all" ON public.companies;
DROP POLICY IF EXISTS "company_update_all" ON public.companies;
DROP POLICY IF EXISTS "company_delete_all" ON public.companies;

DROP POLICY IF EXISTS "employee_select_all" ON public.employees;
DROP POLICY IF EXISTS "employee_insert_all" ON public.employees;
DROP POLICY IF EXISTS "employee_update_all" ON public.employees;
DROP POLICY IF EXISTS "employee_delete_all" ON public.employees;

DROP POLICY IF EXISTS "medical_select_all" ON public.medicals;
DROP POLICY IF EXISTS "medical_insert_all" ON public.medicals;
DROP POLICY IF EXISTS "medical_update_all" ON public.medicals;
DROP POLICY IF EXISTS "medical_delete_all" ON public.medicals;

DROP POLICY IF EXISTS "appt_select_all" ON public.appointments;
DROP POLICY IF EXISTS "appt_insert_all" ON public.appointments;
DROP POLICY IF EXISTS "appt_update_all" ON public.appointments;
DROP POLICY IF EXISTS "appt_delete_all" ON public.appointments;

DROP POLICY IF EXISTS "travel_select_all" ON public.travel_health;
DROP POLICY IF EXISTS "travel_insert_all" ON public.travel_health;
DROP POLICY IF EXISTS "travel_update_all" ON public.travel_health;
DROP POLICY IF EXISTS "travel_delete_all" ON public.travel_health;

DROP POLICY IF EXISTS "doc_select_all" ON public.documents;
DROP POLICY IF EXISTS "doc_insert_all" ON public.documents;
DROP POLICY IF EXISTS "doc_update_all" ON public.documents;
DROP POLICY IF EXISTS "doc_delete_all" ON public.documents;

DROP POLICY IF EXISTS "activity_select_all" ON public.activity_events;
DROP POLICY IF EXISTS "activity_insert_all" ON public.activity_events;
DROP POLICY IF EXISTS "activity_update_all" ON public.activity_events;
DROP POLICY IF EXISTS "activity_delete_all" ON public.activity_events;

DROP POLICY IF EXISTS "sickness_select_all" ON public.sickness_absence_cases;
DROP POLICY IF EXISTS "sickness_insert_all" ON public.sickness_absence_cases;
DROP POLICY IF EXISTS "sickness_update_all" ON public.sickness_absence_cases;
DROP POLICY IF EXISTS "sickness_delete_all" ON public.sickness_absence_cases;

DROP POLICY IF EXISTS "risk_select_all" ON public.sickness_risk_assessments;
DROP POLICY IF EXISTS "risk_insert_all" ON public.sickness_risk_assessments;
DROP POLICY IF EXISTS "risk_update_all" ON public.sickness_risk_assessments;
DROP POLICY IF EXISTS "risk_delete_all" ON public.sickness_risk_assessments;

DROP POLICY IF EXISTS "synopsis_select_all" ON public.synopses;
DROP POLICY IF EXISTS "synopsis_insert_all" ON public.synopses;
DROP POLICY IF EXISTS "synopsis_update_all" ON public.synopses;
DROP POLICY IF EXISTS "synopsis_delete_all" ON public.synopses;

DROP POLICY IF EXISTS "syn_note_select_all" ON public.synopsis_meeting_notes;
DROP POLICY IF EXISTS "syn_note_insert_all" ON public.synopsis_meeting_notes;
DROP POLICY IF EXISTS "syn_note_delete_all" ON public.synopsis_meeting_notes;

DROP POLICY IF EXISTS "syn_fu_select_all" ON public.synopsis_follow_ups;
DROP POLICY IF EXISTS "syn_fu_insert_all" ON public.synopsis_follow_ups;
DROP POLICY IF EXISTS "syn_fu_update_all" ON public.synopsis_follow_ups;
DROP POLICY IF EXISTS "syn_fu_delete_all" ON public.synopsis_follow_ups;

REVOKE ALL ON public.companies, public.employees, public.medicals, public.appointments,
  public.travel_health, public.documents, public.activity_events, public.sickness_absence_cases,
  public.sickness_risk_assessments, public.synopses, public.synopsis_meeting_notes,
  public.synopsis_follow_ups FROM anon;