/* RLS Policies Part 2: Sickness, Synopses, Questionnaires, Providers, GOPs, Hotels, Workflows, Notes, Certificates, Notifications */

-- SICKNESS_ABSENCE_CASES
DROP POLICY IF EXISTS "sickness_select" ON public.sickness_absence_cases;
CREATE POLICY "sickness_select" ON public.sickness_absence_cases FOR SELECT TO authenticated USING (public.is_stelo_admin() OR company_id = public.user_company_id() OR public.user_role() IN ('provider','coordinator'));
DROP POLICY IF EXISTS "sickness_insert" ON public.sickness_absence_cases;
CREATE POLICY "sickness_insert" ON public.sickness_absence_cases FOR INSERT TO authenticated WITH CHECK (public.is_stelo_admin() OR (public.user_role() = 'employer' AND company_id = public.user_company_id()) OR public.user_role() IN ('provider','coordinator'));
DROP POLICY IF EXISTS "sickness_update" ON public.sickness_absence_cases;
CREATE POLICY "sickness_update" ON public.sickness_absence_cases FOR UPDATE TO authenticated USING (public.is_stelo_admin() OR (public.user_role() = 'employer' AND company_id = public.user_company_id()) OR public.user_role() IN ('provider','coordinator')) WITH CHECK (public.is_stelo_admin() OR (public.user_role() = 'employer' AND company_id = public.user_company_id()) OR public.user_role() IN ('provider','coordinator'));
DROP POLICY IF EXISTS "sickness_delete" ON public.sickness_absence_cases;
CREATE POLICY "sickness_delete" ON public.sickness_absence_cases FOR DELETE TO authenticated USING (public.is_stelo_admin());

-- SICKNESS_RISK_ASSESSMENTS
DROP POLICY IF EXISTS "risk_select" ON public.sickness_risk_assessments;
CREATE POLICY "risk_select" ON public.sickness_risk_assessments FOR SELECT TO authenticated USING (public.is_stelo_admin() OR public.user_role() IN ('provider','coordinator') OR EXISTS (SELECT 1 FROM public.sickness_absence_cases c WHERE c.id = sickness_risk_assessments.case_id AND c.company_id = public.user_company_id()));
DROP POLICY IF EXISTS "risk_insert" ON public.sickness_risk_assessments;
CREATE POLICY "risk_insert" ON public.sickness_risk_assessments FOR INSERT TO authenticated WITH CHECK (public.is_stelo_admin() OR public.user_role() IN ('provider','coordinator','employer'));
DROP POLICY IF EXISTS "risk_update" ON public.sickness_risk_assessments;
CREATE POLICY "risk_update" ON public.sickness_risk_assessments FOR UPDATE TO authenticated USING (public.is_stelo_admin() OR public.user_role() IN ('provider','coordinator')) WITH CHECK (public.is_stelo_admin() OR public.user_role() IN ('provider','coordinator'));
DROP POLICY IF EXISTS "risk_delete" ON public.sickness_risk_assessments;
CREATE POLICY "risk_delete" ON public.sickness_risk_assessments FOR DELETE TO authenticated USING (public.is_stelo_admin());

-- SYNOPSES (clinical: admin + provider only)
DROP POLICY IF EXISTS "synopses_select" ON public.synopses;
CREATE POLICY "synopses_select" ON public.synopses FOR SELECT TO authenticated USING (public.is_stelo_admin() OR public.user_role() = 'provider');
DROP POLICY IF EXISTS "synopses_insert" ON public.synopses;
CREATE POLICY "synopses_insert" ON public.synopses FOR INSERT TO authenticated WITH CHECK (public.is_stelo_admin() OR public.user_role() = 'provider');
DROP POLICY IF EXISTS "synopses_update" ON public.synopses;
CREATE POLICY "synopses_update" ON public.synopses FOR UPDATE TO authenticated USING (public.is_stelo_admin() OR public.user_role() = 'provider') WITH CHECK (public.is_stelo_admin() OR public.user_role() = 'provider');
DROP POLICY IF EXISTS "synopses_delete" ON public.synopses;
CREATE POLICY "synopses_delete" ON public.synopses FOR DELETE TO authenticated USING (public.is_stelo_admin());

