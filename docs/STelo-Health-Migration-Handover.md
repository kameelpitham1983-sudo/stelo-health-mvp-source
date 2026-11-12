# STelo Health — Migration and Handover Document

**Date:** 12 November 2026  
**Status:** Documentation and preservation task. No application, database, or configuration changes were made.

---

## 1. Application Preservation

### Application structure

The STelo Health MVP is a Vite + React + TypeScript single-page application using Tailwind CSS and Lucide React icons. Supabase provides the backend (database, auth, edge functions).

**Source layout:**
- `src/App.tsx` — root component with page routing
- `src/context/AppContext.tsx` — auth state, page navigation, onboarding flow
- `src/pages/` — 27 page components covering the full workflow
- `src/pages/dashboards/` — 6 role-specific dashboard components
- `src/components/` — 16 shared UI components (Badge, Layout, Sidebar, Topbar, NotesPanel, etc.)
- `src/hooks/useSupabaseData.ts` — all database hooks (companies, employees, medicals, appointments, travel health, documents, certificates, etc.)
- `src/lib/` — permissions, demo records, supabase client, workflow logic
- `src/data/mockData.ts` — demo data used when the database is not configured
- `src/types.ts` — all TypeScript interfaces
- `supabase/migrations/` — 44 migration files (only 5 currently applied)
- `supabase/functions/invite-user/index.ts` — edge function for user invitations

**Completed modules (demo-functional):**
- Companies: list, search, add/edit, detail with contract status, stats, metrics, notes
- Employees: list, search, filter by company/status, add/edit, detail with health/compliance, medical records
- Medicals: list, search, filter, add/edit, detail with clinical outcomes, fitness update, questionnaire workflow
- Appointments: list, search, filter, add/edit, detail, conflict detection, cancel
- Travel Health: records list, consultation creation and management (database-backed when configured)
- Documents: list, search, filter, upload, verification
- Digital Certificates: issue, revoke, suspend, reactivate, QR code, digital card display
- Sickness Absence: case management, risk assessments
- Synopsis: AI-generated summaries, meeting notes, follow-ups
- Case Management: central case list and detail
- Visa Medicals: case tracking
- Providers: provider directory
- GOPs: guarantee of payment management
- Accommodation: hotel bookings
- Reports, Audit Log, Learning Centre, Settings, SteloAI
- Onboarding and Screening: guided workflows
- Medical Assessment: demo-mode workflow (no database table, by design)

### GitHub repository

**Verified fact:** This Bolt workspace is not a git repository. There is no GitHub remote, no branch, and no commit history. Bolt saves file changes automatically through its own versioning system. Any git operations attempted in this environment are blocked.

**Item needing confirmation:** Whether a separate GitHub repository exists outside Bolt that mirrors this project. If one exists, its URL and branch need to be confirmed by the owner.

### Latest development changes

The most recent application change was **Stage 21 (Version 25)** — company profile enhancements:
- Contract status indicator on company list cards and detail header (Active, Expiring soon, Expired, Upcoming)
- 4-card stats row on company detail: Tracked Employees, Completed Medicals, Compliance Rate, Fit for Duty
- Contract end date colouring (red when expired, amber when expiring soon)

Prior to that, **Stage 20 (Version 24)** integrated the travel consultations workflow with the database (new hook, rewritten Travel Health page, grant fix migration).

### Working tree and push status

**Verified fact:** There is no git working tree and no push capability in this environment. Bolt's Version History (clock icon in the header) is the version control mechanism. All changes are saved automatically by Bolt.

---

## 2. Original Database Identity

### Confirmed Supabase project

- **Project reference:** `bewndqxrmvhwngnszmdb`
- **Project URL:** `https://bewndqxrmvhwngnszmdb.supabase.co`

These were verified via the Supabase MCP tools on 12 November 2026.

### Applied migrations (5 only)

1. `20261021173019_create_companies_and_employees.sql`
2. `20261021173050_create_core_health_tables.sql`
3. `20261103125614_company_links.sql`
4. `20261103125623_add_document_expiry_date.sql`
5. `20261104175032_add_travel_health_purpose_and_provider.sql`

### Current database tables (12, all empty — 0 rows)

| Table | RLS | Rows |
|---|---|---|
| companies | Enabled | 0 |
| employees | Enabled | 0 |
| medicals | Enabled | 0 |
| appointments | Enabled | 0 |
| travel_health | Enabled | 0 |
| documents | Enabled | 0 |
| activity_events | Enabled | 0 |
| sickness_absence_cases | Enabled | 0 |
| sickness_risk_assessments | Enabled | 0 |
| synopses | Enabled | 0 |
| synopsis_meeting_notes | Enabled | 0 |
| synopsis_follow_ups | Enabled | 0 |

