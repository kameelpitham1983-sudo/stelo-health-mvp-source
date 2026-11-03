/*
# Add expiry_date column to documents table

Documents in an occupational health platform often have expiry dates (e.g. compliance certificates, vaccination records, fitness certificates). This migration adds an optional expiry_date column to the documents table so the UI can track and flag expiring/expired documents.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'documents' AND column_name = 'expiry_date'
  ) THEN
    ALTER TABLE documents ADD COLUMN expiry_date date;
  END IF;
END $$;