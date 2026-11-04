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
- Not connected to the database: providers, GOPs, hotels, hotel bookings, travel health and visa medicals. Their seeded records will not appear in those screens until they are wired to the database.
- Outstanding: wiring those modules, and a full functional test once an account exists.

## Stage 5: Summary
- Database migrations applied and verified: onboarding cases, screening records.
- Changes to application code: none.
- Outstanding decisions: create the first master administrator; approve wiring the disconnected modules to the database.
