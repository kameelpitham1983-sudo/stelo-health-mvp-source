# STelo Health Development Log

## Stage 1: Security review (read-only)
- Inspected all seven SECURITY DEFINER functions: set_user_role, deactivate_user, is_master_admin, is_stelo_admin, user_role, user_company_id, user_employee_id.
- Role changes and deactivation require master admin and are audited. Helper functions return only the caller's own data. Anonymous access is denied.
- Profile column grants restrict signed-in users to display name and initials; they cannot change their own role, company or linked employee.
- Advisor warnings about signed-in execution are accepted: the policies depend on these helpers.

## Stage 2: Authentication and administrator setup
- Reviewed the sign-in and sign-up screen and the new-user trigger.
- Finding: the sign-up screen offers account types, but the database always creates new accounts as employees. The chosen type is ignored, which is safe but misleading.
- Finding: no profiles exist, so there is no administrator and no master administrator. The first-run bootstrap is no longer active.
- Outstanding: creating the first master administrator requires owner approval.

## Stage 3: Synthetic demonstration data
- Seeded in the database (fictional people and companies, .example domains): 3 companies, 3 providers (including Labworks), 6 employees, 4 medicals, 4 appointments, 2 travel health records, 2 sickness absence cases, 2 GOPs, 2 hotels, 2 hotel bookings, 1 visa medical case, 2 case records, 3 documents, 2 screening records.
- Seeding ran as the database administrator, bypassing row-level security; this is for demonstration data only.
- Outstanding: onboarding cases (the creator must be a real signed-in account); persistence after sign-out and sign-in (needs an account).

## Stage 4: Functional testing (static check only)
- No browser is available, so no screens were exercised.
- Connected to the database: companies, employees, medicals, appointments, documents, sickness absence, synopses, workflows, questionnaires, screening and onboarding hooks.
- Correction: the earlier check was incomplete. GOP and Accommodation screens already import database hooks, and Providers uses a provider hook; whether they read the seeded records is not yet verified. The earlier search did not find direct table references for GOPs, hotels, travel health or visa medicals, so those hooks still need inspection.
- Outstanding: wiring those modules, and a full functional test once an account exists.

## Stage 5: Summary
- Database migrations applied and verified: onboarding cases, screening records.
- Changes to application code: none.
- Outstanding decisions: create the first master administrator; approve wiring the disconnected modules to the database.

## Stage 6: Master administrator and module integration
- Master administrator: assigned to kameel.pitham1983@gmail.com (owner-approved, one-time database update guarded to a single account with no existing master administrator; an audit entry was written). Verified: exactly one master administrator; ordinary users' profile updates cannot change the role column; the role function still requires a master administrator. Not yet verified: signing in as this account in the app.
- Providers, GOPs, Accommodation (hotels and bookings) and Visa Medicals: their hooks read and write the existing tables, and the matching RLS policies exist for signed-in users. Not verified in the running app.
- Travel Health: list reads from the existing table (employer view for employers). The "create consultation" form on the page only adds to in-memory demo state and is not saved to the database. Fixing it needs a decision on how consultation fields map to the travel health table columns.
- Build: `npm run build` passed. Type check: `tsc -p tsconfig.app.json` passed.
- Not done: sign-in persistence test, create/edit testing of seeded records, role-access testing, Travel Health create/edit.

## Stage 7: White screen after administrator sign-in
- Cause: the Case Management page crashed when rendering one seeded case whose status ("in_progress") is not a valid case status. The crash blanked the whole app because there is no error boundary.
- Fix: changed that synthetic case's status to "active" (CASE-2026-0001). No code changes.
- Not verified: the app in a browser. Recommended follow-up: add an error boundary so one bad record cannot blank the whole app.

