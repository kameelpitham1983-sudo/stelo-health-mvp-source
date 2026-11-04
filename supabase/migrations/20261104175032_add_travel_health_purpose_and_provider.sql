/*
# Add purpose of travel and provider to travel health records

1. Modified Tables
- `travel_health`
  - `purpose_of_travel` (text, nullable): why the employee is travelling, e.g. "Client site visit".
  - `provider` (text, nullable): the clinician or provider name recorded for the consultation.

2. Important Notes
- Both columns are nullable, so existing travel health records are unchanged and remain valid.
- No existing data is modified, deleted or overwritten.
- The table is not recreated. The migration uses ADD COLUMN IF NOT EXISTS, so it is safe to re-run.
- No changes to row level security, grants or policies.
- The `travel_health_employer_view` is not changed by this migration.
*/

ALTER TABLE public.travel_health ADD COLUMN IF NOT EXISTS purpose_of_travel text;
ALTER TABLE public.travel_health ADD COLUMN IF NOT EXISTS provider text;
