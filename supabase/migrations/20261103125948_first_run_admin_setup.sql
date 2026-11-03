/*
# First-run admin setup via sign-up metadata + lock down role column

Updates handle_new_user so a requested privileged role is only honored during
first-run bootstrap, then defaults future sign-ups to employee. Restricts profile
self-updates to safe columns while preserving controlled admin role management.
*/

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
  SELECT EXISTS(SELECT 1 FROM public.profiles WHERE role = 'admin') INTO admin_exists;
  IF NOT admin_exists AND requested_role IN ('admin', 'provider', 'employer') THEN
    INSERT INTO public.profiles (id, role, display_name, avatar_initials)
    VALUES (NEW.id, requested_role,
      COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
      COALESCE(NEW.raw_user_meta_data->>'avatar_initials', UPPER(SUBSTRING(split_part(NEW.email, '@', 1) FROM 1 FOR 2))))
    ON CONFLICT (id) DO NOTHING;
  ELSE
    INSERT INTO public.profiles (id, role, display_name, avatar_initials)
    VALUES (NEW.id, 'employee',
      COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
      COALESCE(NEW.raw_user_meta_data->>'avatar_initials', UPPER(SUBSTRING(split_part(NEW.email, '@', 1) FROM 1 FOR 2))))
    ON CONFLICT (id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$function$;

REVOKE UPDATE ON public.profiles FROM authenticated;
GRANT UPDATE (display_name, avatar_initials, company_id, linked_employee_id) ON public.profiles TO authenticated;