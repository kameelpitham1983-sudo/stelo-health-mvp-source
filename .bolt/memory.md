# Project memory

## Product intent & audience

- Travel health / occupational health platform managing employee travel consultations.
- Multi-role system: admin, provider, employer, employee, authenticated, anon, service_role.
- Clinical notes restricted to admin/provider; employer/employee see non-clinical data only.

## Brand personality & voice

- Professional healthcare application; tone is precise, security-conscious, audit-oriented.
- Development log maintained with versioned stage entries (currently V24 / Stage 20).

## Visual design & UX direction

- Vite + React with JSX, Tailwind CSS, Lucide React icons; `@/` path alias to `src/`.
- Travel Health page uses two-tab layout; searchable/filterable consultation list; detail view with inline edit and confirmation dialogs for destructive actions.
- "New Consultation" form links to real employees, travel health records, and providers from DB.
- No additional UI/icon packages unless explicitly requested.

## Decisions, constraints & rationale

- Supabase/PostgreSQL backend with RLS policies, column-level grants, `security_invoker=true` views.
- DELETE grant on `travel_consultations` added to `authenticated`; RLS still gates to admin-only — safe because policy is the real gate.
- Excess `anon` grants on employer view revoked; only `authenticated` SELECT remains.
- Clinical notes read/written via server-side RPC functions, not direct table access — enforces role separation at the function level.
- SECURITY DEFINER functions use internal auth checks; security advisor flags these (12 warnings) as expected/false-positives.
- Data hook `useTravelConsultations` centralizes CRUD lifecycle and RPC calls for notes.
- No browser available in environment; verification via build success + DB inspection only.

## Open questions & assumptions

- End-to-end UI testing unverified (no browser); workflows confirmed by build + schema/grant inspection.
- Whether additional pages/modules beyond Travel Health exist in the broader app is not yet established.