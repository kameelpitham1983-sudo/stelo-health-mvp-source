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