-- SYNOPSIS_MEETING_NOTES
DROP POLICY IF EXISTS "syn_notes_select" ON public.synopsis_meeting_notes;
CREATE POLICY "syn_notes_select" ON public.synopsis_meeting_notes FOR SELECT TO authenticated USING (public.is_stelo_admin() OR public.user_role() = 'provider');
DROP POLICY IF EXISTS "syn_notes_insert" ON public.synopsis_meeting_notes;
CREATE POLICY "syn_notes_insert" ON public.synopsis_meeting_notes FOR INSERT TO authenticated WITH CHECK (public.is_stelo_admin() OR public.user_role() = 'provider');
DROP POLICY IF EXISTS "syn_notes_delete" ON public.synopsis_meeting_notes;
CREATE POLICY "syn_notes_delete" ON public.synopsis_meeting_notes FOR DELETE TO authenticated USING (public.is_stelo_admin());

-- SYNOPSIS_FOLLOW_UPS
DROP POLICY IF EXISTS "syn_followups_select" ON public.synopsis_follow_ups;
CREATE POLICY "syn_followups_select" ON public.synopsis_follow_ups FOR SELECT TO authenticated USING (public.is_stelo_admin() OR public.user_role() = 'provider');
DROP POLICY IF EXISTS "syn_followups_insert" ON public.synopsis_follow_ups;
CREATE POLICY "syn_followups_insert" ON public.synopsis_follow_ups FOR INSERT TO authenticated WITH CHECK (public.is_stelo_admin() OR public.user_role() = 'provider');
DROP POLICY IF EXISTS "syn_followups_update" ON public.synopsis_follow_ups;
CREATE POLICY "syn_followups_update" ON public.synopsis_follow_ups FOR UPDATE TO authenticated USING (public.is_stelo_admin() OR public.user_role() = 'provider') WITH CHECK (public.is_stelo_admin() OR public.user_role() = 'provider');
DROP POLICY IF EXISTS "syn_followups_delete" ON public.synopsis_follow_ups;
CREATE POLICY "syn_followups_delete" ON public.synopsis_follow_ups FOR DELETE TO authenticated USING (public.is_stelo_admin());

-- QUESTIONNAIRE_TEMPLATES
DROP POLICY IF EXISTS "qt_select" ON public.questionnaire_templates;
CREATE POLICY "qt_select" ON public.questionnaire_templates FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "qt_insert" ON public.questionnaire_templates;
CREATE POLICY "qt_insert" ON public.questionnaire_templates FOR INSERT TO authenticated WITH CHECK (public.is_stelo_admin());
DROP POLICY IF EXISTS "qt_update" ON public.questionnaire_templates;
CREATE POLICY "qt_update" ON public.questionnaire_templates FOR UPDATE TO authenticated USING (public.is_stelo_admin()) WITH CHECK (public.is_stelo_admin());

-- QUESTIONNAIRE_INSTANCES
DROP POLICY IF EXISTS "qi_select" ON public.questionnaire_instances;
CREATE POLICY "qi_select" ON public.questionnaire_instances FOR SELECT TO authenticated USING (public.is_stelo_admin() OR public.user_role() IN ('provider','coordinator','employer','employee'));
DROP POLICY IF EXISTS "qi_insert" ON public.questionnaire_instances;
CREATE POLICY "qi_insert" ON public.questionnaire_instances FOR INSERT TO authenticated WITH CHECK (public.is_stelo_admin() OR public.user_role() IN ('provider','coordinator','employer','employee'));
DROP POLICY IF EXISTS "qi_update" ON public.questionnaire_instances;
CREATE POLICY "qi_update" ON public.questionnaire_instances FOR UPDATE TO authenticated USING (public.is_stelo_admin() OR public.user_role() IN ('provider','coordinator','employer','employee')) WITH CHECK (public.is_stelo_admin() OR public.user_role() IN ('provider','coordinator','employer','employee'));

-- QUESTIONNAIRE_AUDIT_ENTRIES
DROP POLICY IF EXISTS "qae_select" ON public.questionnaire_audit_entries;
CREATE POLICY "qae_select" ON public.questionnaire_audit_entries FOR SELECT TO authenticated USING (public.is_stelo_admin() OR public.user_role() = 'provider');
DROP POLICY IF EXISTS "qae_insert" ON public.questionnaire_audit_entries;
CREATE POLICY "qae_insert" ON public.questionnaire_audit_entries FOR INSERT TO authenticated WITH CHECK (public.is_stelo_admin() OR public.user_role() IN ('provider','coordinator','employer','employee'));

