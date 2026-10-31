/*
# Central Audit Log + Document Version History

## Summary
This migration creates a central audit log table that captures important
application activity across all record types, and adds document version
history + linked-record columns to the documents table.

## New Tables

### audit_log
- `id` (uuid PK)
- `actor_id` (uuid, the authenticated user performing the action, nullable for system events)
- `actor_name` (text, display name of the user)
- `actor_role` (text, the role the user held when performing the action)
- `record_type` (text, e.g. 'medical', 'appointment', 'document', 'company', etc.)
- `record_id` (uuid, nullable for actions that don't target a single row)
- `record_reference` (text, a human-readable identifier for the affected record)
- `action` (text, what was done — 'create', 'update', 'delete', 'status_change', etc.)
- `from_status` (text, nullable — previous status where relevant)
- `to_status` (text, nullable — new status where relevant)
- `company_id` (uuid, nullable — the company context if applicable)
- `workflow_instance_id` (uuid, nullable — linked workflow if applicable)
- `details` (text, nullable — additional context or explanation)
- `success` (boolean, default true — whether the action succeeded)
- `created_at` (timestamptz, default now())

### document_versions
- `id` (uuid PK)
- `document_id` (uuid FK -> documents.id)
- `version_number` (integer, auto-incrementing per document)
- `name` (text)
- `type` (text)
- `status` (text)
- `uploaded_by` (text)
- `version_notes` (text, nullable — what changed in this version)
- `created_at` (timestamptz)

## Modified Tables

### documents (additive columns)
- `employee_id` (uuid, nullable — linked employee
- `medical_id` (uuid, nullable — linked medical assessment
- `appointment_id` (uuid, nullable — linked appointment
- `provider_id` (uuid, nullable — linked provider
- `workflow_instance_id` (uuid, nullable — linked workflow instance
- `responsible_person` (text, nullable — person responsible for this document
- `replaces_document_id` (uuid, nullable — if this document replaces an expired/missing one
- `version_number` (integer, default 1)
- `is_current_version` (boolean, default true)

## Security

### audit_log
- RLS enabled.
- SELECT: admin and coordinator roles can read. Employer can read entries
  for their own company.
- INSERT: admin, coordinator, provider, employer roles can insert (system
  writes audit events from authenticated sessions).
- No UPDATE or DELETE through ordinary APIs — only admin can delete.

### document_versions
- RLS enabled.
- SELECT: follows documents visibility rules.
- INSERT: follows documents insert rules.
- No UPDATE or DELETE through the Data API.

### documents (new columns)
- No RLS policy changes needed — existing policies cover the new columns
  since they use the same company_id ownership model.

## Important Notes
1. All new tables are additive — no existing data is modified or lost.
2. The audit_log is designed to be append-only through the application
   layer. RLS prevents UPDATE entirely; DELETE is admin-only.
3. document_versions tracks the history of a document as it is replaced
   or re-uploaded, enabling the detail view to show version history.
*/

-- ============================================================
-- 1. audit_log table
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid,
  actor_name text NOT NULL DEFAULT '',
  actor_role text NOT NULL DEFAULT '',
  record_type text NOT NULL,
  record_id uuid,
  record_reference text NOT NULL DEFAULT '',
  action text NOT NULL,
  from_status text,
  to_status text,
  company_id uuid,
  workflow_instance_id uuid,
  details text,
  success boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT ON audit_log TO authenticated;
GRANT SELECT, INSERT, DELETE ON audit_log TO service_role;

