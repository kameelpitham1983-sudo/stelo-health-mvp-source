/*
# Central Audit Log + Document Version History

Creates audit_log table (append-only, admin+coordinator read, authenticated insert)
and document_versions table for version history. Adds linked-record columns to documents.
*/

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

CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_record_type ON audit_log (record_type);
CREATE INDEX IF NOT EXISTS idx_audit_log_actor_id ON audit_log (actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_company_id ON audit_log (company_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log (action);

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