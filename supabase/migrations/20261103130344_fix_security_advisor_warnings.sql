/*
# Fix security advisor warnings

1. Fix update_cases_updated_at() search_path (already done in case management migration)
2. Revoke EXECUTE on helper functions from anon role (keep authenticated)
*/

REVOKE EXECUTE ON FUNCTION public.is_stelo_admin() FROM anon;
REVOKE EXECUTE ON FUNCTION public.user_company_id() FROM anon;
REVOKE EXECUTE ON FUNCTION public.user_role() FROM anon;
REVOKE EXECUTE ON FUNCTION public.user_employee_id() FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_master_admin() FROM anon;
REVOKE EXECUTE ON FUNCTION public.set_user_role(uuid, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.deactivate_user(uuid, boolean) FROM anon;