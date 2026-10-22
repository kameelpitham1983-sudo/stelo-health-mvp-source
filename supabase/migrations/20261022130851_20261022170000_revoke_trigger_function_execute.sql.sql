/*
# Revoke EXECUTE on trigger functions from authenticated role

## Purpose
Security advisor flagged that `handle_new_user()` and `update_questionnaire_instance_updated_at()`
are SECURITY DEFINER functions callable by authenticated users via the REST API.
These are trigger functions — they fire on table events, not direct API calls.
Revoking EXECUTE from authenticated prevents direct RPC calls while keeping
trigger functionality intact (triggers run with the function's own privileges).

## Changes
- REVOKE EXECUTE on handle_new_user() FROM authenticated
- REVOKE EXECUTE on update_questionnaire_instance_updated_at() FROM authenticated
- get_current_profile() is left callable — RLS policies depend on it

## Notes
1. Trigger functions still fire normally on table events regardless of EXECUTE grants
2. No data is modified or lost
3. get_current_profile() remains callable because every RLS policy uses it
*/

REVOKE EXECUTE ON FUNCTION handle_new_user() FROM authenticated;
REVOKE EXECUTE ON FUNCTION update_questionnaire_instance_updated_at() FROM authenticated;
