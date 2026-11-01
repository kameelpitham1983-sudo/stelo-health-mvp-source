/*
# Establish Master Administrator Role and User Management Functions

## Purpose
Promotes the existing registered account (kameel.pitham1983@gmail.com, id 28352aad-00a9-488f-83e5-fb5ff7ef8021)
to a new permanent "master_admin" role — the highest-level application role, above ordinary administrators.
Also adds user management functions for secure role assignment, activation/deactivation, and audit logging.

## New Columns on `profiles`
- `is_active` (boolean, default true): allows master admin to deactivate accounts without deleting them.
  Deactivated users still exist but cannot access platform data (enforced via updated `user_role()`).
- `deactivated_at` (timestamptz, nullable): records when the account was deactivated.

## New / Modified Functions
1. `is_stelo_admin()` — MODIFIED to return true for both 'master_admin' and 'admin' roles.
   All existing RLS policies that use is_stelo_admin() automatically grant the master admin
   the same access as ordinary admins — no policy changes needed.
2. `is_master_admin()` — NEW. Returns true only when the current user's role is 'master_admin'.
   Used for master-only operations (managing other admins, deactivating accounts).
3. `user_role()` — MODIFIED to return NULL for deactivated accounts (is_active = false).
4. `set_user_role(target_user_id, new_role)` — NEW SECURITY DEFINER function.
   Only master_admin can call it. Changes a user's role. Refuses to change a
   master_admin account. Logs to audit_log.
5. `deactivate_user(target_user_id, deactivate)` — NEW SECURITY DEFINER function.
   Only master_admin can call it. Toggles is_active. Refuses to deactivate a
   master_admin account. Logs to audit_log.
6. `handle_new_user()` — MODIFIED. Checks for 'master_admin' OR 'admin' when deciding
   if an admin already exists. New sign-ups still default to 'employee'.

## Security Changes
- `profiles` SELECT policy: master_admin and admin see all profiles; other roles see only their own.
- `profiles` UPDATE policy: self-update or master_admin only; column grant restricts self-edits
  to display_name, avatar_initials, company_id, linked_employee_id. set_user_role() handles role changes.
- `profiles` INSERT policy: only master_admin can insert (for edge function invitations).
- `profiles` DELETE policy: blocked entirely (accounts are deactivated, never deleted).
- `set_user_role` and `deactivate_user` REVOKE EXECUTE from PUBLIC/anon, GRANT to authenticated only.
- `is_master_admin` REVOKE from PUBLIC/anon, GRANT to authenticated only.

## Important Notes
1. The existing account (28352aad-...) is promoted to master_admin in the same transaction.
2. The account's user ID, email, password, and auth credentials are NOT changed.
3. No duplicate user is created.
4. The master role cannot be changed by ordinary admins — set_user_role refuses to
   modify any account whose current role is 'master_admin'.
5. The audit_log entry records the promotion.
6. All existing RLS policies continue to work unchanged because is_stelo_admin()
   now returns true for master_admin too.
*/

-- 1. Add is_active and deactivated_at columns to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS deactivated_at timestamptz;

-- 2. Update is_stelo_admin() to include master_admin
CREATE OR REPLACE FUNCTION public.is_stelo_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
SELECT EXISTS (
  SELECT 1 FROM public.profiles
  WHERE id = auth.uid()
    AND role IN ('admin', 'master_admin')
    AND is_active = true
);
$function$;

-- 3. Create is_master_admin() function
CREATE OR REPLACE FUNCTION public.is_master_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
SELECT EXISTS (
  SELECT 1 FROM public.profiles
  WHERE id = auth.uid()
    AND role = 'master_admin'
    AND is_active = true
);
$function$;

REVOKE EXECUTE ON FUNCTION public.is_master_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_master_admin() TO authenticated;

-- 4. Update user_role() to return NULL for deactivated accounts
CREATE OR REPLACE FUNCTION public.user_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
SELECT role FROM public.profiles WHERE id = auth.uid() AND is_active = true;
$function$;

-- 5. Update handle_new_user() trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  requested_role text;
  display_name text;
  initials text;
  admin_exists boolean;