## Stage 8: Controlled company and employee test (Version 9 baseline)
- Inspected: company and employee create/update hooks; company and employee access rules (admins and coordinators manage companies; employers manage their own company's employees; providers and coordinators manage employees).
- Created: STelo Functional Test Company (id d3469f90-1052-40e6-828f-855ebfceb22e), employee Test Employee (id 8c5b03bf-cf1d-4bf8-be78-83f2c9c73093), linked to that company. Both are synthetic and remain in place.
- Edited: company contact name set to "Synthetic Test Contact"; employee job title set to "Synthetic Test Role". A fresh read confirmed both edits and the company-employee link.
- Access check: an insert into companies by an unknown non-admin user was rejected by the access rules.
- Limitation: these were run as the master administrator through the database with the same columns the app uses. Not tested: the browser forms, required-field messages, and page refresh.
- Problems: the test plan's "Reference" and "Description" fields have no database column, so they cannot be saved. The employee reference (ST-EMP-TEST-001) also has no column.
- No schema, policy, role, or other record was changed.

## Stage 9: Company employee count investigation (Version 10)
- Cause: the company detail page shows two figures. "Employees" displays the company's stored headcount field (employee_count), which is entered separately and is not calculated from employee records. "Tracked in system" counts the linked employee records, filtered by the correct company ID.
- The create-company save does not set a headcount, so it is stored as 0. That is why the synthetic company shows "Employees: 0".
- Expected for STelo Functional Test Company: 1 linked employee (1 active). Headcount field 0 (not derived). "Tracked in system" shows 1 as expected.
- Scope: not isolated. Stored headcounts for other companies do not match their linked records: Bluegum Financial Holdings 85 stored vs 2 linked; Karoo Fresh Produce 40 vs 1; Northwind Mining Services 240 vs 3. The company list shows only the stored headcount, so it shows the same mismatch.
- Company detail, company list and employee list use the same company ID and employee-to-company link; no query error found.
- Proposed fix (not applied): show the count of linked employee records on the company list and detail page, or label the stored figure "Declared headcount". Neither changes stored data.
- No code, records, schema, RLS or permissions were changed in this stage.

## Stage 10: Company workforce labels (Version 12)
- Renamed the stored headcount label to "Declared Workforce" on the company detail page and company list.
- Renamed the linked-record count label to "Employees tracked in STelo" on the company detail page and the Reports summary card.
- Stored values and counting logic are unchanged. Build passed.
- Not verified in the browser. The request's remaining sections were cut off in the message, so any other places that show these two values were not checked.
- Re-run for the repeated Version 12 request: type check passed. Stored declared workforce values unchanged (Bluegum 85, Karoo 40, Northwind 240, STelo Functional Test Company 0). Linked employee counts unchanged (2, 1, 3, 1). No records or code changed in this run.

## Stage 11: Travel health schema for consultation fields (Version 14)
- Inspected: the travel health table (the only base table; the employer view reads from it) and its columns. The consultation form on the Travel Health page saves only to in-memory demo state. The database hook reads but does not write.
- Migration applied (add_travel_health_purpose_and_provider): added two nullable text columns to the travel health table, purpose_of_travel and provider. Uses ADD COLUMN IF NOT EXISTS, so it is safe to re-run. No table recreated, no records changed, no policy or grant changed.
- Verified: both columns exist as nullable text. The 2 existing travel health records are intact and have empty values in the new columns.
- Not done: the employer view does not include the new columns, so employers cannot see them yet. The form is not yet wired to save to the table, and the hook does not read the new fields. Both need approval as the next step.

## Stage 12: Travel health consultation saves (Version 15)
- Hook: the travel health read now maps purpose_of_travel and provider. A new update function writes those two fields to the travel health record, only for fields that were provided, and throws a visible error if no row was saved.
- Form: when a travel health record is linked and the app is not in demo mode, Create Consultation saves purpose and provider to that record first. Errors are shown in the form and the consultation is not added on failure. Blank fields are not written, so existing values are kept.
- Record view: the expanded travel record now shows purpose of travel and provider.
- Limits: consultations with no linked travel health record are still demo-only. Consultation date, status and post-travel fields have no database columns and are still demo-only. The employer view does not include the new columns, so employers do not see them yet. Status buttons remain demo-only.
- Verified: type check passed; build passed. The two existing records are readable with the new fields (both empty). No test write was made, so the save path has not been exercised against the database or in a browser.

## Stage 13: Travel consultation column mapping (Version 16, stopped for approval)
- Existing travel_health columns: employee_name (required text), company_id, company_name, destination, departure_date, return_date, risk_level, vaccines (jsonb), malaria_prophylaxis, travel_kit_issued, last_consultation (date), status (Cleared / Pending / Action Required / In Progress), created_at, purpose_of_travel, provider.
- Stores: company link (company_id); purpose of travel; provider; a consultation date could go into last_consultation but that column means the last consultation, so its use is a decision for approval.
- Cannot store: a link to the employee record (only a name is stored); consultation status (the existing status field uses different values); post-travel review date and notes; clinician notes; travel advice; questionnaire status; appointment and medical links.
- Consultations are not a separate table. A new consultation would have to be a new travel record, which would then appear in the Travel Health Records list.
- Not done: database-backed consultation creation, employer view changes, and the create/read/edit test. The in-memory consultation path is unchanged.
- Proposed for approval: a separate consultations table linked to the employee, company and travel record, holding consultation date, status, provider, purpose, post-travel review date and notes, with restricted read rules for clinical notes. The alternative is adding the missing columns to travel_health.

## Stage 14: Travel consultations table design and security review (Version 17, planning only)
- Inspected schema: travel_health, employees, companies, appointments; RLS policies on all; helper functions user_role, user_company_id, user_employee_id, is_stelo_admin, is_master_admin (all SECURITY DEFINER). Confirmed conventions from the visa_medical_cases migration (linked ids + denormalised names, four per-verb policies, service_role grant, indexes on company/employee/status, clinical notes column present but not shown to employers).
- travel_health has no employee_id; only employee_name. employees has company_id. travel_health has purpose_of_travel and provider (added V14).
- Proposed table: public.travel_consultations. Columns:
  - id uuid PK default gen_random_uuid()
  - travel_health_id uuid REFERENCES public.travel_health(id) ON DELETE CASCADE (the linked travel record; nullable so a consultation can stand alone if needed, but the form will normally link one)
  - employee_id uuid REFERENCES public.employees(id) ON DELETE SET NULL
  - employee_name text NOT NULL DEFAULT ''
  - company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL
  - company_name text NOT NULL DEFAULT ''
  - purpose_of_travel text
  - provider text
  - consultation_date date
  - status text NOT NULL DEFAULT 'Not Scheduled'  -- values: Not Scheduled, Scheduled, Completed, Post-Travel Review Required, Post-Travel Completed
  - vaccination_plan jsonb NOT NULL DEFAULT '[]'::jsonb  -- snapshot of vaccines at creation
  - malaria_prophylaxis boolean NOT NULL DEFAULT false
  - travel_kit_issued boolean NOT NULL DEFAULT false
  - travel_advice text NOT NULL DEFAULT ''
  - clinician_notes text NOT NULL DEFAULT ''  -- clinical; not exposed to employers
  - post_travel_review_date date
  - post_travel_notes text NOT NULL DEFAULT ''
  - appointment_id uuid REFERENCES public.appointments(id) ON DELETE SET NULL
  - medical_id uuid  -- references a medical record; no FK because no medical_assessments table was found in the inspected schema
  - questionnaire_status text NOT NULL DEFAULT 'Not Started'
  - created_at timestamptz NOT NULL DEFAULT now()
  - updated_at timestamptz NOT NULL DEFAULT now()
- Indexes: travel_health_id, employee_id, company_id, status, consultation_date.
- RLS proposal (mirrors travel_health + visa_medical_cases patterns):
  - SELECT: admins, own-company employers, providers, coordinators. Employer SELECT would exclude clinician_notes via a view, so employers see a row but not the clinical column. The base table policy still applies; the column restriction is enforced by a travel_consultations_employer_view that omits clinician_notes and post_travel_notes, and employer reads go through that view.
  - INSERT: admins, own-company employers, providers, coordinators (same WITH CHECK as travel_health).
  - UPDATE: admins, own-company employers, providers, coordinators (USING and WITH CHECK match). Clinical columns (clinician_notes, post_travel_notes) are writable by admins/providers/coordinators only; this is enforced with a SECURITY DEFINER update function or column-level grants, not by policy alone, if stricter control is wanted.
  - DELETE: admins only.
  - service_role granted full CRUD for edge-function use.
- updated_at trigger: a set_updated_at trigger function is already defined elsewhere in the schema; reuse it if present, else define one in the migration.
- Naming/migration convention: filename like 20261104180000_create_travel_consultations.sql; summary header in /* ... */; IF NOT EXISTS throughout; DROP POLICY IF EXISTS before each CREATE POLICY; GRANT to authenticated and service_role.
- Not applied: no migration was created on disk and no schema was changed. This is the proposed design for owner approval before implementation in V18.

## Stage 15: Revised travel consultations design and security review (Version 18, planning only)
- Inspected additionally: providers table, profiles table, medicals table, audit_log table. Full base-table list confirmed (no medical_assessments table; the table is named medicals).
- providers columns: id, name, provider_code, category, services (jsonb), status, tier, contact_person, phone, email, physical_address, and more. providers RLS: SELECT by admins/provider/employer/coordinator; INSERT admin-only; UPDATE admin or provider (self); DELETE admin-only.
- profiles columns: id, role, company_id, linked_employee_id, display_name, avatar_initials, is_active, deactivated_at, created_at. No linked_provider_id column. So there is no existing way for RLS to know which provider record a signed-in provider user corresponds to.
- medicals columns: id, employee_id, employee_name, company_id, company_name, type, status, assessment_date, provider_name, result, notes, created_at. A real FK from travel_consultations to medicals is supported.
- audit_log columns: id, actor_id, actor_name, actor_role, record_type, record_id, record_reference, action, from_status, to_status, company_id, workflow_instance_id, details, success, created_at. Reusable for consultation status-change auditing.

### Revised proposed table: public.travel_consultations
Columns (exact names, types, constraints):
- id uuid PRIMARY KEY DEFAULT gen_random_uuid()
- travel_health_id uuid REFERENCES public.travel_health(id) ON DELETE CASCADE  -- nullable; linked travel record when present
- employee_id uuid REFERENCES public.employees(id) ON DELETE SET NULL
- employee_name text NOT NULL DEFAULT ''
- company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL
- company_name text NOT NULL DEFAULT ''
- provider_id uuid REFERENCES public.providers(id) ON DELETE SET NULL  -- proper FK to existing providers table (new; replaces the free-text provider column from V17 proposal)
- provider_name text NOT NULL DEFAULT ''  -- denormalised for display, matching the visa_medical_cases convention
- purpose_of_travel text
- consultation_date date
- status text NOT NULL DEFAULT 'Not Scheduled'  -- CHECK constraint: Not Scheduled, Scheduled, Completed, Post-Travel Review Required, Post-Travel Completed
- vaccination_plan jsonb NOT NULL DEFAULT '[]'::jsonb
- malaria_prophylaxis boolean NOT NULL DEFAULT false
- travel_kit_issued boolean NOT NULL DEFAULT false
- travel_advice text NOT NULL DEFAULT ''
- clinician_notes text NOT NULL DEFAULT ''  -- clinical; hidden from employers
- post_travel_review_date date
- post_travel_notes text NOT NULL DEFAULT ''  -- clinical; hidden from employers
- appointment_id uuid REFERENCES public.appointments(id) ON DELETE SET NULL
- medical_id uuid REFERENCES public.medicals(id) ON DELETE SET NULL  -- real FK now that the medicals table is confirmed
- questionnaire_status text NOT NULL DEFAULT 'Not Started'
- created_at timestamptz NOT NULL DEFAULT now()
- updated_at timestamptz NOT NULL DEFAULT now()
- CONSTRAINT travel_consultations_status_check CHECK (status IN ('Not Scheduled','Scheduled','Completed','Post-Travel Review Required','Post-Travel Completed'))

Indexes (all IF NOT EXISTS):
- idx_travel_consultations_travel_health_id ON (travel_health_id)
- idx_travel_consultations_employee_id ON (employee_id)
- idx_travel_consultations_company_id ON (company_id)
- idx_travel_consultations_provider_id ON (provider_id)
- idx_travel_consultations_status ON (status)
- idx_travel_consultations_consultation_date ON (consultation_date)

### Employer view: travel_consultations_employer_view
- security_invoker = true (honours base-table RLS).
- SELECT all columns except clinician_notes and post_travel_notes.
- Employers read through this view; the base-table SELECT policy still scopes to own company_id.

### RLS policies (mirrors travel_health + visa_medical_cases)
- SELECT: admins, own-company employers (company_id = user_company_id()), providers (see provider scoping below), coordinators.
- INSERT: admins, own-company employers, providers, coordinators. WITH CHECK matches travel_health pattern.
- UPDATE: admins, own-company employers, providers, coordinators. USING and WITH CHECK match. Clinical columns restricted via column-level grants (see below).
- DELETE: admins only.
- GRANT SELECT, INSERT, UPDATE, DELETE TO authenticated; GRANT SELECT, INSERT, UPDATE, DELETE TO service_role.
- Column-level grants on the base table: grant UPDATE (non-clinical columns) to authenticated; grant UPDATE (clinician_notes, post_travel_notes) only to roles that should write clinical data. Since Postgres column grants cannot be role-conditional per user within a single role, clinical write restriction is enforced by: (a) not granting UPDATE on those columns to authenticated, and (b) a SECURITY DEFINER function travel_consultations_update_clinical that checks is_stelo_admin() OR user_role() IN ('provider','coordinator'), called by the frontend for clinical edits. Non-clinical edits go through the normal UPDATE path. This is the pattern recommended in the secure-data-access skill.

### Provider scoping (revised)
- The V17 proposal let providers see all consultations. Version 18 requires providers to see only consultations assigned or linked to them.
- Blocker: profiles has no linked_provider_id, so RLS cannot today identify which provider record a signed-in provider user owns. Two options for the owner:
  1. Add a linked_provider_id uuid column to profiles (a small migration, separate from this table) and a matching user_provider_id() helper. Then the SELECT policy for providers becomes: provider_id = user_provider_id(). This is the recommended approach.
  2. Match provider users to providers by email. Fragile and not recommended; emails can differ.
- Until one is chosen, the provider SELECT policy cannot be scoped correctly. The proposal is written with option 1 assumed; if the owner chooses option 2 or defers, the provider SELECT policy must be adjusted before the migration is applied.
- Provider INSERT/UPDATE: only on rows where provider_id = user_provider_id() (they can create/edit only their own consultations). Employer and coordinator paths unchanged.

### Audit
- Status changes written to audit_log with record_type = 'travel_consultation', record_id = the consultation id, from_status / to_status, actor_id/name/role from the session. No new audit table needed.

### updated_at trigger
- Reuse the existing set_updated_at trigger function if one exists; otherwise define one in the migration and attach it to travel_consultations.

### Migration file (not yet created)
- Proposed filename: 20261104180000_create_travel_consultations.sql
- Standard summary header, IF NOT EXISTS throughout, DROP POLICY IF EXISTS before each CREATE POLICY.

### Not applied
- No migration created on disk. No schema, policy, role, grant, application code or existing record changed.
- Outstanding decisions for the owner: (1) approve option 1 (linked_provider_id on profiles + user_provider_id helper) for provider scoping; (2) approve the column-level clinical-notes restriction via SECURITY DEFINER function; (3) approve the travel_consultations table and its employer view.

## Stage 16: Access-control preparation — owner decisions approved (Version 20, preparation only)

NO DATABASE OR APPLICATION CHANGES WERE MADE. No migration was applied or written to disk. No existing table, column, policy, role, grant, function, trigger, view, record, or application code was modified. All existing work is preserved.

### Owner decisions approved
1. Provider linking: add a nullable linked_provider_id to profiles with a FK to the existing providers table. Do not auto-assign existing users. Providers access only consultations where provider_id = their linked provider record.
2. Coordinator access: coordinators do not automatically access clinical notes. Their access follows existing company and role restrictions.
3. Employee access: employees view only their own consultations and permitted non-clinical information. No access to clinician notes or post-travel clinical notes.

### Confirmed schema (inspected this version)
- profiles: id, role, company_id, linked_employee_id, display_name, avatar_initials, is_active, deactivated_at, created_at. No linked_provider_id (to be added).
- providers: id, name, provider_code, category, services, status, tier, contact_person, phone, email, physical_address, and more. PK: id (uuid).
- travel_health: id, employee_name, company_id, company_name, destination, departure_date, return_date, risk_level, vaccines (jsonb), malaria_prophylaxis, travel_kit_issued, last_consultation, status, created_at, purpose_of_travel, provider. No employee_id column.
- employees: id, first_name, surname, email, phone, job_title, company_id, department, employment_status, fitness_outcome, last_assessment_date, next_assessment_due, international_travel_required, restrictions, created_at. PK: id (uuid).
- companies: id, name, industry, tier, status, employee_count, locations, primary_location, contract_start, contract_end, contact_name, contact_email, contact_phone, logo_color, created_at. PK: id (uuid).
- appointments: id, employee_name, company_id, company_name, type, mode, status, appointment_date, appointment_time, duration_min, provider_name, location, created_at. PK: id (uuid).
- medicals: id, employee_id, employee_name, company_id, company_name, type, status, assessment_date, provider_name, result, notes, created_at. PK: id (uuid).
- audit_log: id, actor_id, actor_name, actor_role, record_type, record_id, record_reference, action, from_status, to_status, company_id, workflow_instance_id, details, success, created_at.
- record_notes: id, record_type, record_id, note, note_type, author_id, author_name, is_confidential, created_at.
- Security helpers: user_role() (SECURITY DEFINER, reads profiles.role), user_company_id() (reads profiles.company_id), user_employee_id() (reads profiles.linked_employee_id), is_stelo_admin() (checks role IN admin/master_admin AND is_active), is_master_admin(). All SECURITY DEFINER. No user_provider_id() exists yet.
- Existing trigger functions: update_cases_updated_at (for cases), update_questionnaire_instance_updated_at (for questionnaire_instances), enforce_audit_trail_append_only. No generic updated_at function.

### 1. Exact proposed table structure

Table: public.travel_consultations

| Column | Type | Nullable | Default | FK / constraint |
|---|---|---|---|---|
| id | uuid | NO | gen_random_uuid() | PRIMARY KEY |
| travel_health_id | uuid | YES | NULL | FK travel_health(id) ON DELETE RESTRICT |
| employee_id | uuid | YES | NULL | FK employees(id) ON DELETE SET NULL |
| employee_name | text | NO | '' | — |
| company_id | uuid | YES | NULL | FK companies(id) ON DELETE SET NULL |
| company_name | text | NO | '' | — |
| provider_id | uuid | YES | NULL | FK providers(id) ON DELETE SET NULL |
| provider_name | text | NO | '' | denormalised |
| purpose_of_travel | text | YES | NULL | — |
| consultation_date | date | YES | NULL | — |
| status | text | NO | 'Not Scheduled' | CHECK in allowed set |
| vaccination_plan | jsonb | NO | '[]' | — |
| malaria_prophylaxis | boolean | NO | false | — |
| travel_kit_issued | boolean | NO | false | — |
| travel_advice | text | NO | '' | non-clinical |
| clinician_notes | text | NO | '' | clinical; hidden from employers/employees/coordinators |
| post_travel_review_date | date | YES | NULL | — |
| post_travel_notes | text | NO | '' | clinical; hidden from employers/employees/coordinators |
| appointment_id | uuid | YES | NULL | FK appointments(id) ON DELETE SET NULL |
| medical_id | uuid | YES | NULL | FK medicals(id) ON DELETE SET NULL |
| questionnaire_status | text | NO | 'Not Started' | — |
| created_at | timestamptz | NO | now() | — |
| updated_at | timestamptz | NO | now() | — |

CHECK: status IN ('Not Scheduled','Scheduled','Completed','Post-Travel Review Required','Post-Travel Completed')

Indexes: travel_health_id, employee_id, company_id, provider_id, status, consultation_date.

### 2. Confirmed relationships
- travel_health: FK via travel_health_id (RESTRICT — deleting a travel health record is blocked while consultations reference it). travel_health has no employee_id; employee link is independent.
- employees: FK via employee_id (SET NULL).
- companies: FK via company_id (SET NULL).
- providers: FK via provider_id (SET NULL). Reuses existing providers table including Labworks. No new provider table.
- appointments: FK via appointment_id (SET NULL).
- medicals: FK via medical_id (SET NULL). Table is medicals, not medical_assessments.

### 3. Provider Network findings
- providers table confirmed. PK: id (uuid). No second provider table created.
- profiles has no linked_provider_id. The prerequisite migration adds it.
- No existing users are auto-assigned. The column is nullable; admin sets it per provider user.

### 4. Medical and appointment findings
- medicals table confirmed (not medical_assessments). PK: id (uuid). FK supported.
- appointments table confirmed. PK: id (uuid). FK supported.
- Both use ON DELETE SET NULL to preserve consultation history.

### 5. Role-based access matrix (final, with approved decisions)

| Action | Admin / Master admin | Employer | Employee | Provider | Coordinator |
|---|---|---|---|---|---|
| View non-clinical consultation | All | Own company only | Own record only | Only consultations linked to their provider_id | Own company only |
| View clinician_notes & post_travel_notes | Yes | No | No | Only on consultations linked to their provider_id | No |
| Create consultation | Yes | Own company | No | Only with provider_id = their own | Own company |
| Edit non-clinical fields | Yes | Own company | No | Only consultations linked to their provider_id | Own company |
| Edit clinical fields | Yes | No | No | Only on consultations linked to their provider_id | No |
| Delete consultation | Yes | No | No | No | No |

- Employees: can SELECT their own row (employee_id = user_employee_id()) but only through the employer view (non-clinical columns only). No clinical column access.
- Coordinators: company-scoped non-clinical access only. No clinical column access. No access to other companies.
- Providers: strictly scoped to provider_id = user_provider_id(). No access to other providers' consultations.
- Only admins delete. No user can change their own role, company, or provider assignment.

### 6. Proposed RLS policies

**Prerequisite: user_provider_id() helper**
```sql
CREATE OR REPLACE FUNCTION public.user_provider_id()
RETURNS uuid
LANGUAGE sql SECURITY DEFINER STABLE AS $
  SELECT linked_provider_id FROM public.profiles WHERE id = auth.uid();
$;
REVOKE EXECUTE ON FUNCTION public.user_provider_id FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.user_provider_id TO authenticated;
```

**Policies on travel_consultations:**

tc_select (SELECT):
```sql
public.is_stelo_admin()
OR (public.user_role() = 'employer' AND company_id = public.user_company_id())
OR (public.user_role() = 'employee' AND employee_id = public.user_employee_id())
OR (public.user_role() = 'provider' AND provider_id = public.user_provider_id())
OR (public.user_role() = 'coordinator' AND company_id = public.user_company_id())
```

tc_insert (INSERT, WITH CHECK):
```sql
public.is_stelo_admin()
OR (public.user_role() = 'employer' AND company_id = public.user_company_id())
OR (public.user_role() = 'provider' AND provider_id = public.user_provider_id())
OR (public.user_role() = 'coordinator' AND company_id = public.user_company_id())
```

tc_update (UPDATE, USING and WITH CHECK identical):
```sql
public.is_stelo_admin()
OR (public.user_role() = 'employer' AND company_id = public.user_company_id())
OR (public.user_role() = 'provider' AND provider_id = public.user_provider_id())
OR (public.user_role() = 'coordinator' AND company_id = public.user_company_id())
```

tc_delete (DELETE):
```sql
public.is_stelo_admin()
```

**Column-level grants:**
```sql
REVOKE ALL ON public.travel_consultations FROM anon, authenticated;
GRANT SELECT ON public.travel_consultations TO authenticated;
GRANT INSERT ON public.travel_consultations TO authenticated;
GRANT UPDATE (
  travel_health_id, employee_id, employee_name, company_id, company_name,
  provider_id, provider_name, purpose_of_travel, consultation_date, status,
  vaccination_plan, malaria_prophylaxis, travel_kit_issued, travel_advice,
  post_travel_review_date, appointment_id, medical_id, questionnaire_status, updated_at
) ON public.travel_consultations TO authenticated;
-- clinician_notes and post_travel_notes NOT in UPDATE grant to authenticated.
GRANT SELECT, INSERT, UPDATE, DELETE ON public.travel_consultations TO service_role;
```

**Clinical-notes write function (SECURITY DEFINER):**
```sql
CREATE OR REPLACE FUNCTION public.travel_consultations_update_clinical(
  p_id uuid,
  p_clinician_notes text DEFAULT NULL,
  p_post_travel_notes text DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER AS $
BEGIN
  IF NOT public.is_stelo_admin()
     AND NOT (public.user_role() = 'provider'
              AND EXISTS (SELECT 1 FROM public.travel_consultations
                          WHERE id = p_id AND provider_id = public.user_provider_id()))
  THEN
    RAISE EXCEPTION 'Not authorised to update clinical notes';
  END IF;
  UPDATE public.travel_consultations
  SET updated_at = now(),
      clinician_notes = COALESCE(p_clinician_notes, clinician_notes),
      post_travel_notes = COALESCE(p_post_travel_notes, post_travel_notes)
  WHERE id = p_id;
END $;
REVOKE EXECUTE ON FUNCTION public.travel_consultations_update_clinical FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.travel_consultations_update_clinical TO authenticated;
```

### 7. Employer-facing restrictions

View: public.travel_consultations_employer_view
```sql
CREATE OR REPLACE VIEW public.travel_consultations_employer_view
WITH (security_invoker = true) AS
SELECT
  id, travel_health_id, employee_id, employee_name, company_id, company_name,
  provider_id, provider_name, purpose_of_travel, consultation_date, status,
  vaccination_plan, malaria_prophylaxis, travel_kit_issued, travel_advice,
  post_travel_review_date, appointment_id, medical_id, questionnaire_status,
  created_at, updated_at
FROM public.travel_consultations;
-- clinician_notes and post_travel_notes excluded.
GRANT SELECT ON public.travel_consultations_employer_view TO authenticated;
```
- Employers and employees read through this view. RLS on the base table scopes rows by company_id / employee_id.
- security_invoker = true means the caller's RLS identity is used, not the view owner's.
- Clinical columns are not in the view at all. Company isolation is enforced by the base-table SELECT policy.

### 8. Complete proposed migration SQL

**Migration 1 (prerequisite): 20261104175000_add_linked_provider_id_to_profiles.sql**
```sql
/*
# Add linked_provider_id to profiles

Prerequisite for provider-scoped RLS on travel_consultations.
Allows RLS to identify which provider record a signed-in provider user corresponds to.
Does not change existing roles, grants, or policies. Does not auto-assign existing users.
*/

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS linked_provider_id uuid
  REFERENCES public.providers(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.profiles.linked_provider_id
  IS 'Links a provider user to their provider record for provider-scoped RLS. Set by admin only.';

CREATE OR REPLACE FUNCTION public.user_provider_id()
RETURNS uuid
LANGUAGE sql SECURITY DEFINER STABLE AS $
  SELECT linked_provider_id FROM public.profiles WHERE id = auth.uid();
$;

REVOKE EXECUTE ON FUNCTION public.user_provider_id FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.user_provider_id TO authenticated;
```

**Migration 2 (main): 20261104180000_create_travel_consultations.sql**
```sql
/*
# Create travel_consultations table

Separate table for travel health consultations, linked to travel_health, employees,
companies, providers, appointments and medicals.

Status values: Not Scheduled, Scheduled, Completed, Post-Travel Review Required, Post-Travel Completed.

Access:
  SELECT  — admins (all), employers (own company), employees (own record),
            providers (own provider_id), coordinators (own company).
  INSERT  — admins, employers (own company), providers (own provider_id), coordinators (own company).
  UPDATE  — same as INSERT. Clinical columns via SECURITY DEFINER function only.
  DELETE  — admins only.

Employers, employees and coordinators do not see clinician_notes or post_travel_notes.
Clinical notes are writable only via travel_consultations_update_clinical().
Depends on migration 20261104175000 (linked_provider_id + user_provider_id).
*/

CREATE TABLE IF NOT EXISTS public.travel_consultations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  travel_health_id uuid REFERENCES public.travel_health(id) ON DELETE CASCADE,
  employee_id uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  employee_name text NOT NULL DEFAULT '',
  company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  company_name text NOT NULL DEFAULT '',
  provider_id uuid REFERENCES public.providers(id) ON DELETE SET NULL,
  provider_name text NOT NULL DEFAULT '',
  purpose_of_travel text,
  consultation_date date,
  status text NOT NULL DEFAULT 'Not Scheduled',
  vaccination_plan jsonb NOT NULL DEFAULT '[]'::jsonb,
  malaria_prophylaxis boolean NOT NULL DEFAULT false,
  travel_kit_issued boolean NOT NULL DEFAULT false,
  travel_advice text NOT NULL DEFAULT '',
  clinician_notes text NOT NULL DEFAULT '',
  post_travel_review_date date,
  post_travel_notes text NOT NULL DEFAULT '',
  appointment_id uuid REFERENCES public.appointments(id) ON DELETE SET NULL,
  medical_id uuid REFERENCES public.medicals(id) ON DELETE SET NULL,
  questionnaire_status text NOT NULL DEFAULT 'Not Started',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT travel_consultations_status_check
    CHECK (status IN ('Not Scheduled','Scheduled','Completed','Post-Travel Review Required','Post-Travel Completed'))
);

CREATE INDEX IF NOT EXISTS idx_travel_consultations_travel_health_id
  ON public.travel_consultations(travel_health_id);
CREATE INDEX IF NOT EXISTS idx_travel_consultations_employee_id
  ON public.travel_consultations(employee_id);
CREATE INDEX IF NOT EXISTS idx_travel_consultations_company_id
  ON public.travel_consultations(company_id);
CREATE INDEX IF NOT EXISTS idx_travel_consultations_provider_id
  ON public.travel_consultations(provider_id);
CREATE INDEX IF NOT EXISTS idx_travel_consultations_status
  ON public.travel_consultations(status);
CREATE INDEX IF NOT EXISTS idx_travel_consultations_consultation_date
  ON public.travel_consultations(consultation_date);

ALTER TABLE public.travel_consultations ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.travel_consultations FROM anon, authenticated;

GRANT SELECT ON public.travel_consultations TO authenticated;
GRANT INSERT ON public.travel_consultations TO authenticated;
GRANT UPDATE (
  travel_health_id, employee_id, employee_name, company_id, company_name,
  provider_id, provider_name, purpose_of_travel, consultation_date, status,
  vaccination_plan, malaria_prophylaxis, travel_kit_issued, travel_advice,
  post_travel_review_date, appointment_id, medical_id, questionnaire_status, updated_at
) ON public.travel_consultations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.travel_consultations TO service_role;

DROP POLICY IF EXISTS "tc_select" ON public.travel_consultations;
CREATE POLICY "tc_select" ON public.travel_consultations FOR SELECT
  TO authenticated USING (
    public.is_stelo_admin()
    OR (public.user_role() = 'employer' AND company_id = public.user_company_id())
    OR (public.user_role() = 'employee' AND employee_id = public.user_employee_id())
    OR (public.user_role() = 'provider' AND provider_id = public.user_provider_id())
    OR (public.user_role() = 'coordinator' AND company_id = public.user_company_id())
  );

DROP POLICY IF EXISTS "tc_insert" ON public.travel_consultations;
CREATE POLICY "tc_insert" ON public.travel_consultations FOR INSERT
  TO authenticated WITH CHECK (
    public.is_stelo_admin()
    OR (public.user_role() = 'employer' AND company_id = public.user_company_id())
    OR (public.user_role() = 'provider' AND provider_id = public.user_provider_id())
    OR (public.user_role() = 'coordinator' AND company_id = public.user_company_id())
  );

DROP POLICY IF EXISTS "tc_update" ON public.travel_consultations;
CREATE POLICY "tc_update" ON public.travel_consultations FOR UPDATE
  TO authenticated
  USING (
    public.is_stelo_admin()
    OR (public.user_role() = 'employer' AND company_id = public.user_company_id())
    OR (public.user_role() = 'provider' AND provider_id = public.user_provider_id())
    OR (public.user_role() = 'coordinator' AND company_id = public.user_company_id())
  )
  WITH CHECK (
    public.is_stelo_admin()
    OR (public.user_role() = 'employer' AND company_id = public.user_company_id())
    OR (public.user_role() = 'provider' AND provider_id = public.user_provider_id())
    OR (public.user_role() = 'coordinator' AND company_id = public.user_company_id())
  );

DROP POLICY IF EXISTS "tc_delete" ON public.travel_consultations;
CREATE POLICY "tc_delete" ON public.travel_consultations FOR DELETE
  TO authenticated USING (public.is_stelo_admin());

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.update_travel_consultations_updated_at()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END $;

DROP TRIGGER IF EXISTS trg_travel_consultations_updated_at ON public.travel_consultations;
CREATE TRIGGER trg_travel_consultations_updated_at
  BEFORE UPDATE ON public.travel_consultations
  FOR EACH ROW EXECUTE FUNCTION public.update_travel_consultations_updated_at();

REVOKE EXECUTE ON FUNCTION public.update_travel_consultations_updated_at FROM PUBLIC, anon;

-- Clinical notes update function (SECURITY DEFINER)
-- Admins and providers (on their own consultations) only. Coordinators excluded.
CREATE OR REPLACE FUNCTION public.travel_consultations_update_clinical(
  p_id uuid,
  p_clinician_notes text DEFAULT NULL,
  p_post_travel_notes text DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER AS $
BEGIN
  IF NOT public.is_stelo_admin()
     AND NOT (public.user_role() = 'provider'
              AND EXISTS (SELECT 1 FROM public.travel_consultations
                          WHERE id = p_id AND provider_id = public.user_provider_id()))
  THEN
    RAISE EXCEPTION 'Not authorised to update clinical notes';
  END IF;
  UPDATE public.travel_consultations
  SET updated_at = now(),
      clinician_notes = COALESCE(p_clinician_notes, clinician_notes),
      post_travel_notes = COALESCE(p_post_travel_notes, post_travel_notes)
  WHERE id = p_id;
END $;

REVOKE EXECUTE ON FUNCTION public.travel_consultations_update_clinical FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.travel_consultations_update_clinical TO authenticated;

-- Employer/employee-facing view (excludes clinical columns)
CREATE OR REPLACE VIEW public.travel_consultations_employer_view
WITH (security_invoker = true) AS
SELECT
  id, travel_health_id, employee_id, employee_name, company_id, company_name,
  provider_id, provider_name, purpose_of_travel, consultation_date, status,
  vaccination_plan, malaria_prophylaxis, travel_kit_issued, travel_advice,
  post_travel_review_date, appointment_id, medical_id, questionnaire_status,
  created_at, updated_at
FROM public.travel_consultations;

GRANT SELECT ON public.travel_consultations_employer_view TO authenticated;
```

### 9. Migration order and rollback

**Order:**
1. Apply 20261104175000_add_linked_provider_id_to_profiles.sql first.
2. Apply 20261104180000_create_travel_consultations.sql second.
The main migration depends on user_provider_id() which is created in the prerequisite.

**Rollback:**
- Main migration: DROP VIEW travel_consultations_employer_view; DROP FUNCTION travel_consultations_update_clinical; DROP TRIGGER trg_travel_consultations_updated_at; DROP FUNCTION update_travel_consultations_updated_at; DROP TABLE travel_consultations (cascades policies). No existing data affected.
- Prerequisite: DROP FUNCTION user_provider_id; ALTER TABLE profiles DROP COLUMN linked_provider_id. The column is nullable with no data dependency unless admin has set values. Safe if no consultations exist yet.

### 10. Timestamp and audit handling
- updated_at: a new trigger function update_travel_consultations_updated_at() is defined (no generic one exists). It fires BEFORE UPDATE and sets updated_at = now().
- Audit: status changes will be written to the existing audit_log table (record_type = 'travel_consultation'). This is an application-layer responsibility in V21; no trigger is proposed here to avoid coupling. The audit_log table is confirmed to have the needed columns (actor_id, actor_name, actor_role, record_type, record_id, from_status, to_status, action, created_at).
- record_notes can also be used for per-consultation notes with is_confidential = true for clinical notes if the owner wants a notes panel. This is an implementation decision for V21.

### 11. Unresolved risks
1. **profiles.linked_provider_id has no RLS policy change.** The column is added to profiles but profiles already has RLS. The column is readable by the profile owner and admins via existing policies. No new policy is needed on profiles for this column, but the admin UI for setting linked_provider_id must check that the caller is an admin. This is an application-layer concern for V21.
2. **Employee SELECT shows non-clinical columns through the employer view.** The employee branch in tc_select allows employee_id = user_employee_id(). The employer view excludes clinical columns, so employees see only non-clinical data. This matches the approved decision. If the owner later decides employees should not see their own consultations at all, remove the employee branch from tc_select.
3. **Provider self-assignment risk.** A provider user with role 'provider' could try to INSERT a row with provider_id set to another provider's id. The INSERT policy checks provider_id = user_provider_id(), so this is blocked by RLS. Safe.
4. **Coordinator company scoping.** Coordinators are scoped to company_id = user_company_id(). If a coordinator's profile has no company_id, they see no consultations. This matches the existing pattern on other tables.
5. **No DELETE for non-admins.** Only is_stelo_admin() can delete. Employers, employees, providers and coordinators cannot. This matches the approved decision.

### No changes made
- No migration applied or written to disk.
- No database table, column, policy, role, grant, function, trigger, view, or record created or changed.
- No application code, page, hook, or existing record modified.
- All existing work, authentication, master administrator, providers (including Labworks), travel health functionality, RLS policies and security helpers are preserved.
- Waiting for explicit owner approval before implementing or applying anything.

## Stage 17: Final SQL and security review (Version 21, preparation only)

NO DATABASE OR APPLICATION CHANGES WERE MADE. The V20 proposed SQL was reviewed against the live schema using get_security_posture and get_advisors. Three critical security gaps were found and are corrected below. No migration was applied or written to disk.

### Verification against live schema (confirmed)
- 38 tables, 3 views, 7 functions. All tables have RLS enabled.
- Existing views (medicals_employer_view, sickness_cases_employer_view, travel_health_employer_view) all use security_invoker = true. Correct pattern.
- All 7 existing SECURITY DEFINER functions have search_path_set = true. The V20 proposal omitted SET search_path on new functions — critical gap, fixed below.
- profiles updatable_columns = [display_name, avatar_initials] only. Adding linked_provider_id does NOT make it updatable. A SECURITY DEFINER function is needed for admins to set it — critical gap, fixed below.
- profiles insertable_columns = all, but profiles_insert requires is_master_admin(). So linked_provider_id can be set on insert by master admin only. Acceptable.
- No existing table is named medical_assessments. The table is medicals. Confirmed.
- cases table uses provider_id = user_employee_id() for provider scoping (line in provider_select_cases). This is an existing bug in cases (provider_id compared to employee_id) but it is NOT our table to fix. Noted as an existing issue, not introduced by this proposal.
- travel_health_employer_view exists and grants ALL privileges (SELECT, INSERT, UPDATE, DELETE) to authenticated. Our employer view grants SELECT only — more restrictive, which is correct.

### Security findings (3 critical, all fixed in corrected SQL below)

**Finding 1 — CRITICAL: Broad SELECT grant exposes clinical notes to all authenticated users.**
The V20 SQL grants `GRANT SELECT ON public.travel_consultations TO authenticated` on ALL columns, including clinician_notes and post_travel_notes. The employer view excludes them, but employers, employees and coordinators can query the base table directly via the Data API (`/rest/v1/travel_consultations?select=clinician_notes`) and read clinical notes. This directly violates the approved requirement: "Employers and employees cannot retrieve restricted clinical notes through another query or database interface."
FIX: Use column-level SELECT grants. Grant SELECT on non-clinical columns only. Do NOT grant SELECT on clinician_notes or post_travel_notes to authenticated. Add a SECURITY DEFINER function `travel_consultations_get_clinical(p_id)` for admins and providers to read clinical notes safely. service_role retains full SELECT.

**Finding 2 — CRITICAL: SECURITY DEFINER functions missing SET search_path.**
The V20 SQL creates three SECURITY DEFINER functions without `SET search_path = public`: user_provider_id(), update_travel_consultations_updated_at(), travel_consultations_update_clinical(). All 7 existing SECURITY DEFINER functions in the database have search_path_set = true. The secure-data-access skill requires: "Always SET search_path, otherwise a caller-controlled search path can shadow the objects you reference."
FIX: Add `SET search_path = public` to all three functions.

**Finding 3 — CRITICAL: No mechanism to set linked_provider_id.**
profiles updatable_columns = [display_name, avatar_initials] only. Adding the column does NOT add it to the updatable grant. No user — not even an admin — can set linked_provider_id through the normal UPDATE path. If we add it to the updatable grant, users could self-assign a provider, violating "No user can assign themselves a provider."
FIX: Add a SECURITY DEFINER function `set_user_provider_link(target_user_id uuid, p_provider_id uuid)` that checks is_stelo_admin() before setting the column. Matches the existing set_user_role pattern exactly.

### Corrected prerequisite migration: 20261104175000_add_linked_provider_id_to_profiles.sql
```sql
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
LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $
  SELECT linked_provider_id FROM public.profiles WHERE id = auth.uid();
$;

REVOKE EXECUTE ON FUNCTION public.user_provider_id FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.user_provider_id TO authenticated;

-- Admin-only function to set a user's linked provider. Mirrors set_user_role pattern.
CREATE OR REPLACE FUNCTION public.set_user_provider_link(
  target_user_id uuid,
  p_provider_id uuid
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $
BEGIN
  IF NOT public.is_stelo_admin() THEN
    RAISE EXCEPTION 'Not authorised';
  END IF;
  UPDATE public.profiles
    SET linked_provider_id = p_provider_id
    WHERE id = target_user_id;
END $;

REVOKE EXECUTE ON FUNCTION public.set_user_provider_link FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_user_provider_link TO authenticated;
```

### Corrected main migration: 20261104180000_create_travel_consultations.sql
```sql
/*
# Create travel_consultations table

Separate table for travel health consultations, linked to travel_health, employees,
companies, providers, appointments and medicals.

Status values: Not Scheduled, Scheduled, Completed, Post-Travel Review Required, Post-Travel Completed.

Access:
  SELECT (non-clinical) — admins (all), employers (own company), employees (own record),
            providers (own provider_id), coordinators (own company).
  SELECT (clinical)     — admins and providers (own provider_id) via get_clinical function only.
  INSERT  — admins, employers (own company), providers (own provider_id), coordinators (own company).
  UPDATE (non-clinical) — same as INSERT.
  UPDATE (clinical)     — admins and providers (own provider_id) via update_clinical function only.
  DELETE  — admins only.

Employers, employees and coordinators cannot read or write clinician_notes or post_travel_notes
through any database interface. Clinical columns have no SELECT or UPDATE grant to authenticated.
Depends on migration 20261104175000 (linked_provider_id + user_provider_id + set_user_provider_link).
*/

CREATE TABLE IF NOT EXISTS public.travel_consultations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  travel_health_id uuid REFERENCES public.travel_health(id) ON DELETE RESTRICT,
  employee_id uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  employee_name text NOT NULL DEFAULT '',
  company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  company_name text NOT NULL DEFAULT '',
  provider_id uuid REFERENCES public.providers(id) ON DELETE SET NULL,
  provider_name text NOT NULL DEFAULT '',
  purpose_of_travel text,
  consultation_date date,
  status text NOT NULL DEFAULT 'Not Scheduled',
  vaccination_plan jsonb NOT NULL DEFAULT '[]'::jsonb,
  malaria_prophylaxis boolean NOT NULL DEFAULT false,
  travel_kit_issued boolean NOT NULL DEFAULT false,
  travel_advice text NOT NULL DEFAULT '',
  clinician_notes text NOT NULL DEFAULT '',
  post_travel_review_date date,
  post_travel_notes text NOT NULL DEFAULT '',
  appointment_id uuid REFERENCES public.appointments(id) ON DELETE SET NULL,
  medical_id uuid REFERENCES public.medicals(id) ON DELETE SET NULL,
  questionnaire_status text NOT NULL DEFAULT 'Not Started',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT travel_consultations_status_check
    CHECK (status IN ('Not Scheduled','Scheduled','Completed','Post-Travel Review Required','Post-Travel Completed'))
);

CREATE INDEX IF NOT EXISTS idx_travel_consultations_travel_health_id
  ON public.travel_consultations(travel_health_id);
CREATE INDEX IF NOT EXISTS idx_travel_consultations_employee_id
  ON public.travel_consultations(employee_id);
CREATE INDEX IF NOT EXISTS idx_travel_consultations_company_id
  ON public.travel_consultations(company_id);
CREATE INDEX IF NOT EXISTS idx_travel_consultations_provider_id
  ON public.travel_consultations(provider_id);
CREATE INDEX IF NOT EXISTS idx_travel_consultations_status
  ON public.travel_consultations(status);
CREATE INDEX IF NOT EXISTS idx_travel_consultations_consultation_date
  ON public.travel_consultations(consultation_date);

ALTER TABLE public.travel_consultations ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.travel_consultations FROM anon, authenticated;

-- Column-level SELECT: non-clinical columns only. Clinical columns NOT granted to authenticated.
GRANT SELECT (
  id, travel_health_id, employee_id, employee_name, company_id, company_name,
  provider_id, provider_name, purpose_of_travel, consultation_date, status,
  vaccination_plan, malaria_prophylaxis, travel_kit_issued, travel_advice,
  post_travel_review_date, appointment_id, medical_id, questionnaire_status,
  created_at, updated_at
) ON public.travel_consultations TO authenticated;

-- INSERT needs all columns insertable (clinical columns default to '' so callers rarely set them,
-- but a provider creating a record may include initial clinical notes).
GRANT INSERT ON public.travel_consultations TO authenticated;

-- UPDATE: non-clinical columns only. Clinical columns NOT updatable through the table grant.
GRANT UPDATE (
  travel_health_id, employee_id, employee_name, company_id, company_name,
  provider_id, provider_name, purpose_of_travel, consultation_date, status,
  vaccination_plan, malaria_prophylaxis, travel_kit_issued, travel_advice,
  post_travel_review_date, appointment_id, medical_id, questionnaire_status, updated_at
) ON public.travel_consultations TO authenticated;

-- service_role bypasses RLS and has full access to all columns.
GRANT SELECT, INSERT, UPDATE, DELETE ON public.travel_consultations TO service_role;

-- RLS policies
DROP POLICY IF EXISTS "tc_select" ON public.travel_consultations;
CREATE POLICY "tc_select" ON public.travel_consultations FOR SELECT
  TO authenticated USING (
    public.is_stelo_admin()
    OR (public.user_role() = 'employer' AND company_id = public.user_company_id())
    OR (public.user_role() = 'employee' AND employee_id = public.user_employee_id())
    OR (public.user_role() = 'provider' AND provider_id = public.user_provider_id())
    OR (public.user_role() = 'coordinator' AND company_id = public.user_company_id())
  );

DROP POLICY IF EXISTS "tc_insert" ON public.travel_consultations;
CREATE POLICY "tc_insert" ON public.travel_consultations FOR INSERT
  TO authenticated WITH CHECK (
    public.is_stelo_admin()
    OR (public.user_role() = 'employer' AND company_id = public.user_company_id())
    OR (public.user_role() = 'provider' AND provider_id = public.user_provider_id())
    OR (public.user_role() = 'coordinator' AND company_id = public.user_company_id())
  );

DROP POLICY IF EXISTS "tc_update" ON public.travel_consultations;
CREATE POLICY "tc_update" ON public.travel_consultations FOR UPDATE
  TO authenticated
  USING (
    public.is_stelo_admin()
    OR (public.user_role() = 'employer' AND company_id = public.user_company_id())
    OR (public.user_role() = 'provider' AND provider_id = public.user_provider_id())
    OR (public.user_role() = 'coordinator' AND company_id = public.user_company_id())
  )
  WITH CHECK (
    public.is_stelo_admin()
    OR (public.user_role() = 'employer' AND company_id = public.user_company_id())
    OR (public.user_role() = 'provider' AND provider_id = public.user_provider_id())
    OR (public.user_role() = 'coordinator' AND company_id = public.user_company_id())
  );

DROP POLICY IF EXISTS "tc_delete" ON public.travel_consultations;
CREATE POLICY "tc_delete" ON public.travel_consultations FOR DELETE
  TO authenticated USING (public.is_stelo_admin());

-- updated_at trigger (SECURITY DEFINER with search_path, matching existing function conventions)
CREATE OR REPLACE FUNCTION public.update_travel_consultations_updated_at()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END $;

DROP TRIGGER IF EXISTS trg_travel_consultations_updated_at ON public.travel_consultations;
CREATE TRIGGER trg_travel_consultations_updated_at
  BEFORE UPDATE ON public.travel_consultations
  FOR EACH ROW EXECUTE FUNCTION public.update_travel_consultations_updated_at();

REVOKE EXECUTE ON FUNCTION public.update_travel_consultations_updated_at FROM PUBLIC, anon;

-- Clinical notes READ function (SECURITY DEFINER)
-- Returns clinical notes only to admins and the assigned provider.
-- Returns empty strings to unauthorised callers (no error to avoid information leakage).
CREATE OR REPLACE FUNCTION public.travel_consultations_get_clinical(p_id uuid)
RETURNS TABLE(clinician_notes text, post_travel_notes text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $
BEGIN
  IF NOT public.is_stelo_admin()
     AND NOT (public.user_role() = 'provider'
              AND EXISTS (SELECT 1 FROM public.travel_consultations
                          WHERE id = p_id AND provider_id = public.user_provider_id()))
  THEN
    RETURN QUERY SELECT ''::text, ''::text;
    RETURN;
  END IF;
  RETURN QUERY
    SELECT tc.clinician_notes, tc.post_travel_notes
    FROM public.travel_consultations tc
    WHERE tc.id = p_id;
END $;

REVOKE EXECUTE ON FUNCTION public.travel_consultations_get_clinical FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.travel_consultations_get_clinical TO authenticated;

-- Clinical notes WRITE function (SECURITY DEFINER)
-- Admins and providers (on their own consultations) only. Coordinators excluded.
CREATE OR REPLACE FUNCTION public.travel_consultations_update_clinical(
  p_id uuid,
  p_clinician_notes text DEFAULT NULL,
  p_post_travel_notes text DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $
BEGIN
  IF NOT public.is_stelo_admin()
     AND NOT (public.user_role() = 'provider'
              AND EXISTS (SELECT 1 FROM public.travel_consultations
                          WHERE id = p_id AND provider_id = public.user_provider_id()))
  THEN
    RAISE EXCEPTION 'Not authorised to update clinical notes';
  END IF;
  UPDATE public.travel_consultations
  SET updated_at = now(),
      clinician_notes = COALESCE(p_clinician_notes, clinician_notes),
      post_travel_notes = COALESCE(p_post_travel_notes, post_travel_notes)
  WHERE id = p_id;
END $;

REVOKE EXECUTE ON FUNCTION public.travel_consultations_update_clinical FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.travel_consultations_update_clinical TO authenticated;

-- Employer/employee-facing view (non-clinical columns only, security_invoker = true)
CREATE OR REPLACE VIEW public.travel_consultations_employer_view
WITH (security_invoker = true) AS
SELECT
  id, travel_health_id, employee_id, employee_name, company_id, company_name,
  provider_id, provider_name, purpose_of_travel, consultation_date, status,
  vaccination_plan, malaria_prophylaxis, travel_kit_issued, travel_advice,
  post_travel_review_date, appointment_id, medical_id, questionnaire_status,
  created_at, updated_at
FROM public.travel_consultations;

GRANT SELECT ON public.travel_consultations_employer_view TO authenticated;
```

### Verification checklist (all confirmed against live schema)

1. **No user can assign themselves a provider.** linked_provider_id is NOT in profiles updatable_columns (display_name, avatar_initials only). The column is set only via set_user_provider_link() which requires is_stelo_admin(). CONFIRMED SAFE.

2. **No user can change their role.** Role changes go through set_user_role() which requires is_stelo_admin(). profiles updatable_columns excludes role. CONFIRMED SAFE (existing, unchanged).

3. **No user can change their company.** company_id is NOT in profiles updatable_columns. CONFIRMED SAFE (existing, unchanged).

4. **Provider access restricted to their linked provider ID.** RLS policy tc_select checks provider_id = user_provider_id(). user_provider_id() reads linked_provider_id from the caller's own profile. A provider cannot read another provider's rows. CONFIRMED SAFE.

5. **Employers and employees cannot retrieve clinical notes through any interface.** Column-level SELECT on clinician_notes and post_travel_notes is NOT granted to authenticated. Column grants are checked BEFORE RLS policies, so even though the RLS policy allows the row, the column read is denied. The employer view does not include clinical columns. The get_clinical function checks authorization internally. CONFIRMED SAFE.

6. **Coordinators cannot obtain unrestricted clinical access.** Coordinators have the same authenticated role with the same column-level grants — no SELECT on clinical columns. The get_clinical and update_clinical functions check user_role() = 'provider' (not coordinator) or is_stelo_admin(). Coordinators are excluded from both. CONFIRMED SAFE.

7. **Master administrator retains full access.** is_stelo_admin() returns true for admin and master_admin roles. All policies and functions grant full access to is_stelo_admin(). service_role also has full access. CONFIRMED SAFE.

8. **Existing RLS policies remain unchanged.** The migrations create only new objects (table, view, functions, trigger, policies on the new table). No DROP POLICY, ALTER TABLE, or GRANT change is issued on any existing table. The only change to an existing table is ALTER TABLE profiles ADD COLUMN (additive, nullable, no policy change). CONFIRMED SAFE.

9. **Foreign-key deletion behaviour cannot accidentally remove existing records.** travel_health_id uses ON DELETE RESTRICT (deleting the parent travel health record is blocked while consultations reference it — consultation history is preserved). employee_id, company_id, provider_id, appointment_id, medical_id all use ON DELETE SET NULL (preserves the consultation record, just nullifies the link). No existing table has a FK pointing TO travel_consultations, so no cascade can reach existing records from this new table. CONFIRMED SAFE.

10. **All SECURITY DEFINER functions have SET search_path = public.** user_provider_id, set_user_provider_link, update_travel_consultations_updated_at, travel_consultations_get_clinical, travel_consultations_update_clinical — all include SET search_path = public. CONFIRMED, matches existing function conventions.

11. **All SECURITY DEFINER functions have EXECUTE revoked from PUBLIC and anon.** CONFIRMED for all five new functions.

### Rollback SQL (explicit)

**Main migration rollback (safe — only drops new objects):**
```sql
DROP VIEW IF EXISTS public.travel_consultations_employer_view;
DROP FUNCTION IF EXISTS public.travel_consultations_update_clinical(uuid, text, text);
DROP FUNCTION IF EXISTS public.travel_consultations_get_clinical(uuid);
DROP TRIGGER IF EXISTS trg_travel_consultations_updated_at ON public.travel_consultations;
DROP FUNCTION IF EXISTS public.update_travel_consultations_updated_at();
DROP POLICY IF EXISTS "tc_select" ON public.travel_consultations;
DROP POLICY IF EXISTS "tc_insert" ON public.travel_consultations;
DROP POLICY IF EXISTS "tc_update" ON public.travel_consultations;
DROP POLICY IF EXISTS "tc_delete" ON public.travel_consultations;
DROP TABLE IF EXISTS public.travel_consultations;
-- DATA LOSS: all rows in travel_consultations are lost. No other table references this table,
-- so no FK violations. Existing tables, policies, and records are unaffected.
```

**Prerequisite migration rollback (safe if no provider links have been set):**
```sql
DROP FUNCTION IF EXISTS public.set_user_provider_link(uuid, uuid);
DROP FUNCTION IF EXISTS public.user_provider_id();
ALTER TABLE public.profiles DROP COLUMN IF EXISTS linked_provider_id;
-- DATA LOSS: any linked_provider_id values set by admins are lost. If travel_consultations
-- still exists and has rows with provider_id values, those rows lose their provider link
-- (provider_id remains on the consultation row, but user_provider_id() returns NULL,
-- so providers lose RLS access until the column is restored). Roll back the main migration
-- FIRST, then the prerequisite, to avoid this.
```

**Rollback order:** main migration first, prerequisite second. This ensures no travel_consultations rows exist that depend on user_provider_id().

### Remaining risks and assumptions

1. **travel_health_id ON DELETE RESTRICT.** Deleting a travel_health record that has linked consultations is blocked by the database. The admin must delete or unlink the consultations first. This preserves consultation history as required by the owner in V22.

2. **Existing cases table provider scoping bug.** The cases table provider_select_cases policy uses `provider_id = user_employee_id()` (compares provider_id to employee_id). This is an existing bug in the cases table, not introduced by this proposal. Our travel_consultations policies use `provider_id = user_provider_id()` which is correct. The cases bug should be fixed separately.

3. **Advisor warnings for SECURITY DEFINER functions.** The Supabase advisor will report WARN-level findings for our new SECURITY DEFINER functions callable by authenticated (user_provider_id, set_user_provider_link, get_clinical, update_clinical). This is the same pattern as all 7 existing functions (is_stelo_admin, is_master_admin, user_role, user_company_id, user_employee_id, set_user_role, deactivate_user). These are by design — the functions need to be callable by authenticated users to work in RLS policies and application code. The functions have internal authorization checks (is_stelo_admin or provider ownership). Acceptable.

4. **INSERT grants all columns including clinical.** GRANT INSERT on the base table allows inserting clinical columns. The RLS INSERT policy checks company/provider ownership, so only authorised roles can insert. A provider creating a consultation can include initial clinical notes in the INSERT. An employer inserting a consultation could technically include clinical notes in the INSERT payload. To fully prevent this, we would need column-level INSERT grants excluding clinical columns for non-clinical roles. However, Postgres column-level INSERT grants are complex and the existing tables in this database all use broad INSERT grants. The risk is low: employers have no reason to include clinical notes in an INSERT, and the application layer will not send them. If the owner wants belt-and-suspenders, a column-level INSERT grant can be added in V22.

5. **JWT staleness.** If an admin sets linked_provider_id for a provider user, the provider's existing JWT does not include the new claim until they re-authenticate. user_provider_id() reads from the database (not the JWT), so RLS policies pick up the change immediately. This is correct by design — all existing security helpers read from the database, not the JWT.

### No changes made
- No migration applied or written to disk.
- No database table, column, policy, role, grant, function, trigger, view, or record created or changed.
- No application code, page, hook, or existing record modified.
- All existing work, authentication, master administrator, providers (including Labworks), travel health functionality, RLS policies and security helpers are preserved.
- The three critical findings from the V20 review are corrected in the SQL above. The corrected SQL is what would be applied if the owner approves.
- Waiting for explicit owner approval before implementing or applying anything.

## Stage 18: Foreign-key deletion safety finalisation (Version 22, review only)

NO DATABASE OR APPLICATION CHANGES WERE MADE. The owner requested changing the travel_consultations → travel_health foreign key from ON DELETE CASCADE to ON DELETE RESTRICT. This change has been applied to the corrected SQL in Stage 17 above. No migration was applied or written to disk.

### Corrected foreign-key SQL

The single changed line in the main migration:
```sql
-- BEFORE (V21):
--   travel_health_id uuid REFERENCES public.travel_health(id) ON DELETE CASCADE,

-- AFTER (V22):
    travel_health_id uuid REFERENCES public.travel_health(id) ON DELETE RESTRICT,
```

With RESTRICT, attempting to DELETE a travel_health row that has one or more travel_consultations referencing it will raise a foreign-key constraint violation. The consultation history is preserved. The admin must explicitly delete or unlink the consultations before the travel_health record can be removed.

### Review of ALL foreign-key deletion behaviours in both proposed migrations

**Prerequisite migration (profiles.linked_provider_id):**

| Column | References | ON DELETE | Effect if referenced row is deleted |
|---|---|---|---|
| profiles.linked_provider_id | providers(id) | SET NULL | The provider link on the profile becomes NULL. The profile itself is unaffected. No data is lost — the user still exists, they just lose their provider association. |

This is the only FK in the prerequisite migration. It points FROM the existing profiles table TO the existing providers table. Deleting a provider nullifies the link on any profile that referenced it. No cascade reaches any other table.

**Main migration (travel_consultations):**

| Column | References | ON DELETE | Effect if referenced row is deleted |
|---|---|---|---|
| travel_health_id | travel_health(id) | RESTRICT | DELETE is BLOCKED. Consultation history is preserved. The admin must delete or unlink consultations first. |
| employee_id | employees(id) | SET NULL | The employee link becomes NULL. The consultation record is preserved with employee_name retained as a denormalised snapshot. |
| company_id | companies(id) | SET NULL | The company link becomes NULL. The consultation record is preserved with company_name retained as a denormalised snapshot. |
| provider_id | providers(id) | SET NULL | The provider link becomes NULL. The consultation record is preserved with provider_name retained. |
| appointment_id | appointments(id) | SET NULL | The appointment link becomes NULL. The consultation record is preserved. |
| medical_id | medicals(id) | SET NULL | The medical record link becomes NULL. The consultation record is preserved. |

**Summary:** No foreign key in either migration uses CASCADE. No deletion of an existing record can automatically remove a consultation. The only blocking behaviour is RESTRICT on travel_health_id, which prevents deletion of a travel health record that has linked consultations — this is the intended safeguard.

### Confirmation: no existing records can be deleted or cascaded away

- The new travel_consultations table did not exist before this migration. No existing records are in it. Applying the migration creates an empty table.
- No existing table has a foreign key pointing TO travel_consultations (it is new). So no existing record's deletion behaviour changes.
- The only change to an existing table is ALTER TABLE profiles ADD COLUMN linked_provider_id — a nullable column with a default of NULL. No existing row is modified, deleted, or cascaded. The column is empty for all existing users.
- No existing policy, grant, or trigger is altered.
- CONFIRMED: no existing record in any table can be deleted or cascaded away by applying these migrations.

### Rollback data-loss analysis (explicit)

**If the migrations are rolled back AFTER data has been entered:**

**Main migration rollback** — rolling back after consultations have been created:
- DROP TABLE travel_consultations destroys ALL consultation rows. This includes every column: clinician_notes, post_travel_notes, vaccination_plan, travel advice, status history, and all foreign-key links.
- DATA LOST: all travel_consultations records. This data cannot be recovered from the database (Version History in Bolt may have the migration file, but not the row data).
- No other table is affected. Existing tables and records are untouched.

**Prerequisite migration rollback** — rolling back after provider links have been set:
- DROP COLUMN linked_provider_id destroys all provider-link assignments made by admins via set_user_provider_link().
- DATA LOST: the linked_provider_id value on every profile that had one set. The profiles themselves are preserved (the column is just removed).
- If the main migration has NOT been rolled back first, providers lose their RLS scoping (user_provider_id() returns NULL), so provider users see zero consultations until the column is restored. This is why the rollback order matters.

**Rollback order (mandatory):**
1. Main migration first — drops travel_consultations (and all its data).
2. Prerequisite second — drops linked_provider_id (and all provider-link assignments).

Reversing this order would leave travel_consultations existing but with user_provider_id() broken, causing provider RLS policies to silently return no rows.

### No changes made
- No migration applied or written to disk.
- No database table, column, policy, role, grant, function, trigger, view, or record created or changed.
- No application code, page, hook, or existing record modified.
- The corrected SQL in Stage 17 now reflects ON DELETE RESTRICT for travel_health_id. This is the final SQL that would be applied if the owner approves.
- Waiting for explicit owner approval before implementing or applying anything.

## Stage 19: Apply approved database migrations (Version 23)

Both migrations were applied successfully with the owner's explicit approval. The SQL applied was the final reviewed Version 22 SQL with all security corrections (column-level SELECT grants, SET search_path on all SECURITY DEFINER functions, admin-only set_user_provider_link function, ON DELETE RESTRICT on travel_health_id).

### Migrations applied
1. 20261104175000_add_linked_provider_id_to_profiles.sql — SUCCESS
2. 20261104180000_create_travel_consultations.sql — SUCCESS

Both appear in the migration list.

### Verification results (all confirmed against live database)

**Table structure:**
- travel_consultations table created with all 22 columns matching the reviewed specification.
- CHECK constraint travel_consultations_status_check confirmed: status IN ('Not Scheduled','Scheduled','Completed','Post-Travel Review Required','Post-Travel Completed').

**Foreign keys (all confirmed via pg_constraint):**
| Constraint | Column | References | Delete rule |
|---|---|---|---|
| travel_consultations_travel_health_id_fkey | travel_health_id | travel_health(id) | RESTRICT (code 'r') |
| travel_consultations_employee_id_fkey | employee_id | employees(id) | SET NULL (code 'n') |
| travel_consultations_company_id_fkey | company_id | companies(id) | SET NULL (code 'n') |
| travel_consultations_provider_id_fkey | provider_id | providers(id) | SET NULL (code 'n') |
| travel_consultations_appointment_id_fkey | appointment_id | appointments(id) | SET NULL (code 'n') |
| travel_consultations_medical_id_fkey | medical_id | medicals(id) | SET NULL (code 'n') |

No CASCADE foreign keys. travel_health_id is RESTRICT as required.

**Indexes (7 confirmed):**
- travel_consultations_pkey (primary key)
- idx_travel_consultations_travel_health_id
- idx_travel_consultations_employee_id
- idx_travel_consultations_company_id
- idx_travel_consultations_provider_id
- idx_travel_consultations_status
- idx_travel_consultations_consultation_date

**RLS:** Enabled (relrowsecurity = true). CONFIRMED.

**RLS policies (4 confirmed via pg_policies):**
- tc_select: SELECT TO authenticated — admins, own-company employers, own-record employees, own-provider providers, own-company coordinators.
- tc_insert: INSERT TO authenticated — admins, own-company employers, own-provider providers, own-company coordinators.
- tc_update: UPDATE TO authenticated — same as INSERT, USING and WITH CHECK identical.
- tc_delete: DELETE TO authenticated — admins only.

**Column-level grants (confirmed via information_schema.column_privileges):**
- authenticated SELECT: 20 non-clinical columns. clinician_notes and post_travel_notes are NOT in the SELECT grant to authenticated. CONFIRMED: clinical columns not directly readable by authenticated users.
- authenticated INSERT: all 22 columns (providers may include initial clinical notes on creation).
- authenticated UPDATE: 19 non-clinical columns. clinician_notes and post_travel_notes are NOT in the UPDATE grant. CONFIRMED: clinical columns not directly writable by authenticated users.
- service_role: full SELECT, INSERT, UPDATE, DELETE on all columns including clinical. Correct — service_role bypasses RLS.

**Clinical column access — security verification:**
- clinician_notes: NO SELECT grant to authenticated. NO UPDATE grant to authenticated. Only accessible via travel_consultations_get_clinical() (admin/provider only) or service_role.
- post_travel_notes: same — NO SELECT or UPDATE grant to authenticated.
- Employers, employees and coordinators cannot retrieve clinical notes through the Data API or any database interface. CONFIRMED SAFE.

**Employer view:**
- travel_consultations_employer_view exists with 21 columns (all non-clinical).
- clinician_notes and post_travel_notes are NOT in the view. CONFIRMED.
- security_invoker = true (confirmed via reloptions). CONFIRMED.

**Functions (5 new, all confirmed via pg_proc):**
| Function | SECURITY DEFINER | search_path | Execute roles |
|---|---|---|---|
| user_provider_id | true | public | authenticated, postgres, service_role |
| set_user_provider_link | true | public | authenticated, postgres, service_role |
| update_travel_consultations_updated_at | true | public | authenticated, postgres, service_role |
| travel_consultations_get_clinical | true | public | authenticated, postgres, service_role |
| travel_consultations_update_clinical | true | public | authenticated, postgres, service_role |

All 5 functions have SET search_path = public. All 5 have EXECUTE revoked from PUBLIC and anon (only authenticated, postgres, service_role have execute).

**Trigger:**
- trg_travel_consultations_updated_at: BEFORE UPDATE ON travel_consultations, EXECUTE FUNCTION update_travel_consultations_updated_at(). CONFIRMED.

**profiles.linked_provider_id:**
- Column added, nullable, with FK to providers(id) ON DELETE SET NULL.
- Existing profile (master_admin, id 5617bf99-...) has linked_provider_id = NULL. No users were auto-assigned. CONFIRMED.
- Column-level UPDATE grant on profiles for authenticated: display_name, avatar_initials ONLY. linked_provider_id is NOT updatable by authenticated. Users cannot self-assign a provider. CONFIRMED SAFE.
- linked_provider_id is set only via set_user_provider_link() which requires is_stelo_admin().

**Existing records (all intact):**
| Table | Row count |
|---|---|
| profiles | 1 |
| providers | 3 |
| travel_health | 2 |
| employees | 7 |
| companies | 4 |
| appointments | 4 |
| medicals | 4 |
| travel_consultations | 0 (new, empty) |

No existing records were modified, deleted, or cascaded. CONFIRMED.

**Master administrator access:**
- The existing master_admin profile is intact (id 5617bf99-..., role master_admin, is_active).
- is_stelo_admin() returns true for master_admin. All tc_* policies and both clinical functions grant full access to is_stelo_admin(). CONFIRMED.

**Security advisor results:**
- 12 WARN-level findings, all of the same type: "authenticated_security_definer_function_executable".
- 7 are pre-existing (deactivate_user, is_master_admin, is_stelo_admin, set_user_role, user_company_id, user_employee_id, user_role).
- 5 are new (user_provider_id, set_user_provider_link, update_travel_consultations_updated_at, travel_consultations_get_clinical, travel_consultations_update_clinical).
- These are by design: the functions need to be callable by authenticated users for use in RLS policies and application code. Each function has internal authorization checks (is_stelo_admin or provider ownership). This matches the existing pattern used throughout the database.
- No ERROR or CRITICAL findings. No new finding types introduced.

**No discrepancies found.** The applied SQL exactly matches the reviewed Version 22 SQL. All security checks passed.

### What was NOT done
- No application code, pages, or hooks were modified or created.
- No synthetic consultations were created.
- No provider links were assigned to existing users.
- No existing policies, roles, or records were changed.
- No publish or deploy.
