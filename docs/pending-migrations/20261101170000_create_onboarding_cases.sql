/*
# Create onboarding cases (occupational medical onboarding workflow)

NOT APPLIED. Prepared for review. Do not apply until approved.
Apply later with the Supabase migration tool, under a new migration name.

## 1. New table
- `onboarding_cases`: one row per employee onboarding process (pre-employment, periodic or transfer medical).
  - `id` uuid primary key.
  - `company_id` uuid, the client company (links to `companies`).
  - `company_name` text, copied at creation for traceability.
  - `status` text: `open`, `closed`, or `case_opened`.
  - `closed_reason` text, filled when the process closes early.
  - `data` jsonb, stage answers (identity reference, consent, registration, work order).
  - `audit_trail` jsonb, ordered list of `{ action, actorName, actorRole, at }` entries.
  - `created_by` uuid, defaults to the signed-in user.
  - `created_at`, `updated_at` timestamps.

## 2. Security
- RLS enabled. No DELETE policy, so records cannot be deleted through the app.
- Staff (`is_stelo_admin()` or role `coordinator`) can read and change all onboarding cases.
- Employer users can read and change only cases for their own company (`user_company_id()`).
- Employees, providers and lab users have no access in this migration.
- Grants limited to `authenticated`: SELECT, INSERT, UPDATE.

## 3. Important notes
1. Stage-level permissions (who may submit consent, who may approve a work order) are enforced in the application and must be mirrored in later policies before live use.
2. No names or surnames are stored in this table. The identity field holds a client reference (User ID or passport reference) only.
3. Two-factor verification, video calls and email notifications are external and are not represented here.
*/

CREATE TABLE IF NOT EXISTS public.onboarding_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE RESTRICT,
  company_name text NOT NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'case_opened')),
  closed_reason text,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  audit_trail jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_by uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_onboarding_cases_company_id ON public.onboarding_cases (company_id);

ALTER TABLE public.onboarding_cases ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE ON public.onboarding_cases TO authenticated;

DROP POLICY IF EXISTS "select_onboarding_cases" ON public.onboarding_cases;
CREATE POLICY "select_onboarding_cases" ON public.onboarding_cases FOR SELECT
  TO authenticated
  USING (
    public.is_stelo_admin()
    OR public.user_role() = 'coordinator'
    OR (public.user_role() = 'employer' AND company_id = public.user_company_id())
  );

DROP POLICY IF EXISTS "insert_onboarding_cases" ON public.onboarding_cases;
CREATE POLICY "insert_onboarding_cases" ON public.onboarding_cases FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_stelo_admin()
    OR public.user_role() = 'coordinator'
    OR (public.user_role() = 'employer' AND company_id = public.user_company_id())
  );

DROP POLICY IF EXISTS "update_onboarding_cases" ON public.onboarding_cases;
CREATE POLICY "update_onboarding_cases" ON public.onboarding_cases FOR UPDATE
  TO authenticated
  USING (
    public.is_stelo_admin()
    OR public.user_role() = 'coordinator'
    OR (public.user_role() = 'employer' AND company_id = public.user_company_id())
  )
  WITH CHECK (
    public.is_stelo_admin()
    OR public.user_role() = 'coordinator'
    OR (public.user_role() = 'employer' AND company_id = public.user_company_id())
  );