-- PROVIDERS
DROP POLICY IF EXISTS "providers_select" ON public.providers;
CREATE POLICY "providers_select" ON public.providers FOR SELECT TO authenticated USING (public.is_stelo_admin() OR public.user_role() IN ('provider','employer','coordinator'));
DROP POLICY IF EXISTS "providers_insert" ON public.providers;
CREATE POLICY "providers_insert" ON public.providers FOR INSERT TO authenticated WITH CHECK (public.is_stelo_admin());
DROP POLICY IF EXISTS "providers_update" ON public.providers;
CREATE POLICY "providers_update" ON public.providers FOR UPDATE TO authenticated USING (public.is_stelo_admin() OR public.user_role() = 'provider') WITH CHECK (public.is_stelo_admin() OR public.user_role() = 'provider');
DROP POLICY IF EXISTS "providers_delete" ON public.providers;
CREATE POLICY "providers_delete" ON public.providers FOR DELETE TO authenticated USING (public.is_stelo_admin());

-- GOPS
DROP POLICY IF EXISTS "gops_select" ON public.gops;
CREATE POLICY "gops_select" ON public.gops FOR SELECT TO authenticated USING (public.is_stelo_admin() OR company_id = public.user_company_id() OR public.user_role() IN ('provider','coordinator'));
DROP POLICY IF EXISTS "gops_insert" ON public.gops;
CREATE POLICY "gops_insert" ON public.gops FOR INSERT TO authenticated WITH CHECK (public.is_stelo_admin() OR public.user_role() IN ('provider','coordinator','employer'));
DROP POLICY IF EXISTS "gops_update" ON public.gops;
CREATE POLICY "gops_update" ON public.gops FOR UPDATE TO authenticated USING (public.is_stelo_admin() OR public.user_role() IN ('provider','coordinator')) WITH CHECK (public.is_stelo_admin() OR public.user_role() IN ('provider','coordinator'));
DROP POLICY IF EXISTS "gops_delete" ON public.gops;
CREATE POLICY "gops_delete" ON public.gops FOR DELETE TO authenticated USING (public.is_stelo_admin());

-- GOP_INVOICES
DROP POLICY IF EXISTS "gop_inv_select" ON public.gop_invoices;
CREATE POLICY "gop_inv_select" ON public.gop_invoices FOR SELECT TO authenticated USING (public.is_stelo_admin() OR public.user_role() IN ('provider','coordinator'));
DROP POLICY IF EXISTS "gop_inv_insert" ON public.gop_invoices;
CREATE POLICY "gop_inv_insert" ON public.gop_invoices FOR INSERT TO authenticated WITH CHECK (public.is_stelo_admin() OR public.user_role() IN ('provider','coordinator'));
DROP POLICY IF EXISTS "gop_inv_update" ON public.gop_invoices;
CREATE POLICY "gop_inv_update" ON public.gop_invoices FOR UPDATE TO authenticated USING (public.is_stelo_admin() OR public.user_role() IN ('provider','coordinator')) WITH CHECK (public.is_stelo_admin() OR public.user_role() IN ('provider','coordinator'));

-- GOP_AUDIT_ENTRIES
DROP POLICY IF EXISTS "gop_audit_select" ON public.gop_audit_entries;
CREATE POLICY "gop_audit_select" ON public.gop_audit_entries FOR SELECT TO authenticated USING (public.is_stelo_admin() OR public.user_role() IN ('provider','coordinator'));
DROP POLICY IF EXISTS "gop_audit_insert" ON public.gop_audit_entries;
CREATE POLICY "gop_audit_insert" ON public.gop_audit_entries FOR INSERT TO authenticated WITH CHECK (public.is_stelo_admin() OR public.user_role() IN ('provider','coordinator'));

-- HOTELS
DROP POLICY IF EXISTS "hotels_select" ON public.hotels;
CREATE POLICY "hotels_select" ON public.hotels FOR SELECT TO authenticated USING (public.is_stelo_admin() OR public.user_role() IN ('provider','coordinator','employer'));
DROP POLICY IF EXISTS "hotels_insert" ON public.hotels;
CREATE POLICY "hotels_insert" ON public.hotels FOR INSERT TO authenticated WITH CHECK (public.is_stelo_admin() OR public.user_role() = 'coordinator');
DROP POLICY IF EXISTS "hotels_update" ON public.hotels;
CREATE POLICY "hotels_update" ON public.hotels FOR UPDATE TO authenticated USING (public.is_stelo_admin() OR public.user_role() = 'coordinator') WITH CHECK (public.is_stelo_admin() OR public.user_role() = 'coordinator');
DROP POLICY IF EXISTS "hotels_delete" ON public.hotels;
CREATE POLICY "hotels_delete" ON public.hotels FOR DELETE TO authenticated USING (public.is_stelo_admin());

