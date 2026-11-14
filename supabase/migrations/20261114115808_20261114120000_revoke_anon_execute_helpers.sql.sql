/*
# Revoke anon EXECUTE on remaining SECURITY DEFINER helper functions

The harden_auth migration attempted these revokes but 4 functions still have anon execute.
This is a targeted fix to close the anon RPC attack surface.
*/

REVOKE EXECUTE ON FUNCTION public.is_stelo_admin() FROM anon;
REVOKE EXECUTE ON FUNCTION public.user_company_id() FROM anon;
REVOKE EXECUTE ON FUNCTION public.user_employee_id() FROM anon;
REVOKE EXECUTE ON FUNCTION public.user_role() FROM anon;

-- Also revoke from PUBLIC to be thorough (PUBLIC covers all roles including anon)
REVOKE EXECUTE ON FUNCTION public.is_stelo_admin() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.user_company_id() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.user_employee_id() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.user_role() FROM PUBLIC;

-- Re-grant to authenticated only
GRANT EXECUTE ON FUNCTION public.is_stelo_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_company_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_employee_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_role() TO authenticated;
