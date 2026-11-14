/*
# Revoke EXECUTE on update_cases_updated_at from all non-trigger roles

The security advisor flags update_cases_updated_at as callable by authenticated.
It is a trigger function and should not be directly callable via RPC.
*/

REVOKE EXECUTE ON FUNCTION public.update_cases_updated_at() FROM PUBLIC, anon, authenticated;