-- HOTEL_BOOKINGS
DROP POLICY IF EXISTS "hb_select" ON public.hotel_bookings;
CREATE POLICY "hb_select" ON public.hotel_bookings FOR SELECT TO authenticated USING (public.is_stelo_admin() OR company_id = public.user_company_id() OR public.user_role() IN ('provider','coordinator'));
DROP POLICY IF EXISTS "hb_insert" ON public.hotel_bookings;
CREATE POLICY "hb_insert" ON public.hotel_bookings FOR INSERT TO authenticated WITH CHECK (public.is_stelo_admin() OR public.user_role() IN ('coordinator','provider'));
DROP POLICY IF EXISTS "hb_update" ON public.hotel_bookings;
CREATE POLICY "hb_update" ON public.hotel_bookings FOR UPDATE TO authenticated USING (public.is_stelo_admin() OR public.user_role() IN ('coordinator','provider')) WITH CHECK (public.is_stelo_admin() OR public.user_role() IN ('coordinator','provider'));
DROP POLICY IF EXISTS "hb_delete" ON public.hotel_bookings;
CREATE POLICY "hb_delete" ON public.hotel_bookings FOR DELETE TO authenticated USING (public.is_stelo_admin());

-- WORKFLOW_DEFINITIONS
DROP POLICY IF EXISTS "wf_def_select" ON public.workflow_definitions;
CREATE POLICY "wf_def_select" ON public.workflow_definitions FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "wf_def_insert" ON public.workflow_definitions;
CREATE POLICY "wf_def_insert" ON public.workflow_definitions FOR INSERT TO authenticated WITH CHECK (public.is_stelo_admin());
DROP POLICY IF EXISTS "wf_def_update" ON public.workflow_definitions;
CREATE POLICY "wf_def_update" ON public.workflow_definitions FOR UPDATE TO authenticated USING (public.is_stelo_admin()) WITH CHECK (public.is_stelo_admin());
DROP POLICY IF EXISTS "wf_def_delete" ON public.workflow_definitions;
CREATE POLICY "wf_def_delete" ON public.workflow_definitions FOR DELETE TO authenticated USING (public.is_stelo_admin());

-- WORKFLOW_STEPS
DROP POLICY IF EXISTS "wf_steps_select" ON public.workflow_steps;
CREATE POLICY "wf_steps_select" ON public.workflow_steps FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "wf_steps_insert" ON public.workflow_steps;
CREATE POLICY "wf_steps_insert" ON public.workflow_steps FOR INSERT TO authenticated WITH CHECK (public.is_stelo_admin());
DROP POLICY IF EXISTS "wf_steps_update" ON public.workflow_steps;
CREATE POLICY "wf_steps_update" ON public.workflow_steps FOR UPDATE TO authenticated USING (public.is_stelo_admin()) WITH CHECK (public.is_stelo_admin());
DROP POLICY IF EXISTS "wf_steps_delete" ON public.workflow_steps;
CREATE POLICY "wf_steps_delete" ON public.workflow_steps FOR DELETE TO authenticated USING (public.is_stelo_admin());

-- WORKFLOW_INSTANCES
DROP POLICY IF EXISTS "wf_inst_select" ON public.workflow_instances;
CREATE POLICY "wf_inst_select" ON public.workflow_instances FOR SELECT TO authenticated USING (public.is_stelo_admin() OR company_id = public.user_company_id() OR public.user_role() IN ('provider','coordinator','employee'));
DROP POLICY IF EXISTS "wf_inst_insert" ON public.workflow_instances;
CREATE POLICY "wf_inst_insert" ON public.workflow_instances FOR INSERT TO authenticated WITH CHECK (public.is_stelo_admin() OR public.user_role() IN ('provider','coordinator','employer'));
DROP POLICY IF EXISTS "wf_inst_update" ON public.workflow_instances;
CREATE POLICY "wf_inst_update" ON public.workflow_instances FOR UPDATE TO authenticated USING (public.is_stelo_admin() OR company_id = public.user_company_id() OR public.user_role() IN ('provider','coordinator')) WITH CHECK (public.is_stelo_admin() OR company_id = public.user_company_id() OR public.user_role() IN ('provider','coordinator'));
DROP POLICY IF EXISTS "wf_inst_delete" ON public.workflow_instances;
CREATE POLICY "wf_inst_delete" ON public.workflow_instances FOR DELETE TO authenticated USING (public.is_stelo_admin());

