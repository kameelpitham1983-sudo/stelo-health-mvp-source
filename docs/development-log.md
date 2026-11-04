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
