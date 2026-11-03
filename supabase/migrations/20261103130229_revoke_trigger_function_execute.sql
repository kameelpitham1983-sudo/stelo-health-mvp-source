/*
# Revoke EXECUTE on trigger functions from authenticated role

Security advisor flagged handle_new_user() and update_questionnaire_instance_updated_at()
as SECURITY DEFINER functions callable by authenticated users via REST API.
These are trigger functions — they fire on table events, not direct API calls.
Revoking EXECUTE prevents direct RPC calls while keeping trigger functionality intact.
*/

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.update_questionnaire_instance_updated_at() FROM authenticated;