BEGIN
  requested_role := COALESCE(NEW.raw_user_meta_data->>'role', 'employee');
  display_name := COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1));
  initials := UPPER(LEFT(display_name, 2));

  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE role IN ('admin', 'master_admin') AND is_active = true
  ) INTO admin_exists;

  IF NOT admin_exists THEN
    INSERT INTO public.profiles (id, role, display_name, avatar_initials)
    VALUES (
      NEW.id,
      CASE WHEN requested_role IN ('admin', 'provider', 'employer', 'coordinator', 'lab') THEN requested_role ELSE 'employee' END,
      display_name,
      initials
    )
    ON CONFLICT (id) DO NOTHING;
  ELSE
    INSERT INTO public.profiles (id, role, display_name, avatar_initials)
    VALUES (NEW.id, 'employee', display_name, initials)
    ON CONFLICT (id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$function$;

-- 6. Create set_user_role() function
-- Only master_admin can call. Changes a user's role. Refuses to touch master_admin accounts.
CREATE OR REPLACE FUNCTION public.set_user_role(target_user_id uuid, new_role text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  target_current_role text;
  actor_id uuid;
  actor_name text;
  target_email text;
BEGIN
  IF NOT public.is_master_admin() THEN
    RAISE EXCEPTION 'Only the Master Administrator can change user roles.'
      USING ERRCODE = '42501';
  END IF;

  IF new_role NOT IN ('admin', 'coordinator', 'provider', 'employer', 'employee', 'lab') THEN
    RAISE EXCEPTION 'Invalid role. Valid roles: admin, coordinator, provider, employer, employee, lab.'
      USING ERRCODE = '42846';
  END IF;

  SELECT role INTO target_current_role FROM public.profiles WHERE id = target_user_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found.' USING ERRCODE = 'P0002';
  END IF;

  IF target_current_role = 'master_admin' THEN
    RAISE EXCEPTION 'Cannot modify a Master Administrator account through this function.'
      USING ERRCODE = '42501';
  END IF;

  actor_id := auth.uid();
  SELECT display_name INTO actor_name FROM public.profiles WHERE id = actor_id;
  SELECT email INTO target_email FROM auth.users WHERE id = target_user_id;

  UPDATE public.profiles SET role = new_role WHERE id = target_user_id;

  INSERT INTO public.audit_log (
    actor_id, actor_name, actor_role,
    record_type, record_id, record_reference,
    action, from_status, to_status,
    details
  ) VALUES (
    actor_id, actor_name, 'master_admin',
    'user', target_user_id, COALESCE(target_email, target_user_id::text),
    'role_change', target_current_role, new_role,
    'Role changed from ' || target_current_role || ' to ' || new_role
  );
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.set_user_role(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_user_role(uuid, text) TO authenticated;

-- 7. Create deactivate_user() function
CREATE OR REPLACE FUNCTION public.deactivate_user(target_user_id uuid, deactivate boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  target_current_role text;
  actor_id uuid;
  actor_name text;
  target_email text;
BEGIN
  IF NOT public.is_master_admin() THEN
    RAISE EXCEPTION 'Only the Master Administrator can activate or deactivate users.'
      USING ERRCODE = '42501';
  END IF;

  SELECT role INTO target_current_role FROM public.profiles WHERE id = target_user_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found.' USING ERRCODE = 'P0002';
  END IF;

  IF target_current_role = 'master_admin' THEN
    RAISE EXCEPTION 'Cannot deactivate a Master Administrator account.'
      USING ERRCODE = '42501';
  END IF;

  actor_id := auth.uid();
  SELECT display_name INTO actor_name FROM public.profiles WHERE id = actor_id;
  SELECT email INTO target_email FROM auth.users WHERE id = target_user_id;

  IF deactivate THEN
    UPDATE public.profiles
    SET is_active = false, deactivated_at = now()
    WHERE id = target_user_id;
  ELSE
    UPDATE public.profiles
    SET is_active = true, deactivated_at = NULL
    WHERE id = target_user_id;
  END IF;

  INSERT INTO public.audit_log (
    actor_id, actor_name, actor_role,
    record_type, record_id, record_reference,
    action, details
  ) VALUES (
    actor_id, actor_name, 'master_admin',
    'user', target_user_id, COALESCE(target_email, target_user_id::text),
    CASE WHEN deactivate THEN 'deactivate' ELSE 'activate' END,
    'Account ' || CASE WHEN deactivate THEN 'deactivated' ELSE 'activated' END
  );
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.deactivate_user(uuid, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.deactivate_user(uuid, boolean) TO authenticated;

-- 8. Promote the existing account to master_admin
UPDATE public.profiles
SET role = 'master_admin'
WHERE id = '28352aad-00a9-488f-83e5-fb5ff7ef8021';

-- 9. Log the master_admin promotion in audit_log
INSERT INTO public.audit_log (
  actor_id, actor_name, actor_role,
  record_type, record_id, record_reference,
  action, from_status, to_status,
  details
) VALUES (
  '28352aad-00a9-488f-83e5-fb5ff7ef8021',
  'kameel.pitham1983',
  'master_admin',
  'user',
  '28352aad-00a9-488f-83e5-fb5ff7ef8021',
  'kameel.pitham1983@gmail.com',
  'role_change',
  'admin',
  'master_admin',
  'Account promoted to Master Administrator — STelo Health'
);

-- 10. Update profiles RLS policies
DROP POLICY IF EXISTS "profiles_select" ON profiles;
DROP POLICY IF EXISTS "profiles_update" ON profiles;
DROP POLICY IF EXISTS "profiles_insert" ON profiles;
DROP POLICY IF EXISTS "profiles_delete" ON profiles;

-- SELECT: master_admin and admin see all profiles; other users see only their own
CREATE POLICY "profiles_select"
ON profiles FOR SELECT
TO authenticated
USING (
  public.is_stelo_admin()
  OR id = auth.uid()
);

-- UPDATE: self-update or master_admin only
CREATE POLICY "profiles_update"
ON profiles FOR UPDATE
TO authenticated
USING (id = auth.uid() OR public.is_master_admin())
WITH CHECK (id = auth.uid() OR public.is_master_admin());

-- INSERT: only master_admin can insert (for edge function invitations)
CREATE POLICY "profiles_insert"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (public.is_master_admin());

-- DELETE: blocked entirely (accounts are deactivated, never deleted)
CREATE POLICY "profiles_delete"
ON profiles FOR DELETE
TO authenticated
USING (false);

-- 11. Grant column-level privileges on profiles
REVOKE UPDATE ON profiles FROM authenticated;
GRANT UPDATE (display_name, avatar_initials, company_id, linked_employee_id) ON profiles TO authenticated;
GRANT SELECT ON profiles TO authenticated;
