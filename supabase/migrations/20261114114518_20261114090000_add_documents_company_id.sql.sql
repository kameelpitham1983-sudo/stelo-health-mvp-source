/*
# Add missing company_id column to documents table

The documents table was created without a company_id foreign key column.
The RLS policies and frontend code expect this column to exist.
This migration adds it as a nullable FK to companies.
*/

ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_documents_company_id ON public.documents(company_id);