**Auth users:** 0.

### Missing migrations and schema components

The development log (Stages 1–20) documents extensive work that was previously applied to the database but is **no longer present**. The database was reset at some point, losing all migrations after the first 5. The following tables, functions, views, and triggers exist in migration files on disk but are **not in the database**:

**Missing tables (27):** profiles, providers, gops, gop_invoices, gop_audit_entries, hotels, hotel_bookings, questionnaire_templates, questionnaire_instances, questionnaire_audit_entries, workflow_definitions, workflow_steps, workflow_instances, workflow_step_instances, workflow_audit_trail, record_notes, digital_certificates, notifications, audit_log, document_versions, cases, case_activity, visa_medical_cases, visa_medical_audit_entries, onboarding_cases, screening_records, travel_consultations.

**Missing functions (16):** is_stelo_admin, user_role, user_company_id, user_employee_id, is_master_admin, set_user_role, deactivate_user, user_provider_id, set_user_provider_link, handle_new_user, update_questionnaire_instance_updated_at, update_cases_updated_at, enforce_audit_trail_append_only, update_travel_consultations_updated_at, travel_consultations_get_clinical, travel_consultations_update_clinical.

**Missing triggers (3):** on_auth_user_created, trg_qi_updated_at, trg_travel_consultations_updated_at.

**Missing views (4):** medicals_employer_view, travel_health_employer_view, sickness_cases_employer_view, travel_consultations_employer_view.

### Current RLS/security findings

All 12 tables have RLS enabled but only open policies (`USING (true)` / `WITH CHECK (true)`) granting full CRUD to both `anon` and `authenticated`. No helper functions exist. No role-based policies. This is a wide-open state with no access control.

### Database backup status

**Item needing confirmation:** A verified database backup has not been confirmed by the owner. The development log records that the backup was requested but never confirmed as completed. All tables are empty (0 rows, 0 auth users), so there is no user data at risk — only the schema, which is reproducible from the migration files.

### Outstanding migration prerequisites

Before the 15+ pending canonical migrations can be applied:
1. **A verified database backup must exist** (owner action via Supabase dashboard).
2. The pending migrations must be applied in dependency order (profiles and helper functions first, then tables, then RLS policies, then open-policy removal).
3. The `harden_auth` migration must not be applied until the first administrator is established.
4. A first master administrator must be created after the profiles table and auth trigger exist.

---

## 3. Environment Configuration

### Required environment variables

The application requires two environment variables to connect to Supabase:

- `VITE_SUPABASE_URL` — the Supabase project URL
- `VITE_SUPABASE_ANON_KEY` — the Supabase anonymous (public) key

These are read in `src/lib/supabase.ts`. When either is missing, the app runs in demo mode with in-memory sample data.

**No actual API keys, passwords, or secrets are documented here.** The owner must set these in the new workspace's environment.

---

## 4. Development Handover

### Company Management — Completed (Version 25)
- List, search, add, edit, detail view with contract status indicators
- 4-card stats overview (Tracked Employees, Completed Medicals, Compliance Rate, Fit for Duty)
- Key metrics, primary location, primary contact, assessment summary
- Notes panel, cross-navigation to employees/medicals/appointments
- Database-backed when configured; demo mode with sample data otherwise

### Employee Management — Completed
- List, search, filter by company and status, add, edit
- Detail view with contact info, health and compliance, medical records
- Cross-navigation to medicals, appointments, documents
- Fitness status updates when medical assessments are completed
- Database-backed when configured; demo mode otherwise

### Appointment Scheduling — Completed
- List, search, filter by status and date range, add, edit, cancel
- Conflict detection (provider and employee double-booking)
- Detail view with linked medical assessments
- Upcoming/all views toggle

### Medical Assessment — Demo Mode (by design)
- **No medical_assessments database table exists or should be created** (per owner instruction)
- Medical assessments remain in Demo Mode using in-memory demo records
- The Medicals page (existing `medicals` table) handles medical records and clinical outcomes
- The Medical Assessment page uses `src/data/medicalAssessmentDemoRecords.ts` and `src/hooks/useMedicalAssessments.ts`
- This is intentional and must not be changed

