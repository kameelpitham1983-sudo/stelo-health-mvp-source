/*
# Create screening_records (HPV and colorectal screening, pending - NOT APPLIED)

This file is prepared for review only. It must be applied with the database migration tool once approved.

## 1. New table
- `screening_records`
  - `id` (uuid, primary key)
  - `employee_id` (uuid, references employees, cascades on delete)
  - `company_id` (uuid, references companies, nullable)
  - `screening_type` (text: 'HPV' or 'Colorectal')
  - `record` (jsonb): the full screening record (decision, consent, Lancet steps, dispatch and result dates, clinician review)
  - `audit_trail` (jsonb): append-only list of actions with actor name, role and time
  - `created_at`, `updated_at` timestamps

## 2. Security
- Row level security enabled.
- Access: admin, master_admin, coordinator and provider only. These roles hold clinical access.
- Employer, employee and lab roles have no access.
- No DELETE policy: records are retained for audit.
- Grants limited to SELECT, INSERT and UPDATE for the authenticated role.

## 3. Important notes
1. The role helper `public.user_role()` must return the role name for the signed-in user. Verify before applying.
2. Clinical review by the responsible clinician is enforced in the app; the database allows coordinators and providers to update records.
3. Demo Mode records are never written here.
*/

CREATE TABLE IF NOT EXISTS screening_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  company_id uuid REFERENCES companies(id),
  screening_type text NOT NULL CHECK (screening_type IN ('HPV', 'Colorectal')),
  record jsonb NOT NULL DEFAULT '{}'::jsonb,
  audit_trail jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS screening_records_employee_idx ON screening_records (employee_id);

ALTER TABLE screening_records ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE ON screening_records TO authenticated;

DROP POLICY IF EXISTS "select_screening_records" ON screening_records;
CREATE POLICY "select_screening_records" ON screening_records FOR SELECT
  TO authenticated
  USING (public.user_role() IN ('admin', 'master_admin', 'coordinator', 'provider'));

DROP POLICY IF EXISTS "insert_screening_records" ON screening_records;
CREATE POLICY "insert_screening_records" ON screening_records FOR INSERT
  TO authenticated
  WITH CHECK (public.user_role() IN ('admin', 'master_admin', 'coordinator', 'provider'));

DROP POLICY IF EXISTS "update_screening_records" ON screening_records;
CREATE POLICY "update_screening_records" ON screening_records FOR UPDATE
  TO authenticated
  USING (public.user_role() IN ('admin', 'master_admin', 'coordinator', 'provider'))
  WITH CHECK (public.user_role() IN ('admin', 'master_admin', 'coordinator', 'provider'));
