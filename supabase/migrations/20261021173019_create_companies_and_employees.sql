
-- Companies table
CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  industry text NOT NULL DEFAULT '',
  tier text NOT NULL DEFAULT 'SMB',
  status text NOT NULL DEFAULT 'Onboarding',
  employee_count integer NOT NULL DEFAULT 0,
  locations integer NOT NULL DEFAULT 1,
  primary_location text NOT NULL DEFAULT '',
  contract_start date,
  contract_end date,
  contact_name text NOT NULL DEFAULT '',
  contact_email text NOT NULL DEFAULT '',
  contact_phone text NOT NULL DEFAULT '',
  logo_color text NOT NULL DEFAULT 'brand',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "company_select_all" ON companies;
CREATE POLICY "company_select_all" ON companies FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "company_insert_all" ON companies;
CREATE POLICY "company_insert_all" ON companies FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "company_update_all" ON companies;
CREATE POLICY "company_update_all" ON companies FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "company_delete_all" ON companies;
CREATE POLICY "company_delete_all" ON companies FOR DELETE TO anon, authenticated USING (true);

-- Employees table
CREATE TABLE IF NOT EXISTS employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL DEFAULT '',
  surname text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  job_title text NOT NULL DEFAULT '',
  company_id uuid REFERENCES companies(id) ON DELETE SET NULL,
  department text NOT NULL DEFAULT '',
  employment_status text NOT NULL DEFAULT 'Active',
  fitness_outcome text NOT NULL DEFAULT 'Pending Assessment',
  last_assessment_date date,
  next_assessment_due date,
  international_travel_required boolean NOT NULL DEFAULT false,
  restrictions text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "employee_select_all" ON employees;
CREATE POLICY "employee_select_all" ON employees FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "employee_insert_all" ON employees;
CREATE POLICY "employee_insert_all" ON employees FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "employee_update_all" ON employees;
CREATE POLICY "employee_update_all" ON employees FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "employee_delete_all" ON employees;
CREATE POLICY "employee_delete_all" ON employees FOR DELETE TO anon, authenticated USING (true);
