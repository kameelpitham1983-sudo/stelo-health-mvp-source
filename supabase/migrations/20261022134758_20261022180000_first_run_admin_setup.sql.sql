/*
# First-run admin setup via sign-up metadata + lock down role column

## Purpose
The project owner has no way to log in — zero users exist in auth.users.
This migration updates the handle_new_user trigger to read a requested role
from sign-up metadata, but ONLY honours admin/provider/employer when no admin
profile exists yet (first-run). After the first admin is established, all
future sign-ups default to 'employee' regardless of metadata.

## Changes
1. Update handle_new_user() to:
   - Read role from NEW.raw_user_meta_data->>'role'
   - Only use it if NO admin profile exists (first-run bootstrap)
   - Otherwise always default to 'employee'
2. Revoke column-level UPDATE on profiles.role from authenticated
   - Users can still update their own display_name, avatar_initials, etc.
   - Only admin can change role (via the existing admin UPDATE policy)
3. Grant UPDATE on specific safe columns to authenticated

## Security
- First-run bootstrap is a one-time window: once any admin exists, the
  trigger ignores requested roles and defaults to employee
- Column-level grant prevents self-escalation via direct API updates
- The existing profiles_update RLS policy (id = auth.uid() OR admin) remains
- No data is lost, no tables dropped
*/

-- Update the trigger function to support first-run role bootstrap
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  requested_role text;
  admin_exists boolean;
BEGIN
  requested_role := COALESCE(NEW.raw_user_meta_data->>'role', 'employee');
  
  -- Only honour non-employee roles if no admin profile exists (first-run)
  SELECT EXISTS(SELECT 1 FROM public.profiles WHERE role = 'admin') INTO admin_exists;
  
  IF NOT admin_exists AND requested_role IN ('admin', 'provider', 'employer') THEN
    -- First-run bootstrap: allow the project owner to claim admin/provider/employer
    INSERT INTO public.profiles (id, role, display_name, avatar_initials)
    VALUES (
      NEW.id,
      requested_role,
      COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
      COALESCE(NEW.raw_user_meta_data->>'avatar_initials', UPPER(SUBSTRING(split_part(NEW.email, '@', 1) FROM 1 FOR 2)))
    )
    ON CONFLICT (id) DO NOTHING;
  ELSE
    -- Normal sign-up: always employee
    INSERT INTO public.profiles (id, role, display_name, avatar_initials)
    VALUES (
      NEW.id,
      'employee',
      COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
      COALESCE(NEW.raw_user_meta_data->>'avatar_initials', UPPER(SUBSTRING(split_part(NEW.email, '@', 1) FROM 1 FOR 2)))
    )
    ON CONFLICT (id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Lock down the role column: revoke full UPDATE, grant only safe columns
REVOKE UPDATE ON public.profiles FROM authenticated;
GRANT UPDATE (display_name, avatar_initials, company_id, linked_employee_id) ON public.profiles TO authenticated;
