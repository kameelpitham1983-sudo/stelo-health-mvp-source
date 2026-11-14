/*
# Add linked_provider_id to profiles

Prerequisite for provider-scoped RLS on travel_consultations.
Allows RLS to identify which provider record a signed-in provider user corresponds to.
Does not change existing roles, grants, or policies. Does not auto-assign existing users.
linked_provider_id is NOT added to profiles updatable_columns — it is set only via
set_user_provider_link() which requires is_stelo_admin().
*/

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS linked_provider_id uuid
  REFERENCES public.providers(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.profiles.linked_provider_id
  IS 'Links a provider user to their provider record for provider-scoped RLS. Set by admin only via set_user_provider_link().';

CREATE OR REPLACE FUNCTION public.user_provider_id()
RETURNS uuid
LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT linked_provider_id FROM public.profiles WHERE id = auth.uid();
$$;

REVOKE EXECUTE ON FUNCTION public.user_provider_id FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.user_provider_id TO authenticated;

-- Admin-only function to set a user's linked provider. Mirrors set_user_role pattern.
CREATE OR REPLACE FUNCTION public.set_user_provider_link(
  target_user_id uuid,
  p_provider_id uuid
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_stelo_admin() THEN
    RAISE EXCEPTION 'Not authorised';
  END IF;
  UPDATE public.profiles
    SET linked_provider_id = p_provider_id
    WHERE id = target_user_id;
END $$;

REVOKE EXECUTE ON FUNCTION public.set_user_provider_link FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_user_provider_link TO authenticated;