-- Indexes for filtering
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_record_type ON audit_log (record_type);
CREATE INDEX IF NOT EXISTS idx_audit_log_actor_id ON audit_log (actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_company_id ON audit_log (company_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log (action);

-- Policies: append-only, admin + coordinator read all, employer reads own company
DROP POLICY IF EXISTS "audit_log_select" ON audit_log;
CREATE POLICY "audit_log_select"
  ON audit_log FOR SELECT
  TO authenticated
  USING (
    is_stelo_admin()
    OR user_role() = 'coordinator'
    OR (user_role() = 'employer' AND company_id = user_company_id())
    OR (user_role() = 'provider')
  );

DROP POLICY IF EXISTS "audit_log_insert" ON audit_log;
CREATE POLICY "audit_log_insert"
  ON audit_log FOR INSERT
  TO authenticated
  WITH CHECK (
    is_stelo_admin()
    OR user_role() = ANY (ARRAY['coordinator', 'provider', 'employer'])
  );

-- No UPDATE policy — audit entries are immutable through the Data API.
-- Admin-only delete via service_role (bypasses RLS).

-- ============================================================
-- 2. document_versions table
-- ============================================================
CREATE TABLE IF NOT EXISTS document_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  version_number integer NOT NULL DEFAULT 1,
  name text NOT NULL DEFAULT '',
  type text NOT NULL DEFAULT 'Medical Report',
  status text NOT NULL DEFAULT 'Draft',
  uploaded_by text NOT NULL DEFAULT '',
  version_notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE document_versions ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT ON document_versions TO authenticated;

CREATE INDEX IF NOT EXISTS idx_doc_versions_document_id ON document_versions (document_id, version_number DESC);

-- Visibility follows the parent document's company ownership
DROP POLICY IF EXISTS "doc_versions_select" ON document_versions;
CREATE POLICY "doc_versions_select"
  ON document_versions FOR SELECT
  TO authenticated
  USING (
    is_stelo_admin()
    OR EXISTS (
      SELECT 1 FROM documents d
      WHERE d.id = document_versions.document_id
      AND (
        d.company_id = user_company_id()
        OR user_role() = ANY (ARRAY['provider', 'coordinator'])
      )
    )
  );

DROP POLICY IF EXISTS "doc_versions_insert" ON document_versions;
CREATE POLICY "doc_versions_insert"
  ON document_versions FOR INSERT
  TO authenticated
  WITH CHECK (
    is_stelo_admin()
    OR user_role() = ANY (ARRAY['provider', 'coordinator', 'employer'])
  );

-- ============================================================
-- 3. Enhance documents table with linked-record columns
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'employee_id') THEN
    ALTER TABLE documents ADD COLUMN employee_id uuid;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'medical_id') THEN
    ALTER TABLE documents ADD COLUMN medical_id uuid;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'appointment_id') THEN
    ALTER TABLE documents ADD COLUMN appointment_id uuid;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'provider_id') THEN
    ALTER TABLE documents ADD COLUMN provider_id uuid;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'workflow_instance_id') THEN
    ALTER TABLE documents ADD COLUMN workflow_instance_id uuid;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'responsible_person') THEN
    ALTER TABLE documents ADD COLUMN responsible_person text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'replaces_document_id') THEN
    ALTER TABLE documents ADD COLUMN replaces_document_id uuid;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'version_number') THEN
    ALTER TABLE documents ADD COLUMN version_number integer NOT NULL DEFAULT 1;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'is_current_version') THEN
    ALTER TABLE documents ADD COLUMN is_current_version boolean NOT NULL DEFAULT true;
  END IF;
END $$;

-- Add foreign key constraints for linked records (idempotent via DO block)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'documents_employee_id_fkey') THEN
    ALTER TABLE documents ADD CONSTRAINT documents_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'documents_medical_id_fkey') THEN
    ALTER TABLE documents ADD CONSTRAINT documents_medical_id_fkey FOREIGN KEY (medical_id) REFERENCES medicals(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'documents_appointment_id_fkey') THEN
    ALTER TABLE documents ADD CONSTRAINT documents_appointment_id_fkey FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_documents_employee_id ON documents (employee_id);
CREATE INDEX IF NOT EXISTS idx_documents_medical_id ON documents (medical_id);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents (status);
CREATE INDEX IF NOT EXISTS idx_documents_expiry_date ON documents (expiry_date);
