/*
# Harden authentication and anonymous database access

1. Authentication
- New sign-ups always receive the employee role.
- Sign-up metadata cannot assign admin, master_admin, coordinator, provider, employer, lab, or any other privileged role.
- Controlled role assignment remains available through the master-admin function.

2. Profile security
- Signed-in users may update only display_name and avatar_initials on their own profile.
- Company and employee links remain administrator-controlled through controlled account-management paths.

3. Anonymous access
- Anonymous execution is revoked from all profile helper functions.
- Anonymous table and view privileges are removed because this application requires sign-in.
- Existing authenticated RLS policies are preserved.
*/

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  display_name text;
  initials text;
BEGIN
  display_name := COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1));
  initials := UPPER(LEFT(display_name, 2));

  INSERT INTO public.profiles (id, role, display_name, avatar_initials)
  VALUES (NEW.id, 'employee', display_name, initials)
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$function$;

REVOKE UPDATE ON public.profiles FROM authenticated;
GRANT UPDATE (display_name, avatar_initials) ON public.profiles TO authenticated;

REVOKE EXECUTE ON FUNCTION public.is_stelo_admin() FROM anon;
REVOKE EXECUTE ON FUNCTION public.user_company_id() FROM anon;
REVOKE EXECUTE ON FUNCTION public.user_role() FROM anon;
REVOKE EXECUTE ON FUNCTION public.user_employee_id() FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_master_admin() FROM anon;
REVOKE EXECUTE ON FUNCTION public.set_user_role(uuid, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.deactivate_user(uuid, boolean) FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

REVOKE ALL ON public.companies, public.employees, public.profiles, public.medicals, public.appointments,
  public.travel_health, public.documents, public.activity_events, public.sickness_absence_cases,
  public.sickness_risk_assessments, public.synopses, public.synopsis_meeting_notes,
  public.synopsis_follow_ups, public.questionnaire_templates, public.questionnaire_instances,
  public.questionnaire_audit_entries, public.providers, public.gops, public.gop_invoices,
  public.gop_audit_entries, public.hotels, public.hotel_bookings, public.workflow_definitions,
  public.workflow_steps, public.workflow_instances, public.workflow_step_instances,
  public.workflow_audit_trail, public.record_notes, public.digital_certificates, public.notifications,
  public.audit_log, public.document_versions, public.cases, public.case_activity,
  public.visa_medical_cases, public.visa_medical_audit_entries
FROM anon;

REVOKE ALL ON public.medicals_employer_view, public.travel_health_employer_view, public.sickness_cases_employer_view FROM anon;