-- WORKFLOW_STEP_INSTANCES
DROP POLICY IF EXISTS "wf_si_select" ON public.workflow_step_instances;
CREATE POLICY "wf_si_select" ON public.workflow_step_instances FOR SELECT TO authenticated USING (public.is_stelo_admin() OR public.user_role() IN ('provider','coordinator','employer','employee'));
DROP POLICY IF EXISTS "wf_si_insert" ON public.workflow_step_instances;
CREATE POLICY "wf_si_insert" ON public.workflow_step_instances FOR INSERT TO authenticated WITH CHECK (public.is_stelo_admin() OR public.user_role() IN ('provider','coordinator','employer'));
DROP POLICY IF EXISTS "wf_si_update" ON public.workflow_step_instances;
CREATE POLICY "wf_si_update" ON public.workflow_step_instances FOR UPDATE TO authenticated USING (public.is_stelo_admin() OR public.user_role() IN ('provider','coordinator','employer')) WITH CHECK (public.is_stelo_admin() OR public.user_role() IN ('provider','coordinator','employer'));

-- WORKFLOW_AUDIT_TRAIL
DROP POLICY IF EXISTS "wf_audit_select" ON public.workflow_audit_trail;
CREATE POLICY "wf_audit_select" ON public.workflow_audit_trail FOR SELECT TO authenticated USING (public.is_stelo_admin() OR public.user_role() IN ('provider','coordinator'));
DROP POLICY IF EXISTS "wf_audit_insert" ON public.workflow_audit_trail;
CREATE POLICY "wf_audit_insert" ON public.workflow_audit_trail FOR INSERT TO authenticated WITH CHECK (public.is_stelo_admin() OR public.user_role() IN ('provider','coordinator','employer'));

-- RECORD_NOTES
DROP POLICY IF EXISTS "notes_select" ON public.record_notes;
CREATE POLICY "notes_select" ON public.record_notes FOR SELECT TO authenticated USING (public.is_stelo_admin() OR public.user_role() = 'provider' OR (public.user_role() IN ('employer','coordinator') AND is_confidential = false) OR author_id = auth.uid());
DROP POLICY IF EXISTS "notes_insert" ON public.record_notes;
CREATE POLICY "notes_insert" ON public.record_notes FOR INSERT TO authenticated WITH CHECK (public.is_stelo_admin() OR public.user_role() IN ('provider','coordinator','employer'));
DROP POLICY IF EXISTS "notes_update" ON public.record_notes;
CREATE POLICY "notes_update" ON public.record_notes FOR UPDATE TO authenticated USING (public.is_stelo_admin() OR author_id = auth.uid()) WITH CHECK (public.is_stelo_admin() OR author_id = auth.uid());
DROP POLICY IF EXISTS "notes_delete" ON public.record_notes;
CREATE POLICY "notes_delete" ON public.record_notes FOR DELETE TO authenticated USING (public.is_stelo_admin());

-- DIGITAL_CERTIFICATES
DROP POLICY IF EXISTS "cert_select" ON public.digital_certificates;
CREATE POLICY "cert_select" ON public.digital_certificates FOR SELECT TO authenticated USING (public.is_stelo_admin() OR company_id = public.user_company_id() OR employee_id = public.user_employee_id() OR public.user_role() IN ('provider','coordinator'));
DROP POLICY IF EXISTS "cert_insert" ON public.digital_certificates;
CREATE POLICY "cert_insert" ON public.digital_certificates FOR INSERT TO authenticated WITH CHECK (public.is_stelo_admin() OR public.user_role() IN ('provider','coordinator'));
DROP POLICY IF EXISTS "cert_update" ON public.digital_certificates;
CREATE POLICY "cert_update" ON public.digital_certificates FOR UPDATE TO authenticated USING (public.is_stelo_admin() OR public.user_role() IN ('provider','coordinator')) WITH CHECK (public.is_stelo_admin() OR public.user_role() IN ('provider','coordinator'));

-- NOTIFICATIONS
DROP POLICY IF EXISTS "notif_select" ON public.notifications;
CREATE POLICY "notif_select" ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_stelo_admin());
DROP POLICY IF EXISTS "notif_insert" ON public.notifications;
CREATE POLICY "notif_insert" ON public.notifications FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() OR public.is_stelo_admin());
DROP POLICY IF EXISTS "notif_update" ON public.notifications;
CREATE POLICY "notif_update" ON public.notifications FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "notif_delete" ON public.notifications;
CREATE POLICY "notif_delete" ON public.notifications FOR DELETE TO authenticated USING (user_id = auth.uid() OR public.is_stelo_admin());