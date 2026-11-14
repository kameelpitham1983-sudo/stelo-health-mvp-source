/*
# Fix security advisor warnings

1. Fix update_cases_updated_at() — add SET search_path
2. Revoke EXECUTE on helper functions from anon role (keep authenticated)
3. Revoke EXECUTE on set_user_role/deactivate_user/is_master_admin from anon (already done, but verify)
*/

-- Fix search_path on update_cases_updated_at
CREATE OR REPLACE FUNCTION public.update_cases_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Revoke anon execute on helper functions used in RLS policies
REVOKE EXECUTE ON FUNCTION public.is_stelo_admin() FROM anon;
REVOKE EXECUTE ON FUNCTION public.user_company_id() FROM anon;
REVOKE EXECUTE ON FUNCTION public.user_role() FROM anon;
REVOKE EXECUTE ON FUNCTION public.user_employee_id() FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_master_admin() FROM anon;
REVOKE EXECUTE ON FUNCTION public.set_user_role(uuid, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.deactivate_user(uuid, boolean) FROM anon;