### Clinical Outcomes and Certificate Generator — Completed
- Medicals page supports fitness outcome entry (Fit, Fit with Restrictions, Unfit, Pending)
- Outcomes update employee health status automatically
- Digital Certificates page issues, revokes, suspends, and reactivates certificates
- Certificate types: Fitness, Membership Card, Medical Alert Card
- QR code generation and digital card visual display
- Database-backed when configured; demo mode otherwise

### Other existing modules
- **Travel Health:** database-backed consultations (travel_consultations table — currently missing from DB, will work after migrations are applied)
- **Sickness Absence:** case management with risk assessments (database-backed)
- **Synopsis:** AI-generated summaries with meeting notes and follow-ups
- **Case Management:** central case list and detail view
- **Visa Medicals:** case tracking
- **Providers:** provider directory
- **GOPs:** guarantee of payment management
- **Accommodation:** hotel bookings
- **Documents:** upload, verification, expiry tracking
- **Reports, Audit Log, Learning Centre, Settings, SteloAI**
- **Onboarding and Screening:** guided workflows with stage panels
- **Role-based dashboards:** Admin, Coordinator, Employer, Provider, Employee, Lab

### Outstanding work
1. Apply pending database migrations (after backup confirmation)
2. Create first master administrator
3. Wire Travel Health consultation creation to the database (the hook exists but the table is missing from the current DB)
4. Browser-based end-to-end testing (no browser available in this environment)
5. Confirm whether a GitHub repository exists outside Bolt

---

## 5. Future Migration Instructions

To import this project into another Bolt account and reconnect it to the same Supabase project:

### Step 1: Export the current project
- Use Bolt's Version History (clock icon in the header) to identify the latest version
- Download or export the project files if Bolt provides an export option
- Alternatively, if a GitHub repository exists, clone it (confirm with owner first)

### Step 2: Import into the new Bolt account
- Create a new Bolt project
- Import the project files (or connect the GitHub repository if one exists)
- Verify the file structure matches: `src/`, `supabase/`, `docs/`, `package.json`, `vite.config.ts`, `tailwind.config.js`, `tsconfig.json`

### Step 3: Reconnect to the original Supabase project
- In the new Bolt workspace, set the environment variables:
  - `VITE_SUPABASE_URL` = `https://bewndqxrmvhwngnszmdb.supabase.co`
  - `VITE_SUPABASE_ANON_KEY` = (the anon key from the original Supabase project dashboard)
- **Do NOT create a new Supabase project** — use the existing one
- **Do NOT use Bolt's "Change Database" feature** — it may create a new project
- The Supabase project reference is `bewndqxrmvhwngnszmdb`

### Step 4: Verify the connection
- The app should load in demo mode initially (database tables are empty)
- Sign-in should connect to the original Supabase auth
- Once migrations are applied, data should persist to the original database

### Step 5: Apply pending migrations (after backup)
- Create a verified backup of the Supabase database first (Database → Backups in the Supabase dashboard)
- Apply the pending canonical migrations in dependency order using the Supabase MCP tools or Supabase dashboard
- Create the first master administrator after the profiles table exists
- Do not apply the `harden_auth` migration until the first admin is established

### Critical warnings
- The new workspace must NOT create another database
- The new workspace must NOT overwrite the original application
- The new workspace must NOT apply migrations until a backup is verified
- The new workspace must NOT change the Supabase project connection

---

## 6. Documentation Files

### Created
- `docs/STelo-Health-Migration-Handover.md` (this file)

### Updated
- `docs/development-log.md` — Stage 22 entry added below

### Existing (unchanged)
- `docs/STelo_Health_Original_Process_Flow_Requirements.md`
- `docs/pending-migrations/` — contains migration files for future application

---

## 7. Git Status

**Verified fact:** This workspace is not a git repository. There is no working tree, no branch, no remote, and no commits. Bolt manages versioning through its own Version History system. Nothing has been committed or pushed because git is not available in this environment.

---

## 8. Outstanding Items Summary

| Item | Status | Action required |
|---|---|---|
| Database backup | Not confirmed | Owner must create and verify a backup via Supabase dashboard |
| Pending migrations | On hold | Apply after backup is confirmed |
| First master administrator | Not created | Create after profiles table exists |
| GitHub repository | Unknown | Owner to confirm if one exists outside Bolt |
| Browser testing | Not possible | No browser in this environment |
| Travel Health consultation wiring | Hook ready, table missing | Works after migrations are applied |

---

*This document distinguishes verified facts (confirmed via tools or inspection) from items needing confirmation (clearly labelled). No application functionality, database schemas, records, RLS, authentication, roles, permissions, or environment variables were modified.*
