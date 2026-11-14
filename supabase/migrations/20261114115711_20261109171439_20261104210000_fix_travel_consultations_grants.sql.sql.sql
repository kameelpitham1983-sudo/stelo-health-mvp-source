-- V24 fix: add missing DELETE grant for authenticated role on travel_consultations.
-- The tc_delete RLS policy (admin-only via is_stelo_admin()) already exists,
-- but without a DELETE table-level grant the policy is dead code and deleteConsultation
-- fails with 42501. RLS still applies after the grant, so only admins can delete.

GRANT DELETE ON public.travel_consultations TO authenticated;

-- Revoke excess grants on the employer view that were never intended.
-- The migration only granted SELECT to authenticated; Supabase's default
-- view grants (all CRUD to anon + authenticated) were never revoked.
-- security_invoker = true means RLS still blocks anon, but the grants
-- are unnecessary exposure. Keep SELECT for authenticated only.

REVOKE ALL ON public.travel_consultations_employer_view FROM anon, authenticated;
GRANT SELECT ON public.travel_consultations_employer_view TO authenticated;
